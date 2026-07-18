import express, { Request, Response } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import * as ueReccomenderDB from '../db/ueRecommender';
import * as qnaEligibilityDB from '../db/qnaEligibilty';
import * as embeddingServer from '../services/embeddings';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.post('/user-ue-prompt', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const userInput = req.body.user_input;

    if (!userInput) {
        return res.status(400).json({
            success: false,
            message: 'User input is required',
            data: null,
            error: 'No content'
        });
    }

    try {
        let takenModules = await qnaEligibilityDB.getEligibleModules(userID);

        takenModules = takenModules.map((m: any) =>
            typeof m === 'string' ? m : m.module_code
        );

        let expandedUserInput = userInput;

        try {
            expandedUserInput = await embeddingServer.expandUserText(userInput);
        } catch (err) {
            console.error('expandUserText failed:', err);
        }

        const queryVec = await embeddingServer.embed(expandedUserInput, 'RETRIEVAL_QUERY');

        const { data, error } = await supabase.rpc('match_modules', {
            query_embedding: JSON.stringify(queryVec),
            taken_codes: takenModules,
            match_count: 30,
        });

        if (error) {
            throw new Error(`match_modules failed: ${error.message}`);
        }

        const modulesJson = await ueReccomenderDB.fetchModules(data, userID);

        try {
            const ans =
                await embeddingServer.rerankAndRationale(userInput, modulesJson);

            if (ans?.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Recommendations generated with reranking',
                    data: ans,
                    error: null
                });
            }
        } catch (err) {
            console.error('rerank failed:', err);
        }

        return res.status(200).json({
            success: true,
            message: 'Recommendations generated',
            data: modulesJson,
            error: null
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations',
            data: null,
            error: err instanceof Error ? err.message : 'Internal server error'
        });
    }
});

export default router;