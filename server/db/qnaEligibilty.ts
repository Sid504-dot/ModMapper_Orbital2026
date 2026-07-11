import supabase from './supabase';
import { getUserSemByUserID } from './userSem';

export async function getEligibleModules(userID: string) {
    const currentSem = await getUserSemByUserID(userID);

    const {data , error} = await supabase
        .from('user_timetable')
        .select()
        .eq('user_id', userID)
        .lt('sem_number', currentSem);

    if (error) {
        throw new Error(`Error fetching timetable: ${error.message}`);
    }

    const codes = new Set<string>();
    for (const row of data) {
        for (const slot of row.timetable_data) {
            codes.add(slot.module_code);
        }
    }
    return [...codes];
}

export async function getPostsForModule(moduleCode: string) {
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

export async function getNumUpvotes(postId: string) {
    const { count, error } = await supabase
        .from('qna_upvotes')
        .select('post_id', { count: 'exact' , head: true })
        .eq('post_id', postId);

    if (error) {
        throw new Error(`Error fetching upvotes: ${error.message}`);
    }
    return count;
}

