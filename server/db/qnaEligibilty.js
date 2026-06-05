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

async function getPostsForModule(moduleCode) {
    const { data, error } = await supabase
        .from('qna_posts')
        .select('*')
        .eq('module_code', moduleCode)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Error fetching posts: ${error.message}`);
    }
    return data;
}

async function getNumUpvotes(postId) {
    const { count, error } = await supabase
        .from('qna_upvotes')
        .select('post_id', { count: 'exact' , head: true })
        .eq('post_id', postId);

    if (error) {
        throw new Error(`Error fetching upvotes: ${error.message}`);
    }
    return count;
}

module.exports = {
    getEligibleModules,
    getPostsForModule,
    getNumUpvotes
};