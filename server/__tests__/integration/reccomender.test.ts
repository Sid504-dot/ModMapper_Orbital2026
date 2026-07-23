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

const app = express();
app.use(express.json());
app.use(router);

const post = (user_input: string) =>
    request(app).post('/user-ue-prompt').send({ user_input });

type Row = { module_code: string; eligibility_status?: string };

function mockPipeline(opts: {
    eligible?: string[];
    rpcRows?: Row[];
    modules?: Row[];
    reranked?: any[] | Error;
} = {}) {
    const {
        eligible = [],
        rpcRows = [{ module_code: 'CS2040S' }],
        modules = [{ module_code: 'CS2040S', eligibility_status: 'eligible' }],
        reranked = [{
            module_code: 'CS2040S',
            rank: 1,
            rationale: 'Good match',
            eligibility_status: 'eligible'
        }]
    } = opts;

    const spies = {
        getEligibleModules: jest.spyOn(qnaEligibilityDB, 'getEligibleModules')
            .mockResolvedValue(eligible as any),
        expandUserText: jest.spyOn(embeddingServer, 'expandUserText')
            .mockResolvedValue('expanded'),
        embed: jest.spyOn(embeddingServer, 'embed')
            .mockResolvedValue([0.1, 0.2]),
        rpc: jest.spyOn(supabase, 'rpc')
            .mockResolvedValue({ data: rpcRows, error: null } as any),
        fetchModules: jest.spyOn(ueRecommenderDB, 'fetchModules')
            .mockResolvedValue(modules as any),
        rerankAndRationale: jest.spyOn(embeddingServer, 'rerankAndRationale')
    };

    reranked instanceof Error
        ? spies.rerankAndRationale.mockRejectedValue(reranked)
        : spies.rerankAndRationale.mockResolvedValue(reranked as any);

    return spies;
}

describe('UE Recommender', () => {
    afterEach(() => jest.restoreAllMocks());

    test('returns reranked recommendations', async () => {
        mockPipeline();

        const res = await post('AI');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/reranking/);
        expect(res.body.error).toBeNull();
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({
            module_code: 'CS2040S',
            rationale: 'Good match'
        });
    });

    test('falls back to raw modules when rerank throws', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockPipeline({ reranked: new Error('Gemini failed') });

        const res = await post('AI');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Recommendations generated');
        expect(res.body.data[0].module_code).toBe('CS2040S');
        expect(res.body.data[0].rationale).toBeUndefined();
    });

    test('falls back to raw modules when rerank returns empty', async () => {
        mockPipeline({ reranked: [] });

        const res = await post('AI');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Recommendations generated');
        expect(res.body.data[0].module_code).toBe('CS2040S');
    });

    test('returns 500 when the pipeline throws', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mockPipeline();
        jest.spyOn(embeddingServer, 'embed')
            .mockRejectedValue(new Error('embed down'));

        const res = await post('AI');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toBe('embed down');
    });
});