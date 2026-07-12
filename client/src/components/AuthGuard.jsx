import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Wraps any protected page. If the user has no auth token in localStorage,
// they get redirected to /login. Otherwise the children render normally.

// This replaces the copy-pasted `useEffect` auth guard that was at the top
// of every protected page — a maintenance risk 

// Centralising it here means the guard is enforced by the route wrapper,
// not by page authors remembering to add it.

function AuthGuard({ children }) {
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) navigate('/login')
    }, [navigate])

    return children
}

export default AuthGuard