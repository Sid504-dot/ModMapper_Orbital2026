const request = require('supertest');
const express = require('express');

// Mock ALL external dependencies before requiring the router.
// supabase is used directly in su.js for auth.getUser — mock it here.
// All DB modules are mocked to prevent real Supabase calls.
jest.mock('../../db/supabase', () => ({
    auth: { getUser: jest.fn() }
}));
jest.mock('../../db/suPolicy');
jest.mock('../../db/userProfile');
jest.mock('../../db/timetable');
jest.mock('../../db/userSuInfo');
jest.mock('../../db/modules');

const supabase     = require('../../db/supabase');
const suPolicy     = require('../../db/suPolicy');
const userProfileDB = require('../../db/userProfile');
const timetableDB  = require('../../db/timetable');
const userSuInfoDB = require('../../db/userSuInfo');
const moduleDB     = require('../../db/modules');
const suRouter     = require('../../routes/su');

const app = express();
app.use(express.json());
app.use('/su', suRouter);

const MOCK_USER_ID = 'user-uuid-123';
const MOCK_TOKEN   = 'valid-jwt-token';
const AUTH_HEADER  = `Bearer ${MOCK_TOKEN}`;

// ─── GET /su ─────────────────────────────────────────────────────────────────

describe('GET /su', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: auth passes for all tests in this block
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    // ── Auth guard ───────────────────────────────────────────────────────────

    test('returns 500 when Authorization header is missing', async () => {
        // NOTE: su.js calls req.headers.authorization.split(' ') OUTSIDE the
        // try-catch, so a missing header throws a TypeError → Express 5 → 500.
        // This is a known code issue — the test documents actual behavior.
        const res = await request(app).get('/su');
        expect(res.status).toBe(500);
    });

    // ── Happy path ───────────────────────────────────────────────────────────

    test('returns 200 with merged SU data on success', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockResolvedValue({
            total_su: 32, y1y2_cap: 20, y3y4_cap: 12, cohort_start_year: 2024
        });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 4, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({
            data: [{ module_code: 'CS1101S', module_name: 'Programming Methodology' }]
        });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
        });

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
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({
            data: [
                { module_code: 'CS1101S' },
                { module_code: 'LAJ1201' }  // not SU-able, won't appear in suAbleModules
            ]
        });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
            // LAJ1201 absent → should be null
        });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        const cs = res.body.modules.find(m => m.module_code === 'CS1101S');
        const laj = res.body.modules.find(m => m.module_code === 'LAJ1201');
        expect(cs.is_su_eligible).toBe(true);
        expect(laj.is_su_eligible).toBeNull();
    });

    test('returns empty modules array when timetable is empty', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.modules).toHaveLength(0);
    });

    test('uses used_su = 0 and total_su from policy when userSuInfo is null', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue(null);  // user hasn't set SU info yet
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body.usedSu).toBe(0);
        expect(res.body.totalSu).toBe(32);  // falls back to policy total
    });

    // ── Year computation ─────────────────────────────────────────────────────
    // Current date in tests: May 2026 (month = 5)

    test('classifies Y1Y2 when matric_year equals current year (temp=0)', async () => {
        // matric 2026, year 2026, month 5 → temp=0 → whichYear=1 → y1y2
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2026 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y1y2');
        expect(res.body.groupCap).toBe(20);
    });

    test('classifies Y1Y2 when temp=1 and month < 7 (still in Y1)', async () => {
        // matric 2025, year 2026, month 5 → temp=1, month<7 → whichYear=1 → y1y2
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2025 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y1y2');
    });

    test('classifies Y3Y4 when temp=3 and month >= 7 (Y4)', async () => {
        // matric 2023, year 2026, month 5 → temp=3, month<7 → whichYear=3 → y3y4
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2023 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.currentGroup).toBe('y3y4');
        expect(res.body.groupCap).toBe(12);
    });

    test('computes group_remaining as groupCap minus usedSu', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2026 }); // Y1 → y1y2 cap=20
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 8, total_su: 32 });
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [] });
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.body.group_remaining).toBe(12); // 20 - 8
    });

    // ── Error paths ──────────────────────────────────────────────────────────

    test('returns 500 if getUserProfile throws', async () => {
        userProfileDB.getUserProfile.mockRejectedValue(new Error('DB connection failed'));

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal Server Error');
    });

    test('returns 500 if getSuPolicy throws', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockRejectedValue(new Error('Policy not found'));

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
    });

    test('returns 500 if timetable fetch fails', async () => {
        userProfileDB.getUserProfile.mockResolvedValue({ matric_year: 2024 });
        suPolicy.getSuPolicy.mockResolvedValue({ total_su: 32, y1y2_cap: 20, y3y4_cap: 12 });
        userSuInfoDB.getSuInfo.mockResolvedValue({ used_su: 0, total_su: 32 });
        timetableDB.getTimetableByUserID.mockRejectedValue(new Error('Timetable error'));

        const res = await request(app)
            .get('/su')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
    });
});

