import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FieldLabel from '../../components/ui/FieldLabel'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'

const CASH_STATUS = {
  open: {
    label: 'Waiting for admin',
    cls: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    accent: 'border-l-amber-400',
  },
  batched: {
    label: 'Admin processing',
    cls: 'bg-sky-50 text-sky-800 ring-sky-200/80',
    accent: 'border-l-sky-400',
  },
  settled: {
    label: 'Settled',
    cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    accent: 'border-l-emerald-500',
  },
  disputed: {
    label: 'Disputed',
    cls: 'bg-rose-50 text-rose-800 ring-rose-200/80',
    accent: 'border-l-rose-400',
  },
}

const TX_LABEL = {
  manager_commission: 'Commission earned',
  manager_withdrawal: 'Withdrawal payout',
}

function inr(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

function cashStatusMeta(status) {
  return (
    CASH_STATUS[status] || {
      label: status || '—',
      cls: 'bg-slate-50 text-slate-700 ring-slate-200',
      accent: 'border-l-slate-300',
    }
  )
}

function formatShortDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function CollectionItemCard({
  amount,
  patientName,
  issue,
  statusLabel,
  statusClass,
  accentClass,
  commission,
  commissionNote,
  dateLabel,
  bookingId,
  tone = 'default',
}) {
  const shell =
    tone === 'phonepe'
      ? 'border-sky-100 bg-gradient-to-r from-sky-50/80 to-white'
      : 'border-slate-100 bg-white'

  return (
    <article
      className={[
        'group overflow-hidden rounded-xl border border-l-4 p-0 shadow-sm transition-all duration-200',
        'hover:border-slate-200 hover:shadow-md',
        accentClass || 'border-l-slate-300',
        shell,
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold tabular-nums tracking-tight text-slate-900">{inr(amount)}</p>
            {statusLabel ? (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusClass}`}
              >
                {statusLabel}
              </span>
            ) : null}
            {tone === 'phonepe' ? (
              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-200/80">
                PhonePe
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{patientName}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{issue}</p>
          </div>

          {Number(commission) > 0 ? (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-100">
              <span className="font-semibold tabular-nums">Your cut {inr(commission)}</span>
              {commissionNote ? <span className="font-normal text-emerald-700/80">· {commissionNote}</span> : null}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100/80 pt-3 sm:flex-col sm:items-end sm:justify-between sm:border-t-0 sm:pt-0">
          {dateLabel ? (
            <time className="text-xs tabular-nums text-slate-500">{dateLabel}</time>
          ) : (
            <span />
          )}
          {bookingId ? (
            <Link
              to={`/manager/bookings/${bookingId}`}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-100 transition-colors hover:bg-teal-100 hover:text-teal-950"
            >
              View case
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function ymdLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inDateRange(iso, fromYmd, toYmd) {
  if (!iso) return !fromYmd && !toYmd
  const day = ymdLocal(new Date(iso))
  if (!day) return false
  if (fromYmd && day < fromYmd) return false
  if (toYmd && day > toYmd) return false
  return true
}

const selectCls =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'
const inputCls =
  'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

export default function ManagerFinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab = tabParam === 'earnings' ? 'earnings' : tabParam === 'payout' ? 'payout' : 'cash'

  const [entries, setEntries] = useState([])
  const [openTotal, setOpenTotal] = useState(0)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const cashPag = usePagination()
  const txPag = usePagination()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('')
  const [savingUpi, setSavingUpi] = useState(false)

  const [cashStatus, setCashStatus] = useState('all')
  const [cashFrom, setCashFrom] = useState('')
  const [cashTo, setCashTo] = useState('')
  const [txType, setTxType] = useState('all')
  const [txFrom, setTxFrom] = useState('')
  const [txTo, setTxTo] = useState('')

  const loadWallet = useCallback(async () => {
    const wRes = await api.get('/manager/wallet')
    setWallet(wRes.data)
    setUpiId(wRes.data?.payoutUpiId || '')
    setUpiName(wRes.data?.payoutDisplayName || '')
  }, [])

  const loadCash = useCallback(async () => {
    const lRes = await api.get('/manager/ledger', {
      params: {
        page: cashPag.page,
        limit: cashPag.pageSize,
        status: cashStatus !== 'all' ? cashStatus : undefined,
        dateFrom: cashFrom || undefined,
        dateTo: cashTo || undefined,
      },
    })
    setEntries(lRes.data?.entries || lRes.data?.data || [])
    setOpenTotal(Number(lRes.data?.openTotal || 0))
    cashPag.applyMeta(lRes.data)
  }, [cashPag.page, cashPag.pageSize, cashPag.applyMeta, cashStatus, cashFrom, cashTo])

  const loadTx = useCallback(async () => {
    const tRes = await api.get('/manager/wallet/transactions', {
      params: {
        page: txPag.page,
        limit: txPag.pageSize,
        type: txType !== 'all' ? txType : undefined,
        dateFrom: txFrom || undefined,
        dateTo: txTo || undefined,
      },
    })
    setTransactions(tRes.data?.transactions || tRes.data?.data || [])
    txPag.applyMeta(tRes.data)
  }, [txPag.page, txPag.pageSize, txPag.applyMeta, txType, txFrom, txTo])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadWallet(), loadCash(), loadTx()])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load finance')
      setEntries([])
      setOpenTotal(0)
      setWallet(null)
      setTransactions([])
      cashPag.clearMeta()
      txPag.clearMeta()
    } finally {
      setLoading(false)
    }
  }, [loadWallet, loadCash, loadTx, cashPag.clearMeta, txPag.clearMeta])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    cashPag.resetPage()
  }, [cashStatus, cashFrom, cashTo, cashPag.resetPage])

  useEffect(() => {
    txPag.resetPage()
  }, [txType, txFrom, txTo, txPag.resetPage])

  const cashHold = useMemo(() => {
    if (wallet?.cashToRemit != null) return Number(wallet.cashToRemit)
    return openTotal
  }, [wallet, openTotal])

  const available = Number(wallet?.availableBalance || 0)
  const pendingCommission = Number(wallet?.pendingCommission || 0) + Number(wallet?.pendingPhonePeCut || 0)
  const totalEarnings = Number(wallet?.settledCommission || 0)
  const pendingWithdraw = wallet?.pendingWithdraw
  const hasUpi = Boolean(String(wallet?.payoutUpiId || '').trim())

  const filteredPhonePe = useMemo(() => {
    const rows = wallet?.pendingPhonePe || []
    if (cashStatus !== 'all' && cashStatus !== 'open') return []
    return rows.filter((p) => inDateRange(p.createdAt, cashFrom, cashTo))
  }, [wallet, cashStatus, cashFrom, cashTo])

  const filteredEarningsTotal = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const amt = Number(t.totalAmount || 0)
      if (t.direction === 'credit') return sum + amt
      return sum - amt
    }, 0)
  }, [transactions])

  function setTab(next) {
    const params =
      next === 'earnings' ? { tab: 'earnings' } : next === 'payout' ? { tab: 'payout' } : { tab: 'cash' }
    setSearchParams(params, { replace: true })
  }

  async function saveUpi(e) {
    e.preventDefault()
    setSavingUpi(true)
    try {
      const { data } = await api.patch('/profile/payout', {
        payoutUpiId: upiId.trim(),
        payoutDisplayName: upiName.trim(),
      })
      toast.success(data.message || 'UPI saved')
      setUpiId(data.payoutUpiId || '')
      setUpiName(data.payoutDisplayName || '')
      setWallet((prev) =>
        prev
          ? {
              ...prev,
              payoutUpiId: data.payoutUpiId || '',
              payoutDisplayName: data.payoutDisplayName || '',
            }
          : prev,
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save UPI')
    } finally {
      setSavingUpi(false)
    }
  }

  async function submitWithdraw(e) {
    e.preventDefault()
    if (!hasUpi) {
      toast.error('Save your UPI ID before requesting a withdrawal')
      return
    }
    const amt = Number(withdrawAmount)
    if (!Number.isFinite(amt) || amt < 1) {
      toast.error('Enter an amount of at least ₹1')
      return
    }
    if (amt > available + 0.009) {
      toast.error(`Amount cannot exceed your withdrawable balance of ${inr(available)}`)
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

  if (loading) return <DetailSkeleton />

  return (
    <div className="space-y-4">
      {/* Summary — always visible */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setTab('earnings')}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            tab === 'earnings'
              ? 'border-teal-300 bg-teal-50/70 ring-1 ring-teal-200'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total earnings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{inr(totalEarnings)}</p>
          <p className="mt-1 text-xs text-slate-500">Commission credited after admin settles</p>
        </button>
        <button
          type="button"
          onClick={() => setTab('earnings')}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            tab === 'earnings'
              ? 'border-teal-300 bg-teal-50/70 ring-1 ring-teal-200'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Withdrawable</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{inr(available)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Pending cut {inr(pendingCommission)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setTab('cash')}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${
            tab === 'cash'
              ? 'border-teal-300 bg-teal-50/70 ring-1 ring-teal-200'
              : 'border-slate-200/80 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cash you hold</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">{inr(cashHold)}</p>
          <p className="mt-1 text-xs text-slate-500">Hand over to admin to unlock your cut</p>
        </button>
      </div>

      {tab === 'cash' ? (
        <div className="space-y-3">
          <Card hover={false} className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[9rem] flex-1">
                <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </FieldLabel>
                <select
                  value={cashStatus}
                  onChange={(e) => setCashStatus(e.target.value)}
                  className={`mt-1 w-full ${selectCls}`}
                >
                  <option value="all">All</option>
                  <option value="open">Waiting for admin</option>
                  <option value="batched">Admin processing</option>
                  <option value="settled">Settled</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              <div className="min-w-[9rem] flex-1">
                <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From
                </FieldLabel>
                <input
                  type="date"
                  value={cashFrom}
                  onChange={(e) => setCashFrom(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div className="min-w-[9rem] flex-1">
                <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  To
                </FieldLabel>
                <input
                  type="date"
                  value={cashTo}
                  onChange={(e) => setCashTo(e.target.value)}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              {(cashStatus !== 'all' || cashFrom || cashTo) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCashStatus('all')
                    setCashFrom('')
                    setCashTo('')
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {filteredPhonePe.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                PhonePe — pending admin confirm
              </p>
              {filteredPhonePe.map((p) => {
                const ref = p.bookingRef
                const patientName = ref?.patientName || 'Patient'
                const issue = ref?.issue || 'Home visit'
                const bookingId = ref?.id
                return (
                  <CollectionItemCard
                    key={p._id}
                    amount={p.amount}
                    patientName={patientName}
                    issue={issue}
                    statusLabel="Pending confirm"
                    statusClass="bg-sky-50 text-sky-800 ring-sky-200/80"
                    accentClass="border-l-sky-400"
                    commission={p.managerCommissionAmount}
                    dateLabel={formatShortDate(p.createdAt)}
                    bookingId={bookingId}
                    tone="phonepe"
                  />
                )
              })}
            </div>
          ) : null}

          {entries.length === 0 && filteredPhonePe.length === 0 ? (
            <Card hover={false} className="p-6 text-center">
              <p className="text-sm font-medium text-slate-800">No collections match these filters</p>
              <p className="mt-1 text-sm text-slate-600">
                Record cash on a case, or clear filters to see everything.
              </p>
              <Link
                to="/manager/bookings"
                className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Go to cases
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPhonePe.length > 0 && entries.length > 0 ? (
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Cash handoff</p>
              ) : null}
              {entries.map((e) => {
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
                  <CollectionItemCard
                    key={e._id}
                    amount={e.amount}
                    patientName={patientName}
                    issue={issue}
                    statusLabel={status.label}
                    statusClass={status.cls}
                    accentClass={status.accent}
                    commission={e.managerCommissionAmount}
                    commissionNote={e.status === 'settled' ? 'credited' : 'after settle'}
                    dateLabel={formatShortDate(e.collectedAt)}
                    bookingId={bookingId}
                  />
                )
              })}
              <Pagination {...cashPag.paginationProps} />
            </div>
          )}
        </div>
      ) : null}

      {tab === 'earnings' ? (
        <div className="space-y-3">
          {!wallet ? (
            <Card hover={false} className="p-6 text-center text-sm text-slate-600">
              Could not load earnings. Try again later.
            </Card>
          ) : (
            <>
              <Card hover={false} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Withdraw commission</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Total earned {inr(totalEarnings)} · Withdrawn {inr(wallet.withdrawn)} · Ready{' '}
                      {inr(available)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={available < 1 || Boolean(pendingWithdraw) || !hasUpi}
                    onClick={() => {
                      setWithdrawAmount(String(available))
                      setWithdrawOpen(true)
                    }}
                  >
                    Withdraw money
                  </Button>
                </div>
                {!hasUpi ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
                    Save your UPI ID under{' '}
                    <button
                      type="button"
                      onClick={() => setTab('payout')}
                      className="font-semibold text-teal-800 underline"
                    >
                      Payout UPI
                    </button>{' '}
                    before withdrawing.
                  </p>
                ) : null}
                {pendingWithdraw ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
                    Withdrawal of {inr(pendingWithdraw.amount)} requested on{' '}
                    {new Date(pendingWithdraw.requestedAt).toLocaleDateString('en-IN')} — waiting for admin.
                  </p>
                ) : null}
              </Card>

              <Card hover={false} className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[9rem] flex-1">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </FieldLabel>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      className={`mt-1 w-full ${selectCls}`}
                    >
                      <option value="all">All</option>
                      <option value="manager_commission">Commission earned</option>
                      <option value="manager_withdrawal">Withdrawals</option>
                    </select>
                  </div>
                  <div className="min-w-[9rem] flex-1">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      From
                    </FieldLabel>
                    <input
                      type="date"
                      value={txFrom}
                      onChange={(e) => setTxFrom(e.target.value)}
                      className={`mt-1 ${inputCls}`}
                    />
                  </div>
                  <div className="min-w-[9rem] flex-1">
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      To
                    </FieldLabel>
                    <input
                      type="date"
                      value={txTo}
                      onChange={(e) => setTxTo(e.target.value)}
                      className={`mt-1 ${inputCls}`}
                    />
                  </div>
                  {(txType !== 'all' || txFrom || txTo) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTxType('all')
                        setTxFrom('')
                        setTxTo('')
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {(txFrom || txTo || txType !== 'all') && (
                  <p className="mt-3 text-xs text-slate-600">
                    Filtered net:{' '}
                    <strong className="tabular-nums text-slate-900">{inr(filteredEarningsTotal)}</strong>
                  </p>
                )}
              </Card>

              <Card hover={false} className="p-5">
                <h3 className="font-semibold text-slate-900">History</h3>
                {transactions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">
                    No transactions match these filters.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 space-y-2">
                      {transactions.map((t) => {
                        const isCredit = t.direction === 'credit'
                        const booking = t.bookingId
                        const patientName =
                          booking?.userId && typeof booking.userId === 'object' ? booking.userId.name : null
                        return (
                          <div
                            key={t._id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-3 transition-colors hover:border-slate-200 hover:bg-white"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {TX_LABEL[t.type] || t.type}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {patientName ? `${patientName} · ` : ''}
                                {formatShortDate(t.createdAt)}
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
                    <Pagination {...txPag.paginationProps} />
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      ) : null}

      {tab === 'payout' ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Payout UPI</h3>
          <p className="mt-1 text-xs text-slate-500">
            Admin transfers commission to this UPI when a withdrawal is approved.
          </p>
          {hasUpi ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-100">
              Saved: <span className="font-semibold">{wallet?.payoutUpiId}</span>
              {wallet?.payoutDisplayName ? ` · ${wallet.payoutDisplayName}` : ''}
            </p>
          ) : null}
          <form onSubmit={saveUpi} className="mt-4 space-y-3">
            <div>
              <FieldLabel required className="block text-sm font-medium text-slate-700">
                UPI ID
              </FieldLabel>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@oksbi"
                className={`mt-1 ${inputCls}`}
                required
              />
            </div>
            <div>
              <FieldLabel className="block text-sm font-medium text-slate-700">
                Name on UPI (optional)
              </FieldLabel>
              <input
                type="text"
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                placeholder="Account holder name"
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <Button type="submit" loading={savingUpi} disabled={savingUpi}>
              Save UPI
            </Button>
          </form>
        </Card>
      ) : null}

      {withdrawOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <form
            noValidate
            onSubmit={submitWithdraw}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="font-semibold text-slate-900">Withdraw commission</h3>
            <p className="mt-1 text-xs text-slate-500">Withdrawable balance: {inr(available)}</p>
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Paying to <span className="font-semibold">{wallet?.payoutUpiId}</span>
              {wallet?.payoutDisplayName ? ` (${wallet.payoutDisplayName})` : ''}
            </p>
            <FieldLabel required className="mt-4 block text-sm font-medium text-slate-700">
              Amount (₹)
            </FieldLabel>
            {(() => {
              const amt = Number(withdrawAmount)
              const empty = withdrawAmount === '' || withdrawAmount == null
              const invalidNumber = !empty && (!Number.isFinite(amt) || amt < 1)
              const overBalance = Number.isFinite(amt) && amt > available + 0.009
              const inputInvalid = invalidNumber || overBalance
              return (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step={1}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    aria-invalid={inputInvalid}
                    className={[
                      'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2',
                      inputInvalid
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/20',
                    ].join(' ')}
                    required
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Maximum you can withdraw:{' '}
                    <strong className="font-semibold text-slate-700">{inr(available)}</strong>
                  </p>
                  {overBalance ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-700">
                      Amount exceeds your withdrawable balance of {inr(available)}.
                    </p>
                  ) : null}
                  {invalidNumber ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-700">Enter an amount of at least ₹1.</p>
                  ) : null}
                  <div className="mt-5 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setWithdrawOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting || empty || inputInvalid || available < 1}
                    >
                      {submitting ? '…' : 'Request'}
                    </Button>
                  </div>
                </>
              )
            })()}
          </form>
        </div>
      ) : null}
    </div>
  )
}
