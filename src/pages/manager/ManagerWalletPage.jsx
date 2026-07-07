import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const TX_LABEL = {
  manager_commission: 'Commission earned',
  manager_withdrawal: 'Withdrawal payout',
}

function inr(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

export default function ManagerWalletPage() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wRes, tRes] = await Promise.all([
        api.get('/manager/wallet'),
        api.get('/manager/wallet/transactions', { params: { page: 1, limit: 30 } }),
      ])
      setWallet(wRes.data)
      setTransactions(tRes.data?.transactions || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load earnings')
      setWallet(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function submitWithdraw(e) {
    e.preventDefault()
    const amt = Number(withdrawAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/manager/withdraw', { amount: amt })
      toast.success('Withdrawal requested — admin will process it')
      setWithdrawOpen(false)
      setWithdrawAmount('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not request withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
  if (!wallet) {
    return (
      <Card hover={false} className="p-6 text-center text-sm text-slate-600">
        Could not load your earnings. Try again later.
      </Card>
    )
  }

  const available = Number(wallet.availableBalance || 0)
  const pendingWithdraw = wallet.pendingWithdraw

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card hover={false} className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Withdrawable</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{inr(available)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Settled commission {inr(wallet.settledCommission)} − withdrawn {inr(wallet.withdrawn)}
          </p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending commission</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{inr(wallet.pendingCommission)}</p>
          <p className="mt-1 text-xs text-slate-500">Accrues when admin settles your cash hand-off</p>
        </Card>
        <Card hover={false} className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cash to remit</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{inr(wallet.cashToRemit)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Collections not yet settled —{' '}
            <Link to="/manager/ledger" className="font-semibold text-teal-700 hover:underline">
              view details
            </Link>
          </p>
        </Card>
      </div>

      <Card hover={false} className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Withdraw commission</h3>
            <p className="mt-1 text-xs text-slate-500">
              Lifetime collected: {inr(wallet.totalCollected)} · Commission earned: {inr(wallet.settledCommission)}
            </p>
          </div>
          <Button
            type="button"
            disabled={available < 1 || Boolean(pendingWithdraw)}
            onClick={() => {
              setWithdrawAmount(String(available))
              setWithdrawOpen(true)
            }}
          >
            Withdraw money
          </Button>
        </div>
        {pendingWithdraw ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
            Withdrawal of {inr(pendingWithdraw.amount)} requested on{' '}
            {new Date(pendingWithdraw.requestedAt).toLocaleDateString('en-IN')} — waiting for admin approval.
          </p>
        ) : null}
      </Card>

      <Card hover={false} className="p-5">
        <h3 className="font-semibold text-slate-900">History</h3>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            No commission activity yet. Commission is credited when admin settles the cash you handed over.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {transactions.map((t) => {
              const isCredit = t.direction === 'credit'
              const booking = t.bookingId
              const patientName =
                booking?.userId && typeof booking.userId === 'object' ? booking.userId.name : null
              return (
                <div key={t._id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{TX_LABEL[t.type] || t.type}</p>
                    <p className="text-xs text-slate-500">
                      {patientName ? `${patientName} · ` : ''}
                      {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      {t.meta?.payoutReference ? ` · Ref: ${t.meta.payoutReference}` : ''}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      isCredit ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isCredit ? '+' : '−'}
                    {inr(t.totalAmount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {withdrawOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <form onSubmit={submitWithdraw} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Withdraw commission</h3>
            <p className="mt-1 text-xs text-slate-500">Withdrawable balance: {inr(available)}</p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Amount (₹)
              <input
                type="number"
                min={1}
                max={available}
                step={1}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </label>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? '…' : 'Request'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
