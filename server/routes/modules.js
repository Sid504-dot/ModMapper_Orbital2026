const express = require('express');
const router = express.Router();
const modulesDB = require('../db/modules');
const nusmodsService = require('../services/nusmods');

router.get('/', async (req, res) => {
    
    const b = req.query.module_code;
    const { data } = await modulesDB.getModuleByCode(b);
    
    if (!data || data.length === 0) {
        try {
            
            const newData = await nusmodsService.moduleGetData(b);
            await modulesDB.upsertModule({
                module_code: newData.moduleCode,
                module_name: newData.title,
                semesters: newData.semesterData,
                cached_at: new Date().toISOString(),
                is_su_eligible: newData.attributes?.su ?? null,
            });

            return res.json(newData);
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to fetch module data from NUSMods' });
        }
    }        
    return res.json(data);
});

module.exports = router;