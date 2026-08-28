import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
 * Dismissible overlay modal for incomplete patient profiles.
 */
export default function ProfileCompletionOverlay({ open, onDismiss, profile, missingFields = [], refresh }) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [addressText, setAddressText] = useState('')
  const [addressLat, setAddressLat] = useState(null)
  const [addressLng, setAddressLng] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const showAllPatientFields = useMemo(() => {
    if (!profile || profile.role !== 'user' || profile.isProfileComplete) return false
    return !missingFields?.length
  }, [profile, missingFields])

  const fieldVisible = useCallback(
    (key) => {
      if (showAllPatientFields) return true
      return missingFields?.some((m) => m.key === key)
    },
    [missingFields, showAllPatientFields],
  )

  useEffect(() => {
    if (!open || !profile) return
    setName(profile.name || '')
    setDob(profile.dob ? String(profile.dob).slice(0, 10) : '')
    setGender(profile.gender || '')
    setAddressText(String(profile.address?.text ?? profile.location ?? ''))
    setAddressLat(Number.isFinite(profile.address?.lat) ? profile.address.lat : null)
    setAddressLng(Number.isFinite(profile.address?.lng) ? profile.address.lng : null)
    setFieldErrors({})
  }, [open, profile])

  useEffect(() => {
    setFieldErrors((prev) => ({
      ...prev,
      addressCoords: validateLiveField('addressCoords', '', { addressLat, addressLng }),
    }))
  }, [addressLat, addressLng])

  if (!open) return null

  function onPlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setAddressLat(place.lat)
      setAddressLng(place.lng)
      const label = place.label || ''
      setAddressText(label)
      setFieldErrors((prev) => ({
        ...prev,
        address: validateLiveField('location', label, { mode: 'booking' }),
        addressCoords: validateLiveField('addressCoords', '', { addressLat: place.lat, addressLng: place.lng }),
      }))
      return
    }
    setAddressLat(null)
    setAddressLng(null)
  }

  async function applyMapCoords(coords) {
    setAddressLat(coords.lat)
    setAddressLng(coords.lng)
    const label = await mapboxReverseGeocode(coords.lat, coords.lng)
    const text = label || `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
    setAddressText(text)
    setFieldErrors((prev) => ({
      ...prev,
      address: validateLiveField('location', text, { mode: 'booking' }),
      addressCoords: validateLiveField('addressCoords', '', { addressLat: coords.lat, addressLng: coords.lng }),
    }))
  }

  async function submit(e) {
    e.preventDefault()
    const next = {}
    if (fieldVisible('name')) next.name = validateLiveField('name', name)
    if (fieldVisible('dob')) next.dob = validateLiveField('dob', dob)
    if (fieldVisible('gender')) next.gender = validateLiveField('gender', gender, { requiredGender: true })
    if (fieldVisible('address')) {
      next.address = validateLiveField('location', addressText, { mode: 'booking' })
      next.addressCoords = validateLiveField('addressCoords', '', { addressLat, addressLng })
    }
    setFieldErrors(next)
    if (Object.values(next).some(Boolean)) {
      toast.error('Please fix the highlighted fields')
      return
    }

    setBusy(true)
    try {
      const payload = {}
      if (fieldVisible('name')) payload.name = name.trim()
      if (fieldVisible('dob')) payload.dob = dob
      if (fieldVisible('gender')) payload.gender = gender
      if (fieldVisible('address')) {
        payload.address = {
          text: addressText.trim(),
          lat: addressLat,
          lng: addressLng,
        }
      }
      await api.patch('/profile', payload)
      invalidateProfileCache()
      setFieldErrors({})
      toast.success('Profile saved')
      window.dispatchEvent(new Event('auth-session-changed'))
      await refresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
        <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-teal-600">Finish setup</p>
          <h2 className="type-page-title mt-2 text-center text-gray-900">Complete your profile</h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Add the missing details so you can book appointments and use your dashboard.
          </p>

          {missingFields.length > 0 ? (
            <ul className="mt-4 space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {missingFields.map((m) => (
                <li key={m.key}>· {m.label}</li>
              ))}
            </ul>
          ) : null}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {fieldVisible('name') ? (
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
                  className={`${fieldClass(Boolean(fieldErrors.name))} h-11`}
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
              </div>
            ) : null}

            {fieldVisible('dob') ? (
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
                  className={`${fieldClass(Boolean(fieldErrors.dob))} h-11`}
                />
                {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
              </div>
            ) : null}

            {fieldVisible('gender') ? (
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
            ) : null}

            {fieldVisible('address') ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  Address <span className="text-red-500">*</span>
                </label>
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
            ) : null}

            <Button type="submit" variant="primary" className="mt-2 h-11 w-full" disabled={busy}>
              {busy ? 'Saving…' : 'Save profile'}
            </Button>
            <Link
              to="/dashboard/profile"
              onClick={onDismiss}
              className="block text-center text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              Open full profile page
            </Link>
          </form>
        </div>
      </div>

      <MapPickerModal
        open={mapOpen}
        initialLat={addressLat}
        initialLng={addressLng}
        overlayClassName="z-[100]"
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
