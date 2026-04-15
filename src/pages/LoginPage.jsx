import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import AuthSpinner from '../components/AuthSpinner'
import Button from '../components/ui/Button'
import PasswordInput from '../components/ui/PasswordInput'
import { setSession, getToken, getDefaultDashboardPath } from '../auth/session'
import { validateIndianMobile } from '../utils/phoneIndia'
import { validateLiveField } from '../utils/liveFieldValidation'
import { absoluteUrl } from '../utils/siteMeta'

export default function LoginPage() {
  const navigate = useNavigate()
  const [sessionRedirecting, setSessionRedirecting] = useState(() => Boolean(getToken()))

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setLoginError(null)
    const pv = validateIndianMobile(phone)
    const pe = !password ? 'Password is required' : validateLiveField('loginPassword', password)
    setFieldErrors({
      phone: pv.valid ? '' : pv.message,
      password: pe,
    })
    if (!pv.valid || pe) return

    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        phone: pv.normalized,
        password,
      })
      const role = res.data?.role ?? 'user'
      toast.success('Signed in')
      setSession(res.data.token, role, res.data.isProfileComplete === true)
      navigate(getDefaultDashboardPath())
    } catch (err) {
      const d = err.response?.data
      setLoginError({
        code: typeof d?.code === 'string' ? d.code : undefined,
        message: d?.message || err.message || 'Sign-in failed',
      })
    } finally {
      setLoading(false)
    }
  }

  if (sessionRedirecting) {
    return <AuthSpinner />
  }

  const title = 'Sign in — NearbyPhysio'
  const description = 'Sign in to your NearbyPhysio account to book home visit physiotherapy and manage appointments.'
  const canonical = absoluteUrl('/login')
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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.12),transparent)]"
        aria-hidden
      />
      <header className="relative border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-[15px] font-semibold text-slate-900 transition-opacity duration-200 hover:opacity-80"
          >
            ← NearbyPhysio
          </Link>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="motion-safe:animate-enter-up mb-10 space-y-3 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Sign in</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Continue to booking</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Sign in with the same mobile number and password you used when you registered.
          </p>
        </div>

        <div className="motion-safe:animate-enter-scale rounded-2xl border border-slate-100 bg-white p-8 shadow-md shadow-slate-900/5 transition-shadow duration-300 sm:p-10">
          {loginError ? (
            <div className="motion-safe:animate-enter mb-6" role="alert">
              {loginError.code === 'LOGIN_NO_ACCOUNT' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm text-slate-800">
                  <p className="font-semibold text-slate-900">We don’t have an account for this number yet</p>
                  <p className="mt-2 leading-relaxed text-slate-600">{loginError.message}</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <Link
                      to="/register"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      Create an account
                    </Link>
                    <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-left">
                      Already registered? Check the number matches the one you signed up with.
                    </p>
                  </div>
                </div>
              ) : loginError.code === 'LOGIN_PASSWORD_NOT_SET' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-4 text-left text-sm text-amber-950">
                  <p className="font-semibold">This number is registered — set a password to sign in</p>
                  <p className="mt-2 leading-relaxed text-amber-950/90">{loginError.message}</p>
                  <Link
                    to="/forgot-password"
                    className="mt-3 inline-block font-medium text-teal-800 underline decoration-teal-600/40 underline-offset-2 hover:text-teal-900"
                  >
                    Open Forgot password
                  </Link>
                </div>
              ) : loginError.code === 'LOGIN_WRONG_PASSWORD' ? (
                <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-4 text-sm text-red-900">
                  <p className="font-semibold">Incorrect password</p>
                  <p className="mt-1.5 leading-relaxed text-red-900/90">{loginError.message}</p>
                  <Link
                    to="/forgot-password"
                    className="mt-2 inline-block text-sm font-medium text-teal-800 underline decoration-teal-700/30 underline-offset-2 hover:text-teal-900"
                  >
                    Reset password
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {loginError.message}
                </div>
              )}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="login-phone" className="mb-2 block text-sm font-medium text-slate-700">
                Phone number
              </label>
              <input
                id="login-phone"
                name="phone"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value
                  setPhone(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    phone: validateLiveField('phone', v),
                  }))
                  setLoginError(null)
                }}
                inputMode="tel"
                autoComplete="tel"
                className={inputClsErr('phone')}
                placeholder="+91 or 10-digit mobile"
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-slate-500">10-digit Indian mobile (starts with 6–9).</p>
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <PasswordInput
                id="login-password"
                name="password"
                value={password}
                onChange={(e) => {
                  const v = e.target.value
                  setPassword(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validateLiveField('loginPassword', v),
                  }))
                  setLoginError(null)
                }}
                autoComplete="current-password"
                className={inputClsErr('password')}
                disabled={loading}
              />
              {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
            </div>
            <Button type="submit" variant="primary" className="h-11 w-full text-[15px]" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="mb-3 text-center text-sm font-medium text-slate-700">New here?</p>
            <Link
              to="/register"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/50 focus-visible:ring-offset-2 motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]"
            >
              Create an account
            </Link>
            <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
              Takes a minute — same number you’ll use to sign in later.
            </p>
          </div>

          <div className="mt-6 text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-teal-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Are you a physiotherapist?{' '}
          <Link to="/register-physio" className="font-medium text-teal-700 hover:underline">
            Apply to join the platform
          </Link>
        </p>
      </div>
    </div>
  )
}
