import express, { Request, Response } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import * as prereqTreeDB from '../db/prereqTree';
import * as qnaEligibilityDB from '../db/qnaEligibilty';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);


router.get('/prereq-tree', async (req: Request, res: Response) => {
    const userID = req.user.id;
    
    try {
        const ans = await prereqTreeDB.UserPrereqTree(userID);
        return res.json(ans);
    } catch (error) {
        console.error('Error fetching data in prereq-tree', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});


router.post('/refresh-prereq-tree', async (req: Request, res: Response) => {
    const userID = req.user.id;

    try {
        const takenModules = await qnaEligibilityDB.getEligibleModules(userID);
        await prereqTreeDB.updatePlanModules(takenModules, userID, 'taken');
        res.status(200).json('Success');
    } catch (error) {
        console.error('Error fetching data in refresh-prereq-tree', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

router.post('/add-module-tree', async (req: Request, res: Response) => {
    const userID = req.user.id;
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

router.post('/delete-planned-module', async (req: Request, res: Response) => {
    const userID = req.user.id;
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


export default router;