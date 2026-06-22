import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import OtpInput from '../components/OtpInput'
import Button from '../components/ui/Button'
import PasswordInput from '../components/ui/PasswordInput'
import { validateIndianMobile } from '../utils/phoneIndia'
import { validateLiveField } from '../utils/liveFieldValidation'
import { absoluteUrl } from '../utils/siteMeta'
import { OTP_LENGTH } from '../constants/otp'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugOtp, setDebugOtp] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const inputCls =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'

  function inputClsErr(key) {
    return [
      inputCls,
      fieldErrors[key] ? 'border-red-400 ring-1 ring-red-200' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  async function sendCode(e) {
    e?.preventDefault()
    setError('')
    const pv = validateIndianMobile(phone)
    if (!pv.valid) {
      setFieldErrors({ phone: pv.message })
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { phone: pv.normalized })
      if (res.data?.otp) setDebugOtp(res.data.otp)
      toast.success(res.data?.message || 'Check your phone for the code')
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e) {
    e.preventDefault()
    setError('')
    const pv = validateIndianMobile(phone)
    if (!pv.valid) {
      setError(pv.message)
      return
    }
    const oe = validateLiveField('otp', otp)
    if (oe) {
      setFieldErrors({ otp: oe })
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { phone: pv.normalized, otp })
      toast.success('Code verified — choose a new password')
      setStep('password')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setError('')
    const pv = validateIndianMobile(phone)
    if (!pv.valid) {
      setError(pv.message)
      return
    }
    const pe = !newPassword ? 'Password is required' : validateLiveField('loginPassword', newPassword)
    if (pe) {
      setFieldErrors({ newPassword: pe })
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        phone: pv.normalized,
        newPassword,
      })
      toast.success('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  const title = 'Reset password — PhysiOkhom'
  const description = 'Reset your PhysiOkhom account password using a one-time code sent to your registered phone.'
  const canonical = absoluteUrl('/forgot-password')
  const ogImage = absoluteUrl('/og-default.png')

  const STEPS = [
    { key: 'phone', n: 1, title: 'Enter your mobile', sub: "We'll send a verification code to your registered number.", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
    )},
    { key: 'otp', n: 2, title: 'Enter the code', sub: 'Check your SMS for the 4-digit verification code.', icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h.01M12 8h.01M17 8h.01"/></svg>
    )},
    { key: 'password', n: 3, title: 'New password', sub: 'Choose a strong password with at least 6 characters.', icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    )},
  ]

  const stepIdx = STEPS.findIndex((s) => s.key === step)
  const currentStep = STEPS[stepIdx]

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

      {/* Ambient teal halo glows — matching mobile ForgotPasswordScreen */}
      <div className="pointer-events-none absolute inset-x-0 top-[-120px] h-[240px] sm:h-[380px] rounded-[190px] bg-[rgba(162,240,239,0.15)]" aria-hidden />
      <div className="pointer-events-none absolute left-[20%] top-[-50px] h-[140px] sm:h-[200px] w-[60%] rounded-[100px] bg-[rgba(13,107,107,0.04)]" aria-hidden />

      <header className="relative z-10 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => {
              if (step === 'otp') { setStep('phone'); setFieldErrors({}); return }
              if (step === 'password') { setStep('otp'); setFieldErrors({}); return }
              navigate('/login')
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:opacity-80"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-md px-4 py-8 sm:py-10">

        {/* Step progress dots — matching mobile */}
        <div className="mb-8 flex items-center">
          {STEPS.map((s, idx) => {
            const isDone = idx < stepIdx
            const isActive = idx === stepIdx
            return (
              <div key={s.key} className="flex flex-1 items-center">
                <div className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[10px] font-bold transition-all',
                  isDone ? 'border-teal-600 bg-teal-600 text-white' :
                  isActive ? 'border-teal-600 bg-teal-600/10 text-teal-700 shadow-[0_0_0_4px_rgba(13,148,136,0.10)]' :
                  'border-slate-200 bg-white text-slate-400',
                ].join(' ')}>
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5"/></svg>
                  ) : s.n}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`mx-1.5 h-[1.5px] flex-1 transition-colors ${isDone ? 'bg-teal-600' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Per-step hero icon + heading */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-slate-100 bg-white text-teal-700 shadow-[0_4px_16px_rgba(13,148,136,0.08)]">
            {currentStep.icon}
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{currentStep.title}</h1>
          <p className="text-sm leading-relaxed text-slate-500">{currentStep.sub}</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-900/5 sm:p-8">
          {step === 'phone' && (
            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <label htmlFor="fp-phone" className="mb-2 block text-sm font-medium text-slate-700">
                  Mobile number
                </label>
                <input
                  id="fp-phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, phone: validateLiveField('phone', e.target.value) }))
                    setError('')
                  }}
                  className={inputClsErr('phone')}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              </div>
              <Button type="submit" variant="primary" className="h-12 w-full gap-2 text-[15px]" loading={loading}>
                {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
                Send code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyCode} className="space-y-5">
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">Verification code</span>
                <OtpInput
                  value={otp}
                  length={OTP_LENGTH}
                  onChange={(v) => {
                    setOtp(v)
                    setFieldErrors((prev) => ({ ...prev, otp: validateLiveField('otp', v) }))
                    setError('')
                  }}
                />
                {fieldErrors.otp ? <p className="mt-2 text-xs text-red-600">{fieldErrors.otp}</p> : null}
                {debugOtp ? (
                  <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-slate-800">
                    Debug code: <span className="font-mono font-semibold">{debugOtp}</span>
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:opacity-80"
                onClick={() => sendCode()}
              >
                Didn't receive it? <span className="underline underline-offset-2">Resend code</span>
              </button>
              <Button type="submit" variant="primary" className="h-12 w-full gap-2 text-[15px]" loading={loading}>
                {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
                Verify code
              </Button>
              <button
                type="button"
                className="w-full text-sm text-slate-500 hover:text-slate-800"
                onClick={() => { setStep('phone'); setOtp(''); setDebugOtp(''); setError('') }}
              >
                Use a different number
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label htmlFor="fp-pass" className="mb-2 block text-sm font-medium text-slate-700">
                  New password
                </label>
                <PasswordInput
                  id="fp-pass"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setFieldErrors((prev) => ({
                      ...prev,
                      newPassword: validateLiveField('loginPassword', e.target.value),
                    }))
                    setError('')
                  }}
                  className={inputClsErr('newPassword')}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  disabled={loading}
                />
                {fieldErrors.newPassword ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
                ) : null}
              </div>
              <Button type="submit" variant="primary" className="h-12 w-full gap-2 text-[15px]" loading={loading}>
                {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
                Save password
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
