import express, { Request, Response } from 'express';
const router = express.Router();
import * as timetableDB from '../db/timetable';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const data = await timetableDB.getTimetableByUserID(userID);

        return res.status(200).json({
            success: true,
            message: 'Timetable fetched successfully',
            data,
            error: null
        });

    } catch (err) {

        if (err instanceof Error) {

            if (
                err.message === 'Matriculation year not set' ||
                err.message === 'Semester not available'
            ) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    data: null,
                    error: err.message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch timetable',
                data: null,
                error: err.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unknown error occurred',
            data: null,
            error: 'Unknown error'
        });
    }
});

router.post('/', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    const entryData = {
        ...req.body,
        user_id: userID
    };

    try {
        const data = await timetableDB.upsertTimetableEntry(entryData);

        return res.status(200).json({
            success: true,
            message: 'Timetable entry saved successfully',
            data,
            error: null
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: 'Failed to save timetable entry',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

export default router;