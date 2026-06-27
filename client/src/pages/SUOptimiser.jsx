import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Grade to grade point mapping (NUS grading scheme)
const GRADE_POINTS = {
    'A+': 5.0, 'A': 5.0, 'A-': 4.5,
    'B+': 4.0, 'B': 3.5, 'B-': 3.0,
    'C+': 2.5, 'C': 2.0,
    'D+': 1.5, 'D': 1.0,
    'F': 0.0,
}
const GRADE_OPTIONS = Object.keys(GRADE_POINTS)

// GPA calculation - only counts modules that are not S/U-edd
function calcGPA(modules) {
    const counted = modules.filter(m => !m.isSU && m.grade && m.mcs > 0)
    const totalMCs = counted.reduce((sum, m) => sum + m.mcs, 0)
    if (totalMCs === 0) return null
    const weighted = counted.reduce((sum, m) => sum + GRADE_POINTS[m.grade] * m.mcs, 0)
    return weighted / totalMCs
}


// Recommendation logic - only recommend S/U-eligible modules below current GPA
// A module should be S/U'd if:
// 1. It is marked S/U eligible by the user (some modules like EC2102 cannot be S/U'd)
// 2. Its grade point is strictly below the current GPA (it is dragging the average down)
// NUS AY2021/22+ policy: S = D or above, U = below D (i.e. F grade)
function getRecommendations(modules) {
    const baseGpa = calcGPA(modules.map(m => ({ ...m, isSU: false })))
    if (baseGpa === null) return []
    return modules.filter(m =>
        !m.isSU &&
        m.suEligible && // must be marked S/U eligible - user unticks ineligible modules
        m.grade &&
        m.mcs > 0 &&
        GRADE_POINTS[m.grade] < baseGpa
    )
}

// Small unique-id helper for row keys
let _uid = 0
const uid = () => `row-${++_uid}`
// suEligible defaults to true - user unticks for modules NUSMods marks as non-S/U-able
const blankRow = () => ({ id: uid(), code: '', grade: 'B+', mcs: 4, isSU: false, suEligible: true })

