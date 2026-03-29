import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { bookingStatusBadge, disputeStatusBadge, paymentBadge } from './dashboardUtils'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import { normalizeSessionRows, todayYmd } from '../../components/physio/physioBookingHelpers'

function StatSkeleton() {
  return <Skeleton className="h-40 w-full rounded-2xl" />
}

function isUpcomingBooking(b, today) {
  if (b.sessionStatus === 'completed') return false
  if (String(b.date || '') >= today) return true
  return normalizeSessionRows(b).some((r) => String(r.date || '') >= today)
}

function buildTodaySessionItems(bookings, today) {
  const items = []
  for (const b of bookings || []) {
    for (const r of normalizeSessionRows(b)) {
      if (r.date === today) {
        items.push({ booking: b, row: r, key: `${b._id}-${r.key}` })
      }
    }
  }
  return items.sort((a, b) => String(a.row.time).localeCompare(String(b.row.time)))
}

/** Prefer first session today that isn’t fully completed, else first slot. */
function pickFeaturedToday(items) {
  if (!items?.length) return null
  const open = items.find(({ booking: b }) => b.sessionStatus !== 'completed')
  return open || items[0]
}

const iconCalendarStat = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
    />
  </svg>
)
const iconSpark = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z"
    />
  </svg>
)
const iconCurrency = (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v12m-3-3h.015a3 3 0 004.5-2.25M12 6v-.75a2.25 2.25 0 114.5 0V6M9 18h.375a2.25 2.25 0 002.25-2.25V15"
    />
  </svg>
)

const btnPrimary =
  'inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl active:scale-[0.98] sm:min-h-11 sm:w-auto sm:px-8 sm:text-sm'
const btnSecondary =
  'inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-5 py-3.5 text-base font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/80 hover:shadow-md active:scale-[0.98] sm:min-h-11 sm:w-auto sm:px-8 sm:text-sm'

