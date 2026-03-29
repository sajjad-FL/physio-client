import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import OtpInput from '../components/OtpInput'
import AuthSpinner from '../components/AuthSpinner'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { setSession, getToken, getDefaultDashboardPath } from '../auth/session'

export default function LoginPage() {
  const navigate = useNavigate()
  const [sessionRedirecting, setSessionRedirecting] = useState(() => Boolean(getToken()))

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugOtp, setDebugOtp] = useState('')

  const canSendOtp = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone])
  const canVerify = useMemo(() => otp.replace(/\D/g, '').length === 6, [otp])

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setSessionRedirecting(false)
      return
    }
    navigate(getDefaultDashboardPath(), { replace: true })
  }, [navigate])

  const inputCls =
    'h-11 w-full rounded-lg border border-border-subtle bg-white px-4 text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20'

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/send-otp', { phone })
      const otpFromServer = res.data?.otp
      if (otpFromServer) setDebugOtp(otpFromServer)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', {
        phone,
        otp,
      })

      const roles = res.data?.roles || ['user']
      toast.success('Login successful')
      setSession(res.data.token, roles, res.data.isProfileComplete === true)
      navigate(getDefaultDashboardPath())
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (sessionRedirecting) {
    return <AuthSpinner />
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]" aria-hidden />
      <header className="relative border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-[15px] font-semibold text-gray-900 transition-opacity duration-200 hover:opacity-80">
            ← PhysioCare
          </Link>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="motion-safe:animate-enter-up mb-10 space-y-3 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Secure sign-in</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Continue to booking</h1>
          <p className="text-sm leading-relaxed text-gray-500">
            We&apos;ll text a one-time code to your mobile number.
          </p>
        </div>

        <div className="motion-safe:animate-enter-scale rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow duration-300 sm:p-10">
          {error && (
            <div
              className="motion-safe:animate-enter mb-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="alert"
            >
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form key="phone" onSubmit={handleSendOtp} className="motion-safe:animate-enter flex flex-col gap-6">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink">
                  Phone number
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                  placeholder="10-digit mobile number"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSendOtp}
                className="interactive-press flex h-11 items-center justify-center rounded-lg bg-brand text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(10,37,64,0.08)] transition-colors duration-200 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send code'}
              </button>

              <p className="text-center text-xs leading-relaxed text-ink-muted">
                MVP: OTP may be shown in UI when <code className="rounded bg-canvas px-1 py-0.5 text-[11px]">DEBUG_OTP</code> is enabled on the server.
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form key="otp" onSubmit={handleVerifyOtp} className="motion-safe:animate-enter flex flex-col gap-7">
              <div>
                <label htmlFor="otp" className="mb-3 block text-sm font-medium text-gray-900">
                  Enter verification code
                </label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              {debugOtp && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-900">
                  Debug OTP: <span className="font-semibold tabular-nums">{debugOtp}</span>
                </div>
              )}

              <Button type="submit" variant="primary" className="h-11 w-full text-[15px]" disabled={loading || !canVerify}>
                {loading ? 'Verifying…' : 'Verify & continue'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full text-[15px]"
                disabled={loading}
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setError('')
                  setDebugOtp('')
                }}
              >
                Use a different number
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
