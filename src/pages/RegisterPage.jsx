import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import AuthSpinner from '../components/AuthSpinner'
import Button from '../components/ui/Button'
import PasswordInput from '../components/ui/PasswordInput'
import OtpInput from '../components/OtpInput'
import LocationAutocomplete from '../components/booking/LocationAutocomplete'
import { setSession, getToken, getDefaultDashboardPath } from '../auth/session'
import { validateIndianMobile } from '../utils/phoneIndia'
import { validateLiveField } from '../utils/liveFieldValidation'

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [sessionRedirecting, setSessionRedirecting] = useState(() => Boolean(getToken()))

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [locationLabel, setLocationLabel] = useState('')
  const [placeCoords, setPlaceCoords] = useState(null)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devOtpHint, setDevOtpHint] = useState('')
  const [otpSendBusy, setOtpSendBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setSessionRedirecting(false)
      return
    }
    navigate(getDefaultDashboardPath(), { replace: true })
  }, [navigate])

  const inputCls =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

  function inputClsErr(key) {
    return [
      inputCls,
      fieldErrors[key] ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function clearPhoneVerification() {
    setOtpSent(false)
    setOtp('')
    setDevOtpHint('')
  }

  async function sendVerificationCode() {
    const pv = validateIndianMobile(phone)
    setFieldErrors((prev) => ({ ...prev, phone: pv.valid ? '' : pv.message }))
    if (!pv.valid) {
      toast.error(pv.message)
      return
    }
    setOtpSendBusy(true)
    setDevOtpHint('')
    try {
      const res = await api.post('/auth/signup-otp', { phone: pv.normalized })
      setOtpSent(true)
      setOtp('')
      const code = res.data?.otp
      if (code != null) setDevOtpHint(String(code))
      toast.success(res.data?.message || 'Verification code sent.')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not send code'
      toast.error(msg)
      if (err.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, phone: 'This number is already registered' }))
      }
    } finally {
      setOtpSendBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const pv = validateIndianMobile(phone)
    const ne = validateLiveField('name', name)
    const pe = !password ? 'Password is required' : validateLiveField('loginPassword', password)
    const de = validateLiveField('dob', dob)
    const ge = validateLiveField('gender', gender, { requiredGender: true })
    const le = validateLiveField('location', locationLabel, { mode: 'booking' })
    const oe =
      !otpSent
        ? 'Send a verification code to your phone first'
        : otp.length !== 6
          ? 'Enter the 6-digit code'
          : ''

    setFieldErrors({
      name: ne,
      phone: pv.valid ? '' : pv.message,
      password: pe,
      dob: de,
      gender: ge,
      location: le,
      otp: oe,
    })
    if (!pv.valid || ne || pe || de || ge || le || oe) return

    setLoading(true)
    try {
      const body = {
        name: name.trim(),
        phone: pv.normalized,
        password,
        otp,
        dob,
        gender,
        location: locationLabel.trim(),
      }
      if (placeCoords && Number.isFinite(placeCoords.lat) && Number.isFinite(placeCoords.lng)) {
        body.lat = placeCoords.lat
        body.lng = placeCoords.lng
      }
      const res = await api.post('/auth/register', body)
      const role = res.data?.role ?? 'user'
      toast.success('Account created')
      setSession(res.data.token, role, res.data.isProfileComplete === true)
      navigate(getDefaultDashboardPath())
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (sessionRedirecting) {
    return <AuthSpinner />
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.12),transparent)]"
        aria-hidden
      />
      <header className="relative border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-[15px] font-semibold text-slate-900 hover:opacity-80">
            ← NearbyPhysio
          </Link>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Create account</p>
          <h1 className="text-2xl font-bold text-slate-900">Sign up</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            We verify your mobile with a one-time code
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-md sm:p-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="reg-name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value
                  setName(v)
                  setFieldErrors((prev) => ({ ...prev, name: validateLiveField('name', v) }))
                }}
                autoComplete="name"
                className={inputClsErr('name')}
                disabled={loading}
              />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="reg-phone" className="mb-2 block text-sm font-medium text-slate-700">
                Phone number
              </label>
              <input
                id="reg-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value
                  setPhone(v)
                  clearPhoneVerification()
                  setFieldErrors((prev) => ({ ...prev, phone: validateLiveField('phone', v), otp: '' }))
                }}
                autoComplete="tel"
                className={inputClsErr('phone')}
                placeholder="+91 or 10-digit mobile"
                disabled={loading}
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                We’ll text a 6-digit code to confirm you own this number. Changing the number clears any code you already
                requested.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 h-10 w-full text-[13px]"
                disabled={loading || otpSendBusy || !validateIndianMobile(phone).valid}
                loading={otpSendBusy}
                onClick={sendVerificationCode}
              >
                Send verification code
              </Button>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Verification code</span>
              <OtpInput value={otp} onChange={setOtp} disabled={loading || !otpSent} />
              {fieldErrors.otp ? <p className="mt-2 text-xs text-red-600">{fieldErrors.otp}</p> : null}
              {!otpSent ? (
                <p className="mt-2 text-xs text-slate-400">Enter the code after you tap “Send verification code”.</p>
              ) : null}
              {devOtpHint ? (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm text-amber-950">
                  <span className="font-sans text-xs font-medium text-amber-900">Local dev code: </span>
                  {devOtpHint}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="reg-dob" className="mb-2 block text-sm font-medium text-slate-700">
                Date of birth
              </label>
              <input
                id="reg-dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  const v = e.target.value
                  setDob(v)
                  setFieldErrors((prev) => ({ ...prev, dob: validateLiveField('dob', v) }))
                }}
                autoComplete="bday"
                className={inputClsErr('dob')}
                disabled={loading}
              />
              {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
              <p className="mt-1 text-xs text-slate-500">You must be 18 or older.</p>
            </div>

            <div>
              <label htmlFor="reg-gender" className="mb-2 block text-sm font-medium text-slate-700">
                Gender
              </label>
              <select
                id="reg-gender"
                value={gender}
                onChange={(e) => {
                  const v = e.target.value
                  setGender(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    gender: validateLiveField('gender', v, { requiredGender: true }),
                  }))
                }}
                className={inputClsErr('gender')}
                disabled={loading}
              >
                <option value="">Select</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
            </div>

            <div>
              <label htmlFor="reg-loc" className="mb-2 block text-sm font-medium text-slate-700">
                City or area
              </label>
              <LocationAutocomplete
                id="reg-loc"
                value={locationLabel}
                onChange={(v) => {
                  setLocationLabel(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    location: validateLiveField('location', v, { mode: 'booking' }),
                  }))
                }}
                onPlaceResolved={(p) => {
                  setPlaceCoords(p)
                }}
                disabled={loading}
                placeholder="Search area, city, or address"
              />
              {fieldErrors.location ? <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p> : null}
              <p className="mt-1.5 text-xs text-slate-500">Used to show nearby care options. You can refine this later in your profile.</p>
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <PasswordInput
                id="reg-password"
                value={password}
                onChange={(e) => {
                  const v = e.target.value
                  setPassword(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validateLiveField('loginPassword', v),
                  }))
                }}
                autoComplete="new-password"
                className={inputClsErr('password')}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters — this is what you’ll use to sign in.</p>
              {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
            </div>

            <Button type="submit" variant="primary" className="mt-2 h-11 w-full text-[15px]" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Physiotherapist?{' '}
          <Link to="/register-physio" className="font-medium text-teal-700 hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  )
}
