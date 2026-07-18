import * as heatMapDB from '../db/heatMap';
import cron from 'node-cron';
import supabase from '../db/supabase';

const JANUARY = 1;
const JULY = 7;
const AUGUST = 8;
const DECEMBER = 12;

const MAINTENANCE_DATE_MID_MONTH = 15;
const MAINTENANCE_DATE_END_MONTH = 28;

const SEM1_BIDDING_START_DAY = 25;
const SEM1_BIDDING_END_DAY = 20; 
const SEM2_BIDDING_START_DAY = 25;
const SEM2_BIDDING_END_DAY = 20;

const SEASON_WIPE_DATE = 15;

function isBiddingWindow(date: number, month: number): boolean {
    return (
        (date >= SEM1_BIDDING_START_DAY && month === JULY) ||
        (date <= SEM1_BIDDING_END_DAY && month === AUGUST) ||
        (date >= SEM2_BIDDING_START_DAY && month === DECEMBER) ||
        (date <= SEM2_BIDDING_END_DAY && month === JANUARY)
    );
}

function isMonthlyMaintenanceDate(date: number): boolean {
    return date === MAINTENANCE_DATE_MID_MONTH || date === MAINTENANCE_DATE_END_MONTH;
}

function isSeasonWipeDate(date: number, month: number): boolean {
    return date === SEASON_WIPE_DATE && (month === JULY || month === DECEMBER);
}

async function runHeatMapRefresh(label: string, includeMonthlyMaintenance: boolean) {
    const now = new Date();
    const date = now.getDate();
    const month = now.getMonth() + 1;

    const { data: modules, error } = await supabase
        .from('modules')
        .select('module_code');

    if (error) {
        console.error(`${label}: error fetching modules: ${error.message}`);
        return;
    }

    if (includeMonthlyMaintenance && isSeasonWipeDate(date, month)) {
        const { error: delError } = await supabase
            .from('slot_demand')
            .delete()
            .neq('module_code', '');

        if (delError) {
            console.error(`${label}: slot_demand wipe failed: ${delError.message}`);
            return;
        }
        console.log(`${label}: cleared slot_demand table`);
    }

    const flag = (includeMonthlyMaintenance && isMonthlyMaintenanceDate(date)) || isBiddingWindow(date, month);

    if (!flag) {
        console.log(`${label}: not a scheduled refresh day, skipping`);
        return;
    }

    if (!modules || modules.length === 0) {
        console.log(`${label}: no modules found, skipping`);
        return;
    }

    for (const row of modules) {
        try {
            await heatMapDB.needToUpdateSlotDemand(row.module_code);
        } catch (err) {
            console.error(`${label}: needToUpdateSlotDemand failed for ${row.module_code}:`, err);
        }
    }

    try {
        await heatMapDB.updateHeatMapForModules(modules.map(r => r.module_code));
    } catch (err) {
        console.error(`${label}: updateHeatMapForModules failed:`, err);
        return;
    }

    console.log(`${label}: heatMap refresh complete (${modules.length} modules)`);
}

const CRON_2AM = '0 2 * * *';
const CRON_2PM = '0 14 * * *';

cron.schedule(CRON_2AM, () => runHeatMapRefresh('2 AM refresh', true));
cron.schedule(CRON_2PM, () => runHeatMapRefresh('2 PM refresh', false));

console.log('Cron job for heatMap refresh has been set up');