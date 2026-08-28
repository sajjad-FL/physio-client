import { getToken, syncSessionFromProfile } from '../auth/session'

const TTL_MS = 45_000

let entry = { token: null, data: null, fetchedAt: 0 }

export function invalidateProfileCache() {
  entry = { token: null, data: null, fetchedAt: 0 }
}

/** Deduplicates GET /profile across ProfileCompletionGate and ProfilePage within TTL. */
export async function getProfileCached(api, { force = false } = {}) {
  const token = getToken()
  if (!token) {
    invalidateProfileCache()
    return null
  }
  if (entry.token !== token) {
    invalidateProfileCache()
  }
  const fresh =
    !force &&
    entry.token === token &&
    entry.data &&
    Date.now() - entry.fetchedAt < TTL_MS
  if (fresh) {
    return { data: entry.data }
  }
  const res = await api.get('/profile')
  entry = { token, data: res.data, fetchedAt: Date.now() }
  syncSessionFromProfile(res.data)
  return { data: entry.data }
}
