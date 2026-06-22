import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { resolveFileUrl } from '../../utils/serverOrigin'
import DocumentUploadPreview from '../../components/physio/DocumentUploadPreview'
import { toastApiError, toastSaved, toastValidationErrors } from '../../utils/formToast'
import {
  validateAvatarFile,
  validateBasicSection,
  validateDocumentsStep,
  validateFile,
  validatePracticeSection,
  validateQualificationSection,
  validateSubmitForm,
} from '../../utils/onboardingValidation'
import { validateLiveField } from '../../utils/liveFieldValidation'
import { PHYSIO_DEGREE_OPTIONS, isPhysioDegreeOption } from '../../constants/physioQualification.js'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'
import { ID_PROOF_TYPE_OPTIONS } from '../../constants/idProofTypes.js'

const baseInputClass =
  'h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink shadow-sm outline-none focus:ring-2 focus:ring-brand/20'

const steps = [
  { n: 1, title: 'Basic info', desc: 'Contact and profile' },
  { n: 2, title: 'Qualification', desc: 'Education & registration' },
  { n: 3, title: 'Practice', desc: 'Services and fees' },
  { n: 4, title: 'Documents', desc: 'Uploads (S3 or local)' },
  { n: 5, title: 'Submit', desc: 'Review and send for verification' },
]

function dobInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
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

