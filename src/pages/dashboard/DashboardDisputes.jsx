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
                className="surface-card rounded-2xl p-5 shadow-sm ring-1 ring-border-subtle/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{d.reason}</p>
                    <p className="mt-1 type-caption text-ink-muted">
                      Booking <span className="font-mono text-xs">{bookingCodeBadge(b) || '—'}</span> ·{' '}
                      {d.raisedBy === 'physio' ? 'Raised by physiotherapist' : 'Raised by you'} ·{' '}
                      {b?.date} {formatBookingTimeSlot(b?.timeSlot)}
                    </p>
                    <p className="mt-3 text-sm text-ink leading-relaxed">{d.description}</p>
                    {d.resolution ? (
                      <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">
                        <span className="font-medium text-ink">Resolution: </span>
                        {d.resolution}
                      </p>
                    ) : null}
                    {b?._id ? (
                      <Link
                        to={`/dashboard/bookings/${b._id}`}
                        className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        View booking →
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${st.cls}`}>
                      {st.label}
                    </span>
                    {pay ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${pay.cls}`}>
                        {pay.label}
                      </span>
                    ) : null}
                  </div>
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
