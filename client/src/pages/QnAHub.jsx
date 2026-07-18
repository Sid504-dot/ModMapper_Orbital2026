import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { NUSMODS_MODULE_LIST_URL } from '../constants'

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
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

    // Fetch module list for validation — filters in memory so search is instant
    useEffect(() => {
        fetch(NUSMODS_MODULE_LIST_URL)
            .then(r => r.json())
            .then(data => setModuleList(data.map(m => m.moduleCode)))
    }, [])

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

            <Sidebar active="qna" userEmail={userEmail} />

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
