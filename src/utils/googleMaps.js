function readLatLng(coordinates) {
  const lat = Number(coordinates?.lat)
  const lng = Number(coordinates?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function buildGoogleMapsDestinationUrl({ coordinates, address }) {
  const point = readLatLng(coordinates)
  if (point) {
    return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`
  }
  const label = String(address || '').trim()
  if (!label) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(label)}`
}

export function openGoogleMapsDestination(payload) {
  const url = buildGoogleMapsDestinationUrl(payload)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
