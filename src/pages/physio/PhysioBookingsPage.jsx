import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import { physioWorkflowMeta } from '../../utils/physioWorkflow'
import PhysioBookingsToolbar from '../../components/physio/PhysioBookingsToolbar'
import PhysioBookingsFilterDrawer, {
  DEFAULT_PHYSIO_FILTERS,
} from '../../components/physio/PhysioBookingsFilterDrawer'
import SessionsCalendarView from '../../components/physio/SessionsCalendarView'
import { openGoogleMapsDestination } from '../../utils/googleMaps'
import { bookingCodeBadge } from '../../utils/bookingDisplay'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'

function badgeClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'action':
      return 'bg-teal-50 text-teal-900 ring-teal-200'
    case 'waiting':
      return 'bg-blue-50 text-blue-900 ring-blue-200'
    case 'progress':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
    default:
      return 'bg-slate-50 text-slate-800 ring-slate-200'
  }
}

function rowAccentClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'border-l-amber-500'
    case 'action':
      return 'border-l-teal-500'
    case 'waiting':
      return 'border-l-blue-500'
    case 'progress':
      return 'border-l-emerald-500'
    default:
      return 'border-l-slate-300'
  }
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
  const { page, pageSize, total, applyMeta, clearMeta, resetPage, paginationProps } = usePagination()

  const filtersActive = useMemo(
    () =>
      filters.workflow !== 'all' ||
      filters.status !== 'all' ||
      filters.service !== 'all' ||
      filters.date !== 'all',
    [filters],
  )

  const deferredSearch = useDeferredValue(search)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    setErrorCode('')
    try {
      const params = {
        page: view === 'calendar' ? 1 : page,
        limit: view === 'calendar' ? 50 : pageSize,
        search: deferredSearch.trim() || undefined,
        sort,
        workflow: filters.workflow !== 'all' ? filters.workflow : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        service: filters.service !== 'all' ? filters.service : undefined,
        date: filters.date !== 'all' ? filters.date : undefined,
      }
      const res = await api.get('/physio/bookings', { params })
      setBookings(res.data?.data || [])
      applyMeta(res.data)
    } catch (e) {
      setBookings([])
      clearMeta()
      setErrorCode(String(e?.response?.data?.code || ''))
      setLoadError(e?.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, deferredSearch, sort, filters, view, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-page-title text-gray-900">Assigned bookings</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Search, filter, list or calendar — open a row for session actions and full details.
        </p>
      </div>

      {!loading && (total > 0 || filtersActive || deferredSearch.trim()) ? (
        <section
          className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80 sm:p-4"
          aria-label="Search and display"
        >
          <PhysioBookingsToolbar
            search={search}
            onSearchChange={(value) => {
              resetPage()
              setSearch(value)
            }}
            sort={sort}
            onSortChange={(value) => {
              resetPage()
              setSort(value)
            }}
            view={view}
            onViewChange={(next) => {
              resetPage()
              setView(next)
            }}
            onFilterClick={() => setIsFilterOpen(true)}
            filtersActive={filtersActive}
          />
          <p className="mt-3 text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{bookings.length}</span> of {total}
            {filtersActive ? <span className="text-gray-400"> · Filters on</span> : null}
          </p>
        </section>
      ) : null}

      {isFilterOpen ? (
        <PhysioBookingsFilterDrawer
          appliedFilters={filters}
          onClose={() => setIsFilterOpen(false)}
          onApply={(next) => {
            resetPage()
            setFilters({ ...next })
          }}
          onReset={() => {
            resetPage()
            setFilters({ ...DEFAULT_PHYSIO_FILTERS })
          }}
        />
      ) : null}

      {loading ? (
        <ListSkeleton count={5} />
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
      ) : total === 0 ? (
        <p className="text-sm text-gray-500">
          {filtersActive || deferredSearch.trim()
            ? 'No bookings match your filters or search.'
            : 'No assigned bookings yet.'}
        </p>
      ) : view === 'calendar' ? (
        <SessionsCalendarView bookings={bookings} />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {bookings.map((b) => {
              const meta = physioWorkflowMeta(b)
              const canStart = Boolean(b.userId?.coordinates || String(b.userId?.location || '').trim())
              return (
                <li key={b._id}>
                  <div
                    className={[
                      'group flex gap-3 rounded-xl border border-gray-100 bg-white py-3 pl-3 pr-3 shadow-sm ring-1 ring-gray-100/90 transition-all duration-200',
                      'border-l-4 hover:bg-slate-50/90 hover:shadow-md hover:ring-slate-200/80',
                      rowAccentClass(meta.tone),
                    ].join(' ')}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/90 text-sm font-bold text-slate-600 ring-1 ring-slate-200/80">
                      {patientInitial(b.userId?.name)}
                    </div>
                    <Link
                      to={`/physio/bookings/${b._id}`}
                      aria-label={`${formatBookingDateAndSlot(b.date, b.timeSlot)}, ${b.userId?.name || 'Patient'}, ${meta.label}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-gray-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                        {bookingCodeBadge(b) ? (
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            {bookingCodeBadge(b)}
                          </span>
                        ) : null}
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
                    </Link>
                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {b.serviceType === 'home' ? (
                        <button
                          type="button"
                          onClick={() =>
                            openGoogleMapsDestination({
                              coordinates: b.userId?.coordinates,
                              address: b.userId?.location,
                            })
                          }
                          disabled={!canStart}
                          title={canStart ? 'Start navigation' : 'Address not available'}
                          className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Start
                        </button>
                      ) : null}
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass(meta.tone)}`}
                      >
                        {meta.label}
                      </span>
                      <Link
                        to={`/physio/bookings/${b._id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        Details
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination {...paginationProps} />
        </>
      )}
    </div>
  )
}
