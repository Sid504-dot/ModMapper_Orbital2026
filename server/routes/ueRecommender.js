const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const ueReccomenderDB = require('../db/ueRecommender');
const qnaEligibilityDB = require('../db/qnaEligibilty');
const embeddingServer = require('../services/embeddings');

router.post('/user-ue-prompt', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user } } = await supabase.auth.getUser(token);
    const userID = user?.id;

    if (!userID) {
        return res.status(401).json({ error: 'Unauthorized 2' });
    }

    const userInput = req.body.user_input;

    if (!userInput) {
        return res.status(400).json({ error: 'No content' });
    }

    try {
        let takenModules = await qnaEligibilityDB.getEligibleModules(userID);

        takenModules = takenModules.map(m => typeof m === 'string' ? m : m.module_code);

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

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: err.message || 'Internal server error'
        });
    }
});


module.exports = router;