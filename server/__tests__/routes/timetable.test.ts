const request = require('supertest');
const express = require('express');

jest.mock('../../db/supabase', () => ({
    auth: { getUser: jest.fn() }
}));
jest.mock('../../db/timetable');

const supabase     = require('../../db/supabase');
const timetableDB  = require('../../db/timetable');
const timetableRouter = require('../../routes/timetable');

const app = express();
app.use(express.json());
app.use('/timetable', timetableRouter);

const MOCK_USER_ID = 'user-uuid-123';
const MOCK_TOKEN   = 'valid-jwt-token';
const AUTH_HEADER  = `Bearer ${MOCK_TOKEN}`;

// ─── GET /timetable ───────────────────────────────────────────────────────────

describe('GET /timetable', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        // token extraction is outside try-catch → TypeError → 500
        const res = await request(app).get('/timetable');
        expect(res.status).toBe(500);
    });

    test('returns timetable entries for authenticated user', async () => {
        timetableDB.getTimetableByUserID.mockResolvedValue({
            data: [
                { module_code: 'CS1101S', user_id: MOCK_USER_ID },
                { module_code: 'MA1521',  user_id: MOCK_USER_ID }
            ],
            error: null
        });

        const res = await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].module_code).toBe('CS1101S');
    });

    test('returns empty array when user has no timetable entries', async () => {
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [], error: null });

        const res = await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    test('returns 500 when DB returns an error', async () => {
        timetableDB.getTimetableByUserID.mockResolvedValue({
            data: null,
            error: { message: 'Failed to query timetable' }
        });

        const res = await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch timetable 1');
    });

    test('calls getTimetableByUserID with the authenticated user ID', async () => {
        timetableDB.getTimetableByUserID.mockResolvedValue({ data: [], error: null });

        await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(timetableDB.getTimetableByUserID).toHaveBeenCalledWith(MOCK_USER_ID);
    });
});

// ─── POST /timetable ──────────────────────────────────────────────────────────

describe('POST /timetable', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        const res = await request(app)
            .post('/timetable')
            .send({ module_code: 'CS1101S' });
        expect(res.status).toBe(500);
    });

    test('upserts and returns timetable entry on success', async () => {
        timetableDB.upsertTimetableEntry.mockResolvedValue({
            data: [{ module_code: 'CS1101S', user_id: MOCK_USER_ID }],
            error: null
        });

        const res = await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        expect(res.status).toBe(200);
        expect(res.body[0].module_code).toBe('CS1101S');
    });

    test('injects user_id from auth into the entry data', async () => {
        timetableDB.upsertTimetableEntry.mockResolvedValue({
            data: [{ module_code: 'CS1101S', user_id: MOCK_USER_ID }],
            error: null
        });

        await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        // The route adds user_id to the body before calling upsert
        expect(timetableDB.upsertTimetableEntry).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: MOCK_USER_ID, module_code: 'CS1101S' })
        );
    });

    test('returns 500 when upsert fails', async () => {
        timetableDB.upsertTimetableEntry.mockResolvedValue({
            data: null,
            error: { message: 'Unique constraint violation' }
        });

        const res = await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Unique constraint violation');
    });

    test('returns 500 if getUser throws (invalid token)', async () => {
        supabase.auth.getUser.mockRejectedValue(new Error('Invalid JWT'));

        const res = await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        // timetable.js has no try-catch wrapping getUser → unhandled rejection → 500
        expect(res.status).toBe(500);
    });
});
