import express, { Request, Response } from 'express';
const router = express.Router();
import * as groupFreeFinderDB from '../db/groupFreeFinder';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.get('/group-free-finder/:groupId', async (req: Request<{groupId: string}>, res: Response) => {
    const groupId = req.params.groupId;

    try {
        const ans = await groupFreeFinderDB.freeTimeFinder(groupId);
        return res.json(ans);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to compute free time' });
    }

});

export default router;