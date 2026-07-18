import express, { Request, Response } from 'express';
import supabase from '../db/supabase';
import * as qnaEligibilityDB from '../db/qnaEligibilty';
import { requireAuth } from '../middleware/requireAuth';
const router = express.Router();
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const modules = await qnaEligibilityDB.getEligibleModules(userID);

        return res.status(200).json({
            success: true,
            message: 'Eligible modules fetched successfully',
            data: modules,
            error: null
        });

    } catch (err) {
        console.error('Failed to fetch eligible modules:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch eligible modules',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.get('/:moduleCode/posts', async (req: Request<{ moduleCode: string }>, res: Response<ApiResponse>) => {

    const moduleCode = req.params.moduleCode;

    try {
        const posts = await qnaEligibilityDB.getPostsForModule(moduleCode);

        type Post = {
            id: string | number;
            parent_id: string | number | null;
            replies: Post[];
            [key: string]: any;
        };

        const postMap: Post[] = posts.map((p: any) => ({ ...p, replies: [] }));
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

        const tree = postMap.filter(p => p.parent_id === null);

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            data: tree,
            error: null
        });

    } catch (err) {
        console.error('Failed to fetch posts for module:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch posts',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.post('/:moduleCode/posts', async (req: Request<{ moduleCode: string }>, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const moduleCode = req.params.moduleCode;
    const { type, content, parent_id } = req.body;
    const { id: author_id, email: author_email } = req.user;

    if (type !== 'question' && type !== 'answer') {
        return res.status(400).json({
            success: false,
            message: 'Invalid post type',
            data: null,
            error: 'type must be question or answer'
        });
    }

    if (!content || content.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Content cannot be empty',
            data: null,
            error: 'missing content'
        });
    }

    if (type === 'answer' && !parent_id) {
        return res.status(400).json({
            success: false,
            message: 'Answer must have parent question',
            data: null,
            error: 'missing parent_id'
        });
    }

    if (type === 'question' && parent_id) {
        return res.status(400).json({
            success: false,
            message: 'Question cannot have parent_id',
            data: null,
            error: 'invalid parent_id'
        });
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
                throw new Error(fetchError.message, { cause: fetchError });
            }

            if (parentPost.type !== 'question') {
                return res.status(400).json({
                    success: false,
                    message: 'Parent must be a question',
                    data: null,
                    error: 'invalid parent type'
                });
            }

        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parent post',
                data: null,
                error: err instanceof Error ? err.message : 'Unknown error'
            });
        }
    }

    try {
        if (type === 'answer') {
            const eligibleModules = await qnaEligibilityDB.getEligibleModules(userID);

            if (!eligibleModules.includes(moduleCode)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not eligible for this module',
                    data: null,
                    error: 'forbidden'
                });
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
            throw new Error(error.message, { cause: error });
        }

        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create post',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.delete('/posts/:postId', async (req: Request, res: Response<ApiResponse>) => {

    const userID = req.user.id;
    const postId = req.params.postId;

    try {
        const { data: post, error: fetchError } = await supabase
            .from('qna_posts')
            .select('*')
            .eq('id', postId)
            .maybeSingle();

        if (fetchError) throw new Error(fetchError.message);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
                data: null,
                error: 'not found'
            });
        }

        if (post.author_id !== userID) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                data: null,
                error: 'not owner'
            });
        }

        const { error: deleteError } = await supabase
            .from('qna_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) throw new Error(deleteError.message);

        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
            data: null,
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete post',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.post('/posts/:id/upvote', async (req: Request<{ id: string }>, res: Response<ApiResponse>) => {

    const postId = req.params.id;
    const { id: user_id } = req.user;

    try {
        const tryUpVote = await supabase
            .from('qna_upvotes')
            .insert({ post_id: postId, user_id })
            .select()
            .single();

        if (tryUpVote.error) {
            if (tryUpVote.error.code === '23505') {
                await supabase
                    .from('qna_upvotes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user_id);

                return res.status(200).json({
                    success: true,
                    message: 'Upvote removed',
                    data: {
                        state: false,
                        upvotes: await qnaEligibilityDB.getNumUpvotes(postId)
                    },
                    error: null
                });
            }

            throw new Error(tryUpVote.error.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Upvoted',
            data: {
                state: true,
                upvotes: await qnaEligibilityDB.getNumUpvotes(postId)
            },
            error: null
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle upvote',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

export default router;