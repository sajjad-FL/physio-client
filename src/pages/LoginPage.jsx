import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import AuthSpinner from '../components/AuthSpinner'
import Button from '../components/ui/Button'
import FieldLabel from '../components/ui/FieldLabel'
import PasswordInput from '../components/ui/PasswordInput'
import { setSession, getToken, getDefaultDashboardPath } from '../auth/session'
import { getProfileCached } from '../utils/profileCache'
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
    let cancelled = false
    getProfileCached(api)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) navigate(getDefaultDashboardPath(), { replace: true })
      })
    return () => {
      cancelled = true
    }
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
      try {
        await getProfileCached(api, { force: true })
      } catch {
        /* use login payload role if profile sync fails */
      }
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

  const title = 'Sign in — PhysiOkhom'
  const description = 'Sign in to your PhysiOkhom account to book home visit physiotherapy and manage appointments.'
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
      {/* Ambient teal halo glows — matching mobile LoginScreen */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[-120px] h-[240px] sm:h-[380px] rounded-[190px] bg-[rgba(162,240,239,0.15)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[20%] top-[-50px] h-[140px] sm:h-[200px] w-[60%] rounded-[100px] bg-[rgba(13,107,107,0.04)]"
        aria-hidden
      />
      <header className="relative z-10 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[15px] font-semibold text-teal-700 transition-opacity duration-200 hover:opacity-80"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6"/></svg>
            PhysiOkhom
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-61px)] max-w-md flex-col justify-center px-4 py-8 sm:px-6 sm:py-16 lg:py-24">
        {/* Hero icon + title — matching mobile LoginScreen heroSection */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-12">
          <div className="flex h-14 w-14 sm:h-[68px] sm:w-[68px] items-center justify-center rounded-[20px] bg-teal-600 shadow-[0_6px_24px_rgba(13,148,136,0.30)]">
            <svg className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <h1 className="type-hero">Welcome back</h1>
          <p className="type-body text-slate-500">
            Sign in with your registered Indian mobile and password.
          </p>
        </div>

        <div className="motion-safe:animate-enter-scale rounded-2xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-900/5 transition-shadow duration-300 sm:p-8 md:p-10">
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
              <FieldLabel htmlFor="login-phone" required className="type-label mb-2 block text-slate-700">
                Phone number
              </FieldLabel>
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
                placeholder="Enter your phone number"
                disabled={loading}
              />
              {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
            </div>
            <div>
              <FieldLabel htmlFor="login-password" required className="type-label mb-2 block text-slate-700">
                Password
              </FieldLabel>
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
                placeholder="Enter your password"
                disabled={loading}
              />
              {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
            </div>
            <Button type="submit" variant="primary" className="type-button h-11 w-full" loading={loading}>
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
