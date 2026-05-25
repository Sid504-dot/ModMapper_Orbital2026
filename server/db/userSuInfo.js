const supabase = require('./supabase');

async function getSuInfo(userId) {
    const { data, error } = await supabase.from('user_su_info').select().eq('user_id', userId).single();
    if (error) {
        throw new Error(`Error fetching SU info: ${error.message}`);
    }
    return data;
}

async function upsertSuInfo(userId, totalSu, usedSu) {
    const { data, error } = await supabase.from('user_su_info').upsert({ user_id: userId, total_su: totalSu, used_su: usedSu }, { onConflict: 'user_id' }).select();
    if (error) {
        throw new Error(`Error upserting SU info: ${error.message}`);
    }
    return data;
}

module.exports = {
    getSuInfo,
    upsertSuInfo
};