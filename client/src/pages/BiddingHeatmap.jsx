import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND = 'https://modmapper-orbital2026.onrender.com'

// Maps demand ratio (0 to 1) to colour intensity
// Heatmap algorithm — same pattern as Group Finder but here a high ratio
// means more competition (more students planning that slot)
function demandColour(count, max) {
    if (max === 0 || count === 0) return '#fdf8f2'
    const ratio = count / max
    if (ratio <= 0.2) return '#f5edd8'
    if (ratio <= 0.4) return '#e8c8a8'
    if (ratio <= 0.6) return '#d49968'
    if (ratio <= 0.8) return '#b85c38'
    return '#8a3f25'
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

    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px', marginBottom: '28px' },

    searchRow: { display: 'flex', gap: '10px', maxWidth: '480px', marginBottom: '24px' },
    searchInput: { flex: 1, padding: '10px 14px', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    searchBtn: { padding: '10px 18px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },

    card: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', overflow: 'hidden' },
    cardHeader: { padding: '14px 18px', borderBottom: '0.5px solid #d4c4a8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#1a2744' },
    cardBody: { padding: '20px' },

    // Slot demand row layout
    slotRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '0.5px solid #e8dfd0' },
    slotInfo: { flex: '0 0 200px', fontSize: '12px', color: '#1a2744' },
    slotCode: { fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' },
    slotMeta: { fontSize: '11px', color: '#7a6a5a', marginTop: '2px' },
    barTrack: { flex: 1, height: '24px', borderRadius: '4px', background: '#fdf8f2', overflow: 'hidden', position: 'relative' },
    barFill: { height: '100%', transition: 'width 0.3s ease' },
    barCount: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#1a2744', minWidth: '60px', textAlign: 'right' },

    legend: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a6a5a' },
    legendBox: { width: '14px', height: '14px', borderRadius: '2px' },

    emptyState: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
    errorMsg: { fontSize: '12px', color: '#b71c1c', fontFamily: "'JetBrains Mono', monospace", marginTop: '8px' },
}

function BiddingHeatmap() {
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [query, setQuery] = useState('')
    const [currentModule, setCurrentModule] = useState('')
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    const handleSearch = async () => {
        const code = query.trim().toUpperCase()
        if (!code) return
        setLoading(true)
        setError('')
        setCurrentModule(code)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${BACKEND}/heatmap?moduleCode=${encodeURIComponent(code)}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) {
                setError(`Could not fetch demand data for ${code}`)
                setSlots([])
                return
            }
            const json = await res.json()
            // Backend returns { data: [...] } — extract the array
            setSlots(json.data ?? [])
        } catch {
            setError('Network error — please try again')
            setSlots([])
        } finally {
            setLoading(false)
        }
    }

    // Compute max demand across all slots for colour normalisation
    // Any field that looks like a count is used as the demand value
    const maxDemand = slots.reduce((max, s) => {
        const count = s.demand_count ?? s.count ?? s.demand ?? 0
        return count > max ? count : max
    }, 0)

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    return (
        <div style={s.page}>

            {/* Sidebar */}
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
                <div style={s.navItem} onClick={() => navigate('/group-finder')}><div style={s.navDot} />Group Finder</div>
                <div style={s.navItemActive}><div style={s.navDotActive} />Bidding Heatmap</div>

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

            {/* Main */}
            <div style={s.main}>
                <div style={s.pageTitle}>Bidding Demand Heatmap</div>
                <div style={s.pageSub}>See how many other students are planning to bid for each slot</div>

                <div style={s.searchRow}>
                    <input
                        type="text"
                        placeholder="Enter module code e.g. CS3230"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={s.searchInput}
                        autoFocus
                    />
                    <button onClick={handleSearch} style={s.searchBtn}>VIEW DEMAND</button>
                </div>

                {error && <div style={s.errorMsg}>{error}</div>}

                {/* Results card */}
                {currentModule && !error && (
                    <div style={s.card}>
                        <div style={s.cardHeader}>
                            <div style={s.cardTitle}>{currentModule} — slot demand</div>
                            <div style={s.legend}>
                                <div style={{ ...s.legendBox, background: '#f5edd8' }} />
                                <div style={{ ...s.legendBox, background: '#e8c8a8' }} />
                                <div style={{ ...s.legendBox, background: '#d49968' }} />
                                <div style={{ ...s.legendBox, background: '#b85c38' }} />
                                <div style={{ ...s.legendBox, background: '#8a3f25' }} />
                                <span>low → high competition</span>
                            </div>
                        </div>
                        <div style={s.cardBody}>
                            {loading ? (
                                <div style={s.emptyState}>
                                    Computing demand...
                                </div>
                            ) : slots.length === 0 ? (
                                <div style={s.emptyState}>
                                    <div>No demand data yet for {currentModule}</div>
                                    <div style={s.emptyCode}>data is collected during bidding periods</div>
                                </div>
                            ) : (
                                slots.map((slot, i) => {
                                    // Defensive — try multiple possible field names
                                    const count = slot.demand_count ?? slot.count ?? slot.demand ?? 0
                                    const ratio = maxDemand > 0 ? (count / maxDemand) * 100 : 0
                                    const classNo = slot.class_no ?? slot.classNo ?? ''
                                    const lessonType = slot.lesson_type ?? slot.lessonType ?? ''
                                    const day = slot.day ?? ''
                                    const start = slot.start_time ?? slot.startTime ?? ''
                                    const end = slot.end_time ?? slot.endTime ?? ''

                                    return (
                                        <div key={i} style={s.slotRow}>
                                            <div style={s.slotInfo}>
                                                <div style={s.slotCode}>
                                                    {lessonType} {classNo}
                                                </div>
                                                {(day || start) && (
                                                    <div style={s.slotMeta}>
                                                        {day} {start && `${start}–${end}`}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={s.barTrack}>
                                                <div
                                                    style={{
                                                        ...s.barFill,
                                                        width: `${ratio}%`,
                                                        background: demandColour(count, maxDemand),
                                                    }}
                                                />
                                            </div>
                                            <div style={s.barCount}>
                                                {count} student{count !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {!currentModule && (
                    <div style={s.emptyState}>
                        <div>Search for a module to see demand</div>
                        <div style={s.emptyCode}>e.g. CS3230, MA1521, ST2334</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BiddingHeatmap