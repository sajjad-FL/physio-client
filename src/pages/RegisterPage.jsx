import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import AuthSpinner from '../components/AuthSpinner'
import Button from '../components/ui/Button'
import PasswordInput from '../components/ui/PasswordInput'
import OtpInput from '../components/OtpInput'
import { setSession, getToken, getDefaultDashboardPath } from '../auth/session'
import { validateIndianMobile } from '../utils/phoneIndia'
import { validateLiveField } from '../utils/liveFieldValidation'
import { absoluteUrl } from '../utils/siteMeta'
import { sendFirebaseOtp, confirmFirebaseOtp, toE164India, friendlyFirebaseError } from '../utils/firebasePhoneAuth'

const STEP_PHONE = 1
const STEP_OTP = 2
const STEP_ACCOUNT = 3

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessionRedirecting, setSessionRedirecting] = useState(() => Boolean(getToken()))

  const [step, setStep] = useState(STEP_PHONE)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtpHint, setDevOtpHint] = useState('')
  const [otpSendBusy, setOtpSendBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmation, setConfirmation] = useState(null)
  const [referralCode, setReferralCode] = useState(() =>
    String(searchParams.get('ref') || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''),
  )
  const [friendSignupBonus, setFriendSignupBonus] = useState(100)

  useEffect(() => {
    let cancelled = false
    api
      .get('/referral/public-settings')
      .then((res) => {
        if (cancelled) return
        const b = Number(res.data?.referralSignupBonusAmount)
        setFriendSignupBonus(Number.isFinite(b) && b >= 0 ? Math.round(b) : 100)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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

  function goBackStep() {
    if (step === STEP_OTP) {
      setStep(STEP_PHONE)
      setOtp('')
      setDevOtpHint('')
      setFieldErrors((prev) => ({ ...prev, otp: '' }))
      return
    }
    if (step === STEP_ACCOUNT) {
      setStep(STEP_OTP)
      setFieldErrors((prev) => ({ ...prev, name: '', password: '' }))
    }
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
      const conf = await sendFirebaseOtp(toE164India(phone), 'recaptcha-container')
      setConfirmation(conf)
      setOtp('')
      toast.success('Verification code sent.')
      setStep(STEP_OTP)
    } catch (err) {
      const msg = friendlyFirebaseError(err) || err.response?.data?.message || err.message || 'Could not send code'
      toast.error(msg)
      if (err.response?.status === 409) {
        setFieldErrors((prev) => ({ ...prev, phone: 'This number is already registered' }))
      }
    } finally {
      setOtpSendBusy(false)
    }
  }

  function continueFromOtp() {
    const digits = String(otp || '').replace(/\D/g, '')
    const oe = digits.length !== 6 ? 'Enter the 6-digit code' : ''
    setFieldErrors((prev) => ({ ...prev, otp: oe }))
    if (oe) return
    setStep(STEP_ACCOUNT)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const pv = validateIndianMobile(phone)
    const ne = validateLiveField('name', name)
    const pe = !password ? 'Password is required' : validateLiveField('loginPassword', password)
    const digits = String(otp || '').replace(/\D/g, '')
    const oe = digits.length !== 6 ? 'Enter the 6-digit code' : ''

    setFieldErrors({
      name: ne,
      phone: pv.valid ? '' : pv.message,
      password: pe,
      otp: oe,
    })
    if (!pv.valid || ne || pe || oe) return

    setLoading(true)
    try {
      const idToken = await confirmFirebaseOtp(confirmation, otp)
      const body = {
        name: name.trim(),
        password,
        firebaseIdToken: idToken,
        ...(referralCode ? { referralCode } : {}),
      }
      const res = await api.post('/auth/register', body)
      const role = res.data?.role ?? 'user'
      const profileComplete = res.data.isProfileComplete === true
      const credited = Number(res.data?.referralSignupBonusCredited)
      if (credited > 0) {
        toast.success(`Account created — ₹${credited} welcome credit added to your wallet`)
      } else {
        toast.success('Account created')
      }
      setSession(res.data.token, role, profileComplete)
      navigate(getDefaultDashboardPath())
    } catch (err) {
      toast.error(friendlyFirebaseError(err) || err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (sessionRedirecting) {
    return <AuthSpinner />
  }

  const title = 'Create account — PhysiOkhom'
  const description =
    'Sign up with your phone and a password. Add date of birth, gender, and address later in your profile when you are ready to book care.'
  const canonical = absoluteUrl('/register')
  const ogImage = absoluteUrl('/og-default.png')

  const stepLabel = step === STEP_PHONE ? '1 / 3' : step === STEP_OTP ? '2 / 3' : '3 / 3'

  const stepTitle =
    step === STEP_PHONE ? 'Your phone number' : step === STEP_OTP ? 'Verify your number' : 'Almost there'

  const stepSub =
    step === STEP_PHONE
      ? 'We will text a one-time code to verify this number.'
      : step === STEP_OTP
        ? 'Enter the 6-digit code we sent to your phone.'
        : 'Your account is created with your name and password. Add date of birth, gender, and address in Profile whenever you like — you will need them before booking.'

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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.12),transparent)]"
        aria-hidden
      />
      <header className="relative border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-[15px] font-semibold text-slate-900 hover:opacity-80">
            ← PhysiOkhom
          </Link>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 space-y-2 text-center">
          <p className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-teal-700">
            {stepLabel}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Create account</p>
          <h1 className="text-2xl font-bold text-slate-900">{stepTitle}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{stepSub}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-md sm:p-10">
          {step === STEP_PHONE ? (
            <div className="flex flex-col gap-5">
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
                    setFieldErrors((prev) => ({ ...prev, phone: validateLiveField('phone', v) }))
                  }}
                  autoComplete="tel"
                  className={inputClsErr('phone')}
                  placeholder="+91 or 10-digit mobile"
                  disabled={loading || otpSendBusy}
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              </div>
              <Button
                type="button"
                variant="primary"
                className="h-11 w-full text-[15px]"
                disabled={loading || otpSendBusy || !validateIndianMobile(phone).valid}
                loading={otpSendBusy}
                onClick={sendVerificationCode}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === STEP_OTP ? (
            <div className="flex flex-col gap-5">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">Verification code</span>
                <OtpInput value={otp} onChange={setOtp} disabled={loading || otpSendBusy} />
                {fieldErrors.otp ? <p className="mt-2 text-xs text-red-600">{fieldErrors.otp}</p> : null}
                {devOtpHint ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm text-amber-950">
                    <span className="font-sans text-xs font-medium text-amber-900">Local dev code: </span>
                    {devOtpHint}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full text-[13px]"
                disabled={loading || otpSendBusy}
                loading={otpSendBusy}
                onClick={sendVerificationCode}
              >
                Resend code
              </Button>
              <Button type="button" variant="primary" className="h-11 w-full text-[15px]" onClick={continueFromOtp}>
                Continue
              </Button>
              <button
                type="button"
                className="text-center text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                onClick={goBackStep}
              >
                Change phone number
              </button>
            </div>
          ) : null}

          {step === STEP_ACCOUNT ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-slate-700">
                  What&apos;s your name?
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
                <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-700">
                  Create password
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

              <div>
                <label htmlFor="reg-referral" className="mb-2 block text-sm font-medium text-slate-700">
                  Have a referral code? <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="reg-referral"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(
                      e.target.value
                        .trim()
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ''),
                    )
                  }
                  className={inputCls}
                  placeholder="e.g. ABC123"
                  disabled={loading}
                  maxLength={12}
                />
                {referralCode && friendSignupBonus > 0 ? (
                  <p className="mt-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
                    With this code you&apos;ll receive ₹{friendSignupBonus} wallet credit after signup.
                  </p>
                ) : null}
              </div>

              <Button type="submit" variant="primary" className="mt-2 h-11 w-full text-[15px]" loading={loading}>
                Create account
              </Button>
              <button
                type="button"
                className="text-center text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                onClick={goBackStep}
              >
                Back to code
              </button>
            </form>
          ) : null}

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
      <div id="recaptcha-container" />
    </div>
  )
}
