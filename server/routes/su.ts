import express, { Request, Response } from 'express';
const router = express.Router();
import * as suPolicy from '../db/suPolicy';
import * as timetableDB from '../db/timetable';
import * as userSuInfoDB from '../db/userSuInfo';
import * as moduleDB from '../db/modules';
import * as userSemDB from '../db/userSem';
import * as userProfileDB from'../db/userProfile';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
    const userID = req.user.id;
    try {
        const sem = await userSemDB.getUserSemByUserID(userID);

        if (sem == null) {
            return res.status(400).json({
                error: 'Please set your matriculation year first.'
            });
        }

        const matricYear = Math.ceil(sem / 2) + sem % 2;

        const suPolicyData = await suPolicy.getSuPolicy(matricYear);
        const userSuInfoData = await userSuInfoDB.getSuInfo(userID);

        const groupCap =
            matricYear <= 2 ? suPolicyData.y1y2_cap : suPolicyData.y3y4_cap;

        const currentGroup = matricYear <= 2 ? 'y1y2' : 'y3y4';

        const usedSu = userSuInfoData?.used_su ?? 0;
        const totalSu = userSuInfoData?.total_su ?? suPolicyData.total_su;

        // FIX: getTimetableByUserID returns the data directly
        const timetableData = await timetableDB.getTimetableByUserID(userID);

        const moduleCodes = timetableData.map((entry: any) => entry.module_code);

        const suAbleModules =
            await moduleDB.getSuAbleModulesByCodes(moduleCodes);

        const modules = timetableData.map((entry: any) => {
            const mod = (suAbleModules.data ?? []).find(
                m => m.module_code === entry.module_code
            );

            return {
                ...entry,
                is_su_eligible: mod ? mod.is_su_eligible : null
            };
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
    } catch (error: unknown) {
        console.error('Error fetching SU data:', error);
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: message });
    }
});

router.post('/userProfile', async (req,res) => {
    const userID = req.user.id;

    try {

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

router.post('/info', async (req: Request, res: Response) => {
    const userID = req.user.id;

    try {

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

router.post('/eligible', async (req: Request, res: Response) => {
    const userID = req.user.id;

    try {
        
        const userReqModules = req.body.map((m: any) => m.moduleCode);
        const { data: suAbleModules } = await moduleDB.getSuAbleModulesByCodes(userReqModules);

        res.json({suAbleModules});
    } catch(error) {
        console.error('Error fetching user:', error);
        return res.status(401).json({error: 'Unauthorized 2'});
    }
});



export default router;