import { useEffect, useState } from 'react'
import { api } from '../config/api'
import { clearToken, getToken, setProfileCompleteStored } from '../auth/session'
import { getProfileCached } from '../utils/profileCache'
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

    function load(forceProfile = false) {
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
      getProfileCached(api, { force: forceProfile })
        .then((wrapped) => {
          if (cancelled || id !== reqId) return
          if (!wrapped?.data) {
            setState('complete')
            setProfileSnapshot(null)
            return
          }
          const res = { data: wrapped.data }
          const ok = res.data?.isProfileComplete === true
          const r = res.data?.role
          const legacy = Array.isArray(res.data?.roles) ? res.data.roles : []
          const isPhysio =
            r === 'physio' || (!r && legacy.includes('physio'))
          const isCareManager =
            r === 'care_manager' || (!r && legacy.includes('care_manager'))
          setProfileCompleteStored(ok)
          if (ok) {
            setState('complete')
            setProfileSnapshot(null)
          } else if (isPhysio || isCareManager) {
            // Physios and care managers complete account via their own flows; server guards their APIs.
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

    load(false)
    window.addEventListener('auth-session-changed', () => load(true))
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
