const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const prereqTreeDB = require('../db/prereqTree');
const qnaEligibilityDB = require('../db/qnaEligibilty');


router.get('/prereq-tree', async (req, res) => {
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
        const ans = await prereqTreeDB.UserPrereqTree(userID);
        return res.json(ans);
    } catch (error) {
        console.error('Error fetching data in prereq-tree', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});


router.post('/refresh-prereq-tree', async (req, res) => {
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
        const takenModules = await qnaEligibilityDB.getEligibleModules(userID);
        await prereqTreeDB.updatePlanModules(takenModules, userID, 'taken');
        res.status(200).json('Success');
    } catch (error) {
        console.error('Error fetching data in refresh-prereq-tree', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

router.post('/add-module-tree', async (req, res) => {
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
    const moduleCode = req.body.module_code;

    try {
        const m = await prereqTreeDB.fulfilledPreclusionsSoCantTakeMod(userID, moduleCode);
        if (m) {
            return res.json({success: false,
                preclusion: m
            })
        }
        const need = await prereqTreeDB.missingPrereq(userID, moduleCode);

        if (need.length === 0){
            await prereqTreeDB.updatePlanModules([moduleCode],userID,'planned');
            return res.json({success: true})
        } else {
            return res.json({success: false,
                prereq: need
            })
        }
    } catch (error) {
        console.error('Error fetching data', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/delete-planned-module', async (req, res) => {
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

    const moduleCode = req.body.module_code;

    try {
        if (await prereqTreeDB.isModulePlanned(userID, moduleCode)) {
            await prereqTreeDB.deletePlannedModule(userID, moduleCode);
            return res.json('Module Successfully Deleted');
        }

        return res.json('Module already taken, cannot be deleted');
    } catch (error) {
        console.error('Error fetching data in prereq-tree', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});


module.exports = router;