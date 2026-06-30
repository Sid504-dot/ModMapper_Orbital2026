const supabase = require('../db/supabase');
const express = require('express');
const router = express.Router();
const groupFreeFinderDB = require('../db/groupFreeFinder');

router.get('/group-free-finder/:groupId', async (req, res) => {
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

    const groupId = req.params.groupId;

    try {
        const ans = await groupFreeFinderDB.freeTimeFinder(groupId);
        return res.json(ans);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to compute free time' });
    }

});

module.exports = router;