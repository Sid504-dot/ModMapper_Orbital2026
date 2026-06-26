const express = require('express');
const router = express.Router();
const timetableDB = require('../db/timetable');
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;

    req.user = userID;
    const sem = req.query.sem;

    const { data, error } = await timetableDB.getTimetableByUserID(userID, sem);
    
    if (error) {
        return res.status(500).json({ error: 'Failed to fetch timetable 1' });
    }

    res.json(data);

})

router.post('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;

    req.user = userID;
    const entryData = req.body;
    entryData.user_id = userID;

    const { data, error } = await timetableDB.upsertTimetableEntry(entryData);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
})

module.exports = router;   

