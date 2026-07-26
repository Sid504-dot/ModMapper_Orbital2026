import { useState, useEffect, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { BACKEND, NUSMODS_MODULE_LIST_URL, NUSMODS_MODULE_URL, SOC_MAJORS, SOC_SECOND_MAJORS, SOC_MINORS } from '../constants'
import { parseApi } from '../utils/api'

// Y1S1=1, Y1S2=2, Y2S1=3 … Y4S2=8 — matches backend semIndex field (not semNumber)
const SEMS = [
    { year: 1, sem: 1, idx: 1 }, { year: 1, sem: 2, idx: 2 },
    { year: 2, sem: 1, idx: 3 }, { year: 2, sem: 2, idx: 4 },
    { year: 3, sem: 1, idx: 5 }, { year: 3, sem: 2, idx: 6 },
    { year: 4, sem: 1, idx: 7 }, { year: 4, sem: 2, idx: 8 },
]

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D+', 'D', 'F']

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px' },
    remainBadge: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", padding: '5px 12px', background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '4px', color: '#7a6a5a' },
    errorBanner: { padding: '10px 16px', background: '#fdecea', border: '0.5px solid #f5c6cb', borderRadius: '6px', color: '#b71c1c', fontSize: '13px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

    progCard: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', padding: '18px 22px', marginBottom: '18px' },
    progCardTitle: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7a6a5a', marginBottom: '14px' },
    progRow: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
    progGroup: { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '148px' },
    progLabel: { fontSize: '11px', color: '#7a6a5a', fontWeight: '500' },
    progSelect: { padding: '8px 10px', background: '#fff', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '13px', color: '#1f1a16', fontFamily: 'inherit', outline: 'none' },
    progActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    saveBtn: { padding: '8px 18px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
    saveBtnDis: { padding: '8px 18px', background: '#d4c4a8', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500', cursor: 'not-allowed', fontFamily: 'inherit' },
    progStatus: { fontSize: '11px', color: '#7a6a5a', fontFamily: "'JetBrains Mono', monospace" },

    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' },
    cell: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: '190px' },
    cellHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '0.5px solid #d4c4a8' },
    cellTitle: { fontSize: '13px', fontWeight: '600', color: '#1a2744' },
    cellMc: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', marginTop: '1px' },
    addBtn: { fontSize: '18px', lineHeight: '1', padding: '1px 8px', background: 'transparent', border: '0.5px solid #d4c4a8', borderRadius: '4px', color: '#b85c38', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '300' },
    modList: { flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' },
    emptyCell: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4c4a8', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" },

    modRow: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#fff', borderRadius: '6px', border: '0.5px solid #e8dcc8' },
    modLeft: { flex: 1, minWidth: 0 },
    modCode: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#3d5a73' },
    modName: { fontSize: '11px', color: '#7a6a5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' },
    modMc: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', flexShrink: 0 },
    gradeSelect: { fontSize: '10px', padding: '2px 3px', border: '0.5px solid #d4c4a8', borderRadius: '3px', background: '#f5edd8', color: '#1a2744', fontFamily: "'JetBrains Mono', monospace", outline: 'none', cursor: 'pointer', flexShrink: 0 },
    suCheck: { cursor: 'pointer', flexShrink: 0, width: '13px', height: '13px' },
    delBtn: { background: 'none', border: 'none', color: '#d4c4a8', fontSize: '15px', cursor: 'pointer', padding: '0', lineHeight: '1', flexShrink: 0 },

    summaryBar: { padding: '13px 20px', background: '#1a2744', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    sumLabel: { fontSize: '13px', color: 'rgba(253,248,242,0.6)', fontFamily: "'JetBrains Mono', monospace" },
    sumValue: { fontSize: '14px', fontWeight: '600', color: '#fdf8f2', fontFamily: "'JetBrains Mono', monospace" },

    overlay: { position: 'fixed', inset: 0, background: 'rgba(26,39,68,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: '#fdf8f2', borderRadius: '12px', padding: '24px', width: '480px', maxHeight: '72vh', display: 'flex', flexDirection: 'column', border: '0.5px solid #d4c4a8', boxShadow: '0 8px 32px rgba(26,39,68,0.18)' },
    modalTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', marginBottom: '14px' },
    modalInput: { width: '100%', padding: '10px 12px', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' },
    resultList: { overflowY: 'auto', flex: 1 },
    resultRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: '4px', cursor: 'pointer', borderBottom: '0.5px solid #f0e8d8' },
    resultCode: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#3d5a73' },
    resultName: { fontSize: '12px', color: '#7a6a5a', marginTop: '1px' },
    noResults: { padding: '20px', fontSize: '12px', color: '#d4c4a8', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' },
    modalFooter: { marginTop: '12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '0.5px solid #d4c4a8', borderRadius: '4px', fontSize: '13px', color: '#7a6a5a', cursor: 'pointer', fontFamily: 'inherit' },
}

function YearPlanner() {
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [plan, setPlan] = useState([])
    const [mcCache, setMcCache] = useState({})  // moduleCode → int | null
    const [grades, setGrades] = useState({})    // moduleCode → grade string (local only — no backend endpoint yet)
    const [moduleList, setModuleList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeModal, setActiveModal] = useState(null) // { idx, year, sem }
    const [search, setSearch] = useState('')
    const [adding, setAdding] = useState(false)
    const [programmes, setProgrammes] = useState([])   // { id, type, name, acad_year }[] from API
    const [majorId, setMajorId] = useState('')
    const [secondMajorId, setSecondMajorId] = useState('')
    const [minorId, setMinorId] = useState('')
    const [progStatus, setProgStatus] = useState('')

    const token = localStorage.getItem('token')
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    const modByCode = useMemo(() => {
        const m = {}
        for (const mod of moduleList) m[mod.moduleCode] = mod
        return m
    }, [moduleList])

    const loadPlan = async () => {
        const res = await fetch(`${BACKEND}/planner/plan`, { headers: { Authorization: `Bearer ${token}` } })
        const result = await parseApi(res)
        if (result.ok) {
            setPlan(result.data.plan ?? [])
            return result.data.plan ?? []
        }
        setError(result.error || 'Failed to load plan')
        return []
    }

    const fetchMcBatch = (codes) => {
        const missing = codes.filter(c => !(c in mcCache))
        if (!missing.length) return
        Promise.all(
            missing.map(c =>
                fetch(NUSMODS_MODULE_URL(c)).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        ).then(results => {
            const updates = {}
            missing.forEach((c, i) => {
                updates[c] = results[i]?.moduleCredit ? parseInt(results[i].moduleCredit) : null
            })
            setMcCache(prev => ({ ...prev, ...updates }))
        })
    }

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const [planRes, listRes, progRes] = await Promise.all([
                    fetch(`${BACKEND}/planner/plan`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(NUSMODS_MODULE_LIST_URL).catch(() => null),
                    fetch(`${BACKEND}/planner/`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
                ])
                if (cancelled) return

                const planResult = await parseApi(planRes)
                if (planResult.ok) {
                    const rows = planResult.data.plan ?? []
                    setPlan(rows)
                    fetchMcBatch(rows.map(r => r.module_code))
                } else {
                    setError(planResult.error || 'Failed to load plan')
                }

                if (listRes?.ok) setModuleList(await listRes.json())

                if (progRes?.ok) {
                    const progResult = await parseApi(progRes)
                    if (progResult.ok) setProgrammes(progResult.data ?? [])
                }
            } catch {
                if (!cancelled) setError('Network error — could not load plan')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [])

    const addModule = async (moduleCode) => {
        if (adding) return
        setAdding(true)
        setError('')
        try {
            const res = await fetch(`${BACKEND}/planner/place`, {
                method: 'POST',
                headers: authH,
                body: JSON.stringify({ moduleCode, semIndex: activeModal.idx, groupId: null }),
            })
            const result = await parseApi(res)
            if (!result.ok) { setError(result.error || 'Failed to add module'); return }
            await loadPlan()
            fetchMcBatch([moduleCode])
            setActiveModal(null)
            setSearch('')
        } catch {
            setError('Network error while adding module')
        } finally {
            setAdding(false)
        }
    }

    const removeModule = async (moduleCode) => {
        setError('')
        try {
            const res = await fetch(`${BACKEND}/planner/remove`, {
                method: 'POST',
                headers: authH,
                body: JSON.stringify({ moduleCode }),
            })
            const result = await parseApi(res)
            if (!result.ok) { setError(result.error || 'Failed to remove module'); return }
            await loadPlan()
        } catch {
            setError('Network error while removing module')
        }
    }

    // TODO: POST /yearplanner/update-grade does not exist in backend (routes/yearPlanner.ts has no such route)
    // Grade stored in local state only until endpoint is added
    const updateGrade = (moduleCode, grade) => {
        setGrades(prev => ({ ...prev, [moduleCode]: grade }))
    }

    // Fallback data used when programmes table is empty — save is disabled in that case
    // since SoC fallback IDs are string keys, not the integer IDs the endpoint requires.
    const usingFallback = programmes.length === 0
    const majors = usingFallback
        ? SOC_MAJORS.map(m => ({ id: m.value, name: m.label }))
        : programmes.filter(p => p.type === 'major')
    const secondMajors = usingFallback
        ? SOC_SECOND_MAJORS.map(m => ({ id: m, name: m }))
        : programmes.filter(p => p.type === 'second_major')
    const minors = usingFallback
        ? SOC_MINORS.map(m => ({ id: m, name: m }))
        : programmes.filter(p => p.type === 'minor')

    const saveProgrammes = async () => {
        const ids = [majorId, secondMajorId, minorId].filter(Boolean).map(Number)
        try {
            const res = await fetch(`${BACKEND}/planner/select-programmes`, {
                method: 'POST', headers: authH,
                body: JSON.stringify({ programmeIDs: ids }),
            })
            const result = await parseApi(res)
            if (result.ok) { setProgStatus('Saved'); setTimeout(() => setProgStatus(''), 2000) }
            else setError(result.error || 'Failed to save programmes')
        } catch { setError('Network error while saving programmes') }
    }

    const planBySem = (idx) => plan.filter(r => r.sem_index === idx)
    const mcsBySem = (idx) => planBySem(idx).reduce((sum, r) => sum + (mcCache[r.module_code] ?? 0), 0)
    const totalMCs = plan.reduce((sum, r) => sum + (mcCache[r.module_code] ?? 0), 0)

    const filtered = search.length >= 2
        ? moduleList
            .filter(m =>
                m.moduleCode.toLowerCase().includes(search.toLowerCase()) ||
                m.title.toLowerCase().includes(search.toLowerCase())
            )
            .slice(0, 50)
        : []

    if (loading) return (
        <div style={s.page}>
            <Sidebar active="planner" userEmail={userEmail} />
            <div style={{ ...s.main, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#7a6a5a', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>Loading plan...</div>
            </div>
        </div>
    )

    return (
        <div style={s.page}>
            <Sidebar active="planner" userEmail={userEmail} />

            <div style={s.main}>
                <div style={s.topbar}>
                    <div>
                        <div style={s.pageTitle}>4-Year Planner</div>
                        <div style={s.pageSub}>Map out your full degree across 8 semesters</div>
                    </div>
                    <div style={s.remainBadge}>{Math.max(0, 160 - totalMCs)} MCs remaining</div>
                </div>

                {error && (
                    <div style={s.errorBanner}>
                        <span>{error}</span>
                        <span style={{ cursor: 'pointer', fontSize: '16px' }} onClick={() => setError('')}>×</span>
                    </div>
                )}

                {/* Programme selector */}
                <div style={s.progCard}>
                    <div style={s.progCardTitle}>Programme</div>
                    <div style={s.progRow}>
                        <div style={s.progGroup}>
                            <label style={s.progLabel}>Major *</label>
                            <select style={s.progSelect} value={majorId} onChange={e => setMajorId(e.target.value)}>
                                <option value="">Select major...</option>
                                {majors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={s.progGroup}>
                            <label style={s.progLabel}>Second Major</label>
                            <select style={s.progSelect} value={secondMajorId} onChange={e => setSecondMajorId(e.target.value)}>
                                <option value="">None</option>
                                {secondMajors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={s.progGroup}>
                            <label style={s.progLabel}>Minor</label>
                            <select style={s.progSelect} value={minorId} onChange={e => setMinorId(e.target.value)}>
                                <option value="">None</option>
                                {minors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div style={s.progActions}>
                            {usingFallback && majorId && <span style={s.progStatus}>Seed programmes table to save</span>}
                            {!usingFallback && progStatus && <span style={s.progStatus}>{progStatus}</span>}
                            <button
                                style={majorId && !usingFallback ? s.saveBtn : s.saveBtnDis}
                                onClick={saveProgrammes}
                                disabled={!majorId || usingFallback}
                            >Save</button>
                        </div>
                    </div>
                </div>

                {/* 4×2 semester grid — TODO: prereq/preclusion warnings deferred to next iteration */}
                <div style={s.grid}>
                    {SEMS.map(({ year, sem, idx }) => {
                        const mods = planBySem(idx)
                        const mcs = mcsBySem(idx)
                        return (
                            <div key={idx} style={s.cell}>
                                <div style={s.cellHead}>
                                    <div>
                                        <div style={s.cellTitle}>Y{year} · S{sem}</div>
                                        <div style={s.cellMc}>{mcs} MCs</div>
                                    </div>
                                    <button
                                        style={s.addBtn}
                                        onClick={() => { setActiveModal({ idx, year, sem }); setSearch('') }}
                                    >+</button>
                                </div>
                                {mods.length === 0 ? (
                                    <div style={s.emptyCell}>No modules planned yet</div>
                                ) : (
                                    <div style={s.modList}>
                                        {mods.map(row => (
                                            <div key={row.module_code} style={s.modRow}>
                                                <div style={s.modLeft}>
                                                    <div style={s.modCode}>{row.module_code}</div>
                                                    <div style={s.modName}>{modByCode[row.module_code]?.title ?? ''}</div>
                                                </div>
                                                <span style={s.modMc}>
                                                    {mcCache[row.module_code] != null ? `${mcCache[row.module_code]}MC` : '—MC'}
                                                </span>
                                                <select
                                                    style={s.gradeSelect}
                                                    value={grades[row.module_code] ?? ''}
                                                    onChange={e => updateGrade(row.module_code, e.target.value)}
                                                    title="Grade"
                                                >
                                                    <option value="">—</option>
                                                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                                {/* TODO: S/U — call POST /profile/updateUsedSu when toggled */}
                                                <input type="checkbox" style={s.suCheck} title="S/U (visual only)" />
                                                <button
                                                    style={s.delBtn}
                                                    onClick={() => removeModule(row.module_code)}
                                                    title="Remove"
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div style={s.summaryBar}>
                    <div style={s.sumLabel}>Total MCs planned</div>
                    <div style={s.sumValue}>{totalMCs} / 160</div>
                </div>
            </div>

            {/* Module search modal */}
            {activeModal && (
                <div style={s.overlay} onClick={() => setActiveModal(null)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.modalTitle}>
                            Add Module — Y{activeModal.year} · S{activeModal.sem}
                        </div>
                        <input
                            style={s.modalInput}
                            placeholder="Search by code or title (e.g. CS2030, Data Structures)"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        <div style={s.resultList}>
                            {moduleList.length === 0 ? (
                                <div style={s.noResults}>Loading module list...</div>
                            ) : search.length < 2 ? (
                                <div style={s.noResults}>Type at least 2 characters to search</div>
                            ) : filtered.length === 0 ? (
                                <div style={s.noResults}>No modules found for "{search}"</div>
                            ) : filtered.map(m => (
                                <div
                                    key={m.moduleCode}
                                    style={s.resultRow}
                                    onClick={() => addModule(m.moduleCode)}
                                >
                                    <div>
                                        <div style={s.resultCode}>{m.moduleCode}</div>
                                        <div style={s.resultName}>{m.title}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={s.modalFooter}>
                            {adding && <span style={{ fontSize: '12px', color: '#7a6a5a', fontFamily: "'JetBrains Mono', monospace", marginRight: 'auto' }}>Adding...</span>}
                            <button style={s.cancelBtn} onClick={() => setActiveModal(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default YearPlanner
