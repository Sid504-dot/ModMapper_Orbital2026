import supabase from '../db/supabase';
import express, { Request, Response } from 'express';
const router = express.Router();
import * as groupsDB from '../db/groups';
import { requireAuth } from '../middleware/requireAuth';
router.use(requireAuth);

router.post('/create', async (req: Request, res: Response) => {
    const userID = req.user.id;
    const { groupName } = req.body;

    try {
        await groupsDB.createGroup(groupName, userID);
        res.json({ success: true });
    } catch (err: unknown) {
        console.error('Failed to create group:', err);
        const msg = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: `Failed to create group ${msg}` });
    }
});

router.get('/my-groups', async (req: Request, res: Response) => {
    const userID = req.user.id;

    try {
        const rows = await groupsDB.getGroupsForUser(userID);
        const groups = rows.map((r: any) => ({ group_id: r.group_id, name: r.groups.name, owner_id: r.groups.owner_id }));
        res.json(groups);
    } catch (err) {
        console.error('Failed to fetch groups:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

router.post('/confirm-member', async (req: Request, res: Response) => {
    const userID = req.user.id;
    const { groupId, newMemberId} = req.body;

    try {
        if (!await groupsDB.isGroupOwner(groupId, userID)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await groupsDB.updateGroupMemberStatus(groupId, newMemberId, 'active');
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to confirm member:', err);
        res.status(500).json({ error: 'Failed to confirm member' });
    }
}
);

router.post('/get-out-of-group', async (req: Request, res: Response) => {
    const userID = req.user.id;
    const { groupId } = req.body;

    try {
        if (await groupsDB.isGroupOwner(groupId, userID)) {
            await groupsDB.updateGroupOwner(groupId, userID);
        }
        await groupsDB.removeGroupMember(groupId, userID);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to get out of group:', err);
        res.status(500).json({ error: 'Failed to get out of group' });
    }
});

router.post('/join-group', async (req: Request, res: Response) => {
    const userID = req.user.id;
    const { inviteToken } = req.body;

    try {
        const id = await groupsDB.checkInviteToken(inviteToken);
        if (await groupsDB.isGroupMember(id, userID)) {
            return res.status(400).json({ error: 'Already a member of the group' });
        } else {
            await groupsDB.newGroupMember(id, userID, 'pending');
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to join group:', err);
        res.status(500).json({ error: 'Failed to join group' });
    }
});

router.get('/send-invite/:groupId', async (req: Request<{ groupId: string }>, res: Response) => {
    const userID = req.user.id;
    const groupId = req.params.groupId;

    try {
        if (!await groupsDB.isGroupOwner(groupId, userID)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const inviteToken = await groupsDB.getInviteToken(groupId);
        res.json({ inviteToken });
    } catch (err) {
        console.error('Failed to get invite token:', err);
        res.status(500).json({ error: 'Failed to get invite token' });
    }
});

router.get('/groups/:groupId/members', async (req: Request<{ groupId: string }>, res: Response) => {
    const userID = req.user.id;
    const groupId = req.params.groupId;

    try {
        if (!await groupsDB.isGroupMember(groupId, userID)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const members = await groupsDB.getGroupMembers(groupId);
        res.json(members);
    } catch (err) {
        console.error('Failed to fetch group members:', err);
        res.status(500).json({ error: 'Failed to fetch group members' });
    }
});


export default router;