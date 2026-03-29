/**
 * Turn a stored `/uploads/...` path into a full URL for <img src>.
 * @param {string | null | undefined} storedPath
 */
export function assetUrl(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return null
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) return storedPath
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  const path = storedPath.startsWith('/') ? storedPath : `/${storedPath}`
  return `${origin}${path}`
}
