import { useEffect, useState } from 'react'
import { api } from '../config/api'
import { clearToken, getToken, setProfileCompleteStored } from '../auth/session'
import AuthSpinner from './AuthSpinner'
import ProfileCompletionModal from './ProfileCompletionModal'

/**
 * When a JWT exists, loads profile and blocks the app until `isProfileComplete` is true.
 */
export default function ProfileCompletionGate({ children }) {
  const [state, setState] = useState(() => (getToken() ? 'loading' : 'complete'))
  const [profileSnapshot, setProfileSnapshot] = useState(null)

  useEffect(() => {
    let cancelled = false
    let reqId = 0

    function load() {
      const token = getToken()
      if (!token) {
        if (!cancelled) {
          setState('complete')
          setProfileSnapshot(null)
        }
        return
      }

      const id = ++reqId
      setState('loading')
      api
        .get('/profile')
        .then((res) => {
          if (cancelled || id !== reqId) return
          const ok = res.data?.isProfileComplete === true
          setProfileCompleteStored(ok)
          if (ok) {
            setState('complete')
            setProfileSnapshot(null)
          } else {
            setProfileSnapshot(res.data)
            setState('incomplete')
          }
        })
        .catch((e) => {
          if (cancelled || id !== reqId) return
          if (e.response?.status === 401) {
            clearToken()
            setState('complete')
            setProfileSnapshot(null)
            return
          }
          setState('incomplete')
        })
    }

    load()
    window.addEventListener('auth-session-changed', load)
    return () => {
      cancelled = true
      window.removeEventListener('auth-session-changed', load)
    }
  }, [])

  if (state === 'loading') {
    return <AuthSpinner />
  }

  if (state === 'incomplete') {
    return (
      <ProfileCompletionModal
        initial={profileSnapshot}
        onComplete={() => {
          setProfileCompleteStored(true)
          setState('complete')
        }}
      />
    )
  }

  return <>{children}</>
}
