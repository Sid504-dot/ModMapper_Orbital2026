import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { BACKEND } from '../constants'

const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#fdf8f2' },
    main: { marginLeft: '220px', flex: 1, padding: '36px 40px' },
    pageTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em' },
    pageSub: { fontSize: '13px', color: '#7a6a5a', marginTop: '2px', marginBottom: '28px' },

    // Prompt input card
    promptCard: { background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '10px', padding: '20px 24px', marginBottom: '28px' },
    promptLabel: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7a6a5a', marginBottom: '10px' },
    promptTextarea: { width: '100%', minHeight: '80px', padding: '10px 14px', border: '0.5px solid #d4c4a8', borderRadius: '6px', fontSize: '13px', background: '#fff', color: '#1a2744', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 },
    promptActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' },
    promptHint: { fontSize: '11px', color: '#d4c4a8', fontFamily: "'JetBrains Mono', monospace" },
    submitBtn: { padding: '9px 20px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' },
    submitBtnDisabled: { padding: '9px 20px', background: '#d4c4a8', color: '#fdf8f2', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em' },

    // Results header
    resultsBar: { display: 'flex', alignItems: 'center', marginBottom: '16px' },
    resultsCount: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a' },

    // Module cards grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' },
    card: { background: '#fff', border: '0.5px solid #d4c4a8', borderRadius: '10px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' },
    cardCode: { fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', color: '#3d5a73', letterSpacing: '0.02em' },
    cardTitle: { fontSize: '14px', fontWeight: '500', color: '#1f1a16', lineHeight: 1.4 },
    cardDesc: {
        fontSize: '12px', color: '#7a6a5a', lineHeight: 1.6,
        overflow: 'hidden', display: '-webkit-box',
        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
    },
    cardFooter: { display: 'flex', alignItems: 'center', marginTop: '2px' },

    // Eligibility badges
    eligibleBadge: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', padding: '3px 8px', borderRadius: '3px', background: '#f0faf0', border: '0.5px solid #a5d6a7', color: '#2e7d32' },
    prereqBadge: { fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600', padding: '3px 8px', borderRadius: '3px', background: '#fff8f0', border: '0.5px solid #f5a19a', color: '#b85c38' },

    // Rationale — italic, below description
    rationale: { fontSize: '11px', color: '#7a6a5a', fontStyle: 'italic', lineHeight: 1.5, borderTop: '0.5px solid #f0e8d8', paddingTop: '8px', marginTop: '2px' },

    // States
    emptyState: { padding: '60px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },
    emptyCode: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#d4c4a8', marginTop: '6px' },
    loadingState: { padding: '48px 0', textAlign: 'center', color: '#7a6a5a', fontSize: '13px' },

    // Error card
    errorCard: { background: '#fdecea', border: '0.5px solid #f5a19a', borderRadius: '8px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' },
    errorText: { fontSize: '13px', color: '#b71c1c' },
    retryBtn: { padding: '7px 14px', background: 'none', border: '0.5px solid #f5a19a', borderRadius: '5px', fontSize: '12px', color: '#b71c1c', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
}

function UERecommender() {
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || '')
    const [prompt, setPrompt] = useState('')
    const [results, setResults] = useState(null)  // null = not yet searched
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        const input = prompt.trim()
        if (!input || loading) return
        setLoading(true)
        setError('')
        setResults(null)
        try {
            const res = await fetch(`${BACKEND}/ueReccomender/user-ue-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ user_input: input }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.message || json.error || 'Failed to fetch recommendations')
                return
            }
            setResults(json.data ?? [])
        } catch {
            setError('Network error — please try again')
        } finally {
            setLoading(false)
        }
    }

    const canSubmit = prompt.trim().length > 0 && !loading

    return (
        <div style={s.page}>

            <Sidebar active="ue" userEmail={userEmail} />

            <div style={s.main}>
                <div style={s.pageTitle}>UE Recommender</div>
                <div style={s.pageSub}>Describe your interests and we'll find Unrestricted Electives that fit</div>

                {/* Prompt input */}
                <div style={s.promptCard}>
                    <div style={s.promptLabel}>Your interests</div>
                    <textarea
                        placeholder="e.g. artificial intelligence, product design, behavioural economics, sustainability..."
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
                        }}
                        style={s.promptTextarea}
                        disabled={loading}
                    />
                    <div style={s.promptActions}>
                        <span style={s.promptHint}>Ctrl ⌘ + Enter to submit</span>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            style={canSubmit ? s.submitBtn : s.submitBtnDisabled}
                        >
                            {loading ? 'FINDING...' : 'FIND MODULES'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={s.errorCard}>
                        <div style={s.errorText}>{error}</div>
                        <button style={s.retryBtn} onClick={handleSubmit}>Retry</button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={s.loadingState}>
                        Finding recommendations...
                    </div>
                )}

                {/* Results */}
                {!loading && results !== null && (
                    <>
                        <div style={s.resultsBar}>
                            <div style={s.resultsCount}>
                                {results.length === 0
                                    ? 'No modules found'
                                    : `${results.length} module${results.length !== 1 ? 's' : ''} found`
                                }
                            </div>
                        </div>

                        {results.length === 0 ? (
                            <div style={s.emptyState}>
                                <div>No matching modules found</div>
                                <div style={s.emptyCode}>try different keywords or broaden your interests</div>
                            </div>
                        ) : (
                            <div style={s.grid}>
                                {results.map(mod => (
                                    <div key={mod.module_code} style={s.card}>
                                        <div style={s.cardCode}>{mod.module_code}</div>
                                        <div style={s.cardTitle}>{mod.title}</div>
                                        {mod.description && (
                                            <div style={s.cardDesc}>{mod.description}</div>
                                        )}
                                        <div style={s.cardFooter}>
                                            <span style={mod.eligibility_status === 'eligible' ? s.eligibleBadge : s.prereqBadge}>
                                                {mod.eligibility_status === 'eligible' ? 'Eligible' : 'Needs prereq'}
                                            </span>
                                        </div>
                                        {mod.rationale && (
                                            <div style={s.rationale}>{mod.rationale}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Initial empty state — before any search */}
                {!loading && results === null && !error && (
                    <div style={s.emptyState}>
                        <div>Describe your interests above to get started</div>
                        <div style={s.emptyCode}>e.g. "machine learning, UX design, entrepreneurship"</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UERecommender
