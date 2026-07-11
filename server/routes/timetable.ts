import express, { Request, Response } from 'express';
const router = express.Router();
import * as timetableDB from '../db/timetable';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
    const userID = req.user.id;

    try {
        const data = await timetableDB.getTimetableByUserID(userID);
        res.json(data);
    } catch (err) {
        if (err instanceof Error) {
            if (
                err.message === 'Matriculation year not set' ||
                err.message === 'Semester not available'
            ) {
                return res.status(400).json({ error: err.message });
            }

            return res.status(500).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Unknown error' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    const userID = req.user.id;

    const entryData = req.body;
    entryData.user_id = userID;

    try {
        const data = await timetableDB.upsertTimetableEntry(entryData);
        res.json(data);
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Unknown error' });
    }
});

export default router;