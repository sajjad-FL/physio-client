import axios from 'axios'

const token = () => import.meta.env.VITE_MAPBOX_TOKEN || ''

/**
 * @param {string} query
 * @returns {Promise<Array<{ id: string, placeName: string, lat: number, lng: number }>>}
 */
export async function mapboxForwardGeocode(query) {
  const t = token()
  const q = String(query || '').trim()
  if (!t || q.length < 2) return []
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  const { data } = await axios.get(url, {
    params: {
      access_token: t,
      limit: 6,
      types: 'place,locality,neighborhood,address,poi,region',
    },
  })
  const features = data.features || []
  return features
    .map((f) => {
      const [lng, lat] = f.center || []
      if (lat == null || lng == null) return null
      return {
        id: f.id,
        placeName: f.place_name || f.text || '',
        lat,
        lng,
      }
    })
    .filter(Boolean)
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string | null>}
 */
export async function mapboxReverseGeocode(lat, lng) {
  const t = token()
  if (!t) return null
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  const { data } = await axios.get(url, {
    params: { access_token: t, limit: 1 },
  })
  return data.features?.[0]?.place_name || null
}

export function hasMapboxGeocode() {
  return Boolean(token())
}
