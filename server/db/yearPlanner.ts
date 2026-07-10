import supabase from './supabase';
import { RuleBook, Group, YearPlan, YearPlanSems } from '../types/ruleBookYearPlanner';
import { PrereqTree } from '../types/prereq';
import { eligibleSuggestions } from '../domain/yearPlanner/eligibleSuggestions';
import { rerankAndRationale, RerankedModule } from '../services/rerank';
import { planInsights } from '../domain/yearPlanner/planInsights';
import { PlanInsights } from '../types/planInsights';

export async function getAllProgrammes() {
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

    const insertRows = programmesID.map(x => ({ user_id: userID, programme_id: x }));

    const { error } = await supabase
        .from('user_programmes')
        .upsert(insertRows, { onConflict: 'user_id, programme_id' });

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

export async function getRulebookForUser(userID: string): Promise<RuleBook> {
    if (!userID) {
        throw new Error('No content passed');
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
            descriptions: new Map<string, string>(),
            unitsByCode: new Map<string, number>()
        };
    }

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
            descriptions: new Map<string, string>(),
            unitsByCode: new Map<string, number>()
        };
    }

    const { data: groupModuleRows, error: groupModuleError } = await supabase
        .from('requirement_group_modules')
        .select('group_id, module_code')
        .in('group_id', groupIdArray);

    if (groupModuleError) {
        throw new Error(`Error fetching requirement group modules: ${groupModuleError.message}`, { cause: groupModuleError });
    }

    const groupModules = new Map<number, string[]>();

    for (const row of groupModuleRows) {
        if (!groupModules.has(row.group_id)) {
            groupModules.set(row.group_id, []);
        }

        groupModules.get(row.group_id)!.push(row.module_code);
    }

    const moduleCodes = [
        ...new Set(groupModuleRows.map(row => row.module_code))
    ];

    if (moduleCodes.length === 0) {
        return {
            liveGroupIds,
            prereqDAG: new Map<string, PrereqTree>(),
            groups: typedGroups,
            groupModules,
            descriptions: new Map<string, string>(),
            unitsByCode: new Map<string, number>()
        };
    }

    const { data: modules, error: moduleError } = await supabase
        .from('modules')
        .select('module_code, prereq_tree, description, module_credit')
        .in('module_code', moduleCodes);

    if (moduleError) {
        throw new Error(`Error fetching module prerequisites: ${moduleError.message}`, { cause: moduleError });
    }

    const prereqDAG = new Map<string, PrereqTree>(
        modules.map(module => [
            module.module_code,
            module.prereq_tree as PrereqTree
        ])
    );

    const descriptions = new Map<string, string>(
        modules.map(module => [
            module.module_code,
            module.description ?? ''
        ])
    );

    const unitsByCode = new Map<string, number>(
        modules.map(module => [
            module.module_code,
            module.module_credit ?? 4
        ])
    );

    return {
        liveGroupIds,
        prereqDAG,
        groups: typedGroups,
        groupModules,
        descriptions,
        unitsByCode
    };
}

export async function getPlan(userID: string): Promise<YearPlan[]> {
    const { data, error } = await supabase
        .from('year_plan')
        .select('module_code, sem_index, placed_for_group_id')
        .eq('user_id', userID);

    if (error) {
        throw new Error(`Error fetching year plan: ${error.message}`, { cause: error });
    }

    return (data ?? []) as YearPlan[];
}

export async function placeModule(userID: string, moduleCode: string, semIndex: number, groupId: number | null): Promise<boolean> {
    const { error } = await supabase
        .from('year_plan')
        .upsert({
            user_id: userID,
            module_code: moduleCode,
            sem_index: semIndex,
            placed_for_group_id: groupId
        }, { onConflict: 'user_id,module_code' });

    if (error) {
        throw new Error(`Error placing module: ${error.message}`, { cause: error });
    }

    return true;
}

export async function removeModule(userID: string, module_code: string): Promise<boolean> {
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

export async function clearPlan(userID: string): Promise<boolean> {
    const { error } = await supabase
        .from('year_plan')
        .delete()
        .eq('user_id', userID);

    if (error) {
        throw new Error(`Error clearing plan: ${error.message}`, { cause: error });
    }

    return true;
}

export async function getSemBudgets(userID: string): Promise<YearPlanSems[]> {
    const { data, error } = await supabase
        .from('year_plan_sems')
        .select('sem_index, max_units')
        .eq('user_id', userID);

    if (error) {
        throw new Error(`Error fetching sem and max units for that user: ${error.message}`, { cause: error });
    }

    return (data ?? []) as YearPlanSems[];
}

export async function setSemUnits(userID: string, semIndex: number, maxUnits: number): Promise<boolean> {
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


export async function suggestForSlot(
    groupId: number,
    semIndex: number,
    plan: YearPlan[],
    rulebook: RuleBook,
    interest: string
): Promise<{
    required: string[];
    ranked: RerankedModule[];
    others: string[];
}> {

    const {
        groupKind,
        eligible
    } = eligibleSuggestions(
        groupId,
        semIndex,
        plan,
        rulebook
    );

    if (groupKind === 'ALL_OF') {
        return {
            required: eligible,
            ranked: [],
            others: []
        };
    }

    if (interest.trim() === '') {
        return {
            required: [],
            ranked: [],
            others: eligible
        };
    }

    const candidates = eligible.map(code => ({
        module_code: code,
        description: rulebook.descriptions.get(code) ?? ''
    }));

    const ranked = await rerankAndRationale(
        interest,
        candidates
    );

    const rankedCodes = new Set(
        ranked.map(r => r.code)
    );

    const others = eligible.filter(code =>
        !rankedCodes.has(code)
    );

    return {
        required: [],
        ranked,
        others
    };
}

export async function getUserInterest(userID: string): Promise<string> {
    if (!userID) {
        throw new Error('No content passed');
    }

    const { data, error } = await supabase
        .from('user_profile')
        .select('interest')
        .eq('user_id', userID)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching user interest: ${error.message}`, { cause: error });
    }

    return data?.interest ?? '';
}

export async function buildPlanView(userID: string): Promise<{
    plan: Array<YearPlan & { orphaned: boolean }>;
    budgets: YearPlanSems[];
    insights: PlanInsights;
}> {
    const [plan, budgets, rulebook] = await Promise.all([
        getPlan(userID),
        getSemBudgets(userID),
        getRulebookForUser(userID)
    ]);

    const planWithFlags = plan.map(row => ({
        ...row,
        orphaned:
            row.placed_for_group_id !== null &&
            !rulebook.liveGroupIds.has(row.placed_for_group_id)
    }));

    const insights = planInsights(
        plan,
        budgets,
        rulebook
    );

    return {
        plan: planWithFlags,
        budgets,
        insights
    };
}