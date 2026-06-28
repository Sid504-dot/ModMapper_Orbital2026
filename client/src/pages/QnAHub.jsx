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
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px', marginBottom: '28px' },
    searchRow: { display: 'flex', gap: '10px', maxWidth: '480px' },
    searchInput: { flex: 1, padding: '10px 14px', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    searchBtn: { padding: '10px 18px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },
    searchError: { marginTop: '10px', fontSize: '12px', color: '#b71c1c', fontFamily: "'JetBrains Mono', monospace" },
}

function QnAHub() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [moduleList, setModuleList] = useState([])
    const [searchError, setSearchError] = useState('')

    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    // Fetch module list for validation — filters in memory so search is instant
    useEffect(() => {
        fetch('https://api.nusmods.com/v2/2024-2025/moduleList.json')
            .then(r => r.json())
            .then(data => setModuleList(data.map(m => m.moduleCode)))
    }, [])

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    const handleSearch = () => {
        const code = query.trim().toUpperCase()
        if (!code) return
        if (moduleList.length > 0 && !moduleList.includes(code)) {
            setSearchError(`"${code}" doesn't match any NUS module — please check the code and try again`)
            return
        }
        setSearchError('')
        navigate(`/qna-hub/${code}`)
    }

    return (
        <div style={s.page}>

            {/* Sidebar — Q&A Community marked active */}
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
                <div style={s.navItemActive}><div style={s.navDotActive} />Q&amp;A Community</div>

                <div style={s.navLabel}>Tools</div>
                <div style={s.navItem} onClick={() => navigate('/su-optimiser')}><div style={s.navDot} />S/U Optimiser</div>
                <div style={s.navItem} onClick={() => navigate('/group-finder')}><div style={s.navDot} />Group Finder</div>
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

            {/* Main content */}
            <div style={s.main}>
                <div style={s.pageTitle}>Q&amp;A Community</div>
                <div style={s.pageSub}>Search any module to view or ask questions</div>

                <div style={s.searchRow}>
                    <input
                        type="text"
                        placeholder="Enter a module code like CS2030"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSearchError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={s.searchInput}
                        autoFocus
                    />
                    <button onClick={handleSearch} style={s.searchBtn}>GO</button>
                </div>
                {searchError && <div style={s.searchError}>{searchError}</div>}
            </div>

        </div>
    )
}

export default QnAHub