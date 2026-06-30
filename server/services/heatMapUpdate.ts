import * as heatMapDB from '../db/heatMap';
import cron from 'node-cron';
import supabase from'../db/supabase';

cron.schedule('0 2 * * *', async () => {
    const date = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const modules = await supabase
        .from('modules')
        .select('module_code');
        
    if (modules.error) {
        console.error(`Error fetching timetable: ${modules.error.message}`);
        return;
    }
    
    let flag = false;
    if ((date === 15  || date === 28) ||
        (date >= 25 && month === 7) || (date <= 20 && month === 8)
        || (date >= 25 && month === 12) || (date <= 20 && month === 1)) {
            flag = true;
    }

    if ((date === 15  && month === 7) || (date === 15 && month === 12)) {
        const { error: delError } = await supabase.from('slot_demand').delete().neq('module_code', '');
        if (delError) {
            console.error(`slot_demand wipe failed: ${delError.message}`);
            return;
        }
        console.log('Cleared slot_demand table');
    }

    if (flag) {
        for (const row of modules.data) {
            await heatMapDB.needToUpdateSlotDemand(row.module_code);
            await heatMapDB.updateHeatMap(row.module_code);
        }
        console.log('Running daily heatMap refresh at 2 AM');
    }
});

cron.schedule('0 14 * * *', async () => {
    const date = new Date().getDate();
    const month = new Date().getMonth() + 1;
    const modules = await supabase
        .from('modules')
        .select('module_code');
        
    if (modules.error) {
        console.error(`Error fetching timetable: ${modules.error.message}`);
        return;
    }

    let flag = false;
    if ((date >= 25 && month === 7) || (date <= 20 && month === 8)
        || (date >= 25 && month === 12) || (date <= 20 && month === 1)) {
            flag = true;
    }

    if (flag) {
        for (const row of modules.data ?? []) {
            await heatMapDB.needToUpdateSlotDemand(row.module_code);
            await heatMapDB.updateHeatMap(row.module_code);
        }
        console.log('Running daily heatMap refresh at 2 PM');
    }
});

console.log('Cron job for heatMap refresh has been set up');