import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import AdminFlowGuide from '../../components/admin/AdminFlowGuide'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/Pagination'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function formatDateTime(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatDateOnly(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function DueBadge({ due }) {
  const d = Number(due) || 0
  if (d <= 0.009) {
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

const PAYMENT_STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-800 ring-gray-200',
  paid: 'bg-sky-50 text-sky-900 ring-sky-200',
  collected: 'bg-amber-50 text-amber-900 ring-amber-200',
  verified: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-900 ring-rose-200',
  refunded: 'bg-violet-50 text-violet-900 ring-violet-200',
}

const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  paid: 'Paid',
  collected: 'Collected',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
}

function PaymentStatusBadge({ status }) {
  const key = status || 'pending'
  const klass = PAYMENT_STATUS_STYLES[key] || PAYMENT_STATUS_STYLES.pending
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${klass}`}>
      {PAYMENT_STATUS_LABEL[key] || key}
    </span>
  )
}

const WALLET_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'due', label: 'Platform fee due' },
  { id: 'all', label: 'All' },
]

const QUEUE_MODE_TABS = [
  { id: '', label: 'All' },
  { id: 'offline', label: 'Offline' },
  { id: 'online', label: 'Online' },
]

export default function AdminFinancePage() {
  // Tab handling
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || 'wallets'
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab)
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    }
  }, [activeTab])

  // Shared statistics summary
  const [summary, setSummary] = useState(null)

  // 1. Tab: Physio Wallets States
  const [walletRows, setWalletRows] = useState([])
  const [walletFilter, setWalletFilter] = useState('active')
  const [walletSearch, setWalletSearch] = useState('')
  const [walletAppliedSearch, setWalletAppliedSearch] = useState('')
  const [walletPage, setWalletPage] = useState(1)
  const [walletTotalPages, setWalletTotalPages] = useState(1)
  const [walletLoading, setWalletLoading] = useState(true)

  const [selectedPhysio, setSelectedPhysio] = useState(null)
  const [physioDetail, setPhysioDetail] = useState(null)
  const [physioDetailLoading, setPhysioDetailLoading] = useState(false)

  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleNote, setSettleNote] = useState('')
  const [busyAction, setBusyAction] = useState(null)

  const [payoutAction, setPayoutAction] = useState(null)
  const [payoutNote, setPayoutNote] = useState('')

  // 2. Tab: Payment Queue States
  const [queueSearch, setQueueSearch] = useState('')
  const [queueMode, setQueueMode] = useState('')
  const [queueStatus, setQueueStatus] = useState('')
  const [queueDateFrom, setQueueDateFrom] = useState('')
  const [queueDateTo, setQueueDateTo] = useState('')
  const [queueApplied, setQueueApplied] = useState({ search: '', mode: '', status: '', dateFrom: '', dateTo: '' })
  const [queuePage, setQueuePage] = useState(1)
  const [queueLoading, setQueueLoading] = useState(true)
  const [queuePayload, setQueuePayload] = useState(null)
  const [queueVerifyTarget, setQueueVerifyTarget] = useState(null)
  const [queueRejectTarget, setQueueRejectTarget] = useState(null)
  const [queueRejectReason, setQueueRejectReason] = useState('')

  // 3. Tab: Withdrawal Requests States
  const [withdrawalRows, setWithdrawalRows] = useState([])
  const [withdrawalPage, setWithdrawalPage] = useState(1)
  const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1)
  const [withdrawalLoading, setWithdrawalLoading] = useState(true)
  const [withdrawalSearch, setWithdrawalSearch] = useState('')
  const [withdrawalAppliedSearch, setWithdrawalAppliedSearch] = useState('')

  // Load finance summary stats
  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get('/admin/finance/summary')
      setSummary(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Load Wallets tab
  const loadWallets = useCallback(async () => {
    setWalletLoading(true)
    try {
      const res = await api.get('/admin/finance/physios', {
        params: {
          page: walletPage,
          limit: 20,
          search: walletAppliedSearch || undefined,
          filter: walletFilter,
        },
      })
      setWalletRows(res.data?.data || [])
      setWalletTotalPages(res.data?.totalPages || 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load wallets')
    } finally {
      setWalletLoading(false)
    }
  }, [walletPage, walletAppliedSearch, walletFilter])

  // Load Withdrawal Requests tab (uses filter="payout" from backend)
  const loadWithdrawals = useCallback(async () => {
    setWithdrawalLoading(true)
    try {
      const res = await api.get('/admin/finance/physios', {
        params: {
          page: withdrawalPage,
          limit: 20,
          search: withdrawalAppliedSearch || undefined,
          filter: 'payout',
        },
      })
      setWithdrawalRows(res.data?.data || [])
      setWithdrawalTotalPages(res.data?.totalPages || 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load withdrawal requests')
    } finally {
      setWithdrawalLoading(false)
    }
  }, [withdrawalPage, withdrawalAppliedSearch])

  // Load Payment Queue Tab
  const loadQueue = useCallback(async () => {
    setQueueLoading(true)
    try {
      const res = await api.get('/admin/payments', {
        params: {
          page: queuePage,
          limit: 20,
          search: queueApplied.search || undefined,
          mode: queueApplied.mode || undefined,
          status: queueApplied.status || undefined,
          dateFrom: queueApplied.dateFrom || undefined,
          dateTo: queueApplied.dateTo || undefined,
        },
      })
      setQueuePayload(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payment queue')
      setQueuePayload(null)
    } finally {
      setQueueLoading(false)
    }
  }, [queuePage, queueApplied])

  // Triggers loading on tab changes
  useEffect(() => {
    loadSummary()
    if (activeTab === 'wallets') {
      loadWallets()
    } else if (activeTab === 'withdrawals') {
      loadWithdrawals()
    } else if (activeTab === 'queue') {
      loadQueue()
    }
  }, [activeTab, loadSummary, loadWallets, loadWithdrawals, loadQueue])

  // Wallet search apply
  function applyWalletSearch() {
    setWalletAppliedSearch(walletSearch.trim())
    setWalletPage(1)
  }

  // Withdrawal search apply
  function applyWithdrawalSearch() {
    setWithdrawalAppliedSearch(withdrawalSearch.trim())
    setWithdrawalPage(1)
  }

  // Queue filter apply
  function applyQueueFilters(override = {}) {
    setQueueApplied((prev) => ({
      search: override.search !== undefined ? override.search : queueSearch.trim(),
      mode: override.mode !== undefined ? override.mode : prev.mode,
      status: override.status !== undefined ? override.status : queueStatus,
      dateFrom: override.dateFrom !== undefined ? override.dateFrom : queueDateFrom,
      dateTo: override.dateTo !== undefined ? override.dateTo : queueDateTo,
    }))
    setQueuePage(1)
  }

  function setQueueModeTab(next) {
    setQueueMode(next)
    applyQueueFilters({ mode: next })
  }

  function resetQueueFilters() {
    setQueueSearch('')
    setQueueMode('')
    setQueueStatus('')
    setQueueDateFrom('')
    setQueueDateTo('')
    setQueueApplied({ search: '', mode: '', status: '', dateFrom: '', dateTo: '' })
    setQueuePage(1)
  }

  // Open physio details drawer
  async function openPhysioDetail(row) {
    setSelectedPhysio(row)
    setPhysioDetail(null)
    setPhysioDetailLoading(true)
    try {
      const { data } = await api.get(`/admin/finance/physios/${row._id}`)
      setPhysioDetail(data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load details')
    } finally {
      setPhysioDetailLoading(false)
    }
  }

  function closePhysioDetail() {
    setSelectedPhysio(null)
    setPhysioDetail(null)
  }

  // Record Fee Collection (was Settlement)
  function openSettle(row) {
    setSelectedPhysio(row)
    const due = Number(row.wallet?.commissionDue || 0)
    setSettleAmount(due > 0 ? String(due.toFixed(2)) : '')
    setSettleNote('')
    setSettleOpen(true)
  }

  async function submitSettle(e) {
    e?.preventDefault?.()
    if (!selectedPhysio?._id) return
    const amt = Number(settleAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setBusyAction(`s-${selectedPhysio._id}`)
    try {
      await api.post('/admin/finance/settle-commission', {
        physioId: selectedPhysio._id,
        amount: amt,
        note: settleNote.trim() || undefined,
      })
      toast.success('Fee collection recorded')
      setSettleOpen(false)
      setSettleAmount('')
      setSettleNote('')
      loadSummary()
      if (activeTab === 'wallets') loadWallets()
      if (activeTab === 'withdrawals') loadWithdrawals()
      if (selectedPhysio) await openPhysioDetail(selectedPhysio)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setBusyAction(null)
    }
  }

  // Payout approvals (Approve/Reject withdrawals)
  async function submitPayoutAction() {
    if (!payoutAction) return
    const { requestId, action } = payoutAction
    setBusyAction(`w-${requestId}`)
    try {
      await api.patch(`/withdraw/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        note: payoutNote.trim() || undefined,
      })
      toast.success(action === 'approve' ? 'Payout approved' : 'Payout rejected')
      setPayoutAction(null)
      setPayoutNote('')
      loadSummary()
      if (activeTab === 'wallets') loadWallets()
      if (activeTab === 'withdrawals') loadWithdrawals()
      if (selectedPhysio) await openPhysioDetail(selectedPhysio)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setBusyAction(null)
    }
  }

  // Installment queue actions (Verify/Reject offline cash)
  async function confirmVerify() {
    if (!queueVerifyTarget) return
    setBusyAction(`qv-${queueVerifyTarget._id}`)
    try {
      await api.post(`/admin/payments/${queueVerifyTarget._id}/verify`)
      toast.success('Payment verified')
      setQueueVerifyTarget(null)
      loadSummary()
      await loadQueue()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Verification failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function confirmReject() {
    if (!queueRejectTarget) return
    const reason = queueRejectReason.trim()
    if (!reason) {
      toast.error('Enter a reason')
      return
    }
    setBusyAction(`qr-${queueRejectTarget._id}`)
    try {
      await api.post(`/admin/payments/${queueRejectTarget._id}/reject`, { reason })
      toast.success('Payment rejected')
      setQueueRejectTarget(null)
      setQueueRejectReason('')
      loadSummary()
      await loadQueue()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed')
    } finally {
      setBusyAction(null)
    }
  }

  const statTiles = useMemo(
    () => [
      { label: 'Total revenue', value: summary?.totalRevenue, sub: 'Gross from paid bookings' },
      { label: 'Platform fee collected', value: summary?.totalCommission, sub: 'Platform share' },
      { label: 'Platform fee due', value: summary?.pendingSettlements, sub: 'Owed by physiotherapists' },
      {
        label: 'Pending payouts',
        value: summary?.pendingPayoutsAmount,
        sub: `${summary?.pendingPayoutsCount ?? 0} request${summary?.pendingPayoutsCount === 1 ? '' : 's'}`,
      },
    ],
    [summary],
  )

  // Render variables for Payment Queue Tab
  const queueRows = queuePayload?.data || []
  const queueTotalPages = queuePayload?.totalPages || 1
  const queueCounts = queuePayload?.counts || {}
  const queuePendingVerification = queuePayload?.pendingVerification ?? 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Wallets & payouts"
        subtitle="Track physiotherapist earnings, record commission settlements, and approve withdrawal requests."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Wallets & payouts' }]}
        actions={
          <>
            <AdminLink to="/admin/payments">Payment queue →</AdminLink>
            <AdminLink to="/admin/physios">Physiotherapists →</AdminLink>
          </>
        }
      />

      <AdminFlowGuide
        title="Finance flow"
        steps={[
          'Verified payments (from Payment queue) credit physiotherapist wallets and accrue platform commission.',
          'Use Commission due filter to find physiotherapists who owe the platform — record settlement when they pay back.',
          'Approve pending payout requests to debit withdrawable balance after you transfer funds externally.',
          'Open a physiotherapist row for full wallet history, settlements, and recent ledger activity.',
        ]}
      />

      {/* Summary Cards */}
      {!summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statTiles.map((t) => (
            <Card key={t.label} hover={false}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t.label}</p>
              <p className="type-stat mt-2 text-gray-900">{formatInr(t.value)}</p>
              <p className="mt-2 text-xs text-gray-500">{t.sub}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-gray-200 bg-white px-4 py-1 rounded-xl shadow-sm">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {[
            { id: 'wallets', label: 'Physiotherapist wallets' },
            { id: 'queue', label: 'Payment Queue' + (queuePendingVerification > 0 ? ` (${queuePendingVerification})` : '') },
            { id: 'withdrawals', label: 'Withdrawal Requests' + (summary?.pendingPayoutsCount > 0 ? ` (${summary.pendingPayoutsCount})` : '') },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-all ${
                  active
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Tab content: 1. Physio Wallets */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'wallets' && (
        <div className="space-y-6">
          <Card hover={false} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {WALLET_FILTERS.map((f) => {
                const active = walletFilter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setWalletFilter(f.id)
                      setWalletPage(1)
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="text-xs font-medium text-gray-500">Search physiotherapist</label>
                <Input
                  className="mt-1"
                  placeholder="Name or phone"
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyWalletSearch()}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={applyWalletSearch}>
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setWalletSearch('')
                    setWalletAppliedSearch('')
                    setWalletFilter('active')
                    setWalletPage(1)
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card hover={false} className="overflow-hidden p-0">
            {walletLoading ? (
              <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
            ) : walletRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-gray-900">No physiotherapist wallets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3">Physiotherapist</th>
                      <th className="px-4 py-3">Total Earned</th>
                      <th className="px-4 py-3">Withdrawable</th>
                      <th className="px-4 py-3">Platform Fee Owed</th>
                      <th className="px-4 py-3">Pending Payout</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {walletRows.map((row) => {
                      const due = Number(row.wallet?.commissionDue || 0)
                      const pending = row.pendingWithdrawal
                      return (
                        <tr
                          key={row._id}
                          className="cursor-pointer hover:bg-gray-50/80"
                          onClick={() => openPhysioDetail(row)}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{row.name}</div>
                            {row.phone && <div className="text-xs text-gray-500">{row.phone}</div>}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-gray-800">{formatInr(row.wallet?.totalEarned)}</td>
                          <td className="px-4 py-3 tabular-nums text-emerald-800">{formatInr(row.wallet?.availableBalance)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums font-medium text-amber-900">{formatInr(due)}</span>
                              <DueBadge due={due} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {pending ? (
                              <div>
                                <div className="tabular-nums font-medium text-gray-900">{formatInr(pending.amount)}</div>
                                <div className="text-xs text-gray-500">{formatDateTime(pending.requestedAt)}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap justify-end gap-2">
                              {due > 0.009 && (
                                <button
                                  type="button"
                                  onClick={() => openSettle(row)}
                                  disabled={busyAction === `s-${row._id}`}
                                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Mark Fee Collected
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openPhysioDetail(row)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                View Transactions
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!walletLoading && walletRows.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination page={walletPage} totalPages={walletTotalPages} onPageChange={setWalletPage} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Tab content: 2. Payment Queue */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <Card hover={false} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {QUEUE_MODE_TABS.map((t) => {
                const active = queueMode === t.id
                return (
                  <button
                    key={t.id || 'all'}
                    type="button"
                    onClick={() => setQueueModeTab(t.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="min-w-[180px] flex-1">
                <label className="text-xs font-medium text-gray-500">Search</label>
                <Input
                  className="mt-1"
                  placeholder="Physiotherapist, patient, booking id, payment id"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyQueueFilters()}
                />
              </div>
              <div className="w-full min-w-[140px] sm:w-40">
                <label className="text-xs font-medium text-gray-500">Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
                  value={queueStatus}
                  onChange={(e) => setQueueStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="collected">Collected</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="w-full min-w-[120px] sm:w-36">
                <label className="text-xs font-medium text-gray-500">From</label>
                <Input className="mt-1" type="date" value={queueDateFrom} onChange={(e) => setQueueDateFrom(e.target.value)} />
              </div>
              <div className="w-full min-w-[120px] sm:w-36">
                <label className="text-xs font-medium text-gray-500">To</label>
                <Input className="mt-1" type="date" value={queueDateTo} onChange={(e) => setQueueDateTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={() => applyQueueFilters()}>
                  Apply
                </Button>
                <Button type="button" variant="ghost" onClick={resetQueueFilters}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-gray-100 px-2 py-0.5">Total: {queueCounts.all ?? 0}</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">Collected: {queueCounts.collected ?? 0}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-900">Verified: {queueCounts.verified ?? 0}</span>
              {queueCounts.pending ? <span className="rounded-full bg-gray-100 px-2 py-0.5">Pending: {queueCounts.pending}</span> : null}
              {queueCounts.paid ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-900">Paid: {queueCounts.paid}</span> : null}
              {queueCounts.rejected ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-900">Rejected: {queueCounts.rejected}</span> : null}
            </div>
          </Card>

          <Card hover={false} className="overflow-hidden p-0">
            {queueLoading ? (
              <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
            ) : queueRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-gray-900">No installments found in queue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3">Physiotherapist</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {queueRows.map((row) => {
                      const canVerify = row.mode === 'offline' && row.status === 'collected'
                      return (
                        <tr key={row._id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{row.physioName || '—'}</div>
                            {row.physioPhone && <div className="text-xs text-gray-500">{row.physioPhone}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-800">{row.patientName || '—'}</div>
                            {row.patientPhone && <div className="text-xs text-gray-500">{row.patientPhone}</div>}
                          </td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{formatInr(row.amount)}</td>
                          <td className="px-4 py-3 capitalize text-gray-600">{row.mode}</td>
                          <td className="px-4 py-3">
                            <PaymentStatusBadge status={row.status} />
                            {row.status === 'rejected' && row.rejectReason && (
                              <div className="mt-1 max-w-[200px] truncate text-xs text-rose-700" title={row.rejectReason}>
                                {row.rejectReason}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateOnly(row.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {canVerify && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busyAction === `qv-${row._id}`}
                                    onClick={() => setQueueVerifyTarget(row)}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyAction === `qr-${row._id}`}
                                    onClick={() => {
                                      setQueueRejectTarget(row)
                                      setQueueRejectReason('')
                                    }}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <Link
                                to={`/admin/bookings/${row.bookingId}`}
                                className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Open Booking
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!queueLoading && queueRows.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination page={queuePage} totalPages={queueTotalPages} onPageChange={setQueuePage} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Tab content: 3. Withdrawal Requests */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          <Card hover={false} className="p-4 sm:p-5">
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="text-xs font-medium text-gray-500">Search physiotherapist</label>
                <Input
                  className="mt-1"
                  placeholder="Name or phone"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyWithdrawalSearch()}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" variant="outline" onClick={applyWithdrawalSearch}>
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setWithdrawalSearch('')
                    setWithdrawalAppliedSearch('')
                    setWithdrawalPage(1)
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card hover={false} className="overflow-hidden p-0">
            {withdrawalLoading ? (
              <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
            ) : withdrawalRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-gray-900">No pending withdrawals requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3">Physiotherapist</th>
                      <th className="px-4 py-3">Withdrawable Balance</th>
                      <th className="px-4 py-3">Requested Amount</th>
                      <th className="px-4 py-3">Date Requested</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawalRows.map((row) => {
                      const pending = row.pendingWithdrawal
                      if (!pending) return null
                      return (
                        <tr
                          key={row._id}
                          className="hover:bg-gray-50/80"
                        >
                          <td className="px-4 py-3" onClick={() => openPhysioDetail(row)}>
                            <div className="font-medium text-gray-900">{row.name}</div>
                            {row.phone && <div className="text-xs text-gray-500">{row.phone}</div>}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-emerald-800">{formatInr(row.wallet?.availableBalance)}</td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{formatInr(pending.amount)}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDateTime(pending.requestedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPayoutAction({
                                    requestId: pending._id,
                                    action: 'approve',
                                    physio: row,
                                    amount: pending.amount,
                                  })
                                }
                                disabled={busyAction === `w-${pending._id}`}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Approve payout
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPayoutAction({
                                    requestId: pending._id,
                                    action: 'reject',
                                    physio: row,
                                    amount: pending.amount,
                                  })
                                }
                                disabled={busyAction === `w-${pending._id}`}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => openPhysioDetail(row)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!withdrawalLoading && withdrawalRows.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination page={withdrawalPage} totalPages={withdrawalTotalPages} onPageChange={setWithdrawalPage} />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Shared Modals and Drawers */}
      {/* ────────────────────────────────────────────────────────────────────── */}

      {/* Detail Drawer (View Transactions) */}
      {selectedPhysio && !settleOpen && !payoutAction && (
        <DetailDrawer
          physio={selectedPhysio}
          detail={physioDetail}
          loading={physioDetailLoading}
          onClose={closePhysioDetail}
          onSettle={() => openSettle(selectedPhysio)}
          onPayoutAction={(action, pending) =>
            setPayoutAction({ requestId: pending._id, action, physio: selectedPhysio, amount: pending.amount })
          }
        />
      )}

      {/* Record fee collection (Settle) Modal */}
      {settleOpen && selectedPhysio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">Record fee collection</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedPhysio.name} — Platform fee owed{' '}
              <span className="font-semibold text-amber-900">{formatInr(selectedPhysio.wallet?.commissionDue)}</span>
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitSettle}>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Amount (INR)</label>
                <Input
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Note (optional)</label>
                <Input
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="Reference / UTR"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSettleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busyAction === `s-${selectedPhysio._id}`}>
                  {busyAction === `s-${selectedPhysio._id}` ? 'Saving…' : 'Confirm'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Approve/Reject Withdrawal Request Modal */}
      {payoutAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">
              {payoutAction.action === 'approve' ? 'Approve payout' : 'Reject payout'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {payoutAction.action === 'approve' ? (
                <>
                  Debit <span className="font-semibold text-gray-900">{formatInr(payoutAction.amount)}</span> from{' '}
                  <span className="font-semibold text-gray-900">{payoutAction.physio?.name}</span>&apos;s balance
                  and record a withdrawal transaction.
                </>
              ) : (
                <>This leaves the physiotherapist&apos;s balance unchanged. They can submit a new request later.</>
              )}
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-600">
              {payoutAction.action === 'approve' ? 'Payout reference / UTR (optional)' : 'Reason (optional)'}
            </label>
            <Input
              className="mt-1"
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              placeholder={payoutAction.action === 'approve' ? 'Bank ref / UPI txn id' : 'Why rejected'}
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPayoutAction(null)}>
                Cancel
              </Button>
              <button
                type="button"
                disabled={busyAction === `w-${payoutAction.requestId}`}
                onClick={submitPayoutAction}
                className={
                  payoutAction.action === 'approve'
                    ? 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50'
                    : 'rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50'
                }
              >
                {busyAction === `w-${payoutAction.requestId}`
                  ? 'Working…'
                  : payoutAction.action === 'approve'
                  ? 'Confirm approve'
                  : 'Confirm reject'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Verify Offline Cash installment modal */}
      {queueVerifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">Verify payment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Confirm <span className="font-semibold text-gray-900">{formatInr(queueVerifyTarget.amount)}</span> collected by{' '}
              <span className="font-semibold text-gray-900">{queueVerifyTarget.physioName}</span>? This posts the ledger
              entries for this installment.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setQueueVerifyTarget(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmVerify} disabled={busyAction === `qv-${queueVerifyTarget._id}`}>
                {busyAction === `qv-${queueVerifyTarget._id}` ? '…' : 'Confirm verify'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Offline Cash installment modal */}
      {queueRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">Reject collection</h3>
            <p className="mt-1 text-sm text-gray-600">The physiotherapist can record a fresh collection after this.</p>
            <label className="mt-4 block text-xs font-medium text-gray-500">Reason</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm"
              rows={3}
              value={queueRejectReason}
              onChange={(e) => setQueueRejectReason(e.target.value)}
              placeholder="e.g. amount mismatch, patient dispute…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setQueueRejectTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-rose-700"
                onClick={confirmReject}
                disabled={busyAction === `qr-${queueRejectTarget._id}`}
              >
                {busyAction === `qr-${queueRejectTarget._id}` ? '…' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function DetailDrawer({ physio, detail, loading, onClose, onSettle, onPayoutAction }) {
  const wallet = detail?.wallet || physio.wallet || {}
  const pending = detail?.pendingWithdrawal
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="type-page-title text-gray-900">{physio.name}</h2>
              {physio.phone && <p className="text-xs text-gray-500">{physio.phone}</p>}
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <WalletStat label="Total earned" value={wallet.totalEarned} />
            <WalletStat label="Withdrawable" value={wallet.availableBalance} tone="emerald" />
            <WalletStat label="Online earnings" value={wallet.onlineEarning} />
            <WalletStat label="Offline collected" value={wallet.offlineCollected} />
            <WalletStat label="Platform fee owed" value={wallet.commissionDue} tone="amber" />
          </div>

          {pending && (
            <Card hover={false} className="border border-amber-100 bg-amber-50/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Pending payout</p>
                  <p className="type-stat mt-1 text-gray-900">{formatInr(pending.amount)}</p>
                  <p className="text-xs text-gray-500">Requested {formatDateTime(pending.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onPayoutAction('approve', pending)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onPayoutAction('reject', pending)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </Card>
          )}

          {Number(wallet.commissionDue || 0) > 0.009 && (
            <Card hover={false} className="border border-amber-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Platform fee owed</p>
                  <p className="type-stat mt-1 text-amber-900">
                    {formatInr(wallet.commissionDue)}
                  </p>
                  <p className="text-xs text-gray-500">Record once the platform fee has been collected.</p>
                </div>
                <Button type="button" onClick={onSettle}>
                  Collect fee
                </Button>
              </div>
            </Card>
          )}

          <Section title="Withdrawal history" empty={!loading && !(detail?.withdrawals?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.withdrawals?.map((w) => (
                <div
                  key={w._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium tabular-nums text-gray-900">{formatInr(w.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(w.requestedAt)}
                      {w.processedAt ? ` · processed ${formatDateTime(w.processedAt)}` : ''}
                    </p>
                  </div>
                  <WithdrawStatusBadge status={w.status} />
                </div>
              ))
            )}
          </Section>

          <Section title="Fee collection history" empty={!loading && !(detail?.settlementHistory?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.settlementHistory?.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium tabular-nums text-gray-900">{formatInr(t.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.createdAt)}</p>
                    {t.meta?.note && <p className="mt-0.5 text-xs text-gray-600">{t.meta.note}</p>}
                  </div>
                  <span className="text-xs font-medium text-emerald-800">Collected</span>
                </div>
              ))
            )}
          </Section>

          <Section title="Recent activity" empty={!loading && !(detail?.recentTransactions?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.recentTransactions?.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {t.type === 'settlement' ? 'fee collection' : t.type} · {t.direction}
                      {t.meta?.leg ? ` · ${t.meta.leg}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <span
                    className={`tabular-nums font-medium ${
                      t.direction === 'credit' ? 'text-emerald-800' : 'text-gray-800'
                    }`}
                  >
                    {t.direction === 'credit' ? '+' : '-'}
                    {formatInr(t.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function WalletStat({ label, value, tone }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-800' : tone === 'amber' ? 'text-amber-900' : 'text-gray-900'
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${toneClass}`}>{formatInr(value)}</p>
    </div>
  )
}

function Section({ title, empty, children }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {empty ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-500">No entries yet.</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}

function WithdrawStatusBadge({ status }) {
  const klass =
    status === 'approved'
      ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
      : status === 'rejected'
      ? 'bg-rose-50 text-rose-900 ring-rose-200'
      : 'bg-amber-50 text-amber-900 ring-amber-200'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${klass}`}>
      {status}
    </span>
  )
}
