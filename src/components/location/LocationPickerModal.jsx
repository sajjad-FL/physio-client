import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { mapboxReverseGeocode } from '../../utils/mapboxGeocode'
import { patchProfileAddress } from '../../utils/patchProfileAddress'
import { getCurrentCoords } from '../../utils/geolocation'
import Button from '../ui/Button'
import LocationSelectorRow from './LocationSelectorRow'
import MapPickerModal from './MapPickerModal'

/**
 * Full location picker: search, GPS, map — optional “save as default” (updates profile).
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   initial: { text: string, lat: number|null, lng: number|null },
 *   onConfirm: (payload: { text: string, lat: number, lng: number, saveAsDefault: boolean }) => void | Promise<void>,
 *   showSaveDefault?: boolean,
 * }} props
 */
export default function LocationPickerModal({
  open,
  onClose,
  initial,
  onConfirm,
  showSaveDefault = true,
}) {
  const [text, setText] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [saveDefault, setSaveDefault] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setText(initial?.text ?? '')
    setLat(Number.isFinite(initial?.lat) ? initial.lat : null)
    setLng(Number.isFinite(initial?.lng) ? initial.lng : null)
    setSaveDefault(false)
    setMapOpen(false)
  }, [open, initial])

  function handlePlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setLat(place.lat)
      setLng(place.lng)
      setText(place.label || '')
      return
    }
    setLat(null)
    setLng(null)
  }

  async function useDeviceLocation() {
    setGeoBusy(true)
    try {
      const { lat: la, lng: ln } = await getCurrentCoords()
      setLat(la)
      setLng(ln)
      const rev = await mapboxReverseGeocode(la, ln)
      if (rev) setText(rev)
      toast.success('Location captured')
    } catch (err) {
      toast.error(err?.userMessage || 'Could not read your location.')
    } finally {
      setGeoBusy(false)
    }
  }

  async function applyMapCoords(coords) {
    setLat(coords.lat)
    setLng(coords.lng)
    const label = await mapboxReverseGeocode(coords.lat, coords.lng)
    if (label) setText(label)
    setMapOpen(false)
    toast.success('Pin applied')
  }

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Enter or select an address')
      return
    }
    if (lat == null || lng == null) {
      toast.error('Choose a place from search, GPS, or the map so we have coordinates.')
      return
    }
    setSubmitting(true)
    try {
      const didSaveProfile = Boolean(saveDefault && showSaveDefault)
      if (didSaveProfile) {
        await patchProfileAddress({ text: text.trim(), lat, lng })
        toast.success('Saved as your default address')
        window.dispatchEvent(new Event('auth-session-changed'))
      }
      await Promise.resolve(
        onConfirm({ text: text.trim(), lat, lng, saveAsDefault: didSaveProfile }),
      )
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save location')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <form
          onSubmit={submit}
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl sm:p-6"
        >
          <h2 className="type-page-title text-gray-900">Set location</h2>
          <p className="mt-1 text-sm text-gray-500">Search, use GPS, or drop a pin. This session uses this point until you change it.</p>

          <div className="mt-4 space-y-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</span>
            <LocationSelectorRow
              id="booking-loc-modal"
              value={text}
              onChange={setText}
              onPlaceResolved={handlePlaceResolved}
              onOpenMap={() => setMapOpen(true)}
              disabled={geoBusy}
              mapButtonLabel="Select on map"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              disabled={geoBusy}
              onClick={useDeviceLocation}
            >
              {geoBusy ? 'Locating…' : 'Use my location'}
            </Button>
          </div>

          {showSaveDefault && (
            <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={saveDefault}
                onChange={(e) => setSaveDefault(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Save as default location (updates your profile)</span>
            </label>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button type="submit" disabled={submitting || geoBusy} className="rounded-xl">
              {submitting ? 'Saving…' : 'Use this location'}
            </Button>
          </div>
        </form>
      </div>

      <MapPickerModal
        open={mapOpen}
        initialLat={lat}
        initialLng={lng}
        onClose={() => setMapOpen(false)}
        onConfirm={applyMapCoords}
      />
    </>
  )
}
