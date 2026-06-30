import supabase from './supabase';

export async function getUserProfile(userID: String) {
    const { data, error } = await supabase.from('user_profile').select().eq('user_id', userID).maybeSingle();
    if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
    }
    return data;
}

export async function upsertUserProfile(userID: String, matricYear: number) {
    const { data: existing, error: selErr } = await supabase
        .from('user_profile')
        .select('user_id')
        .eq('user_id', userID)
        .maybeSingle();

    if (selErr) {
        throw new Error(`Error checking user profile: ${selErr.message}`);
    }

    const query = existing
        ? supabase
            .from('user_profile')
            .update({ start_matric_year: matricYear })
            .eq('user_id', userID)
        : supabase
            .from('user_profile')
            .insert({
                user_id: userID,
                start_matric_year: matricYear
            });

    const { data, error } = await query.select();

    if (error) {
        throw new Error(`Error saving user profile: ${error.message}`);
    }

    return data;
}

