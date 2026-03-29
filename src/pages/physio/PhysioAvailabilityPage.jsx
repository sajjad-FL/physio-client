import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'

export default function PhysioAvailabilityPage() {
  const [availability, setAvailability] = useState(true)
  const [coords, setCoords] = useState(null)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/physio/me')
      if (typeof res.data?.availability === 'boolean') setAvailability(res.data.availability)
      if (res.data?.coordinates?.lat != null && res.data?.coordinates?.lng != null) {
        setCoords({ lat: res.data.coordinates.lat, lng: res.data.coordinates.lng })
      }
    } catch {
      toast.error('Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleAvailability() {
    try {
      const res = await api.patch('/physio/availability', { availability: !availability })
      setAvailability(res.data.availability)
      toast.success('Availability updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    }
  }

  function updateMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available on this device')
      return
    }
    setUpdatingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude)
          const lng = Number(pos.coords.longitude)
          const res = await api.patch('/physio/location', { lat, lng })
          setCoords(res.data?.coordinates || { lat, lng })
          toast.success('Location updated')
        } catch (e) {
          toast.error(e.response?.data?.message || 'Could not update location')
        } finally {
          setUpdatingLocation(false)
        }
      },
      () => {
        toast.error('Could not access location')
        setUpdatingLocation(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Availability</h1>
        <p className="mt-1 text-sm text-ink-muted">Turn off when you are not accepting new assignments.</p>
      </div>

      <div className="surface-card max-w-md rounded-2xl p-8 shadow-sm ring-1 ring-border-subtle/80">
        {loading ? (
          <div className="h-12 animate-pulse rounded-xl bg-canvas" />
        ) : (
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{availability ? 'You are online' : 'You are offline'}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {availability ? 'Patients can be matched to you.' : 'You will not receive new matches.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={availability}
              onClick={toggleAvailability}
              className={`relative h-9 w-14 shrink-0 rounded-full transition-colors ${
                availability ? 'bg-brand' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                  availability ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </label>
        )}
        {!loading && (
          <div className="mt-5 border-t border-border-subtle pt-4">
            <p className="text-xs text-ink-muted">
              Current coordinates:{' '}
              {coords ? `${Number(coords.lat).toFixed(5)}, ${Number(coords.lng).toFixed(5)}` : 'not set'}
            </p>
            <button
              type="button"
              onClick={updateMyLocation}
              disabled={updatingLocation}
              className="mt-3 cursor-pointer rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition duration-200 ease-in-out hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingLocation ? 'Updating location…' : 'Update My Location'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
