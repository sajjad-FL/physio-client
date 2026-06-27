/** API base is typically `http://host:5000/api`; static uploads are served from the same origin without `/api`. */
export function serverOrigin() {
  const base = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '') || 'http://localhost:5001/api'
  const trimmed = base.replace(/\/api\/?$/, '')
  return trimmed || 'http://localhost:5001'
}

export function resolveFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return serverOrigin() + url
  return url
}
