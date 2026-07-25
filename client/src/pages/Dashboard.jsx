import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { BACKEND, NUSMODS_MODULE_URL, MODULE_COLOURS } from '../constants'
import { parseApi } from '../utils/api'

// NUS Sem 1: Aug–Dec, Sem 2: Jan–Jul
function calcYearSem(matricYear) {
    const now = new Date()
    const month = now.getMonth() + 1
    const calYear = now.getFullYear()
    const ayStart = month >= 8 ? calYear : calYear - 1
    const currentSem = month >= 8 ? 1 : 2
    const semsElapsed = (ayStart - matricYear) * 2 + currentSem
    return {
        yearNum: Math.ceil(semsElapsed / 2),
        semNum: semsElapsed % 2 === 0 ? 2 : 1,
        semsLeft: Math.max(0, 8 - semsElapsed),
        ayStart,
        currentSem,
    }
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' }

function fmtTime(t) {
    const h = parseInt(t.slice(0, 2))
    const m = t.slice(2)
    return m === '00' ? String(h) : `${h}:${m}`
}

function buildMeta(lessons) {
    const seen = new Set()
    const slots = []
    for (const l of lessons) {
        const key = `${l.day}|${l.startTime}|${l.endTime}`
        if (!seen.has(key)) { seen.add(key); slots.push(l) }
    }
    slots.sort((a, b) => {
        const d = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
        return d !== 0 ? d : a.startTime.localeCompare(b.startTime)
    })
    return slots.map(l => `${DAY_SHORT[l.day] ?? l.day} ${fmtTime(l.startTime)}–${fmtTime(l.endTime)}`).join(' · ')
}

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
    statDeltaMuted: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#d4c4a8', marginTop: '4px' },
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
    emptyState: { padding: '32px 20px', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
    loadingRow: { padding: '13px 20px', fontSize: '12px', color: '#d4c4a8', fontFamily: "'JetBrains Mono', monospace" },
}

function Dashboard() {
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [modules, setModules] = useState([])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const token = localStorage.getItem('token')
                const headers = { Authorization: `Bearer ${token}` }

                const [profileRes, timetableRes] = await Promise.all([
                    fetch(`${BACKEND}/profile/userProfile`, { headers }),
                    fetch(`${BACKEND}/timetable`, { headers }),
                ])
                const [profileResult, timetableResult] = await Promise.all([
                    parseApi(profileRes),
                    parseApi(timetableRes),
                ])
                if (cancelled) return

                if (profileResult.ok) setProfile(profileResult.data)

                const lessons = timetableResult.ok && timetableResult.data?.timetable_data
                    ? timetableResult.data.timetable_data
                    : []

                const moduleMap = new Map()
                for (const lesson of lessons) {
                    if (!moduleMap.has(lesson.moduleCode)) moduleMap.set(lesson.moduleCode, [])
                    moduleMap.get(lesson.moduleCode).push(lesson)
                }

                const codes = [...moduleMap.keys()]
                const nusmodsData = await Promise.all(
                    codes.map(code =>
                        fetch(NUSMODS_MODULE_URL(code))
                            .then(r => r.ok ? r.json() : null)
                            .catch(() => null)
                    )
                )
                if (cancelled) return

                setModules(codes.map((code, i) => ({
                    code,
                    title: nusmodsData[i]?.title ?? code,
                    meta: buildMeta(moduleMap.get(code)),
                    mc: nusmodsData[i]?.moduleCredit ? `${nusmodsData[i].moduleCredit} MC` : '—',
                    moduleCredit: parseInt(nusmodsData[i]?.moduleCredit) || 0,
                    color: MODULE_COLOURS[i % MODULE_COLOURS.length],
                })))
            } catch (err) {
                console.error('Dashboard load failed:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    const cal = profile?.start_matric_year ? calcYearSem(profile.start_matric_year) : null
    const mcThisSem = modules.reduce((sum, m) => sum + m.moduleCredit, 0)
    const suRemaining = profile?.used_su != null ? 32 - profile.used_su : null
    const ayLabel = cal
        ? `AY${String(cal.ayStart).slice(2)}${String(cal.ayStart + 1).slice(2)} · SEM ${cal.currentSem}`
        : '—'

    return (
        <div style={s.page}>
            <Sidebar active="dashboard" userEmail={userEmail} />

            <div style={s.main}>
                <div style={s.topbar}>
                    <div>
                        <div style={s.pageTitle}>
                            Welcome back{profile?.profile_name ? `, ${profile.profile_name.split(' ')[0]}` : ''}
                        </div>
                        <div style={s.pageSub}>Here's where your academic plan stands</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={s.semBadge}>{ayLabel}</span>
                        <button style={s.btnGenerate}>Generate Plan →</button>
                    </div>
                </div>

                <div style={s.statsRow}>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>MCs Completed</div>
                        <div style={s.statValue}>—<span style={{ fontSize: '13px', fontWeight: '400', color: '#7a6a5a', marginLeft: '3px' }}>mc</span></div>
                        <div style={s.statDeltaMuted}>data coming soon</div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>Current CAP</div>
                        <div style={s.statValue}>{profile?.gpa != null ? Number(profile.gpa).toFixed(2) : '—'}</div>
                        <div style={profile?.gpa != null ? s.statDelta : s.statDeltaMuted}>
                            {profile?.gpa != null ? 'from your profile' : 'set in Profile Settings'}
                        </div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>Semesters Left</div>
                        <div style={s.statValue}>
                            {cal ? cal.semsLeft : '—'}
                            <span style={{ fontSize: '13px', fontWeight: '400', color: '#7a6a5a', marginLeft: '3px' }}>sem</span>
                        </div>
                        <div style={cal ? s.statDelta : s.statDeltaMuted}>
                            {cal ? 'of 8 total' : 'set matric year in profile'}
                        </div>
                    </div>
                    <div style={s.statCard}>
                        <div style={s.statLabel}>MCs This Sem</div>
                        <div style={s.statValue}>
                            {loading ? '—' : mcThisSem}
                            <span style={{ fontSize: '13px', fontWeight: '400', color: '#7a6a5a', marginLeft: '3px' }}>mc</span>
                        </div>
                        <div style={s.statDelta}>
                            {!loading && `${modules.length} module${modules.length !== 1 ? 's' : ''} enrolled`}
                        </div>
                    </div>
                </div>

                <div style={s.grid}>
                    <div style={s.card}>
                        <div style={s.cardHeader}>
                            <div style={s.cardTitle}>This Semester's Modules</div>
                            <div style={s.cardAction}>View timetable →</div>
                        </div>
                        {loading ? (
                            <div style={s.loadingRow}>Loading modules...</div>
                        ) : modules.length === 0 ? (
                            <div style={s.emptyState}>
                                <div>No modules on your timetable yet</div>
                                <div style={s.emptyCode}>add modules in the Timetable Builder</div>
                            </div>
                        ) : modules.map(m => (
                            <div key={m.code} style={s.moduleRow}>
                                <div style={s.moduleLeft}>
                                    <div style={s.colorBar(m.color)} />
                                    <div>
                                        <div style={s.moduleCode}>{m.code}</div>
                                        <div style={s.moduleName}>{m.title}</div>
                                        {m.meta && <div style={s.moduleMeta}>{m.meta}</div>}
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
                                    { label: 'Total MCs', val: '— / 160', w: '0%', color: '#b85c38' },
                                    { label: 'Core Modules', val: '— / 36', w: '0%', color: '#1a2744' },
                                    { label: 'GE Modules', val: '— / 20', w: '0%', color: '#3d5a73' },
                                ].map(p => (
                                    <div key={p.label}>
                                        <div style={s.progressLabel}>
                                            <span>{p.label}</span>
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{p.val}</span>
                                        </div>
                                        <div style={s.progressTrack}><div style={s.progressFill(p.w, p.color)} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={s.card}>
                            <div style={s.cardHeader}><div style={s.cardTitle}>Quick Info</div></div>
                            {[
                                { label: 'Major', val: profile?.major || '—' },
                                { label: 'Year / Sem', val: cal ? `Y${cal.yearNum} · S${cal.semNum}` : '—' },
                                { label: 'S/U remaining', val: suRemaining != null ? `${suRemaining} MC left` : '—' },
                                { label: 'Next milestone', val: 'Check NUSMods' },
                            ].map(item => (
                                <div key={item.label} style={s.quickItem}>
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
