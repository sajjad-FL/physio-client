import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const CASH_STATUS = {
  open: { label: 'Waiting for admin', cls: 'bg-amber-50 text-amber-900 ring-amber-200' },
  batched: { label: 'Admin processing', cls: 'bg-blue-50 text-blue-900 ring-blue-200' },
  settled: { label: 'Settled', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200' },
  disputed: { label: 'Disputed', cls: 'bg-rose-50 text-rose-900 ring-rose-200' },
}

const TX_LABEL = {
  manager_commission: 'Commission earned',
  manager_withdrawal: 'Withdrawal payout',
}

function inr(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

function cashStatusMeta(status) {
  return CASH_STATUS[status] || { label: status || '—', cls: 'bg-slate-50 text-slate-700 ring-slate-200' }
}

function StepStrip({ cashHold, available }) {
  const steps = [
    {
      num: 1,
      label: 'Collect on case',
      hint: 'Record cash/UPI',
      done: true,
    },
    {
      num: 2,
      label: 'Cash waiting',
      hint: cashHold > 0.009 ? inr(cashHold) : 'Nothing pending',
      current: cashHold > 0.009,
      done: cashHold <= 0.009,
    },
    {
      num: 3,
      label: 'Withdraw',
      hint: available > 0.009 ? `${inr(available)} ready` : 'After admin settles',
      current: cashHold <= 0.009 && available > 0.009,
    },
  ]

  return (
    <ol className="grid grid-cols-3 gap-1 sm:gap-2">
      {steps.map((step) => {
        let circle =
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold '
        if (step.done && !step.current) circle += 'bg-emerald-600 text-white'
        else if (step.current) circle += 'bg-teal-600 text-white ring-2 ring-teal-300'
        else circle += 'bg-slate-100 text-slate-500'

        return (
          <li key={step.num} className="min-w-0">
            <div className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center">
              <span className={circle}>{step.done && !step.current ? '✓' : step.num}</span>
              <span className="w-full truncate text-[11px] font-semibold text-slate-800 sm:text-xs">
                {step.label}
              </span>
              <span className="hidden w-full truncate text-[10px] text-slate-500 sm:block">{step.hint}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function ManagerFinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'earnings' ? 'earnings' : 'cash'

  const [entries, setEntries] = useState([])
  const [openTotal, setOpenTotal] = useState(0)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, wRes, tRes] = await Promise.all([
        api.get('/manager/ledger'),
        api.get('/manager/wallet'),
        api.get('/manager/wallet/transactions', { params: { page: 1, limit: 30 } }),
      ])
      setEntries(lRes.data?.entries || [])
      setOpenTotal(Number(lRes.data?.openTotal || 0))
      setWallet(wRes.data)
      setTransactions(tRes.data?.transactions || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load finance')
      setEntries([])
      setOpenTotal(0)
      setWallet(null)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cashHold = useMemo(() => {
    if (wallet?.cashToRemit != null) return Number(wallet.cashToRemit)
    return openTotal
  }, [wallet, openTotal])

  const available = Number(wallet?.availableBalance || 0)
  const pendingWithdraw = wallet?.pendingWithdraw

  function setTab(next) {
    setSearchParams(next === 'earnings' ? { tab: 'earnings' } : { tab: 'cash' }, { replace: true })
  }

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

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <div className="space-y-4">
      {/* How money moves */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          How your money moves
        </p>
        <StepStrip cashHold={cashHold} available={available} />
      </div>

      {/* Two key amounts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setTab('cash')}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            tab === 'cash'
              ? 'border-teal-300 bg-teal-50/60 ring-1 ring-teal-200'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cash you still hold</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{inr(cashHold)}</p>
          <p className="mt-1 text-xs text-slate-500">Hand over to admin — your cut unlocks after they settle</p>
        </button>
        <button
          type="button"
          onClick={() => setTab('earnings')}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            tab === 'earnings'
              ? 'border-teal-300 bg-teal-50/60 ring-1 ring-teal-200'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Withdrawable commission</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{inr(available)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Pending cut: {inr(wallet?.pendingCommission || 0)}
          </p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab('cash')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            tab === 'cash' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cash collected
        </button>
        <button
          type="button"
          onClick={() => setTab('earnings')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            tab === 'earnings' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My earnings
        </button>
      </div>

      {tab === 'cash' ? (
        <div className="space-y-2">
          {entries.length === 0 ? (
            <Card hover={false} className="p-6 text-center">
              <p className="text-sm font-medium text-slate-800">No cash recorded yet</p>
              <p className="mt-1 text-sm text-slate-600">
                Open a case, go to Payment, and tap Record collection.
              </p>
              <Link
                to="/manager/bookings"
                className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Go to cases needing collection
              </Link>
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
              const status = cashStatusMeta(e.status)

              return (
                <Card key={e._id} hover={false} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{inr(e.amount)}</p>
                      <p className="mt-0.5 text-sm text-slate-700">{patientName}</p>
                      <p className="text-xs text-slate-500">{issue}</p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      {Number(e.managerCommissionAmount) > 0 ? (
                        <p className="mt-2 text-xs font-medium text-emerald-700">
                          Your cut: {inr(e.managerCommissionAmount)}
                          {e.status === 'settled' ? ' — already credited' : ' — credited after admin settles'}
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
      ) : (
        <div className="space-y-4">
          {!wallet ? (
            <Card hover={false} className="p-6 text-center text-sm text-slate-600">
              Could not load earnings. Try again later.
            </Card>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card hover={false} className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Withdrawable</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{inr(available)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Settled {inr(wallet.settledCommission)} − withdrawn {inr(wallet.withdrawn)}
                  </p>
                </Card>
                <Card hover={false} className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending commission</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{inr(wallet.pendingCommission)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Unlocks when admin settles cash you still hold —{' '}
                    <button
                      type="button"
                      onClick={() => setTab('cash')}
                      className="font-semibold text-teal-700 hover:underline"
                    >
                      see cash list
                    </button>
                  </p>
                </Card>
              </div>

              <Card hover={false} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Withdraw commission</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Lifetime collected: {inr(wallet.totalCollected)} · Commission earned:{' '}
                      {inr(wallet.settledCommission)}
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
                    {new Date(pendingWithdraw.requestedAt).toLocaleDateString('en-IN')} — waiting for admin
                    approval.
                  </p>
                ) : null}
              </Card>

              <Card hover={false} className="p-5">
                <h3 className="font-semibold text-slate-900">History</h3>
                {transactions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">
                    No commission yet. Your cut is credited after admin settles the cash you handed over.
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
            </>
          )}
        </div>
      )}

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
