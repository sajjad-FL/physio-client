import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const navLinkClass = ({ isActive }) =>
  [
    'group relative flex items-center gap-3 rounded-r-xl py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-200 ease-out',
    isActive
      ? 'bg-gradient-to-r from-blue-50/95 to-blue-50/40 text-blue-900 shadow-sm before:absolute before:left-0 before:top-1/2 before:h-9 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-blue-600 before:shadow-[0_0_12px_rgba(37,99,235,0.35)]'
      : 'text-gray-600 hover:bg-gray-50/90 hover:text-gray-900',
  ].join(' ')

export default function AppShell({
  brand = 'PhysioCare',
  badge,
  navItems = [],
  topBarTitle,
  topBarSubtitle,
  headerActions,
  sidebarFooter,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-100 px-4 lg:h-[4.25rem]">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-105">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </span>
          <span className="truncate text-[15px] font-semibold text-gray-900">{brand}</span>
        </Link>
        {badge && (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {badge}
          </span>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map(({ to, label, end, icon }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => setMobileOpen(false)}>
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
      {sidebarFooter && <div className="border-t border-gray-100 p-4">{sidebarFooter}</div>}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-gray-100 bg-white shadow-lg transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <div className="min-w-0">
              {topBarTitle && <h1 className="truncate text-lg font-semibold text-gray-900">{topBarTitle}</h1>}
              {topBarSubtitle && <p className="truncate text-sm text-gray-500">{topBarSubtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">{headerActions}</div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
