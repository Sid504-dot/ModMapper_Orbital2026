import request from 'supertest';
import express from 'express';
import router from '../../routes/timetable';

import * as timetableDB from '../../db/timetable';
import * as timetableGenerator from '../../domain/timetableGenerator/expandSelectedSlots';
import * as semesterUtil from '../../domain/calendar/currentAcaSem';

jest.mock('../../middleware/requireAuth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'user-1' };
        next();
    }
}));

describe('Save Generated Timetable', () => {
    const app = express();

    beforeAll(() => {
        app.use(express.json());
        app.use(router);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('saves generated timetable successfully', async () => {
        jest.spyOn(semesterUtil, 'currentAcademicSemester')
            .mockReturnValue(1);

        jest.spyOn(timetableGenerator, 'expandSelectedSlots')
            .mockReturnValue([
                {
                    module_code: 'CS1010',
                    lesson_type: 'Lecture'
                }
            ] as any);

        jest.spyOn(timetableDB, 'upsertTimetableEntry')
            .mockResolvedValue({
                id: 'tt-1'
            } as any);

        const res = await request(app)
            .post('/save-generated')
            .send({
                selectedSlots: {
                    CS1010: {
                        Lecture: '1'
                    }
                },
                modules: [
                    {
                        module_code: 'CS1010'
                    }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe('tt-1');
    });

    test('returns 400 when selectedSlots is missing', async () => {
        const res = await request(app)
            .post('/save-generated')
            .send({
                modules: [
                    {
                        module_code: 'CS1010'
                    }
                ]
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Missing selectedSlots.');
    });

    test('returns 400 when modules are missing', async () => {
        const res = await request(app)
            .post('/save-generated')
            .send({
                selectedSlots: {
                    CS1010: {
                        Lecture: '1'
                    }
                }
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Missing modules.');
    });

    test('returns 500 when expanding timetable throws', async () => {
        jest.spyOn(semesterUtil, 'currentAcademicSemester')
            .mockReturnValue(1);

        jest.spyOn(timetableGenerator, 'expandSelectedSlots')
            .mockImplementation(() => {
                throw new Error('Expansion failed');
            });

        const res = await request(app)
            .post('/save-generated')
            .send({
                selectedSlots: {
                    CS1010: {
                        Lecture: '1'
                    }
                },
                modules: [
                    {
                        module_code: 'CS1010'
                    }
                ]
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Expansion failed');
    });

    test('returns 500 when database upsert fails', async () => {
        jest.spyOn(semesterUtil, 'currentAcademicSemester')
            .mockReturnValue(1);

        jest.spyOn(timetableGenerator, 'expandSelectedSlots')
            .mockReturnValue([
                {
                    module_code: 'CS1010'
                }
            ] as any);

        jest.spyOn(timetableDB, 'upsertTimetableEntry')
            .mockRejectedValue(new Error('Database error'));

        const res = await request(app)
            .post('/save-generated')
            .send({
                selectedSlots: {
                    CS1010: {
                        Lecture: '1'
                    }
                },
                modules: [
                    {
                        module_code: 'CS1010'
                    }
                ]
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Database error');
    });
});