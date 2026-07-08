import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { bookingStatusBadge, paymentBadge } from './dashboardUtils'
import { matchesPatientBookingFilter, sortPatientBookingsLatestFirst } from './bookingFilterUtils'
import EmptyState from '../../components/ui/EmptyState'
import { formatBookingDateAndSlot } from '../../utils/date'
import { bookingConditionLabel } from '../../utils/bookingDisplay'
import { todayYmd } from '../../components/physio/physioBookingHelpers'
import PatientBookingsFilterDrawer from '../../components/dashboard/PatientBookingsFilterDrawer'
import PatientBookingsToolbar from '../../components/dashboard/PatientBookingsToolbar'

function BookingRowSkeleton() {
  return <div className="h-20 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-100/80" />
}

function physioInitial(name) {
  const s = (name || 'P').trim()
  return s ? s.slice(0, 1).toUpperCase() : 'P'
}

function servicePillClass(serviceType) {
  return serviceType === 'online'
    ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
    : 'bg-teal-50 text-teal-800 ring-teal-200/80'
}

function rowAccentClass(st, pay) {
  if (st.label === 'Completed') return 'border-l-emerald-500'
  if (st.label === 'Plan Active' || pay.label === 'Payment Secured') return 'border-l-teal-500'
  if (st.label === 'Awaiting care team') return 'border-l-slate-400'
  if (pay.label === 'Awaiting Payment') return 'border-l-amber-500'
  if (st.label === 'Consent to Plan') return 'border-l-orange-500'
  return 'border-l-teal-400'
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
  const [search, setSearch] = useState('')

  const deferredSearch = useDeferredValue(search)

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
    let list = bookings.filter((b) => matchesPatientBookingFilter(b, { filter, dateRange, today }))
    const q = deferredSearch.trim().toLowerCase()
    if (q) {
      list = list.filter((b) => {
        const blob = [
          b.physioId?.name,
          b.issue,
          formatBookingDateAndSlot(b.date, b.timeSlot),
          b.serviceType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return blob.includes(q)
      })
    }
    return sortPatientBookingsLatestFirst(list)
  }, [bookings, filter, dateRange, today, deferredSearch])

  const loading = bookings === null
  const totalLoaded = bookings?.length ?? 0
  const filtersActive = filter !== 'all' || Boolean(dateRange?.[0] && dateRange?.[1])

  function applyFilters(nextFilter, nextRange) {
    setFilter(nextFilter)
    setDateRange(nextFilter === 'range' ? nextRange : null)
  }

  const filterSummary =
    filter === 'range' && dateRange?.[0] && dateRange?.[1]
      ? `${dateRange[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${dateRange[1].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : FILTER_LABELS[filter] || filter

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="type-page-title text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Search, filter — open a session for details and payment.</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
        </div>
      ) : totalLoaded === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Book an appointment to see it here."
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
            Book your first appointment
          </Link>
        </EmptyState>
      ) : (
        <>
          <section
            className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80 sm:p-4"
            aria-label="Search and filters"
          >
            <PatientBookingsToolbar
              search={search}
              onSearchChange={setSearch}
              onFilterClick={() => setFilterOpen(true)}
              filtersActive={filtersActive}
            />
            <p className="mt-3 text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of {totalLoaded}
              {filtersActive ? <span className="text-gray-400"> · Filters on</span> : null}
              {!filtersActive && filterSummary !== 'All' ? (
                <span className="text-gray-400"> · {filterSummary}</span>
              ) : null}
            </p>
          </section>

          {filterOpen && (
            <PatientBookingsFilterDrawer
              onClose={() => setFilterOpen(false)}
              filter={filter}
              onFilterChange={applyFilters}
              dateRange={dateRange}
            />
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center">
              <p className="text-sm font-medium text-gray-900">No bookings match your search or filter</p>
              <p className="mt-2 text-sm text-gray-500">Try different keywords or clear filters.</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    applyFilters('all', null)
                  }}
                  className="tap-feedback min-h-11 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  Clear all
                </button>
                <Link
                  to="/book"
                  className="tap-feedback flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
                >
                  Book appointment
                </Link>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((b) => {
                const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus, b.planStatus)
                const pay = paymentBadge(b.paymentStatus)
                const visit = formatBookingDateAndSlot(b.date, b.timeSlot)
                const condition = bookingConditionLabel(b)
                const physioName = b.physioId?.name ?? 'Physiotherapist'

                return (
                  <li key={b._id}>
                    <Link
                      to={`/dashboard/bookings/${b._id}`}
                      className={[
                        'group flex gap-2.5 rounded-xl border border-gray-100 bg-white py-3 pl-3 pr-2 shadow-sm ring-1 ring-gray-100/90 transition-all duration-200',
                        'border-l-4 hover:bg-slate-50/90 active:bg-slate-50 sm:gap-3 sm:pl-3 sm:pr-3',
                        rowAccentClass(st, pay),
                      ].join(' ')}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/80 text-sm font-bold text-teal-800 ring-1 ring-teal-100">
                        {physioInitial(physioName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-gray-900 sm:text-sm">
                            {visit}
                            {condition ? (
                              <span className="font-normal text-gray-500"> ({condition})</span>
                            ) : null}
                          </p>
                          <span
                            className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${servicePillClass(
                              b.serviceType,
                            )}`}
                          >
                            {b.serviceType === 'online' ? 'Online' : 'Home'}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-gray-600">
                          <span className="font-medium text-gray-800">{physioName}</span>
                        </p>

                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>
                            {st.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pay.cls}`}>
                            {pay.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center self-center pl-0.5">
                        <svg
                          className="h-4 w-4 text-gray-300 transition-transform group-active:translate-x-0.5"
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
          )}
        </>
      )}
    </div>
  )
}
