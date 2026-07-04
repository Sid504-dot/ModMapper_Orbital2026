import express, { Request, Response } from 'express';
const router = express.Router();
import * as modulesDB from '../db/modules';
import * as nusmodsService from '../services/nusmods';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);


router.get('/', async (req: Request, res: Response) => {
    
    const moduleCode = req.query.module_code;

    if (typeof moduleCode !== 'string' || moduleCode.trim() === '') {
        return res.status(400).json({ error: 'module_code query parameter is required' });
    }

    const b = moduleCode;
    const { data } = await modulesDB.getModuleByCode(b);
    
    if (!data || data.length === 0) {
        try {
            
            const newData = await nusmodsService.moduleGetData(b);
            const preclusion = (newData.preclusionRule || '').match(/[A-Z]{2,4}\d{4}[A-Z]{0,3}/g) ?? []; //regrex pattern to get just the module code from the entire sentence of preclusion
            await modulesDB.upsertModule({
                module_code: newData.moduleCode,
                module_name: newData.title,
                semesters: newData.semesterData,
                cached_at: new Date().toISOString(),
                is_su_eligible: newData.attributes?.su ?? null,
                description: newData.description,
                prereq_tree: newData.prereqTree,
                fulfill_requirements: newData.fulfillRequirements,
                preclusion: preclusion,
            });

            return res.json(newData);
        }
        catch (error) {
            console.error('Failed to fetch module data from NUSMods:', error);
            return res.status(500).json({ error: 'Failed to fetch module data from NUSMods' });
        }
    }        
    return res.json(data);
});

export default router;