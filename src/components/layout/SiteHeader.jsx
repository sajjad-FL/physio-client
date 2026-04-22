import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken, getRoles, getDefaultDashboardPath } from '../../auth/session'
import ProfileDropdown from './ProfileDropdown'

/**
 * Sticky marketing / public header: logo, primary nav, account menu.
 */
export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const token = getToken()
  const roles = getRoles()
  const isAdmin = roles.includes('admin')

  const linkClass =
    'rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-900 transition-opacity duration-200 hover:opacity-85"
          onClick={() => setMobileOpen(false)}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/25 transition-transform duration-200 motion-safe:hover:scale-105"
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </span>
          <span className="truncate">NearbyPhysio</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
            <a href="#services" className={linkClass}>
              Services
            </a>
            <a href="#how-it-works" className={linkClass}>
              How it works
            </a>
            <a href="#faq" className={linkClass}>
              FAQ
            </a>
            <a href="#cities" className={linkClass}>
              Cities
            </a>
            <Link to="/near-me-physio" className={linkClass}>
              Near me
            </Link>
            <Link to="/book" className={linkClass}>
              Book
            </Link>
            {!token && (
              <Link to="/register" className={linkClass}>
                Register
              </Link>
            )}
            {token && (
              <Link to={getDefaultDashboardPath()} className={linkClass}>
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:block">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <a href="#services" className={linkClass} onClick={() => setMobileOpen(false)}>
              Services
            </a>
            <a href="#how-it-works" className={linkClass} onClick={() => setMobileOpen(false)}>
              How it works
            </a>
            <a href="#faq" className={linkClass} onClick={() => setMobileOpen(false)}>
              FAQ
            </a>
            <a href="#cities" className={linkClass} onClick={() => setMobileOpen(false)}>
              Cities
            </a>
            <Link to="/near-me-physio" className={linkClass} onClick={() => setMobileOpen(false)}>
              Near me
            </Link>
            <Link to="/book" className={linkClass} onClick={() => setMobileOpen(false)}>
              Book
            </Link>
            {!token && (
              <Link to="/register" className={linkClass} onClick={() => setMobileOpen(false)}>
                Register
              </Link>
            )}
            {token && (
              <Link to={getDefaultDashboardPath()} className={linkClass} onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
                Admin
              </Link>
            )}
            <div className="pt-2">
              <ProfileDropdown variant="compact" className="w-full [&>button]:w-full [&>button]:justify-between" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
