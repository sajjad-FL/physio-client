import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'

const LEDGER_STATUS_LABEL = {
  open: 'Awaiting admin settlement',
  batched: 'In settlement batch',
  settled: 'Settled',
  disputed: 'Disputed',
}

function ledgerStatusLabel(status) {
  return LEDGER_STATUS_LABEL[status] || status || '—'
}

export default function ManagerLedgerPage() {
  const [entries, setEntries] = useState([])
  const [openTotal, setOpenTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/manager/ledger')
      setEntries(res.data?.entries || [])
      setOpenTotal(Number(res.data?.openTotal || 0))
    } catch {
      setEntries([])
      setOpenTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <div className="space-y-4">
      <Card hover={false} className="p-5">
        <p className="text-sm text-slate-600">Unsettled collections (awaiting admin batch settlement)</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">₹{openTotal.toFixed(2)}</p>
        <p className="mt-2 text-xs text-slate-500">
          Record cash/UPI on a case first; each entry appears here until admin settles in batch.
        </p>
      </Card>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <Card hover={false} className="p-6 text-center text-sm text-slate-600">
            No ledger entries yet. Open a case and record a collection to see it here.
          </Card>
        ) : (
          entries.map((e) => {
            const ref = e.bookingRef
            const booking = e.bookingId
            const patientName =
              ref?.patientName ||
              (booking?.userId && typeof booking.userId === 'object' ? booking.userId.name : null) ||
              'Patient'
            const issue = ref?.issue || booking?.issue || 'Home visit'
            const bookingId = ref?.id || booking?._id

            return (
              <Card key={e._id} hover={false} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">₹{Number(e.amount).toFixed(2)}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{patientName}</p>
                    <p className="text-xs text-slate-500">{issue}</p>
                    <p className="mt-1 text-xs font-medium text-amber-800">{ledgerStatusLabel(e.status)}</p>
                    {Number(e.managerCommissionAmount) > 0 ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        Your commission: ₹{Number(e.managerCommissionAmount).toFixed(2)}
                        {e.status === 'settled' ? ' — credited' : ' — paid on settlement'}
                      </p>
                    ) : null}
                    {e.note ? <p className="mt-1 text-xs text-slate-500">{e.note}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-slate-500">
                      {e.collectedAt ? new Date(e.collectedAt).toLocaleDateString('en-IN') : ''}
                    </span>
                    {bookingId ? (
                      <Link
                        to={`/manager/bookings/${bookingId}`}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        View case →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
