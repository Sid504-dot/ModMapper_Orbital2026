import request from 'supertest';
import express from 'express';
import router from '../../routes/timetable';

import * as timetableGen from '../../services/timetableGen';
import * as timetableGenerator from '../../domain/timetableGenerator/timetableOptions';
import * as semesterUtil from '../../domain/calendar/currentAcaSem';

jest.mock('../../middleware/requireAuth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'user-1' };
        next();
    }
}));

describe('Timetable Generator', () => {
    const app = express();

    beforeAll(() => {
        app.use(express.json());
        app.use(router);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('generates timetable successfully', async () => {
        jest.spyOn(timetableGen, 'parsePreferencesWithGemini')
            .mockResolvedValue({
                constraints: {
                    noClassesBefore: 10
                },
                valid: true,
                issues: []
            } as any);

        jest.spyOn(semesterUtil, 'currentAcademicSemester')
            .mockReturnValue(1);

        jest.spyOn(timetableGenerator, 'generateTimetableOptions')
            .mockReturnValue({
                options: [
                    {
                        score: 95
                    }
                ],
                truncated: false
            } as any);

        const res = await request(app)
            .post('/generate-timetable')
            .send({
                user_request: 'No classes before 10am',
                modules: [
                    { module_code: 'CS1010' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.options).toHaveLength(1);
        expect(res.body.data.truncated).toBe(false);
    });

    test('returns 400 when user_request is missing', async () => {
        const res = await request(app)
            .post('/generate-timetable')
            .send({
                modules: [
                    { module_code: 'CS1010' }
                ]
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Missing user_request.');
    });

    test('returns 400 when modules are missing', async () => {
        const res = await request(app)
            .post('/generate-timetable')
            .send({
                user_request: 'No Friday classes'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Missing modules.');
    });

    test('returns 400 when preferences cannot be parsed', async () => {
        jest.spyOn(timetableGen, 'parsePreferencesWithGemini')
            .mockResolvedValue({
                constraints: {},
                valid: false,
                issues: [
                    'Unable to interpret preference.'
                ]
            } as any);

        const res = await request(app)
            .post('/generate-timetable')
            .send({
                user_request: 'asdfasdf',
                modules: [
                    { module_code: 'CS1010' }
                ]
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.data.valid).toBe(false);
        expect(res.body.data.issues).toHaveLength(1);
    });

    test('returns 500 when timetable generation throws', async () => {
        jest.spyOn(timetableGen, 'parsePreferencesWithGemini')
            .mockResolvedValue({
                constraints: {},
                valid: true,
                issues: []
            } as any);

        jest.spyOn(semesterUtil, 'currentAcademicSemester')
            .mockReturnValue(1);

        jest.spyOn(timetableGenerator, 'generateTimetableOptions')
            .mockImplementation(() => {
                throw new Error('Generation failed');
            });

        const res = await request(app)
            .post('/generate-timetable')
            .send({
                user_request: 'No morning classes',
                modules: [
                    { module_code: 'CS1010' }
                ]
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Generation failed');
    });
});