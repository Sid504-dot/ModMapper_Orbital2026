const supabase = require('./supabase');

async function checkPrereq(moduleCode, prereqModule) {
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

    const tree = data.prereq_tree;

    if(!tree) {
        return false;
    }

    if (tree.or) {
        return tree.or.some(x =>
            x?.nOf
                ? n0f(x, prereqModule)
                : matches(prereqModule, x)
        );
    }

    if (tree.and) {
        return tree.and.some(group =>
            group.or?.some(x =>
                x?.nOf
                    ? n0f(x, prereqModule)
                    : matches(prereqModule, x)
            )
        );
    }

    return false;
}

function n0f(node, moduleCode) {
    const [, modules] = node.nOf;

    return modules.some(m => matches(moduleCode, m));
}


function matches(prereq, candidate) {
    if (typeof candidate !== 'string') {
        return false;
    }

    const clean = candidate.replace(':D', '');

    if (clean.endsWith('%')) {
        return prereq.startsWith(clean.slice(0, -1));
    }

    return clean === prereq;
}

async function numPrereq (moduleCode) {
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

    const tree = data.prereq_tree;

    if (!tree) {
        return 0;
    }
    if (tree.or) {
        return 1;
    }
    else {
        let count = 0;
        for (const temp of tree.and) {
            count++;
        }
        return count;
    }
    
}

async function checkPreclusion (moduleCode, precModule) {
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

async function fulfillReq (moduleCode) {
    const { data, error } = await supabase
        .from('modules')
        .select('fulfill_requirements')
        .eq('module_code', moduleCode)

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }
    
    return data;
}


async function UserPrereqTree(userId) {
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

    const prereqMap = {};
    for (const row of moduleData) {
        prereqMap[row.module_code] = row.prereq_tree;
    }

    const ans = {};

    for (const moduleCode of moduleCodes) {
        ans[moduleCode] = [];

        const tree = prereqMap[moduleCode];

        if (!tree) {
            continue;
        }

        for (const prereqModule of moduleCodes) {
            let found = false;

            if (tree.or) {
                found = tree.or.some(x =>
                    x?.nOf
                        ? n0f(x, prereqModule)
                        : matches(prereqModule, x)
                );
            } else if (tree.and) {
                found = tree.and.some(group =>
                    group.or?.some(x =>
                        x?.nOf
                            ? n0f(x, prereqModule)
                            : matches(prereqModule, x)
                    )
                );
            }

            if (found) {
                ans[moduleCode].push(prereqModule);
            }
        }
    }

    return ans;
}




async function getPrereqModuleCodes(moduleCode) {
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

    const tree = data.prereq_tree;
    let ans = {};

    const extract = x => {
        if (x?.nOf) {
            return x;
        }

        return (
            x.match(/[A-Z]{2,4}\d{4}[A-Z]{0,3}%?/)?.[0]
            ?? null
        );
    };

    if (!tree) {
        return ans;
    }

    if (tree.or) {
        ans[1] = tree.or
            .map(extract)
            .filter(Boolean);
    } else {
        let count = 1;

        for (const group of tree.and) {
            ans[count] = group.or
                .map(extract)
                .filter(Boolean);

            count++;
        }
    }

    return ans;
}

async function missingPrereq(userId, moduleCode) {
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

    const ans = [];

    for (const group of Object.values(need)) {
        let satisfied = false;
        const missing = [];

        for (const t of group) {

            if (t?.nOf) {
                const [required, modules] = t.nOf;

                const completed = modules.filter(m =>
                    taken.some(mod => matches(mod, m))
                ).length;

                if (completed >= required) {
                    satisfied = true;
                    break;
                }

                const remaining = modules
                    .filter(m =>
                        !taken.some(mod => matches(mod, m))
                    )
                    .map(m => m.replace(':D', ''));

                missing.push({
                    need: required - completed,
                    choices: remaining
                });

                continue;
            }

            if (taken.some(mod => matches(mod, t))) {
                satisfied = true;
                break;
            }

            missing.push(t);
        }

        if (!satisfied) {
            ans.push(missing);
        }
    }

    return ans;
}

async function getPreclusions (moduleCode) {
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

async function fulfilledPreclusionsSoCantTakeMod (userId, moduleCode) {
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


async function updatePlanModules(moduleCodes, userId, status) {
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

async function deletePlannedModule(userId, moduleCode) {
    
    const {error} = await supabase
        .from('plan_modules')
        .delete()
        .eq('user_id', userId)
        .eq('module_code', moduleCode)
    
    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }  
}

async function isModulePlanned (userId, moduleCode) {
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

module.exports = {
    checkPrereq,
    numPrereq,
    checkPreclusion,
    fulfillReq,
    UserPrereqTree,
    getPrereqModuleCodes,
    missingPrereq,
    getPreclusions,
    fulfilledPreclusionsSoCantTakeMod,
    updatePlanModules,
    isModulePlanned,
    matches,
    n0f

}