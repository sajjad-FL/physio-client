/**
 * Canonical site origin for meta tags, OG URLs, and JSON-LD.
 * Set VITE_PUBLIC_SITE_URL in production (e.g. https://www.example.com).
 */
export function normalizeSiteOrigin(raw) {
  const s = String(raw || '').trim().replace(/\/$/, '')
  if (!s) return ''
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`)
    return `${u.protocol}//${u.host}`
  } catch {
    return ''
  }
}

export function siteOrigin() {
  const fromEnv = normalizeSiteOrigin(import.meta.env.VITE_PUBLIC_SITE_URL)
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeSiteOrigin(window.location.origin)
  }
  return ''
}

/** Absolute URL for a path starting with `/`. */
export function absoluteUrl(pathname = '/') {
  const base = siteOrigin() || 'http://localhost:5173'
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (path === '/') return `${base}/`
  return `${base}${path}`
}

/** Comma-separated cities/regions from VITE_PRIMARY_SERVICE_AREAS */
export function primaryServiceAreas() {
  const raw = import.meta.env.VITE_PRIMARY_SERVICE_AREAS
  if (!raw || typeof raw !== 'string') return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function primaryServiceAreasSentence() {
  const areas = primaryServiceAreas()
  if (!areas.length) return ''
  if (areas.length === 1) return areas[0]
  if (areas.length === 2) return `${areas[0]} and ${areas[1]}`
  return `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`
}
