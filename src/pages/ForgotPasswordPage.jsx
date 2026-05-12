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
    e.preventDefault()
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
      await api.post('/auth/verify-otp', { phone: pv.normalized, otp: otp.replace(/\D/g, '') })
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

  const title = 'Reset password — PhysioKhom'
  const description = 'Reset your PhysioKhom account password using a one-time code sent to your registered phone.'
  const canonical = absoluteUrl('/forgot-password')
  const ogImage = absoluteUrl('/og-default.png')

  return (
    <div className="min-h-screen bg-slate-50">
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
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-md">
          <Link to="/login" className="text-sm font-medium text-teal-700 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === 'phone' && 'Enter the phone number on your account. We’ll send a 6-digit code.'}
          {step === 'otp' && 'Enter the code we sent.'}
          {step === 'password' && 'Choose a new password (min. 8 characters).'}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <label htmlFor="fp-phone" className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
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
                  disabled={loading}
                />
                {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
              </div>
              <Button type="submit" variant="primary" className="h-11 w-full" loading={loading}>
                Send code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyCode} className="space-y-4">
              <OtpInput
                value={otp}
                onChange={(v) => {
                  setOtp(v)
                  setFieldErrors((prev) => ({ ...prev, otp: validateLiveField('otp', v) }))
                  setError('')
                }}
              />
              {fieldErrors.otp ? <p className="text-xs text-red-600">{fieldErrors.otp}</p> : null}
              {debugOtp ? (
                <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-slate-800">
                  Debug code: <span className="font-mono font-semibold">{debugOtp}</span>
                </p>
              ) : null}
              <Button type="submit" variant="primary" className="h-11 w-full" loading={loading}>
                Verify code
              </Button>
              <button
                type="button"
                className="w-full text-sm text-slate-600 hover:text-slate-900"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setDebugOtp('')
                  setError('')
                }}
              >
                Use a different number
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} className="space-y-4">
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
                  disabled={loading}
                />
                {fieldErrors.newPassword ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
                ) : null}
              </div>
              <Button type="submit" variant="primary" className="h-11 w-full" loading={loading}>
                Save password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
