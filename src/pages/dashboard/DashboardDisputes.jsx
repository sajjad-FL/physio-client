import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { disputeStatusBadge, paymentBadge } from './dashboardUtils'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import { formatBookingTimeSlot } from '../../utils/date'
import { bookingCodeBadge } from '../../utils/bookingDisplay'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import { isProfileIncompleteError } from '../../utils/apiErrors'

export default function DashboardDisputes() {
  const [list, setList] = useState(null)
  const { page, pageSize, applyMeta, clearMeta, paginationProps } = usePagination()

  const load = useCallback(async () => {
    try {
      const res = await api.get('/disputes/my', { params: { page, limit: pageSize } })
      setList(res.data?.data || [])
      applyMeta(res.data)
    } catch (err) {
      setList([])
      clearMeta()
      if (!isProfileIncompleteError(err)) {
        toast.error('Could not load disputes')
      }
    }
  }, [page, pageSize, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  const loading = list === null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="type-page-title text-ink">Disputes</h2>
        <p className="mt-1 type-caption text-ink-muted">
          Disputes on bookings you are involved in (including those raised by your physiotherapist).
        </p>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">No disputes yet.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((d) => {
            const st = disputeStatusBadge(d.status)
            const b = d.bookingId
            const pay = b?.paymentStatus != null ? paymentBadge(b.paymentStatus) : null
            return (
              <li
                key={d._id}
                className="surface-card overflow-hidden rounded-2xl shadow-sm ring-1 ring-border-subtle/80"
              >
                {/* Status chips — always a left-aligned horizontal row */}
                <div className="flex flex-row flex-wrap items-center gap-2 border-b border-border-subtle/70 bg-canvas/60 px-4 py-3">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${st.cls}`}
                  >
                    {st.label}
                  </span>
                  {pay ? (
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${pay.cls}`}
                    >
                      {pay.label}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                  <div>
                    <p className="font-semibold text-ink">{d.reason}</p>
                    <p className="mt-1 type-caption text-ink-muted">
                      Booking <span className="font-mono text-xs">{bookingCodeBadge(b) || '—'}</span>
                      {' · '}
                      {d.raisedBy === 'physio' ? 'Raised by physiotherapist' : 'Raised by you'}
                      {' · '}
                      {b?.date} {formatBookingTimeSlot(b?.timeSlot)}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-ink">{d.description}</p>

                  {d.resolution ? (
                    <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">
                      <span className="font-medium text-ink">Resolution: </span>
                      {d.resolution}
                    </p>
                  ) : null}

                  {b?._id ? (
                    <Link
                      to={`/dashboard/bookings/${b._id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      View booking
                      <span aria-hidden>→</span>
                    </Link>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {!loading ? <Pagination {...paginationProps} /> : null}
    </div>
  )
}
