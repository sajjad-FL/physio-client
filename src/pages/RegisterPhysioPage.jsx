import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import { resolveFileUrl } from '../utils/serverOrigin'
import DocumentUploadPreview from '../components/physio/DocumentUploadPreview'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'
import { toastApiError, toastValidationErrors } from '../utils/formToast'
import PasswordInput from '../components/ui/PasswordInput'
import MapPickerModal from '../components/location/MapPickerModal'
import LocationSelectorRow from '../components/location/LocationSelectorRow'
import {
  validateAvatarFile,
  validateBasicSection,
  validateDocumentsStep,
  validateFile,
  validatePracticeSection,
  validateQualificationSection,
  validateRegistrationAccount,
} from '../utils/onboardingValidation'
import { normalizeIndianPhone } from '../utils/phoneIndia'
import { validateLiveField } from '../utils/liveFieldValidation'

const baseInputClass =
  'h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink shadow-sm outline-none focus:ring-2 focus:ring-brand/20'

const steps = [
  { n: 1, title: 'Account & basic', desc: 'Sign-in, contact, profile' },
  { n: 2, title: 'Qualification', desc: 'Education & registration' },
  { n: 3, title: 'Practice', desc: 'Services and fees' },
  { n: 4, title: 'Documents', desc: 'Required uploads' },
  { n: 5, title: 'Review', desc: 'Submit application' },
]

