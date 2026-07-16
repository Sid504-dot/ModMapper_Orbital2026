import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BACKEND } from '../constants'
import { parseApi } from '../utils/api'

const s = {
    page: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' },
    left: { background: '#1a2744', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' },
    logoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { width: '40px', height: '40px', background: '#b85c38', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '8px', flexShrink: 0 },
    sq1: { borderRadius: '2px', background: 'rgba(255,255,255,0.95)' },
    sq2: { borderRadius: '2px', background: 'rgba(255,255,255,0.72)' },
    sq3: { borderRadius: '2px', background: 'rgba(255,255,255,0.55)' },
    sq4: { borderRadius: '2px', background: 'rgba(255,255,255,0.38)' },
    wordmark: { fontSize: '20px', fontWeight: '600', color: '#fdf8f2', letterSpacing: '-0.04em' },
    leftBody: { paddingBottom: '48px' },
    headline: { fontSize: '52px', fontWeight: '600', color: '#fdf8f2', letterSpacing: '-0.045em', lineHeight: '1.0', marginBottom: '16px' },
    headlineAccent: { color: '#b85c38' },
    subtext: { fontSize: '14px', color: 'rgba(253,248,242,0.55)', lineHeight: '1.6', maxWidth: '340px' },
    statsRow: { display: 'flex', gap: '32px' },
    statNum: { fontSize: '26px', fontWeight: '600', color: '#fdf8f2', letterSpacing: '-0.03em' },
    statLabel: { fontSize: '11px', color: 'rgba(253,248,242,0.45)', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase' },
    right: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#fdf8f2' },
    formCard: { width: '100%', maxWidth: '380px' },
    formTitle: { fontSize: '26px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.03em', marginBottom: '6px' },
    formSub: { fontSize: '14px', color: '#7a6a5a', marginBottom: '28px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#1a2744', marginBottom: '6px', letterSpacing: '0.01em' },
    input: { width: '100%', padding: '11px 14px', background: '#fff', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '14px', color: '#1f1a16', fontFamily: 'inherit', outline: 'none', marginBottom: '14px' },
    forgot: { display: 'block', textAlign: 'right', fontSize: '12px', color: '#3d5a73', marginBottom: '16px', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' },
    btnSubmit: { width: '100%', padding: '12px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em' },
    dividerWrap: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' },
    dividerLine: { flex: 1, height: '1px', background: '#d4c4a8' },
    dividerText: { fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#7a6a5a', letterSpacing: '0.04em' },
    footer: { textAlign: 'center', fontSize: '13px', color: '#7a6a5a' },
    footerLink: { color: '#b85c38', fontWeight: '500', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px' },
    message: { fontSize: '13px', color: '#b85c38', marginTop: '8px', textAlign: 'center' },
    resetTitle: { fontSize: '22px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.025em', marginBottom: '6px' },
    backBtn: { background: 'none', border: 'none', color: '#3d5a73', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '14px', display: 'block' }
}

const LeftPanel = () => (
    <div style={s.left}>
        <div style={s.logoRow}>
            <div style={s.logoIcon}>
                <div style={s.sq1}></div><div style={s.sq2}></div>
                <div style={s.sq3}></div><div style={s.sq4}></div>
            </div>
            <span style={s.wordmark}>ModMapper</span>
        </div>
        <div style={s.leftBody}>
            <div style={s.headline}>
                Plan your degree.<br />
                <span style={s.headlineAccent}>Map your future.</span>
            </div>
            <div style={s.subtext}>
                The intelligent NUS academic co-pilot that turns semester planning from a four-hour headache into a two-minute conversation.
            </div>
        </div>
        <div style={s.statsRow}>
            <div><div style={s.statNum}>4 yrs</div><div style={s.statLabel}>Full roadmap</div></div>
            <div><div style={s.statNum}>&lt;2 min</div><div style={s.statLabel}>To your timetable</div></div>
            <div><div style={s.statNum}>NUS</div><div style={s.statLabel}>Built for you</div></div>
        </div>
    </div>
)

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const res = await fetch(`${BACKEND}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const result = await parseApi(res)
        if (!result.ok) {
            setMessage(result.error)
            return
        }
        localStorage.setItem('token', result.data)
        localStorage.setItem('userEmail', email)
        navigate('/dashboard')
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        const response = await fetch(`${BACKEND}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        const data = await response.json()
        if (response.ok) {
            setMessage(data.message)
        } else {
            setMessage(data.error)
        }
    }

    if (showForgotPassword) {
        return (
            <div style={s.page}>
                <LeftPanel />
                <div style={s.right}>
                    <div style={s.formCard}>
                        <div style={s.resetTitle}>Reset your password</div>
                        <div style={s.formSub}>Enter your email and we'll send a reset link</div>
                        <form onSubmit={handleForgotPassword}>
                            <label style={s.label}>Email</label>
                            <input style={s.input} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <button style={s.btnSubmit} type="submit">Send Reset Link</button>
                        </form>
                        <p style={s.message}>{message}</p>
                        <button style={s.backBtn} onClick={() => setShowForgotPassword(false)}>← Back to login</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={s.page}>
            <LeftPanel />
            <div style={s.right}>
                <div style={s.formCard}>
                    <div style={s.formTitle}>Welcome back</div>
                    <div style={s.formSub}>Sign in to continue planning your degree</div>
                    <form onSubmit={handleSubmit}>
                        <label style={s.label}>NUS Email</label>
                        <input style={s.input} type="email" placeholder="e0123456@u.nus.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <label style={s.label}>Password</label>
                        <input style={s.input} type="password" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button style={s.forgot} type="button" onClick={() => setShowForgotPassword(true)}>Forgot password?</button>
                        <button style={s.btnSubmit} type="submit">Sign in to ModMapper</button>
                    </form>
                    <p style={s.message}>{message}</p>
                    <div style={s.dividerWrap}>
                        <div style={s.dividerLine}></div>
                        <span style={s.dividerText}>OR</span>
                        <div style={s.dividerLine}></div>
                    </div>
                    <div style={s.footer}>
                        Don't have an account?{' '}
                        <button style={s.footerLink} onClick={() => navigate('/register')}>Create one free</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login