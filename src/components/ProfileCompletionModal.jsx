import { useCallback, useEffect, useState } from 'react'
import { api } from '../config/api'
import { validateLiveField } from '../utils/liveFieldValidation'
import { invalidateProfileCache } from '../utils/profileCache'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'
import toast from 'react-hot-toast'
import Button from './ui/Button'
import MapPickerModal from './location/MapPickerModal'
import LocationSelectorRow from './location/LocationSelectorRow'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

function fieldClass(hasError) {
  return `mt-1.5 w-full rounded-xl border bg-gray-50/80 px-3 text-gray-900 shadow-inner outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
  }`
}

/**
 * Full-screen blocking modal — no dismiss control until the profile is complete on the server.
 * @param {{ initial?: { name?: string, dob?: string | null, gender?: string | null, address?: { text?: string, lat?: number|null, lng?: number|null } }, onComplete: () => void }} props
 */
export default function ProfileCompletionModal({ initial, onComplete }) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [addressText, setAddressText] = useState('')
  const [addressLat, setAddressLat] = useState(null)
  const [addressLng, setAddressLng] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const bumpAddressErrors = useCallback((text, lat, lng) => {
    setFieldErrors((prev) => ({
      ...prev,
      address: validateLiveField('location', text, { mode: 'booking' }),
      addressCoords: validateLiveField('addressCoords', '', { addressLat: lat, addressLng: lng }),
    }))
  }, [])

  useEffect(() => {
    if (!initial) return
    if (initial.name) setName(initial.name)
    if (initial.dob) setDob(String(initial.dob).slice(0, 10))
    if (initial.gender) setGender(initial.gender)
    const t = initial.address?.text
    if (t) setAddressText(t)
    const lat = initial.address?.lat
    const lng = initial.address?.lng
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setAddressLat(lat)
      setAddressLng(lng)
    }
  }, [initial])

  useEffect(() => {
    setFieldErrors((prev) => ({
      ...prev,
      addressCoords: validateLiveField('addressCoords', '', { addressLat, addressLng }),
    }))
  }, [addressLat, addressLng])

  function onPlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setAddressLat(place.lat)
      setAddressLng(place.lng)
      const label = place.label || ''
      setAddressText(label)
      bumpAddressErrors(label, place.lat, place.lng)
      return
    }
    setAddressLat(null)
    setAddressLng(null)
  }

  async function applyMapCoords(coords) {
    setAddressLat(coords.lat)
    setAddressLng(coords.lng)
    const label = await mapboxReverseGeocode(coords.lat, coords.lng)
    if (label) {
      setAddressText(label)
      bumpAddressErrors(label, coords.lat, coords.lng)
    } else {
      const fallback = `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
      setAddressText(fallback)
      bumpAddressErrors(fallback, coords.lat, coords.lng)
    }
  }

  async function submit(e) {
    e.preventDefault()
    const next = {
      name: validateLiveField('name', name),
      dob: validateLiveField('dob', dob),
      gender: validateLiveField('gender', gender, { requiredGender: true }),
      address: validateLiveField('location', addressText, { mode: 'booking' }),
      addressCoords: validateLiveField('addressCoords', '', { addressLat, addressLng }),
    }
    setFieldErrors(next)
    if (Object.values(next).some(Boolean)) {
      toast.error('Please fix the highlighted fields')
      return
    }

    setBusy(true)
    try {
      const res = await api.patch('/profile', {
        name: name.trim(),
        dob,
        gender,
        address: {
          text: addressText.trim(),
          lat: addressLat,
          lng: addressLng,
        },
      })
      invalidateProfileCache()
      setFieldErrors({})
      if (res.data?.isProfileComplete === true) {
        toast.success('Profile saved')
        onComplete()
      } else {
        toast.error('Please add date of birth, gender, and address (area or city) before continuing.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-blue-600">Finish setup</p>
            <h1 className="type-page-title mt-2 text-center text-gray-900">Complete your profile</h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              Your account is already created. Add date of birth, gender, and address here — or any time under Profile — so
              you can book sessions and use your dashboard.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="pc-name" className="block text-sm font-medium text-gray-800">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="pc-name"
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value
                    setName(v)
                    setFieldErrors((prev) => ({ ...prev, name: validateLiveField('name', v) }))
                  }}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className={`${fieldClass(Boolean(fieldErrors.name))} h-11`}
                  placeholder="As on official ID"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
              </div>

              <div>
                <label htmlFor="pc-dob" className="block text-sm font-medium text-gray-800">
                  Date of birth <span className="text-red-500">*</span>
                </label>
                <input
                  id="pc-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    const v = e.target.value
                    setDob(v)
                    setFieldErrors((prev) => ({ ...prev, dob: validateLiveField('dob', v) }))
                  }}
                  aria-invalid={Boolean(fieldErrors.dob)}
                  className={`${fieldClass(Boolean(fieldErrors.dob))} h-11`}
                />
                {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
              </div>

              <div>
                <label htmlFor="pc-gender" className="block text-sm font-medium text-gray-800">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="pc-gender"
                  value={gender}
                  onChange={(e) => {
                    const v = e.target.value
                    setGender(v)
                    setFieldErrors((prev) => ({
                      ...prev,
                      gender: validateLiveField('gender', v, { requiredGender: true }),
                    }))
                  }}
                  aria-invalid={Boolean(fieldErrors.gender)}
                  className={`${fieldClass(Boolean(fieldErrors.gender))} h-11`}
                >
                  <option value="">Select…</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Address <span className="text-red-500">*</span>
                </label>
                {addressText.trim() || addressLat != null ? (
                  <p className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-100">
                    <span className="font-medium text-gray-800">Current: </span>
                    {addressText.trim() || '—'}
                    {addressLat != null && addressLng != null ? (
                      <span className="mt-1 block text-gray-500 tabular-nums">
                        {addressLat.toFixed(5)}, {addressLng.toFixed(5)}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mb-2 text-xs text-gray-500">Search below or pick on the map to set your location.</p>
                )}
                <LocationSelectorRow
                  id="pc-address"
                  value={addressText}
                  onChange={(v) => {
                    setAddressText(v)
                    setFieldErrors((prev) => ({
                      ...prev,
                      address: validateLiveField('location', v, { mode: 'booking' }),
                    }))
                  }}
                  onPlaceResolved={onPlaceResolved}
                  onOpenMap={() => setMapOpen(true)}
                  disabled={busy}
                  placeholder="Type to search (Mapbox) or enter manually"
                />
                {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
                {fieldErrors.addressCoords ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.addressCoords}</p>
                ) : null}
              </div>

              <Button type="submit" variant="primary" className="mt-2 h-12 w-full text-[15px]" disabled={busy}>
                {busy ? 'Saving…' : 'Save and continue'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <MapPickerModal
        open={mapOpen}
        initialLat={addressLat}
        initialLng={addressLng}
        overlayClassName="z-[110]"
        onClose={() => setMapOpen(false)}
        onConfirm={async (coords) => {
          await applyMapCoords(coords)
          setMapOpen(false)
          toast.success('Location selected')
        }}
      />
    </>
  )
}
