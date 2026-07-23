import request from 'supertest';
import express from 'express';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('../../middleware/requireAuth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'user-123' };
        next();
    }
}));

jest.mock('../../db/userSem');
jest.mock('../../db/suPolicy');
jest.mock('../../db/timetable');
jest.mock('../../db/modules');
jest.mock('../../db/userProfile');

import * as userSemDB from '../../db/userSem';
import * as suPolicyDB from '../../db/suPolicy';
import * as timetableDB from '../../db/timetable';
import * as moduleDB from '../../db/modules';
import * as userProfileDB from '../../db/userProfile';

import suRouter from '../../routes/su';

const app = express();
app.use(express.json());
app.use('/su', suRouter);

const mockGetSem = userSemDB.getUserSemByUserID as jest.MockedFunction<typeof userSemDB.getUserSemByUserID>;

const mockGetPolicy = suPolicyDB.getSuPolicy as jest.MockedFunction<typeof suPolicyDB.getSuPolicy>;

// NOTE: the route reads getSuInfo from db/userProfile, not db/userSuInfo
const mockGetSuInfo = userProfileDB.getSuInfo as jest.MockedFunction<typeof userProfileDB.getSuInfo>;

const mockGetTimetable = timetableDB.getTimetableByUserID as jest.MockedFunction<typeof timetableDB.getTimetableByUserID>;

const mockGetSuEligible = moduleDB.getSuAbleModulesByCodes as jest.MockedFunction<typeof moduleDB.getSuAbleModulesByCodes>;

const POLICY = { total_su: 32, y1y2_cap: 20, y3y4_cap: 12 };

/**
 * The route logs to console.error on every caught failure. Silence it per-test
 * so the error-path tests don't spam the reporter, and keep a handle so those
 * tests can assert the log actually happened.
 */
let errSpy: ReturnType<typeof jest.spyOn>;

/** Wire up a full happy-path pipeline; override individual mocks per test. */
function mockHappyPath(opts: {
    sem?: number;
    usedSu?: number | null;
    timetable?: any[];
    suAble?: any[];
} = {}) {
    const {
        sem = 2,
        usedSu = 0,
        timetable = [],
        suAble = []
    } = opts;

    mockGetSem.mockResolvedValue(sem as any);
    mockGetPolicy.mockResolvedValue(POLICY as any);
    mockGetSuInfo.mockResolvedValue(
        usedSu === null ? null : ({ used_su: usedSu, total_su: 32 } as any)
    );
    mockGetTimetable.mockResolvedValue(timetable as any);
    mockGetSuEligible.mockResolvedValue({ data: suAble, error: null } as any);
}

beforeEach(() => {
    jest.clearAllMocks();
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    errSpy.mockRestore();
});

