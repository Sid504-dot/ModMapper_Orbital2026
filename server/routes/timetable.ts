import express, { Request, Response } from 'express';
const router = express.Router();
import * as timetableDB from '../db/timetable';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';
import { parsePreferencesWithGemini } from '../services/timetableGen';
import { ValidationResult } from '../domain/timetableGenerator/validateParsedConstraints';
import { generateTimetableOptions } from '../domain/timetableGenerator/timetableOptions';
import { currentAcademicSemester } from '../domain/calendar/currentAcaSem';
import { expandSelectedSlots } from '../domain/timetableGenerator/expandSelectedSlots';

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
        const statusCode = err instanceof Error && err.message.includes('Cannot determine semester') ? 400 : 500;
        return res.status(statusCode).json({
            success: false,
            message: 'Failed to fetch timetable',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
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


router.post('/generate-timetable', async (req: Request, res: Response<ApiResponse>) => {
    const { user_request, modules } = req.body;

    try {
        if (!user_request || typeof user_request !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'User request is required.',
                data: null,
                error: 'Missing user_request.'
            });
        }

        if (!Array.isArray(modules) || modules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No modules provided.',
                data: null,
                error: 'Missing modules.'
            });
        }

        const { constraints, valid, issues }: ValidationResult = await parsePreferencesWithGemini(user_request);

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: 'Unable to understand timetable preferences.',
                data: { valid, issues },
                error: 'Unable to understand timetable preferences.'
            });
        }

        const semester = currentAcademicSemester();

        const { options, truncated } = generateTimetableOptions( modules, semester, constraints, { maxResults: 5 });

        if (options.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No clash-free timetable satisfies those preferences.',
                data: { options: [], constraints, valid, issues, truncated },
                error: 'NO_FEASIBLE_TIMETABLE'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Timetable generated successfully.',
            data: { options, valid, issues, truncated },
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate timetable.',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});


router.post('/save-generated', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { selectedSlots, modules } = req.body;

    try {
        if (!selectedSlots) {
            return res.status(400).json({
                success: false,
                message: 'selectedSlots is required.',
                data: null,
                error: 'Missing selectedSlots.'
            });
        }

        if (!Array.isArray(modules) || modules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Modules are required.',
                data: null,
                error: 'Missing modules.'
            });
        }

        const semester = currentAcademicSemester();


        const timetable_data = expandSelectedSlots(
            selectedSlots,
            modules,
            semester
        );

        const entryData = {
            user_id: userID,
            timetable_data
        };

        const data = await timetableDB.upsertTimetableEntry(entryData);

        return res.status(200).json({
            success: true,
            message: 'Generated timetable saved successfully.',
            data,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to save generated timetable.',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});


export default router;