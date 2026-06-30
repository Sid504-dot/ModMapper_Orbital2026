import express, { Request, Response } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import * as ueReccomenderDB from '../db/ueRecommender';
import * as qnaEligibilityDB from '../db/qnaEligibilty';
import * as embeddingServer from'../services/embeddings';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.post('/user-ue-prompt', async (req: Request, res: Response) => {
    const userID = req.user.id;

    const userInput = req.body.user_input;

    if (!userInput) {
        return res.status(400).json({ error: 'No content' });
    }

    try {
        let takenModules = await qnaEligibilityDB.getEligibleModules(userID);

        takenModules = takenModules.map((m: any) => typeof m === 'string' ? m : m.module_code);

        let expandedUserInput = userInput;

        try {
            expandedUserInput = await embeddingServer.expandUserText(userInput);
        } catch (err) {
            console.error('expandUserText failed:', err);
        }

        const queryVec = await embeddingServer.embed(expandedUserInput, 'RETRIEVAL_QUERY');

        const { data, error } = await supabase.rpc(
            'match_modules',
            {
                query_embedding: JSON.stringify(queryVec),
                taken_codes: takenModules,
                match_count: 30,
            }
        );

        if (error) {
            throw new Error(`match_modules failed: ${error.message}`);
        }

        const modulesJson = await ueReccomenderDB.fetchModules(data, userID);

        try {
            const ans = await embeddingServer.rerankAndRationale(userInput, modulesJson);

            if (ans?.length > 0) {
                return res.json(ans);
            }
        } catch (err) {
            console.error('rerank failed:', err);
        }

        return res.json(modulesJson);

    } catch (err: unknown) {
        console.error(err);

        const message = err instanceof Error ? err.message : 'Internal server error';

        return res.status(500).json({
            error: message
        });
    }
});


export default router;