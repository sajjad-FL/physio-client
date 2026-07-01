import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../config/api'
import { clearToken } from '../../auth/session'
import { getProfileCached, invalidateProfileCache } from '../../utils/profileCache'
import { assetUrl } from '../../utils/assetUrl'
import { mapboxReverseGeocode } from '../../utils/mapboxGeocode'
import { validateLiveField } from '../../utils/liveFieldValidation'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import MapPickerModal from '../../components/location/MapPickerModal'
import LocationSelectorRow from '../../components/location/LocationSelectorRow'
import SeoNoIndex from '../../components/seo/SeoNoIndex'
import { validateAvatarFile } from '../../utils/onboardingValidation'
import { MAX_UPLOAD_SIZE_LABEL } from '../../constants/uploadLimits.js'
import { useReferralMyCode } from '../../hooks/useReferral'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

function profileRoleFromApi(d) {
  if (d?.role === 'user' || d?.role === 'physio' || d?.role === 'admin') return d.role
  const arr = Array.isArray(d?.roles) ? d.roles : []
  if (arr.includes('admin')) return 'admin'
  if (arr.includes('physio')) return 'physio'
  return 'user'
}

export default function ProfilePage() {
  const navigate = useNavigate()
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
  const [role, setRole] = useState('user')
  const [specialization, setSpecialization] = useState('')
  const [experience, setExperience] = useState('')
  const [fees, setFees] = useState('')
  const [addressText, setAddressText] = useState('')
  const [addressLat, setAddressLat] = useState(null)
  const [addressLng, setAddressLng] = useState(null)
  const [mapOpen, setMapOpen] = useState(false)

  const [previewLocal, setPreviewLocal] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const patchField = useCallback(
    (name, value, extra = {}) => {
      const physio = role === 'physio'
      setFieldErrors((prev) => {
        const ctx = { isPhysio: physio, requiredGender: true, ...extra }
        if (name === 'addressCoords') {
          ctx.addressLat = addressLat
          ctx.addressLng = addressLng
        }
        return { ...prev, [name]: validateLiveField(name, value, ctx) }
      })
    },
    [addressLat, addressLng, role],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProfileCached(api, { force: false })
      if (!res?.data) {
        toast.error('Could not load profile')
        return
      }
      const d = res.data
      setName(d.name || '')
      setPhone(d.phone || '')
      setEmail(d.email || '')
      setDob(d.dob ? String(d.dob).slice(0, 10) : '')
      setGender(d.gender || '')
      setAvatarUrl(d.avatarUrl || '')
      setRole(profileRoleFromApi(d))
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

  useEffect(() => {
    setFieldErrors((prev) => ({
      ...prev,
      addressCoords: validateLiveField('addressCoords', '', { addressLat, addressLng }),
    }))
  }, [addressLat, addressLng])

  const displayAvatarSrc = previewLocal || assetUrl(avatarUrl)
  const isPhysio = role === 'physio'
  const isPatient = role === 'user'
  const { referralRewardAmount, referralSignupBonusAmount } = useReferralMyCode(isPatient)

  const profileStrength = useMemo(() => {
    const fields = [name, email, dob, gender, addressText]
    if (isPhysio) {
      fields.push(specialization, experience, fees)
    }
    const filled = fields.filter((x) => String(x || '').trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }, [name, email, dob, gender, addressText, specialization, experience, fees, isPhysio])

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        'This will permanently delete your account and all associated data. This action cannot be undone.',
      )
    ) {
      return
    }
    try {
      await api.delete('/profile')
      clearToken()
      window.dispatchEvent(new Event('auth-session-changed'))
      toast.success('Account deleted')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account')
    }
  }

  function onPlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setAddressLat(place.lat)
      setAddressLng(place.lng)
      const label = place.label || ''
      setAddressText(label)
      patchField('address', label)
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
      patchField('address', label)
    }
  }

  function backLink() {
    if (role === 'admin') {
      return { to: '/admin', label: '← Admin' }
    }
    if (isPhysio) {
      return { to: '/physio/bookings', label: '← Physiotherapist workspace' }
    }
    return { to: '/dashboard', label: '← Dashboard' }
  }

  async function saveProfile(e) {
    e.preventDefault()
    const physio = role === 'physio'
    const nextErrors = {
      name: validateLiveField('name', name),
      profileEmail: validateLiveField('profileEmail', email),
      dob: validateLiveField('dob', dob),
      gender: validateLiveField('gender', gender, { requiredGender: true }),
      address: physio
        ? validateLiveField('address', addressText)
        : validateLiveField('location', addressText, { mode: 'booking' }),
      addressCoords: validateLiveField('addressCoords', '', { addressLat, addressLng }),
    }
    if (physio) {
      nextErrors.specialization = validateLiveField('specialization', specialization, { isPhysio: true })
      nextErrors.profileExperience = validateLiveField('profileExperience', experience)
      nextErrors.profileFees = validateLiveField('profileFees', fees)
    }
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error('Please fix the highlighted fields')
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
      setRole(profileRoleFromApi(d))
      setAvatarUrl(d.avatarUrl ?? avatarUrl)
      setSpecialization(d.physio?.specialization || '')
      setExperience(d.physio?.experience != null ? String(d.physio.experience) : '')
      setFees(d.physio?.fees != null ? String(d.physio.fees) : '')
      setAddressText(d.address?.text || '')
      setAddressLat(Number.isFinite(d.address?.lat) ? d.address.lat : null)
      setAddressLng(Number.isFinite(d.address?.lng) ? d.address.lng : null)
      setFieldErrors({})
      invalidateProfileCache()
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
    const avatarCheck = validateAvatarFile(file)
    if (!avatarCheck.ok) {
      toast.error(avatarCheck.message)
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
      invalidateProfileCache()
      window.dispatchEvent(new Event('auth-session-changed'))
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
      <>
        <SeoNoIndex />
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" aria-hidden />
        </div>
      </>
    )
  }

  const nav = backLink()

  return (
    <>
      <SeoNoIndex />
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to={nav.to} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          {nav.label}
        </Link>
      </div>

      <div className="mb-8 text-center">
        <h1 className="type-page-title text-gray-900">Profile</h1>
        <p className="mt-1 type-caption text-gray-500">Your details, photo, and saved address</p>
      </div>

      <Card hover={false} className="border border-gray-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-8">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 ring-offset-2 ring-offset-white">
              {displayAvatarSrc ? (
                <img src={displayAvatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[19px] font-semibold text-gray-400 sm:text-2xl">
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
          <p className="text-center text-xs text-gray-500">JPEG, PNG, or WebP · max {MAX_UPLOAD_SIZE_LABEL}</p>
          <div className="mt-2 w-full max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs font-medium text-slate-600">{profileStrength}% complete</p>
          </div>
        </div>

        {isPatient ? (
          <Link
            to="/dashboard/referrals"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 transition hover:border-teal-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Refer &amp; Earn Credits</p>
              <p className="text-sm text-slate-600">
                {referralSignupBonusAmount > 0
                  ? `Friends get ₹${referralSignupBonusAmount} on signup · you earn ₹${referralRewardAmount}`
                  : `Share your code and earn ₹${referralRewardAmount} per friend`}
              </p>
            </div>
            <span className="text-sm font-semibold text-teal-700">→</span>
          </Link>
        ) : null}

        <form onSubmit={saveProfile} className="mt-8 space-y-5">
          <div>
            <label htmlFor="pf-name" className="block text-sm font-medium text-gray-800">
              Name
            </label>
            <input
              id="pf-name"
              value={name}
              onChange={(e) => {
                const v = e.target.value
                setName(v)
                patchField('name', v)
              }}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
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
              onChange={(e) => {
                const v = e.target.value
                setEmail(v)
                patchField('profileEmail', v)
              }}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.profileEmail)}
              className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                fieldErrors.profileEmail
                  ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
              placeholder="name@example.com"
            />
            {fieldErrors.profileEmail ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.profileEmail}</p>
            ) : null}
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
              onChange={(v) => {
                setAddressText(v)
                patchField('address', v)
              }}
              onPlaceResolved={onPlaceResolved}
              onOpenMap={() => setMapOpen(true)}
              placeholder="Type to search (Mapbox) or enter manually"
            />
            {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
            {fieldErrors.addressCoords ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.addressCoords}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="pf-dob" className="block text-sm font-medium text-gray-800">
              Date of birth
            </label>
            <input
              id="pf-dob"
              type="date"
              value={dob}
              onChange={(e) => {
                const v = e.target.value
                setDob(v)
                patchField('dob', v)
              }}
              aria-invalid={Boolean(fieldErrors.dob)}
              className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                fieldErrors.dob
                  ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
            {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
          </div>

          <div>
            <label htmlFor="pf-gender" className="block text-sm font-medium text-gray-800">
              Gender
            </label>
            <select
              id="pf-gender"
              value={gender}
              onChange={(e) => {
                const v = e.target.value
                setGender(v)
                patchField('gender', v)
              }}
              aria-invalid={Boolean(fieldErrors.gender)}
              className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                fieldErrors.gender
                  ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
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

          {isPhysio && (
            <>
              <div>
                <label htmlFor="pf-specialization" className="block text-sm font-medium text-gray-800">
                  Specialization
                </label>
                <input
                  id="pf-specialization"
                  value={specialization}
                  onChange={(e) => {
                    const v = e.target.value
                    setSpecialization(v)
                    patchField('specialization', v)
                  }}
                  aria-invalid={Boolean(fieldErrors.specialization)}
                  className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                    fieldErrors.specialization
                      ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder="e.g. Orthopedic, Sports rehab"
                />
                {fieldErrors.specialization ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
                ) : null}
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
                    onChange={(e) => {
                      const v = e.target.value
                      setExperience(v)
                      patchField('profileExperience', v)
                    }}
                    aria-invalid={Boolean(fieldErrors.profileExperience)}
                    className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                      fieldErrors.profileExperience
                        ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {fieldErrors.profileExperience ? (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.profileExperience}</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="pf-fees" className="block text-sm font-medium text-gray-800">
                    Fee per session (INR)
                  </label>
                  <p className="mt-0.5 text-xs text-gray-500">One fixed amount per session.</p>
                  <input
                    id="pf-fees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fees}
                    onChange={(e) => {
                      const v = e.target.value
                      setFees(v)
                      patchField('profileFees', v)
                    }}
                    aria-invalid={Boolean(fieldErrors.profileFees)}
                    className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-gray-900 shadow-sm outline-none focus:ring-2 ${
                      fieldErrors.profileFees
                        ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {fieldErrors.profileFees ? (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.profileFees}</p>
                  ) : null}
                </div>
              </div>
            </>
          )}

          <Button type="submit" variant="primary" className="mt-2 h-11 w-full rounded-xl" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        {isPatient ? (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              Delete account
            </button>
          </div>
        ) : null}
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
    </>
  )
}
