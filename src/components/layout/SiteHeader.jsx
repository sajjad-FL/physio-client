import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getToken, getRoles, getDefaultDashboardPath } from '../../auth/session'
import ProfileDropdown from './ProfileDropdown'

/**
 * Sticky marketing / public header: logo, primary nav, account menu.
 * Mobile guests always see Log in + Register in the top bar (not only inside the menu).
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-900 transition-opacity duration-200 hover:opacity-85"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/logo.png"
            alt="PhysiOkhom"
            className="h-10 w-10 shrink-0 object-contain transition-transform duration-200 motion-safe:hover:scale-105 sm:h-12 sm:w-12"
          />
          <span className="sr-only">PhysiOkhom</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Guest CTAs — always visible on mobile (first-time visitors) */}
          {!token ? (
            <div className="flex items-center gap-1.5 md:hidden">
              <Link
                to="/login"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-teal-600 px-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="md:hidden">
              <ProfileDropdown variant="compact" />
            </div>
          )}

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
            <a href="#how-it-works" className={linkClass}>
              How it works
            </a>
            <a href="#services" className={linkClass}>
              Services
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

          <div className="hidden items-center gap-2 md:flex">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700"
                >
                  Register
                </Link>
              </>
            ) : (
              <ProfileDropdown />
            )}
            <Link
              to="/book"
              className="interactive-press inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Book appointment
            </Link>
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
              Book appointment
            </Link>
            {token ? (
              <Link to={getDefaultDashboardPath()} className={linkClass} onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
            {isAdmin && (
              <Link to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
