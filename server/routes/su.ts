import express, { Request, Response } from 'express';
const router = express.Router();
import * as suPolicy from '../db/suPolicy';
import * as timetableDB from '../db/timetable';
import * as moduleDB from '../db/modules';
import * as userSemDB from '../db/userSem';
import * as userProfileDB from '../db/userProfile';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const sem = await userSemDB.getUserSemByUserID(userID);

        if (sem == null) {
            return res.status(400).json({
                success: false,
                message: 'Matriculation year not set',
                data: null,
                error: 'Missing semester data'
            });
        }

        const matricYear = Math.ceil(sem / 2) + sem % 2;

        const suPolicyData = await suPolicy.getSuPolicy(matricYear);
        const userSuInfoData = await userProfileDB.getSuInfo(userID);

        const groupCap =
            matricYear <= 2 ? suPolicyData.y1y2_cap : suPolicyData.y3y4_cap;

        const currentGroup = matricYear <= 2 ? 'y1y2' : 'y3y4';

        const usedSu = userSuInfoData?.used_su ?? 0;

        const timetableData = await timetableDB.getTimetableByUserID(userID);

        const moduleCodes = timetableData.map((entry: any) => entry.module_code);

        const suAbleModules =
            await moduleDB.getSuAbleModulesByCodes(moduleCodes);

        const modules = timetableData.map((entry: any) => {
            const mod = (suAbleModules.data ?? []).find(
                (m: any) => m.module_code === entry.module_code
            );

            return {
                ...entry,
                is_su_eligible: mod ? mod.is_su_eligible : null
            };
        });

        return res.status(200).json({
            success: true,
            message: 'SU dashboard fetched successfully',
            data: {
                group_remaining: groupCap - usedSu,
                suPolicy: suPolicyData,
                timetable: timetableData,
                userSuInfo: userSuInfoData,
                groupCap,
                currentGroup,
                usedSu,
                modules
            },
            error: null
        });

    } catch (error) {
        console.error('Error fetching SU data:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch SU dashboard',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});




router.post('/eligible', async (req: Request, res: Response<ApiResponse>) => {

    try {
        const userReqModules =
            req.body.map((m: any) => m.moduleCode);

        const { data } =
            await moduleDB.getSuAbleModulesByCodes(userReqModules);

        return res.status(200).json({
            success: true,
            message: 'Eligible modules fetched successfully',
            data: data,
            error: null
        });

    } catch (error) {
        console.error('Error fetching eligible modules:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch eligible modules',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});




export default router;