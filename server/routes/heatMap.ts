import express, { Request, Response } from 'express';
const router = express.Router();
import supabase from '../db/supabase';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    const moduleCode = req.query.moduleCode as string;

    if (!moduleCode) {
        return res.status(400).json({
            success: false,
            message: 'Module code is required',
            data: null,
            error: 'Missing moduleCode'
        });
    }

    try {
        const { data, error } = await supabase
            .from('slot_demand')
            .select('*')
            .eq('module_code', moduleCode);

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch heat map data',
                data: null,
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Heat map data fetched successfully',
            data: data,
            error: null
        });

    } catch (error) {
        console.error('Error fetching heat map data:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
