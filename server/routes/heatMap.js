const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

router.get('/', async (req, res) => {
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

module.exports = router;