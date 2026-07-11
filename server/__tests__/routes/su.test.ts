import request from 'supertest';
import express from 'express';
import { beforeEach, afterEach, describe, expect, jest, test } from '@jest/globals';

// Mock ALL external dependencies before requiring the router.
jest.mock('../../db/supabase', () => ({
    auth: { getUser: jest.fn() }
}));
jest.mock('../../db/suPolicy');
jest.mock('../../db/userProfile');
jest.mock('../../db/timetable');
jest.mock('../../db/userSuInfo');
jest.mock('../../db/modules');

import supabase from '../../db/supabase';
import * as suPolicy from '../../db/suPolicy';
import * as userProfileDB from '../../db/userProfile';
import * as timetableDB from '../../db/timetable';
import * as userSuInfoDB from '../../db/userSuInfo';
import * as moduleDB from '../../db/modules';
import suRouter from '../../routes/su';

const mockGetUser =
    supabase.auth.getUser as jest.MockedFunction<typeof supabase.auth.getUser>;

const mockGetSuPolicy =
    suPolicy.getSuPolicy as jest.MockedFunction<typeof suPolicy.getSuPolicy>;

const mockGetUserProfile =
    userProfileDB.getUserProfile as jest.MockedFunction<typeof userProfileDB.getUserProfile>;

const mockUpsertUserProfile =
    userProfileDB.upsertUserProfile as jest.MockedFunction<typeof userProfileDB.upsertUserProfile>;

const mockGetTimetableByUserID =
    timetableDB.getTimetableByUserID as jest.MockedFunction<typeof timetableDB.getTimetableByUserID>;

const mockGetSuInfo =
    userSuInfoDB.getSuInfo as jest.MockedFunction<typeof userSuInfoDB.getSuInfo>;

const mockUpsertSuInfo =
    userSuInfoDB.upsertSuInfo as jest.MockedFunction<typeof userSuInfoDB.upsertSuInfo>;

const mockGetSuAbleModulesByCodes =
    moduleDB.getSuAbleModulesByCodes as jest.MockedFunction<typeof moduleDB.getSuAbleModulesByCodes>;
    
const app = express();
app.use(express.json());
app.use('/su', suRouter);

const MOCK_USER_ID = 'user-uuid-123';
const MOCK_TOKEN = 'valid-jwt-token';
const AUTH_HEADER = `Bearer ${MOCK_TOKEN}`;

afterEach(() => {
    jest.useRealTimers();
});

// ─── GET /su ─────────────────────────────────────────────────────────────────

describe('GET /su', () => {

    beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-05-15'));
        jest.clearAllMocks();
        // Default: auth passes for all tests in this block
        mockGetUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        } as any);
    });

    // ── Auth guard ───────────────────────────────────────────────────────────

    test('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/su');
        expect(res.status).toBe(401);
    });

    // ── Happy path ───────────────────────────────────────────────────────────

    test('returns 200 with merged SU data on success', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockResolvedValue({
            total_su: 32, y1y2_cap: 20, y3y4_cap: 12, cohort_start_year: 2024
        } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 4, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({
            data: [{ module_code: 'CS1101S', module_name: 'Programming Methodology' }]
        } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
        } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('modules');
        expect(res.body).toHaveProperty('usedSu', 4);
        expect(res.body).toHaveProperty('totalSu', 32);
        expect(res.body.modules[0]).toHaveProperty('is_su_eligible', true);
    });

    test('merges is_su_eligible into timetable entries correctly', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({
            data: [
                { module_code: 'CS1101S' },
                { module_code: 'LAJ1201' }
            ]
        } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
        } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        const cs = res.body.modules.find((m: any) => m.module_code === 'CS1101S');
        const laj = res.body.modules.find((m: any) => m.module_code === 'LAJ1201');
        expect(cs.is_su_eligible).toBe(true);
        expect(laj.is_su_eligible).toBeNull();
    });

    test('returns empty modules array when timetable is empty', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.modules).toHaveLength(0);
    });

    test('uses used_su = 0 and total_su from policy when userSuInfo is null', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue(null as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.usedSu).toBe(0);
        expect(res.body.totalSu).toBe(32);
    });

    // ── Year computation ─────────────────────────────────────────────────────

    test('classifies Y1Y2 when matric_year equals current year (temp=0)', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2026 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y1y2');
        expect(res.body.groupCap).toBe(20);
    });

    test('classifies Y1Y2 when temp=1 and month < 7 (still in Y1)', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2025 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y1y2');
    });

    test('classifies Y3Y4 when temp=3 and month < 7 (Y3)', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2023 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y3y4');
        expect(res.body.groupCap).toBe(12);
    });

    test('computes group_remaining as groupCap minus usedSu', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2026 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 8, total_su: 32 } as any);
        mockGetTimetableByUserID.mockResolvedValue({ data: [] } as any);
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.group_remaining).toBe(12);
    });

    // ── Error paths ──────────────────────────────────────────────────────────

    test('returns 500 if getUserProfile throws', async () => {
        mockGetUserProfile.mockRejectedValue(new Error('DB connection failed') as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal Server Error');
    });

    test('returns 500 if getSuPolicy throws', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockRejectedValue(new Error('Policy not found') as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
    });

    test('returns 500 if timetable fetch fails', async () => {
        mockGetUserProfile.mockResolvedValue({ matric_year: 2024 } as any);
        mockGetSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 } as any);
        mockGetSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 } as any);
        mockGetTimetableByUserID.mockRejectedValue(new Error('Timetable error') as any);

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
    });
});

