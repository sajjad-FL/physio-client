import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { getProfileCached } from '../../utils/profileCache'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { bookingStatusBadge } from './dashboardUtils'
import { formatBookingDateAndSlot } from '../../utils/date'
import { bookingConditionLabel } from '../../utils/bookingDisplay'
import { pickNextSession, todayYmd } from '../../components/physio/physioBookingHelpers'
import ServicesSection from '../../components/dashboard/ServicesSection'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

function SectionSkeleton() {
  return <Skeleton className="h-32 w-full rounded-2xl" />
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

  const todayStr = useMemo(
    () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  )

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
          {/* ── Dashboard header — matching mobile DashboardHomeScreen ── */}
          <header>
            <p className="type-section-title text-teal-700">
              {firstName ? `Hi, ${firstName.toUpperCase()}` : 'DASHBOARD'}
            </p>
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

          {/* ── Next session — teal hero card matching mobile ── */}
          {nextSession ? (
            <Link
              to={`/dashboard/bookings/${nextSession.booking._id}`}
              className="relative block overflow-hidden rounded-2xl bg-teal-600 p-5 shadow-[0_8px_32px_rgba(13,148,136,0.22)] transition active:opacity-95"
              aria-label="View upcoming session details"
            >
              {/* Glow bubbles */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10" aria-hidden />
              <div className="pointer-events-none absolute -bottom-14 -left-5 h-28 w-28 rounded-full bg-white/6" aria-hidden />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-300">
                    {isToday ? 'Today' : 'Scheduled'}
                  </span>
                </span>
              </div>

              {/* Physio details box */}
              <div className="relative z-10 mt-3 flex items-center gap-3 rounded-xl border border-white/5 bg-white/8 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-white">
                    {nextSession.booking.physioId?.name || 'Physiotherapist TBD'}
                  </p>
                  <p className="text-[9px] text-white/70">
                    {nextSession.booking.physioId?.specialization || 'Verified Physiotherapist'} ·{' '}
                    {nextSession.booking.serviceType === 'online' ? 'Online' : 'At Home'}
                  </p>
                </div>
              </div>

            </Link>
          ) : (
            /* Book CTA when no upcoming session */
            <Link
              to="/book"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md active:opacity-90"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-teal-700">Book an appointment</p>
                <p className="text-xs text-slate-500">Find a verified physiotherapist near you</p>
              </div>
              <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </Link>
          )}

          {/* ── Stats row — matching mobile 2-card layout ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Sessions</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
              </div>
              <p className="type-stat mt-2 text-slate-900">{(bookings || []).length}</p>
              <p className="mt-1 text-[11px] text-slate-400">all time</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Paid</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                </div>
              </div>
              <p className="type-stat mt-2 text-slate-900">{formatInr(revenueTotal)}</p>
              <p className="mt-1 text-[11px] text-slate-400">all time</p>
            </div>
          </div>
        </>
      )}

      {!loading ? (
        <>
          {/* ── Services / Book by Need ── */}
          <ServicesSection />

          {/* ── Recent activity ── */}
          <section aria-labelledby="activity-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <h2 id="activity-heading" className="text-sm font-bold text-slate-900">
                  Recent activity
                </h2>
              </div>
              <Link to="/dashboard/bookings" className="text-xs font-bold text-teal-700 hover:text-teal-800">
                See all
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-10 shadow-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <p className="text-sm font-semibold text-slate-400">No bookings yet</p>
                <p className="text-xs text-slate-400">Your session history will appear here</p>
              </div>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                {recentActivity.map((b, idx) => {
                  const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus, b.planStatus)
                  const condition = bookingConditionLabel(b)
                  return (
                    <li key={b._id} className={idx < recentActivity.length - 1 ? 'border-b border-slate-100' : ''}>
                      <Link
                        to={`/dashboard/bookings/${b._id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-teal-50">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold leading-snug text-slate-900">
                            {formatBookingDateAndSlot(b.date, b.timeSlot)}
                            {condition ? (
                              <span className="font-normal text-slate-500"> ({condition})</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{b.physioId?.name ?? 'Physiotherapist'}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                          <svg className="h-3.5 w-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
