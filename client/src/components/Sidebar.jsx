import { useNavigate } from 'react-router-dom'
import { colours, fonts } from '../styles/tokens'

// Shared sidebar used across every page. (Previously duplicated 10 times).
// Takes one prop: `active` — the key of the currently active nav item.

const NAV_SECTIONS = [
    {
        label: 'Plan',
        items: [
            { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
            { key: 'timetable', label: 'Timetable', path: '/timetable' },
            { key: 'planner', label: '4-Year Planner', path: null }, // not built yet
        ],
    },
    {
        label: 'Explore',
        items: [
            { key: 'modules', label: 'Module Search', path: '/modules' },
            { key: 'ue', label: 'UE Recommender', path: '/ue-recommender' },
            { key: 'qna', label: 'Q\u0026A Community', path: '/qna-hub' },
        ],
    },
    {
        label: 'Tools',
        items: [
            { key: 'su', label: 'S/U Optimiser', path: '/su-optimiser' },
            { key: 'group', label: 'Group Finder', path: '/group-finder' },
            { key: 'heatmap', label: 'Bidding Heatmap', path: '/bidding-heatmap' },
        ],
    },
    {
        label: 'Account',
        items: [
            { key: 'profile', label: 'Profile Settings', path: '/profile' },
        ],
    },
]

const s = {
    sidebar: {
        width: '220px', background: colours.primary, minHeight: '100vh',
        padding: '28px 20px', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100%',
    },
    logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' },
    logoIcon: {
        width: '34px', height: '34px', background: colours.action, borderRadius: '8px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '7px',
    },
    sq1: { borderRadius: '2px', background: 'rgba(255,255,255,0.95)' },
    sq2: { borderRadius: '2px', background: 'rgba(255,255,255,0.72)' },
    sq3: { borderRadius: '2px', background: 'rgba(255,255,255,0.55)' },
    sq4: { borderRadius: '2px', background: 'rgba(255,255,255,0.38)' },
    wordmark: {
        fontSize: '17px', fontWeight: '600', color: colours.bg, letterSpacing: '-0.04em',
    },
    navLabel: {
        fontSize: '10px', fontFamily: fonts.mono, fontWeight: '600',
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'rgba(253,248,242,0.35)', marginBottom: '6px',
        padding: '0 8px', marginTop: '20px',
    },
    navItem: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
        borderRadius: '6px', marginBottom: '2px', fontSize: '13px',
        color: 'rgba(253,248,242,0.65)', cursor: 'pointer',
    },
    navItemActive: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px',
        borderRadius: '6px', marginBottom: '2px', fontSize: '13px',
        color: colours.bg, fontWeight: '500', cursor: 'pointer',
        background: 'rgba(184,92,56,0.25)',
    },
    navDot: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'rgba(253,248,242,0.3)', flexShrink: 0,
    },
    navDotActive: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: colours.action, flexShrink: 0,
    },
    sidebarBottom: { marginTop: 'auto' },
    userPill: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
        borderRadius: '8px', background: 'rgba(253,248,242,0.06)',
    },
    avatar: {
        width: '30px', height: '30px', borderRadius: '50%', background: colours.action,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '600', color: 'white', flexShrink: 0,
    },
    userName: { fontSize: '12px', fontWeight: '500', color: colours.bg },
    userEmail: {
        fontSize: '10px', color: 'rgba(253,248,242,0.4)', fontFamily: fonts.mono,
    },
    logoutBtn: {
        background: 'none', border: 'none', color: 'rgba(253,248,242,0.4)',
        fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
        marginTop: '8px', padding: '0 10px', textAlign: 'left',
    },
}

function Sidebar({ active, userEmail = '' }) {
    const navigate = useNavigate()

    const handleClick = (item) => {
        if (item.path) navigate(item.path)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('matricYearSet')
        navigate('/login')
    }

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    return (
        <div style={s.sidebar}>

            {/* Logo */}
            <div style={s.logoRow}>
                <div style={s.logoIcon}>
                    <div style={s.sq1} /><div style={s.sq2} />
                    <div style={s.sq3} /><div style={s.sq4} />
                </div>
                <span style={s.wordmark}>ModMapper</span>
            </div>

            {/* Nav sections — mapped from the config array so adding a new nav
                item is a one-line change to NAV_SECTIONS, not 10 files */}
            {NAV_SECTIONS.map(section => (
                <div key={section.label}>
                    <div style={s.navLabel}>{section.label}</div>
                    {section.items.map(item => {
                        const isActive = item.key === active
                        return (
                            <div
                                key={item.key}
                                style={isActive ? s.navItemActive : s.navItem}
                                onClick={() => handleClick(item)}
                            >
                                <div style={isActive ? s.navDotActive : s.navDot} />
                                {item.label}
                            </div>
                        )
                    })}
                </div>
            ))}

            {/* Bottom — user info + sign out */}
            <div style={s.sidebarBottom}>
                <div style={{ ...s.userPill, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                    <div style={s.avatar}>{initials}</div>
                    <div>
                        <div style={s.userName}>My Account</div>
                        <div style={s.userEmail}>{userEmail || 'NUS Student'}</div>
                    </div>
                </div>
                <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
            </div>
        </div>
    )
}

export default Sidebar