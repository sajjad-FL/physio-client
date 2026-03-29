import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import toast from 'react-hot-toast'
import PhysioBookingsToolbar from '../../components/physio/PhysioBookingsToolbar'
import PhysioBookingsFilterDrawer, {
  DEFAULT_PHYSIO_FILTERS,
} from '../../components/physio/PhysioBookingsFilterDrawer'
import SessionsCalendarView from '../../components/physio/SessionsCalendarView'
import { matchesFilters } from '../../components/physio/physioBookingHelpers'

function listStatusLabel(b) {
  if (b.sessionStatus === 'completed') return 'Completed'
  if (b.rescheduled) return 'Rescheduled'
  return 'Scheduled'
}

function listStatusClass(b) {
  if (b.sessionStatus === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
  if (b.rescheduled) return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-50 text-slate-800 ring-slate-200'
}

export default function PhysioBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_PHYSIO_FILTERS }))
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [view, setView] = useState('list')

  const filtersActive = useMemo(
    () =>
      filters.status !== 'all' || filters.service !== 'all' || filters.date !== 'all',
    [filters],
  )

  const deferredSearch = useDeferredValue(search)

  const displayBookings = useMemo(() => {
    let list = bookings.filter((b) => matchesFilters(b, filters))
    const q = deferredSearch.trim().toLowerCase()
    if (q) {
      const digits = q.replace(/\D/g, '')
      list = list.filter((b) => {
        const name = (b.userId?.name || '').toLowerCase()
        const phone = String(b.userId?.phone || '')
        const phoneDigits = phone.replace(/\D/g, '')
        return name.includes(q) || phone.includes(q) || (digits.length > 0 && phoneDigits.includes(digits))
      })
    }
    const arr = [...list]
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime()
      const tb = new Date(b.createdAt).getTime()
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
      if (Number.isNaN(ta)) return 1
      if (Number.isNaN(tb)) return -1
      return sort === 'latest' ? tb - ta : ta - tb
    })
    return arr
  }, [bookings, filters, deferredSearch, sort])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/physio/bookings', { params: { page: 1, limit: 100 } })
      setBookings(res.data?.data || [])
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Assigned bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Search, sort, optional filters, list or calendar. Open a booking for actions and full details.</p>
      </div>

      {!loading && bookings.length > 0 && (
        <section
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100/80 sm:p-5"
          aria-label="Search and display"
        >
          <PhysioBookingsToolbar
            search={search}
            onSearchChange={setSearch}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            onFilterClick={() => setIsFilterOpen(true)}
            filtersActive={filtersActive}
          />
          <p className="mt-3 text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{displayBookings.length}</span> of {bookings.length}
            {filtersActive && <span className="text-gray-400"> · Filters on</span>}
          </p>
        </section>
      )}

      {isFilterOpen && (
        <PhysioBookingsFilterDrawer
          appliedFilters={filters}
          onClose={() => setIsFilterOpen(false)}
          onApply={(next) => setFilters({ ...next })}
          onReset={() => setFilters({ ...DEFAULT_PHYSIO_FILTERS })}
        />
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-500">No assigned bookings yet.</p>
      ) : displayBookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
          No bookings match your filters or search.
        </p>
      ) : view === 'calendar' ? (
        <SessionsCalendarView bookings={displayBookings} />
      ) : (
        <ul className="flex flex-col gap-4">
          {displayBookings.map((b) => (
            <li key={b._id}>
              <Link
                to={`/physio/bookings/${b._id}`}
                className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md shadow-black/4 ring-1 ring-gray-100/90 transition-shadow duration-200 hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Date & time</p>
                      <p className="mt-0.5 text-base font-semibold text-gray-900">
                        {formatBookingDateAndSlot(b.date, b.timeSlot)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Patient</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">{b.userId?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Issue</p>
                      <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-gray-800">{b.issue}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                    <span
                      className={`inline-flex justify-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 sm:min-w-32 sm:justify-center ${listStatusClass(
                        b,
                      )}`}
                    >
                      {listStatusLabel(b)}
                    </span>
                    <span className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-blue-700 transition group-hover:border-blue-200 group-hover:bg-blue-50/80">
                      View details
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
