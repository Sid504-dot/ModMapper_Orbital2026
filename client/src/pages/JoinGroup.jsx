import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const BACKEND = 'https://modmapper-orbital2026.onrender.com'

function JoinGroup() {
    const { inviteToken } = useParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState('joining') // 'joining', 'success', 'already', 'error'



    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            localStorage.setItem('pendingJoin', inviteToken)
            navigate('/login')
            return
        }
        const join = async () => {
            try {
                const res = await fetch(`${BACKEND}/api/join-group`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ inviteToken }),
                })
                if (res.status === 400) { setStatus('already'); return }
                if (!res.ok) { setStatus('error'); return }
                setStatus('success')
            } catch {
                setStatus('error')
            }
        }
        join()
    }, [inviteToken, navigate])

    const page = {
        display: 'flex', minHeight: '100vh', background: '#fdf8f2',
        alignItems: 'center', justifyContent: 'center',
    }
    const card = {
        background: '#f5edd8', border: '0.5px solid #d4c4a8', borderRadius: '12px',
        padding: '40px 48px', textAlign: 'center', maxWidth: '400px', width: '100%',
    }
    const title = { fontSize: '18px', fontWeight: '600', color: '#1a2744', marginBottom: '8px' }
    const sub = { fontSize: '13px', color: '#7a6a5a', marginBottom: '24px', lineHeight: 1.5 }
    const btn = {
        background: '#b85c38', color: '#fdf8f2', border: 'none', borderRadius: '6px',
        padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
    }

    return (
        <div style={page}>
            <div style={card}>
                {status === 'joining' && (
                    <>
                        <div style={title}>Joining group...</div>
                        <div style={sub}>Just a moment</div>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div style={title}>Request sent!</div>
                        <div style={sub}>
                            You're now pending approval from the group owner.
                            You'll be added once they approve your request.
                        </div>
                        <button style={btn} onClick={() => navigate('/group-finder')}>
                            Go to Group Finder
                        </button>
                    </>
                )}
                {status === 'already' && (
                    <>
                        <div style={title}>Already a member</div>
                        <div style={sub}>You're already in this group.</div>
                        <button style={btn} onClick={() => navigate('/group-finder')}>
                            Go to Group Finder
                        </button>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div style={title}>Something went wrong</div>
                        <div style={sub}>
                            The invite link may be invalid or expired.
                            Ask the group owner to send a new one.
                        </div>
                        <button style={btn} onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default JoinGroup