import supabase from './supabase';

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

export async function getRulebookForUser (userID: string) {
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
            liveGroupIds: new Set(),
            prereqDAG: new Map(),
            groups: [],
            groupModules: new Map(),
            programmeTypes: new Map()
        };
    }

    const { data: programmes, error: programmeTypeError } = await supabase
        .from('programmes')
        .select('id, type')
        .in('id', programmeIds);

    if (programmeTypeError) {
        throw new Error(`Error fetching programme types: ${programmeTypeError.message}`, { cause: programmeTypeError });
    }

    const programmeTypes = new Map(
        programmes.map(p => [p.id, p.type])
    );

    const { data: groups, error: groupError } = await supabase
        .from('requirement_groups')
        .select('id, kind, n, units_required, programme_id, label')
        .in('programme_id', programmeIds);

    if (groupError) {
        throw new Error(`Error fetching requirement groups: ${groupError.message}`, { cause: groupError });
    }

    const liveGroupIds = new Set(groups.map(g => g.id));
    const groupIdArray = [...liveGroupIds];

    if (groupIdArray.length === 0) {
        return {
            liveGroupIds,
            prereqDAG: new Map(),
            groups,
            groupModules: new Map(),
            programmeTypes
        };
    }

    const { data: groupModuleRows, error: groupModuleError } = await supabase
        .from('requirement_group_modules')
        .select('group_id, module_code')
        .in('group_id', groupIdArray);

    if (groupModuleError) {
        throw new Error(`Error fetching requirement group modules: ${groupModuleError.message}`, { cause: groupModuleError });
    }

    const groupModules = new Map();

    for (const row of groupModuleRows) {
        if (!groupModules.has(row.group_id)) {
            groupModules.set(row.group_id, []);
        }

        groupModules.get(row.group_id).push(row.module_code);
    }

    const moduleCodes = [
        ...new Set(groupModuleRows.map(m => m.module_code))
    ];

    if (moduleCodes.length === 0) {
        return {
            liveGroupIds,
            prereqDAG: new Map(),
            groups,
            groupModules,
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

    const prereqDAG = new Map(
        modules.map(m => [
            m.module_code,
            m.prereq_tree
        ])
    );

    return {
        liveGroupIds,
        prereqDAG,
        groups,
        groupModules,
        programmeTypes
    };
}


