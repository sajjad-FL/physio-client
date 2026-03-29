import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function DueBadge({ due }) {
  const d = Number(due) || 0
  if (d <= 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        Clear
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
      Due
    </span>
  )
}

export default function AdminSettlementPage() {
  const [summary, setSummary] = useState(null)
  const [physios, setPhysios] = useState([])
  const [loading, setLoading] = useState(true)
  const [settleOpen, setSettleOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, pRes] = await Promise.all([api.get('/admin/payments/summary'), api.get('/admin/payments/physios')])
      setSummary(sRes.data)
      setPhysios(pRes.data?.data || [])
    } catch {
      toast.error('Failed to load settlement data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openSettle(row) {
    setSelected(row)
    const due = row.wallet?.commissionDue
    setAmount(due > 0 ? String(due) : '')
    setNote('')
    setSettleOpen(true)
  }

  async function submitSettle(e) {
    e.preventDefault()
    if (!selected?._id) return
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/admin/payments/settle-commission', {
        physioId: selected._id,
        amount: amt,
        note: note.trim() || undefined,
      })
      toast.success('Settlement recorded')
      setSettleOpen(false)
      setSelected(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Payments & settlements</h1>
        <p className="mt-1 text-sm text-gray-500">Platform revenue, commission, and physio commission dues.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card hover={false}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total revenue</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{formatInr(summary?.totalRevenue)}</p>
            <p className="mt-2 text-xs text-gray-500">Gross from paid / verified bookings</p>
          </Card>
          <Card hover={false} className="border-indigo-50">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Commission earned</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-indigo-900">{formatInr(summary?.totalCommission)}</p>
            <p className="mt-2 text-xs text-gray-500">Platform share on those bookings</p>
          </Card>
          <Card hover={false} className="border-amber-50">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pending dues</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">{formatInr(summary?.pendingSettlements)}</p>
            <p className="mt-2 text-xs text-gray-500">Sum of commission due across physios</p>
          </Card>
        </div>
      )}

      <Card hover={false} className="overflow-hidden p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Physiotherapists</h2>
          <p className="text-xs text-gray-500">Settle offline commission collections</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : physios.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No physiotherapists.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Total earnings</th>
                  <th className="px-6 py-3">Commission due</th>
                  <th className="px-6 py-3">Balance</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {physios.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <span className="font-medium text-gray-900">{row.name}</span>
                      {row.phone && <span className="mt-0.5 block text-xs text-gray-500">{row.phone}</span>}
                    </td>
                    <td className="px-6 py-3 tabular-nums text-gray-800">{formatInr(row.wallet?.totalEarned)}</td>
                    <td className="px-6 py-3 tabular-nums font-medium text-amber-900">{formatInr(row.wallet?.commissionDue)}</td>
                    <td className="px-6 py-3 tabular-nums text-emerald-800">{formatInr(row.wallet?.availableBalance)}</td>
                    <td className="px-6 py-3">
                      <DueBadge due={row.wallet?.commissionDue} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-xs"
                        disabled={!row.wallet?.commissionDue || row.wallet.commissionDue <= 0}
                        onClick={() => openSettle(row)}
                      >
                        Settle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {settleOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <Card hover={false} className="relative w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Record settlement</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selected.name} — commission due {formatInr(selected.wallet?.commissionDue)}
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitSettle}>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Amount (INR)</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Note (optional)</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference / UTR" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSettleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Confirm'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
