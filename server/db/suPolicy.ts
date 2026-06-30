import supabase from './supabase';

export async function getSuPolicy(cohortStartYear: number) {
    const { data, error } = await supabase.from('su_policy').select().eq('cohort_start_year', cohortStartYear).maybeSingle();
    if (error) {
        throw new Error(`Error fetching SU policy: ${error.message}`);
    }
    return data;
}

