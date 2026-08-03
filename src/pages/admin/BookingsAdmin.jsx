import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import { formatBookingDateAndSlot } from '../../utils/date'
import AdminBookingsToolbar from '../../components/admin/AdminBookingsToolbar'
import AdminBookingsFilterDrawer, {
  DEFAULT_ADMIN_BOOKING_FILTERS,
} from '../../components/admin/AdminBookingsFilterDrawer'
import SessionsCalendarView from '../../components/physio/SessionsCalendarView'
import { bookingCodeBadge, bookingConditionLabel, serviceTypeLabel } from '../../utils/bookingDisplay'

function statusBadgeClass(status) {
  const map = {
    pending: 'bg-amber-50 text-amber-900 ring-amber-200/80',
    assigned: 'bg-teal-50 text-teal-900 ring-teal-200/80',
    accepted: 'bg-sky-50 text-sky-900 ring-sky-200/80',
    scheduled: 'bg-indigo-50 text-indigo-900 ring-indigo-200/80',
    completed: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  }
  return map[status] || 'bg-slate-50 text-slate-700 ring-slate-200/80'
}

function serviceTypeBadgeClass(serviceType) {
  const map = {
    online: 'bg-violet-50 text-violet-900 ring-violet-200/80',
    clinic: 'bg-orange-50 text-orange-900 ring-orange-200/80',
    home: 'bg-slate-50 text-slate-700 ring-slate-200/80',
  }
  return map[serviceType] || map.home
}

function visitTypeLabel(b) {
  const st = b.serviceType === 'online' || b.serviceType === 'clinic' ? b.serviceType : 'home'
  if (st === 'online') return 'Online'
  if (st === 'clinic') return 'Clinic'
  return 'Home'
}

function visitSortKey(b) {
  return `${String(b.date || '')}\t${String(b.timeSlot || '')}`
}

function buildListParams(page, pageSize, filters, search) {
  const params = { page, limit: pageSize }
  if (filters.status !== 'all') params.status = filters.status
  if (filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus
  if (filters.assignment !== 'all') params.assignment = filters.assignment
  if (filters.serviceType !== 'all') params.serviceType = filters.serviceType
  if (filters.sessionStatus !== 'all') {
    params.sessionStatus = filters.sessionStatus === 'not_set' ? 'none' : filters.sessionStatus
  }
  const q = String(search || '').trim()
  if (q) params.search = q
  return params
}

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { page, pageSize, applyMeta, clearMeta, resetPage, paginationProps } = usePagination()
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_ADMIN_BOOKING_FILTERS }))
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [view, setView] = useState('list')
  const [refreshing, setRefreshing] = useState(false)

  const deferredSearch = useDeferredValue(search)

  const filtersActive = useMemo(
    () => Object.values(filters).some((v) => v !== 'all'),
    [filters],
  )

  const load = useCallback(
    async ({ showFullSpinner = false } = {}) => {
      if (showFullSpinner) setLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const bRes = await api.get('/bookings', {
          params: buildListParams(page, pageSize, filters, deferredSearch),
        })
        setBookings(bRes.data?.data || [])
        applyMeta(bRes.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load data')
        setBookings([])
        clearMeta()
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, pageSize, filters, deferredSearch, applyMeta, clearMeta],
  )

  useEffect(() => {
    load({ showFullSpinner: true })
  }, [load])

  useEffect(() => {
    resetPage()
  }, [deferredSearch, resetPage])

  const displayBookings = useMemo(() => {
    const list = [...bookings]
    list.sort((a, b) => {
      if (sort === 'latest' || sort === 'oldest') {
        const ta = new Date(a.createdAt).getTime()
        const tb = new Date(b.createdAt).getTime()
        if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
        if (Number.isNaN(ta)) return 1
        if (Number.isNaN(tb)) return -1
        return sort === 'latest' ? tb - ta : ta - tb
      }
      const ka = visitSortKey(a)
      const kb = visitSortKey(b)
      return sort === 'visitSoon' ? ka.localeCompare(kb) : kb.localeCompare(ka)
    })
    return list
  }, [bookings, sort])

  function handleApplyFilters(next) {
    setFilters({ ...next })
    resetPage()
  }

  function handleResetFilters() {
    setFilters({ ...DEFAULT_ADMIN_BOOKING_FILTERS })
    resetPage()
  }

  if (loading && bookings.length === 0) {
    return <ListSkeleton count={6} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-page-title text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Compact list — open a row for assignments, verification, and full details.
        </p>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm ring-1 ring-border-subtle/60 sm:p-5">
        <AdminBookingsToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            resetPage()
          }}
          sort={sort}
          onSortChange={setSort}
          onFilterClick={() => setFilterOpen(true)}
          filtersActive={filtersActive}
          onRefresh={() => load({ showFullSpinner: false })}
          refreshing={refreshing}
          view={view}
          onViewChange={setView}
        />
      </section>

      {filterOpen && (
        <AdminBookingsFilterDrawer
          appliedFilters={filters}
          onClose={() => setFilterOpen(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      {error && (
        <div
          className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <p className="rounded-2xl border border-dashed border-border-subtle bg-canvas/80 px-4 py-12 text-center text-sm text-ink-muted">
          {filtersActive || deferredSearch.trim()
            ? 'No bookings match these filters.'
            : 'No bookings yet.'}
        </p>
      ) : view === 'calendar' ? (
        <SessionsCalendarView
          bookings={displayBookings}
          basePath="/admin/bookings"
          showPhysio
        />
      ) : (
        <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-white ring-1 ring-border-subtle/60">
          {displayBookings.map((b) => {
            const patient = b.userId?.name ?? '—'
            const physio = b.physioId?.name ?? 'Unassigned'
            const bookedFor = bookingConditionLabel(b) || 'Home visit'
            return (
              <li key={b._id}>
                <Link
                  to={`/admin/bookings/${b._id}`}
                  className="tap-feedback flex min-h-[3.25rem] items-center gap-3 px-3 py-3 transition-colors hover:bg-slate-50/90 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {formatBookingDateAndSlot(b.date, b.timeSlot)}
                      {bookingCodeBadge(b) ? (
                        <span className="ml-2 font-mono text-[10px] font-semibold text-ink-muted">
                          {bookingCodeBadge(b)}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs font-medium text-ink">{bookedFor}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {patient}
                      <span className="text-ink-muted/60"> · </span>
                      {physio}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${serviceTypeBadgeClass(b.serviceType)}`}
                      title={`Visit type: ${serviceTypeLabel(b.serviceType)}`}
                    >
                      {visitTypeLabel(b)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(b.status)}`}
                    >
                      {b.status}
                    </span>
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
              </li>
            )
          })}
        </ul>
      )}

      <Pagination {...paginationProps} />
    </div>
  )
}
