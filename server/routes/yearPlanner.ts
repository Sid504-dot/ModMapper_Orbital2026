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

router.post('/suggest', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { groupId, semIndex } = req.body;

    if (typeof groupId !== 'number' || typeof semIndex !== 'number' || semIndex < 1 || semIndex > 8) {
        return res.status(400).json({
            success: false,
            message: 'groupId must be a number and semIndex must be between 1 and 8.',
            data: null,
            error: 'Invalid input.'
        });
    }

    try {
        const [interest, rulebook, plan] = await Promise.all([
            yearPlannerDB.getUserInterest(userID),
            yearPlannerDB.getRulebookForUser(userID),
            yearPlannerDB.getPlan(userID)
        ]);

        if (!rulebook.liveGroupIds.has(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Unknown requirement group.',
                data: null,
                error: 'Invalid groupId.'
            });
        }

        const result = await yearPlannerDB.suggestForSlot(groupId, semIndex, plan, rulebook, interest);

        return res.status(200).json({
            success: true,
            message: 'Suggestions generated successfully.',
            data: result,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate suggestions.',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

router.get('/plan', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;

    try {

        const planView = await yearPlannerDB.buildPlanView(userID);

        return res.status(200).json({
            success: true,
            message: 'Year plan fetched successfully',
            data: planView,
            error: null
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch year plan',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });

    }
});

router.post('/place', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const { moduleCode, semIndex, groupId } = req.body;

    if (typeof moduleCode !== 'string' || moduleCode.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'moduleCode is required',
            data: null,
            error: 'Invalid moduleCode'
        });
    }

    if (typeof semIndex !== 'number' || semIndex < 1 || semIndex > 8) {
        return res.status(400).json({
            success: false,
            message: 'semIndex must be between 1 and 8',
            data: null,
            error: 'Invalid semIndex'
        });
    }

    if (groupId !== null && typeof groupId !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'groupId must be a number or null',
            data: null,
            error: 'Invalid groupId'
        });
    }

    try {

        await yearPlannerDB.placeModule(
            userID,
            moduleCode,
            semIndex,
            groupId
        );

        const planView = await yearPlannerDB.buildPlanView(userID);

        return res.status(200).json({
            success: true,
            message: 'Module placed successfully',
            data: planView,
            error: null
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: 'Failed to place module',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });

    }
});


router.post('/remove', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { moduleCode } = req.body;

    if (typeof moduleCode !== 'string' || moduleCode.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'moduleCode must be a non-empty string',
            data: null,
            error: 'Invalid moduleCode'
        });
    }

    try {
        await yearPlannerDB.removeModule(userID, moduleCode);

        const planView = await yearPlannerDB.buildPlanView(userID);

        return res.status(200).json({
            success: true,
            message: 'Module removed successfully',
            data: planView,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to remove module',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

router.post('/sem-units', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { semIndex, maxUnits } = req.body;

    if (typeof semIndex !== 'number' || semIndex < 1 ||
        semIndex > 8 || typeof maxUnits !== 'number' || maxUnits <= 0) {
        return res.status(400).json({
            success: false,
            message: 'semIndex must be between 1 and 8, and maxUnits must be a positive number',
            data: null,
            error: 'Invalid input'
        });
    }

    try {
        await yearPlannerDB.setSemUnits(userID, semIndex, maxUnits);

        const planView = await yearPlannerDB.buildPlanView(userID);

        return res.status(200).json({
            success: true,
            message: 'Semester unit limit updated successfully',
            data: planView,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update semester unit limit',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});

router.post('/clear', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        await yearPlannerDB.clearPlan(userID);

        const planView = await yearPlannerDB.buildPlanView(userID);

        return res.status(200).json({
            success: true,
            message: 'Year plan cleared successfully',
            data: planView,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to clear year plan',
            data: null,
            error: err instanceof Error ? err.message : String(err)
        });
    }
});


export default router;