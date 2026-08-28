import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../config/api'
import { getToken, redirectPathForRoleMismatch } from '../auth/session'
import { getProfileCached } from '../utils/profileCache'

/**
 * After login or role changes on the server, localStorage role can be stale.
 * Sync from GET /profile and redirect away from the wrong dashboard.
 */
export default function SessionRoleSync() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = getToken()
    if (!token) return undefined

    let cancelled = false

    async function syncAndRedirect() {
      try {
        await getProfileCached(api)
      } catch {
        /* profile may fail for edge cases; still attempt redirect from stored role */
      }
      if (cancelled) return
      const target = redirectPathForRoleMismatch(location.pathname)
      if (target && target !== location.pathname) {
        navigate(target, { replace: true })
      }
    }

    syncAndRedirect()

    function onSessionChange() {
      syncAndRedirect()
    }
    window.addEventListener('auth-session-changed', onSessionChange)
    return () => {
      cancelled = true
      window.removeEventListener('auth-session-changed', onSessionChange)
    }
  }, [location.pathname, navigate])

  return null
}
