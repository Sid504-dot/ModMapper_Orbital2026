import express, { Request, Response } from 'express';
const router = express.Router();
import * as groupsDB from '../db/groups';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);
import { ApiResponse } from '../types/apiResponse';

router.post('/create', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { groupName } = req.body;

    try {
        await groupsDB.createGroup(groupName, userID);

        return res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: null,
            error: null
        });

    } catch (err) {
        console.error('Failed to create group:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to create group',
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
});

router.get('/my-groups', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;

    try {
        const rows = await groupsDB.getGroupsForUser(userID);

        const groups = rows.map((r: any) => ({
            group_id: r.group_id,
            name: r.groups.name,
            owner_id: r.groups.owner_id
        }));

        return res.status(200).json({
            success: true,
            message: 'Fetched user groups',
            data: groups,
            error: null
        });

    } catch (err) {
        console.error('Failed to fetch groups:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch groups',
            data: null,
            error: 'Internal server error'
        });
    }
});

router.post('/confirm-member', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { groupId, newMemberId } = req.body;

    try {
        if (!await groupsDB.isGroupOwner(groupId, userID)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                data: null,
                error: 'Not group owner'
            });
        }

        await groupsDB.updateGroupMemberStatus(groupId, newMemberId, 'active');

        return res.status(200).json({
            success: true,
            message: 'Member confirmed',
            data: null,
            error: null
        });

    } catch (err) {
        console.error('Failed to confirm member:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to confirm member',
            data: null,
            error: 'Internal server error'
        });
    }
});

router.post('/get-out-of-group', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { groupId } = req.body;

    try {
        if (await groupsDB.isGroupOwner(groupId, userID)) {
            await groupsDB.updateGroupOwner(groupId, userID);
        }

        await groupsDB.removeGroupMember(groupId, userID);

        return res.status(200).json({
            success: true,
            message: 'Left group successfully',
            data: null,
            error: null
        });

    } catch (err) {
        console.error('Failed to get out of group:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to leave group',
            data: null,
            error: 'Internal server error'
        });
    }
});

router.post('/join-group', async (req: Request, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const { inviteToken } = req.body;

    try {
        const id = await groupsDB.checkInviteToken(inviteToken);

        if (await groupsDB.isGroupMember(id, userID)) {
            return res.status(400).json({
                success: false,
                message: 'Already a member',
                data: null,
                error: 'User already in group'
            });
        }

        await groupsDB.newGroupMember(id, userID, 'pending');

        return res.status(200).json({
            success: true,
            message: 'Join request sent',
            data: null,
            error: null
        });

    } catch (err) {
        console.error('Failed to join group:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to join group',
            data: null,
            error: 'Internal server error'
        });
    }
});

router.get('/send-invite/:groupId', async (req: Request<{ groupId: string }>, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const groupId = req.params.groupId;

    try {
        if (!await groupsDB.isGroupOwner(groupId, userID)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                data: null,
                error: 'Not group owner'
            });
        }

        const inviteToken = await groupsDB.getInviteToken(groupId);

        return res.status(200).json({
            success: true,
            message: 'Invite token fetched',
            data: { inviteToken },
            error: null
        });

    } catch (err) {
        console.error('Failed to get invite token:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to get invite token',
            data: null,
            error: 'Internal server error'
        });
    }
});

router.get('/groups/:groupId/members', async (req: Request<{ groupId: string }>, res: Response<ApiResponse>) => {
    const userID = req.user.id;
    const groupId = req.params.groupId;

    try {
        if (!await groupsDB.isGroupMember(groupId, userID)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
                data: null,
                error: 'Not group member'
            });
        }

        const members = await groupsDB.getGroupMembers(groupId);

        return res.status(200).json({
            success: true,
            message: 'Group members fetched',
            data: members,
            error: null
        });

    } catch (err) {
        console.error('Failed to fetch group members:', err);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch group members',
            data: null,
            error: 'Internal server error'
        });
    }
});

export default router;