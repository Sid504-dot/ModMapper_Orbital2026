const supabase = require('./supabase');

async function getSuPolicy(cohortStartYear) {
    const { data, error } = await supabase.from('su_policy').select().eq('cohort_start_year', cohortStartYear).single();
    if (error) {
        throw new Error(`Error fetching SU policy: ${error.message}`);
    }
    return data;
}

module.exports = {
    getSuPolicy,
};