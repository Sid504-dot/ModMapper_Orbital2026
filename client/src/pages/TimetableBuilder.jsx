import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { BACKEND, DAYS, DAY_LABELS, MODULE_COLOURS } from '../constants'

const PX_PER_MIN = 1.6
const START_HOUR = 8

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

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, display: 'flex', minHeight: '100vh' },
    leftPanel: { width: '272px', flexShrink: 0, padding: '28px 16px', borderRight: '1px solid #d4c4a8', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', background: '#fdf8f2' },
    leftTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', margin: 0, letterSpacing: '-0.01em' },
    searchInput: { padding: '8px 10px', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit' },
    searchBtn: { padding: '8px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.04em' },
    resultRow: { fontSize: '12px', padding: '6px 8px', background: '#f5edd8', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '0.5px solid #d4c4a8' },
    resultAddBtn: { background: '#1a2744', color: '#fdf8f2', border: 'none', borderRadius: '3px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, marginLeft: '6px', fontFamily: "'JetBrains Mono', monospace" },
    addedLabel: { fontSize: '10px', fontWeight: '600', color: '#7a6a5a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'JetBrains Mono', monospace" },
    moduleCard: { borderRadius: '6px', border: '0.5px solid #d4c4a8', padding: '8px 10px', background: '#fff' },
    moduleCardHeader: { display: 'flex', alignItems: 'center', gap: '8px' },
    moduleColourDot: (colour) => ({ width: '10px', height: '10px', borderRadius: '2px', background: colour, flexShrink: 0 }),
    moduleCode: { fontSize: '12px', fontWeight: '600', color: '#1a2744', flex: 1, fontFamily: "'JetBrains Mono', monospace" },
    removeBtn: { background: 'none', border: 'none', color: '#7a6a5a', cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: '0 2px' },
    slotRow: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' },
    slotLabel: { fontSize: '10px', color: '#7a6a5a', minWidth: '68px', fontFamily: "'JetBrains Mono', monospace" },
    slotSelect: { flex: 1, border: '0.5px solid #d4c4a8', borderRadius: '4px', padding: '2px 4px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: '#fdf8f2', cursor: 'pointer', color: '#1a2744', outline: 'none' },
    rightPanel: { flex: 1, padding: '28px 24px', overflowY: 'auto', background: '#fdf8f2' },
    rightTopbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    rightTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2744', margin: 0, letterSpacing: '-0.01em' },
    saveBtn: (status) => ({
        background: status === 'saved' ? '#2e7d32' : status === 'error' ? '#c62828' : '#b85c38',
        color: '#fff', border: 'none', borderRadius: '4px',
        padding: '7px 14px', fontSize: '12px', fontWeight: '600',
        cursor: status === 'saving' ? 'not-allowed' : 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'background 0.2s', letterSpacing: '0.02em',
    }),
    clashBanner: { background: '#fdecea', border: '0.5px solid #f5a19a', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#b71c1c' },
    loadError: { fontSize: '11px', color: '#b71c1c', background: '#fdecea', borderRadius: '4px', padding: '6px 8px', border: '0.5px solid #f5a19a' },
    dayHeaders: { display: 'flex', marginLeft: '52px', marginBottom: '4px' },
    dayLabel: { flex: 1, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: '600', color: '#1a2744', letterSpacing: '0.06em' },
}


function TimetableBuilder() {
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [addedModules, setAddedModules] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedSlots, setSelectedSlots] = useState({})
    const [saveStatus, setSaveStatus] = useState('')
    const [loadError, setLoadError] = useState('')

    // Load saved timetable on mount — reconstructs state from flat lesson array
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        let cancelled = false
        const load = async () => {
            try {
                const res = await fetch(`${BACKEND}/timetable`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.status === 500 || res.status === 404) return
                if (!res.ok) throw new Error(`Unexpected status ${res.status}`)
                const data = await res.json()
                if (cancelled) return

                const row = Array.isArray(data) ? data[0] : data
                if (!row || !Array.isArray(row.timetable_data)) return

                const flatLessons = row.timetable_data

                // Rebuild selectedSlots: { moduleCode: { lessonType: classNo } }
                const rebuiltSlots = {}
                flatLessons.forEach(l => {
                    if (!rebuiltSlots[l.moduleCode]) rebuiltSlots[l.moduleCode] = {}
                    rebuiltSlots[l.moduleCode][l.lessonType] = l.classNo
                })

                // Refetch full module data from NUSMods for each unique moduleCode
                const uniqueCodes = [...new Set(flatLessons.map(l => l.moduleCode))]
                const modulePromises = uniqueCodes.map(code =>
                    fetch(`https://api.nusmods.com/v2/2024-2025/modules/${encodeURIComponent(code)}.json`)
                        .then(r => r.ok ? r.json() : null)
                )
                const modules = (await Promise.all(modulePromises)).filter(Boolean)

                if (cancelled) return
                setSelectedSlots(rebuiltSlots)
                setAddedModules(modules)
            } catch {
                if (!cancelled) setLoadError('Could not load saved timetable.')
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

    // Save timetable — sends flat lesson array to match backend contract
    const handleSave = async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        setSaveStatus('saving')

        // Build the flat array the backend contract expects
        const timetable_data = []
        addedModules.forEach(mod => {
            const semData = mod.semesterData?.find(s => s.semester === 1)
            if (!semData) return
            const modSlots = selectedSlots[mod.moduleCode] || {}
            semData.timetable.forEach(lesson => {
                if (lesson.classNo === modSlots[lesson.lessonType]) {
                    timetable_data.push({
                        moduleCode: mod.moduleCode,
                        lessonType: lesson.lessonType,
                        classNo: lesson.classNo,
                        day: lesson.day,
                        startTime: lesson.startTime,
                        endTime: lesson.endTime,
                    })
                }
            })
        })

        try {
            const res = await fetch(`${BACKEND}/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ timetable_data }),
            })
            setSaveStatus(res.ok ? 'saved' : 'error')
        } catch {
            setSaveStatus('error')
        }
        setTimeout(() => setSaveStatus(''), 2500)
    }

    // Module search (NUSMods list — no backend search endpoint yet)
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

    // Add module — fetches full NUSMods detail
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

    return (
        <div style={s.page}>

            <Sidebar active="timetable" userEmail={userEmail} />

            <div style={s.main}>

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

                <div style={s.rightPanel}>

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

                    {clashes.length > 0 && (
                        <div style={s.clashBanner}>
                            <strong>⚠ {clashes.length} clash{clashes.length > 1 ? 'es' : ''} detected</strong>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                                {clashes.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}

                    <div style={s.dayHeaders}>
                        {DAY_LABELS.map(d => (
                            <div key={d} style={s.dayLabel}>{d}</div>
                        ))}
                    </div>

                    <div style={{ display: 'flex' }}>

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

                        {DAYS.map(day => (
                            <div key={day} style={{ flex: 1, position: 'relative', height: totalHeight, borderLeft: '1px solid #d4c4a8' }}>

                                {hourSlots.map(hour => (
                                    <div key={hour} style={{
                                        position: 'absolute', top: minsToTop(hour * 60),
                                        left: 0, right: 0, borderTop: '1px solid #d4c4a8'
                                    }} />
                                ))}

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