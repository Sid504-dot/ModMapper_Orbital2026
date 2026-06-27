import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND = 'https://modmapper-orbital2026.onrender.com'

// Hourly slots 0800-2100, matching Siddharth's response keys exactly
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SLOTS = ['800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100']

// Heatmap colour function — maps a free ratio (0 to 1) to a colour
// ratio = freeCount / totalActiveMembers
// This is the core visual algorithm — same idea as weather maps or population density maps
function slotColour(freeCount, total) {
    if (total === 0) return '#fdf8f2'
    const ratio = freeCount / total
    if (ratio === 0) return '#fdf8f2'
    if (ratio <= 0.25) return '#e8dfd0'
    if (ratio <= 0.5) return '#b8a898'
    if (ratio <= 0.75) return '#3d5a73'
    if (ratio < 1) return '#1f3a5f'
    return '#1a2744'
}

// Converts slot key like "800" to readable label like "8am"
function formatSlot(slot) {
    const hour = parseInt(slot) / 100
    const ampm = hour >= 12 ? 'pm' : 'am'
    const display = hour > 12 ? hour - 12 : hour
    return `${display}${ampm}`
}

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    sidebar: { width: '220px', background: '#1a2744', minHeight: '100vh', padding: '28px 20px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100%' },
    logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' },
    logoIcon: { width: '34px', height: '34px', background: '#b85c38', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '7px' },
    sq1: { borderRadius: '2px', background: 'rgba(255,255,255,0.95)' },
    sq2: { borderRadius: '2px', background: 'rgba(255,255,255,0.72)' },
    sq3: { borderRadius: '2px', background: 'rgba(255,255,255,0.55)' },
    sq4: { borderRadius: '2px', background: 'rgba(255,255,255,0.38)' },
    wordmark: { fontSize: '17px', fontWeight: '600', color: '#fdf8f2', letterSpacing: '-0.04em' },
    navLabel: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(253,248,242,0.35)', marginBottom: '6px', padding: '0 8px', marginTop: '20px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '6px', marginBottom: '2px', fontSize: '13px', color: 'rgba(253,248,242,0.65)', cursor: 'pointer' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '6px', marginBottom: '2px', fontSize: '13px', color: '#fdf8f2', fontWeight: '500', cursor: 'pointer', background: 'rgba(184,92,56,0.25)' },
    navDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(253,248,242,0.3)', flexShrink: 0 },
    navDotActive: { width: '6px', height: '6px', borderRadius: '50%', background: '#b85c38', flexShrink: 0 },
    sidebarBottom: { marginTop: 'auto' },
    userPill: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(253,248,242,0.06)' },
    avatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#b85c38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: 'white', flexShrink: 0 },
    userName: { fontSize: '12px', fontWeight: '500', color: '#fdf8f2' },
    userEmail: { fontSize: '10px', color: 'rgba(253,248,242,0.4)', fontFamily: "'JetBrains Mono', monospace" },
    logoutBtn: { background: 'none', border: 'none', color: 'rgba(253,248,242,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px', padding: '0 10px', textAlign: 'left' },
    main: { marginLeft: '220px', flex: 1, display: 'flex', minHeight: '100vh' },

    // Left panel — create group + groups list
    leftPanel: { width: '260px', flexShrink: 0, borderRight: '1px solid #d4c4a8', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' },
    leftTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', margin: 0 },
    leftSub: { fontSize: '12px', color: '#7a6a5a' },
    createInput: { padding: '8px 10px', border: '0.5px solid #d4c4a8', borderRadius: '5px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    createBtn: { padding: '8px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },
    groupsLabel: { fontSize: '10px', fontWeight: '600', color: '#7a6a5a', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" },
    groupItem: { padding: '10px 12px', borderRadius: '6px', border: '0.5px solid #d4c4a8', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#1a2744' },
    groupItemActive: { padding: '10px 12px', borderRadius: '6px', border: '0.5px solid #1a2744', background: '#1a2744', cursor: 'pointer', fontSize: '13px', color: '#fdf8f2' },

    // Right panel — group detail
    rightPanel: { flex: 1, padding: '28px 32px', overflowY: 'auto' },
    groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    groupTitle: { fontSize: '20px', fontWeight: '600', color: '#1a2744' },
    groupActions: { display: 'flex', gap: '8px', alignItems: 'center' },
    inviteBtn: { padding: '7px 14px', background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '5px', fontSize: '12px', color: '#1a2744', cursor: 'pointer', fontFamily: 'inherit' },
    leaveBtn: { padding: '7px 14px', background: 'none', border: '0.5px solid #d4c4a8', borderRadius: '5px', fontSize: '12px', color: '#7a6a5a', cursor: 'pointer', fontFamily: 'inherit' },
    copiedText: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#2e7d32' },

    // Members card
    membersCard: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' },
    membersHeader: { padding: '12px 16px', borderBottom: '0.5px solid #d4c4a8', fontSize: '13px', fontWeight: '500', color: '#1a2744' },
    memberRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '0.5px solid #d4c4a8', fontSize: '12px' },
    memberEmail: { color: '#1f1a16', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' },
    pendingBadge: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 7px', borderRadius: '3px', background: '#fff8f0', border: '0.5px solid #f5a19a', color: '#b85c38' },
    activeBadge: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 7px', borderRadius: '3px', background: '#f0faf0', border: '0.5px solid #a5d6a7', color: '#2e7d32' },
    approveBtn: { padding: '3px 10px', background: '#1a2744', color: '#fdf8f2', border: 'none', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', marginLeft: '8px' },

    // Availability grid
    gridCard: { background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '8px', overflow: 'hidden' },
    gridHeader: { padding: '12px 16px', borderBottom: '0.5px solid #d4c4a8', fontSize: '13px', fontWeight: '500', color: '#1a2744' },
    gridBody: { padding: '16px', overflowX: 'auto' },

    emptyState: { padding: '60px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
}

function GroupFinder() {
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')

    // All the state this page would need — groups, selected group, members, free slots, form inputs, loading states, etc
    const [groups, setGroups] = useState([])           // list of user's groups from GET /api/my-groups
    const [selectedGroup, setSelectedGroup] = useState(null)  // which group is currently open
    const [members, setMembers] = useState([])         // members of the selected group
    const [freeSlots, setFreeSlots] = useState(null)   // the grid data from GET /api/group-free-finder
    const [newGroupName, setNewGroupName] = useState('')
    const [creating, setCreating] = useState(false)
    const [inviteCopied, setInviteCopied] = useState(false)
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Auth guard — redirect to login if no token
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])



    // Helper that returns headers for every authenticated request
    // Bearer token tells the backend who the user is
    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    })

    // GET /api/my-groups — fetches all groups the user belongs to
    // async/await because fetch is asynchronous — we have to wait for the response
    const fetchMyGroups = async () => {
        try {
            const res = await fetch(`${BACKEND}/api/my-groups`, { headers: authHeaders() })
            if (!res.ok) return
            const data = await res.json()
            setGroups(data) // data = [{ group_id, name, owner_id }, ...]
        } catch (err) {
            console.error('Failed to fetch groups:', err)
        }


    }

    // Fetch groups on mount — useEffect because it's async and has a side effect (network request  and state update)
    // Empty dependency array [] means it runs once when the component first mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchMyGroups()
    }, [])

    // POST /api/create — creates a new group with the typed name
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        setCreating(true)
        try {
            const res = await fetch(`${BACKEND}/api/create`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ groupName: newGroupName.trim() }),
            })
            if (res.ok) {
                setNewGroupName('')
                await fetchMyGroups() // refresh the list so new group appears
            }
        } catch (err) {
            console.error('Failed to create group:', err)
        } finally {
            setCreating(false)
        }
    }

    // Called when user clicks a group in the left panel
    // Sets selected group, then fetches its members and free slots
    const handleSelectGroup = async (group) => {
        setSelectedGroup(group)
        setFreeSlots(null)
        setMembers([])

        // Fetch members — for now members come from the group object
        // If Mr. Sid adds a dedicated members endpoint later, call it here

        // Fetch the availability grid
        setLoadingSlots(true)
        try {
            const res = await fetch(`${BACKEND}/api/group-free-finder/${group.group_id}`, {
                headers: authHeaders()
            })
            if (!res.ok) return
            const data = await res.json()
            setFreeSlots(data)
        } catch (err) {
            console.error('Failed to fetch free slots:', err)
        } finally {
            setLoadingSlots(false)
        }
    }

    // GET /api/send-invite/:groupId — only works for the group owner (backend enforces this)
    // If not owner, backend returns 403 and we show an alert
    // navigator.clipboard.writeText() is the Web Clipboard API — copies text to clipboard
    const handleCopyInvite = async () => {
        if (!selectedGroup) return
        try {
            const res = await fetch(`${BACKEND}/api/send-invite/${selectedGroup.group_id}`, {
                headers: authHeaders()
            })
            if (res.status === 403) {
                alert('Only the group owner can share the invite link')
                return
            }
            const { inviteToken } = await res.json()
            const link = `${window.location.origin}/group-finder/join/${inviteToken}`
            await navigator.clipboard.writeText(link)
            setInviteCopied(true)
            setTimeout(() => setInviteCopied(false), 2500)
        } catch (err) {
            console.error('Failed to get invite link:', err)
        }
    }

    // POST /api/confirm-member — owner approves a pending member
    // { groupId, newMemberId } tells the backend which user to flip from pending to active
    const handleApprove = async (newMemberId) => {
        if (!selectedGroup) return
        try {
            const res = await fetch(`${BACKEND}/api/confirm-member`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ groupId: selectedGroup.group_id, newMemberId }),
            })
            if (res.ok) {
                // Refresh free slots since a new active member changes the grid
                handleSelectGroup(selectedGroup)
            }
        } catch (err) {
            console.error('Failed to approve member:', err)
        }
    }

    // POST /api/get-out-of-group — removes user from group
    // window.confirm() is a native browser dialog — no library needed
    // If owner leaves, backend automatically passes ownership to next member
    const handleLeave = async () => {
        if (!selectedGroup) return
        if (!window.confirm(`Leave "${selectedGroup.name}"?`)) return
        try {
            const res = await fetch(`${BACKEND}/api/get-out-of-group`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ groupId: selectedGroup.group_id }),
            })
            if (res.ok) {
                setSelectedGroup(null)
                setMembers([])
                setFreeSlots(null)
                await fetchMyGroups()
            }
        } catch (err) {
            console.error('Failed to leave group:', err)
        }
    }

    // totalActiveMembers is used by slotColour to compute the ratio
    // We derive it from the groups data — members with status active
    const totalActiveMembers = members.filter(m => m.status === 'active').length || 1

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    return (
        <div style={s.page}>

            {/* Sidebar — Group Finder marked active */}
            <div style={s.sidebar}>
                <div style={s.logoRow}>
                    <div style={s.logoIcon}>
                        <div style={s.sq1} /><div style={s.sq2} />
                        <div style={s.sq3} /><div style={s.sq4} />
                    </div>
                    <span style={s.wordmark}>ModMapper</span>
                </div>

                <div style={s.navLabel}>Plan</div>
                <div style={s.navItem} onClick={() => navigate('/dashboard')}><div style={s.navDot} />Dashboard</div>
                <div style={s.navItem} onClick={() => navigate('/timetable')}><div style={s.navDot} />Timetable</div>
                <div style={s.navItem}><div style={s.navDot} />4-Year Planner</div>

                <div style={s.navLabel}>Explore</div>
                <div style={s.navItem} onClick={() => navigate('/modules')}><div style={s.navDot} />Module Search</div>
                <div style={s.navItem}><div style={s.navDot} />UE Recommender</div>
                <div style={s.navItem} onClick={() => navigate('/qna-hub')}><div style={s.navDot} />Q&amp;A Community</div>

                <div style={s.navLabel}>Tools</div>
                <div style={s.navItem} onClick={() => navigate('/su-optimiser')}><div style={s.navDot} />S/U Optimiser</div>
                <div style={s.navItemActive}><div style={s.navDotActive} />Group Finder</div>
                <div style={s.navItem} onClick={() => navigate('/bidding-heatmap')}><div style={s.navDot}></div>Bidding Heatmap</div>

                <div style={s.sidebarBottom}>
                    <div style={s.userPill}>
                        <div style={s.avatar}>{initials}</div>
                        <div>
                            <div style={s.userName}>My Account</div>
                            <div style={s.userEmail}>{userEmail || 'NUS Student'}</div>
                        </div>
                    </div>
                    <button style={s.logoutBtn} onClick={() => { localStorage.removeItem('token'); navigate('/login') }}>
                        Sign out
                    </button>
                </div>
            </div>

            {/* Main area — two panels side by side */}
            <div style={s.main}>

                {/* Left panel — create group + groups list */}
                <div style={s.leftPanel}>
                    <div>
                        <div style={s.leftTitle}>Group Finder</div>
                        <div style={s.leftSub}>Create or join a study group</div>
                    </div>

                    {/* Create group input — Enter key or button both trigger create */}
                    <input
                        style={s.createInput}
                        placeholder="New group name..."
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                    />
                    <button
                        style={s.createBtn}
                        onClick={handleCreateGroup}
                        disabled={creating || !newGroupName.trim()}
                    >
                        {creating ? 'Creating...' : 'CREATE GROUP'}
                    </button>

                    {/* Groups list — clicking a group opens it in the right panel */}
                    {groups.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            <div style={s.groupsLabel}>Your groups</div>
                            {groups.map(g => (
                                <div
                                    key={g.group_id}
                                    style={selectedGroup?.group_id === g.group_id ? s.groupItemActive : s.groupItem}
                                    onClick={() => handleSelectGroup(g)}
                                >
                                    {g.name ?? `Group ${g.group_id}`}
                                </div>
                            ))}
                        </div>
                    )}

                    {groups.length === 0 && (
                        <div style={{ fontSize: '12px', color: '#7a6a5a', textAlign: 'center', paddingTop: '20px' }}>
                            No groups yet — create one or join via an invite link
                        </div>
                    )}
                </div>

                {/* Right panel — shown when a group is selected */}
                <div style={s.rightPanel}>
                    {!selectedGroup ? (
                        <div style={s.emptyState}>
                            <div>Select a group to see availability</div>
                            <div style={s.emptyCode}>or create a new one on the left</div>
                        </div>
                    ) : (
                        <>
                            {/* Group header with action buttons */}
                            <div style={s.groupHeader}>
                                <div style={s.groupTitle}>{selectedGroup.name}</div>
                                <div style={s.groupActions}>
                                    {inviteCopied && <span style={s.copiedText}>Link copied!</span>}
                                    <button style={s.inviteBtn} onClick={handleCopyInvite}>
                                        Copy Invite Link
                                    </button>
                                    <button style={s.leaveBtn} onClick={handleLeave}>Leave</button>
                                </div>
                            </div>

                            {/* Members list */}
                            <div style={s.membersCard}>
                                <div style={s.membersHeader}>Members</div>
                                {members.length === 0 && (
                                    <div style={{ padding: '12px 16px', fontSize: '12px', color: '#7a6a5a' }}>
                                        No member data yet
                                    </div>
                                )}
                                {members.map(m => (
                                    <div key={m.user_id} style={s.memberRow}>
                                        <span style={s.memberEmail}>{m.user_id}</span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={m.status === 'active' ? s.activeBadge : s.pendingBadge}>
                                                {m.status}
                                            </span>
                                            {/* Approve button — backend enforces owner-only, but we try anyway
                                                and the backend returns 403 if not owner */}
                                            {m.status === 'pending' && (
                                                <button style={s.approveBtn} onClick={() => handleApprove(m.user_id)}>
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Availability grid — the heatmap */}
                            <div style={s.gridCard}>
                                <div style={s.gridHeader}>Group Availability</div>
                                <div style={s.gridBody}>
                                    {loadingSlots ? (
                                        <div style={{ textAlign: 'center', color: '#7a6a5a', fontSize: '12px', padding: '20px 0' }}>
                                            Computing availability...
                                        </div>
                                    ) : freeSlots ? (
                                        // HTML table — rows = time slots, columns = days
                                        // Each cell's background colour comes from slotColour()
                                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    {/* Empty corner cell above time labels */}
                                                    <th style={{ width: '40px' }} />
                                                    {DAYS.map(d => (
                                                        <th key={d} style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#1a2744', textAlign: 'center', padding: '0 4px 8px', letterSpacing: '0.05em' }}>
                                                            {d.slice(0, 3).toUpperCase()}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {SLOTS.map(slot => (
                                                    <tr key={slot}>
                                                        {/* Time label on the left */}
                                                        <td style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', paddingRight: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                            {formatSlot(slot)}
                                                        </td>
                                                        {DAYS.map(day => {
                                                            // freeSlots[day][slot] = array of member IDs who are free
                                                            const freeMembers = freeSlots[day]?.[slot] ?? []
                                                            const freeCount = freeMembers.length
                                                            return (
                                                                <td key={day} style={{ padding: '2px' }}>
                                                                    {/* title attribute = native browser tooltip on hover */}
                                                                    <div
                                                                        style={{
                                                                            width: '60px',
                                                                            height: '28px',
                                                                            borderRadius: '3px',
                                                                            background: slotColour(freeCount, totalActiveMembers),
                                                                            cursor: 'default',
                                                                        }}
                                                                        title={freeCount === 0
                                                                            ? 'Nobody free'
                                                                            : `${freeCount}/${totalActiveMembers} free`
                                                                        }
                                                                    />
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#7a6a5a', fontSize: '12px', padding: '20px 0' }}>
                                            No timetable data — members need to save their timetables first
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GroupFinder