import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { api } from '../../config/api'
import AppShell from '../../components/layout/AppShell'
import AuthSpinner from '../../components/AuthSpinner'

const iconCalendar = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
    />
  </svg>
)
const iconClock = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const iconNotes = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
)
const iconDispute = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
)
const iconWallet = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m0 0a2.25 2.25 0 012.25-2.25H15a3 3 0 016 0h.75a2.25 2.25 0 012.25 2.25V9M15 12a3 3 0 11-6 0 3 3 0 016 0z"
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

const iconBadge = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  </svg>
)

const baseNav = [
  { to: '/physio/bookings', label: 'Dashboard', icon: iconCalendar },
  { to: '/profile', label: 'Profile', icon: iconProfile },
  { to: '/physio/wallet', label: 'Wallet', icon: iconWallet },
  { to: '/physio/availability', label: 'Availability', icon: iconClock },
  { to: '/physio/notes', label: 'Clinical notes', icon: iconNotes },
  { to: '/physio/disputes', label: 'Disputes', icon: iconDispute },
  { to: '/physio/onboarding', label: 'Onboarding', icon: iconBadge },
]

function navLockedWhilePending(to) {
  if (to === '/profile') return false
  if (to.startsWith('/physio/onboarding')) return false
  if (to.startsWith('/physio/verification')) return false
  return true
}

/** Bookings that need physio action: accept/reject assignment or create/submit a home plan. */
function bookingNeedsPhysioAction(b) {
  if (!b) return false
  if (b.status === 'assigned') return true
  if (b.serviceType !== 'home') return false
  if (b.status !== 'accepted' && b.status !== 'scheduled') return false
  if (b.planStatus === 'proposed' || b.planStatus === 'approved') return false
  return true
}

function activeDisputeCount(disputes) {
  if (!Array.isArray(disputes)) return 0
  return disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length
}

export default function PhysioLayout() {
  const [me, setMe] = useState(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [navBadges, setNavBadges] = useState({})
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    api
      .get('/physio/me')
      .then((res) => {
        if (!cancelled) setMe(res.data)
      })
      .catch(() => {
        if (!cancelled) setMe(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingMe(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const platformApproved = me?.platformApproved === true
  const rejected =
    me?.verificationStatus === 'rejected' || me?.verification?.status === 'rejected'

  useEffect(() => {
    if (!platformApproved) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          api.get('/physio/bookings', { params: { page: 1, limit: 50 } }),
          api.get('/disputes/my', { params: { page: 1, limit: 50 } }),
        ])
        if (cancelled) return
        const bookings = bRes.data?.data || []
        const disputes = dRes.data?.data || []
        setNavBadges({
          '/physio/bookings': bookings.filter(bookingNeedsPhysioAction).length,
          '/physio/disputes': activeDisputeCount(disputes),
        })
      } catch {
        if (!cancelled) setNavBadges({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [platformApproved, location.pathname])

  const navItems = useMemo(() => {
    const lock = me && !platformApproved
    return baseNav.map((item) => ({
      ...item,
      disabled: lock && navLockedWhilePending(item.to),
      badgeCount: platformApproved ? navBadges[item.to] ?? 0 : 0,
    }))
  }, [me, platformApproved, navBadges])

  if (loadingMe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <AuthSpinner />
      </div>
    )
  }

  return (
    <AppShell
      brand="PhysioCare"
      badge="Physio"
      topBarTitle="Workspace"
      topBarSubtitle="Sessions, availability, and notes"
      navItems={navItems}
      headerActions={
        <Link
          to="/"
          className="hidden cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:inline-flex"
        >
          Home
        </Link>
      }
      sidebarFooter={
        <div className="space-y-2">
          <Link
            to="/"
            className="block rounded-xl py-2 text-center text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Marketing site
          </Link>
        </div>
      }
    >
      {me && !platformApproved && (
        <div
          className={`mb-8 overflow-hidden rounded-2xl border shadow-sm ${
            rejected
              ? 'border-red-200/90 bg-gradient-to-br from-red-50 to-white'
              : 'border-amber-200/90 bg-gradient-to-br from-amber-50 to-white'
          }`}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                rejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
              }`}
              aria-hidden
            >
              {rejected ? '⚠️' : '⏳'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`text-base font-semibold ${rejected ? 'text-red-950' : 'text-amber-950'}`}>
                {rejected ? 'Profile not approved' : 'Your profile is under approval'}
              </h2>
              {rejected ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-red-900/90">
                    Your application was <strong>rejected</strong>. Update your documents and details, then resubmit from
                    onboarding — or contact support if you need help.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to="/physio/onboarding"
                      className="inline-flex items-center justify-center rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
                    >
                      Review &amp; resubmit
                    </Link>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-900 transition hover:bg-red-50"
                    >
                      Edit profile
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
                    An admin is reviewing your application. <strong>Bookings, wallet, and availability</strong> stay
                    locked until you&apos;re approved. You can still update your profile and onboarding documents.
                  </p>
                  <p className="mt-3 text-xs font-medium text-amber-900/80">
                    Tip: complete every onboarding step to speed up review.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </AppShell>
  )
}
