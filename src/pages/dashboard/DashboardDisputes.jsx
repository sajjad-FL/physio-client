import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { disputeStatusBadge, paymentBadge } from './dashboardUtils'
import Pagination from '../../components/Pagination'
import { formatBookingTimeSlot } from '../../utils/date'

function RowSkeleton() {
  return (
    <div className="h-16 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-border-subtle/80" />
  )
}

function idTail(id) {
  if (!id) return '—'
  const s = String(id)
  return s.length > 8 ? '…' + s.slice(-6) : s
}

export default function DashboardDisputes() {
  const [list, setList] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/disputes/my', { params: { page, limit: 8 } })
      setList(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    } catch {
      toast.error('Could not load disputes')
      setList([])
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const loading = list === null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="type-page-title text-ink">Disputes</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Disputes on bookings you are involved in (including those raised by your physiotherapist).
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">No disputes yet.</p>
      ) : (
        <>
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
                    <p className="mt-1 text-sm text-ink-muted">
                      Booking <span className="font-mono text-xs">{idTail(b?._id)}</span> ·{' '}
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
