import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const s = {
    page: { minHeight: '100vh', background: '#fdf8f2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' },
    card: { width: '100%', maxWidth: '420px' },
    logoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
    logoIcon: { width: '36px', height: '36px', background: '#b85c38', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '7px' },
    sq1: { borderRadius: '2px', background: 'rgba(255,255,255,0.95)' },
    sq2: { borderRadius: '2px', background: 'rgba(255,255,255,0.72)' },
    sq3: { borderRadius: '2px', background: 'rgba(255,255,255,0.55)' },
    sq4: { borderRadius: '2px', background: 'rgba(255,255,255,0.38)' },
    wordmark: { fontSize: '18px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.04em' },
    title: { fontSize: '26px', fontWeight: '600', color: '#1a2744', letterSpacing: '-0.03em', marginBottom: '6px' },
    sub: { fontSize: '14px', color: '#7a6a5a', marginBottom: '28px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#1a2744', marginBottom: '6px', letterSpacing: '0.01em' },
    input: { width: '100%', padding: '11px 14px', background: '#fff', border: '1px solid #d4c4a8', borderRadius: '4px', fontSize: '14px', color: '#1f1a16', fontFamily: 'inherit', outline: 'none', marginBottom: '14px' },
    btn: { width: '100%', padding: '12px', background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em' },
    message: { fontSize: '13px', color: '#b85c38', marginTop: '12px', textAlign: 'center' },
    footer: { textAlign: 'center', fontSize: '13px', color: '#7a6a5a', marginTop: '20px' },
    footerLink: { color: '#b85c38', fontWeight: '500', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px' }
}

function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMessage('Passwords do not match')
            return
        }
        const response = await fetch('https://modmapper-orbital2026.onrender.com/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const data = await response.json()
        if (response.ok) {
            setMessage('Registered successfully! Redirecting to login...')
            setTimeout(() => navigate('/login'), 2000)
        } else if (data.error && data.error.toLowerCase().includes('already registered')) {
            navigate('/login')
        } else {
            setMessage(data.error)
        }
    }

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.logoRow}>
                    <div style={s.logoIcon}>
                        <div style={s.sq1}></div><div style={s.sq2}></div>
                        <div style={s.sq3}></div><div style={s.sq4}></div>
                    </div>
                    <span style={s.wordmark}>ModMapper</span>
                </div>
                <div style={s.title}>Create your account</div>
                <div style={s.sub}>Start planning your NUS degree today</div>
                <form onSubmit={handleSubmit}>
                    <label style={s.label}>NUS Email</label>
                    <input style={s.input} type="email" placeholder="e0123456@u.nus.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <label style={s.label}>Password</label>
                    <input style={s.input} type="password" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <label style={s.label}>Confirm Password</label>
                    <input style={s.input} type="password" placeholder="••••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button style={s.btn} type="submit">Create Account</button>
                </form>
                <p style={s.message}>{message}</p>
                <div style={s.footer}>
                    Already have an account?{' '}
                    <button style={s.footerLink} onClick={() => navigate('/login')}>Sign in</button>
                </div>
            </div>
        </div>
    )
}

export default Register