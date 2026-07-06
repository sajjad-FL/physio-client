import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'

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
      </Card>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <Card hover={false} className="p-6 text-center text-sm text-slate-600">
            No ledger entries yet.
          </Card>
        ) : (
          entries.map((e) => (
            <Card key={e._id} hover={false} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">₹{Number(e.amount).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">
                    {e.bookingId?.issue || 'Booking'} · {e.status}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {e.collectedAt ? new Date(e.collectedAt).toLocaleDateString('en-IN') : ''}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
