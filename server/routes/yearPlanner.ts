const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const yearPlannerDB = require('../db/yearPlanner');


router.get('/', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error: authError } = await supabase.auth.getUser(token);
    const userID = data?.user?.id;
    if (authError || !userID) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const allProgrammes = await yearPlannerDB.getAllProgrammes();
        return res.json(allProgrammes);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

});

router.post('/select-programmes', async (req, res) => {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error: authError } = await supabase.auth.getUser(token);
    const userID = data?.user?.id;
    if (authError || !userID) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { programmeIDs } = req.body; //send in an array

    if (!Array.isArray(programmeIDs) || programmeIDs.length === 0) {
        return res.status(400).json({ error: 'programmeIDs must be a non-empty array' });
    }

    try {
        await yearPlannerDB.upsertProgrammes(userID, programmeIDs);
        return res.json('Success');
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

});

router.delete('/delete-user-programme', async (req, res) => {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error: authError } = await supabase.auth.getUser(token);
    const userID = data?.user?.id;
    if (authError || !userID) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { programmeID } = req.body; //send int

    if (!programmeID) {
        return res.status(400).json({ error: 'programmeIDs must be an integer' });
    }

    try {
        await yearPlannerDB.deleteProgrammes(userID, programmeID);
        return res.json('Success');
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
    
});

module.exports = router;