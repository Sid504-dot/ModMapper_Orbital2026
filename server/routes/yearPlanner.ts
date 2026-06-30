import express, { Request, Response } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import * as yearPlannerDB from '../db/yearPlanner';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);


router.get('/', async (req: Request, res: Response) => {

    try {
        const allProgrammes = await yearPlannerDB.getAllProgrammes();
        return res.json(allProgrammes);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ error: message });
    }

});

router.post('/select-programmes', async (req: Request, res: Response) => {
    
    const userID = req.user.id;

    const { programmeIDs } = req.body; //send in an array

    if (!Array.isArray(programmeIDs) || programmeIDs.length === 0) {
        return res.status(400).json({ error: 'programmeIDs must be a non-empty array' });
    }

    try {
        await yearPlannerDB.upsertProgrammes(userID, programmeIDs);
        return res.json('Success');
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ error: message });
    }

});

router.delete('/delete-user-programme', async (req: Request, res: Response) => {
    
    const userID = req.user.id;

    const { programmeID } = req.body; //send int

    if (!programmeID) {
        return res.status(400).json({ error: 'programmeIDs must be an integer' });
    }

    try {
        await yearPlannerDB.deleteProgrammes(userID, programmeID);
        return res.json('Success');
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ error: message });
    }
    
});

export default router;