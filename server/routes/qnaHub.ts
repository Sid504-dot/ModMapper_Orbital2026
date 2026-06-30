import express, { Request, Response } from 'express';
import supabase from '../db/supabase';
import qnaEligibilityDB from '../db/qnaEligibilty';
import authRequire from '../middleware/requireAuth';

const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
    const userID = req.user.id;
    
    try {
        const modules = await qnaEligibilityDB.getEligibleModules(userID);
        res.json(modules);
    } catch (err) {
        console.error('Failed to fetch eligible modules:', err);
        res.status(500).json({ error: 'Failed to fetch eligible modules' });
    }
    
});


router.get('/:moduleCode/posts', async (req: Request, res: Response) => {
    
    const userID = req.user.id;
    const moduleCode = req.params.moduleCode;
    
    try {
        const posts = await qnaEligibilityDB.getPostsForModule(moduleCode);
        type Post = { id: string | number; parent_id: string | number | null; replies: Post[]; [key: string]: any };
        const postMap: Post[] = posts.map((p: any) => ({ ...p, replies: [] } as Post));
        const postIdToPost: Record<string | number, Post> = {};
        for (const post of postMap) {
            postIdToPost[post.id] = post;
        }
        for (const post of posts) {
            if (post.parent_id) {
                const parentPost = postIdToPost[post.parent_id];
                if (parentPost) {
                    parentPost.replies.push(post as Post);
                }
            }
        }
        res.json(postMap.filter(p => p.parent_id === null));
    } catch (err) {
        console.error('Failed to fetch posts for module:', err);
        res.status(500).json({ error: 'Failed to fetch posts for module' });
    }
    
});

router.post('/:moduleCode/posts', async (req: Request, res: Response) => {
    
    const userID = req.user.id;
    const moduleCode = req.params.moduleCode;
    const { type, content, parent_id } = req.body;
    const { id: author_id, email: author_email } = req.user;
    
    if (type !== 'question' && type !== 'answer') {
        return res.status(400).json({ error: 'Invalid post type' });
    }
    if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Content cannot be empty' });
    }
    if (type === 'answer' && !parent_id) {
        return res.status(400).json({ error: 'Answer must have a parent question ID' });
    }
    if (type === 'question' && parent_id) {
        return res.status(400).json({ error: 'Question cannot have a parent ID' });
    }
    if (type === 'answer') {
        try {
            const { data: parentPost, error: fetchError } = await supabase
                .from('qna_posts')
                .select('*')
                .eq('id', parent_id)
                .eq('module_code', moduleCode)
                .single();

            if (fetchError) {
                throw new Error(`Error fetching parent post: ${fetchError.message}`, {cause: fetchError});
            }
            if (parentPost.type !== 'question') {
                return res.status(400).json({ error: 'Parent post must be a question' });
            }
        }  catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('Failed to fetch parent post:', errorMessage);
            return res.status(400).json({ error: 'Invalid parent post ID' });
        }
    }
    try {
        if (type === 'answer') {
            const eligibleModules = await qnaEligibilityDB.getEligibleModules(userID);
            if (!eligibleModules.includes(moduleCode)) {
                return res.status(403).json({ error: 'Forbidden: Not eligible for this module' });
            }
        }
        const { data, error } = await supabase
            .from('qna_posts')
            .insert({
                module_code: moduleCode,
                author_id,
                author_email,
                type,
                content,
                parent_id: parent_id || null
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error creating post: ${error.message}`, { cause: error });
        }
        res.status(201).json(data);
    } catch (err) {
        console.error('Failed to create post:', err);
        res.status(500).json({ error: 'Failed to create post' });
    }
    
});

router.delete('/posts/:postId', async (req: Request, res: Response) => {
    const userID = req.user.id;
    const postId = req.params.postId;
    
    try {
        const { data: post, error: fetchError } = await supabase
            .from('qna_posts')
            .select('*')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError) {
            throw new Error(`Error fetching post: ${fetchError.message}`, { cause: fetchError });
        }
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (post.author_id !== userID) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
        }
        
        const { error: deleteError } = await supabase
            .from('qna_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            throw new Error(`Error deleting post: ${deleteError.message}`);
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Failed to delete post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
    
});


router.post('/posts/:id/upvote', async (req: Request, res: Response) => {
    
    const userID = req.user.id;
    const postId = req.params.id;
    const { id : user_id } = req.user;

    try {
        const tryUpVote = await supabase
            .from('qna_upvotes')
            .insert({
                post_id: postId,
                user_id
            })
            .select()
            .single();

        if (tryUpVote.error) {
            if (tryUpVote.error.code === '23505') {
                const { error: deleteError } = await supabase
                    .from('qna_upvotes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user_id);

                if (deleteError) {
                    throw new Error(`Error removing upvote: ${deleteError.message}`, { cause: deleteError });
                }

                return res.json({
                    state : false,
                    upvotes: await qnaEligibilityDB.getNumUpvotes(postId)
                });
            }
            throw new Error(`Error toggling upvote: ${tryUpVote.error.message}`, { cause: tryUpVote.error }); 
        }

        return res.json({ 
            state : true,
            upvotes: await qnaEligibilityDB.getNumUpvotes(postId)
         });

    } catch (err) {
        console.error('Failed to toggle upvote:', err);
        res.status(500).json({ error: 'Failed to toggle upvote' });
    }
    
});


export default router;