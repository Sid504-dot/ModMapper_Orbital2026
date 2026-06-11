const supabase = require('./supabase');

async function createGroup(groupName, ownerId) {
    const { data, error } = await supabase
        .from('groups')
        .insert([{ name: groupName, owner_id: ownerId }])
        .select()
        .single();
    
    if (error) {
        throw new Error(error.message);
    }

    const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ group_id: data.id, user_id: ownerId, status: 'active' }])

    if (memberError) {
        throw new Error(memberError.message);
    }

    return true;
}

async function getGroupsForUser(userId) {
    const { data, error } = await supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', userId)

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

async function newGroupMember(groupId, userId, status) {
    const { data, error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: userId, status: status }])

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

async function removeGroupMember(groupId, userId) {
    const { data, error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

async function updateGroupMemberStatus(groupId, userId, status) {
    const { data, error } = await supabase
        .from('group_members')
        .update({ status: status })
        .eq('group_id', groupId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

async function getGroupMembers(groupId) {
    const { data, error } = await supabase
        .from('group_members')
        .select('user_id, status')
        .eq('group_id', groupId)

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

async function updateGroupOwner(groupId, leavingUserId) {
    const { data: heir, error: heirError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('status', 'active')
        .neq('user_id', leavingUserId)
        .order('created_at', { ascending: true })
        .order('user_id', { ascending: true })
        .limit(1)
        .maybeSingle();
    if (heirError) {
        throw new Error(heirError.message);
    }

    if (!heir) {
        const { error } = await supabase.from('groups').delete().eq('id', groupId);
        if (error) {
            throw new Error(error.message);
        }
        return true;
    }

    const { error } = await supabase
        .from('groups')
        .update({ owner_id: heir.user_id })
        .eq('id', groupId);
    if (error) {
        throw new Error(error.message);
    }
    return true;
}

async function isGroupOwner(groupId, userId) {
    const { data, error } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data.owner_id === userId;
}

async function getInviteToken(groupId) {
    const { data, error } = await supabase
        .from('groups')
        .select('invite_token')
        .eq('id', groupId)
        .single();
    
    if (error) {
        throw new Error(error.message);
    }
    
    return data.invite_token;
}

async function checkInviteToken(inviteToken) {
    const { data, error } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_token', inviteToken)
        .maybeSingle();
    
    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error('Invalid invite token');
    }
    
    return data.id;
}

async function isGroupMember(groupId, userId) {
    const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data !== null;
}

module.exports = {
    createGroup,
    getGroupsForUser,
    newGroupMember,
    removeGroupMember,
    updateGroupMemberStatus,
    getGroupMembers,
    updateGroupOwner,
    isGroupOwner,
    getInviteToken,
    checkInviteToken,
    isGroupMember
};  
