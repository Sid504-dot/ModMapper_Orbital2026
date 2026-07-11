import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../../db/supabase', () => ({
    auth: { getUser: jest.fn() }
}));
jest.mock('../../db/timetable');

import supabase from '../../db/supabase';
import * as timetableDB from '../../db/timetable';
import timetableRouter from '../../routes/timetable';

const mockGetUser =
    supabase.auth.getUser as jest.MockedFunction<() => Promise<any>>;

const mockGetTimetableByUserID =
    timetableDB.getTimetableByUserID as jest.MockedFunction<(userId: string) => Promise<any>>;

const mockUpsertTimetableEntry =
    timetableDB.upsertTimetableEntry as jest.MockedFunction<(entry: any) => Promise<any>>;

const app = express();
app.use(express.json());
app.use('/timetable', timetableRouter);

const MOCK_USER_ID = 'user-uuid-123';
const MOCK_TOKEN = 'valid-jwt-token';
const AUTH_HEADER = `Bearer ${MOCK_TOKEN}`;

// ─── GET /timetable ───────────────────────────────────────────────────────────

describe('GET /timetable', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
            data: { user: { id: MOCK_USER_ID } }
        });
    });

    test('returns 500 when Authorization header is missing', async () => {
        // token extraction is outside try-catch → TypeError → 500
        const res = await request(app).get('/timetable');
        expect(res.status).toBe(500);
    });

    test('returns timetable entries for authenticated user', async () => {
        mockGetTimetableByUserID.mockResolvedValue({
            data: [
                { module_code: 'CS1101S', user_id: MOCK_USER_ID },
                { module_code: 'MA1521', user_id: MOCK_USER_ID }
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
        mockGetTimetableByUserID.mockResolvedValue({
            data: [],
            error: null
        });

        const res = await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });

    test('returns 500 when DB returns an error', async () => {
        mockGetTimetableByUserID.mockResolvedValue({
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
        mockGetTimetableByUserID.mockResolvedValue({
            data: [],
            error: null
        });

        await request(app)
            .get('/timetable')
            .set('Authorization', AUTH_HEADER);

        expect(mockGetTimetableByUserID).toHaveBeenCalledWith(MOCK_USER_ID);
    });
});

// ─── POST /timetable ──────────────────────────────────────────────────────────

describe('POST /timetable', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser.mockResolvedValue({
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
        mockUpsertTimetableEntry.mockResolvedValue({
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
        mockUpsertTimetableEntry.mockResolvedValue({
            data: [{ module_code: 'CS1101S', user_id: MOCK_USER_ID }],
            error: null
        });

        await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        expect(mockUpsertTimetableEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: MOCK_USER_ID,
                module_code: 'CS1101S'
            })
        );
    });

    test('returns 500 when upsert fails', async () => {
        mockUpsertTimetableEntry.mockResolvedValue({
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
        mockGetUser.mockRejectedValue(new Error('Invalid JWT'));

        const res = await request(app)
            .post('/timetable')
            .set('Authorization', AUTH_HEADER)
            .send({ module_code: 'CS1101S' });

        // timetable.js has no try-catch wrapping getUser → unhandled rejection → 500
        expect(res.status).toBe(500);
    });
});