const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const suPolicy = require('../db/suPolicy');
const timetableDB = require('../db/timetable');
const userSuInfoDB = require('../db/userSuInfo');
const moduleDB = require('../db/modules');
const userSemDB = require('../db/userSem');
const userProfileDB = require('../db/userProfile');

router.get('/', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
        
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized 1' });
    }
    
    try {
        const { data: { user }} = await supabase.auth.getUser(token);
        const userID = user.id;
        
        if(!userID) {
            return res.status(401).json({ error: 'Unauthorized 2' });
        }

        req.user = userID;
        let matricYear = 1;
        const sem = await userSemDB.getUserSemByUserID(userID);
        matricYear = Math.ceil(sem/2) + sem % 2;
        
        const suPolicyData = await suPolicy.getSuPolicy(matricYear);
        const userSuInfoData = await userSuInfoDB.getSuInfo(userID);

        const groupCap = matricYear <= 2 ? suPolicyData.y1y2_cap : suPolicyData.y3y4_cap;
        const currentGroup = matricYear <= 2 ? 'y1y2' : 'y3y4'; 

        const usedSu = userSuInfoData?.used_su ?? 0;
        const totalSu = userSuInfoData?.total_su ?? suPolicyData.total_su;

        const { data: timetableData } = await timetableDB.getTimetableByUserID(userID);
        const moduleCodes = timetableData.map(entry => entry.module_code);
        const { data: suAbleModules } = await moduleDB.getSuAbleModulesByCodes(moduleCodes);

        const modules = timetableData.map(entry => {
        const mod = suAbleModules.find(m => m.module_code === entry.module_code);
            return { ...entry, is_su_eligible: mod ? mod.is_su_eligible : null };
        });

        res.json({
            group_remaining: groupCap - usedSu,
            suPolicy: suPolicyData,
            timetable: timetableData,
            userSuInfo: userSuInfoData,
            groupCap,
            currentGroup,
            usedSu,
            totalSu,
            modules
        });
    } catch (error) {
        console.error('Error fetching SU data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/userProfile', async (req,res) => {
    const token = req.headers.authorization.split(" ")[1];

    if(!token) {
        return res.status(401).json({error: 'Unauthorized 1'});
    }

    try {
        const {data: {user}} = await supabase.auth.getUser(token);
        
        const userID = user.id;
        req.user = userID;

        if(!userID) {
            return res.status(401).json({error: 'Unauthorized 3'});
        }

        const {matricYear} = req.body;

        if(!matricYear) {
            return res.status(400).json({error: 'Matric year is required'});
        }

        try {
            const userProfile = await userProfileDB.upsertUserProfile(userID, matricYear);
            res.json({message: 'User profile updated successfully', userProfile});
        } catch(error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({error: 'Internal Server Error'});
    }} catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
});

router.post('/info', async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    if(!token) {
        return res.status(401).json({error: 'Unauthorized 1'});
    }

    try{
        const {data: {user}} = await supabase.auth.getUser(token); 
        const userID = user.id;
        req.user = userID;

        if(!userID) {
            return res.status(401).json({error: 'Unauthorized 3'});
        }

        const {totalSu, usedSU} = req.body;
        
        if(totalSu === undefined || usedSU === undefined) {
            return res.status(400).json({error: 'Total SU and Used SU are required'});
        }

        try {
            const userSuInfo = await userSuInfoDB.upsertSuInfo(userID, totalSu, usedSU);
            res.json({message: 'User SU info updated successfully', userSuInfo});
        } catch(error) {
            console.error('Error updating user SU info:', error);
            res.status(500).json({error: 'Internal Server Error'});
    }} catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
});

router.post('/eligible', async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    
    if(!token) {
        return res.status(401).json({error: 'Unauthorized 1'});
    }

    try {
        const {data: {user}} = await supabase.auth.getUser(token); 
        const userID = user.id;
        req.user = userID;

        if(!userID) {
            return res.status(401).json({error: 'Unauthorized 3'});
        }

        const userReqModules = req.body.map(m => m.moduleCode);
        const { data: suAbleModules } = await moduleDB.getSuAbleModulesByCodes(userReqModules);

        res.json({suAbleModules});
    } catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
});



module.exports = router;