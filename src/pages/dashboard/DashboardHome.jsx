import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { getProfileCached } from '../../utils/profileCache'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { bookingStatusBadge, paymentBadge } from './dashboardUtils'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'
import { normalizeSessionRows, todayYmd } from '../../components/physio/physioBookingHelpers'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

function pickNextSession(bookings, today) {
  const items = []
  for (const b of bookings || []) {
    if (b.sessionStatus === 'completed') continue
    for (const r of normalizeSessionRows(b)) {
      const d = String(r.date || '')
      if (d >= today) {
        items.push({ booking: b, row: r })
      }
    }
  }
  items.sort(
    (a, b) =>
      String(a.row.date).localeCompare(String(b.row.date)) || String(a.row.time).localeCompare(String(b.row.time)),
  )
  return items[0] || null
}

function SectionSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl" />
}

const btnSoftPrimary =
  'tap-feedback inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition ' +
  'bg-teal-50 text-teal-900 ring-1 ring-teal-200/70 hover:bg-teal-100/90 hover:ring-teal-300/60'

const btnPrimaryBook =
  'tap-feedback inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700'

const btnSoftEmerald =
  'tap-feedback inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition ' +
  'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70 hover:bg-emerald-100/90 hover:ring-emerald-300/55'

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
    } catch {
      toast.error('Could not load dashboard')
      setBookings([])
      setDisputes([])
      setProfileFirstName(null)
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

  const revenueTotal = useMemo(() => {
    return (bookings || []).reduce((sum, b) => {
      const amt = Number(b.totalAmount) || 0
      if (!amt) return sum
      const paid = b.paymentStatus === 'released' || b.paymentStatus === 'held' || b.paymentStatus === 'paid'
      return paid ? sum + amt : sum
    }, 0)
  }, [bookings])

  const recentActivity = useMemo(() => {
    return [...(bookings || [])]
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 5)
  }, [bookings])

  const isToday = nextSession && String(nextSession.row.date) === today

  return (
    <div className="space-y-4 sm:space-y-5">
      {loading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <>
          <header className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {firstName ? `Hi, ${firstName}` : 'Your care'}
            </h1>
          </header>

          {openDisputes > 0 && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm">
              <strong>{openDisputes}</strong> open dispute{openDisputes === 1 ? '' : 's'} —{' '}
              <Link to="/dashboard/disputes" className="font-semibold text-amber-950 underline-offset-2 hover:underline">
                Review
              </Link>
            </div>
          )}

          {/* Next session */}
          <section
            aria-labelledby="next-heading"
            className="rounded-2xl bg-gradient-to-br from-slate-50/95 via-white to-sky-50/30 p-4 sm:p-5"
          >
            <h2 id="next-heading" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next session
            </h2>
            {nextSession ? (
              <>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
                  {isToday ? formatBookingTimeSlot(nextSession.row.time) : formatBookingDateAndSlot(nextSession.row.date, nextSession.row.time)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{isToday ? 'Today' : 'Scheduled'}</p>
                <p className="mt-3 truncate text-sm font-medium text-slate-800">
                  {nextSession.booking.physioId?.name || 'Physiotherapist TBD'}
                </p>
                <div className="mt-4 flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Link to={`/dashboard/bookings/${nextSession.booking._id}`} className={`${btnPrimaryBook} w-full justify-center sm:w-auto sm:min-w-32`}>
                    View details
                  </Link>
                  {nextSession.booking.physioId?.phone ? (
                    <a
                      href={`tel:${String(nextSession.booking.physioId.phone).replace(/\s/g, '')}`}
                      className="tap-feedback flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto sm:min-w-32"
                    >
                      Call
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No upcoming sessions.</p>
            )}
            <div className="mt-4 flex justify-start">
              <Link to="/book" className={btnSoftPrimary}>
                Book a session
              </Link>
            </div>
          </section>

          {/* Wallet summary */}
          <section className="rounded-2xl bg-gradient-to-br from-slate-50/95 via-white to-emerald-50/25 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Care spend</h2>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl">{formatInr(revenueTotal)}</p>
            <p className="mt-2 text-sm text-slate-500">Held and released payments across your bookings.</p>
            <div className="mt-4 flex justify-start">
              <Link to="/dashboard/wallet" className={btnSoftEmerald}>
                Open wallet
              </Link>
            </div>
          </section>

          {/* Recent activity */}
          <section aria-labelledby="activity-heading">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 id="activity-heading" className="text-sm font-semibold text-slate-900">
                Recent activity
              </h2>
              <Link to="/dashboard/bookings" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                All bookings
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                Nothing here yet. Book a session to see updates.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((b) => {
                  const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
                  const pay = paymentBadge(b.paymentStatus)
                  return (
                    <li key={b._id}>
                      <Link
                        to={`/dashboard/bookings/${b._id}`}
                        className="tap-feedback flex min-h-13 items-center justify-between gap-3 rounded-xl bg-white/90 px-3 py-3 shadow-sm ring-1 ring-slate-200/40 transition hover:bg-white active:bg-slate-50/80 sm:px-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {formatBookingDateAndSlot(b.date, b.timeSlot)}
                          </p>
                          <p className="truncate text-xs text-slate-500">{b.physioId?.name ?? 'Physio'}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pay.cls}`}>{pay.label}</span>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
