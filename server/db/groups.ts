import supabase from './supabase';

export async function createGroup(groupName: string, ownerId: string) {
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

export async function getGroupsForUser(userId: string) {
    const { data, error } = await supabase
        .from('group_members')
        .select('group_id, groups(name, owner_id)')
        .eq('user_id', userId)

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function newGroupMember(groupId: string, userId: string, status: string) {
    const { data, error } = await supabase
        .from('group_members')
        .insert([{ group_id: groupId, user_id: userId, status: status }])

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

export async function removeGroupMember(groupId: string, userId: string) {
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

export async function updateGroupMemberStatus(groupId: string, userId: string, status: string) {
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

export async function getGroupMembers(groupId: string) {
    const { data, error } = await supabase
        .from('group_members')
        .select('user_id, status')
        .eq('group_id', groupId)

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateGroupOwner(groupId: string, leavingUserId: string) {
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

export async function isGroupOwner(groupId: string, userId: string) {
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

export async function getInviteToken(groupId: string) {
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

export async function checkInviteToken(inviteToken: string) {
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

export async function isGroupMember(groupId: string, userId: string) {
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

