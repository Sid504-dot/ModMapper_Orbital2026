import express, { Request, Response } from 'express';
const router = express.Router();
import * as userProfileDB from '../db/userProfile';
import * as userSemDB from '../db/userSem';
import * as timetableDB from '../db/timetable';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/userProfile', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    
    try {
        const userProfile = await userProfileDB.getUserProfile(userID);
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: userProfile,
            error: null
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


router.post('/userProfile', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { matricYear, userInterest, name, usedSu, currentGPA, major } = req.body;

        if (!matricYear) {
            return res.status(400).json({
                success: false,
                message: 'Matric year is required',
                data: null,
                error: 'Missing matricYear'
            });
        }

        const userProfile = await userProfileDB.upsertUserProfile(userID, matricYear, userInterest, name, usedSu, currentGPA, major);

        return res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            data: userProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating user profile:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update user profile',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


router.post('/updateUsedSu', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newUsedSu } = req.body;

        if (newUsedSu === undefined) {
            return res.status(400).json({
                success: false,
                message: 'New used SU value is required',
                data: null,
                error: 'Missing newUsedSu'
            });
        }

        const updatedProfile =
            await userProfileDB.changeUsedSu(userID, newUsedSu);

        return res.status(200).json({
            success: true,
            message: 'Used SU updated successfully',
            data: updatedProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating used SU:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update used SU',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/updateProfileName', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newName } = req.body;
        
        if (!newName) {
            return res.status(400).json({
                success: false,
                message: 'New profile name is required',
                data: null,
                error: 'Missing newName'
            });
        }

        const updatedProfile =
            await userProfileDB.changeProfileName(userID, newName);

        return res.status(200).json({
            success: true,
            message: 'Profile name updated successfully',
            data: updatedProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating profile name:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update profile name',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/updateUserInterest', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newInterest } = req.body;

        if (!newInterest) {
            return res.status(400).json({
                success: false,
                message: 'New user interest is required',
                data: null,
                error: 'Missing newInterest'
            });
        }

        const updatedProfile =
            await userProfileDB.changeUserInterest(userID, newInterest);

        return res.status(200).json({
            success: true,
            message: 'User interest updated successfully',
            data: updatedProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating user interest:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update user interest',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/updateMatricYear', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newMatricYear } = req.body;

        if (newMatricYear === undefined) {
            return res.status(400).json({
                success: false,
                message: 'New matric year is required',
                data: null,
                error: 'Missing newMatricYear'
            });
        }

        const updatedProfile =
            await userProfileDB.changeMatricYear(userID, newMatricYear);

        return res.status(200).json({
            success: true,
            message: 'Matric year updated successfully',
            data: updatedProfile,
            error: null
        });
        
    } catch (error) {
        console.error('Error updating matric year:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update matric year',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/numPreviousSemesters', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const currentSem = await userSemDB.getUserSemByUserID(userID);
        const numPreviousSemesters = currentSem ? currentSem - 1 : 0;
        
        return res.status(200).json({
            success: true,
            message: 'Number of previous semesters fetched successfully',
            data: numPreviousSemesters,
            error: null
        });

    } catch (error) {
        console.error('Error fetching number of previous semesters:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch number of previous semesters',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});


router.post('/add-previous-sems', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    const entryData = {
        ...req.body,
        user_id: userID,
    };

    try {
        const data = await timetableDB.upsertTimetableEntryWithSemNum(entryData);

        return res.status(200).json({
            success: true,
            message: 'Timetable entry saved successfully',
            data,
            error: null
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: 'Failed to save timetable entry',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.post('/updateGpa', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newGpa } = req.body;

        if (newGpa === undefined) {
            return res.status(400).json({
                success: false,
                message: 'New GPA value is required',
                data: null,
                error: 'Missing newGpa'
            });
        }

        const updatedProfile =
            await userProfileDB.changeGpa(userID, newGpa);

        return res.status(200).json({
            success: true,
            message: 'GPA updated successfully',
            data: updatedProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating GPA:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update GPA',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/updateMajor', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const { newMajor } = req.body;

        if (!newMajor) {
            return res.status(400).json({
                success: false,
                message: 'New major is required',
                data: null,
                error: 'Missing newMajor'
            });
        }

        const updatedProfile =
            await userProfileDB.changeMajor(userID, newMajor);

        return res.status(200).json({
            success: true,
            message: 'Major updated successfully',
            data: updatedProfile,
            error: null
        });

    } catch (error) {
        console.error('Error updating major:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update major',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;