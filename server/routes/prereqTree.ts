import express, { Request, Response } from 'express';
const router = express.Router();
import * as prereqTreeDB from '../db/prereqTree';
import * as qnaEligibilityDB from '../db/qnaEligibilty';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/prereq-tree', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const ans = await prereqTreeDB.UserPrereqTree(userID);

        return res.status(200).json({
            success: true,
            message: 'Prerequisite tree fetched successfully',
            data: ans,
            error: null
        });

    } catch (error) {
        console.error('Error fetching data in prereq-tree', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch prerequisite tree',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/refresh-prereq-tree', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const takenModules = await qnaEligibilityDB.getEligibleModules(userID);

        await prereqTreeDB.updatePlanModules(takenModules, userID, 'taken');

        return res.status(200).json({
            success: true,
            message: 'Prerequisite tree refreshed successfully',
            data: null,
            error: null
        });

    } catch (error) {
        console.error('Error fetching data in refresh-prereq-tree', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to refresh prerequisite tree',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/add-module-tree', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const moduleCode = req.body.module_code;

    try {
        const preclusion = await prereqTreeDB.fulfilledPreclusionsSoCantTakeMod(userID, moduleCode);

        if (preclusion) {
            return res.status(400).json({
                success: false,
                message: 'Module cannot be added due to preclusion',
                data: null,
                error: preclusion
            });
        }

        const need = await prereqTreeDB.missingPrereq(userID, moduleCode);

        if (need.length === 0) {
            await prereqTreeDB.updatePlanModules([moduleCode], userID, 'planned');

            return res.status(200).json({
                success: true,
                message: 'Module added to plan successfully',
                data: null,
                error: null
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Missing prerequisites',
            data: need,
            error: 'Prerequisites not satisfied'
        });

    } catch (error) {
        console.error('Error fetching data', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to add module to tree',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/delete-planned-module', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const moduleCode = req.body.module_code;

    try {
        if (await prereqTreeDB.isModulePlanned(userID, moduleCode)) {
            await prereqTreeDB.deletePlannedModule(userID, moduleCode);

            return res.status(200).json({
                success: true,
                message: 'Module successfully deleted from plan',
                data: null,
                error: null
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Module cannot be deleted',
            data: null,
            error: 'Module is already taken or not planned'
        });

    } catch (error) {
        console.error('Error fetching data in prereq-tree', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete module',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;