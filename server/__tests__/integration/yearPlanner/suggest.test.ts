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

describe('Year Planner Suggest Route', () => {

    const app = express();

    beforeAll(() => {
        app.use(express.json());
        app.use(router);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('returns suggestions successfully', async () => {

        jest.spyOn(yearPlannerDB, 'getUserInterest')
            .mockResolvedValue('Artificial Intelligence');

        jest.spyOn(yearPlannerDB, 'getRulebookForUser')
            .mockResolvedValue({liveGroupIds: new Set([1])} as any);

        jest.spyOn(yearPlannerDB, 'getPlan')
            .mockResolvedValue([] as any);

        jest.spyOn(yearPlannerDB, 'suggestForSlot')
            .mockResolvedValue({
                required: [],
                ranked: [
                    {
                        code: 'CS3243',
                        score: 98,
                        rationale: 'Excellent fit'
                    }
                ],
                others: ['CS2109S']
            });

        const res = await request(app)
            .post('/suggest')
            .send({
                groupId: 1,
                semIndex: 3
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.ranked[0].code).toBe('CS3243');
    });

    test('returns 400 for invalid input', async () => {

        const res = await request(app)
            .post('/suggest')
            .send({
                groupId: '1',
                semIndex: 10
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('returns 400 when group does not exist', async () => {

        jest.spyOn(yearPlannerDB, 'getUserInterest')
            .mockResolvedValue('Artificial Intelligence');

        jest.spyOn(yearPlannerDB, 'getRulebookForUser')
            .mockResolvedValue({
                liveGroupIds: new Set([2])
            } as any);

        jest.spyOn(yearPlannerDB, 'getPlan')
            .mockResolvedValue([] as any);

        const res = await request(app)
            .post('/suggest')
            .send({
                groupId: 1,
                semIndex: 2
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Unknown requirement group.');
    });

    test('returns 500 when suggestion generation fails', async () => {

        jest.spyOn(yearPlannerDB, 'getUserInterest')
            .mockResolvedValue('Artificial Intelligence');

        jest.spyOn(yearPlannerDB, 'getRulebookForUser')
            .mockResolvedValue({
                liveGroupIds: new Set([1])
            } as any);

        jest.spyOn(yearPlannerDB, 'getPlan')
            .mockResolvedValue([] as any);

        jest.spyOn(yearPlannerDB, 'suggestForSlot')
            .mockRejectedValue(new Error('Database failure'));

        const res = await request(app)
            .post('/suggest')
            .send({
                groupId: 1,
                semIndex: 2
            });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Database failure');
    });

});