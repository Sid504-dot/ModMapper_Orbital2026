const nusmods = require('./nusmods');
const modulesDB = require('../db/modules');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function processEachModule(module, existingMap) {
    const existingModule = existingMap.get(module.moduleCode);
    const moduleCode = module.moduleCode;
    const title = module.title;
    const fullData = await nusmods.moduleGetData(module.moduleCode);
    const semesterData = fullData.semesterData;
    const description = module.description;        
    const prereqTree = module.prereqTree;          
    const preclusion = module.preclusion;          
    const fulReq = module.fulfillRequirements;     
    const cachedAt = new Date().toISOString();

    if (existingModule) {
        if (existingModule.module_name !== title || JSON.stringify(existingModule.semesters) !== JSON.stringify(semesterData)) {
            await modulesDB.upsertModule({
                module_code: moduleCode,
                module_name: title,
                semesters: semesterData,
                cached_at: cachedAt,
                is_su_eligible: fullData.attributes?.su ?? null,
                description: description,
                prereq_tree: prereqTree,
                preclusion: preclusion,
                fulfill_requirements: fulReq
            });
            console.log(`Updated module: ${moduleCode}`);
        } else {
            await modulesDB.upsertModule({
                module_code: moduleCode,
                module_name: existingModule.module_name,
                semesters: existingModule.semesters,
                cached_at: cachedAt,
                is_su_eligible: fullData.attributes?.su ?? null,
                description: description,
                prereq_tree: prereqTree,
                preclusion: preclusion,
                fulfill_requirements: fulReq
            });
            console.log(`Updated cache timestamp for module: ${moduleCode}`);
        }} else {
        await modulesDB.upsertModule({
            module_code: moduleCode,
            module_name: title,
            semesters: semesterData,
            cached_at: cachedAt,
            is_su_eligible: fullData.attributes?.su ?? null,
            description: description,
            prereq_tree: prereqTree,
            preclusion: preclusion,
            fulfill_requirements: fulReq
        });
        console.log(`Inserted new module: ${moduleCode}`);
    }
}

async function refreshModules() {
    try {
        const allModules = await nusmods.getAllModules();
        const existingModules = await modulesDB.getAllModules();
        
        const existingMap = new Map(existingModules.data.map(module => [module.module_code, module]));
        let count = 0;
        let moduleArray = [];
        for (const module of allModules) {
            if (count === 10) {
                await Promise.all(moduleArray.map((m) => processEachModule(m, existingMap)
                    .catch(error => console.error(`Failed: ${m.moduleCode}`, error))));
                await delay(1000);
                moduleArray = [];
                count = 0;
            }
            moduleArray.push(module);
            count++;
        }
        await Promise.all(moduleArray.map((m) => processEachModule(m, existingMap)
            .catch(error => console.error(`Failed: ${m.moduleCode}`, error))));
        await delay(1000);
    } catch (error) {
        console.error('Error refreshing modules:', error);
    }
    console.log('Module refresh complete');
}

module.exports = {
    refreshModules
};
        