// Shared styles - same token system as Dashboard
const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },

    // Sidebar — identical to Dashboard
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

    // Main content area
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px' },

    // Summary stat cards — same as Dashboard statsRow
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' },
    statCard: { background: '#f5edd8', borderRadius: '8px', padding: '16px 18px', border: '0.5px solid #d4c4a8' },
    statCardHighlight: { background: '#1a2744', borderRadius: '8px', padding: '16px 18px', border: '0.5px solid #1a2744' },
    statCardPositive: { background: '#f0faf0', borderRadius: '8px', padding: '16px 18px', border: '0.5px solid #a5d6a7' },
    statCardNegative: { background: '#fdecea', borderRadius: '8px', padding: '16px 18px', border: '0.5px solid #f5a19a' },
    statLabel: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a6a5a', marginBottom: '8px' },
    statLabelLight: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(253,248,242,0.45)', marginBottom: '8px' },
    statValue: { fontSize: '26px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.03em', fontFamily: "'JetBrains Mono', monospace" },
    statValueLight: { fontSize: '26px', fontWeight: '600', color: '#fdf8f2', letterSpacing: '-0.03em', fontFamily: "'JetBrains Mono', monospace" },
    statDelta: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', marginTop: '4px' },

    // Card container — same as Dashboard card
    card: { background: '#f5edd8', borderRadius: '10px', border: '0.5px solid #d4c4a8', overflow: 'hidden', marginBottom: '20px' },
    cardHeader: { padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #d4c4a8' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#1a2744', letterSpacing: '-0.01em' },
    cardAction: { fontSize: '12px', color: '#b85c38', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' },

    // Table header row
    tableHead: { display: 'flex', padding: '8px 20px', background: 'rgba(26,39,68,0.04)', borderBottom: '0.5px solid #d4c4a8', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7a6a5a', gap: '12px', alignItems: 'center' },

    // Module input rows — same rhythm as Dashboard moduleRow
    moduleRow: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid #d4c4a8', gap: '12px' },
    moduleRowSU: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid #d4c4a8', gap: '12px', opacity: 0.55, background: 'rgba(0,0,0,0.02)' },
    moduleRowRec: { display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '0.5px solid #d4c4a8', gap: '12px', borderLeft: '3px solid #b85c38', background: '#fff8f3' },

    // Inputs within rows
    inputCode: { flex: 2.2, border: '1px solid #d4c4a8', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", background: '#fff', color: '#1a2744', outline: 'none' },
    selectGrade: { flex: 1.4, border: '1px solid #d4c4a8', borderRadius: '4px', padding: '6px 6px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", background: '#fff', color: '#1a2744', outline: 'none', cursor: 'pointer' },
    inputMCs: { flex: 0.9, border: '1px solid #d4c4a8', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", background: '#fff', color: '#1a2744', outline: 'none', textAlign: 'center' },

    // S/U toggle button
    suToggleOff: { flex: 1, padding: '5px 0', border: '1px solid #d4c4a8', borderRadius: '4px', background: '#f5edd8', color: '#7a6a5a', fontSize: '11px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', textAlign: 'center' },
    suToggleOn: { flex: 1, padding: '5px 0', border: '1px solid #1a2744', borderRadius: '4px', background: '#1a2744', color: '#fdf8f2', fontSize: '11px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', textAlign: 'center' },

    // Grade point badge
    gpBadge: { flex: 1, textAlign: 'center', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#1a2744' },
    gpBadgeSU: { flex: 1, textAlign: 'center', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#d4c4a8' },

    removeBtn: { background: 'none', border: 'none', color: '#d4c4a8', fontSize: '16px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', flexShrink: 0 },

    // Add row button — same feel as cardAction
    addRowBtn: { display: 'flex', alignItems: 'center', gap: '6px', width: '100%', background: 'none', border: 'none', borderTop: '0.5px dashed #d4c4a8', padding: '12px 20px', color: '#b85c38', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },

    // Recommendations panel
    recPanel: { background: '#fff8f3', borderRadius: '10px', border: '0.5px solid #b85c38', overflow: 'hidden', marginBottom: '20px' },
    recHeader: { padding: '14px 20px', borderBottom: '0.5px solid rgba(184,92,56,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    recTitle: { fontSize: '14px', fontWeight: '500', color: '#1a2744' },
    recSubtitle: { fontSize: '12px', color: '#7a6a5a', padding: '10px 20px 14px', lineHeight: 1.5, borderBottom: '0.5px solid rgba(184,92,56,0.15)' },
    recChipRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px 20px' },
    recChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '5px', padding: '6px 12px' },
    recCode: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#1a2744' },
    recGrade: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#b85c38' },
    recMCs: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a' },

    // Buttons
    btnPrimary: { background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
    btnGhost: { background: 'none', color: '#7a6a5a', border: '0.5px solid #d4c4a8', borderRadius: '4px', padding: '9px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },

    // Policy note at the bottom
    policyNote: { display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '8px', padding: '12px 16px' },
    policyText: { fontSize: '12px', color: '#7a6a5a', margin: 0, lineHeight: 1.6 },
}

function SUOptimiser() {
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [modules, setModules] = useState([blankRow(), blankRow(), blankRow()])

    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    // Row helpers 
    const updateRow = (id, field, value) =>
        setModules(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))

    const addRow = () => setModules(prev => [...prev, blankRow()])

    const removeRow = (id) => setModules(prev => prev.filter(m => m.id !== id))

    const applyRecommendations = () => {
        const recIds = new Set(getRecommendations(modules).map(m => m.id))
        setModules(prev => prev.map(m => recIds.has(m.id) ? { ...m, isSU: true } : m))
    }

    const handleReset = () => setModules([blankRow(), blankRow(), blankRow()])

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    // Derived values
    // Current GPA pretends nothing is S/U'd - shows your "true" unmodified GPA
    const currentGPA = calcGPA(modules.map(m => ({ ...m, isSU: false })))
    // Projected GPA respects the user's S/U selections
    const projectedGPA = calcGPA(modules)
    const gpaDelta = currentGPA !== null && projectedGPA !== null ? projectedGPA - currentGPA : null
    const suMCs = modules.filter(m => m.isSU).reduce((sum, m) => sum + (m.mcs || 0), 0)
    const recommendations = getRecommendations(modules)

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    // Which stat card style to use for GPA Change
    const deltaCardStyle = gpaDelta === null || gpaDelta === 0 ? s.statCard
        : gpaDelta > 0 ? s.statCardPositive : s.statCardNegative

    const fmt = n => n === null ? '—' : n.toFixed(2)
    const fmtDelta = n => {
        if (n === null) return '—'
        if (n === 0) return '±0.00'
        return (n > 0 ? '+' : '') + n.toFixed(2)
    }

    return (
        <div style={s.page}>

            {/* Sidebar - S/U Optimiser marked active */}
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
                <div style={s.navItemActive}><div style={s.navDotActive} />S/U Optimiser</div>
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

                {/* Page header */}
                <div style={s.topbar}>
                    <div>
                        <div style={s.pageTitle}>S/U Optimiser</div>
                        <div style={s.pageSub}>Work out which modules to S/U to protect your GPA</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={s.btnGhost} onClick={handleReset}>Reset</button>
                        {recommendations.length > 0 && (
                            <button style={s.btnPrimary} onClick={applyRecommendations}>
                                Apply Recommendations →
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary cards */}
                <div style={s.statsRow}>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>Current GPA</div>
                        <div style={s.statValue}>{fmt(currentGPA)}</div>
                        <div style={s.statDelta}>all modules counted</div>
                    </div>
                    <div style={s.statCardHighlight}>
                        <div style={s.statLabelLight}>Projected GPA</div>
                        <div style={s.statValueLight}>{fmt(projectedGPA)}</div>
                        <div style={{ ...s.statDelta, color: 'rgba(253,248,242,0.4)' }}>after your S/U selections</div>
                    </div>
                    <div style={deltaCardStyle}>
                        <div style={s.statLabel}>GPA Change</div>
                        <div style={{ ...s.statValue, color: gpaDelta > 0 ? '#2e7d32' : gpaDelta < 0 ? '#c62828' : '#1a2744' }}>
                            {fmtDelta(gpaDelta)}
                        </div>
                        <div style={s.statDelta}>
                            {gpaDelta === null ? '—' : gpaDelta > 0 ? '↑ improvement' : gpaDelta === 0 ? 'no change' : '↓ check selections'}
                        </div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>S/U'd MCs</div>
                        <div style={s.statValue}>{suMCs}<span style={{ fontSize: '13px', fontWeight: '400', color: '#7a6a5a', marginLeft: '3px' }}>mc</span></div>
                        <div style={s.statDelta}>of ~32 MC allowance</div>
                    </div>
                </div>

                {/* Module input table */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitle}>Your Modules</div>
                        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a' }}>
                            {modules.filter(m => m.isSU).length} module{modules.filter(m => m.isSU).length !== 1 ? 's' : ''} S/U'd
                        </div>
                    </div>

                    {/* Table column headers */}
                    <div style={s.tableHead}>
                        <span style={{ flex: 2.2 }}>Module Code</span>
                        <span style={{ flex: 1.4 }}>Grade</span>
                        <span style={{ flex: 0.9, textAlign: 'center' }}>MCs</span>
                        <span style={{ flex: 1.1, textAlign: 'center' }}>Eligible</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>S/U</span>
                        <span style={{ flex: 1, textAlign: 'center' }}>Grade Pt</span>
                        <span style={{ width: '28px' }}></span>
                    </div>

                    {/* Module rows */}
                    {modules.map(m => {
                        const isRec = recommendations.some(r => r.id === m.id)
                        const rowStyle = m.isSU ? s.moduleRowSU : isRec ? s.moduleRowRec : s.moduleRow
                        const gp = m.grade ? GRADE_POINTS[m.grade] : null

                        return (
                            <div key={m.id} style={rowStyle}>
                                <input
                                    style={{ ...s.inputCode, opacity: m.isSU ? 0.6 : 1 }}
                                    placeholder="e.g. CS2103T"
                                    value={m.code}
                                    onChange={e => updateRow(m.id, 'code', e.target.value.toUpperCase())}
                                />
                                <select
                                    style={s.selectGrade}
                                    value={m.grade}
                                    disabled={m.isSU}
                                    onChange={e => updateRow(m.id, 'grade', e.target.value)}
                                >
                                    {GRADE_OPTIONS.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                                <input
                                    style={s.inputMCs}
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={m.mcs}
                                    onChange={e => updateRow(m.id, 'mcs', Math.max(1, Number(e.target.value)))}
                                />
                                {/* Eligible toggle - untick for modules NUSMods marks as non-S/U-able */}
                                <div style={{ flex: 1.1, display: 'flex', justifyContent: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={m.suEligible}
                                        onChange={e => {
                                            updateRow(m.id, 'suEligible', e.target.checked)
                                            if (!e.target.checked) updateRow(m.id, 'isSU', false)
                                        }}
                                        title="Untick if NUSMods shows this module cannot be S/U'd"
                                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1a2744' }}
                                    />
                                </div>
                                <button
                                    style={!m.suEligible
                                        ? { ...s.suToggleOff, opacity: 0.35, cursor: 'not-allowed' }
                                        : m.isSU ? s.suToggleOn : s.suToggleOff
                                    }
                                    onClick={() => m.suEligible && updateRow(m.id, 'isSU', !m.isSU)}
                                    title={!m.suEligible ? "This module cannot be S/U'd" : m.isSU ? 'Click to undo S/U' : 'Click to S/U this module'}
                                    disabled={!m.suEligible}
                                >
                                    {m.isSU ? 'S/U ✓' : 'S/U'}
                                </button>
                                <span style={m.isSU ? s.gpBadgeSU : s.gpBadge}>
                                    {m.isSU ? '—' : gp !== null ? gp.toFixed(1) : '—'}
                                </span>
                                {modules.length > 1
                                    ? <button style={s.removeBtn} onClick={() => removeRow(m.id)} title="Remove">×</button>
                                    : <span style={{ width: '28px' }} />
                                }
                            </div>
                        )
                    })}

                    <button style={s.addRowBtn} onClick={addRow}>
                        + Add Module
                    </button>
                </div>

                {/* Recommendations panel - only shown when there are suggestions */}
                {recommendations.length > 0 && (
                    <div style={s.recPanel}>
                        <div style={s.recHeader}>
                            <div style={s.recTitle}>💡 Recommended S/Us</div>
                            <button style={{ ...s.btnPrimary, padding: '6px 12px', fontSize: '12px' }} onClick={applyRecommendations}>
                                Apply All
                            </button>
                        </div>
                        <div style={s.recSubtitle}>
                            These modules are dragging your GPA down - their grade points sit below your current
                            GPA of <strong>{fmt(currentGPA)}</strong>. S/U-ing them removes them from the calculation entirely.
                        </div>
                        <div style={s.recChipRow}>
                            {recommendations.map(m => (
                                <div key={m.id} style={s.recChip}>
                                    <span style={s.recCode}>{m.code || 'Unnamed'}</span>
                                    <span style={s.recGrade}>{m.grade} · {GRADE_POINTS[m.grade].toFixed(1)}</span>
                                    <span style={s.recMCs}>{m.mcs} MC</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NUS S/U policy reminder */}
                <div style={s.policyNote}>
                    <span style={{ fontSize: '13px', flexShrink: 0 }}>ℹ</span>
                    <p style={s.policyText}>
                        NUS students typically have <strong>32 MCs</strong> of S/U options across their degree.
                        Under the AY2021/22+ policy, an <strong>S</strong> grade is awarded for D and above -
                        it is a pass and does not affect your GPA. A <strong>U</strong> grade is awarded for
                        below D - the module is considered failed and also does not affect GPA.
                        Not all modules are S/U-able - check NUSMods for each module and untick
                        <strong>Eligible</strong> for any that cannot be S/U'd. Always verify your remaining
                        S/U balance on eduRec before exercising any options.
                    </p>
                </div>

            </div>
        </div>
    )
}

export default SUOptimiser