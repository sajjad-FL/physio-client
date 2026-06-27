/**
 * Turn a stored `/uploads/...` path into a full URL for <img src>.
 * @param {string | null | undefined} storedPath
 */
export function assetUrl(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return null
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) return storedPath
  const apiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '') || 'http://localhost:5001/api'
  const origin = apiBase.replace(/\/api\/?$/, '') || 'http://localhost:5001'
  const path = storedPath.startsWith('/') ? storedPath : `/${storedPath}`
  return `${origin}${path}`
}
