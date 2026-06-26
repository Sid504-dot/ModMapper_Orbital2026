import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    topbar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px' },

    // Search bar
    searchRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    searchInput: { flex: 1, padding: '10px 14px', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    resultCount: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', padding: '10px 0 16px' },

    // Module result cards
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' },
    card: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' },
    cardCode: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#b85c38', letterSpacing: '0.02em' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#1f1a16', lineHeight: 1.4 },
    cardMeta: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', marginTop: '2px' },

    // Loading and empty states
    stateBox: { padding: '60px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    stateCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
}

function ModuleSearch() {
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [modules, setModules] = useState([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)

    // Auth guard and data fetch are kept in separate effects intentionally as one handles routing, the other handles data. Mixing them causes issues
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    useEffect(() => {
        fetch('https://api.nusmods.com/v2/2024-2025/moduleList.json')
            .then(res => res.json())
            .then(data => {
                setModules(data)
                setLoading(false)
            })
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    // Filter runs on every keystroke — no submit needed since the list is
    // already in memory after the initial fetch.
    const filtered = modules.filter(mod =>
        mod.moduleCode.toLowerCase().includes(query.toLowerCase()) ||
        mod.title.toLowerCase().includes(query.toLowerCase())
    )

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'
    const shown = filtered.slice(0, 40)

    return (
        <div style={s.page}>

            {/* Sidebar — Module Search marked active */}
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
                <div style={s.navItemActive}><div style={s.navDotActive} />Module Search</div>
                <div style={s.navItem}><div style={s.navDot} />UE Recommender</div>
                <div style={s.navItem} onClick={() => navigate('/qna-hub')}><div style={s.navDot} />Q&amp;A Community</div>

                <div style={s.navLabel}>Tools</div>
                <div style={s.navItem} onClick={() => navigate('/su-optimiser')}><div style={s.navDot} />S/U Optimiser</div>
                <div style={s.navItem} onClick={() => navigate('/group-finder')}><div style={s.navDot} />Group Finder</div>

                <div style={s.sidebarBottom}>
                    <div style={s.userPill}>
                        <div style={s.avatar}>{initials}</div>
                        <div>
                            <div style={s.userName}>My Account</div>
                            <div style={s.userEmail}>{userEmail || 'NUS Student'}</div>
                        </div>
                    </div>
                    <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
                </div>
            </div>

            {/* Main content */}
            <div style={s.main}>
                <div style={s.topbar}>
                    <div>
                        <div style={s.pageTitle}>Module Search</div>
                        <div style={s.pageSub}>Browse all NUS modules</div>
                    </div>
                </div>

                {/* Search input — filters in memory, no submit */}
                <div style={s.searchRow}>
                    <input
                        type="text"
                        placeholder="Search by code or name like e.g. CS1010A or programming"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={s.searchInput}
                        autoFocus
                    />
                </div>

                {loading ? (
                    <div style={s.stateBox}>
                        <div>Fetching modules from NUSMods...</div>
                        <div style={s.stateCode}>api.nusmods.com</div>
                    </div>
                ) : (
                    <>
                        <div style={s.resultCount}>
                            {query
                                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"${filtered.length > 40 ? ' — showing first 40' : ''}`
                                : `${modules.length} modules found · type module code to filter`
                            }
                        </div>

                        {filtered.length === 0 ? (
                            <div style={s.stateBox}>
                                <div>No modules match "{query}"</div>
                                <div style={s.stateCode}>try a shorter search term</div>
                            </div>
                        ) : (
                            <div style={s.grid}>
                                {shown.map(mod => (
                                    <div key={mod.moduleCode} style={s.card}>
                                        <div style={s.cardCode}>{mod.moduleCode}</div>
                                        <div style={s.cardTitle}>{mod.title}</div>
                                        {mod.moduleCredit && (
                                            <div style={s.cardMeta}>{mod.moduleCredit} MC</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ModuleSearch