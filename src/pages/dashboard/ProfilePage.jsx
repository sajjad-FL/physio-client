import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { assetUrl } from '../../utils/assetUrl'
import { mapboxReverseGeocode } from '../../utils/mapboxGeocode'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import MapPickerModal from '../../components/location/MapPickerModal'
import LocationSelectorRow from '../../components/location/LocationSelectorRow'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function ProfilePage() {
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [roles, setRoles] = useState([])
  const [specialization, setSpecialization] = useState('')
  const [experience, setExperience] = useState('')
  const [fees, setFees] = useState('')
  const [addressText, setAddressText] = useState('')
  const [addressLat, setAddressLat] = useState(null)
  const [addressLng, setAddressLng] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

  const [previewLocal, setPreviewLocal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/profile')
      const d = res.data
      setName(d.name || '')
      setPhone(d.phone || '')
      setEmail(d.email || '')
      setDob(d.dob ? String(d.dob).slice(0, 10) : '')
      setGender(d.gender || '')
      setAvatarUrl(d.avatarUrl || '')
      setRoles(Array.isArray(d.roles) ? d.roles : [])
      setSpecialization(d.physio?.specialization || '')
      setExperience(d.physio?.experience != null ? String(d.physio.experience) : '')
      setFees(d.physio?.fees != null ? String(d.physio.fees) : '')
      setAddressText(d.address?.text || '')
      setAddressLat(Number.isFinite(d.address?.lat) ? d.address.lat : null)
      setAddressLng(Number.isFinite(d.address?.lng) ? d.address.lng : null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return () => {
      if (previewLocal) URL.revokeObjectURL(previewLocal)
    }
  }, [previewLocal])

  const displayAvatarSrc = previewLocal || assetUrl(avatarUrl)
  const isPhysio = roles.includes('physio')

  function onPlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setAddressLat(place.lat)
      setAddressLng(place.lng)
      setAddressText(place.label || '')
      return
    }
    setAddressLat(null)
    setAddressLng(null)
  }

  async function applyMapCoords(coords) {
    setAddressLat(coords.lat)
    setAddressLng(coords.lng)
    const label = await mapboxReverseGeocode(coords.lat, coords.lng)
    if (label) setAddressText(label)
  }

  function backLink() {
    if (roles.includes('admin')) {
      return { to: '/admin', label: '← Admin' }
    }
    if (isPhysio) {
      return { to: '/physio/bookings', label: '← Physio workspace' }
    }
    return { to: '/dashboard', label: '← Dashboard' }
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!dob) {
      toast.error('Date of birth is required')
      return
    }
    if (!gender) {
      toast.error('Gender is required')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }
    if ((addressLat == null) !== (addressLng == null)) {
      toast.error('Address coordinates are incomplete. Re-select a place on the map or from search.')
      return
    }
    if (isPhysio && !specialization.trim()) {
      toast.error('Specialization is required for physiotherapists')
      return
    }

    setSaving(true)
    try {
      const res = await api.patch('/profile', {
        name: name.trim(),
        email: email.trim(),
        dob,
        gender,
        address: {
          text: addressText.trim(),
          lat: addressLat,
          lng: addressLng,
        },
        ...(isPhysio
          ? {
              specialization: specialization.trim(),
              experience: experience === '' ? 0 : Number(experience),
              fees: fees === '' ? 0 : Number(fees),
            }
          : {}),
      })
      const d = res.data
      setName(d.name || '')
      setEmail(d.email || '')
      setDob(d.dob ? String(d.dob).slice(0, 10) : '')
      setGender(d.gender || '')
      setRoles(Array.isArray(d.roles) ? d.roles : roles)
      setAvatarUrl(d.avatarUrl ?? avatarUrl)
      setSpecialization(d.physio?.specialization || '')
      setExperience(d.physio?.experience != null ? String(d.physio.experience) : '')
      setFees(d.physio?.fees != null ? String(d.physio.fees) : '')
      setAddressText(d.address?.text || '')
      setAddressLat(Number.isFinite(d.address?.lat) ? d.address.lat : null)
      setAddressLng(Number.isFinite(d.address?.lng) ? d.address.lng : null)
      toast.success('Profile updated')
      window.dispatchEvent(new Event('auth-session-changed'))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  function onPickFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('Please choose a JPEG, PNG, or WebP image')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2MB or smaller')
      return
    }
    if (previewLocal) URL.revokeObjectURL(previewLocal)
    const objectUrl = URL.createObjectURL(file)
    setPreviewLocal(objectUrl)
    uploadFile(file, objectUrl)
  }

  async function uploadFile(file, objectUrl) {
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api.patch('/profile/avatar', fd)
      const next = res.data?.avatarUrl || ''
      setAvatarUrl(next)
      URL.revokeObjectURL(objectUrl)
      setPreviewLocal(null)
      toast.success('Photo updated')
    } catch (err) {
      URL.revokeObjectURL(objectUrl)
      setPreviewLocal(null)
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" aria-hidden />
      </div>
    )
  }

  const nav = backLink()

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to={nav.to} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          {nav.label}
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your details, photo, and saved address</p>
      </div>

      <Card hover={false} className="border border-gray-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-8">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 ring-offset-2 ring-offset-white">
              {displayAvatarSrc ? (
                <img src={displayAvatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-400">
                  {(name || phone || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
          <Button type="button" variant="outline" className="rounded-xl" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload photo'}
          </Button>
          <p className="text-center text-xs text-gray-500">JPEG, PNG, or WebP · max 2MB</p>
        </div>

        <form onSubmit={saveProfile} className="mt-8 space-y-5">
          <div>
            <label htmlFor="pf-name" className="block text-sm font-medium text-gray-800">
              Name
            </label>
            <input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="pf-phone" className="block text-sm font-medium text-gray-800">
              Phone
            </label>
            <input
              id="pf-phone"
              value={phone}
              readOnly
              className="mt-1.5 h-11 w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50 px-3 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">Phone is tied to your login and cannot be changed here.</p>
          </div>

          <div>
            <label htmlFor="pf-email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">Address</label>
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
              <p className="mb-2 text-xs text-gray-500">No address saved yet. Search below or pick on the map.</p>
            )}
            <LocationSelectorRow
              id="pf-address"
              value={addressText}
              onChange={setAddressText}
              onPlaceResolved={onPlaceResolved}
              onOpenMap={() => setMapOpen(true)}
              placeholder="Type to search (Mapbox) or enter manually"
            />
          </div>

          <div>
            <label htmlFor="pf-dob" className="block text-sm font-medium text-gray-800">
              Date of birth
            </label>
            <input
              id="pf-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="pf-gender" className="block text-sm font-medium text-gray-800">
              Gender
            </label>
            <select
              id="pf-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select…</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {isPhysio && (
            <>
              <div>
                <label htmlFor="pf-specialization" className="block text-sm font-medium text-gray-800">
                  Specialization
                </label>
                <input
                  id="pf-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Orthopedic, Sports rehab"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="pf-experience" className="block text-sm font-medium text-gray-800">
                    Experience (years)
                  </label>
                  <input
                    id="pf-experience"
                    type="number"
                    min="0"
                    max="80"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="pf-fees" className="block text-sm font-medium text-gray-800">
                    Fees per session (INR)
                  </label>
                  <input
                    id="pf-fees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </>
          )}

          <Button type="submit" variant="primary" className="mt-2 h-11 w-full rounded-xl" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>

      <MapPickerModal
        open={mapOpen}
        initialLat={addressLat}
        initialLng={addressLng}
        onClose={() => setMapOpen(false)}
        onConfirm={async (coords) => {
          await applyMapCoords(coords)
          setMapOpen(false)
          toast.success('Location selected')
        }}
      />
    </div>
  )
}
