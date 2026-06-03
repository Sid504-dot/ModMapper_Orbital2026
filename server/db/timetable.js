const supabase = require('./supabase');
const userSemDB = require('./userSem');

async function getTimetableByUserID(userID) {
    const sem = await userSemDB.getUserSemByUserID(userID);
    return supabase.from('user_timetable').select().eq('user_id', userID).eq('sem_number', sem);
}

async function upsertTimetableEntry(entryData) {
    const sem = await userSemDB.getUserSemByUserID(entryData.user_id);
    entryData.sem_number = sem;
    return supabase.from('user_timetable')
        .upsert(entryData, { onConflict: 'user_id,sem_number' })
        .select();
}

module.exports = {
    getTimetableByUserID,
    upsertTimetableEntry
};