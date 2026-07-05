import supabase from './supabase';
import { RuleBook, Group, ProgrammeType, YearPlan, YearPlanSems} from '../types/ruleBookYearPlanner';
import { PrereqTree } from '../types/prereq';

export async function getAllProgrammes () {
    const { data, error } = await supabase
        .from('programmes')
        .select('*');
    
    if (error) {
        throw new Error(`Error fetching programmes: ${error.message}`, { cause: error });
    }

    return data;
}


export async function upsertProgrammes(userID: string, programmesID: Array<number>) {
    
    if (!userID || !programmesID) {
        throw new Error(`No content passed`);
    }

    const insertRows = programmesID.map(x => ({user_id: userID , programme_id: x}));
    
    const { data, error } = await supabase
        .from('user_programmes')
        .upsert(insertRows, {onConflict: 'user_id, programme_id'});

    if (error) {
        throw new Error(`Error saving user programmes: ${error.message}`, { cause: error });
    }
        
}

export async function deleteProgrammes(userID: string, programmeID: number) {
    
    if (!userID || !programmeID) {
        throw new Error(`No content passed`);
    }

    const { error } = await supabase
        .from('user_programmes')
        .delete()
        .eq('user_id', userID)
        .eq('programme_id', programmeID);
    
    if (error) {
        throw new Error(`Error deleting user programmes: ${error.message}`, { cause: error });
    }

}

export async function getRulebookForUser (userID: string) : Promise<RuleBook> {
    if (!userID) {
        throw new Error(`No content passed`);
    }

    const { data: userProgrammes, error: programmeError } = await supabase
        .from('user_programmes')
        .select('programme_id')
        .eq('user_id', userID);

    if (programmeError) {
        throw new Error(`Error fetching user programmes: ${programmeError.message}`, { cause: programmeError });
    }

    const programmeIds = userProgrammes.map(p => p.programme_id);

    if (programmeIds.length === 0) {
        return {
            liveGroupIds: new Set<number>(),
            prereqDAG: new Map<string, PrereqTree>(),
            groups: [],
            groupModules: new Map<number, string[]>(),
            spanByCode: new Map<string, number>(),
            programmeTypes: new Map<number, ProgrammeType>()
        };
    }

    const { data: programmes, error: programmeTypeError } = await supabase
        .from('programmes')
        .select('id, type')
        .in('id', programmeIds);

    if (programmeTypeError) {
        throw new Error(`Error fetching programme types: ${programmeTypeError.message}`, { cause: programmeTypeError });
    }

    const programmeTypes = new Map<number, ProgrammeType>(
        programmes.map(p => [p.id, p.type as ProgrammeType])
    );

    const { data: groups, error: groupError } = await supabase
        .from('requirement_groups')
        .select('id, kind, n, units_required, programme_id, label')
        .in('programme_id', programmeIds);

    if (groupError) {
        throw new Error(`Error fetching requirement groups: ${groupError.message}`, { cause: groupError });
    }

    const typedGroups = groups as Group[];

    const liveGroupIds = new Set<number>(typedGroups.map(g => g.id));
    const groupIdArray = [...liveGroupIds];

    if (groupIdArray.length === 0) {
        return {
            liveGroupIds,
            prereqDAG: new Map<string, PrereqTree>(),
            groups: typedGroups,
            groupModules: new Map<number, string[]>(),
            spanByCode: new Map<string, number>(),
            programmeTypes
        };
    }

    const { data: groupModuleRows, error: groupModuleError } = await supabase
        .from('requirement_group_modules')
        .select('group_id, module_code, span_semesters')
        .in('group_id', groupIdArray);

    if (groupModuleError) {
        throw new Error(`Error fetching requirement group modules: ${groupModuleError.message}`, { cause: groupModuleError });
    }

    const groupModules = new Map<number, string[]>();
    const spanByCode = new Map<string, number>();

    for (const row of groupModuleRows) {
        if (!groupModules.has(row.group_id)) {
            groupModules.set(row.group_id, []);
        }

        groupModules.get(row.group_id)!.push(row.module_code);

        const span = row.span_semesters ?? 1;
        const existing = spanByCode.get(row.module_code) ?? 1;
        spanByCode.set(row.module_code, Math.max(existing, span));
    }

    const moduleCodes = [
        ...new Set(groupModuleRows.map(m => m.module_code))
    ];

    if (moduleCodes.length === 0) {
        return {
            liveGroupIds,
            prereqDAG: new Map<string, PrereqTree>(),
            groups: typedGroups,
            groupModules,
            spanByCode,
            programmeTypes
        };
    }

    const { data: modules, error: moduleError } = await supabase
        .from('modules')
        .select('module_code, prereq_tree')
        .in('module_code', moduleCodes);

    if (moduleError) {
        throw new Error(`Error fetching module prerequisites: ${moduleError.message}`, { cause: moduleError });
    }

    const prereqDAG = new Map<string, PrereqTree>(
        modules.map(m => [
            m.module_code,
            m.prereq_tree as PrereqTree
        ])
    );

    return {
        liveGroupIds,
        prereqDAG,
        groups: typedGroups,
        groupModules,
        spanByCode,
        programmeTypes
    };
}


