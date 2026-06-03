    const express = require('express');
    const router = express.Router();
    const timetableDB = require('../db/timetable');
    const supabase = require('../db/supabase');

    router.get('/', async (req, res) => {
        const token = req.headers.authorization.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized 1' });
        }
        
        const { data: { user }} = await supabase.auth.getUser(token);
        const userID = user.id;
        
        if(!userID) {
            return res.status(401).json({ error: 'Unauthorized 2' });
        }

        req.user = userID;
        const sem = req.sem;

        const { data, error } = await timetableDB.getTimetableByUserID(userID, sem);
        
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch timetable 1' });
        }

        res.json(data);

    })

    router.post('/', async (req, res) => {
        const token = req.headers.authorization.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized 3' });
        }
        
        const { data: { user }} = await supabase.auth.getUser(token);
        const userID = user.id;
        
        if(!userID) {
            return res.status(401).json({ error: 'Unauthorized 4' });
        }

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

