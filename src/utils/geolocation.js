function toMessage(err) {
  if (!err || typeof err !== 'object') return 'Could not read your location. Please try again.'
  if (err.code === 1) {
    return 'Location permission is blocked. Enable location access in browser/app settings and try again.'
  }
  if (err.code === 2) {
    return 'Location signal is unavailable. Move near a window or open area and try again.'
  }
  if (err.code === 3) {
    return 'Location request timed out. Please try again.'
  }
  return 'Could not read your location. Please try again.'
}

function getPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

export function getGeolocationUnavailableReason() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Location is not available in this environment.'
  }
  if (!window.isSecureContext) {
    return 'Location requires a secure connection (HTTPS).'
  }
  if (!navigator.geolocation) {
    return 'Geolocation is not supported on this browser/device.'
  }
  return ''
}

export async function getCurrentCoords() {
  const unavailable = getGeolocationUnavailableReason()
  if (unavailable) {
    const err = new Error(unavailable)
    err.userMessage = unavailable
    throw err
  }

  try {
    const pos = await getPosition({
      enableHighAccuracy: true,
      timeout: 18000,
      maximumAge: 0,
    })
    return { lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude) }
  } catch (firstErr) {
    try {
      // Fallback to coarse/last-known location: more reliable on some mobile browsers.
      const pos = await getPosition({
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 120000,
      })
      return { lat: Number(pos.coords.latitude), lng: Number(pos.coords.longitude) }
    } catch (secondErr) {
      const err = secondErr || firstErr
      err.userMessage = toMessage(err)
      throw err
    }
  }
}

