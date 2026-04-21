import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import Pagination from '../../components/Pagination'
import { formatBookingDateAndSlot } from '../../utils/date'
import { normalizeIndianPhone } from '../../utils/phoneIndia'
import AdminBookingsToolbar from '../../components/admin/AdminBookingsToolbar'
import AdminBookingsFilterDrawer, {
  DEFAULT_ADMIN_BOOKING_FILTERS,
} from '../../components/admin/AdminBookingsFilterDrawer'
import SessionsCalendarView from '../../components/physio/SessionsCalendarView'

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

function visitSortKey(b) {
  return `${String(b.date || '')}\t${String(b.timeSlot || '')}`
}

function buildListParams(page, filters) {
  const params = { page, limit: 25 }
  if (filters.status !== 'all') params.status = filters.status
  if (filters.paymentStatus !== 'all') params.paymentStatus = filters.paymentStatus
  if (filters.assignment !== 'all') params.assignment = filters.assignment
  if (filters.serviceType !== 'all') params.serviceType = filters.serviceType
  if (filters.sessionStatus !== 'all') {
    params.sessionStatus = filters.sessionStatus === 'not_set' ? 'none' : filters.sessionStatus
  }
  return params
}

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
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
        const bRes = await api.get('/bookings', { params: buildListParams(page, filters) })
        setBookings(bRes.data?.data || [])
        setTotalPages(bRes.data?.totalPages || 1)
        setTotal(bRes.data?.total ?? 0)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load data')
        setBookings([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [page, filters],
  )

  useEffect(() => {
    load({ showFullSpinner: true })
  }, [load])

  const displayBookings = useMemo(() => {
    let list = [...bookings]
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
  }, [bookings, deferredSearch, sort])

  function handleApplyFilters(next) {
    setFilters({ ...next })
    setPage(1)
  }

  function handleResetFilters() {
    setFilters({ ...DEFAULT_ADMIN_BOOKING_FILTERS })
    setPage(1)
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-brand" aria-hidden />
        <p className="text-sm font-medium text-ink-muted" role="status">
          Loading bookings…
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Bookings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Compact list — open a row for assignments, verification, and full details.
        </p>
      </div>

      <section className="rounded-2xl border border-border-subtle bg-white p-4 shadow-sm ring-1 ring-border-subtle/60 sm:p-5">
        <AdminBookingsToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          onFilterClick={() => setFilterOpen(true)}
          filtersActive={filtersActive}
          onRefresh={() => load({ showFullSpinner: false })}
          refreshing={refreshing}
          view={view}
          onViewChange={setView}
        />
        <p className="mt-3 text-xs text-ink-muted">
          Showing <span className="font-semibold text-ink">{displayBookings.length}</span> on this page
          {total > 0 && (
            <span className="text-ink-muted/80">
              {' '}
              · {total} total{filtersActive ? ' (filtered)' : ''}
            </span>
          )}
          {deferredSearch.trim() && (
            <span className="text-amber-800/90"> · Search narrows the current page only</span>
          )}
        </p>
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
          {filtersActive ? 'No bookings match these filters.' : 'No bookings yet.'}
        </p>
      ) : displayBookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-subtle bg-canvas/80 px-4 py-10 text-center text-sm text-ink-muted">
          No rows match your search on this page. Try another page or clear search.
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
            return (
              <li key={b._id}>
                <Link
                  to={`/admin/bookings/${b._id}`}
                  className="tap-feedback flex min-h-[3.25rem] items-center gap-3 px-3 py-3 transition-colors hover:bg-slate-50/90 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {patient}
                      <span className="text-ink-muted/60"> · </span>
                      {physio}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${statusBadgeClass(b.status)}`}
                  >
                    {b.status}
                  </span>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