// ─── POST /su/userProfile ────────────────────────────────────────────────────

describe('POST /su/userProfile', () => {

    beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-05-15'));
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        } as any);
    });

    test('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).post('/su/userProfile').send({ matricYear: 2024 });
        expect(res.status).toBe(401);
    });

    test('returns 401 when token is present but getUser fails', async () => {
        mockGetUser.mockRejectedValue(new Error('Invalid token') as any);

        const res = await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(res.status).toBe(401);
    });

    test('returns 400 when matricYear is missing from body', async () => {
        const res = await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Matric year is required');
    });

    test('returns 200 and success message on valid upsert', async () => {
        mockUpsertUserProfile.mockResolvedValue([{
            user_id: MOCK_USER_ID, matric_year: 2024
        }] as any);

        const res = await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User profile updated successfully');
        expect(res.body.userProfile).toBeDefined();
    });

    test('calls upsertUserProfile with correct userId and matricYear', async () => {
        mockUpsertUserProfile.mockResolvedValue([{ user_id: MOCK_USER_ID, matric_year: 2024 }] as any);

        await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(mockUpsertUserProfile).toHaveBeenCalledWith(MOCK_USER_ID, 2024);
    });

    test('returns 500 if upsertUserProfile throws', async () => {
        mockUpsertUserProfile.mockRejectedValue(new Error('DB error') as any);

        const res = await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal Server Error');
    });
});

// ─── POST /su/info ───────────────────────────────────────────────────────────

describe('POST /su/info', () => {

    beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-05-15'));
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        } as any);
    });

    test('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).post('/su/info').send({ totalSu: 32, usedSU: 4 });
        expect(res.status).toBe(401);
    });

    test('returns 400 when totalSu is missing', async () => {
        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ usedSU: 4 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Total SU and Used SU are required');
    });

    test('returns 400 when usedSU is missing', async () => {
        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Total SU and Used SU are required');
    });

    test('returns 400 when body is empty', async () => {
        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({});

        expect(res.status).toBe(400);
    });

    test('returns 200 and success message on valid upsert', async () => {
        mockUpsertSuInfo.mockResolvedValue([{
            user_id: MOCK_USER_ID, total_su: 32, used_su: 4
        }] as any);

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User SU info updated successfully');
        expect(res.body.userSuInfo).toBeDefined();
    });

    test('calls upsertSuInfo with correct arguments', async () => {
        mockUpsertSuInfo.mockResolvedValue([{ user_id: MOCK_USER_ID }] as any);

        await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(mockUpsertSuInfo).toHaveBeenCalledWith(MOCK_USER_ID, 32, 4);
    });

    test('returns 500 if upsertSuInfo throws', async () => {
        mockUpsertSuInfo.mockRejectedValue(new Error('DB error') as any);

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal Server Error');
    });

    test('accepts usedSU of 0 (valid — not undefined)', async () => {
        mockUpsertSuInfo.mockResolvedValue([{ user_id: MOCK_USER_ID, total_su: 32, used_su: 0 }] as any);

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 0 });

        expect(res.status).toBe(200);
    });
});

// ─── POST /su/eligible ───────────────────────────────────────────────────────

describe('POST /su/eligible', () => {

    beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] }).setSystemTime(new Date('2026-05-15'));
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        } as any);
    });

    test('returns 401 when Authorization header is missing', async () => {
        const res = await request(app)
            .post('/su/eligible')
            .send([{ moduleCode: 'CS1101S' }]);
        expect(res.status).toBe(401);
    });

    test('returns SU-able modules filtered from input list', async () => {
        mockGetSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
        } as any);

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CS1101S' }, { moduleCode: 'CS2109S' }]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(1);
        expect(res.body.suAbleModules[0].module_code).toBe('CS1101S');
    });

    test('returns empty suAbleModules when no modules are SU-able', async () => {
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CFG1002' }, { moduleCode: 'GEA1000' }]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(0);
    });

    test('returns empty suAbleModules when input list is empty', async () => {
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(0);
    });

    test('calls getSuAbleModulesByCodes with extracted module codes', async () => {
        mockGetSuAbleModulesByCodes.mockResolvedValue({ data: [] } as any);

        await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CS1101S' }, { moduleCode: 'MA1521' }]);

        expect(mockGetSuAbleModulesByCodes).toHaveBeenCalledWith(['CS1101S', 'MA1521']);
    });
});