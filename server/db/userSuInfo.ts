import supabase from './supabase';

export async function getSuInfo(userId: string) {
    const { data, error } = await supabase.from('user_su_info').select().eq('user_id', userId).maybeSingle();
    if (error) {
        throw new Error(`Error fetching SU info: ${error.message}`);
    }
    return data;
}

export async function upsertSuInfo(userId: string, totalSu: number, usedSu: number) {
    const { data, error } = await supabase.from('user_su_info').upsert({ user_id: userId, total_su: totalSu, used_su: usedSu }, { onConflict: 'user_id' }).select();
    if (error) {
        throw new Error(`Error upserting SU info: ${error.message}`);
    }
    return data;
}

