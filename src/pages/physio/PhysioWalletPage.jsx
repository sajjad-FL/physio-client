import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function typeLabel(row) {
  const t = row?.type
  const direction = row?.direction
  const leg = row?.meta?.leg

  if (t === 'online') {
    if (leg === 'refund') return 'Refund (reversed)'
    if (direction === 'credit') return 'Online Booking Earned'
    return 'Online payment'
  }
  if (t === 'offline') {
    if (leg === 'gross') return 'Cash Collected'
    if (leg === 'commission') return 'Platform Fee (Cash)'
    return 'Offline payment'
  }
  if (t === 'settlement') {
    return 'Fee Remitted to Platform'
  }
  if (t === 'withdrawal') {
    return 'Withdrawal Paid Out'
  }
  return t || '—'
}

function typeBadgeClass(t) {
  switch (t) {
    case 'online':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
    case 'offline':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'settlement':
      return 'bg-sky-50 text-sky-900 ring-sky-200'
    case 'withdrawal':
      return 'bg-rose-50 text-rose-900 ring-rose-200'
    default:
      return 'bg-gray-50 text-gray-800 ring-gray-200'
  }
}

export default function PhysioWalletPage() {
  const [dash, setDash] = useState(null)
  const [tx, setTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingWithdraw, setPendingWithdraw] = useState(null)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)

  const loadPendingWithdraw = useCallback(async () => {
    try {
      const res = await api.get('/withdraw/pending')
      setPendingWithdraw(res.data?.pending || null)
    } catch {
      setPendingWithdraw(null)
    }
  }, [])

  const loadDash = useCallback(async () => {
    try {
      const res = await api.get('/physio/wallet')
      setDash(res.data)
    } catch {
      toast.error('Failed to load wallet')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTx = useCallback(async () => {
    setTxLoading(true)
    try {
      const res = await api.get('/physio/wallet/transactions', { params: { page, limit: 15 } })
      setTx(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setTxLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadDash()
  }, [loadDash])

  useEffect(() => {
    loadPendingWithdraw()
  }, [loadPendingWithdraw])

  useEffect(() => {
    loadTx()
  }, [loadTx])

  const w = dash?.wallet
  const b = dash?.breakdown
  const available = Number(w?.availableBalance)
  const onlineAvail = Number(w?.onlineAvailableBalance ?? w?.onlineEarning)
  const commissionDue = Number(w?.commissionDue)
  const hasPending = Boolean(pendingWithdraw)
  const showNetExplainer = Number.isFinite(commissionDue) && commissionDue > 0.009

  async function submitWithdraw(e) {
    e.preventDefault()
    const raw = withdrawAmount.trim()
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (n > available + 1e-6) {
      toast.error('Amount cannot exceed available balance')
      return
    }
    setWithdrawSubmitting(true)
    try {
      await api.post('/withdraw', { amount: n })
      toast.success('Withdrawal request submitted')
      setWithdrawOpen(false)
      setWithdrawAmount('')
      await Promise.all([loadDash(), loadPendingWithdraw(), loadTx()])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setWithdrawSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">Earnings, platform fees owed, and transaction history.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card hover={false} className="border-emerald-100/80">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Withdrawable balance</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-800">{formatInr(w?.availableBalance)}</p>
            {showNetExplainer ? (
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Online balance {formatInr(onlineAvail)} − Platform fee owed {formatInr(commissionDue)} ={' '}
                <span className="font-semibold text-emerald-900">withdrawable {formatInr(available)}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-500">Withdrawable from online collections (no fee offset)</p>
            )}
            {hasPending && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-900 ring-1 ring-amber-200">
                Pending withdrawal {formatInr(pendingWithdraw.amount)} — awaiting admin review.
              </p>
            )}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={loading || hasPending || !Number.isFinite(available) || available <= 0}
                onClick={() => {
                  setWithdrawAmount('')
                  setWithdrawOpen(true)
                }}
              >
                Withdraw money
              </Button>
            </div>
          </Card>
          <Card hover={false} className="border-amber-100/80">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Platform Fee Owed</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">{formatInr(w?.commissionDue)}</p>
            <p className="mt-2 text-xs text-gray-500">
              Owed to platform from offline cash visits — already subtracted from Withdrawable balance above.
            </p>
          </Card>
          <Card hover={false}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total earned</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{formatInr(w?.totalEarned)}</p>
            <p className="mt-2 text-xs text-gray-500">Lifetime earnings share recorded</p>
          </Card>
        </div>
      )}

      {!loading && b && (
        <Card hover={false} className="overflow-hidden p-0">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Earnings breakdown</h2>
            <p className="text-xs text-gray-500">By payment channel (recorded sessions)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Channel</th>
                  <th className="px-6 py-3">Events</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeBadgeClass('online')}`}>
                      Online
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-700">{b.online_payment?.count ?? 0}</td>
                  <td className="px-6 py-4 tabular-nums font-medium text-gray-900">{formatInr(b.online_payment?.volume)}</td>
                  <td className="px-6 py-4 text-gray-500">Online wallet (withdrawals use this minus platform fee due)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeBadgeClass('offline')}`}>
                      Offline
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-700">{b.offline_payment?.count ?? 0}</td>
                  <td className="px-6 py-4 tabular-nums font-medium text-gray-900">{formatInr(b.offline_payment?.volume)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    Platform fee accrued {formatInr(b.offline_payment?.commissionAccrued)} · Share{' '}
                    {formatInr(b.offline_payment?.physioShare)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeBadgeClass('settlement')}`}>
                      Fee collection
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums text-gray-700">{b.settlement?.count ?? 0}</td>
                  <td className="px-6 py-4 tabular-nums font-medium text-gray-900">{formatInr(b.settlement?.volume)}</td>
                  <td className="px-6 py-4 text-gray-500">Remitted to platform</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card hover={false} className="overflow-hidden p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Transaction history</h2>
          <p className="text-xs text-gray-500">
            Ledger transactions recorded on your wallet.
          </p>
        </div>
        {txLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : tx.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No transactions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount (INR)</th>
                  <th className="px-6 py-3">Booking / note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tx.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="whitespace-nowrap px-6 py-3 text-gray-600">
                      {row.createdAt ? (
                        new Date(row.createdAt).toLocaleString()
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeBadgeClass(row.type)}`}
                      >
                        {typeLabel(row)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {row.direction === 'debit' ? 'Debit' : 'Credit'}
                      </span>
                    </td>
                    <td className="px-6 py-3 tabular-nums font-medium text-gray-900">{formatInr(row.totalAmount)}</td>
                    <td className="max-w-md px-6 py-3 text-gray-600">
                      {row.bookingId?.date && (
                        <span className="block text-xs text-gray-500">
                          Booking {row.bookingId.date} {row.bookingId.timeSlot || ''}
                        </span>
                      )}
                      {row.type === 'settlement' && row.meta?.note && (
                        <span className="text-xs">{row.meta.note}</span>
                      )}
                      {row.type === 'online' &&
                        row.meta?.gross != null &&
                        row.direction === 'credit' && (
                          <span className="text-xs">
                            Gross {formatInr(row.meta.gross)} · Platform fee {formatInr(row.commission)}
                          </span>
                        )}
                      {row.type === 'offline' && row.meta?.leg === 'gross' && (
                        <span className="text-xs">Gross collection · Share {formatInr(row.physioEarning)}</span>
                      )}
                      {row.type === 'offline' && row.meta?.leg === 'commission' && (
                        <span className="text-xs">Platform fee owed (reduces withdrawable balance)</span>
                      )}
                      {row.type === 'withdrawal' && row.meta?.note && (
                        <span className="text-xs">{row.meta.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!txLoading && tx.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitWithdraw}
            className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">Request withdrawal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Max request: {formatInr(w?.availableBalance)} (after commission due). Minimum ₹1. One pending request at a
              time.
            </p>
            <label htmlFor="withdraw-amount" className="mt-4 block text-sm font-medium text-gray-700">
              Amount (INR)
            </label>
            <input
              id="withdraw-amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm tabular-nums shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 5000"
              autoFocus
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <Button type="submit" disabled={withdrawSubmitting}>
                {withdrawSubmitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
