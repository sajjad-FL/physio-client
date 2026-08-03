import { Link, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import ProfileDropdown from './ProfileDropdown'

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
    'group relative flex w-full items-center justify-between gap-2 rounded-r-xl py-2.5 pl-4 pr-3 text-[13px] font-medium md:text-sm transition-all duration-200 ease-out',
    isActive
      ? 'bg-gradient-to-r from-teal-50/95 to-teal-50/30 text-teal-950 shadow-sm before:absolute before:left-0 before:top-1/2 before:h-9 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-teal-600 before:shadow-[0_0_12px_rgba(13,148,136,0.35)]'
      : 'text-slate-600 hover:bg-slate-50/90 hover:text-slate-900',
  ].join(' ')

function NavItemBadge({ count, active }) {
  const n = Number(count) || 0
  if (n <= 0) return null
  const label = n > 99 ? '99+' : String(n)
  return (
    <span
      className={[
        'ml-1 inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ring-1',
        active ? 'bg-teal-600 text-white ring-teal-700/30' : 'bg-white text-teal-800 ring-teal-200/90 shadow-sm',
      ].join(' ')}
    >
      <span className="sr-only">{n > 99 ? 'More than 99' : n} pending</span>
      <span aria-hidden>{label}</span>
    </span>
  )
}

export default function AppShell({
  brand = 'PhysiOkhom',
  badge,
  navItems = [],
  bottomNavItems = null,
  topBarTitle,
  topBarSubtitle,
  headerActions,
  sidebarFooter,
  children,
  contentClassName = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  function resolveActive(item, navDefaultActive) {
    if (typeof item?.activeWhen === 'function') return Boolean(item.activeWhen(location))
    return Boolean(navDefaultActive)
  }

  const sidebar = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-4 lg:h-[4.25rem]">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
          <img
            src="/logo.svg"
            alt="PhysiOkhom Logo"
            className="h-12 w-12 shrink-0 object-contain transition-transform duration-200 motion-safe:group-hover:scale-105"
          />
          <span className="truncate text-[15px] font-semibold text-slate-900">{brand}</span>
        </Link>
        {badge && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {badge}
          </span>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item, index) => {
          const { to, label, end, icon, disabled, badgeCount, section } = item
          const prevSection = index > 0 ? navItems[index - 1]?.section : null
          const showSection = section && section !== prevSection
          const itemKey = to || `section-${section}-${index}`

          return (
            <span key={itemKey} className="contents">
              {showSection && (
                <p className="mb-1 mt-3 first:mt-0 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section}
                </p>
              )}
              {disabled ? (
                <span
                  className="group relative flex w-full cursor-not-allowed items-center justify-between gap-2 rounded-r-xl py-2.5 pl-4 pr-3 text-[13px] font-medium text-slate-400 md:text-sm"
                  title="Available after your profile is approved"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    {icon}
                    <span className="truncate">{label}</span>
                  </span>
                  <NavItemBadge count={badgeCount} active={false} />
                </span>
              ) : (
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive: pathActive }) =>
                    navLinkClass({ isActive: resolveActive(item, pathActive) })
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {({ isActive: pathActive }) => {
                    const isActive = resolveActive(item, pathActive)
                    return (
                      <>
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          {icon}
                          <span className="truncate">{label}</span>
                        </span>
                        <NavItemBadge count={badgeCount} active={isActive} />
                      </>
                    )
                  }}
                </NavLink>
              )}
            </span>
          )
        })}
      </nav>
      {sidebarFooter && <div className="border-t border-slate-100 p-4">{sidebarFooter}</div>}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-100 bg-white shadow-lg transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200/90 bg-white/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <div className="min-w-0">
              {topBarTitle && <h1 className="type-page-title truncate">{topBarTitle}</h1>}
              {topBarSubtitle && <p className="type-caption truncate md:text-sm">{topBarSubtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            {headerActions}
            <ProfileDropdown />
          </div>
        </header>

        <main
          className={[
            'mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 lg:px-8',
            bottomNavItems?.length ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6' : '',
            contentClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </main>

        {bottomNavItems?.length > 0 && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden"
            aria-label="Primary navigation"
          >
            <div
              className="mx-auto flex max-w-7xl items-stretch justify-around gap-0 px-1 pt-1"
              style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
              {bottomNavItems.map((item) => {
                const { to, label, end, icon } = item
                return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className="tap-feedback flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors duration-200"
                >
                  {({ isActive: pathActive }) => {
                    const isActive = resolveActive(item, pathActive)
                    return (
                    <>
                      <span
                        className={[
                          'flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200',
                          isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {icon}
                      </span>
                      <span
                        className={[
                          'max-w-[4.25rem] truncate text-center leading-tight',
                          isActive ? 'text-teal-800' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    </>
                    )
                  }}
                </NavLink>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
