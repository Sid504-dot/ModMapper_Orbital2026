import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { BACKEND } from '../constants'

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px' },
    eligibleBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", padding: '4px 10px', borderRadius: '4px', background: '#f0faf0', border: '0.5px solid #a5d6a7', color: '#2e7d32', fontWeight: '500' },
    notEligibleBadge: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", padding: '4px 10px', borderRadius: '4px', background: '#fff8f0', border: '0.5px solid #f5a19a', color: '#b85c38', fontWeight: '500' },
    backLink: { fontSize: '12px', color: '#b85c38', cursor: 'pointer', marginBottom: '10px', fontFamily: "'JetBrains Mono', monospace", background: 'none', border: 'none', padding: 0 },

    // Ask question form
    askCard: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', padding: '18px 20px', marginBottom: '20px' },
    askLabel: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '500', color: '#7a6a5a', marginBottom: '8px', letterSpacing: '0.03em', textTransform: 'uppercase' },
    askInput: { width: '100%', padding: '10px 14px', border: '0.5px solid #d4c4a8', borderRadius: '5px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
    submitBtn: { padding: '8px 16px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", marginTop: '10px' },
    submitBtnDisabled: { padding: '8px 16px', background: '#d4c4a8', color: '#fdf8f2', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'not-allowed', fontFamily: "'JetBrains Mono', monospace", marginTop: '10px' },
    submitError: { fontSize: '11px', color: '#b71c1c', marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" },

    // Posts area
    postsArea: { marginTop: '10px' },
    postCard: { background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '8px', padding: '14px 18px', marginBottom: '12px' },
    postAuthor: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', marginBottom: '6px' },
    postContent: { fontSize: '13px', color: '#1a2744', marginBottom: '10px', whiteSpace: 'pre-wrap', lineHeight: 1.5 },
    repliesBlock: { marginTop: '10px', paddingLeft: '14px', borderLeft: '2px solid #d4c4a8' },
    replyBlock: { marginBottom: '8px' },
    replyAuthor: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#b85c38', marginBottom: '4px' },
    replyContent: { fontSize: '12px', color: '#1f1a16', whiteSpace: 'pre-wrap', lineHeight: 1.4 },
    replyRow: { marginTop: '10px', display: 'flex', gap: '8px' },
    replyInput: { flex: 1, padding: '6px 10px', border: '0.5px solid #d4c4a8', borderRadius: '4px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' },
    replySubmitBtn: { padding: '5px 12px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" },

    emptyState: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
    loading: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    fetchError: { padding: '20px', background: '#fdecea', border: '0.5px solid #f5a19a', borderRadius: '6px', fontSize: '12px', color: '#b71c1c', marginBottom: '16px' },
}

// PostCard subcomponent — keeps rendering logic separate from data logic.
// Each post owns its own answer input so replies don't get mixed across posts.
function PostCard({ post, canAnswer, onSubmitAnswer }) {
    const [answer, setAnswer] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!answer.trim()) return
        setSubmitting(true)
        try {
            const ok = await onSubmitAnswer(post.id, answer.trim())
            if (ok) setAnswer('')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div style={s.postCard}>
            <div style={s.postAuthor}>{post.author_email}</div>
            <div style={s.postContent}>{post.content}</div>

            {post.replies && post.replies.length > 0 && (
                <div style={s.repliesBlock}>
                    {post.replies.map(reply => (
                        <div key={reply.id} style={s.replyBlock}>
                            <div style={s.replyAuthor}>{reply.author_email}</div>
                            <div style={s.replyContent}>{reply.content}</div>
                        </div>
                    ))}
                </div>
            )}

            {canAnswer && (
                <div style={s.replyRow}>
                    <input
                        placeholder="Reply with an answer..."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        style={s.replyInput}
                        disabled={submitting}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !answer.trim()}
                        style={s.replySubmitBtn}
                    >
                        {submitting ? 'Sending...' : 'Answer'}
                    </button>
                </div>
            )}
        </div>
    )
}

function ModuleQnA() {
    const { moduleCode } = useParams()
    const navigate = useNavigate()
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [posts, setPosts] = useState([])
    const [question, setQuestion] = useState('')
    const [canAnswer, setCanAnswer] = useState(false)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    // Load eligibility and posts on mount — inlined in useEffect to satisfy
    // react-hooks/set-state-in-effect lint rule
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        let cancelled = false
        const load = async () => {
            try {
                // Eligibility check — returns array of module codes the user
                // has taken and can therefore answer questions for
                const eligRes = await fetch(`${BACKEND}/qnahub`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (cancelled) return
                if (eligRes.ok) {
                    const eligData = await eligRes.json()
                    setCanAnswer(Array.isArray(eligData) && eligData.includes(moduleCode))
                }

                // Posts for this module — visible to everyone regardless of eligibility
                const postsRes = await fetch(`${BACKEND}/qnahub/${moduleCode}/posts`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (cancelled) return
                if (postsRes.ok) {
                    setPosts(await postsRes.json())
                }
            } catch (err) {
                if (!cancelled) setFetchError('Could not load Q&A — check your connection and refresh.')
                console.error('Failed to load Q&A:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [moduleCode])

    // Helper — refetch posts after any mutation so UI stays in sync
    const refetchPosts = async () => {
        try {
            const res = await fetch(`${BACKEND}/qnahub/${moduleCode}/posts`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) setPosts(await res.json())
        } catch (err) {
            console.error('Failed to refetch posts:', err)
        }
    }

    const handleSubmitQuestion = async () => {
        if (!question.trim()) return
        setSubmitting(true)
        setSubmitError('')
        try {
            const res = await fetch(`${BACKEND}/qnahub/${moduleCode}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ type: 'question', content: question.trim(), parent_id: null }),
            })
            if (!res.ok) {
                setSubmitError('Could not post your question — please try again.')
                return
            }
            setQuestion('')
            await refetchPosts()
        } catch {
            setSubmitError('Network error — please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // Returns true on success so PostCard knows to clear its input
    const handleSubmitAnswer = async (parentId, content) => {
        try {
            const res = await fetch(`${BACKEND}/qnahub/${moduleCode}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ type: 'answer', content, parent_id: parentId }),
            })
            if (!res.ok) return false
            await refetchPosts()
            return true
        } catch (err) {
            console.error('Failed to submit answer:', err)
            return false
        }
    }

    const hasPosts = posts.length > 0

    return (
        <div style={s.page}>

            <Sidebar active="qna-hub" userEmail={userEmail} />

            <div style={s.main}>
                <button style={s.backLink} onClick={() => navigate('/qna-hub')}>
                    ← Back to Q&amp;A Hub
                </button>

                <div style={s.header}>
                    <div>
                        <div style={s.pageTitle}>{moduleCode}</div>
                        <div style={s.pageSub}>Questions and answers from students who&apos;ve taken this module</div>
                    </div>
                    {!loading && (
                        <div style={canAnswer ? s.eligibleBadge : s.notEligibleBadge}>
                            {canAnswer ? '✓ You can answer' : 'Read-only for you'}
                        </div>
                    )}
                </div>

                {fetchError && <div style={s.fetchError}>{fetchError}</div>}

                {/* Ask question form */}
                <div style={s.askCard}>
                    <div style={s.askLabel}>Ask a question</div>
                    <textarea
                        placeholder={`What would you like to know about ${moduleCode}?`}
                        value={question}
                        onChange={e => { setQuestion(e.target.value); setSubmitError('') }}
                        style={s.askInput}
                        disabled={submitting}
                    />
                    <button
                        onClick={handleSubmitQuestion}
                        disabled={submitting || !question.trim()}
                        style={submitting || !question.trim() ? s.submitBtnDisabled : s.submitBtn}
                    >
                        {submitting ? 'Posting...' : 'Post question'}
                    </button>
                    {submitError && <div style={s.submitError}>{submitError}</div>}
                </div>

                {/* Posts list */}
                <div style={s.postsArea}>
                    {loading ? (
                        <div style={s.loading}>Loading questions...</div>
                    ) : !hasPosts ? (
                        <div style={s.emptyState}>
                            <div>No questions yet for {moduleCode}</div>
                            <div style={s.emptyCode}>be the first to ask something</div>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                canAnswer={canAnswer}
                                onSubmitAnswer={handleSubmitAnswer}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default ModuleQnA