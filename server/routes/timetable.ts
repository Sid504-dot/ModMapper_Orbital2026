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
import { ModuleRecord } from '../types/timetableGenerator';

router.get('/semester', async (_req: Request, res: Response<ApiResponse>) => {
    try {
        const semester = currentAcademicSemester();

        return res.status(200).json({
            success: true,
            message: 'Current academic semester fetched successfully',
            data: { semester },
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to determine the current academic semester',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

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
                message: 'Describe your preferences to generate a timetable.',
                data: null,
                error: 'Missing user_request.'
            });
        }

        if (!Array.isArray(modules) || modules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Add at least one module before generating.',
                data: null,
                error: 'Missing modules.'
            });
        }

        const { constraints, valid, issues }: ValidationResult = await parsePreferencesWithGemini(user_request);

        if (!valid) {
            return res.status(400).json({
                success: false,
                message: 'Could not read those preferences. Try rephrasing them.',
                data: { valid, issues },
                error: 'Unable to understand timetable preferences.'
            });
        }

        const semester = currentAcademicSemester();

        const { options, truncated } = generateTimetableOptions(modules, semester, constraints, { maxResults: 5 });

        if (options.length === 0) {
            const noSemesterData = (modules as ModuleRecord[])
                .filter(m => !m.semesterData?.some(sd => sd.semester === semester))
                .map(m => m.moduleCode);

            return res.status(200).json({
                success: false,
                message: noSemesterData.length > 0
                    ? `These modules are not offered in semester ${semester}: ${noSemesterData.join(', ')}`
                    : 'No clash-free timetable satisfies those preferences. Try relaxing them.',
                data: { options: [], semester, constraints, valid, issues, truncated, noSemesterData },
                error: 'NO_FEASIBLE_TIMETABLE'
            });
        }

        console.log('constraints', JSON.stringify(constraints));
        console.log('options', options.length, 'truncated', truncated);

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
            // `semester` and `constraints` are echoed so the client can align its own
            // semesterData lookups and show how the request was interpreted.
            data: { options, semester, constraints, valid, issues, truncated },
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
        if (!selectedSlots || typeof selectedSlots !== 'object' || Array.isArray(selectedSlots)) {
            return res.status(400).json({
                success: false,
                message: 'selectedSlots is required.',
                data: null,
                error: 'Missing or malformed selectedSlots.'
            });
        }

        if (Object.keys(selectedSlots).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Select at least one class before saving.',
                data: null,
                error: 'Empty selectedSlots.'
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

        if (timetable_data.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No classes matched your selection for semester ${semester}. Nothing was saved.`,
                data: {
                    semester,
                    moduleCodes: (modules as ModuleRecord[]).map(m => m.moduleCode),
                    selectedSlotKeys: Object.keys(selectedSlots)
                },
                error: 'EMPTY_EXPANSION'
            });
        }

        const entryData = {
            user_id: userID,
            timetable_data
        };

        const data = await timetableDB.upsertTimetableEntry(entryData);

        return res.status(200).json({
            success: true,
            message: 'Timetable saved.',
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