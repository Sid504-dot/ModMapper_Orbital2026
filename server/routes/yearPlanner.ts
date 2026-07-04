import express, { Request, Response } from 'express';
const router = express.Router();
import * as yearPlannerDB from '../db/yearPlanner';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {

    try {
        const allProgrammes = await yearPlannerDB.getAllProgrammes();

        return res.status(200).json({
            success: true,
            message: 'Programmes fetched successfully',
            data: allProgrammes,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch programmes',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

router.post('/select-programmes', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const { programmeIDs } = req.body;

    if (!Array.isArray(programmeIDs) || programmeIDs.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'programmeIDs must be a non-empty array',
            data: null,
            error: 'Invalid input'
        });
    }

    try {
        await yearPlannerDB.upsertProgrammes(userID, programmeIDs);

        return res.status(200).json({
            success: true,
            message: 'Programmes selected successfully',
            data: null,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to select programmes',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

router.delete('/delete-user-programme', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const { programmeID } = req.body;

    if (!programmeID) {
        return res.status(400).json({
            success: false,
            message: 'programmeID is required',
            data: null,
            error: 'Invalid programmeID'
        });
    }

    try {
        await yearPlannerDB.deleteProgrammes(userID, programmeID);

        return res.status(200).json({
            success: true,
            message: 'Programme deleted successfully',
            data: null,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete programme',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

export default router;