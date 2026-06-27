import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const MODULE_COLOURS = ['#b85c38', '#1a2744', '#3d5a73', '#7a6a5a', '#c9a84c', '#2e3f6f']
const PX_PER_MIN = 1.6
const START_HOUR = 8
const BACKEND = 'https://modmapper-orbital2026.onrender.com'

// Time helpers 
const timeToMins = (t) => parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(2, 4))
const minsToTop = (mins) => (mins - START_HOUR * 60) * PX_PER_MIN

// Clash detection 
function detectClashes(addedModules, selectedSlots) {
    const clashes = []
    DAYS.forEach(day => {
        const lessons = []
        addedModules.forEach(mod => {
            const semData = mod.semesterData?.find(s => s.semester === 1)
            if (!semData) return
            const modSlots = selectedSlots[mod.moduleCode] || {}
            semData.timetable.forEach(l => {
                if (l.day === day && l.classNo === modSlots[l.lessonType]) {
                    lessons.push({ ...l, moduleCode: mod.moduleCode })
                }
            })
        })
        for (let i = 0; i < lessons.length; i++) {
            for (let j = i + 1; j < lessons.length; j++) {
                const a = lessons[i], b = lessons[j]
                if (timeToMins(a.startTime) < timeToMins(b.endTime) &&
                    timeToMins(b.startTime) < timeToMins(a.endTime)) {
                    clashes.push(`${a.moduleCode} & ${b.moduleCode} on ${day} (${a.startTime}–${a.endTime})`)
                }
            }
        }
    })
    return [...new Set(clashes)]
}