describe('GET /su', () => {

    test('returns 400 if semester has not been set', async () => {
        mockGetSem.mockResolvedValue(null as any);

        const res = await request(app).get('/su');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toBe('Missing semester data');
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('returns SU information successfully', async () => {
        mockHappyPath({
            usedSu: 4,
            timetable: [
                { module_code: 'CS1101S', module_name: 'Programming Methodology' }
            ],
            suAble: [{ module_code: 'CS1101S', is_su_eligible: true }]
        });

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();

        const su = res.body.data;
        expect(su.usedSu).toBe(4);
        expect(su.suPolicy.total_su).toBe(32);
        expect(su.modules).toHaveLength(1);
        expect(su.modules[0]).toMatchObject({
            module_code: 'CS1101S',
            module_name: 'Programming Methodology',
            is_su_eligible: true
        });

        // the route must forward the timetable's codes to the module lookup
        expect(mockGetSuEligible).toHaveBeenCalledWith(['CS1101S']);
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('returns null eligibility when module is not SU-able', async () => {
        mockHappyPath({
            timetable: [{ module_code: 'CS2100' }],
            suAble: []
        });

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.data.modules[0].is_su_eligible).toBeNull();
    });

    test('returns empty module list when timetable is empty', async () => {
        mockHappyPath({ timetable: [] });

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.data.modules).toEqual([]);
        expect(mockGetSuEligible).toHaveBeenCalledWith([]);
    });

    test('defaults usedSu to 0 when no SU record exists', async () => {
        mockHappyPath({ usedSu: null });

        const res = await request(app).get('/su');

        expect(res.status).toBe(200);
        expect(res.body.data.usedSu).toBe(0);
        expect(res.body.data.group_remaining).toBe(20);
        expect(res.body.data.userSuInfo).toBeNull();
    });

    describe('semester to SU group mapping', () => {
        test.each([
            [1, 'y1y2', 20],
            [2, 'y1y2', 20],
            [3, 'y1y2', 20],
            [4, 'y1y2', 20],
            [5, 'y3y4', 12],
            [6, 'y3y4', 12],
            [7, 'y3y4', 12],
            [8, 'y3y4', 12]
        ])('sem %i belongs to %s with cap %i', async (sem, group, cap) => {
            mockHappyPath({ sem });

            const res = await request(app).get('/su');

            expect(res.status).toBe(200);
            expect(res.body.data.currentGroup).toBe(group);
            expect(res.body.data.groupCap).toBe(cap);
        });

        test('looks up the policy using the derived matriculation year', async () => {
            mockHappyPath({ sem: 3 });

            await request(app).get('/su');

            expect(mockGetPolicy).toHaveBeenCalledWith(2);
        });
    });

    test('group_remaining subtracts usedSu from the y1y2 cap', async () => {
        mockHappyPath({ sem: 2, usedSu: 5 });

        const res = await request(app).get('/su');

        expect(res.body.data.groupCap).toBe(20);
        expect(res.body.data.usedSu).toBe(5);
        expect(res.body.data.group_remaining).toBe(15);
    });

    test('group_remaining subtracts usedSu from the y3y4 cap', async () => {
        mockHappyPath({ sem: 6, usedSu: 2 });

        const res = await request(app).get('/su');

        expect(res.body.data.groupCap).toBe(12);
        expect(res.body.data.usedSu).toBe(2);
        expect(res.body.data.group_remaining).toBe(10);
    });

    test('returns 500 when semester lookup fails', async () => {
        mockGetSem.mockRejectedValue(new Error('Database error'));

        const res = await request(app).get('/su');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toBe('Database error');
        expect(errSpy).toHaveBeenCalledWith(
            'Error fetching SU data:',
            expect.any(Error)
        );
    });

    test('returns 500 when timetable lookup fails', async () => {
        mockHappyPath({ usedSu: null });
        mockGetTimetable.mockRejectedValue(new Error('Timetable failed'));

        const res = await request(app).get('/su');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Timetable failed');
        expect(errSpy).toHaveBeenCalledWith(
            'Error fetching SU data:',
            expect.any(Error)
        );
    });

});

describe('POST /su/eligible', () => {

    const postEligible = (body: unknown) =>
        request(app).post('/su/eligible').send(body as any);

    test('returns eligible modules for the requested codes', async () => {
        mockGetSuEligible.mockResolvedValue({
            data: [
                { module_code: 'CS1101S', is_su_eligible: true },
                { module_code: 'CS2100', is_su_eligible: false }
            ],
            error: null
        } as any);

        const res = await postEligible([
            { moduleCode: 'CS1101S' },
            { moduleCode: 'CS2100' }
        ]);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeNull();
        expect(res.body.data).toHaveLength(2);
        expect(mockGetSuEligible).toHaveBeenCalledWith(['CS1101S', 'CS2100']);
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('handles an empty module list', async () => {
        mockGetSuEligible.mockResolvedValue({ data: [], error: null } as any);

        const res = await postEligible([]);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(mockGetSuEligible).toHaveBeenCalledWith([]);
    });

    test('coerces a null data field to an empty array', async () => {
        mockGetSuEligible.mockResolvedValue({ data: null, error: null } as any);

        const res = await postEligible([{ moduleCode: 'CS1101S' }]);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    test('returns 400 for a non-array body', async () => {
        const res = await postEligible({ moduleCode: 'CS1101S' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toBe('Invalid request body');
        expect(mockGetSuEligible).not.toHaveBeenCalled();
        expect(errSpy).not.toHaveBeenCalled();
    });

    test('returns 400 when an entry is missing moduleCode', async () => {
        const res = await postEligible([{ moduleCode: 'CS1101S' }, {}]);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid module code');
        expect(mockGetSuEligible).not.toHaveBeenCalled();
    });

    test('returns 400 when moduleCode is not a string', async () => {
        const res = await postEligible([{ moduleCode: 42 }]);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid module code');
        expect(mockGetSuEligible).not.toHaveBeenCalled();
    });

    test('returns 500 when the module lookup throws', async () => {
        mockGetSuEligible.mockRejectedValue(new Error('Lookup failed'));

        const res = await postEligible([{ moduleCode: 'CS1101S' }]);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toBe('Lookup failed');
        expect(errSpy).toHaveBeenCalledWith(
            'Error fetching eligible modules:',
            expect.any(Error)
        );
    });

    test('returns 500 when the module lookup returns an error', async () => {
        mockGetSuEligible.mockResolvedValue({
            data: null,
            error: new Error('Postgres exploded')
        } as any);

        const res = await postEligible([{ moduleCode: 'CS1101S' }]);

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Postgres exploded');
        expect(errSpy).toHaveBeenCalledWith(
            'Error fetching eligible modules:',
            expect.any(Error)
        );
    });

});