export default function DashboardHome() {
  const [bookings, setBookings] = useState(null)
  const [disputes, setDisputes] = useState(null)

  const load = useCallback(async () => {
    try {
      const [bRes, dRes] = await Promise.all([
        api.get('/bookings/my', { params: { page: 1, limit: 40 } }),
        api.get('/disputes/my', { params: { page: 1, limit: 20 } }),
      ])
      setBookings(bRes.data?.data || [])
      setDisputes(dRes.data?.data || [])
    } catch {
      toast.error('Could not load dashboard')
      setBookings([])
      setDisputes([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = bookings === null || disputes === null
  const today = todayYmd()

  const firstName = useMemo(() => {
    const raw = bookings?.[0]?.userId?.name?.trim()
    if (!raw) return null
    return raw.split(/\s+/)[0]
  }, [bookings])

  const openDisputes = (disputes || []).filter((d) => d.status === 'open' || d.status === 'under_review').length

  const upcomingCount = useMemo(() => {
    return (bookings || []).filter((b) => isUpcomingBooking(b, today)).length
  }, [bookings, today])

  const todayItems = useMemo(() => buildTodaySessionItems(bookings || [], today), [bookings, today])
  const featuredToday = useMemo(() => pickFeaturedToday(todayItems), [todayItems])
  const moreTodayCount = todayItems.length > 1 ? todayItems.length - 1 : 0

  const revenueTotal = useMemo(() => {
    return (bookings || []).reduce((sum, b) => {
      const amt = Number(b.totalAmount) || 0
      if (!amt) return sum
      const paid = b.paymentStatus === 'released' || b.paymentStatus === 'held' || b.paymentStatus === 'paid'
      return paid ? sum + amt : sum
    }, 0)
  }, [bookings])

  const viewTodayHref = featuredToday
    ? `/dashboard/bookings/${featuredToday.booking._id}`
    : '/dashboard/bookings'

  return (
    <div className="space-y-8 sm:space-y-10">
      {loading && (
        <div className="animate-pulse rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-100/80 to-white px-5 py-8 sm:px-8">
          <div className="h-4 w-28 rounded bg-gray-200/90" />
          <div className="mt-3 h-9 w-full max-w-sm rounded-lg bg-gray-200/80" />
          <div className="mt-4 h-4 w-full max-w-md rounded bg-gray-100" />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="h-12 flex-1 rounded-2xl bg-gray-200/70" />
            <div className="h-12 flex-1 rounded-2xl bg-gray-100" />
          </div>
        </div>
      )}

      {/* —— Hero —— */}
      {!loading && (
        <section className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 px-5 py-8 shadow-sm ring-1 ring-gray-100 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="relative space-y-6">
            <div>
              <p className="text-sm font-medium text-blue-600">Your care dashboard</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Hello{firstName ? `, ${firstName}` : ''}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600 sm:text-base">
                {featuredToday ? (
                  <>
                    <span className="font-semibold text-gray-900">Today:</span>{' '}
                    {formatBookingTimeSlot(featuredToday.row.time)}
                    {featuredToday.booking.physioId?.name && (
                      <> · with {featuredToday.booking.physioId.name}</>
                    )}
                  </>
                ) : (
                  <>No session on your calendar for today.</>
                )}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {featuredToday
                  ? 'Review details or reach your physiotherapist below.'
                  : 'Book a visit or check your full schedule anytime.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <Link to={viewTodayHref} className={btnPrimary}>
                View Today&apos;s Session
              </Link>
              <Link to="/book" className={btnSecondary}>
                Book New Session
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* —— Today’s session (priority) —— */}
      {!loading && (
        <section id="todays-session" aria-labelledby="today-session-heading" className="scroll-mt-4">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 id="today-session-heading" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              Today&apos;s session
            </h2>
            <p className="mt-1 text-sm text-gray-500">Your next steps for care today.</p>
          </div>

          {featuredToday ? (
            <div className="overflow-hidden rounded-3xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-white to-indigo-50/40 p-5 shadow-md ring-1 ring-blue-100/80 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Today
                </span>
                {moreTodayCount > 0 && (
                  <Link
                    to="/dashboard/bookings"
                    className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
                  >
                    +{moreTodayCount} more today
                  </Link>
                )}
              </div>
              <p className="mt-5 text-3xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-4xl">
                {formatBookingTimeSlot(featuredToday.row.time)}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Session time</p>
              <div className="mt-6 space-y-4 border-t border-blue-100/80 pt-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Physiotherapist</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {featuredToday.booking.physioId?.name || 'Assigning…'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">What we&apos;re treating</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-gray-800">{featuredToday.booking.issue}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  to={`/dashboard/bookings/${featuredToday.booking._id}`}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] sm:min-h-[3rem] sm:text-sm"
                >
                  View details
                </Link>
                {featuredToday.booking.physioId?.phone ? (
                  <a
                    href={`tel:${String(featuredToday.booking.physioId.phone).replace(/\s/g, '')}`}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-5 py-3.5 text-base font-semibold text-gray-900 shadow-sm transition-all hover:border-blue-200 hover:bg-white active:scale-[0.98] sm:min-h-[3rem] sm:text-sm"
                  >
                    Call
                  </a>
                ) : (
                  <span className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 px-5 py-3.5 text-sm text-gray-500">
                    Phone unavailable
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/90 px-5 py-10 text-center sm:px-8">
              <p className="font-medium text-gray-900">Nothing scheduled for today</p>
              <p className="mt-2 text-sm text-gray-500">Book a session to see it here first.</p>
              <Link to="/book" className={`${btnPrimary} mt-6 max-w-xs sm:mx-auto`}>
                Book New Session
              </Link>
            </div>
          )}
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <section aria-labelledby="stats-heading">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 id="stats-heading" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              At a glance
            </h2>
            <p className="mt-1 text-sm text-gray-500">Quick numbers from your account.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/90 via-white to-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600/90">Total bookings</p>
                  <p className="mt-1 text-xs text-gray-500">All visits on file</p>
                </div>
                <span className="rounded-2xl bg-blue-100/90 p-3 text-blue-600 transition-transform duration-300 group-hover:scale-105">
                  {iconCalendarStat}
                </span>
              </div>
              <p className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-5xl">{bookings.length}</p>
            </div>
            <div className="group rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/80 via-white to-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-700/90">Upcoming</p>
                  <p className="mt-1 text-xs text-gray-500">Future appointments</p>
                </div>
                <span className="rounded-2xl bg-violet-100/90 p-3 text-violet-600 transition-transform duration-300 group-hover:scale-105">
                  {iconSpark}
                </span>
              </div>
              <p className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-5xl">{upcomingCount}</p>
            </div>
            <div className="group rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:col-span-2 lg:col-span-1 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/90">Care spend</p>
                  <p className="mt-1 text-xs text-gray-500">Held & released payments</p>
                </div>
                <span className="rounded-2xl bg-emerald-100/90 p-3 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
                  {iconCurrency}
                </span>
              </div>
              <p className="mt-6 text-4xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-5xl">
                ₹{revenueTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </section>
      )}

      {!loading && openDisputes > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 shadow-sm sm:px-6">
          <strong>{openDisputes}</strong> open dispute{openDisputes === 1 ? '' : 's'} —{' '}
          <Link to="/dashboard/disputes" className="font-semibold text-amber-950 underline-offset-2 hover:underline">
            Review
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <section aria-labelledby="recent-heading">
          <div className="mb-4 flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="recent-heading" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                Recent bookings
              </h2>
              <p className="mt-1 text-sm text-gray-500">Tap a card for full details and payment status.</p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              See all →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {bookings.slice(0, 4).map((b) => {
              const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
              const pay = paymentBadge(b.paymentStatus)
              return (
                <li key={b._id}>
                  <Link
                    to={`/dashboard/bookings/${b._id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100/90 bg-white shadow-sm ring-1 ring-gray-100/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/10"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-5 py-4 sm:px-6">
                      <p className="text-base font-semibold text-gray-900 sm:text-[17px]">
                        {formatBookingDateAndSlot(b.date, b.timeSlot)}
                      </p>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.cls}`}>
                          {st.label}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${pay.cls}`}>
                          {pay.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
                      <p className="line-clamp-2 text-[15px] leading-relaxed text-gray-700">{b.issue}</p>
                      <p className="mt-4 text-sm font-semibold text-gray-900">
                        {b.physioId?.name || <span className="font-normal text-gray-500">Assigning…</span>}
                      </p>
                      <SessionProgressTracker booking={b} variant="mini" />
                      <span className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-gray-100 bg-gray-50 py-3 text-base font-semibold text-blue-700 transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-50 sm:min-h-11 sm:text-sm">
                        View details
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!loading && disputes.length > 0 && (
        <section aria-labelledby="disputes-heading" className="border-t border-gray-100 pt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="disputes-heading" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                Disputes
              </h2>
              <p className="mt-1 text-sm text-gray-500">Cases you&apos;ve raised or that need attention.</p>
            </div>
            <Link
              to="/dashboard/disputes"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              See all →
            </Link>
          </div>
          <ul className="space-y-3">
            {disputes.slice(0, 3).map((d) => {
              const st = disputeStatusBadge(d.status)
              return (
                <li key={d._id}>
                  <Link
                    to="/dashboard/disputes"
                    className="flex min-h-[3.5rem] flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm ring-1 ring-gray-100/80 transition-all duration-200 hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{d.reason}</p>
                      <p className="text-xs text-gray-500">{d.raisedBy === 'physio' ? 'From physio' : 'Your case'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${st.cls}`}>
                      {st.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