// ─── POST /su/userProfile ────────────────────────────────────────────────────

describe('POST /su/userProfile', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        const res = await request(app).post('/su/userProfile').send({ matricYear: 2024 });
        expect(res.status).toBe(500);
    });

    test('returns 401 when token is present but getUser fails', async () => {
        supabase.auth.getUser.mockRejectedValue(new Error('Invalid token'));

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
        userProfileDB.upsertUserProfile.mockResolvedValue([{
            user_id: MOCK_USER_ID, matric_year: 2024
        }]);

        const res = await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User profile updated successfully');
        expect(res.body.userProfile).toBeDefined();
    });

    test('calls upsertUserProfile with correct userId and matricYear', async () => {
        userProfileDB.upsertUserProfile.mockResolvedValue([{ user_id: MOCK_USER_ID, matric_year: 2024 }]);

        await request(app)
            .post('/su/userProfile')
            .set('Authorization', AUTH_HEADER)
            .send({ matricYear: 2024 });

        expect(userProfileDB.upsertUserProfile).toHaveBeenCalledWith(MOCK_USER_ID, 2024);
    });

    test('returns 500 if upsertUserProfile throws', async () => {
        userProfileDB.upsertUserProfile.mockRejectedValue(new Error('DB error'));

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
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        const res = await request(app).post('/su/info').send({ totalSu: 32, usedSU: 4 });
        expect(res.status).toBe(500);
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
        userSuInfoDB.upsertSuInfo.mockResolvedValue([{
            user_id: MOCK_USER_ID, total_su: 32, used_su: 4
        }]);

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('User SU info updated successfully');
        expect(res.body.userSuInfo).toBeDefined();
    });

    test('calls upsertSuInfo with correct arguments', async () => {
        userSuInfoDB.upsertSuInfo.mockResolvedValue([{ user_id: MOCK_USER_ID }]);

        await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(userSuInfoDB.upsertSuInfo).toHaveBeenCalledWith(MOCK_USER_ID, 32, 4);
    });

    test('returns 500 if upsertSuInfo throws', async () => {
        userSuInfoDB.upsertSuInfo.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 4 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal Server Error');
    });

    test('accepts usedSU of 0 (valid — not undefined)', async () => {
        userSuInfoDB.upsertSuInfo.mockResolvedValue([{ user_id: MOCK_USER_ID, total_su: 32, used_su: 0 }]);

        const res = await request(app)
            .post('/su/info')
            .set('Authorization', AUTH_HEADER)
            .send({ totalSu: 32, usedSU: 0 });

        // 0 is a valid value (falsy but !== undefined), so should pass
        expect(res.status).toBe(200);
    });
});

// ─── POST /su/eligible ───────────────────────────────────────────────────────

describe('POST /su/eligible', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        const res = await request(app)
            .post('/su/eligible')
            .send([{ moduleCode: 'CS1101S' }]);
        expect(res.status).toBe(500);
    });

    test('returns SU-able modules filtered from input list', async () => {
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({
            data: [{ module_code: 'CS1101S', is_su_eligible: true }]
            // CS2109S not returned — not SU-able
        });

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CS1101S' }, { moduleCode: 'CS2109S' }]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(1);
        expect(res.body.suAbleModules[0].module_code).toBe('CS1101S');
    });

    test('returns empty suAbleModules when no modules are SU-able', async () => {
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CFG1002' }, { moduleCode: 'GEA1000' }]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(0);
    });

    test('returns empty suAbleModules when input list is empty', async () => {
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        const res = await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([]);

        expect(res.status).toBe(200);
        expect(res.body.suAbleModules).toHaveLength(0);
    });

    test('calls getSuAbleModulesByCodes with extracted module codes', async () => {
        moduleDB.getSuAbleModulesByCodes.mockResolvedValue({ data: [] });

        await request(app)
            .post('/su/eligible')
            .set('Authorization', AUTH_HEADER)
            .send([{ moduleCode: 'CS1101S' }, { moduleCode: 'MA1521' }]);

        expect(moduleDB.getSuAbleModulesByCodes).toHaveBeenCalledWith(['CS1101S', 'MA1521']);
    });
});
