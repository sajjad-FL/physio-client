import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import { managerWorkflowMeta, managerOutstanding } from '../../utils/managerWorkflow'
import ManagerBookingsToolbar from '../../components/manager/ManagerBookingsToolbar'
import ManagerBookingsFilterDrawer, {
  DEFAULT_MANAGER_FILTERS,
} from '../../components/manager/ManagerBookingsFilterDrawer'
import { openGoogleMapsDestination } from '../../utils/googleMaps'
import Card from '../../components/ui/Card'
import { bookingCodeBadge } from '../../utils/bookingDisplay'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'

function badgeClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'action':
      return 'bg-teal-50 text-teal-900 ring-teal-200/80'
    case 'waiting':
      return 'bg-blue-50 text-blue-900 ring-blue-200/80'
    case 'progress':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200/80'
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

function servicePillClass(serviceType) {
  return serviceType === 'online'
    ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
    : 'bg-teal-50 text-teal-800 ring-teal-200/80'
}

function patientInitial(name) {
  const s = (name || '?').trim()
  return s ? s.slice(0, 1).toUpperCase() : '?'
}

export default function ManagerBookingsPage() {
  const [items, setItems] = useState([])
  const { page, pageSize, total, applyMeta, clearMeta, resetPage, paginationProps } = usePagination()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_MANAGER_FILTERS }))
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')

  const deferredSearch = useDeferredValue(search)

  const filtersActive = useMemo(
    () => filters.workflow !== 'all' || filters.date !== 'all',
    [filters],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/manager/bookings', {
        params: {
          page,
          limit: pageSize,
          search: deferredSearch.trim() || undefined,
          sort,
          workflow: filters.workflow !== 'all' ? filters.workflow : undefined,
          date: filters.date !== 'all' ? filters.date : undefined,
        },
      })
      setItems(res.data?.data || res.data?.items || [])
      applyMeta(res.data)
    } catch {
      setItems([])
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, deferredSearch, sort, filters, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-page-title text-gray-900">Your cases</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
          Search, filter — open a row for assessment, care plan, physio assignment, and payment actions.
        </p>
      </div>

      {!loading && (total > 0 || filtersActive || deferredSearch.trim()) ? (
        <section
          className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80 sm:p-4"
          aria-label="Search and display"
        >
          <ManagerBookingsToolbar
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
            onFilterClick={() => setIsFilterOpen(true)}
            filtersActive={filtersActive}
          />
          <p className="mt-3 text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{items.length}</span> of {total}
            {filtersActive ? <span className="text-gray-400"> · Filters on</span> : null}
          </p>
        </section>
      ) : null}

      {isFilterOpen ? (
        <ManagerBookingsFilterDrawer
          appliedFilters={filters}
          onClose={() => setIsFilterOpen(false)}
          onApply={(next) => {
            resetPage()
            setFilters({ ...next })
          }}
          onReset={() => {
            resetPage()
            setFilters({ ...DEFAULT_MANAGER_FILTERS })
          }}
        />
      ) : null}

      {loading ? (
        <ListSkeleton count={5} />
      ) : total === 0 && !filtersActive && !deferredSearch.trim() ? (
        <Card hover={false} className="border-dashed p-10 text-center">
          <p className="text-base font-semibold text-slate-800">No assigned cases yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Home bookings in your service zones will appear here once admin assigns them — or when a patient&apos;s
            pincode auto-matches your zone.
          </p>
        </Card>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
          No cases match your filters or search.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((b) => {
              const meta = managerWorkflowMeta(b)
              const due = managerOutstanding(b)
              const canStart = Boolean(b.userId?.coordinates || String(b.userId?.location || '').trim())
              const dueAlreadyInMeta =
                meta.label.toLowerCase().includes('pending') ||
                (meta.hint && /₹|pending/i.test(meta.hint))

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
                      to={`/manager/bookings/${b._id}`}
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
                            b.serviceType || 'home',
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
                      <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-gray-500">
                        {b.issue || 'Home visit'}
                        {due > 0.009 && !dueAlreadyInMeta ? (
                          <span className="font-semibold text-rose-700"> · ₹{due.toFixed(0)} pending</span>
                        ) : null}
                      </p>
                    </Link>
                    <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {(b.serviceType || 'home') === 'home' ? (
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
                        to={`/manager/bookings/${b._id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
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
