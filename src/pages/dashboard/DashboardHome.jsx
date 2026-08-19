import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { getProfileCached } from '../../utils/profileCache'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { bookingStatusBadge } from './dashboardUtils'
import { formatBookingDateAndSlot } from '../../utils/date'
import { bookingConditionLabel } from '../../utils/bookingDisplay'
import { getTechniqueByIssue } from '../../constants/techniques'
import { pickNextSession, todayYmd, normalizeSessionRows, listSameDaySiblings } from '../../components/physio/physioBookingHelpers'
import ServicesSection from '../../components/dashboard/ServicesSection'
import { isProfileIncompleteError } from '../../utils/apiErrors'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

function SectionSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl" />
}

function isBookingActive(b) {
  return b?.status !== 'completed' && b?.sessionStatus !== 'completed' && b?.paymentStatus !== 'refunded'
}

/** Live / in-treatment plan — what patients see as “Plan Active”. */
function isPlanActive(b) {
  if (!isBookingActive(b)) return false
  if (b?.planStatus === 'live' || b?.planStatus === 'approved') return true
  return ['plan_live', 'physio_assigned', 'payment_recorded', 'in_treatment'].includes(b?.workflowStatus)
}

/** Sessions-left metric: live care plans + techniques that already have a physio. */
function countsTowardSessionsLeft(b) {
  if (!isPlanActive(b)) return false
  // technique_managed is born planStatus=live; don't count until staffed
  if (isTechniqueBooking(b) && !b?.physioId) return false
  return true
}

function isTechniqueBooking(b) {
  return (
    b?.carePath === 'technique_managed' ||
    b?.carePath === 'technique_direct' ||
    Boolean(getTechniqueByIssue(b?.issue))
  )
}

function estimateOutstanding(b) {
  if (!isBookingActive(b)) return 0
  const fromSummary = Number(b?.paymentSummary?.outstanding)
  if (Number.isFinite(fromSummary)) return Math.max(0, fromSummary)
  const total = Number(b?.totalAmount) || 0
  if (total <= 0) return 0
  const paidStatuses = new Set(['paid', 'held', 'released', 'collected', 'verified'])
  if (paidStatuses.has(b?.paymentStatus)) return 0
  return total
}

function sessionsLeftOnBooking(b) {
  const rows = normalizeSessionRows(b).filter((r) => !r.complimentary)
  if (!rows.length) {
    if (!isBookingActive(b)) return 0
    return 1
  }
  return rows.filter((r) => r.status !== 'completed' && r.status !== 'no_show').length
}

