const supabase = require('../db/supabase');
const express = require('express');
const router = express.Router();
const groupsDB = require('../db/groups');

router.post('/create', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
    const { groupName } = req.body;

    try {
        await groupsDB.createGroup(groupName, userID);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to create group:', err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

router.get('/my-groups', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;

    try {
        const groups = await groupsDB.getGroupsForUser(userID);
        res.json(groups);
    } catch (err) {
        console.error('Failed to fetch groups:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

router.post('/confirm-member', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
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

router.post('/get-out-of-group', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
    const { groupId } = req.body;

    try {
        if (await groupsDB.isGroupOwner(groupId, userID)) {
            await groupsDB.updateGroupOwner(groupId);
        }
        await groupsDB.removeGroupMember(groupId, userID);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to get out of group:', err);
        res.status(500).json({ error: 'Failed to get out of group' });
    }
});

router.post('/join-group', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
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

router.get('/send-invite/:groupId', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userID = user.id;
    

    req.user = userID;
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

module.exports = router;    