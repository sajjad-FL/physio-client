import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'

function statusBadgeClass(status) {
  const map = {
    pending: 'bg-amber-50 text-amber-900 ring-amber-200/80',
    assigned: 'bg-brand-soft text-brand ring-brand/25',
    completed: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  }
  return map[status] || 'bg-canvas text-ink-muted ring-border-subtle'
}

function sessionBadgeClass(s) {
  if (s === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
  if (s === 'scheduled') return 'bg-brand-soft text-brand ring-brand/25'
  return 'bg-canvas text-ink-muted ring-border-subtle'
}

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async ({ showSpinner = false } = {}) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const bRes = await api.get('/bookings', { params: { page, limit: 10 } })
      setBookings(bRes.data?.data || [])
      setTotalPages(bRes.data?.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load({ showSpinner: true })
  }, [load])

  if (loading) {
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
    <div>
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Bookings</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Summary list — open a booking for assignments, verification, and escrow actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load({ showSpinner: false })}
          className="interactive-press inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-white px-4 text-sm font-medium text-ink shadow-sm transition duration-200 ease-in-out hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-subtle bg-canvas/80 px-4 py-12 text-center text-sm text-ink-muted">
          No bookings yet.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {bookings.map((b) => {
            const patient = b.userId?.name ?? '—'
            const physio = b.physioId?.name ?? '—'
            return (
              <li key={b._id}>
                <Link
                  to={`/admin/bookings/${b._id}`}
                  className="surface-card group flex flex-col overflow-hidden rounded-2xl shadow-md shadow-black/4 ring-1 ring-border-subtle/80 transition-shadow hover:shadow-lg"
                >
                  <div className="space-y-3 px-5 py-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Date & time</p>
                      <p className="mt-0.5 text-base font-semibold text-ink">
                        {formatBookingDateAndSlot(b.date, b.timeSlot)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">{formatBookingTimeSlot(b.timeSlot)}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Patient</p>
                        <p className="mt-0.5 text-sm font-medium text-ink">{patient}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Physio</p>
                        <p className="mt-0.5 text-sm font-medium text-ink">{physio}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Issue</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{b.issue}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(b.status)}`}
                      >
                        {b.status}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${sessionBadgeClass(b.sessionStatus)}`}
                      >
                        {b.sessionStatus || '—'}
                      </span>
                    </div>
                    <span className="inline-flex w-full items-center justify-center rounded-xl border border-border-subtle bg-gray-50 px-4 py-2 text-sm font-semibold text-blue-700 transition group-hover:border-blue-200 group-hover:bg-blue-50/80">
                      View details
                    </span>
                  </div>
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