function careAssigneeLabel(b) {
  if (b?.physioId?.name) return b.physioId.name
  if (b?.managerId?.name) return `${b.managerId.name} (care manager)`
  if (b?.managerId) return 'Care manager assigning…'
  return 'Awaiting care team'
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2'

function CareList({ bookings, emptyTitle, emptyHint }) {
  if (!bookings.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-10 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">{emptyTitle}</p>
        <p className="text-xs text-slate-500">{emptyHint}</p>
      </div>
    )
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {bookings.map((b, idx) => {
        const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus, b.planStatus)
        const condition = bookingConditionLabel(b)
        const technique = isTechniqueBooking(b)
        return (
          <li key={b._id} className={idx < bookings.length - 1 ? 'border-b border-slate-100' : ''}>
            <Link
              to={`/dashboard/bookings/${b._id}`}
              className={`flex min-h-[44px] items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100 ${focusRing}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-teal-50">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                      technique
                        ? 'bg-orange-50 text-orange-900 ring-orange-200/80'
                        : 'bg-teal-50 text-teal-900 ring-teal-200/80'
                    }`}
                  >
                    {technique ? 'Technique' : 'Care plan'}
                  </span>
                  <p className="text-[13px] font-bold leading-snug text-slate-900">
                    {formatBookingDateAndSlot(b.date, b.timeSlot)}
                    {condition ? <span className="font-normal text-slate-500"> ({condition})</span> : null}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">{careAssigneeLabel(b)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}>
                  {st.label}
                </span>
                <svg
                  className="h-3.5 w-3.5 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function DashboardHome() {
  const [bookings, setBookings] = useState(null)
  const [disputes, setDisputes] = useState(null)
  const [profileFirstName, setProfileFirstName] = useState(null)

  const load = useCallback(async () => {
    try {
      const [bRes, dRes, profileWrap] = await Promise.all([
        api.get('/bookings/my', { params: { page: 1, limit: 40 } }),
        api.get('/disputes/my', { params: { page: 1, limit: 20 } }),
        getProfileCached(api, { force: false }).catch(() => null),
      ])
      setBookings(bRes.data?.data || [])
      setDisputes(dRes.data?.data || [])
      const raw = profileWrap?.data?.name?.trim()
      setProfileFirstName(raw ? raw.split(/\s+/)[0] : null)
    } catch (err) {
      setBookings([])
      setDisputes([])
      setProfileFirstName(null)
      // Incomplete profile is handled by ProfileCompletionGate — not a dashboard failure.
      if (!isProfileIncompleteError(err)) {
        toast.error('Could not load dashboard')
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = bookings === null || disputes === null
  const today = todayYmd()

  const firstName = useMemo(() => {
    if (profileFirstName) return profileFirstName
    const raw = bookings?.[0]?.userId?.name?.trim()
    if (!raw) return null
    return raw.split(/\s+/)[0]
  }, [profileFirstName, bookings])

  const openDisputes = (disputes || []).filter((d) => d.status === 'open' || d.status === 'under_review').length

  const nextSession = useMemo(() => pickNextSession(bookings || [], today), [bookings, today])

  const sameDaySiblings = useMemo(
    () => listSameDaySiblings(bookings || [], nextSession, today),
    [bookings, nextSession, today],
  )

  const activeBookings = useMemo(() => (bookings || []).filter(isBookingActive), [bookings])

  const inCare = Boolean(nextSession) || activeBookings.length > 0

  const primaryCareBooking = useMemo(() => {
    const carePlans = activeBookings.filter((b) => !isTechniqueBooking(b))
    if (carePlans.length) {
      return [...carePlans].sort((a, b) =>
        String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')),
      )[0]
    }
    return nextSession?.booking || activeBookings[0] || null
  }, [nextSession, activeBookings])

  const sessionsLeft = useMemo(() => {
    const live = activeBookings.filter(countsTowardSessionsLeft)
    return live.reduce((sum, b) => sum + sessionsLeftOnBooking(b), 0)
  }, [activeBookings])

  const sessionsLeftLabel = useMemo(() => {
    const live = activeBookings.filter(countsTowardSessionsLeft)
    const carePlans = live.filter((b) => !isTechniqueBooking(b))
    const techniques = live.filter((b) => isTechniqueBooking(b))
    const careLeft = carePlans.reduce((sum, b) => sum + sessionsLeftOnBooking(b), 0)
    const techLeft = techniques.reduce((sum, b) => sum + sessionsLeftOnBooking(b), 0)

    if (carePlans.length && techniques.length) {
      return `Care ${careLeft} · Technique ${techLeft}`
    }
    if (carePlans.length === 1) return bookingConditionLabel(carePlans[0]) || 'Care plan'
    if (carePlans.length > 1) return `${carePlans.length} care plans`
    if (techniques.length === 1) return bookingConditionLabel(techniques[0]) || 'Technique'
    if (techniques.length > 1) return `${techniques.length} technique visits`
    if (primaryCareBooking) return bookingConditionLabel(primaryCareBooking) || 'On your plan'
    return 'No active plan'
  }, [activeBookings, primaryCareBooking])

  const amountDue = useMemo(() => {
    return (bookings || []).reduce((sum, b) => sum + estimateOutstanding(b), 0)
  }, [bookings])

  const myCareList = useMemo(() => {
    const all = [...(bookings || [])]
    const byRecent = (a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))

    const activePlans = all.filter(isPlanActive).sort(byRecent)
    if (activePlans.length >= 2) return activePlans.slice(0, 2)
    if (activePlans.length === 1) {
      // One active plan + newest non-active open case (if any)
      const filler = all.filter((b) => !isPlanActive(b) && isBookingActive(b)).sort(byRecent)
      return [...activePlans, ...filler].slice(0, 2)
    }
    // No active plans — show up to 2 open (non-completed) cases
    return all.filter(isBookingActive).sort(byRecent).slice(0, 2)
  }, [bookings])

  const isToday = nextSession && String(nextSession.row.date) === today

  const todayStr = useMemo(
    () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  )

  const heroAssignee = nextSession
    ? nextSession.booking.physioId?.name
      ? {
          name: nextSession.booking.physioId.name,
          detail: `${nextSession.booking.physioId.specialization || 'Verified Physiotherapist'} · ${
            nextSession.booking.serviceType === 'online'
              ? 'Online'
              : nextSession.booking.serviceType === 'clinic'
                ? 'Clinic'
                : 'At Home'
          }`,
        }
      : nextSession.booking.managerId?.name
        ? {
            name: nextSession.booking.managerId.name,
            detail: 'Care manager · assigning your physiotherapist',
          }
        : {
            name: 'Care team assigning…',
            detail:
              nextSession.booking.serviceType === 'online'
                ? 'Online visit'
                : nextSession.booking.serviceType === 'clinic'
                  ? 'Clinic visit'
                  : 'Home visit',
          }
    : null

  return (
    <div className="space-y-4 md:space-y-5">
      {loading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          <header>
            <p className="type-section-title text-teal-700">{firstName ? `Hi, ${firstName}` : 'Home'}</p>
            <h1 className="type-page-title mt-1">{todayStr}</h1>
          </header>

          {openDisputes > 0 && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm">
              <strong>{openDisputes}</strong> open dispute{openDisputes === 1 ? '' : 's'} —{' '}
              <Link to="/dashboard/disputes" className="font-semibold text-amber-950 underline-offset-2 hover:underline">
                Review
              </Link>
            </div>
          )}

          {nextSession ? (
            <Link
              to={`/dashboard/bookings/${nextSession.booking._id}`}
              className={`relative block overflow-hidden rounded-2xl bg-teal-600 p-5 shadow-[0_8px_32px_rgba(13,148,136,0.22)] transition active:opacity-95 ${focusRing}`}
              aria-label="View upcoming session details"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" aria-hidden />
              <div className="pointer-events-none absolute -bottom-14 -left-5 h-28 w-28 rounded-full bg-white/6" aria-hidden />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    Upcoming session
                  </span>
                  <p className="mt-2 text-sm font-bold leading-snug text-white">
                    {formatBookingDateAndSlot(nextSession.row.date, nextSession.row.time)}
                    {bookingConditionLabel(nextSession.booking) ? (
                      <span className="font-semibold text-teal-100/95">
                        {' '}
                        ({bookingConditionLabel(nextSession.booking)})
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-200">
                    {isToday ? 'Today' : 'Scheduled'}
                  </span>
                </span>
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-3 rounded-xl border border-white/5 bg-white/8 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{heroAssignee?.name}</p>
                  <p className="text-[11px] text-white/85">{heroAssignee?.detail}</p>
                </div>
              </div>

              <p className="relative z-10 mt-3 text-[11px] font-medium text-white/90">
                Tap for details, notes, and payment
                {sameDaySiblings.length > 0
                  ? ` · +${sameDaySiblings.length} more visit${sameDaySiblings.length === 1 ? '' : 's'} this day`
                  : ''}
              </p>
            </Link>
          ) : null}

          {sameDaySiblings.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Also {isToday ? 'today' : 'that day'}
              </p>
              {sameDaySiblings.map((item) => {
                const technique = isTechniqueBooking(item.booking)
                const assignee = careAssigneeLabel(item.booking)
                return (
                  <Link
                    key={`${item.booking._id}-${item.row.sessionId || item.row.key || item.row.n}`}
                    to={`/dashboard/bookings/${item.booking._id}`}
                    className={`flex min-h-[44px] items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 shadow-sm transition hover:bg-teal-50 ${focusRing}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                            technique
                              ? 'bg-orange-50 text-orange-900 ring-orange-200/80'
                              : 'bg-teal-50 text-teal-900 ring-teal-200/80'
                          }`}
                        >
                          {technique ? 'Technique' : 'Care plan'}
                        </span>
                        <p className="text-[13px] font-bold text-slate-900">
                          {formatBookingDateAndSlot(item.row.date, item.row.time)}
                          {bookingConditionLabel(item.booking) ? (
                            <span className="font-normal text-slate-500">
                              {' '}
                              ({bookingConditionLabel(item.booking)})
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{assignee}</p>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          ) : null}

          {!nextSession ? (
            <Link
              to="/book"
              className={`flex min-h-[44px] items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md active:opacity-90 ${focusRing}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-teal-700">Book an appointment</p>
                <p className="text-xs text-slate-500">Help is one tap away — verified physiotherapists near you</p>
              </div>
              <svg
                className="h-4 w-4 text-slate-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ) : null}

          {inCare ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sessions left</p>
                <p className="type-stat mt-2 text-slate-900">{sessionsLeft}</p>
                <p className="mt-1 text-[11px] text-slate-500">{sessionsLeftLabel}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                {amountDue > 0.009 ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount due</p>
                    <p className="type-stat mt-2 text-slate-900">{formatInr(amountDue)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Across open cases</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment</p>
                    <p className="type-stat mt-2 text-emerald-700">On track</p>
                    <p className="mt-1 text-[11px] text-slate-500">Nothing due right now</p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {inCare ? (
            <>
              <section aria-labelledby="my-care-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id="my-care-heading" className="text-sm font-bold text-slate-900">
                    My care
                  </h2>
                  <Link
                    to="/dashboard/bookings"
                    className={`text-xs font-bold text-teal-700 hover:text-teal-800 ${focusRing} rounded-sm`}
                  >
                    See all
                  </Link>
                </div>
                <CareList
                  bookings={myCareList}
                  emptyTitle="No care cases yet"
                  emptyHint="Your visits and plans will appear here"
                />
              </section>

              <ServicesSection
                variant="compact"
                title="Need something else?"
                intro="Add cupping, needling, or a new concern — your care team can help."
              />
            </>
          ) : (
            <>
              <ServicesSection />

              <section aria-labelledby="my-care-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id="my-care-heading" className="text-sm font-bold text-slate-900">
                    My care
                  </h2>
                  <Link
                    to="/dashboard/bookings"
                    className={`text-xs font-bold text-teal-700 hover:text-teal-800 ${focusRing} rounded-sm`}
                  >
                    See all
                  </Link>
                </div>
                <CareList
                  bookings={myCareList}
                  emptyTitle="No bookings yet"
                  emptyHint="Book a visit and your history will show up here"
                />
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
