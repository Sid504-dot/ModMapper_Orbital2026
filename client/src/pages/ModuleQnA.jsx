import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BACKEND = 'https://modmapper-orbital2026.onrender.com'

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

    main: { marginLeft: '220px', flex: 1, padding: '36px 40px', maxWidth: '780px' },

    // Module header
    backBtn: { background: 'none', border: 'none', color: '#7a6a5a', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', padding: '0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' },
    moduleHeader: { marginBottom: '28px' },
    moduleCode: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    moduleSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' },
    eligibleBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', padding: '2px 8px', borderRadius: '3px', background: 'rgba(46,125,50,0.1)', color: '#2e7d32', border: '0.5px solid #a5d6a7' },
    readerBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', padding: '2px 8px', borderRadius: '3px', background: '#f5edd8', color: '#7a6a5a', border: '0.5px solid #d4c4a8' },

    // Posts area
    postsArea: { marginBottom: '28px' },
    emptyState: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },

    // Ask a question box
    askCard: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' },
    askHeader: { padding: '12px 18px', borderBottom: '0.5px solid #d4c4a8', fontSize: '13px', fontWeight: '500', color: '#1a2744' },
    askBody: { padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' },
    textarea: { width: '100%', minHeight: '80px', border: '0.5px solid #d4c4a8', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', color: '#1a2744', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
    submitBtn: { alignSelf: 'flex-end', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '5px', padding: '7px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },

    // Locked answer box
    lockedCard: { background: 'rgba(26,39,68,0.03)', border: '0.5px dashed #d4c4a8', borderRadius: '10px', padding: '16px 18px', fontSize: '12px', color: '#7a6a5a', textAlign: 'center' },

    loadingState: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
}

function ModuleQnA() {
    const { moduleCode } = useParams()
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [canAnswer, setCanAnswer] = useState(false)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [question, setQuestion] = useState('')

    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    // Check if user can answer questions for this module
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return
        fetch(`${BACKEND}/qnahub`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => {
                if (r.status === 401) { navigate('/login'); return null }
                if (!r.ok) throw new Error()
                return r.json()
            })
            .then(data => {
                if (!data) return
                setCanAnswer(data.includes(moduleCode))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [moduleCode, navigate])

    // Posts fetch goes here once Sid ships GET /qnahub/:moduleCode/posts

    const handleSubmitQuestion = () => {
        // POST /qnahub/:moduleCode/posts goes here once Sid's endpoint is ready
        // for now just clear the box
        setQuestion('')
    }

    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'MM'

    return (
        <div style={s.page}>

            {/* Sidebar — Q&A Community active */}
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
                <div style={s.navItem}><div style={s.navDot} />Group Finder</div>

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

                {/* Back button */}
                <button style={s.backBtn} onClick={() => navigate('/qna-hub')}>
                    ← Back to search
                </button>

                {/* Module header */}
                <div style={s.moduleHeader}>
                    <div style={s.moduleCode}>{moduleCode}</div>
                    <div style={s.moduleSub}>
                        <span>Q&amp;A Hub</span>
                        {!loading && (
                            canAnswer
                                ? <span style={s.eligibleBadge}>Can ask &amp; answer</span>
                                : <span style={s.readerBadge}>Can ask questions</span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div style={s.loadingState}>Loading...</div>
                ) : (
                    <>
                        {/* Posts list — placeholder until Sid's endpoint is ready */}
                        <div style={s.postsArea}>
                            {posts.length === 0 ? (
                                <div style={s.emptyState}>
                                    <div>No questions yet for {moduleCode}</div>
                                    <div style={s.emptyCode}>be the first to ask something</div>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <div key={post.id}>{post.content}</div>
                                ))
                            )}
                        </div>

                        {/* Ask a question — available to all logged-in users */}
                        <div style={s.askCard}>
                            <div style={s.askHeader}>Ask a question</div>
                            <div style={s.askBody}>
                                <textarea
                                    style={s.textarea}
                                    placeholder={`Ask something about ${moduleCode}...`}
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                />
                                <button
                                    style={s.submitBtn}
                                    onClick={handleSubmitQuestion}
                                    disabled={!question.trim()}
                                >
                                    Post Question
                                </button>
                            </div>
                        </div>

                        {/* Answer box — only unlocked if user has taken this module */}
                        {canAnswer ? (
                            <div style={s.askCard}>
                                <div style={s.askHeader}>Post an answer</div>
                                <div style={s.askBody}>
                                    <textarea
                                        style={s.textarea}
                                        placeholder="Share your experience or answer a question..."
                                    />
                                    <button style={s.submitBtn}>Post Answer</button>
                                </div>
                            </div>
                        ) : (
                            <div style={s.lockedCard}>
                                Answer posting is available once you have completed {moduleCode}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ModuleQnA