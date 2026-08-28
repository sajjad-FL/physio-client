import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { api } from '../../config/api'
import AppShell from '../../components/layout/AppShell'
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

const iconPatients = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
    />
  </svg>
)

const iconStaff = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
)

function financeTab(location) {
  if (!String(location?.pathname || '').startsWith('/clinic/finance')) return null
  const tab = new URLSearchParams(location.search || '').get('tab')
  if (tab === 'earnings' || tab === 'payout') return tab
  return 'cash'
}

function titleForPath(pathname, search) {
  if (pathname.startsWith('/clinic/profile')) return 'Profile'
  if (pathname.startsWith('/clinic/patients')) return 'Patients'
  if (pathname.startsWith('/clinic/physios') || pathname.startsWith('/clinic/staff')) {
    return 'Clinic physios'
  }
  if (pathname.startsWith('/clinic/bookings/') && pathname !== '/clinic/bookings') return 'Case detail'
  if (pathname.startsWith('/clinic/bookings')) return 'Clinic cases'
  if (pathname.startsWith('/clinic/finance')) {
    const tab = financeTab({ pathname, search })
    if (tab === 'earnings') return 'Earnings'
    if (tab === 'payout') return 'Payout UPI'
    return 'Cash collected'
  }
  return 'Clinic'
}

export default function ClinicLayout() {
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  const loadCounts = useCallback(async () => {
    try {
      const res = await api.get('/clinic/bookings', { params: { limit: 50 } })
      const items = res.data?.items || []
      setPendingCount(items.filter((b) => !b.physioId || b.paymentCollectionStatus === 'none').length)
    } catch {
      setPendingCount(0)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts, location.pathname])

  const navItems = useMemo(
    () => [
      {
        section: 'Operations',
        to: '/clinic/bookings',
        label: 'Cases',
        icon: iconCases,
        badgeCount: pendingCount,
      },
      {
        section: 'Operations',
        to: '/clinic/patients',
        label: 'Patients',
        icon: iconPatients,
      },
      {
        section: 'Operations',
        to: '/clinic/physios',
        label: 'Physios',
        icon: iconStaff,
      },
      {
        section: 'Finance',
        to: '/clinic/finance?tab=cash',
        label: 'Cash',
        icon: iconCash,
        activeWhen: (loc) => financeTab(loc) === 'cash',
      },
      {
        section: 'Finance',
        to: '/clinic/finance?tab=earnings',
        label: 'Earnings',
        icon: iconEarnings,
        activeWhen: (loc) => financeTab(loc) === 'earnings',
      },
      {
        section: 'Finance',
        to: '/clinic/finance?tab=payout',
        label: 'Payout UPI',
        icon: iconUpi,
        activeWhen: (loc) => financeTab(loc) === 'payout',
      },
      { section: 'Account', to: '/clinic/profile', label: 'Profile', icon: iconProfile, end: true },
    ],
    [pendingCount],
  )

  return (
    <>
      <SeoNoIndex />
      <AppShell
        brand="PhysiOkhom"
        badge="Clinic"
        topBarTitle={titleForPath(location.pathname, location.search)}
        topBarSubtitle="Facility visits, collections, and clinic earnings"
        navItems={navItems}
        bottomNavItems={[
          { to: '/clinic/bookings', label: 'Cases', icon: iconCases },
          {
            to: '/clinic/finance?tab=earnings',
            label: 'Earnings',
            icon: iconEarnings,
            activeWhen: (loc) => financeTab(loc) === 'earnings',
          },
          {
            to: '/clinic/finance?tab=cash',
            label: 'Cash',
            icon: iconCash,
            activeWhen: (loc) => financeTab(loc) === 'cash',
          },
          { to: '/clinic/profile', label: 'Profile', icon: iconProfile, end: true },
        ]}
        headerActions={
          <Link
            to="/"
            className="hidden cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:inline-flex"
          >
            Home
          </Link>
        }
      >
        <Outlet context={{ refreshNavCounts: loadCounts }} />
      </AppShell>
    </>
  )
}
