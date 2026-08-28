import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken, getRoles } from '../auth/session'
import AuthSpinner from './AuthSpinner'

/**
 * @param {{ children: React.ReactNode, allowedRoles: string[] }} props
 * Users with role `admin` may access any route.
 */
export default function RoleProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const [authEpoch, setAuthEpoch] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    function onSessionChange() {
      setAuthEpoch((n) => n + 1)
    }
    window.addEventListener('auth-session-changed', onSessionChange)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('auth-session-changed', onSessionChange)
    }
  }, [])

  if (!ready) {
    return <AuthSpinner />
  }

  // authEpoch forces re-read of localStorage after logout / 401 clear
  void authEpoch

  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const roles = getRoles()
  if (roles.includes('admin')) {
    return children
  }

  const allowed = allowedRoles || []
  const ok = allowed.some((r) => roles.includes(r))
  if (!ok) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
