import request from 'supertest';
import express from 'express';
import router from '../../routes/ueRecommender';

import * as embeddingServer from '../../services/embeddings';
import * as qnaEligibilityDB from '../../db/qnaEligibilty';
import * as ueRecommenderDB from '../../db/ueRecommender';
import supabase from '../../db/supabase';

jest.mock('../../middleware/requireAuth', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { id: 'user-1' };
        next();
    }
}));

describe('UE Recommender', () => {
    const app = express();

    beforeAll(() => {
        app.use(express.json());
        app.use(router);
    });

    test('returns reranked recommendations successfully', async () => {
        jest.spyOn(qnaEligibilityDB, 'getEligibleModules')
            .mockResolvedValue(['CS1010']);

        jest.spyOn(embeddingServer, 'expandUserText')
            .mockResolvedValue('expanded');

        jest.spyOn(embeddingServer, 'embed')
            .mockResolvedValue([0.1, 0.2]);

        jest.spyOn(supabase, 'rpc')
            .mockResolvedValue({
                data: [{ module_code: 'CS2040S' }],
                error: null
            } as any);

        jest.spyOn(ueRecommenderDB, 'fetchModules')
            .mockResolvedValue([
                {
                    module_code: 'CS2040S',
                    eligibility_status: 'eligible'
                }
            ] as any);

        jest.spyOn(embeddingServer, 'rerankAndRationale')
            .mockResolvedValue([
                {
                    module_code: 'CS2040S',
                    rank: 1,
                    rationale: 'Good match',
                    eligibility_status: 'eligible'
                }
            ] as any);

        const res = await request(app)
            .post('/user-ue-prompt')
            .send({ user_input: 'AI' });

        expect(res.status).toBe(200);
        expect(res.body[0].module_code).toBe('CS2040S');
    });

    test('returns raw modules when rerank fails', async () => {
        jest.spyOn(qnaEligibilityDB, 'getEligibleModules')
            .mockResolvedValue([]);

        jest.spyOn(embeddingServer, 'expandUserText')
            .mockResolvedValue('expanded');

        jest.spyOn(embeddingServer, 'embed')
            .mockResolvedValue([0.1]);

        jest.spyOn(supabase, 'rpc')
            .mockResolvedValue({
                data: [{ module_code: 'CS2040S' }],
                error: null
            } as any);

        jest.spyOn(ueRecommenderDB, 'fetchModules')
            .mockResolvedValue([
                {
                    module_code: 'CS2040S',
                    eligibility_status: 'eligible'
                }
            ] as any);

        jest.spyOn(embeddingServer, 'rerankAndRationale')
            .mockRejectedValue(new Error('Gemini failed'));

        const res = await request(app)
            .post('/user-ue-prompt')
            .send({ user_input: 'AI' });

        expect(res.status).toBe(200);
        expect(res.body[0].module_code).toBe('CS2040S');
    });

    test('completed modules are excluded from recommendations', async () => {
        jest.spyOn(qnaEligibilityDB, 'getEligibleModules')
            .mockResolvedValue(['CS2030']);

        jest.spyOn(embeddingServer, 'expandUserText')
            .mockResolvedValue('expanded');

        jest.spyOn(embeddingServer, 'embed')
            .mockResolvedValue([0.1]);

        jest.spyOn(supabase, 'rpc')
            .mockResolvedValue({
                data: [{ module_code: 'CS2040S' }],
                error: null
            } as any);

        jest.spyOn(ueRecommenderDB, 'fetchModules')
            .mockResolvedValue([
                {
                    module_code: 'CS2040S',
                    eligibility_status: 'eligible'
                }
            ] as any);

        jest.spyOn(embeddingServer, 'rerankAndRationale')
            .mockResolvedValue([
                {
                    module_code: 'CS2040S',
                    rank: 1,
                    rationale: 'Good match',
                    eligibility_status: 'eligible'
                }
            ] as any);

        const res = await request(app)
            .post('/user-ue-prompt')
            .send({ user_input: 'Programming' });

        expect(res.status).toBe(200);
        expect(
            res.body.find((m: any) => m.module_code === 'CS2030')
        ).toBeUndefined();
    });
});