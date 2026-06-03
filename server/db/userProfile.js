const supabase = require('./supabase');

async function getUserProfile(userID) {
    const { data, error } = await supabase.from('user_profile').select().eq('user_id', userID).single();
    if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
    }
    return data;
}

async function upsertUserProfile(userID, matricYear) {
    const { data, error } = await supabase.from('user_profile').upsert({ user_id: userID, start_matric_year: matricYear }, { onConflict: 'user_id' }).select();
    if (error) {
        throw new Error(`Error upserting user profile: ${error.message}`);
    }
    return data;
}

module.exports = {
    getUserProfile,
    upsertUserProfile
};