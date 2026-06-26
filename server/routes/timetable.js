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

    try {
        const data = await timetableDB.getTimetableByUserID(userID);
        res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

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

    try {
        const data = await timetableDB.upsertTimetableEntry(entryData);
        res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;