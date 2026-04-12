import { PHYSIO_DASHBOARD_ENTRY } from '../constants/authPaths'

const TOKEN_KEY = 'token'
/** Canonical: user | physio | admin */
const ROLE_KEY = 'role'
/** @deprecated Legacy JSON array — read once for migration, then ignored */
const ROLES_KEY = 'roles'
const PROFILE_COMPLETE_KEY = 'profileComplete'

function emitSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-session-changed'))
  }
}

function normalizeRoleInput(input) {
  if (input == null || input === '') return 'user'
  if (typeof input === 'string') {
    if (input === 'patient') return 'user'
    if (input === 'user' || input === 'physio' || input === 'admin') return input
    return 'user'
  }
  if (Array.isArray(input)) {
    if (input.includes('admin')) return 'admin'
    if (input.includes('physio')) return 'physio'
    return 'user'
  }
  return 'user'
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** @returns {'user' | 'physio' | 'admin'} */
export function getRole() {
  try {
    const single = localStorage.getItem(ROLE_KEY)
    if (single === 'user' || single === 'physio' || single === 'admin') return single
    if (single === 'patient') return 'user'
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    if (raw != null) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return normalizeRoleInput(parsed)
    }
  } catch {
    /* ignore */
  }
  return 'user'
}

/** @returns {string[]} — single-element array for backward compatibility */
export function getRoles() {
  return [getRole()]
}

/**
 * @param {string} token
 * @param {string | string[]} roleOrLegacyRoles
 * @param {boolean} [isProfileComplete]
 */
export function setSession(token, roleOrLegacyRoles, isProfileComplete) {
  const role = normalizeRoleInput(roleOrLegacyRoles)
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
  localStorage.removeItem(ROLES_KEY)
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

/**
 * @param {string} token
 * @param {string | string[]} roleOrRoles — 'physio' / 'patient' or roles array (legacy)
 */
export function setToken(token, roleOrRoles = 'user') {
  setSession(token, roleOrRoles)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(ROLES_KEY)
  localStorage.removeItem(PROFILE_COMPLETE_KEY)
  emitSessionChanged()
}

export function isPhysioSession() {
  return getRole() === 'physio'
}

export function hasAnyRole(...allowed) {
  const mine = getRole()
  if (mine === 'admin') return true
  return allowed.some((r) => mine === r)
}

export function getDefaultDashboardPath() {
  const role = getRole()
  if (role === 'admin') return '/admin'
  if (role === 'physio') return PHYSIO_DASHBOARD_ENTRY
  return '/dashboard'
}

/** Pass React Router’s `navigate` so the app leaves protected routes cleanly. */
export function logout(navigate) {
  clearToken()
  navigate('/login', { replace: true })
}

export { PHYSIO_DASHBOARD_ENTRY }
