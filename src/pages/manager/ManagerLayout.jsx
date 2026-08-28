import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { api } from '../../config/api'
import AppShell from '../../components/layout/AppShell'
import { managerNeedsAction } from '../../utils/managerWorkflow'
import SeoNoIndex from '../../components/seo/SeoNoIndex'

const iconCases = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
    />
  </svg>
)

const iconCash = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-1.5v.75c0 .414-.336.75-.75.75h-.75m0-3.75h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
    />
  </svg>
)

const iconEarnings = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
    />
  </svg>
)

const iconUpi = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </svg>
)

const iconProfile = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
)

function financeTab(location) {
  if (!String(location?.pathname || '').startsWith('/manager/finance')) return null
  const tab = new URLSearchParams(location.search || '').get('tab')
  if (tab === 'earnings' || tab === 'payout') return tab
  return 'cash'
}

function titleForPath(pathname, search) {
  if (pathname.startsWith('/manager/profile')) return 'Profile'
  if (pathname.startsWith('/manager/bookings/') && pathname !== '/manager/bookings') return 'Case detail'
  if (pathname.startsWith('/manager/bookings')) return 'Your cases'
  if (pathname.startsWith('/manager/finance') || pathname.startsWith('/manager/ledger') || pathname.startsWith('/manager/wallet')) {
    const tab = financeTab({ pathname, search })
    if (tab === 'earnings') return 'Earnings'
    if (tab === 'payout') return 'Payout UPI'
    return 'Cash collected'
  }
  return 'Care Manager'
}

function subtitleForPath(pathname, search) {
  if (pathname.startsWith('/manager/profile')) return 'Account details, photo, and location'
  if (pathname.startsWith('/manager/bookings/') && pathname !== '/manager/bookings') {
    return 'Assessment, plan, physio assignment & collections'
  }
  if (pathname.startsWith('/manager/bookings')) {
    return 'Assess patients, create plans, and coordinate care'
  }
  if (pathname.startsWith('/manager/finance') || pathname.startsWith('/manager/ledger') || pathname.startsWith('/manager/wallet')) {
    const tab = financeTab({ pathname, search })
    if (tab === 'earnings') return 'Total earnings, withdrawable balance, and history'
    if (tab === 'payout') return 'UPI ID for commission withdrawals'
    return 'Cash and PhonePe collections waiting on admin'
  }
  return 'Home care operations'
}

export default function ManagerLayout() {
  const location = useLocation()
  const [actionCount, setActionCount] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const res = await api.get('/manager/bookings', { params: { limit: 50 } })
      const items = res.data?.items || []
      setActionCount(items.filter((b) => managerNeedsAction(b)).length)
    } catch {
      setActionCount(0)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts, location.pathname])

  const topBarTitle = useMemo(
    () => titleForPath(location.pathname, location.search),
    [location.pathname, location.search],
  )
  const topBarSubtitle = useMemo(
    () => subtitleForPath(location.pathname, location.search),
    [location.pathname, location.search],
  )

  const navItems = useMemo(
    () => [
      {
        section: 'Operations',
        to: '/manager/bookings',
        label: 'Cases',
        icon: iconCases,
        badgeCount: actionCount,
      },
      {
        section: 'Finance',
        to: '/manager/finance?tab=cash',
        label: 'Cash',
        icon: iconCash,
        activeWhen: (loc) => financeTab(loc) === 'cash',
      },
      {
        section: 'Finance',
        to: '/manager/finance?tab=earnings',
        label: 'Earnings',
        icon: iconEarnings,
        activeWhen: (loc) => financeTab(loc) === 'earnings',
      },
      {
        section: 'Finance',
        to: '/manager/finance?tab=payout',
        label: 'Payout UPI',
        icon: iconUpi,
        activeWhen: (loc) => financeTab(loc) === 'payout',
      },
      { section: 'Account', to: '/manager/profile', label: 'Profile', icon: iconProfile, end: true },
    ],
    [actionCount],
  )

  const bottomNavItems = useMemo(
    () => [
      { to: '/manager/bookings', label: 'Cases', icon: iconCases },
      {
        to: '/manager/finance?tab=earnings',
        label: 'Earnings',
        icon: iconEarnings,
        activeWhen: (loc) => financeTab(loc) === 'earnings',
      },
      {
        to: '/manager/finance?tab=cash',
        label: 'Cash',
        icon: iconCash,
        activeWhen: (loc) => financeTab(loc) === 'cash',
      },
      { to: '/manager/profile', label: 'Profile', icon: iconProfile, end: true },
    ],
    [],
  )

  return (
    <>
      <SeoNoIndex />
      <AppShell
        brand="PhysiOkhom"
        badge="Manager"
        topBarTitle={topBarTitle}
        topBarSubtitle={topBarSubtitle}
        navItems={navItems}
        bottomNavItems={bottomNavItems}
        headerActions={
          <Link
            to="/"
            className="hidden cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:inline-flex"
          >
            Home
          </Link>
        }
        sidebarFooter={
          <p className="text-center text-xs leading-relaxed text-slate-400">
            Sign out from the account menu in the header.
          </p>
        }
      >
        <Outlet context={{ refreshNavCounts: loadCounts }} />
      </AppShell>
    </>
  )
}
