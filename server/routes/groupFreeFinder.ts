import express, { Request, Response } from 'express';
const router = express.Router();
import * as GroupFreeFinderDB from '../db/groupFreeFinder';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/group-free-finder/:groupId', async (req: Request<{groupId: string}>, res: Response<ApiResponse>) => {
    const groupId = req.params.groupId;

    try {
        const ans = await GroupFreeFinderDB.freeTimeFinder(groupId);
        return res.status(200).json({
            success: true,
            message: 'returning member availability for the group',
            data: ans,
            error: null,
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to compute free time',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error',
        }) 
    }

});

export default router;