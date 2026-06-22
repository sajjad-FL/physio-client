import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import { formatBookingTimeSlot } from '../../utils/date'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

function disputeBadge(status) {
  const map = {
    open: 'bg-amber-50 text-amber-900 ring-amber-200/80',
    under_review: 'bg-sky-50 text-sky-900 ring-sky-200/80',
    resolved: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
    rejected: 'bg-ink/5 text-ink-muted ring-border-subtle',
  }
  return map[status] || 'bg-canvas text-ink-muted ring-border-subtle'
}

export default function PhysioDisputesPage() {
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
        <h1 className="type-page-title text-ink">Disputes</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Cases linked to your assigned bookings (patient or you may have raised them).
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white ring-1 ring-border-subtle/80" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">No disputes.</p>
      ) : (
        <>
        <ul className="space-y-4">
          {list.map((d) => {
            const b = d.bookingId
            return (
              <li
                key={d._id}
                className="surface-card rounded-2xl p-5 shadow-sm ring-1 ring-border-subtle/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{d.reason}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {b?.date} {formatBookingTimeSlot(b?.timeSlot)} · {b?.userId?.name} ·{' '}
                      {d.raisedBy === 'physio' ? 'You raised' : 'Patient raised'}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink">{d.description}</p>
                    {d.resolution ? (
                      <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">
                        <span className="font-medium text-ink">Resolution: </span>
                        {d.resolution}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${disputeBadge(d.status)}`}
                  >
                    {d.status.replace(/_/g, ' ')}
                  </span>
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
