import express, { Request, Response } from 'express';
const router = express.Router();
import * as modulesDB from '../db/modules';
import * as nusmodsService from '../services/nusmods';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    
    const moduleCode = req.query.module_code;

    if (typeof moduleCode !== 'string' || moduleCode.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'module_code query parameter is required',
            data: null,
            error: 'Invalid module_code'
        });
    }

    const b = moduleCode;

    try {
        const { data } = await modulesDB.getModuleByCode(b);

        if (!data || data.length === 0) {
            try {
                const newData = await nusmodsService.moduleGetData(b);

                const preclusion =
                    (newData.preclusionRule || '').match(/[A-Z]{2,4}\d{4}[A-Z]{0,3}/g) ?? [];

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

                return res.status(200).json({
                    success: true,
                    message: 'Module fetched from NUSMods',
                    data: newData,
                    error: null
                });

            } catch (error) {
                console.error('Failed to fetch module data from NUSMods:', error);

                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch module data from NUSMods',
                    data: null,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Module fetched from cache',
            data: data,
            error: null
        });

    } catch (error) {
        console.error('Database error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch module from database',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;