export async function getPlan (userID: string) : Promise<YearPlan[]> {
    const { data, error } = await supabase
        .from('year_plan')
        .select('module_code, sem_index, placed_for_group_id, pinned')
        .eq('user_id', userID);

    if (error) {
        throw new Error(`Error fetching year plan: ${error.message}`, { cause: error });
    }

    return (data ?? []) as YearPlan[];
}

export async function placeModule(userID: string, moduleCode: string, semIndex: number, groupId: number | null) : Promise<boolean> {
    const { error } = await supabase
        .from('year_plan')
        .upsert({
            user_id: userID,
            module_code: moduleCode,
            sem_index: semIndex,
            placed_for_group_id: groupId,
            pinned: true
        }, { onConflict: 'user_id,module_code' });

    if (error) {
        throw new Error(`Error placing module: ${error.message}`, { cause: error });
    }

    return true;
}

export async function removeModule(userID: string, module_code: string) : Promise<boolean> {
    const { error } = await supabase
        .from('year_plan')
        .delete()
        .eq('user_id', userID)
        .eq('module_code', module_code);

    if (error) {
        throw new Error(`Error removing module: ${error.message}`, { cause: error });
    }

    return true;
}

export async function clearPlan(userID: string) : Promise<boolean> {
    const { error } = await supabase
        .from('year_plan')
        .delete()
        .eq('user_id', userID)

    if (error) {
        throw new Error(`Error clearing plan: ${error.message}`, { cause: error });
    }

    return true;
}

export async function getSemBudgets(userID: string) : Promise<YearPlanSems[]> {
    const { data, error } = await supabase
        .from('year_plan_sems')
        .select('sem_index, max_units')
        .eq('user_id', userID );

    if (error) {
        throw new Error(`Error fetching sem and max units for that user: ${error.message}`, { cause: error });
    }

    return (data ?? []) as YearPlanSems[];
}

export async function setSemUnits(userID: string, semIndex: number, maxUnits: number) : Promise<boolean> {
    const { error } = await supabase
        .from('year_plan_sems')
        .upsert({
            user_id: userID,
            sem_index: semIndex,
            max_units: maxUnits
        }, { onConflict: 'user_id,sem_index' });

    if (error) {
        throw new Error(`Error placing module: ${error.message}`, { cause: error });
    }

    return true;

}

export async function suggestForSlot(semIndex: number, plan: YearPlan, rulebook: RuleBook, semBudgets: number, interest: string) {
    let count = 0;

    for (const i of rulebook.spanByCode) {
        if (i[1] >= semBudgets) {
            count++;
        }
    }

    if (count == 0) {
        
    }
}
