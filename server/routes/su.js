const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const suPolicy = require('../db/suPolicy');
const userProfileDB = require('../db/userProfile');
const timetableDB = require('../db/timetable');
const userSuInfoDB = require('../db/userSuInfo');
const moduleDB = require('../db/modules');

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

        const matricYear = (await userProfileDB.getUserProfile(userID)).matric_year;
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1; 
        const temp = year - matricYear;
        let whichYear = 1;
        if(temp === 0) {
            whichYear = 1;
        } else if(temp === 1) {
            if(month >= 7) {
                whichYear = 2;
            } else {
                whichYear = 1;
            }
        } else if(temp === 2) {
            if(month >= 7) {
                whichYear = 3;
            } else {
                whichYear = 2;
            }
        } else if(temp === 3) {
            if(month >= 7) {
                whichYear = 4;
            } else {
                whichYear = 3;
            }
        } else {
            whichYear = 4;
        }
        
        const suPolicyData = await suPolicy.getSuPolicy(matricYear);
        const userSuInfoData = await userSuInfoDB.getSuInfo(userID);

        const groupCap = whichYear <= 2 ? suPolicyData.y1y2_cap : suPolicyData.y3y4_cap;
        const currentGroup = whichYear <= 2 ? 'y1y2' : 'y3y4'; 

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
    } catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
    const userID = user.id;

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
    }
});

router.post('/info', async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];

    if(!token) {
        return res.status(401).json({error: 'Unauthorized 1'});
    }

    try{
        const {data: {user}} = await supabase.auth.getUser(token);
    } catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
    const userID = user.id;

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
    }
});

module.exports = router;