import request from 'supertest';
import express from 'express';
import router from '../../../routes/yearPlanner';

import * as yearPlannerDB from '../../../db/yearPlanner';

jest.mock('../../../middleware/requireAuth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'user-1' };
        next();
    }
}));

describe('Year Planner Place Route', () => {

    const app = express();

    beforeAll(() => {
        app.use(express.json());
        app.use(router);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('places a module successfully', async () => {

        jest.spyOn(yearPlannerDB, 'placeModule')
            .mockResolvedValue(true);

        jest.spyOn(yearPlannerDB, 'buildPlanView')
            .mockResolvedValue({
                semesters: []
            } as any);

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: 'CS2030',
                semIndex: 2,
                groupId: 1
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(yearPlannerDB.placeModule).toHaveBeenCalledWith(
            'user-1',
            'CS2030',
            2,
            1
        );
    });

    test('returns 400 for invalid moduleCode', async () => {

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: '',
                semIndex: 2,
                groupId: 1
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 for invalid semIndex', async () => {

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: 'CS2030',
                semIndex: 10,
                groupId: 1
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 for invalid groupId', async () => {

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: 'CS2030',
                semIndex: 2,
                groupId: 'abc'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('allows null groupId', async () => {

        jest.spyOn(yearPlannerDB, 'placeModule')
            .mockResolvedValue(true);

        jest.spyOn(yearPlannerDB, 'buildPlanView')
            .mockResolvedValue({
                semesters: []
            } as any);

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: 'CS2030',
                semIndex: 2,
                groupId: null
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        expect(yearPlannerDB.placeModule).toHaveBeenCalledWith(
            'user-1',
            'CS2030',
            2,
            null
        );
    });

    test('returns 500 when placement fails', async () => {

        jest.spyOn(yearPlannerDB, 'placeModule')
            .mockRejectedValue(new Error('Database failure'));

        const res = await request(app)
            .post('/place')
            .send({
                moduleCode: 'CS2030',
                semIndex: 2,
                groupId: 1
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Database failure');
    });

});