function ErrorBanner({ formError, fieldErrors }) {
  const entries = Object.entries(fieldErrors || {}).filter(([, v]) => Boolean(v))
  if (!formError && entries.length === 0) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      {formError ? <p className="font-medium">{formError}</p> : null}
      {entries.length > 0 ? (
        <ul className={`list-disc space-y-0.5 pl-5 ${formError ? 'mt-2' : ''}`}>
          {entries.map(([k, v]) => (
            <li key={k}>{v}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function RegisterPhysioPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const [coverageMapOpen, setCoverageMapOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const [degree, setDegree] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')

  const [experience, setExperience] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [serviceType, setServiceType] = useState('both')
  const [areas, setAreas] = useState('')
  const [fees, setFees] = useState('')

  const [fCertificate, setFCertificate] = useState(null)
  const [fIdProof, setFIdProof] = useState(null)
  const [fRegCert, setFRegCert] = useState(null)
  const [fSelfie, setFSelfie] = useState(null)
  const [fSignedNda, setFSignedNda] = useState(null)

  const [ndaPolicy, setNdaPolicy] = useState({
    requireSignedNda: false,
    templateUrl: '',
    originalName: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const clearErrors = () => {
    setFieldErrors({})
    setFormError('')
  }

  const patchField = useCallback(
    (name, value, extra = {}) => {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: validateLiveField(name, value, {
          mode: 'physio',
          isPhysio: true,
          requireCoords: true,
          locationLat,
          locationLng,
          ...extra,
        }),
      }))
    },
    [locationLat, locationLng],
  )

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/platform/physio-nda')
        if (cancelled) return
        setNdaPolicy({
          requireSignedNda: Boolean(data.requireSignedNda && data.templateUrl),
          templateUrl: data.templateUrl || '',
          originalName: data.originalName || 'nda-template.pdf',
        })
      } catch {
        if (!cancelled) {
          setNdaPolicy({ requireSignedNda: false, templateUrl: '', originalName: '' })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function onCoveragePlaceResolved(place) {
    if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
      setLocationLat(place.lat)
      setLocationLng(place.lng)
      if (place.label) setLocation(place.label)
      setFieldErrors((prev) => ({
        ...prev,
        location: validateLiveField('location', place.label || '', {
          mode: 'physio',
          requireCoords: true,
          locationLat: place.lat,
          locationLng: place.lng,
        }),
      }))
      return
    }
    setLocationLat(null)
    setLocationLng(null)
    setFieldErrors((prev) => ({
      ...prev,
      location: validateLiveField('location', location, {
        mode: 'physio',
        requireCoords: true,
        locationLat: null,
        locationLng: null,
      }),
    }))
  }

  async function applyCoverageMapCoords(coords) {
    setLocationLat(coords.lat)
    setLocationLng(coords.lng)
    const label = await mapboxReverseGeocode(coords.lat, coords.lng)
    if (label) setLocation(label)
    setFieldErrors((prev) => ({
      ...prev,
      location: validateLiveField('location', label || '', {
        mode: 'physio',
        requireCoords: true,
        locationLat: coords.lat,
        locationLng: coords.lng,
      }),
    }))
  }

  const inputClass = (name) =>
    [
      baseInputClass,
      fieldErrors[name]
        ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500'
        : 'border-border-subtle focus:border-brand',
    ].join(' ')

  async function goNext(fromStep) {
    clearErrors()
    setSaving(true)
    try {
      if (fromStep === 1) {
        const e1 = validateRegistrationAccount({ phone, password }).errors
        const e2 = validateBasicSection({
          name,
          email,
          location,
          dob: dob || undefined,
          gender,
          address,
        }).errors
        const merged = { ...e1, ...e2 }
        if (avatarFile) {
          const av = validateAvatarFile(avatarFile)
          if (!av.ok) merged.avatar = av.message
        }
        if (locationLat == null || locationLng == null) {
          merged.location =
            merged.location ||
            'Search with Mapbox or use Pick on map to set your coverage point (needed for bookings).'
        }
        if (Object.keys(merged).length) {
          setFieldErrors(merged)
          setFormError('Fix the errors below before continuing')
          toastValidationErrors(merged, 'Fix the errors below before continuing')
          return
        }
      }

      if (fromStep === 2) {
        const { errors } = validateQualificationSection({
          degree,
          university,
          year,
          registrationNumber,
        })
        if (Object.keys(errors).length) {
          setFieldErrors(errors)
          setFormError('Fix the errors below before continuing')
          toastValidationErrors(errors, 'Fix the errors below before continuing')
          return
        }
      }

      if (fromStep === 3) {
        const { errors } = validatePracticeSection({
          experience,
          specialization,
          serviceType,
          areas,
          fees,
        })
        if (Object.keys(errors).length) {
          setFieldErrors(errors)
          setFormError('Fix the errors below before continuing')
          toastValidationErrors(errors, 'Fix the errors below before continuing')
          return
        }
      }

      if (fromStep === 4) {
        const { errors, ok } = validateDocumentsStep(
          { fCertificate, fIdProof, fRegCert, fSelfie, fSignedNda },
          { certificate: '', idProof: '', registration: '', selfie: '', signedNda: '' },
          { requireSignedNda: ndaPolicy.requireSignedNda },
        )
        if (!ok) {
          setFieldErrors(errors)
          setFormError('Upload all required documents before continuing')
          toastValidationErrors(errors, 'Upload all required documents before continuing')
          return
        }
        const checks = [
          [fCertificate, 'Qualification certificate'],
          [fIdProof, 'ID proof'],
          [fRegCert, 'Registration certificate'],
          [fSelfie, 'Selfie with ID'],
          ...(ndaPolicy.requireSignedNda ? [[fSignedNda, 'Signed NDA']] : []),
        ]
        for (const [file, label] of checks) {
          if (file) {
            const r = validateFile(file, label)
            if (!r.ok) {
              setFieldErrors({ file: r.message })
              setFormError(r.message)
              toastValidationErrors({ file: r.message }, r.message)
              return
            }
          }
        }
      }

      setStep(Math.min(5, fromStep + 1))
      clearErrors()
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    clearErrors()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('phone', normalizeIndianPhone(phone))
      fd.append('password', password)
      fd.append('name', name.trim())
      fd.append('email', email.trim().toLowerCase())
      if (dob) fd.append('dob', dob)
      if (gender) fd.append('gender', gender)
      if (address.trim()) fd.append('address', address.trim())
      fd.append('location', location.trim())
      if (Number.isFinite(locationLat) && Number.isFinite(locationLng)) {
        fd.append('lat', String(locationLat))
        fd.append('lng', String(locationLng))
      }
      fd.append('degree', degree.trim())
      fd.append('university', university.trim())
      fd.append('year', String(year))
      fd.append('registrationNumber', registrationNumber.trim())
      fd.append('experience', String(experience))
      fd.append('specialization', specialization.trim())
      fd.append('serviceType', serviceType)
      fd.append('areas', areas)
      fd.append('fees', String(fees))

      if (avatarFile) fd.append('avatar', avatarFile)
      fd.append('certificate', fCertificate)
      fd.append('idProof', fIdProof)
      fd.append('registrationCertificate', fRegCert)
      fd.append('selfieWithId', fSelfie)
      if (ndaPolicy.requireSignedNda) {
        if (!fSignedNda) {
          setFormError('Upload the signed NDA before submitting')
          toast.error('Upload the signed NDA before submitting')
          return
        }
        fd.append('signedNda', fSignedNda)
      }

      await api.post('/auth/register-physio', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Application submitted. Sign in with email & password after an admin approves you.')
      navigate('/login', { replace: true })
    } catch (e) {
      const data = e.response?.data
      if (data?.errors && typeof data.errors === 'object') {
        setFieldErrors(data.errors)
        setFormError(data.message || 'Please fix the errors below')
        toastValidationErrors(data.errors, data.message || 'Please fix the errors')
      } else {
        toastApiError(e, data?.message || 'Registration failed')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white/90 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm font-semibold text-gray-900 hover:opacity-80">
            ← PhysioCare
          </Link>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Register as a physiotherapist</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Same details as workspace onboarding. After submit, an admin reviews your application before you can work
            on the platform.
          </p>
        </div>

        <ol className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => {
                  setStep(s.n)
                  clearErrors()
                }}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition',
                  step === s.n
                    ? 'bg-brand text-white ring-brand'
                    : 'bg-white text-ink-muted ring-border-subtle hover:bg-canvas',
                ].join(' ')}
              >
                {s.n}. {s.title}
              </button>
            </li>
          ))}
        </ol>

        <ErrorBanner formError={formError} fieldErrors={fieldErrors} />

        {step === 1 && (
          <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">Account & basic info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-phone">
                  Phone (for account)
                </label>
                <input
                  id="reg-phone"
                  className={inputClass('phone')}
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value
                    setPhone(v)
                    patchField('phone', v)
                  }}
                  inputMode="tel"
                  autoComplete="tel"
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-password">
                  Password (min 8 characters)
                </label>
                <PasswordInput
                  id="reg-password"
                  className={inputClass('password')}
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value
                    setPassword(v)
                    patchField('password', v)
                  }}
                  autoComplete="new-password"
                />
                {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-name">
                  Full name
                </label>
                <input
                  id="reg-name"
                  className={inputClass('name')}
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value
                    setName(v)
                    patchField('name', v)
                  }}
                  autoComplete="name"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className={inputClass('email')}
                  value={email}
                  onChange={(e) => {
                    const v = e.target.value
                    setEmail(v)
                    patchField('email', v)
                  }}
                  autoComplete="email"
                />
                {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-dob">
                  Date of birth
                </label>
                <input
                  id="reg-dob"
                  type="date"
                  className={inputClass('dob')}
                  value={dob}
                  onChange={(e) => {
                    const v = e.target.value
                    setDob(v)
                    patchField('dob', v)
                  }}
                />
                {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-gender">
                  Gender
                </label>
                <select
                  id="reg-gender"
                  className={inputClass('gender')}
                  value={gender}
                  onChange={(e) => {
                    const v = e.target.value
                    setGender(v)
                    patchField('gender', v)
                  }}
                >
                  <option value="">—</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-address">
                  Address
                </label>
                <textarea
                  id="reg-address"
                  className={`${inputClass('address')} min-h-[88px] py-2`}
                  value={address}
                  onChange={(e) => {
                    const v = e.target.value
                    setAddress(v)
                    patchField('address', v)
                  }}
                  rows={3}
                />
                {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-coverage-search">
                  Coverage / location (required for bookings)
                </label>
                <p className="mb-2 text-xs text-ink-muted">
                  Same as profile address: search with Mapbox or open the map to drop a pin. Coordinates are saved so
                  patients can find you nearby.
                </p>
                {location.trim() || locationLat != null ? (
                  <p className="mb-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-100">
                    <span className="font-medium text-gray-800">Selected: </span>
                    {location.trim() || '—'}
                    {locationLat != null && locationLng != null ? (
                      <span className="mt-1 block text-gray-500 tabular-nums">
                        {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <LocationSelectorRow
                  id="reg-coverage-search"
                  value={location}
                  onChange={(v) => {
                    setLocation(v)
                    patchField('location', v)
                  }}
                  onPlaceResolved={onCoveragePlaceResolved}
                  onOpenMap={() => setCoverageMapOpen(true)}
                  placeholder="Type to search (Mapbox) or enter then pick on map"
                  mapButtonLabel="Pick on map"
                />
                {fieldErrors.location ? <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="reg-avatar">
                  Profile photo (optional)
                </label>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="mb-2 h-20 w-20 rounded-full object-cover ring-2 ring-border-subtle"
                  />
                ) : null}
                <input
                  id="reg-avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setAvatarFile(f)
                    patchField('avatar', f)
                    setAvatarPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return f ? URL.createObjectURL(f) : ''
                    })
                  }}
                />
                {fieldErrors.avatar ? <p className="mt-1 text-xs text-red-600">{fieldErrors.avatar}</p> : null}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">Qualification</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Degree</label>
                <input
                  className={inputClass('degree')}
                  value={degree}
                  onChange={(e) => {
                    const v = e.target.value
                    setDegree(v)
                    patchField('degree', v)
                  }}
                />
                {fieldErrors.degree ? <p className="mt-1 text-xs text-red-600">{fieldErrors.degree}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">University</label>
                <input
                  className={inputClass('university')}
                  value={university}
                  onChange={(e) => {
                    const v = e.target.value
                    setUniversity(v)
                    patchField('university', v)
                  }}
                />
                {fieldErrors.university ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.university}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Year</label>
                <input
                  className={inputClass('year')}
                  type="number"
                  value={year}
                  onChange={(e) => {
                    const v = e.target.value
                    setYear(v)
                    patchField('year', v)
                  }}
                />
                {fieldErrors.year ? <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Registration number</label>
                <input
                  className={inputClass('registrationNumber')}
                  value={registrationNumber}
                  onChange={(e) => {
                    const v = e.target.value
                    setRegistrationNumber(v)
                    patchField('registrationNumber', v)
                  }}
                />
                {fieldErrors.registrationNumber ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.registrationNumber}</p>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">Practice details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Experience (years)</label>
                <input
                  className={inputClass('experience')}
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => {
                    const v = e.target.value
                    setExperience(v)
                    patchField('experience', v)
                  }}
                />
                {fieldErrors.experience ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.experience}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Specialization</label>
                <input
                  className={inputClass('specialization')}
                  value={specialization}
                  onChange={(e) => {
                    const v = e.target.value
                    setSpecialization(v)
                    patchField('specialization', v)
                  }}
                />
                {fieldErrors.specialization ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Service type</label>
                <select
                  className={inputClass('serviceType')}
                  value={serviceType}
                  onChange={(e) => {
                    const v = e.target.value
                    setServiceType(v)
                    patchField('serviceType', v)
                  }}
                >
                  <option value="online">Online</option>
                  <option value="home">Home visit</option>
                  <option value="both">Both</option>
                </select>
                {fieldErrors.serviceType ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.serviceType}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Areas (comma-separated)</label>
                <input
                  className={inputClass('areas')}
                  value={areas}
                  onChange={(e) => {
                    const v = e.target.value
                    setAreas(v)
                    patchField('areas', v)
                  }}
                  placeholder="e.g. Indiranagar, Koramangala"
                />
                {fieldErrors.areas ? <p className="mt-1 text-xs text-red-600">{fieldErrors.areas}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Fee per session (₹)</label>
                <input
                  className={inputClass('fees')}
                  type="number"
                  min="0"
                  value={fees}
                  onChange={(e) => {
                    const v = e.target.value
                    setFees(v)
                    patchField('fees', v)
                  }}
                />
                {fieldErrors.fees ? <p className="mt-1 text-xs text-red-600">{fieldErrors.fees}</p> : null}
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">Documents</h2>
            <p className="mt-1 text-sm text-ink-muted">
              PDF or images (max 2MB each). All four identity documents are required
              {ndaPolicy.requireSignedNda ? ', plus a signed non-disclosure agreement.' : '.'}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DocumentUploadPreview
                label="Qualification certificate"
                file={fCertificate}
                serverUrl=""
                error={fieldErrors.certificate}
                inputId="reg-doc-cert"
                showServerHint={false}
                onFileChange={(f) => {
                  setFCertificate(f)
                  patchField('certificate', f)
                }}
              />
              <DocumentUploadPreview
                label="ID proof"
                file={fIdProof}
                serverUrl=""
                error={fieldErrors.idProof}
                inputId="reg-doc-id"
                showServerHint={false}
                onFileChange={(f) => {
                  setFIdProof(f)
                  patchField('idProof', f)
                }}
              />
              <DocumentUploadPreview
                label="Registration certificate"
                file={fRegCert}
                serverUrl=""
                error={fieldErrors.registrationCertificate}
                inputId="reg-doc-reg"
                showServerHint={false}
                onFileChange={(f) => {
                  setFRegCert(f)
                  patchField('registrationCertificate', f)
                }}
              />
              <DocumentUploadPreview
                label="Selfie with ID"
                file={fSelfie}
                serverUrl=""
                error={fieldErrors.selfieWithId}
                inputId="reg-doc-selfie"
                showServerHint={false}
                onFileChange={(f) => {
                  setFSelfie(f)
                  patchField('selfieWithId', f)
                }}
              />
            </div>
            {ndaPolicy.requireSignedNda && ndaPolicy.templateUrl ? (
              <div className="mt-6 rounded-xl border border-border-subtle bg-canvas/40 p-4">
                <h3 className="text-sm font-semibold text-ink">Non-disclosure agreement</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Download the template, sign it, then upload a scan or photo of the signed document (PDF or image, max
                  2MB).
                </p>
                <p className="mt-2">
                  <a
                    href={resolveFileUrl(ndaPolicy.templateUrl)}
                    download={ndaPolicy.originalName || 'physio-nda-template'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-brand underline"
                  >
                    Download NDA template
                  </a>
                  {ndaPolicy.originalName ? (
                    <span className="ml-2 text-xs text-ink-muted">({ndaPolicy.originalName})</span>
                  ) : null}
                </p>
                <div className="mt-3">
                  <DocumentUploadPreview
                    label="Signed NDA (required)"
                    file={fSignedNda}
                    serverUrl=""
                    error={fieldErrors.signedNda}
                    inputId="reg-doc-nda"
                    showServerHint={false}
                    onFileChange={(f) => {
                      setFSignedNda(f)
                      patchField('signedNda', f)
                    }}
                  />
                </div>
              </div>
            ) : null}
            {fieldErrors.file ? <p className="mt-2 text-sm text-red-600">{fieldErrors.file}</p> : null}
          </section>
        )}

        {step === 5 && (
          <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">Review & submit</h2>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Phone</dt>
                <dd className="text-right font-medium text-ink">{normalizeIndianPhone(phone) || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Name</dt>
                <dd className="text-right font-medium text-ink">{name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Email</dt>
                <dd className="text-right font-medium text-ink">{email}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Specialization</dt>
                <dd className="text-right font-medium text-ink">{specialization}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Experience</dt>
                <dd className="text-right font-medium text-ink">{experience} yrs</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Fee / session</dt>
                <dd className="text-right font-medium text-ink">₹{fees || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Coverage (map)</dt>
                <dd className="text-right font-medium text-ink">
                  {locationLat != null && locationLng != null
                    ? `${locationLat.toFixed(5)}, ${locationLng.toFixed(5)}`
                    : '—'}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-ink-muted">
              Submitting creates your account in <strong>pending</strong> status until an admin approves you.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? 'Submitting…' : 'Submit application'}
            </button>
          </section>
        )}

        <MapPickerModal
          open={coverageMapOpen}
          initialLat={locationLat}
          initialLng={locationLng}
          onClose={() => setCoverageMapOpen(false)}
          onConfirm={async (coords) => {
            await applyCoverageMapCoords(coords)
            setCoverageMapOpen(false)
            toast.success('Coverage location selected')
          }}
        />

        {step < 5 && (
          <div className="flex justify-end gap-3">
            {step > 1 && (
              <button
                type="button"
                className="rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium text-ink-muted hover:bg-canvas"
                onClick={() => {
                  setStep((s) => Math.max(1, s - 1))
                  clearErrors()
                }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => goNext(step)}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
            >
              {saving ? 'Checking…' : step === 4 ? 'Continue to review' : 'Save & continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
