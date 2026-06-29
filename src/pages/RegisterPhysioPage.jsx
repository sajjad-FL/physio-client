import { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import DocumentUploadPreview from '../components/physio/DocumentUploadPreview'
import DocumentMultiUploadPreview from '../components/physio/DocumentMultiUploadPreview'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'
import { toastApiError, toastValidationErrors, firstValidationMessage } from '../utils/formToast'
import PasswordInput from '../components/ui/PasswordInput'
import AffixInput from '../components/ui/AffixInput'
import MapPickerModal from '../components/location/MapPickerModal'
import { getCurrentCoords } from '../utils/geolocation'
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
import { PHYSIO_DEGREE_OPTIONS, isPhysioDegreeOption } from '../constants/physioQualification.js'
import { ID_PROOF_TYPE_OPTIONS } from '../constants/idProofTypes.js'
import { absoluteUrl } from '../utils/siteMeta'

const baseInputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

const steps = [
  { n: 1, title: 'Account & basic', desc: 'Sign-in, contact, profile' },
  { n: 2, title: 'Qualification', desc: 'Education & registration' },
  { n: 3, title: 'Practice', desc: 'Services and fees' },
  { n: 4, title: 'Documents', desc: 'Required uploads' },
  { n: 5, title: 'Review', desc: 'Submit application' },
]

/** Per-step hero copy — mirrors the create-account flow (kicker + title + subtitle). */
const STEP_HERO = {
  1: { title: 'Create your account', sub: 'Your sign-in, contact and basic profile.' },
  2: { title: 'Your qualification', sub: 'Education and registration details.' },
  3: { title: 'Your practice', sub: 'Services you offer and your fees.' },
  4: { title: 'Upload documents', sub: 'Attach your certificates and ID proof.' },
  5: { title: 'Review & submit', sub: 'Check everything before you submit.' },
}

function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="text-red-500" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  )
}

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
  const [location, setLocation] = useState('')
  const [locationLat, setLocationLat] = useState(null)
  const [locationLng, setLocationLng] = useState(null)
  const [coverageMapOpen, setCoverageMapOpen] = useState(false)
  const [geoBusy, setGeoBusy] = useState(false)
  const avatarInputRef = useRef(null)
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

  const [fCertificate, setFCertificate] = useState(null)
  const [fIdProof, setFIdProof] = useState(null)
  const [fRegCert, setFRegCert] = useState(null)
  const [fSelfie, setFSelfie] = useState(null)
  const [fInternships, setFInternships] = useState([])
  const [idProofType, setIdProofType] = useState('')
  const [qualificationAgreed, setQualificationAgreed] = useState(false)

  const [ndaPolicy, setNdaPolicy] = useState({
    requireSignedNda: false,
    requireQualificationDeclaration: true,
    declarationText: '',
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
          requiredGender: true,
          optionalSpecialization: true,
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
          requireSignedNda: false,
          requireQualificationDeclaration: data.requireQualificationDeclaration !== false,
          declarationText: data.declarationText || '',
          templateUrl: '',
          originalName: '',
        })
      } catch {
        if (!cancelled) {
          setNdaPolicy({
            requireSignedNda: false,
            requireQualificationDeclaration: true,
            declarationText: '',
            templateUrl: '',
            originalName: '',
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function useDeviceCoverageLocation() {
    setGeoBusy(true)
    try {
      const coords = await getCurrentCoords()
      await applyCoverageMapCoords(coords)
      toast.success('Coverage location set from GPS')
    } catch (err) {
      toast.error(err?.userMessage || 'Could not read your location.')
    } finally {
      setGeoBusy(false)
    }
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

  function computeAccountBasicErrors() {
    const e1 = validateRegistrationAccount({ phone, password }).errors
    const e2 = validateBasicSection({
      name,
      email,
      location,
      dob,
      gender,
    }).errors
    const merged = { ...e1, ...e2 }
    if (!avatarFile) {
      merged.avatar = 'Profile photo is required'
    } else {
      const av = validateAvatarFile(avatarFile)
      if (!av.ok) merged.avatar = av.message
    }
    if (locationLat == null || locationLng == null) {
      merged.location =
        merged.location ||
        'Please tap “Pick on map” or “Use GPS” to set where you work.'
    }
    return merged
  }

  function tryGoToStep(targetStep) {
    if (targetStep === step) return
    if (targetStep > 1 && targetStep > step) {
      const merged = computeAccountBasicErrors()
      if (Object.keys(merged).length) {
        setFieldErrors(merged)
        const summary = firstValidationMessage(merged, 'Please finish your account and profile details.')
        setFormError(summary)
        toastValidationErrors(merged, summary)
        return
      }
    }
    setStep(targetStep)
    clearErrors()
  }

  async function goNext(fromStep) {
    clearErrors()
    setSaving(true)
    try {
      if (fromStep === 1) {
        const merged = computeAccountBasicErrors()
        if (Object.keys(merged).length) {
          setFieldErrors(merged)
          const summary = firstValidationMessage(merged, 'Please finish your account and profile details.')
          setFormError(summary)
          toastValidationErrors(merged, summary)
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
          const summary = firstValidationMessage(errors, 'Please complete your qualification details.')
          setFormError(summary)
          toastValidationErrors(errors, summary)
          return
        }
      }

      if (fromStep === 3) {
        const { errors } = validatePracticeSection(
          {
            experience,
            specialization,
            serviceType,
            areas,
          },
          { specializationOptional: true },
        )
        if (Object.keys(errors).length) {
          setFieldErrors(errors)
          const summary = firstValidationMessage(errors, 'Please complete your practice details.')
          setFormError(summary)
          toastValidationErrors(errors, summary)
          return
        }
      }

      if (fromStep === 4) {
        const { errors, ok } = validateDocumentsStep(
          { fCertificate, fIdProof, fRegCert, fSelfie, fInternships },
          { certificate: '', idProof: '', registration: '', selfie: '' },
          {
            requireQualificationDeclaration: ndaPolicy.requireQualificationDeclaration,
            declarationAccepted: qualificationAgreed,
            idProofType,
          },
        )
        if (!ok) {
          setFieldErrors(errors)
          const summary = firstValidationMessage(errors, 'Please upload all required documents.')
          setFormError(summary)
          toastValidationErrors(errors, summary)
          return
        }
        for (const file of fInternships) {
          const r = validateFile(file, 'Internship certificate')
          if (!r.ok) {
            setFieldErrors({ file: r.message })
            setFormError(r.message)
            toastValidationErrors({ file: r.message }, r.message)
            return
          }
        }
        for (const [file, label] of [
          [fCertificate, 'Qualification certificate'],
          [fIdProof, 'ID proof'],
          [fRegCert, 'Registration certificate'],
          [fSelfie, 'Selfie with ID'],
        ]) {
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
      // Guard: required files must be selected before we build FormData
      const missingFiles = {}
      if (!avatarFile) missingFiles.avatar = 'Profile photo is required'
      if (!fCertificate) missingFiles.certificate = 'BPT/MPT pass certificate is required'
      if (!fInternships.length) missingFiles.internshipCertificate = 'Upload at least one internship certificate'
      if (!fIdProof) missingFiles.idProof = 'GOVERNMENT ID is required'
      if (!fSelfie) missingFiles.selfieWithId = 'Selfie with ID is required'
      if (Object.keys(missingFiles).length) {
        setFieldErrors(missingFiles)
        const summary = firstValidationMessage(missingFiles, 'Please complete all required fields and uploads.')
        setFormError(summary)
        toastValidationErrors(missingFiles, summary)
        setSaving(false)
        return
      }

      const fd = new FormData()
      fd.append('phone', normalizeIndianPhone(phone))
      fd.append('password', password)
      fd.append('name', name.trim())
      fd.append('email', email.trim().toLowerCase())
      fd.append('dob', dob)
      fd.append('gender', gender)
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

      fd.append('avatar', avatarFile)
      if (fCertificate) fd.append('certificate', fCertificate)
      if (fIdProof) fd.append('idProof', fIdProof)
      fd.append('idProofType', String(idProofType).trim().toLowerCase())
      if (fRegCert) fd.append('registrationCertificate', fRegCert)
      if (fSelfie) fd.append('selfieWithId', fSelfie)
      for (const file of fInternships) fd.append('internshipCertificate', file)
      if (ndaPolicy.requireQualificationDeclaration !== false && !qualificationAgreed) {
        setFormError('Confirm the qualification declaration')
        toast.error('Confirm the qualification declaration')
        return
      }
      fd.append('qualificationDeclaration', qualificationAgreed ? 'true' : 'false')

      // Let the browser set Content-Type: multipart/form-data with the correct boundary automatically
      await api.post('/auth/register-physio', fd)
      toast.success('Application submitted. Sign in with email & password after an admin approves you.')
      navigate('/login', { replace: true })
    } catch (e) {
      const data = e.response?.data
      const apiErrors =
        data?.errors && typeof data.errors === 'object'
          ? data.errors
          : data && typeof data === 'object'
            ? Object.fromEntries(
                Object.entries(data).filter(
                  ([key, value]) => key !== 'message' && typeof value === 'string' && value.trim(),
                ),
              )
            : {}
      if (Object.keys(apiErrors).length) {
        const { feeMin, feeMax, ...rest } = apiErrors
        setFieldErrors(rest)
        setFormError(data?.message || 'Please fix the errors below')
        toastValidationErrors(rest, data?.message || 'Please fix the errors')
        if (feeMin) {
          toast.error('Production server still requires fee per session — deploy the latest physio-server.')
        }
      } else {
        toastApiError(e, data?.message || 'Registration failed')
      }
    } finally {
      setSaving(false)
    }
  }

  const title = 'Register as a physiotherapist — PhysiOkhom'
  const description =
    'Apply to join PhysiOkhom as a verified home-visit physiotherapist. Submit your qualifications and documents for admin review.'
  const canonical = absoluteUrl('/register-physio')
  const ogImage = absoluteUrl('/og-default.png')

  return (
    <div className="relative min-h-screen bg-slate-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      {/* Ambient teal halo glows — matching the create-account flow */}
      <div className="pointer-events-none absolute inset-x-0 top-[-120px] h-[240px] sm:h-[380px] rounded-[190px] bg-[rgba(162,240,239,0.15)]" aria-hidden />
      <div className="pointer-events-none absolute left-[20%] top-[-50px] h-[140px] sm:h-[200px] w-[60%] rounded-[100px] bg-[rgba(13,107,107,0.04)]" aria-hidden />
      <header className="relative z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep((s) => Math.max(1, s - 1))
                clearErrors()
              } else {
                navigate('/')
              }
            }}
            className="flex items-center gap-1.5 text-[15px] font-semibold text-teal-700 hover:opacity-80"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6"/></svg>
            {step > 1 ? 'Back' : 'PhysiOkhom'}
          </button>
          <Link to="/login" className="text-sm font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl space-y-8 px-4 py-10">
        {/* Step progress dots — matching the create-account flow */}
        <ol className="flex items-center">
          {steps.map((s, idx) => {
            const isDone = step > s.n
            const isActive = step === s.n
            return (
              <li key={s.n} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => tryGoToStep(s.n)}
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[10px] font-bold transition-all',
                    isDone
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : isActive
                        ? 'border-teal-600 bg-teal-600/10 text-teal-700 shadow-[0_0_0_4px_rgba(13,148,136,0.10)]'
                        : 'border-slate-200 bg-white text-slate-400',
                  ].join(' ')}
                  aria-label={`Step ${s.n}: ${s.title}`}
                >
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    s.n
                  )}
                </button>
                {idx < steps.length - 1 && (
                  <div className={`mx-1.5 h-[1.5px] flex-1 transition-colors ${isDone ? 'bg-teal-600' : 'bg-slate-200'}`} />
                )}
              </li>
            )
          })}
        </ol>

        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Physio registration</p>
          <h1 className="type-hero text-slate-900">{STEP_HERO[step].title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{STEP_HERO[step].sub}</p>
        </div>

        <ErrorBanner formError={formError} fieldErrors={fieldErrors} />

        {step === 1 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
            <h2 className="type-page-title text-ink">Account & basic info</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-name" required>
                  Full name
                </FieldLabel>
                <AffixInput
                  id="reg-name"
                  error={Boolean(fieldErrors.name)}
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value
                    setName(v)
                    patchField('name', v)
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-phone" required>
                  Phone (for account)
                </FieldLabel>
                <input
                  id="reg-phone"
                  className={inputClass('phone')}
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value
                    setPhone(v)
                    patchField('phone', v)
                  }}
                  placeholder="Enter mobile number"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-password" required>
                  Password (min 6)
                </FieldLabel>
                <PasswordInput
                  id="reg-password"
                  className={inputClass('password')}
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value
                    setPassword(v)
                    patchField('password', v)
                  }}
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
                {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-email" required>
                  Email
                </FieldLabel>
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
                  placeholder="Enter email address"
                  autoComplete="email"
                />
                {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-dob" required>
                  Date of birth
                </FieldLabel>
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
                <FieldLabel htmlFor="reg-gender" required>
                  Gender
                </FieldLabel>
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
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel required>Coverage / location (required for bookings)</FieldLabel>
                <p className="mb-2 text-xs text-ink-muted">
                  Set your work area using the map or GPS — you cannot type a location manually. Coordinates are saved
                  so patients can find you nearby.
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected coverage area</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {location.trim() || (locationLat != null ? 'Location pinned' : 'None selected yet')}
                  </p>
                  {locationLat != null && locationLng != null ? (
                    <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                      {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setCoverageMapOpen(true)}
                    disabled={geoBusy}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Pick on map
                  </button>
                  <button
                    type="button"
                    onClick={useDeviceCoverageLocation}
                    disabled={geoBusy}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-medium text-teal-700 shadow-sm transition hover:bg-teal-100 disabled:opacity-50"
                  >
                    {geoBusy ? 'Locating…' : 'Use GPS'}
                  </button>
                </div>
                {fieldErrors.location ? <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-avatar" required>
                  Passport size photo with clear background
                </FieldLabel>
                <p className="mb-2 text-xs text-ink-muted">JPEG, PNG, or WebP · max 2MB</p>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="mb-3 h-20 w-20 rounded-full object-cover ring-2 ring-border-subtle"
                  />
                ) : null}
                <input
                  ref={avatarInputRef}
                  id="reg-avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    e.target.value = ''
                    if (!f) return
                    const r = validateAvatarFile(f)
                    if (!r.ok) {
                      toast.error(r.message)
                      return
                    }
                    setAvatarFile(f)
                    patchField('avatar', f)
                    setAvatarPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return URL.createObjectURL(f)
                    })
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Choose photo
                </button>
                {fieldErrors.avatar ? <p className="mt-1 text-xs text-red-600">{fieldErrors.avatar}</p> : null}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
            <h2 className="type-page-title text-ink">Qualification</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-degree" required>
                  Degree
                </FieldLabel>
                <select
                  id="reg-degree"
                  className={inputClass('degree')}
                  value={degree}
                  onChange={(e) => {
                    const v = e.target.value
                    setDegree(v)
                    patchField('degree', v)
                  }}
                >
                  <option value="">Select degree</option>
                  {PHYSIO_DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  {degree && !isPhysioDegreeOption(degree) ? (
                    <option value={degree}>{degree}</option>
                  ) : null}
                </select>
                {fieldErrors.degree ? <p className="mt-1 text-xs text-red-600">{fieldErrors.degree}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-university" required>
                  University
                </FieldLabel>
                <input
                  id="reg-university"
                  className={inputClass('university')}
                  value={university}
                  onChange={(e) => {
                    const v = e.target.value
                    setUniversity(v)
                    patchField('university', v)
                  }}
                  placeholder="Enter university name"
                />
                {fieldErrors.university ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.university}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-passing-year" required>
                  Passing Year
                </FieldLabel>
                <input
                  id="reg-passing-year"
                  className={inputClass('year')}
                  type="number"
                  value={year}
                  onChange={(e) => {
                    const v = e.target.value
                    setYear(v)
                    patchField('year', v)
                  }}
                  placeholder="e.g. 2020"
                />
                {fieldErrors.year ? <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="reg-council-reg">Council Registration No (if applicable)</FieldLabel>
                <input
                  id="reg-council-reg"
                  className={inputClass('registrationNumber')}
                  value={registrationNumber}
                  onChange={(e) => {
                    const v = e.target.value
                    setRegistrationNumber(v)
                    patchField('registrationNumber', v)
                  }}
                  placeholder="Enter council registration number"
                />
                {fieldErrors.registrationNumber ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.registrationNumber}</p>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
            <h2 className="type-page-title text-ink">Practice details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-experience" required>
                  Experience (years)
                </FieldLabel>
                <input
                  id="reg-experience"
                  className={inputClass('experience')}
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => {
                    const v = e.target.value
                    setExperience(v)
                    patchField('experience', v)
                  }}
                  placeholder="Years of experience"
                />
                {fieldErrors.experience ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.experience}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-service-type" required>
                  Service type
                </FieldLabel>
                <select
                  id="reg-service-type"
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
                <FieldLabel htmlFor="reg-areas" required>
                  Areas (comma-separated)
                </FieldLabel>
                <input
                  id="reg-areas"
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
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="reg-specialization">Specialization (if any)</FieldLabel>
                <input
                  id="reg-specialization"
                  className={inputClass('specialization')}
                  value={specialization}
                  onChange={(e) => {
                    const v = e.target.value
                    setSpecialization(v)
                    patchField('specialization', v)
                  }}
                  placeholder="e.g. Sports rehab, Orthopaedic"
                />
                {fieldErrors.specialization ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
            <h2 className="type-page-title text-ink">Documents</h2>
            <p className="mt-1 text-sm text-ink-muted">
              PDF or images (max 2MB each). Fields marked with <span className="text-red-500">*</span> are required.
              Professional registration is optional but helps verification.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DocumentUploadPreview
                label="Qualification certificate"
                description="Degree or final marksheet from your university."
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
                label="Government ID"
                description="Clear photo or scan of the same ID you will show in your selfie."
                file={fIdProof}
                serverUrl=""
                error={fieldErrors.idProof || fieldErrors.idProofType}
                inputId="reg-doc-id"
                showServerHint={false}
                onFileChange={(f) => {
                  setFIdProof(f)
                  patchField('idProof', f)
                }}
              >
                <div>
                  <FieldLabel htmlFor="reg-id-proof-type" required>
                    ID type
                  </FieldLabel>
                  <select
                    id="reg-id-proof-type"
                    className={inputClass('idProofType')}
                    value={idProofType}
                    onChange={(e) => {
                      const v = e.target.value
                      setIdProofType(v)
                      patchField('idProofType', v)
                      setFieldErrors((prev) => ({ ...prev, idProofType: '' }))
                    }}
                  >
                    <option value="">Select type…</option>
                    {ID_PROOF_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </DocumentUploadPreview>
              <DocumentUploadPreview
                required={false}
                label="Professional / council registration"
                description="State council or equivalent registration document."
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
                description="Your face visible next to the same government ID."
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
              <DocumentMultiUploadPreview
                label="Internship certificate"
                description="Upload one or more certificates from your completed internship(s)."
                files={fInternships}
                serverUrls={[]}
                error={fieldErrors.internshipCertificate}
                inputId="reg-doc-internship"
                showServerHint={false}
                onFilesChange={(next) => {
                  setFInternships(next)
                  patchField('internshipCertificate', next)
                }}
              />
            </div>
            <div className="mt-6 rounded-xl border border-border-subtle bg-canvas/40 p-4">
              <h3 className="text-sm font-semibold text-ink">Qualification declaration</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {ndaPolicy.declarationText ||
                  'I confirm that all qualifications and documents I submit to PhysiOkhom are accurate. Misrepresentation may result in removal from the platform and legal consequences.'}
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={qualificationAgreed}
                  onChange={(e) => {
                    setQualificationAgreed(e.target.checked)
                    setFieldErrors((prev) => ({ ...prev, qualificationDeclaration: '' }))
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  I have read and agree to the declaration above.
                  <span className="text-red-500" aria-hidden="true">
                    {' '}
                    *
                  </span>
                </span>
              </label>
              {fieldErrors.qualificationDeclaration ? (
                <p className="mt-2 text-xs text-red-600">{fieldErrors.qualificationDeclaration}</p>
              ) : null}
            </div>
            {fieldErrors.file ? <p className="mt-2 text-sm text-red-600">{fieldErrors.file}</p> : null}
          </section>
        )}

        {step === 5 && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:p-8">
            <h2 className="type-page-title text-ink">Review & submit</h2>
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
                <dd className="text-right font-medium text-ink">{specialization || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
                <dt className="text-ink-muted">Experience</dt>
                <dd className="text-right font-medium text-ink">{experience} yrs</dd>
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
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  setStep(4)
                  clearErrors()
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
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
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Checking…' : step === 4 ? 'Continue to review' : 'Save & continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