export default function PhysioOnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')
  const [location, setLocation] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')

  const [degree, setDegree] = useState('')
  const [university, setUniversity] = useState('')
  const [year, setYear] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')

  const [experience, setExperience] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [serviceType, setServiceType] = useState('both')
  const [areas, setAreas] = useState('')
  const [feeMin, setFeeMin] = useState('')

  const [fCertificate, setFCertificate] = useState(null)
  const [fIdProof, setFIdProof] = useState(null)
  const [fRegCert, setFRegCert] = useState(null)
  const [fSelfie, setFSelfie] = useState(null)
  const [fInternship, setFInternship] = useState(null)
  const [fCouncil, setFCouncil] = useState(null)
  const [idProofType, setIdProofType] = useState('')
  const [qualificationAgreed, setQualificationAgreed] = useState(false)
  const [qualificationDeclarationAcceptedAt, setQualificationDeclarationAcceptedAt] = useState(null)

  const [ndaPolicy, setNdaPolicy] = useState({
    requireSignedNda: false,
    requireQualificationDeclaration: true,
    declarationText: '',
    templateUrl: '',
    originalName: '',
  })

  const [docUrls, setDocUrls] = useState({
    certificate: '',
    idProof: '',
    registration: '',
    selfie: '',
    internship: '',
    council: '',
  })

  const [vStatus, setVStatus] = useState('pending')
  const [vReason, setVReason] = useState('')
  const [onboardingLocked, setOnboardingLocked] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  const clearErrors = () => {
    setFieldErrors({})
    setFormError('')
  }

  const patchField = useCallback((name, value, extra = {}) => {
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateLiveField(name, value, {
        mode: 'physio',
        isPhysio: true,
        requireCoords: false,
        ...extra,
      }),
    }))
  }, [])

  const inputClass = (name) =>
    [
      baseInputClass,
      fieldErrors[name]
        ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500'
        : 'border-border-subtle focus:border-brand',
    ].join(' ')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/physio/onboarding')
      setName(data.name || '')
      setEmail(data.email || '')
      setDob(dobInputValue(data.dob))
      setGender(data.gender || '')
      setAddress(data.address || '')
      setLocation(data.location || '')
      setAvatarUrl(data.avatar || '')
      setDegree(data.qualification?.degree || '')
      setUniversity(data.qualification?.university || '')
      setYear(data.qualification?.year != null ? String(data.qualification.year) : '')
      setRegistrationNumber(data.qualification?.registrationNumber || '')
      setExperience(data.experience != null ? String(data.experience) : '')
      setSpecialization(data.specialization || '')
      setServiceType(data.serviceType || 'both')
      setAreas((data.serviceAreas || []).join(', '))
      setFeeMin(data.pricePerSession != null ? String(data.pricePerSession) : '')
      setStep(Math.min(5, Math.max(1, data.onboarding?.currentStep || 1)))
      setVStatus(data.verification?.status || 'pending')
      setVReason(data.verification?.rejectionReason || '')
      const apiLocked = data.onboardingLocked
      setOnboardingLocked(
        apiLocked === true ||
          (apiLocked == null &&
            (data.verificationStatus === 'approved' ||
              data.verification?.status === 'verified' ||
              data.verification?.level === 'verified')),
      )
      setNdaPolicy(
        data.ndaPolicy || {
          requireSignedNda: false,
          requireQualificationDeclaration: true,
          declarationText: '',
          templateUrl: '',
          originalName: '',
        },
      )
      setQualificationDeclarationAcceptedAt(data.qualificationDeclarationAcceptedAt || null)
      setQualificationAgreed(Boolean(data.qualificationDeclarationAcceptedAt))
      setDocUrls({
        certificate: data.qualification?.certificateUrl || '',
        idProof: data.documentUrls?.idProof || '',
        registration: data.documentUrls?.registrationCertificate || '',
        selfie: data.documentUrls?.selfieWithId || '',
        internship: data.documentUrls?.internshipCertificate || '',
        council: data.documentUrls?.councilRegistrationCertificate || '',
      })
      setIdProofType(String(data.documentUrls?.idProofType || '').trim().toLowerCase())
    } catch (e) {
      toastApiError(e, 'Could not load your profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function uploadFilesPartial(formExtra) {
    const fd = new FormData()
    if (formExtra.avatar) fd.append('avatar', formExtra.avatar)
    if (formExtra.certificate) fd.append('certificate', formExtra.certificate)
    if (formExtra.idProof) fd.append('idProof', formExtra.idProof)
    if (formExtra.registrationCertificate) fd.append('registrationCertificate', formExtra.registrationCertificate)
    if (formExtra.selfieWithId) fd.append('selfieWithId', formExtra.selfieWithId)
    if (formExtra.internshipCertificate) fd.append('internshipCertificate', formExtra.internshipCertificate)
    if (formExtra.councilRegistrationCertificate) {
      fd.append('councilRegistrationCertificate', formExtra.councilRegistrationCertificate)
    }
    if ([...fd.keys()].length === 0) return
    await api.post('/physio/onboarding/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async function goNext(fromStep) {
    if (onboardingLocked) return
    clearErrors()
    setSaving(true)
    try {
      if (fromStep === 1) {
        const { errors } = validateBasicSection({
          name,
          email,
          location,
          dob: dob || undefined,
          gender,
          address,
        })
        if (avatarFile) {
          const av = validateAvatarFile(avatarFile)
          if (!av.ok) {
            setFieldErrors({ avatar: av.message })
            setFormError(av.message)
            toastValidationErrors({ avatar: av.message }, av.message)
            return
          }
        }
        if (Object.keys(errors).length) {
          setFieldErrors(errors)
          setFormError('Fix the errors below before continuing')
          toastValidationErrors(errors, 'Fix the errors below before continuing')
          return
        }
        if (avatarFile) {
          await uploadFilesPartial({ avatar: avatarFile })
          setAvatarFile(null)
          await load()
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
          feeMin,
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
          { fCertificate, fIdProof, fRegCert, fSelfie, fInternship, fCouncil },
          {
            certificate: docUrls.certificate,
            idProof: docUrls.idProof,
            registration: docUrls.registration,
            selfie: docUrls.selfie,
          },
          {
            requireQualificationDeclaration: ndaPolicy.requireQualificationDeclaration,
            declarationAccepted: qualificationAgreed,
            idProofType,
          },
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
          [fInternship, 'Internship certificate'],
          [fCouncil, 'Council registration certificate'],
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

        await uploadFilesPartial({
          certificate: fCertificate || undefined,
          idProof: fIdProof || undefined,
          registrationCertificate: fRegCert || undefined,
          selfieWithId: fSelfie || undefined,
          internshipCertificate: fInternship || undefined,
          councilRegistrationCertificate: fCouncil || undefined,
        })
        setFCertificate(null)
        setFIdProof(null)
        setFRegCert(null)
        setFSelfie(null)
        setFInternship(null)
        setFCouncil(null)
        await load()
      }

      const next = Math.min(5, fromStep + 1)
      const patch = { step: next }
      if (fromStep === 4) {
        patch.idProofType = String(idProofType).trim().toLowerCase()
        if (qualificationAgreed) patch.qualificationDeclarationAccepted = true
      }

      if (fromStep === 1) {
        patch.basic = {
          name,
          email,
          dob: dob || undefined,
          gender,
          address,
          location,
        }
      }
      if (fromStep === 2) {
        patch.qualification = {
          degree,
          university,
          year: year || undefined,
          registrationNumber,
        }
      }
      if (fromStep === 3) {
        patch.practice = {
          experience,
          specialization,
          serviceType,
          areas,
          feeMin,
        }
      }

      if (fromStep < 5) {
        await api.patch('/physio/onboarding', patch)
        setStep(next)
        clearErrors()
        toastSaved('Progress saved')
        await load()
      }
    } catch (e) {
      const { message, errors } = toastApiError(e, 'Could not save — check your connection and try again')
      setFormError(message)
      if (errors) setFieldErrors(errors)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (onboardingLocked) return
    clearErrors()
    setSaving(true)
    try {
      const submitValues = {
        name,
        email,
        location,
        dob,
        gender,
        address,
        degree,
        university,
        year,
        registrationNumber,
        experience,
        specialization,
        serviceType,
        areas,
        feeMin,
        docCertificate: docUrls.certificate,
        docIdProof: docUrls.idProof,
        docRegistration: docUrls.registration,
        docSelfie: docUrls.selfie,
        idProofType,
        docSignedNda: '',
        requireSignedNda: false,
        requireQualificationDeclaration: ndaPolicy.requireQualificationDeclaration,
        qualificationDeclarationAcceptedAt,
      }
      const { errors, ok } = validateSubmitForm(submitValues)
      if (!ok) {
        setFieldErrors(errors)
        const headline = 'Complete every section and upload all documents before submitting'
        setFormError(headline)
        toastValidationErrors(errors, headline)
        return
      }

      await api.post('/physio/onboarding/submit')
      clearErrors()
      toastSaved('Application submitted for review')
      await load()
      setStep(5)
    } catch (e) {
      const { message, errors } = toastApiError(e, 'Could not submit — try again or contact support')
      setFormError(message)
      if (errors) setFieldErrors(errors)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-brand"
          aria-hidden
        />
        <p className="text-sm text-ink-muted">Loading onboarding…</p>
      </div>
    )
  }

  if (onboardingLocked) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-6 ring-1 ring-emerald-100/80">
          <h1 className="type-page-title text-ink">Profile verified</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Your account has been verified. Onboarding is closed — you cannot change these steps or submit again. Update
            your photo, address, and account details from{' '}
            <Link to="/profile" className="font-semibold text-brand underline-offset-2 hover:underline">
              Profile
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Verification: <span className="font-medium text-ink">{vStatus}</span>
            {vReason ? ` — ${vReason}` : ''}
          </p>
          <Link
            to="/physio/bookings"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            Go to dashboard
          </Link>
        </div>

        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="type-page-title text-ink">On file (read-only)</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
              <dt className="text-ink-muted">Name</dt>
              <dd className="text-right font-medium text-ink">{name || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
              <dt className="text-ink-muted">Specialization</dt>
              <dd className="text-right font-medium text-ink">{specialization || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
              <dt className="text-ink-muted">Experience</dt>
              <dd className="text-right font-medium text-ink">{experience !== '' ? `${experience} yrs` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
              <dt className="text-ink-muted">Fee / session</dt>
              <dd className="text-right font-medium text-ink">
                {feeMin === '' ? '—' : formatPhysioSessionFeeLabel({ pricePerSession: Number(feeMin) })}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="type-page-title text-ink">Physiotherapist onboarding</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Complete all steps. Documents are stored on S3 when configured, otherwise on the server.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Verification: <span className="font-medium text-ink">{vStatus}</span>
          {vReason ? ` — ${vReason}` : ''}
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
          <h2 className="type-page-title text-ink">Basic info</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-name">
                Full name
              </label>
              <input
                id="ob-name"
                className={inputClass('name')}
                value={name}
                onChange={(e) => {
                  const v = e.target.value
                  setName(v)
                  patchField('name', v)
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                autoComplete="name"
              />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-email">
                Email
              </label>
              <input
                id="ob-email"
                className={inputClass('email')}
                type="email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value
                  setEmail(v)
                  patchField('email', v)
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                autoComplete="email"
              />
              {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-dob">
                Date of birth
              </label>
              <input
                id="ob-dob"
                className={inputClass('dob')}
                type="date"
                value={dob}
                onChange={(e) => {
                  const v = e.target.value
                  setDob(v)
                  patchField('dob', v)
                }}
                aria-invalid={Boolean(fieldErrors.dob)}
              />
              {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-gender">
                Gender
              </label>
              <select
                id="ob-gender"
                className={inputClass('gender')}
                value={gender}
                onChange={(e) => {
                  const v = e.target.value
                  setGender(v)
                  patchField('gender', v)
                }}
                aria-invalid={Boolean(fieldErrors.gender)}
              >
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
              {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-address">
                Address
              </label>
              <textarea
                id="ob-address"
                className={`${inputClass('address')} min-h-[88px] py-2`}
                value={address}
                onChange={(e) => {
                  const v = e.target.value
                  setAddress(v)
                  patchField('address', v)
                }}
                rows={3}
                aria-invalid={Boolean(fieldErrors.address)}
              />
              {fieldErrors.address ? <p className="mt-1 text-xs text-red-600">{fieldErrors.address}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-loc">
                Coverage / location (required for bookings)
              </label>
              <input
                id="ob-loc"
                className={inputClass('location')}
                value={location}
                onChange={(e) => {
                  const v = e.target.value
                  setLocation(v)
                  patchField('location', v)
                }}
                aria-invalid={Boolean(fieldErrors.location)}
              />
              {fieldErrors.location ? <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-avatar">
                Profile photo
              </label>
              {avatarUrl ? (
                <img
                  src={resolveFileUrl(avatarUrl)}
                  alt=""
                  className="mb-2 h-20 w-20 rounded-full object-cover ring-2 ring-border-subtle"
                />
              ) : null}
              <input
                id="ob-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setAvatarFile(f)
                  patchField('avatar', f)
                }}
                aria-invalid={Boolean(fieldErrors.avatar)}
              />
              {fieldErrors.avatar ? <p className="mt-1 text-xs text-red-600">{fieldErrors.avatar}</p> : null}
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="type-page-title text-ink">Qualification</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-degree">
                Degree
              </label>
              <select
                id="ob-degree"
                className={inputClass('degree')}
                value={degree}
                onChange={(e) => {
                  const v = e.target.value
                  setDegree(v)
                  patchField('degree', v)
                }}
                aria-invalid={Boolean(fieldErrors.degree)}
              >
                <option value="">—</option>
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
              <label className="mb-1 block text-xs font-medium text-ink-muted">University</label>
              <input
                className={inputClass('university')}
                value={university}
                onChange={(e) => {
                  const v = e.target.value
                  setUniversity(v)
                  patchField('university', v)
                }}
                aria-invalid={Boolean(fieldErrors.university)}
              />
              {fieldErrors.university ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.university}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-passing-year">
                Passing Year
              </label>
              <input
                id="ob-passing-year"
                className={inputClass('year')}
                type="number"
                value={year}
                onChange={(e) => {
                  const v = e.target.value
                  setYear(v)
                  patchField('year', v)
                }}
                aria-invalid={Boolean(fieldErrors.year)}
              />
              {fieldErrors.year ? <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-council-reg">
                Council Registration No (if applicable)
              </label>
              <input
                id="ob-council-reg"
                className={inputClass('registrationNumber')}
                value={registrationNumber}
                onChange={(e) => {
                  const v = e.target.value
                  setRegistrationNumber(v)
                  patchField('registrationNumber', v)
                }}
                aria-invalid={Boolean(fieldErrors.registrationNumber)}
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
          <h2 className="type-page-title text-ink">Practice details</h2>
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
                aria-invalid={Boolean(fieldErrors.experience)}
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
                aria-invalid={Boolean(fieldErrors.specialization)}
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
                aria-invalid={Boolean(fieldErrors.serviceType)}
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
                aria-invalid={Boolean(fieldErrors.areas)}
              />
              {fieldErrors.areas ? <p className="mt-1 text-xs text-red-600">{fieldErrors.areas}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-fee-min">
                Fee per session (₹)
              </label>
              <p className="mb-2 text-xs text-ink-muted">One fixed amount you charge per session.</p>
              <input
                id="ob-fee-min"
                className={inputClass('feeMin')}
                type="number"
                min="0"
                value={feeMin}
                onChange={(e) => {
                  const v = e.target.value
                  setFeeMin(v)
                  patchField('feeMin', v)
                }}
                aria-invalid={Boolean(fieldErrors.feeMin)}
              />
              {fieldErrors.feeMin ? <p className="mt-1 text-xs text-red-600">{fieldErrors.feeMin}</p> : null}
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="type-page-title text-ink">Documents</h2>
          <p className="mt-1 text-sm text-ink-muted">
            PDF or images (max 2MB each). Required uploads are marked; internship and council registration certificates
            are optional. Choose your government ID type and agree to the declaration below.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DocumentUploadPreview
              label="Qualification certificate"
              description="Degree or final marksheet from your university."
              file={fCertificate}
              serverUrl={docUrls.certificate}
              error={fieldErrors.certificate}
              inputId="ob-doc-cert"
              onFileChange={(f) => {
                setFCertificate(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  certificate: validateLiveField('certificate', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
              }}
            />
            <DocumentUploadPreview
              label="Government ID"
              description="Clear photo or scan of the same ID you will show in your selfie."
              file={fIdProof}
              serverUrl={docUrls.idProof}
              error={fieldErrors.idProof || fieldErrors.idProofType}
              inputId="ob-doc-id"
              onFileChange={(f) => {
                setFIdProof(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  idProof: validateLiveField('idProof', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
              }}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor="ob-id-proof-type">
                  ID type
                </label>
                <select
                  id="ob-id-proof-type"
                  className={inputClass('idProofType')}
                  value={idProofType}
                  onChange={(e) => {
                    const v = e.target.value
                    setIdProofType(v)
                    setFieldErrors((prev) => ({
                      ...prev,
                      idProofType: validateLiveField('idProofType', v, {
                        mode: 'physio',
                        isPhysio: true,
                        requireCoords: false,
                      }),
                    }))
                  }}
                  aria-invalid={Boolean(fieldErrors.idProofType)}
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
              label="Professional / council registration"
              description="State council or equivalent registration document."
              file={fRegCert}
              serverUrl={docUrls.registration}
              error={fieldErrors.registrationCertificate}
              inputId="ob-doc-reg"
              onFileChange={(f) => {
                setFRegCert(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  registrationCertificate: validateLiveField('registrationCertificate', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
              }}
            />
            <DocumentUploadPreview
              label="Selfie with ID"
              description="Your face visible next to the same government ID."
              file={fSelfie}
              serverUrl={docUrls.selfie}
              error={fieldErrors.selfieWithId}
              inputId="ob-doc-selfie"
              onFileChange={(f) => {
                setFSelfie(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  selfieWithId: validateLiveField('selfieWithId', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
              }}
            />
            <DocumentUploadPreview
              required={false}
              label="Internship certificate"
              description="Upload if you have completed a formal internship."
              file={fInternship}
              serverUrl={docUrls.internship}
              error={fieldErrors.internshipCertificate}
              inputId="ob-doc-internship"
              onFileChange={(f) => {
                setFInternship(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  internshipCertificate: validateLiveField('internshipCertificate', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
              }}
            />
            <DocumentUploadPreview
              required={false}
              label="Council registration certificate"
              description="Optional — separate council letter or card, if available."
              file={fCouncil}
              serverUrl={docUrls.council}
              error={fieldErrors.councilRegistrationCertificate}
              inputId="ob-doc-council"
              onFileChange={(f) => {
                setFCouncil(f)
                setFieldErrors((prev) => ({
                  ...prev,
                  councilRegistrationCertificate: validateLiveField('councilRegistrationCertificate', f, {
                    mode: 'physio',
                    isPhysio: true,
                    requireCoords: false,
                  }),
                  file: '',
                }))
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
              <span>I have read and agree to the declaration above.</span>
            </label>
            {fieldErrors.qualificationDeclaration ? (
              <p className="mt-2 text-xs text-red-600">{fieldErrors.qualificationDeclaration}</p>
            ) : null}
          </div>
          {fieldErrors.file ? <p className="mt-2 text-sm text-red-600">{fieldErrors.file}</p> : null}
        </section>
      )}

      {step === 5 && (
        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="type-page-title text-ink">Review & submit</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-border-subtle py-2">
              <dt className="text-ink-muted">Name</dt>
              <dd className="text-right font-medium text-ink">{name}</dd>
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
              <dd className="text-right font-medium text-ink">
                {feeMin === '' ? '—' : formatPhysioSessionFeeLabel({ pricePerSession: Number(feeMin) })}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-muted">
            Submitting sends your profile back to <strong>pending</strong> until an admin verifies you. Only verified
            physiotherapists appear in the patient booking list.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Submitting…' : 'Submit for verification'}
          </button>
        </section>
      )}

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
            {saving ? 'Saving…' : step === 4 ? 'Upload & continue' : 'Save & continue'}
          </button>
        </div>
      )}
    </div>
  )
}
