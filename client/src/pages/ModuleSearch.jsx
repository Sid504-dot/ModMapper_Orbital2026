import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { NUSMODS_MODULE_LIST_URL } from '../constants'

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },

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
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [modules, setModules] = useState([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(NUSMODS_MODULE_LIST_URL)
            .then(res => res.json())
            .then(data => {
                setModules(data)
                setLoading(false)
            })
    }, [])

    // Filter runs on every keystroke — no submit needed since the list is
    // already in memory after the initial fetch.
    const filtered = modules.filter(mod =>
        mod.moduleCode.toLowerCase().includes(query.toLowerCase()) ||
        mod.title.toLowerCase().includes(query.toLowerCase())
    )

    const shown = filtered.slice(0, 40)

    return (
        <div style={s.page}>

            <Sidebar active="modules" userEmail={userEmail} />

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
