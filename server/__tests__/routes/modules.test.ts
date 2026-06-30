const request = require('supertest');
const express = require('express');

// Mock both DB layer and NUSMods service before requiring the router
jest.mock('../../db/modules');
jest.mock('../../services/nusmods');

const modulesDB = require('../../db/modules');
const nusmodsService = require('../../services/nusmods');
const modulesRouter = require('../../routes/modules');

const app = express();
app.use(express.json());
app.use('/modules', modulesRouter);

// ─── GET /modules ────────────────────────────────────────────────────────────

describe('GET /modules', () => {
    beforeEach(() => jest.clearAllMocks());

    // ── Cache hit: module exists in DB ───────────────────────────────────────

    test('returns module data from DB when found', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({
            data: [{
                module_code: 'CS1101S',
                module_name: 'Programming Methodology',
                semesters: [],
                is_su_eligible: true
            }]
        });

        const res = await request(app).get('/modules?module_code=CS1101S');

        expect(res.status).toBe(200);
        expect(res.body[0].module_code).toBe('CS1101S');
        // NUSMods should NOT be called — cache was hit
        expect(nusmodsService.moduleGetData).not.toHaveBeenCalled();
    });

    test('does not call NUSMods when module is found in DB', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({
            data: [{ module_code: 'MA1521', module_name: 'Calculus' }]
        });

        await request(app).get('/modules?module_code=MA1521');

        expect(nusmodsService.moduleGetData).not.toHaveBeenCalled();
    });

    // ── Cache miss: module not in DB, fetch from NUSMods ────────────────────

    test('fetches from NUSMods and upserts when module is not in DB', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({ data: [] });
        modulesDB.upsertModule.mockResolvedValue({ data: {} });
        nusmodsService.moduleGetData.mockResolvedValue({
            moduleCode: 'CS1101S',
            title: 'Programming Methodology',
            semesterData: [{ semester: 1 }],
            attributes: { su: true }
        });

        const res = await request(app).get('/modules?module_code=CS1101S');

        expect(res.status).toBe(200);
        expect(nusmodsService.moduleGetData).toHaveBeenCalledWith('CS1101S');
    });

    test('calls upsertModule with correct shape when fetching from NUSMods', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({ data: [] });
        modulesDB.upsertModule.mockResolvedValue({ data: {} });
        nusmodsService.moduleGetData.mockResolvedValue({
            moduleCode: 'CS1101S',
            title: 'Programming Methodology',
            semesterData: [{ semester: 1 }],
            attributes: { su: true }
        });

        await request(app).get('/modules?module_code=CS1101S');

        expect(modulesDB.upsertModule).toHaveBeenCalledWith(
            expect.objectContaining({
                module_code: 'CS1101S',
                module_name: 'Programming Methodology',
                is_su_eligible: true
            })
        );
    });

    test('sets is_su_eligible to null when attributes.su is absent', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({ data: [] });
        modulesDB.upsertModule.mockResolvedValue({ data: {} });
        nusmodsService.moduleGetData.mockResolvedValue({
            moduleCode: 'ES2660',
            title: 'Communicating in the Information Age',
            semesterData: [],
            attributes: {}   // no 'su' field
        });

        await request(app).get('/modules?module_code=ES2660');

        expect(modulesDB.upsertModule).toHaveBeenCalledWith(
            expect.objectContaining({ is_su_eligible: null })
        );
    });

    // ── NUSMods failure ──────────────────────────────────────────────────────

    test('returns 500 if NUSMods fetch fails when module is not in DB', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({ data: [] });
        nusmodsService.moduleGetData.mockRejectedValue(new Error('NUSMods API down'));

        const res = await request(app).get('/modules?module_code=INVALID999');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Failed to fetch module data from NUSMods');
    });

    test('returns 500 if NUSMods fetch returns null data', async () => {
        modulesDB.getModuleByCode.mockResolvedValue({ data: null });
        nusmodsService.moduleGetData.mockRejectedValue(new Error('Not found'));

        const res = await request(app).get('/modules?module_code=INVALID999');

        expect(res.status).toBe(500);
    });
});
