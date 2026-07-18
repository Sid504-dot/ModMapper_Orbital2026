import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { BACKEND } from '../constants'

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px' },
    semBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.04em', padding: '5px 10px', background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '4px', color: '#7a6a5a', marginRight: '10px' },
    btnGenerate: { background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' },
    statCard: { background: '#f5edd8', borderRadius: '8px', padding: '16px 18px', border: '0.5px solid #d4c4a8' },
    statLabel: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a6a5a', marginBottom: '8px' },
    statValue: { fontSize: '26px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.03em' },
    statDelta: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#b85c38', marginTop: '4px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' },
    card: { background: '#f5edd8', borderRadius: '10px', border: '0.5px solid #d4c4a8', overflow: 'hidden' },
    cardHeader: { padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #d4c4a8' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#1a2744', letterSpacing: '-0.01em' },
    cardAction: { fontSize: '12px', color: '#b85c38', cursor: 'pointer' },
    moduleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '0.5px solid #d4c4a8' },
    moduleLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    colorBar: (color) => ({ width: '3px', height: '36px', borderRadius: '2px', flexShrink: 0, background: color }),
    moduleCode: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#3d5a73' },
    moduleName: { fontSize: '13px', fontWeight: '500', color: '#1f1a16' },
    moduleMeta: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', marginTop: '1px' },
    mcBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', padding: '3px 8px', borderRadius: '3px', background: 'rgba(26,39,68,0.08)', color: '#1a2744' },
    rightCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
    progressWrap: { padding: '16px 20px' },
    progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7a6a5a', marginBottom: '8px' },
    progressTrack: { height: '6px', background: '#ede4cc', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' },
    progressFill: (w, color) => ({ height: '100%', borderRadius: '3px', background: color || '#b85c38', width: w }),
    quickItem: { padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #d4c4a8' },
    quickLabel: { fontSize: '13px', color: '#1f1a16' },
    quickVal: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a' },

    // Matric year onboarding modal
    modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(26,39,68,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalCard: { background: '#fdf8f2', border: '0.5px solid #d4c4a8', borderRadius: '12px', padding: '32px 36px', maxWidth: '420px', width: '90%' },
    modalTitle: { fontSize: '18px', fontWeight: '600', color: '#1a2744', marginBottom: '6px' },
    modalSub: { fontSize: '13px', color: '#7a6a5a', marginBottom: '20px', lineHeight: 1.5 },
    modalLabel: { fontSize: '12px', fontWeight: '500', color: '#1a2744', marginBottom: '6px', display: 'block' },
    modalSelect: { width: '100%', padding: '10px 12px', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit', marginBottom: '20px', cursor: 'pointer' },
    modalBtn: { width: '100%', padding: '11px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
    modalError: { fontSize: '12px', color: '#b71c1c', marginTop: '8px', textAlign: 'center' },
}

const modules = [
    { code: 'CS3230', name: 'Design and Analysis of Algorithms', meta: 'Tue 10–12 · Thu 10–12 · Exam: 28 Nov', color: '#b85c38', mc: '4 MC' },
    { code: 'CS3219', name: 'Software Engineering Principles', meta: 'Mon 14–16 · Wed 14–16 · No exam', color: '#1a2744', mc: '4 MC' },
    { code: 'ST2334', name: 'Probability and Statistics', meta: 'Wed 10–12 · Fri 10–11 · Exam: 4 Dec', color: '#3d5a73', mc: '4 MC' },
    { code: 'GEA1000', name: 'Quantitative Reasoning with Data', meta: 'Thu 14–16 · S/U eligible', color: '#7a6a5a', mc: '4 MC' },
    { code: 'CS2103T', name: 'Software Engineering', meta: 'Fri 14–16 · Project-based · No exam', color: '#c9a84c', mc: '4 MC' },
]

function Dashboard() {
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [showMatricModal, setShowMatricModal] = useState(() => !localStorage.getItem('matricYearSet'))
    const [matricYear, setMatricYear] = useState(new Date().getFullYear())
    const [savingMatric, setSavingMatric] = useState(false)
    const [matricError, setMatricError] = useState('')

    const handleSaveMatricYear = async () => {
        setSavingMatric(true)
        setMatricError('')
        try {
            const res = await fetch(`${BACKEND}/profile/userProfile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ matricYear: Number(matricYear) }),
            })
            if (!res.ok) {
                setMatricError('Could not save — please try again')
                return
            }
            localStorage.setItem('matricYearSet', 'true')
            setShowMatricModal(false)
        } catch {
            setMatricError('Network error — please try again')
        } finally {
            setSavingMatric(false)
        }
    }

    return (
        <div style={s.page}>

            {/* One-time matric year onboarding modal */}
            {showMatricModal && (
                <div style={s.modalBackdrop}>
                    <div style={s.modalCard}>
                        <div style={s.modalTitle}>Welcome to ModMapper</div>
                        <div style={s.modalSub}>
                            To personalise your experience and unlock features like S/U Optimiser
                            and Group Finder, tell us when you matriculated at NUS.
                        </div>
                        <label style={s.modalLabel}>Matriculation year</label>
                        <select
                            style={s.modalSelect}
                            value={matricYear}
                            onChange={e => setMatricYear(e.target.value)}
                        >
                            {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            style={s.modalBtn}
                            onClick={handleSaveMatricYear}
                            disabled={savingMatric}
                        >
                            {savingMatric ? 'Saving...' : 'Continue'}
                        </button>
                        {matricError && <div style={s.modalError}>{matricError}</div>}
                    </div>
                </div>
            )}

            {/* Shared Sidebar component which replaces ~50 lines of duplicated JSX */}
            <Sidebar active="dashboard" userEmail={userEmail} />

            <div style={s.main}>
                <div style={s.topbar}>
                    <div>
                        <div style={s.pageTitle}>Welcome back</div>
                        <div style={s.pageSub}>Here's where your academic plan stands</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={s.semBadge}>AY2526 · SEM 1</span>
                        <button style={s.btnGenerate}>Generate Plan →</button>
                    </div>
                </div>

                <div style={s.statsRow}>
                    {[
                        { label: 'MCs Completed', value: '60', unit: 'mc', delta: '↑ 20mc this sem' },
                        { label: 'Current CAP', value: '4.2', unit: '', delta: '↑ 0.1 from last sem' },
                        { label: 'Semesters Left', value: '6', unit: 'sem', delta: 'On track to graduate' },
                        { label: 'MCs This Sem', value: '20', unit: 'mc', delta: '5 modules enrolled' },
                    ].map((stat) => (
                        <div key={stat.label} style={s.statCard}>
                            <div style={s.statLabel}>{stat.label}</div>
                            <div style={s.statValue}>{stat.value}<span style={{ fontSize: '13px', fontWeight: '400', color: '#7a6a5a', marginLeft: '3px' }}>{stat.unit}</span></div>
                            <div style={s.statDelta}>{stat.delta}</div>
                        </div>
                    ))}
                </div>

                <div style={s.grid}>
                    <div style={s.card}>
                        <div style={s.cardHeader}>
                            <div style={s.cardTitle}>This Semester's Modules</div>
                            <div style={s.cardAction}>View timetable →</div>
                        </div>
                        {modules.map((m) => (
                            <div key={m.code} style={s.moduleRow}>
                                <div style={s.moduleLeft}>
                                    <div style={s.colorBar(m.color)}></div>
                                    <div>
                                        <div style={s.moduleCode}>{m.code}</div>
                                        <div style={s.moduleName}>{m.name}</div>
                                        <div style={s.moduleMeta}>{m.meta}</div>
                                    </div>
                                </div>
                                <span style={s.mcBadge}>{m.mc}</span>
                            </div>
                        ))}
                    </div>

                    <div style={s.rightCol}>
                        <div style={s.card}>
                            <div style={s.cardHeader}><div style={s.cardTitle}>Graduation Progress</div></div>
                            <div style={s.progressWrap}>
                                {[
                                    { label: 'Total MCs', val: '60 / 160', w: '37.5%', color: '#b85c38' },
                                    { label: 'Core Modules', val: '18 / 36', w: '50%', color: '#1a2744' },
                                    { label: 'GE Modules', val: '4 / 20', w: '20%', color: '#3d5a73' },
                                ].map((p) => (
                                    <div key={p.label}>
                                        <div style={s.progressLabel}><span>{p.label}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{p.val}</span></div>
                                        <div style={s.progressTrack}><div style={s.progressFill(p.w, p.color)}></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={s.card}>
                            <div style={s.cardHeader}><div style={s.cardTitle}>Quick Info</div></div>
                            {[
                                { label: 'Major', val: 'Computer Science' },
                                { label: 'Year / Sem', val: 'Y2 · S1' },
                                { label: 'S/U remaining', val: '12 MC left' },
                                { label: 'Next milestone', val: 'Exam: 28 Nov' },
                            ].map((item) => (
                                <div key={item.label} style={{ ...s.quickItem, borderBottom: '0.5px solid #d4c4a8' }}>
                                    <div style={s.quickLabel}>{item.label}</div>
                                    <div style={s.quickVal}>{item.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard