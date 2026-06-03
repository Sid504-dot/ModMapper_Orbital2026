const supabase = require('../db/supabase');
const express = require('express');
const router = express.Router();
const qnaEligibilityDB = require('../db/qnaEligibilty');

router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
    
    try {
        const modules = await qnaEligibilityDB.getEligibleModules(userID);
        res.json(modules);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch eligible modules' });
    }
    
});

module.exports = router;