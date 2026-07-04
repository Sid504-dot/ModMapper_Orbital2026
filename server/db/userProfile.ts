import supabase from './supabase';

export async function getUserProfile(userID: string) {
    const { data, error } = await supabase.from('user_profile').select().eq('user_id', userID).maybeSingle();
    if (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
    }
    return data;
}

export async function upsertUserProfile(userID: string, matricYear: number) {
    
    const { data, error } = await supabase
        .from('user_profile')
        .upsert({user_id: userID, start_matric_year: matricYear}, { onConflict: 'user_id' })
        .select();

    if (error) {
        throw new Error(`Error saving user profile: ${error.message}`);
    }

    return data;
}