// Shared styles — same token system as Dashboard 
const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },

    // Sidebar — identical across all pages
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

    // Main area — offset for fixed sidebar
    main: { marginLeft: '220px', flex: 1, display: 'flex', minHeight: '100vh' },

    // Left panel — search + added modules
    leftPanel: { width: '272px', flexShrink: 0, padding: '28px 16px', borderRight: '1px solid #d4c4a8', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', background: '#fdf8f2' },
    leftTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', margin: 0, letterSpacing: '-0.01em' },

    // Search controls
    searchInput: { padding: '8px 10px', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    searchBtn: { padding: '8px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.04em' },

    // Search result rows
    resultRow: { fontSize: '12px', padding: '6px 8px', background: '#f5edd8', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '0.5px solid #d4c4a8' },
    resultAddBtn: { background: '#1a2744', color: '#fdf8f2', border: 'none', borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '6px', fontFamily: "'JetBrains Mono', monospace" },

    // Added modules section
    addedLabel: { fontSize: '10px', fontWeight: '600', color: '#7a6a5a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" },
    moduleCard: { borderRadius: '6px', border: '0.5px solid #d4c4a8', padding: '8px 10px', background: '#fff' },
    moduleCardHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
    moduleColourDot: (colour) => ({ width: '10px', height: '10px', borderRadius: '2px', background: colour, flexShrink: 0 }),
    moduleCode: { fontSize: '12px', fontWeight: '600', color: '#1a2744', flex: 1, fontFamily: "'JetBrains Mono', monospace" },
    removeBtn: { background: 'none', border: 'none', color: '#7a6a5a', cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: '0 2px' },

    // Slot selector dropdowns
    slotRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' },
    slotLabel: { fontSize: '10px', color: '#7a6a5a', minWidth: '68px', fontFamily: "'JetBrains Mono', monospace" },
    slotSelect: { flex: 1, border: '0.5px solid #d4c4a8', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: '#fdf8f2', cursor: 'pointer', color: '#1a2744', outline: 'none' },

    // Right panel — grid
    rightPanel: { flex: 1, padding: '28px 24px', overflowY: 'auto', background: '#fdf8f2' },
    rightTopbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    rightTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', margin: 0, letterSpacing: '-0.01em' },

    // Save button
    saveBtn: (status) => ({
        background: status === 'saved' ? '#2e7d32' : status === 'error' ? '#c62828' : '#b85c38',
        color: '#fff', border: 'none', borderRadius: '4px',
        padding: '7px 14px', fontSize: '12px', fontWeight: '600',
        cursor: status === 'saving' ? 'not-allowed' : 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'background 0.2s', letterSpacing: '0.02em',
    }),

    // Clash warning
    clashBanner: { background: '#fdecea', border: '0.5px solid #f5a19a', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#b71c1c' },

    // Load error
    loadError: { fontSize: '11px', color: '#b71c1c', background: '#fdecea', borderRadius: '4px', padding: '6px 8px', border: '0.5px solid #f5a19a' },

    // Day column headers
    dayHeaders: { display: 'flex', marginLeft: '52px', marginBottom: '4px' },
    dayLabel: { flex: 1, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: '600', color: '#1a2744', letterSpacing: '0.06em' },
}


function TimetableBuilder() {
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [addedModules, setAddedModules] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedSlots, setSelectedSlots] = useState({})
    const [saveStatus, setSaveStatus] = useState('') // '', 'saving', 'saved', 'error'
    const [loadError, setLoadError] = useState('')

    // Auth guard 
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    // Load saved timetable on mount 
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return
        fetch(`${BACKEND}/timetable`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => {
                // 500 = no timetable row yet for this user — treat as empty, not an error
                if (r.status === 500 || r.status === 404) return null
                if (!r.ok) throw new Error(`Unexpected status ${r.status}`)
                return r.json()
            })
            .then(data => {
                if (!data || !data.length) return
                const saved = data[0].timetable_data
                if (saved?.addedModules) setAddedModules(saved.addedModules)
                if (saved?.selectedSlots) setSelectedSlots(saved.selectedSlots)
            })
            .catch(() => setLoadError('Could not load saved timetable.'))
    }, [])

    // Saving timetable 
    const handleSave = async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        setSaveStatus('saving')
        try {
            const res = await fetch(`${BACKEND}/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ timetable_data: { addedModules, selectedSlots } }),
            })
            setSaveStatus(res.ok ? 'saved' : 'error')
        } catch {
            setSaveStatus('error')
        }
        setTimeout(() => setSaveStatus(''), 2500)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }

    //  Module search (NUSMods list — Sid has no search endpoint i think)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        const res = await fetch('https://api.nusmods.com/v2/2024-2025/moduleList.json')
        const data = await res.json()
        const filtered = data.filter(mod =>
            mod.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mod.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        setSearchResults(filtered.slice(0, 13))
    }

    // Add module (NUSMods full detail fetch)
    const handleAddModule = async (moduleCode) => {
        if (addedModules.find(m => m.moduleCode === moduleCode)) {
            alert('Module already added!')
            return
        }
        try {
            const res = await fetch(
                `https://api.nusmods.com/v2/2024-2025/modules/${encodeURIComponent(moduleCode)}.json`
            )
            if (!res.ok) { alert(`Module ${moduleCode} not found.`); return }
            const mod = await res.json()

            // Auto-select first classNo per lessonType
            const semData = mod.semesterData?.find(s => s.semester === 1)
            if (semData) {
                const initialSlots = {}
                semData.timetable.forEach(lesson => {
                    if (!initialSlots[lesson.lessonType]) initialSlots[lesson.lessonType] = lesson.classNo
                })
                setSelectedSlots(prev => ({ ...prev, [moduleCode]: initialSlots }))
            }

            setAddedModules(prev => [...prev, mod])
            setSearchResults([])
            setSearchQuery('')
        } catch (err) {
            console.error('Failed to add module:', err)
            alert('Could not load module. Check your connection.')
        }
    }

    // Remove module 
    const handleRemoveModule = (moduleCode) => {
        setAddedModules(prev => prev.filter(m => m.moduleCode !== moduleCode))
        setSelectedSlots(prev => {
            const next = { ...prev }
            delete next[moduleCode]
            return next
        })
    }

    // Grid helpers 
    const getLessonsForDay = (day) => {
        const lessons = []
        addedModules.forEach(mod => {
            const semData = mod.semesterData?.find(s => s.semester === 1)
            if (!semData) return
            const modSlots = selectedSlots[mod.moduleCode] || {}
            semData.timetable.forEach(lesson => {
                if (lesson.classNo === modSlots[lesson.lessonType] && lesson.day === day) {
                    lessons.push({ ...lesson, moduleCode: mod.moduleCode })
                }
            })
        })
        return lessons
    }

    const getLessonsWithLanes = (day) => {
        const lessons = getLessonsForDay(day)
        if (lessons.length === 0) return []
        const sorted = [...lessons].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))
        const lanes = []
        const assigned = sorted.map(lesson => {
            let laneIndex = 0
            while (true) {
                if (!lanes[laneIndex]) lanes[laneIndex] = []
                const conflict = lanes[laneIndex].some(other =>
                    timeToMins(other.startTime) < timeToMins(lesson.endTime) &&
                    timeToMins(other.endTime) > timeToMins(lesson.startTime)
                )
                if (!conflict) break
                laneIndex++
            }
            lanes[laneIndex].push(lesson)
            return { ...lesson, laneIndex }
        })
        return assigned.map(lesson => {
            const concurrent = assigned.filter(other =>
                timeToMins(other.startTime) < timeToMins(lesson.endTime) &&
                timeToMins(other.endTime) > timeToMins(lesson.startTime)
            )
            return { ...lesson, totalLanes: Math.max(...concurrent.map(l => l.laneIndex)) + 1 }
        })
    }

    // Dynamic end hour — extends grid if any module runs past 6pm
    const getEndHour = () => {
        let maxMins = 18 * 60
        addedModules.forEach(mod => {
            const semData = mod.semesterData?.find(s => s.semester === 1)
            if (!semData) return
            const modSlots = selectedSlots[mod.moduleCode] || {}
            semData.timetable.forEach(lesson => {
                if (lesson.classNo === modSlots[lesson.lessonType]) {
                    const endMins = timeToMins(lesson.endTime)
                    if (endMins > maxMins) maxMins = endMins
                }
            })
        })
        return Math.ceil(maxMins / 60)
    }

    const endHour = getEndHour()
    const totalHeight = (endHour - START_HOUR) * 60 * PX_PER_MIN
    const hourSlots = Array.from({ length: endHour - START_HOUR + 1 }, (_, i) => START_HOUR + i)
    const clashes = detectClashes(addedModules, selectedSlots)
    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    return (
        <div style={s.page}>

            {/* Sidebar — Timetable marked active  */}
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
                <div style={s.navItemActive}><div style={s.navDotActive} />Timetable</div>
                <div style={s.navItem}><div style={s.navDot} />4-Year Planner</div>

                <div style={s.navLabel}>Explore</div>
                <div style={s.navItem} onClick={() => navigate('/modules')}><div style={s.navDot} />Module Search</div>
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

            {/* Main area (sidebar-offset) */}
            <div style={s.main}>

                {/* LEFT PANEL — search + added modules */}
                <div style={s.leftPanel}>
                    <h2 style={s.leftTitle}>Timetable Builder</h2>

                    {loadError && <div style={s.loadError}>{loadError}</div>}

                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={s.searchInput}
                    />
                    <button onClick={handleSearch} style={s.searchBtn}>SEARCH</button>

                    {/* Search results */}
                    {searchResults.map(mod => (
                        <div key={mod.moduleCode} style={s.resultRow}>
                            <span style={{ fontSize: '12px', color: '#1f1a16', lineHeight: 1.4 }}>
                                <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1a2744' }}>{mod.moduleCode}</strong>
                                {' '}{mod.title}
                            </span>
                            <button onClick={() => handleAddModule(mod.moduleCode)} style={s.resultAddBtn}>
                                Add
                            </button>
                        </div>
                    ))}

                    {/* Added modules with slot selectors */}
                    {addedModules.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                            <div style={s.addedLabel}>Added modules</div>
                            {addedModules.map((mod, i) => {
                                const colour = MODULE_COLOURS[i % MODULE_COLOURS.length]
                                const semData = mod.semesterData?.find(s => s.semester === 1)
                                const lessonTypes = semData
                                    ? [...new Set(semData.timetable.map(l => l.lessonType))]
                                    : []

                                return (
                                    <div key={mod.moduleCode} style={{ ...s.moduleCard, marginBottom: '8px' }}>
                                        <div style={s.moduleCardHeader}>
                                            <div style={s.moduleColourDot(colour)} />
                                            <span style={s.moduleCode}>{mod.moduleCode}</span>
                                            <button
                                                onClick={() => handleRemoveModule(mod.moduleCode)}
                                                style={s.removeBtn}
                                                title="Remove module"
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {/* One dropdown per lessonType */}
                                        {lessonTypes.map(lessonType => {
                                            const options = [...new Set(
                                                semData.timetable
                                                    .filter(l => l.lessonType === lessonType)
                                                    .map(l => l.classNo)
                                            )].sort()
                                            const current = selectedSlots[mod.moduleCode]?.[lessonType] ?? options[0] ?? ''

                                            return (
                                                <div key={lessonType} style={s.slotRow}>
                                                    <span style={s.slotLabel}>
                                                        {lessonType.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <select
                                                        value={current}
                                                        onChange={e =>
                                                            setSelectedSlots(prev => ({
                                                                ...prev,
                                                                [mod.moduleCode]: {
                                                                    ...(prev[mod.moduleCode] ?? {}),
                                                                    [lessonType]: e.target.value,
                                                                },
                                                            }))
                                                        }
                                                        style={s.slotSelect}
                                                    >
                                                        {options.map(o => (
                                                            <option key={o} value={o}>{o}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL — timetable grid */}
                <div style={s.rightPanel}>

                    {/* Grid header + save button */}
                    <div style={s.rightTopbar}>
                        <h2 style={s.rightTitle}>Weekly Timetable</h2>
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            style={s.saveBtn(saveStatus)}
                        >
                            {saveStatus === 'saving' ? 'Saving…'
                                : saveStatus === 'saved' ? '✓ Saved'
                                    : saveStatus === 'error' ? 'Error — retry?'
                                        : 'Save'}
                        </button>
                    </div>

                    {/* Clash warning banner */}
                    {clashes.length > 0 && (
                        <div style={s.clashBanner}>
                            <strong>⚠ {clashes.length} clash{clashes.length > 1 ? 'es' : ''} detected</strong>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                                {clashes.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Day column headers */}
                    <div style={s.dayHeaders}>
                        {DAY_LABELS.map(d => (
                            <div key={d} style={s.dayLabel}>{d}</div>
                        ))}
                    </div>

                    {/* Grid body */}
                    <div style={{ display: 'flex' }}>

                        {/* Hour labels */}
                        <div style={{ width: '52px', position: 'relative', height: totalHeight, flexShrink: 0 }}>
                            {hourSlots.map(hour => (
                                <div key={hour} style={{
                                    position: 'absolute',
                                    top: minsToTop(hour * 60) - 7,
                                    right: '8px',
                                    fontSize: '10px',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#7a6a5a',
                                }}>
                                    {hour.toString().padStart(2, '0')}00
                                </div>
                            ))}
                        </div>

                        {/* Day columns */}
                        {DAYS.map(day => (
                            <div key={day} style={{ flex: 1, position: 'relative', height: totalHeight, borderLeft: '1px solid #d4c4a8' }}>

                                {/* Hour grid lines */}
                                {hourSlots.map(hour => (
                                    <div key={hour} style={{
                                        position: 'absolute', top: minsToTop(hour * 60),
                                        left: 0, right: 0, borderTop: '1px solid #d4c4a8'
                                    }} />
                                ))}

                                {/* Lesson blocks */}
                                {getLessonsWithLanes(day).map(lesson => {
                                    const modIndex = addedModules.findIndex(m => m.moduleCode === lesson.moduleCode)
                                    const color = MODULE_COLOURS[modIndex % MODULE_COLOURS.length]
                                    const top = minsToTop(timeToMins(lesson.startTime))
                                    const height = (timeToMins(lesson.endTime) - timeToMins(lesson.startTime)) * PX_PER_MIN
                                    return (
                                        <div
                                            key={`${lesson.moduleCode}-${lesson.lessonType}-${lesson.classNo}-${lesson.startTime}`}
                                            style={{
                                                position: 'absolute',
                                                top: top + 1,
                                                height: height - 2,
                                                left: `calc(${lesson.laneIndex * (100 / lesson.totalLanes)}% + 2px)`,
                                                width: `calc(${100 / lesson.totalLanes}% - 4px)`,
                                                background: color, borderRadius: '4px',
                                                padding: '4px 6px', color: 'white',
                                                fontSize: '11px', overflow: 'hidden',
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            <div style={{ fontWeight: '600', fontFamily: "'JetBrains Mono', monospace" }}>{lesson.moduleCode}</div>
                                            <div style={{ opacity: 0.85, fontSize: '10px' }}>{lesson.lessonType}</div>
                                            <div style={{ opacity: 0.7, fontSize: '10px' }}>{lesson.startTime}–{lesson.endTime}</div>
                                            <div style={{ opacity: 0.7, fontSize: '10px' }}>{lesson.venue}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TimetableBuilder