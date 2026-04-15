import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import PhysioBookingsToolbar from '../../components/physio/PhysioBookingsToolbar'
import PhysioBookingsFilterDrawer, {
  DEFAULT_PHYSIO_FILTERS,
} from '../../components/physio/PhysioBookingsFilterDrawer'
import SessionsCalendarView from '../../components/physio/SessionsCalendarView'
import { matchesFilters } from '../../components/physio/physioBookingHelpers'
import { normalizeIndianPhone } from '../../utils/phoneIndia'

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

function rowAccentClass(b) {
  if (b.sessionStatus === 'completed') return 'border-l-emerald-500'
  if (b.rescheduled) return 'border-l-amber-500'
  return 'border-l-blue-500'
}

function patientInitial(name) {
  const s = (name || '?').trim()
  return s ? s.slice(0, 1).toUpperCase() : '?'
}

function servicePillClass(serviceType) {
  return serviceType === 'online'
    ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
    : 'bg-teal-50 text-teal-800 ring-teal-200/80'
}

export default function PhysioBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [errorCode, setErrorCode] = useState('')
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
      const qNorm = normalizeIndianPhone(q)
      list = list.filter((b) => {
        const name = (b.userId?.name || '').toLowerCase()
        const phone = String(b.userId?.phone || '')
        const phoneDigits = phone.replace(/\D/g, '')
        const phoneNorm = normalizeIndianPhone(phone) || phoneDigits
        if (qNorm && qNorm.length === 10 && phoneNorm === qNorm) return true
        return name.includes(q) || phone.toLowerCase().includes(q) || (digits.length > 0 && phoneDigits.includes(digits))
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
    setLoadError('')
    setErrorCode('')
    try {
      const res = await api.get('/physio/bookings', { params: { page: 1, limit: 100 } })
      setBookings(res.data?.data || [])
    } catch (e) {
      setBookings([])
      setErrorCode(String(e?.response?.data?.code || ''))
      setLoadError(e?.response?.data?.message || 'Failed to load bookings')
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
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Assigned bookings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Search, filter, list or calendar — open a row for session actions and full details.
        </p>
      </div>

      {!loading && bookings.length > 0 && (
        <section
          className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80 sm:p-4"
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100" />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-900">
          <p className="font-medium">{loadError}</p>
          {errorCode === 'PHYSIO_PENDING' || errorCode === 'PROFILE_INCOMPLETE' ? (
            <div className="mt-3">
              <Link
                to="/physio/onboarding"
                className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100/40"
              >
                Finish profile setup
              </Link>
            </div>
          ) : null}
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
        <ul className="flex flex-col gap-2">
          {displayBookings.map((b) => (
            <li key={b._id}>
              <Link
                to={`/physio/bookings/${b._id}`}
                aria-label={`${formatBookingDateAndSlot(b.date, b.timeSlot)}, ${b.userId?.name || 'Patient'}, ${listStatusLabel(b)}`}
                className={[
                  'group flex gap-3 rounded-xl border border-gray-100 bg-white py-3 pl-3 pr-3 shadow-sm ring-1 ring-gray-100/90 transition-all duration-200',
                  'border-l-4 hover:bg-slate-50/90 hover:shadow-md hover:ring-slate-200/80',
                  rowAccentClass(b),
                ].join(' ')}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/90 text-sm font-bold text-slate-600 ring-1 ring-slate-200/80">
                  {patientInitial(b.userId?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-gray-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${servicePillClass(
                        b.serviceType,
                      )}`}
                    >
                      {b.serviceType === 'online' ? 'Online' : 'Home'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{b.userId?.name ?? '—'}</span>
                    {b.userId?.phone ? (
                      <>
                        <span className="text-gray-300"> · </span>
                        <span className="tabular-nums text-gray-500">{b.userId.phone}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-gray-500">{b.issue}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${listStatusClass(b)}`}
                  >
                    {listStatusLabel(b)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 transition group-hover:text-blue-700">
                    Details
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
