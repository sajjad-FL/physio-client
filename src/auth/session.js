import { PHYSIO_DASHBOARD_ENTRY } from '../constants/authPaths'

const TOKEN_KEY = 'token'
/** Legacy single role hint: patient | physio | admin (derived from roles array). */
const ROLE_KEY = 'role'
const ROLES_KEY = 'roles'
const PROFILE_COMPLETE_KEY = 'profileComplete'

function emitSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-session-changed'))
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** @returns {string[]} */
export function getRoles() {
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    if (raw != null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(ROLE_KEY)
  if (legacy === 'physio') return ['user', 'physio']
  if (legacy === 'admin') return ['admin']
  return ['user']
}

/** @param {boolean} [isProfileComplete] — when set, persists profile gate hint from login */
export function setSession(token, roles, isProfileComplete) {
  const list = Array.isArray(roles) && roles.length ? roles : ['user']
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLES_KEY, JSON.stringify(list))
  const legacy =
    list.includes('admin') ? 'admin' : list.includes('physio') ? 'physio' : 'patient'
  localStorage.setItem(ROLE_KEY, legacy)
  if (typeof isProfileComplete === 'boolean') {
    setProfileCompleteStored(isProfileComplete)
  }
  emitSessionChanged()
}

export function setProfileCompleteStored(value) {
  localStorage.setItem(PROFILE_COMPLETE_KEY, value ? '1' : '0')
}

/** @returns {boolean | null} null if never set this session */
export function getProfileCompleteStored() {
  const v = localStorage.getItem(PROFILE_COMPLETE_KEY)
  if (v === '1') return true
  if (v === '0') return false
  return null
}

/** @param {string} token
 * @param {string | string[]} roleOrRoles — backward compatible: 'physio' / 'patient' or roles array */
export function setToken(token, roleOrRoles = ['user']) {
  if (Array.isArray(roleOrRoles)) {
    setSession(token, roleOrRoles)
    return
  }
  if (roleOrRoles === 'physio') {
    setSession(token, ['user', 'physio'])
    return
  }
  setSession(token, ['user'])
}

/** @deprecated Use getRoles — kept for narrow checks */
export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(ROLES_KEY)
  localStorage.removeItem(PROFILE_COMPLETE_KEY)
  emitSessionChanged()
}

export function isPhysioSession() {
  return getRoles().includes('physio')
}

export function hasAnyRole(...roles) {
  const mine = getRoles()
  if (mine.includes('admin')) return true
  return roles.some((r) => mine.includes(r))
}

export function getDefaultDashboardPath() {
  const roles = getRoles()
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('physio')) return PHYSIO_DASHBOARD_ENTRY
  return '/dashboard'
}

/** Pass React Router’s `navigate` so the app leaves protected routes cleanly. */
export function logout(navigate) {
  clearToken()
  navigate('/login', { replace: true })
}

export { PHYSIO_DASHBOARD_ENTRY }
