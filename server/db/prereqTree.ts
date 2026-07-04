import { PrereqTree } from '../types/prereq';
import { checkPrereq as checkPrereqTree } from '../domain/prereq/checkPrereq';
import supabase from './supabase';
import { countPrereq } from '../domain/prereq/countPrereq';
import { buildUserPrereqTree } from '../domain/prereq/buildUserPrereqTree';
import { getPrereqModules } from '../domain/prereq/getPrereqModuleCodes';
import { anyMissingPrereq } from '../domain/prereq/anyMissingPrereq';

export async function checkPrereq(moduleCode: string, prereqModule: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('prereq_tree')
        .eq('module_code', moduleCode)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    if (!data) {
        return false;
    }

    const tree = data.prereq_tree as PrereqTree;

    if(!tree) {
        return false;
    }

    return checkPrereqTree(tree, prereqModule);
}



export async function numPrereq (moduleCode: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('prereq_tree')
        .eq('module_code', moduleCode)
        .maybeSingle();
    
    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }
    
    if (!data) {
        return 0;
    }

    const tree = data.prereq_tree as PrereqTree;

    return countPrereq(tree);
    
}

export async function checkPreclusion (moduleCode: string, precModule: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('preclusion')
        .eq('module_code', moduleCode)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    return data?.preclusion?.includes(precModule) ?? false;
}

export async function fulfillReq (moduleCode: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('fulfill_requirements')
        .eq('module_code', moduleCode)

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }
    
    return data;
}


export async function UserPrereqTree(userId: string) {
    const { data: takenModules, error } = await supabase
        .from('plan_modules')
        .select('module_code')
        .eq('user_id', userId)
        .eq('status', 'taken');

    if (error) {
        throw new Error(`Error fetching taken modules: ${error.message}`);
    }

    const moduleCodes = takenModules.map(x => x.module_code);

    if (moduleCodes.length === 0) {
        return {};
    }

    const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('module_code, prereq_tree')
        .in('module_code', moduleCodes);

    if (moduleError) {
        throw new Error(`Error fetching prerequisite trees: ${moduleError.message}`);
    }

    const prereqMap: Record<string, any> = {};
    for (const row of moduleData) {
        prereqMap[row.module_code] = row.prereq_tree;
    }

    return buildUserPrereqTree(moduleCodes, prereqMap);
}




export async function getPrereqModuleCodes(moduleCode: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('prereq_tree')
        .eq('module_code', moduleCode)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    if (!data) {
        return {};
    }

    const tree = data.prereq_tree as PrereqTree;
    return getPrereqModules(tree);
}

export async function missingPrereq(userId: string, moduleCode: string) {
    const { data, error } = await supabase
        .from('plan_modules')
        .select('module_code')
        .eq('user_id', userId)
        .eq('status', 'taken');

    if (error) {
        throw new Error(`Error fetching taken modules: ${error.message}`);
    }

    const taken = data.map(x => x.module_code);
    const need = await getPrereqModuleCodes(moduleCode);

    return anyMissingPrereq(need, taken);
}

export async function getPreclusions (moduleCode: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('preclusion')
        .eq('module_code', moduleCode)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    return data?.preclusion ?? null;
}

export async function fulfilledPreclusionsSoCantTakeMod (userId: string, moduleCode: string) {
    const { data, error } = await supabase
        .from('plan_modules')
        .select()
        .eq('user_id', userId)
        .eq('status', 'taken')

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }
    
    const p = await getPreclusions(moduleCode);

    if (!p) {
        return "";
    }

    for (const { module_code : module } of data) {
        if(p.includes(module)) {
            return module;
        }
    }

    return "";
}


export async function updatePlanModules(moduleCodes: string[], userId: string, status: string) {
    const rows = moduleCodes.map(moduleCode => ({
        user_id: userId,
        module_code: moduleCode,
        status
    }));

    const { error } = await supabase
        .from('plan_modules')
        .upsert(rows, {onConflict: 'user_id,module_code'});

    if (error) {
        throw new Error(`Error updating plan modules: ${error.message}`);
    }
}

export async function deletePlannedModule(userId: string, moduleCode: string) {
    
    const {error} = await supabase
        .from('plan_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module_code', moduleCode)
    
    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }  
}

export async function isModulePlanned (userId: string, moduleCode: string) {
    const { data, error } = await supabase
        .from('plan_modules')
        .select('status')
        .eq('user_id', userId)
        .eq('module_code', moduleCode)
        .maybeSingle();

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }  

     if (!data) {
        return false;
    }

    return data.status === 'planned';
}

