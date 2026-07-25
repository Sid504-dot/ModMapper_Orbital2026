import * as nusmods from './nusmods';
import * as modulesDB from '../db/modules';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processEachModule(module: any, existingMap: Map<string, any>) {
    const existingModule = existingMap.get(module.moduleCode);
    const moduleCode = module.moduleCode;
    const title = module.title;
    const fullData = await nusmods.moduleGetData(module.moduleCode);
    const semesterData = fullData.semesterData;
    const description = fullData.description;
    const prereqTree = fullData.prereqTree;
    const preclusion = fullData.preclusion;
    const fulReq = fullData.fulfillRequirements;
    const moduleCredit = fullData.moduleCredit == null ? null : Number(fullData.moduleCredit);
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
                fulfill_requirements: fulReq,
                module_credit: moduleCredit,
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
                fulfill_requirements: fulReq,
                module_credit: moduleCredit,
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
            fulfill_requirements: fulReq,
            module_credit: moduleCredit,
        });
        console.log(`Inserted new module: ${moduleCode}`);
    }
}

export async function refreshModules() {
    const failedModules: string[] = [];

    try {
        const allModules = await nusmods.getAllModules();
        const existingModules = await modulesDB.getAllModules();
        const existingMap = new Map((existingModules.data ?? []).map((module: any) => [module.module_code, module]));

        let count = 0;
        let moduleArray: any[] = [];

        const runBatch = async (batch: any[]) => {
            const results = await Promise.allSettled(batch.map((m) => processEachModule(m, existingMap)));
            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    console.error(`Failed: ${batch[i].moduleCode}`, result.reason);
                    failedModules.push(batch[i].moduleCode);
                }
            });
        };

        for (const module of allModules) {
            if (count === 10) {
                await runBatch(moduleArray);
                await delay(1000);
                moduleArray = [];
                count = 0;
            }
            moduleArray.push(module);
            count++;
        }
        await runBatch(moduleArray);

    } catch (error) {
        console.error('Error refreshing modules:', error);
    }

    console.log(failedModules.length > 0
        ? `Module refresh finished with ${failedModules.length} failures: ${failedModules.join(', ')}`
        : 'Module refresh complete: all modules succeeded');
}

        




