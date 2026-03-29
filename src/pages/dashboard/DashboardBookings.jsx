import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { bookingStatusBadge, paymentBadge } from './dashboardUtils'
import { matchesPatientBookingFilter } from './bookingFilterUtils'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import EmptyState from '../../components/ui/EmptyState'
import { formatBookingDateAndSlot } from '../../utils/date'
import { todayYmd } from '../../components/physio/physioBookingHelpers'

function BookingSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-sm ring-1 ring-gray-100/80" />
  )
}

const primaryBtn =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]'

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'range', label: 'Date Range' },
]

function pillClass(active) {
  return [
    'shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
    active
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20'
      : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-200/90 hover:ring-gray-300 active:scale-[0.98]',
  ].join(' ')
}

export default function DashboardBookings() {
  const [bookings, setBookings] = useState(null)
  const [filter, setFilter] = useState('upcoming')
  const [dateRange, setDateRange] = useState(null)

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
    return bookings.filter((b) =>
      matchesPatientBookingFilter(b, { filter, dateRange, today }),
    )
  }, [bookings, filter, dateRange, today])

  const loading = bookings === null
  const totalLoaded = bookings?.length ?? 0

  function onFilterClick(id) {
    setFilter(id)
    if (id !== 'range') {
      setDateRange(null)
    }
  }

  function onRangeChange(dates) {
    if (!dates) {
      setDateRange(null)
      setFilter('all')
      return
    }
    const [start, end] = dates
    if (start && end) {
      setDateRange([start, end])
    } else {
      setDateRange(start ? [start, null] : null)
    }
    setFilter('range')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Your bookings</h2>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <BookingSkeleton />
          <BookingSkeleton />
        </div>
      ) : totalLoaded === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Book a session to see it here."
          icon={
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
              />
            </svg>
          }
        >
          <Link to="/book" className={primaryBtn}>
            Book your first session
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100/80 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
              {FILTER_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onFilterClick(id)}
                  className={pillClass(filter === id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filter === 'range' && (
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm text-gray-600">Select start and end:</span>
                <div className="patient-booking-datepicker [&_.react-datepicker-wrapper]:w-full [&_.react-datepicker__input-container]:w-full [&_input]:w-full [&_input]:max-w-xs [&_input]:cursor-pointer [&_input]:rounded-xl [&_input]:border [&_input]:border-gray-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:font-medium [&_input]:text-gray-900 [&_input]:shadow-sm [&_input]:outline-none [&_input]:ring-0 [&_input]:focus:border-blue-500 [&_input]:focus:ring-2 [&_input]:focus:ring-blue-500/20">
                  <DatePicker
                    selectsRange
                    startDate={dateRange?.[0] ?? undefined}
                    endDate={dateRange?.[1] ?? undefined}
                    onChange={onRangeChange}
                    isClearable
                    placeholderText="Click to choose dates"
                    dateFormat="dd MMM yyyy"
                    monthsShown={1}
                    popperClassName="z-50"
                    wrapperClassName="w-full max-w-md"
                  />
                </div>
              </div>
            )}

            <p className="mt-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filtered.length}</span> result
              {filtered.length === 1 ? '' : 's'}
              {totalLoaded > 0 && (
                <span className="text-gray-400">
                  {' '}
                  · {totalLoaded} loaded
                </span>
              )}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center">
              <p className="text-base font-medium text-gray-900">No bookings match this filter</p>
              <p className="mt-2 text-sm text-gray-500">
                {filter === 'range' && (!dateRange?.[0] || !dateRange?.[1])
                  ? 'Choose a start and end date above.'
                  : 'Try another filter or book a new session.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onFilterClick('all')}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  Show all
                </button>
                <Link to="/book" className={primaryBtn}>
                  Book session
                </Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {filtered.map((b) => {
                const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
                const pay = paymentBadge(b.paymentStatus)
                return (
                  <li key={b._id}>
                    <Link
                      to={`/dashboard/bookings/${b._id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100/90 bg-white shadow-sm ring-1 ring-gray-100/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5"
                    >
                      <div className="space-y-4 px-6 py-6">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date & time</p>
                          <p className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                            {formatBookingDateAndSlot(b.date, b.timeSlot)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Issue</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-700">{b.issue}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Physiotherapist</p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">{b.physioId?.name ?? 'Assigning…'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.cls}`}
                          >
                            {st.label}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${pay.cls}`}
                          >
                            {pay.label}
                          </span>
                        </div>
                        <SessionProgressTracker booking={b} variant="mini" />
                        <span className="inline-flex w-full items-center justify-center rounded-xl border-2 border-gray-100 bg-gray-50/90 py-2.5 text-sm font-semibold text-blue-700 transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-50">
                          View details
                        </span>
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
