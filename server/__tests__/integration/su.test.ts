import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../../middleware/requireAuth', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { id: 'user-123' };
        next();
    }
}));

jest.mock('../../db/userSem');
jest.mock('../../db/suPolicy');
jest.mock('../../db/userSuInfo');
jest.mock('../../db/timetable');
jest.mock('../../db/modules');
jest.mock('../../db/userProfile');

import * as userSemDB from '../../db/userSem';
import * as suPolicyDB from '../../db/suPolicy';
import * as userSuInfoDB from '../../db/userSuInfo';
import * as timetableDB from '../../db/timetable';
import * as moduleDB from '../../db/modules';
import * as userProfileDB from '../../db/userProfile';

import suRouter from '../../routes/su';

const app = express();
app.use(express.json());
app.use('/su', suRouter);

const mockGetSem =
    userSemDB.getUserSemByUserID as jest.MockedFunction<typeof userSemDB.getUserSemByUserID>;

const mockGetPolicy =
    suPolicyDB.getSuPolicy as jest.MockedFunction<typeof suPolicyDB.getSuPolicy>;

const mockGetSuInfo =
    userSuInfoDB.getSuInfo as jest.MockedFunction<typeof userSuInfoDB.getSuInfo>;

const mockGetTimetable =
    timetableDB.getTimetableByUserID as jest.MockedFunction<typeof timetableDB.getTimetableByUserID>;

const mockGetSuEligible =
    moduleDB.getSuAbleModulesByCodes as jest.MockedFunction<typeof moduleDB.getSuAbleModulesByCodes>;

const mockUpsertProfile =
    userProfileDB.upsertUserProfile as jest.MockedFunction<typeof userProfileDB.upsertUserProfile>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /su', () => {

    test('returns 400 if semester has not been set', async () => {
        mockGetSem.mockResolvedValue(null as any);

        const res = await request(app).get('/su');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe(
            'Please set your matriculation year first.'
        );
    });

    test('returns SU information successfully', async () => {
        mockGetSem.mockResolvedValue(2);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue({
            used_su: 4,
            total_su: 32
        } as any);

        mockGetTimetable.mockResolvedValue([
            {
                module_code: 'CS1101S',
                module_name: 'Programming Methodology'
            }
        ] as any);

        mockGetSuEligible.mockResolvedValue({
            data: [
                {
                    module_code: 'CS1101S',
                    is_su_eligible: true
                }
            ]
        } as any);

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.usedSu).toBe(4);
        expect(res.body.totalSu).toBe(32);
        expect(res.body.modules).toHaveLength(1);
        expect(res.body.modules[0].is_su_eligible).toBe(true);
    });

    test('returns null eligibility when module is not SU-able', async () => {
        mockGetSem.mockResolvedValue(2);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue({
            used_su: 0,
            total_su: 32
        } as any);

        mockGetTimetable.mockResolvedValue([
            {
                module_code: 'CS2100'
            }
        ] as any);

        mockGetSuEligible.mockResolvedValue({
            data: []
        } as any);

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.modules[0].is_su_eligible).toBeNull();
    });

    test('returns empty module list', async () => {
        mockGetSem.mockResolvedValue(2);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue(null);

        mockGetTimetable.mockResolvedValue([] as any);

        mockGetSuEligible.mockResolvedValue({
            data: []
        } as any);

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.modules).toEqual([]);
        expect(res.body.usedSu).toBe(0);
        expect(res.body.totalSu).toBe(32);
    });

    test('uses y1y2 group correctly', async () => {
        mockGetSem.mockResolvedValue(2);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue({
            used_su: 5,
            total_su: 32
        } as any);

        mockGetTimetable.mockResolvedValue([] as any);

        mockGetSuEligible.mockResolvedValue({
            data: []
        } as any);

        const res = await request(app).get('/su');

        expect(res.body.currentGroup).toBe('y1y2');
        expect(res.body.groupCap).toBe(20);
        expect(res.body.group_remaining).toBe(15);
    });

    test('uses y3y4 group correctly', async () => {
        mockGetSem.mockResolvedValue(5);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue({
            used_su: 2,
            total_su: 32
        } as any);

        mockGetTimetable.mockResolvedValue([] as any);

        mockGetSuEligible.mockResolvedValue({
            data: []
        } as any);

        const res = await request(app).get('/su');

        expect(res.body.currentGroup).toBe('y3y4');
        expect(res.body.groupCap).toBe(12);
        expect(res.body.group_remaining).toBe(10);
    });

    test('returns 500 when semester lookup fails', async () => {
        mockGetSem.mockRejectedValue(
            new Error('Database error')
        );

        const res = await request(app).get('/su');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Database error');
    });

    test('returns 500 when timetable lookup fails', async () => {
        mockGetSem.mockResolvedValue(2);

        mockGetPolicy.mockResolvedValue({
            total_su: 32,
            y1y2_cap: 20,
            y3y4_cap: 12
        } as any);

        mockGetSuInfo.mockResolvedValue(null);

        mockGetTimetable.mockRejectedValue(
            new Error('Timetable failed')
        );

        const res = await request(app).get('/su');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Timetable failed');
    });

});

