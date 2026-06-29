import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getToken, getRoles, getDefaultDashboardPath, logout } from '../../auth/session'
import { PHYSIO_DASHBOARD_ENTRY } from '../../constants/authPaths'

function ChevronIcon({ open }) {
  return (
    <svg
      className={['h-4 w-4 text-slate-400 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  )
}

const menuLink =
  'block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900'

const menuBtn =
  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50'

/**
 * Account menu for logged-in users; compact “Sign in” link when logged out.
 * @param {{ variant?: 'header' | 'compact', className?: string }} props
 */
export default function ProfileDropdown({ variant = 'header', className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const token = getToken()
  const roles = getRoles()
  const isAdmin = roles.includes('admin')
  const isPhysio = roles.includes('physio')
  const dashboardPath = getDefaultDashboardPath()

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    function onAuth() {
      setOpen(false)
    }
    window.addEventListener('auth-session-changed', onAuth)
    return () => window.removeEventListener('auth-session-changed', onAuth)
  }, [])

  if (!token) {
    return (
      <Link
        to="/login"
        className={[
          'inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition-all duration-200 hover:bg-teal-700 hover:shadow-md motion-safe:active:scale-[0.98]',
          className,
        ].join(' ')}
      >
        Sign in
      </Link>
    )
  }

  const showBook = !isAdmin
  const showPhysioWorkspace = isPhysio && dashboardPath !== PHYSIO_DASHBOARD_ENTRY
  const profilePath = isPhysio || isAdmin ? '/profile' : '/dashboard/profile'

  return (
    <div className={['relative', className].filter(Boolean).join(' ')} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md motion-safe:active:scale-[0.99]',
          variant === 'compact' ? 'px-2 py-1.5' : '',
        ].join(' ')}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <UserIcon />
        </span>
        {variant === 'header' && <span className="hidden text-sm font-medium text-slate-700 sm:inline">Account</span>}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-54 rounded-2xl border border-slate-100 bg-white py-2 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 motion-safe:animate-enter-scale"
          role="menu"
        >
          <div className="border-b border-slate-100 px-2 pb-2">
            <Link to={dashboardPath} className={menuLink} role="menuitem" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            {showPhysioWorkspace && (
              <Link to={PHYSIO_DASHBOARD_ENTRY} className={menuLink} role="menuitem" onClick={() => setOpen(false)}>
                Physiotherapist workspace
              </Link>
            )}
            {showBook && (
              <Link to="/book" className={menuLink} role="menuitem" onClick={() => setOpen(false)}>
                Book an appointment
              </Link>
            )}
            <Link to={profilePath} className={menuLink} role="menuitem" onClick={() => setOpen(false)}>
              Profile
            </Link>
            {isAdmin && (
              <Link to="/admin" className={menuLink} role="menuitem" onClick={() => setOpen(false)}>
                Admin console
              </Link>
            )}
          </div>
          <div className="px-2 pt-1">
            <button
              type="button"
              role="menuitem"
              className={menuBtn}
              onClick={() => {
                setOpen(false)
                logout(navigate)
              }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
