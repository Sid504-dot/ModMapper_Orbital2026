const supabase = require('./supabase');
const userSemDB = require('./userSem');

async function getEligibleModules(userID) {
    const currentSem = await userSemDB.getUserSemByUserID(userID);

    const {data , error} = await supabase
        .from('user_timetable')
        .select()
        .eq('user_id', userID)
        .lt('sem_number', currentSem);

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    const codes = new Set();
    for (const row of data) {
        for (const slot of row.timetable_data) {
            codes.add(slot.module_code);
        }
    }
    return [...codes];
}

module.exports = {
    getEligibleModules
};