import supabase from './supabase';

export async function getUserProfile(userID: string) {
    const { data: profileInfo, error: profileInfoError } = await supabase.from('user_profile').select('profile_name, interest, start_matric_year, used_su, gpa, major').eq('user_id', userID).maybeSingle();
    if (profileInfoError) {
        throw new Error(`Error fetching user profile: ${profileInfoError.message}`);
    }

    return profileInfo;
}

export async function getSuInfo(userId: string) {
    const { data, error } = await supabase.from('user_profile').select('used_su').eq('user_id', userId).maybeSingle();
    if (error) {
        throw new Error(`Error fetching SU info: ${error.message}`);
    }
    return data;
}


export async function upsertUserProfile(userID: string, matricYear: number, userInterest: string, name: string, usedSu: number, gpa: number, major: string) {
    
    const { data, error } = await supabase
        .from('user_profile')
        .upsert({user_id: userID, start_matric_year: matricYear, interest: userInterest, profile_name: name, used_su: usedSu, gpa: gpa, major: major}, { onConflict: 'user_id' })
        .select();

    if (error) {
        throw new Error(`Error saving user profile: ${error.message}`);
    }

    return data;
}

export async function changeProfileName(userID: string, newName: string) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ profile_name: newName })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing profile name: ${error.message}`);
    }

    return data;
}

export async function changeUserInterest(userID: string, newInterest: string) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ interest: newInterest })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing user interest: ${error.message}`);
    }

    return data;
}

export async function changeMatricYear(userID: string, newMatricYear: number) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ start_matric_year: newMatricYear })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing matric year: ${error.message}`);
    }

    return data;
}

export async function changeUsedSu(userID: string, newUsedSu: number) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ used_su: newUsedSu })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing used SU: ${error.message}`);
    }
    return data;
}

export async function changeGpa(userID: string, newGpa: number) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ gpa: newGpa })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing GPA: ${error.message}`);
    }
    return data;
}

export async function changeMajor(userID: string, newMajor: string) {
    const { data, error } = await supabase
        .from('user_profile')
        .update({ major: newMajor })
        .eq('user_id', userID)
        .select();

    if (error) {
        throw new Error(`Error changing major: ${error.message}`);
    }
    return data;
}

