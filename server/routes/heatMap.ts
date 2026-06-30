import express, { Request, Response, Router } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
    const moduleCode = req.query.moduleCode;

    if (!moduleCode) {
        return res.status(400).json({ error: 'Module code is required' });
    }

    try {

        const slotDemandData = await supabase
            .from('slot_demand')
            .select('*')
            .eq('module_code', moduleCode);

        res.json({ data: slotDemandData.data });
    } catch (error) {
        console.error('Error fetching heat map data:', error);
        res.status(500).json({ error: 'Internal server error' });
     }
});

export default Router