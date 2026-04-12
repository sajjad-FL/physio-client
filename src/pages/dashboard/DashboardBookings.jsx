import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { bookingStatusBadge, paymentBadge } from './dashboardUtils'
import { matchesPatientBookingFilter } from './bookingFilterUtils'
import EmptyState from '../../components/ui/EmptyState'
import { formatBookingDateAndSlot } from '../../utils/date'
import { todayYmd } from '../../components/physio/physioBookingHelpers'
import PatientBookingsFilterDrawer from '../../components/dashboard/PatientBookingsFilterDrawer'

function BookingRowSkeleton() {
  return <div className="h-[3.25rem] animate-pulse rounded-xl border border-slate-100 bg-slate-100/60" />
}

const FILTER_LABELS = {
  all: 'All',
  today: 'Today',
  upcoming: 'Upcoming',
  past: 'Past',
  range: 'Date range',
}

export default function DashboardBookings() {
  const [bookings, setBookings] = useState(null)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my', { params: { page: 1, limit: 100 } })
      setBookings(res.data?.data || [])
    } catch {
      toast.error('Could not load bookings')
      setBookings([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const today = todayYmd()

  const filtered = useMemo(() => {
    if (!bookings?.length) return []
    return bookings.filter((b) => matchesPatientBookingFilter(b, { filter, dateRange, today }))
  }, [bookings, filter, dateRange, today])

  const loading = bookings === null
  const totalLoaded = bookings?.length ?? 0

  function applyFilters(nextFilter, nextRange) {
    setFilter(nextFilter)
    setDateRange(nextFilter === 'range' ? nextRange : null)
  }

  const filterSummary =
    filter === 'range' && dateRange?.[0] && dateRange?.[1]
      ? `${FILTER_LABELS.range} · ${dateRange[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${dateRange[1].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : FILTER_LABELS[filter] || filter

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Sessions and payment status.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
        </div>
      ) : totalLoaded === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Book a session to see it here."
          icon={
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
              />
            </svg>
          }
        >
          <Link
            to="/book"
            className="tap-feedback flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 sm:w-auto"
          >
            Book your first session
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold tabular-nums text-slate-900">{filtered.length}</span>
              <span className="text-slate-400"> / </span>
              <span className="tabular-nums text-slate-500">{totalLoaded}</span>
              <span className="ml-2 text-xs text-slate-400">· {filterSummary}</span>
            </p>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="tap-feedback inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              Filters
            </button>
          </div>

          {filterOpen && (
            <PatientBookingsFilterDrawer
              onClose={() => setFilterOpen(false)}
              filter={filter}
              onFilterChange={applyFilters}
              dateRange={dateRange}
            />
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-900">No bookings match this filter</p>
              <p className="mt-2 text-sm text-slate-500">
                {filter === 'range' && (!dateRange?.[0] || !dateRange?.[1])
                  ? 'Pick a start and end date in filters.'
                  : 'Try another filter or book a new session.'}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => applyFilters('all', null)}
                  className="tap-feedback min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Show all
                </button>
                <Link
                  to="/book"
                  className="tap-feedback flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
                >
                  Book session
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((b) => {
                const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
                const pay = paymentBadge(b.paymentStatus)
                return (
                  <li key={b._id}>
                    <Link
                      to={`/dashboard/bookings/${b._id}`}
                      className="tap-feedback flex min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 ring-1 ring-slate-100/60 transition active:bg-slate-50 sm:px-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {formatBookingDateAndSlot(b.date, b.timeSlot)}
                        </p>
                        <p className="truncate text-xs text-slate-500">{b.physioId?.name ?? 'Physio'}</p>
                        <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pay.cls}`}>{pay.label}</span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
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
        </>
      )}
    </div>
  )
}
