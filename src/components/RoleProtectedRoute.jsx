import { useLayoutEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken, getRoles } from '../auth/session'
import AuthSpinner from './AuthSpinner'

/**
 * @param {{ children: React.ReactNode, allowedRoles: string[] }} props
 * Users with role `admin` may access any route.
 */
export default function RoleProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!ready) {
    return <AuthSpinner />
  }

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
