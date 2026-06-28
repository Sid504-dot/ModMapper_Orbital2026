const supabase = require('./supabase');
const qnaEligibilityDB = require('./qnaEligibilty');
const prereqTreeDB = require('./prereqTree');

async function fetchModules(moduleData, userId) {
    const moduleArray = moduleData.map(row => row.module_code);
    const { data, error } = await supabase
        .from('modules')
        .select('module_code, module_name, description, prereq_tree')
        .in('module_code', moduleArray);
    
    if (error) {
        throw new Error(`Error fetching modules: ${error.message}`, { cause: error });
    }

    const moduleMap = new Map(data.map(m => [m.module_code, m]));

    return Promise.all(moduleData.map(async row => {
    const module = moduleMap.get(row.module_code);
    if (!module) return null;
    const missing = await prereqTreeDB.missingPrereq(userId, row.module_code);
    return {
        module_code: module.module_code,
        title: module.module_name,
        description: module.description,
        eligibility_status: missing.length === 0 ? 'eligible' : 'needs_prereq',
    };
    })).then(rows => rows.filter(Boolean));
}

module.exports = {
    fetchModules
}