import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import AdminFlowGuide from '../../components/admin/AdminFlowGuide'
import AdminPaymentQueueTable, { PaymentQueueVerifySummary, isManagerPhonePe } from '../../components/admin/AdminPaymentQueueTable'
import AdminPaymentFiltersDrawer from '../../components/admin/AdminPaymentFiltersDrawer'
import {
  AdminWalletFiltersDrawer,
  AdminWithdrawFiltersDrawer,
} from '../../components/admin/AdminFinanceFilterDrawers'
import { MobileFilterIconButton } from '../../components/admin/AdminFilterSheet'
import AdminCaseContext from '../../components/admin/AdminCaseContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import FieldLabel from '../../components/ui/FieldLabel'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import TableSkeleton from '../../components/ui/skeletons/TableSkeleton'
import Skeleton from '../../components/ui/Skeleton'

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

const WALLET_FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'due', label: 'Platform fee due' },
  { id: 'all', label: 'All' },
]

const QUEUE_MODE_TABS = [
  { id: '', label: 'All modes' },
  { id: 'offline', label: 'Offline' },
  { id: 'online', label: 'Online' },
]

const QUEUE_CHANNEL_OPTIONS = [
  { id: '', label: 'All channels' },
  { id: 'cash', label: 'Cash / UPI' },
  { id: 'phonepe_qr', label: 'PhonePe QR' },
  { id: 'online', label: 'Online (Razorpay)' },
]

const QUEUE_COLLECTOR_OPTIONS = [
  { id: '', label: 'Anyone' },
  { id: 'manager', label: 'Care manager' },
  { id: 'physio', label: 'Physiotherapist' },
]

const emptyQueueFilters = () => ({
  search: '',
  mode: '',
  channel: '',
  collector: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
})

const emptyWithdrawFilters = () => ({
  search: '',
  payee: '',
  status: 'pending',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
})

const WITHDRAW_PAYEE_TABS = [
  { id: '', label: 'All payees' },
  { id: 'manager', label: 'Care managers' },
  { id: 'physio', label: 'Physiotherapists' },
]

const WITHDRAW_STATUS_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' },
]

export default function AdminFinancePage() {
  // Tab handling
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') || 'wallets'
    return tab === 'history' ? 'queue' : tab
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
  const walletPag = usePagination()
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

  // 2. Tab: Payment history
  const [queueSearch, setQueueSearch] = useState('')
  const [queueMode, setQueueMode] = useState('')
  const [queueChannel, setQueueChannel] = useState('')
  const [queueCollector, setQueueCollector] = useState('')
  const [queueStatus, setQueueStatus] = useState('')
  const [queueDateFrom, setQueueDateFrom] = useState('')
  const [queueDateTo, setQueueDateTo] = useState('')
  const [queueAmountMin, setQueueAmountMin] = useState('')
  const [queueAmountMax, setQueueAmountMax] = useState('')
  const [queueApplied, setQueueApplied] = useState(emptyQueueFilters)
  const queuePag = usePagination()
  const [queueLoading, setQueueLoading] = useState(true)
  const [queuePayload, setQueuePayload] = useState(null)
  const [queueVerifyTarget, setQueueVerifyTarget] = useState(null)
  const [queueRejectTarget, setQueueRejectTarget] = useState(null)
  const [queueRejectReason, setQueueRejectReason] = useState('')
  const [queueFiltersOpen, setQueueFiltersOpen] = useState(false)
  const [walletFiltersOpen, setWalletFiltersOpen] = useState(false)
  const [withdrawFiltersOpen, setWithdrawFiltersOpen] = useState(false)

  // 3. Tab: Withdrawal Requests States (physio + manager)
  const [withdrawalRows, setWithdrawalRows] = useState([])
  const [withdrawalLoading, setWithdrawalLoading] = useState(true)
  const withdrawalPag = usePagination()
  const [withdrawalSearch, setWithdrawalSearch] = useState('')
  const [withdrawalPayee, setWithdrawalPayee] = useState('')
  const [withdrawalStatus, setWithdrawalStatus] = useState('pending')
  const [withdrawalDateFrom, setWithdrawalDateFrom] = useState('')
  const [withdrawalDateTo, setWithdrawalDateTo] = useState('')
  const [withdrawalAmountMin, setWithdrawalAmountMin] = useState('')
  const [withdrawalAmountMax, setWithdrawalAmountMax] = useState('')
  const [withdrawalApplied, setWithdrawalApplied] = useState(emptyWithdrawFilters)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)

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
          page: walletPag.page,
          limit: walletPag.pageSize,
          search: walletAppliedSearch || undefined,
          filter: walletFilter,
        },
      })
      setWalletRows(res.data?.data || [])
      walletPag.applyMeta(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load wallets')
      walletPag.clearMeta()
    } finally {
      setWalletLoading(false)
    }
  }, [walletPag.page, walletPag.pageSize, walletPag.applyMeta, walletPag.clearMeta, walletAppliedSearch, walletFilter])

  // Load Withdrawal Requests tab — physio + manager from /withdraw
  const loadWithdrawals = useCallback(async () => {
    setWithdrawalLoading(true)
    try {
      const res = await api.get('/withdraw', {
        params: {
          page: withdrawalPag.page,
          limit: withdrawalPag.pageSize,
          payee: withdrawalApplied.payee || undefined,
          status: withdrawalApplied.status || undefined,
          search: withdrawalApplied.search || undefined,
          dateFrom: withdrawalApplied.dateFrom || undefined,
          dateTo: withdrawalApplied.dateTo || undefined,
          amountMin: withdrawalApplied.amountMin || undefined,
          amountMax: withdrawalApplied.amountMax || undefined,
        },
      })
      const rows = Array.isArray(res.data) ? res.data : res.data?.data || []
      setWithdrawalRows(rows)
      if (Array.isArray(res.data)) {
        withdrawalPag.applyMeta({ total: rows.length, totalPages: 1 })
      } else {
        withdrawalPag.applyMeta({
          total: Number(res.data?.total) || rows.length,
          totalPages: Number(res.data?.totalPages) || 1,
        })
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load withdrawal requests')
      setWithdrawalRows([])
      withdrawalPag.clearMeta()
    } finally {
      setWithdrawalLoading(false)
    }
  }, [withdrawalApplied, withdrawalPag.page, withdrawalPag.pageSize, withdrawalPag.applyMeta, withdrawalPag.clearMeta])

  // Load Payment Queue Tab
  const loadQueue = useCallback(async () => {
    setQueueLoading(true)
    try {
      const res = await api.get('/admin/payments', {
        params: {
          page: queuePag.page,
          limit: queuePag.pageSize,
          search: queueApplied.search || undefined,
          mode: queueApplied.mode || undefined,
          channel: queueApplied.channel || undefined,
          collector: queueApplied.collector || undefined,
          status: queueApplied.status || undefined,
          dateFrom: queueApplied.dateFrom || undefined,
          dateTo: queueApplied.dateTo || undefined,
          amountMin: queueApplied.amountMin || undefined,
          amountMax: queueApplied.amountMax || undefined,
        },
      })
      setQueuePayload(res.data)
      queuePag.applyMeta(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payment history')
      setQueuePayload(null)
      queuePag.clearMeta()
    } finally {
      setQueueLoading(false)
    }
  }, [queuePag.page, queuePag.pageSize, queuePag.applyMeta, queuePag.clearMeta, queueApplied])

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
    walletPag.resetPage()
  }

  // Withdrawal filters
  function readWithdrawFilterDraft() {
    return {
      search: withdrawalSearch.trim(),
      payee: withdrawalPayee,
      status: withdrawalStatus,
      dateFrom: withdrawalDateFrom,
      dateTo: withdrawalDateTo,
      amountMin: String(withdrawalAmountMin || '').trim(),
      amountMax: String(withdrawalAmountMax || '').trim(),
    }
  }

  function applyWithdrawalFilters(override = {}) {
    withdrawalPag.resetPage()
    setWithdrawalApplied({ ...readWithdrawFilterDraft(), ...override })
  }

  function resetWithdrawalFilters() {
    setWithdrawalSearch('')
    setWithdrawalPayee('')
    setWithdrawalStatus('pending')
    setWithdrawalDateFrom('')
    setWithdrawalDateTo('')
    setWithdrawalAmountMin('')
    setWithdrawalAmountMax('')
    withdrawalPag.resetPage()
    setWithdrawalApplied(emptyWithdrawFilters())
  }

  function applyWithdrawalFiltersFromDrawer(next) {
    setWithdrawalSearch(next.search || '')
    setWithdrawalPayee(next.payee || '')
    setWithdrawalStatus(next.status ?? 'pending')
    setWithdrawalDateFrom(next.dateFrom || '')
    setWithdrawalDateTo(next.dateTo || '')
    setWithdrawalAmountMin(next.amountMin || '')
    setWithdrawalAmountMax(next.amountMax || '')
    withdrawalPag.resetPage()
    setWithdrawalApplied({
      search: String(next.search || '').trim(),
      payee: next.payee || '',
      status: next.status ?? 'pending',
      dateFrom: next.dateFrom || '',
      dateTo: next.dateTo || '',
      amountMin: String(next.amountMin || '').trim(),
      amountMax: String(next.amountMax || '').trim(),
    })
  }

  function countWithdrawAdvancedFilters() {
    const a = withdrawalApplied
    let n = 0
    if (a.status && a.status !== 'pending') n += 1
    if (a.payee) n += 1
    if (a.dateFrom) n += 1
    if (a.dateTo) n += 1
    if (a.amountMin) n += 1
    if (a.amountMax) n += 1
    if (a.search) n += 1
    return n
  }

  function resetWalletFilters() {
    setWalletSearch('')
    setWalletAppliedSearch('')
    setWalletFilter('active')
    walletPag.resetPage()
  }

  function applyWalletFiltersFromDrawer(next) {
    setWalletFilter(next.filter || 'active')
    setWalletSearch(next.search || '')
    setWalletAppliedSearch(String(next.search || '').trim())
    walletPag.resetPage()
  }

  function countWalletAdvancedFilters() {
    let n = 0
    if (walletFilter && walletFilter !== 'active') n += 1
    if (walletAppliedSearch) n += 1
    return n
  }

  function openWithdrawalDetail(row) {
    setSelectedWithdrawal(row)
  }

  function closeWithdrawalDetail() {
    setSelectedWithdrawal(null)
  }

  function startPayoutFromRow(row, action) {
    const payee = withdrawPayee(row)
    setPayoutAction({
      requestId: row._id,
      action,
      payeeName: payee.name,
      payeeKind: payee.kind,
      amount: row.amount,
      payoutUpiId: row.payoutUpiId || '',
      payoutDisplayName: row.payoutDisplayName || '',
    })
  }

  function withdrawPayee(row) {
    if (row?.managerId) {
      return {
        kind: 'manager',
        label: 'Care manager',
        name: row.managerId?.name || 'Care manager',
        phone: row.managerId?.phone || '',
        id: row.managerId?._id || row.managerId,
      }
    }
    return {
      kind: 'physio',
      label: 'Physiotherapist',
      name: row.physioId?.name || 'Physiotherapist',
      phone: row.physioId?.phone || '',
      id: row.physioId?._id || row.physioId,
    }
  }

  function readQueueFilterDraft() {
    return {
      search: queueSearch.trim(),
      mode: queueMode,
      channel: queueChannel,
      collector: queueCollector,
      status: queueStatus,
      dateFrom: queueDateFrom,
      dateTo: queueDateTo,
      amountMin: String(queueAmountMin || '').trim(),
      amountMax: String(queueAmountMax || '').trim(),
    }
  }

  function applyQueueFilters(override = {}) {
    const draft = readQueueFilterDraft()
    setQueueApplied({ ...draft, ...override, search: override.search !== undefined ? override.search : draft.search })
    queuePag.resetPage()
  }

  function applyQueueFiltersFromDrawer(next) {
    setQueueSearch(next.search ?? queueSearch)
    setQueueMode(next.mode || '')
    setQueueChannel(next.channel || '')
    setQueueCollector(next.collector || '')
    setQueueStatus(next.status || '')
    setQueueDateFrom(next.dateFrom || '')
    setQueueDateTo(next.dateTo || '')
    setQueueAmountMin(next.amountMin || '')
    setQueueAmountMax(next.amountMax || '')
    setQueueApplied({
      search: String(next.search ?? queueSearch).trim(),
      mode: next.mode || '',
      channel: next.channel || '',
      collector: next.collector || '',
      status: next.status || '',
      dateFrom: next.dateFrom || '',
      dateTo: next.dateTo || '',
      amountMin: String(next.amountMin || '').trim(),
      amountMax: String(next.amountMax || '').trim(),
    })
    queuePag.resetPage()
  }

  function countQueueAdvancedFilters() {
    const a = queueApplied
    let n = 0
    if (a.mode) n += 1
    if (a.channel) n += 1
    if (a.collector) n += 1
    if (a.status) n += 1
    if (a.dateFrom) n += 1
    if (a.dateTo) n += 1
    if (a.amountMin) n += 1
    if (a.amountMax) n += 1
    return n
  }

  function setQueueModeTab(next) {
    setQueueMode(next)
    const nextStatus = next === 'online' ? '' : queueStatus
    setQueueStatus(nextStatus)
    if (next === 'online') setQueueChannel('online')
    else if (queueChannel === 'online') setQueueChannel('')
    applyQueueFilters({
      mode: next,
      status: nextStatus,
      channel: next === 'online' ? 'online' : queueChannel === 'online' ? '' : queueChannel,
    })
  }

  function showNeedsVerificationQueue() {
    const next = {
      ...emptyQueueFilters(),
      mode: 'offline',
      status: 'collected',
    }
    setQueueSearch('')
    setQueueMode('offline')
    setQueueChannel('')
    setQueueCollector('')
    setQueueStatus('collected')
    setQueueDateFrom('')
    setQueueDateTo('')
    setQueueAmountMin('')
    setQueueAmountMax('')
    setQueueApplied(next)
    queuePag.resetPage()
    setActiveTab('queue')
  }

  function resetQueueFilters() {
    setQueueSearch('')
    setQueueMode('')
    setQueueChannel('')
    setQueueCollector('')
    setQueueStatus('')
    setQueueDateFrom('')
    setQueueDateTo('')
    setQueueAmountMin('')
    setQueueAmountMax('')
    setQueueApplied(emptyQueueFilters())
    queuePag.resetPage()
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

  // Payout approvals (Approve/Reject withdrawals) — physio or manager
  async function submitPayoutAction() {
    if (!payoutAction) return
    const { requestId, action } = payoutAction
    setBusyAction(`w-${requestId}`)
    try {
      await api.patch(`/withdraw/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        payoutReference: action === 'approve' ? payoutNote.trim() || undefined : undefined,
        note: action === 'reject' ? payoutNote.trim() || undefined : undefined,
      })
      toast.success(action === 'approve' ? 'Payout approved' : 'Payout rejected')
      setPayoutAction(null)
      setPayoutNote('')
      setSelectedWithdrawal(null)
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
      { label: 'Total revenue', value: summary?.totalRevenue, sub: 'Sum of verified installments (cash + PhonePe + online)' },
      { label: 'Platform fee collected', value: summary?.totalCommission, sub: 'Platform share from settled cash, PhonePe QR, online & remitted physio fees' },
      { label: 'Platform fee due', value: summary?.pendingSettlements, sub: 'Owed by physiotherapists' },
      {
        label: 'Pending payouts',
        value: summary?.pendingPayoutsAmount,
        sub: `${summary?.pendingPayoutsCount ?? 0} request${summary?.pendingPayoutsCount === 1 ? '' : 's'} (physio + care manager)`,
      },
    ],
    [summary],
  )

  // Render variables for Payment Queue Tab
  const queueRows = queuePayload?.data || []
  const queueCounts = queuePayload?.counts || {}
  const queuePendingVerification =
    queuePayload?.pendingVerification ?? summary?.pendingVerification ?? 0

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <AdminPageHeader
        title="Wallets & payouts"
        subtitle="Track physiotherapist earnings, settle platform fees, and approve physio or care manager withdrawal requests."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Wallets & payouts' }]}
        actions={<AdminLink to="/admin/physios">Physiotherapists →</AdminLink>}
      />

      <AdminFlowGuide
        title="Finance flow"
        steps={[
          'Use Payment history to track every installment — filter by channel, collector, status, amount, or date. Verify PhonePe QR / offline collections from the same list.',
          'Use Commission due filter to find physiotherapists who owe the platform — record settlement when they pay back.',
          'Approve pending payout requests (physiotherapists and care managers) on Withdrawal Requests after you transfer funds externally.',
          'Open a physiotherapist row for full wallet history, settlements, and recent ledger activity.',
        ]}
      />

      {/* Summary Cards */}
      {!summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
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
      <div className="min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm">
        <nav
          className="flex gap-1 overflow-x-auto overscroll-x-contain px-2 scrollbar-none sm:gap-2 sm:px-3"
          aria-label="Tabs"
        >
          {[
            {
              id: 'wallets',
              short: 'Wallets',
              label: 'Physiotherapist wallets',
            },
            {
              id: 'queue',
              short: queuePendingVerification > 0 ? `Payments (${queuePendingVerification})` : 'Payments',
              label:
                'Payment history' + (queuePendingVerification > 0 ? ` (${queuePendingVerification})` : ''),
            },
            {
              id: 'withdrawals',
              short:
                summary?.pendingPayoutsCount > 0
                  ? `Withdrawals (${summary.pendingPayoutsCount})`
                  : 'Withdrawals',
              label:
                'Withdrawal Requests' +
                (summary?.pendingPayoutsCount > 0 ? ` (${summary.pendingPayoutsCount})` : ''),
            },
          ].map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-all sm:px-4 sm:py-3.5 ${
                  active
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
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
            {/* Mobile: search + filter icon */}
            <div className="flex items-center gap-2 sm:hidden">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Name or phone"
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyWalletSearch()}
                />
              </div>
              <MobileFilterIconButton
                count={countWalletAdvancedFilters()}
                onClick={() => setWalletFiltersOpen(true)}
              />
            </div>
            {countWalletAdvancedFilters() > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
                <p className="text-xs text-gray-500">
                  {walletFilter !== 'active' ? WALLET_FILTERS.find((f) => f.id === walletFilter)?.label : 'Filtered'}
                  {walletAppliedSearch ? ` · “${walletAppliedSearch}”` : ''}
                </p>
                <button type="button" className="text-xs font-semibold text-teal-700" onClick={resetWalletFilters}>
                  Clear
                </button>
              </div>
            ) : null}

            {/* Desktop filters */}
            <div className="hidden sm:block">
              <div className="flex flex-wrap items-center gap-2">
                {WALLET_FILTERS.map((f) => {
                  const active = walletFilter === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setWalletFilter(f.id)
                        walletPag.resetPage()
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
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="min-w-0 flex-1 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-gray-500">Search physiotherapist</label>
                  <Input
                    className="mt-1"
                    placeholder="Name or phone"
                    value={walletSearch}
                    onChange={(e) => setWalletSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyWalletSearch()}
                  />
                </div>
                <div className="flex items-stretch gap-2 sm:items-end">
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={applyWalletSearch}>
                    Apply
                  </Button>
                  <Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={resetWalletFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card hover={false} className="min-w-0 overflow-hidden p-0">
            {walletLoading ? (
              <div className="p-4">
                <TableSkeleton rows={6} />
              </div>
            ) : walletRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-gray-900">No physiotherapist wallets found</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <ul className="divide-y divide-gray-100 md:hidden">
                  {walletRows.map((row) => {
                    const due = Number(row.wallet?.commissionDue || 0)
                    const pending = row.pendingWithdrawal
                    return (
                      <li key={row._id} className="p-4">
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => openPhysioDetail(row)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">{row.name}</p>
                              {row.phone ? <p className="text-xs text-gray-500">{row.phone}</p> : null}
                            </div>
                            <DueBadge due={due} />
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <dt className="text-gray-500">Total earned</dt>
                              <dd className="mt-0.5 tabular-nums font-medium text-gray-900">
                                {formatInr(row.wallet?.totalEarned)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Withdrawable</dt>
                              <dd className="mt-0.5 tabular-nums font-medium text-emerald-800">
                                {formatInr(row.wallet?.availableBalance)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Platform fee owed</dt>
                              <dd className="mt-0.5 tabular-nums font-medium text-amber-900">{formatInr(due)}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Pending payout</dt>
                              <dd className="mt-0.5 tabular-nums font-medium text-gray-900">
                                {pending ? formatInr(pending.amount) : '—'}
                              </dd>
                            </div>
                          </dl>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
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
                      </li>
                    )
                  })}
                </ul>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
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
              </>
            )}
            {!walletLoading && walletRows.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination {...walletPag.paginationProps} />
              </div>
            )}
          </Card>

          {walletFiltersOpen ? (
            <AdminWalletFiltersDrawer
              draft={{ filter: walletFilter, search: walletSearch }}
              filterOptions={WALLET_FILTERS}
              onClose={() => setWalletFiltersOpen(false)}
              onApply={applyWalletFiltersFromDrawer}
              onReset={resetWalletFilters}
            />
          ) : null}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Tab content: 2. Payment history */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <Card hover={false} className="min-w-0 overflow-hidden p-0">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">Payment history</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Cash, PhonePe QR, and online installments
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {queuePendingVerification > 0 ? (
                    <button
                      type="button"
                      onClick={showNeedsVerificationQueue}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        queueApplied.mode === 'offline' && queueApplied.status === 'collected'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {queuePendingVerification} need verification
                    </button>
                  ) : null}
                  <p className="text-xs tabular-nums text-gray-500">
                    <span className="font-medium text-gray-800">{queuePayload?.total ?? 0}</span>
                    {' · '}
                    {Number(queuePayload?.filteredAmountSum) > 0
                      ? formatInr(queuePayload.filteredAmountSum)
                      : '₹0'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 lg:hidden">
                <div className="min-w-0 flex-1">
                  <Input
                    placeholder="Search patient, phone, manager…"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyQueueFilters()}
                  />
                </div>
                <MobileFilterIconButton
                  count={countQueueAdvancedFilters()}
                  onClick={() => setQueueFiltersOpen(true)}
                />
              </div>

              {countQueueAdvancedFilters() > 0 ? (
                <div className="mt-2 flex items-center justify-between gap-2 lg:hidden">
                  <p className="text-xs text-gray-500">
                    {countQueueAdvancedFilters()} filter{countQueueAdvancedFilters() === 1 ? '' : 's'} active
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-700"
                    onClick={resetQueueFilters}
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              {/* Desktop filters (unchanged layout) */}
              <div className="mt-4 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <Input
                    placeholder="Search patient, phone, manager, physio, issue, booking, note…"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyQueueFilters()}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" onClick={() => applyQueueFilters()}>
                    Apply
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetQueueFilters}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="mt-3 hidden max-w-full flex-wrap items-center gap-2 overflow-x-auto lg:flex">
                <div className="inline-flex shrink-0 rounded-lg bg-gray-100 p-0.5">
                  {QUEUE_MODE_TABS.map((t) => {
                    const active = queueMode === t.id
                    return (
                      <button
                        key={t.id || 'all'}
                        type="button"
                        onClick={() => setQueueModeTab(t.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                {[
                  {
                    id: '',
                    label: 'All',
                    count: queueCounts.all,
                    active: !queueApplied.status,
                    onClick: () => {
                      setQueueStatus('')
                      applyQueueFilters({ status: '' })
                    },
                    activeCls: 'bg-gray-900 text-white',
                    idleCls: 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
                  },
                  {
                    id: 'needs',
                    label: 'Needs verification',
                    count: queuePendingVerification || queueCounts.collected,
                    active: queueApplied.mode === 'offline' && queueApplied.status === 'collected',
                    onClick: showNeedsVerificationQueue,
                    activeCls: 'bg-amber-600 text-white',
                    idleCls: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100',
                  },
                  {
                    id: 'verified',
                    label: 'Verified',
                    count: queueCounts.verified,
                    active: queueApplied.status === 'verified',
                    onClick: () => {
                      setQueueStatus('verified')
                      applyQueueFilters({ status: 'verified' })
                    },
                    activeCls: 'bg-emerald-700 text-white',
                    idleCls: 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100',
                  },
                  ...(queueCounts.pending
                    ? [
                        {
                          id: 'pending',
                          label: 'Pending',
                          count: queueCounts.pending,
                          active: queueApplied.status === 'pending',
                          onClick: () => {
                            setQueueStatus('pending')
                            applyQueueFilters({ status: 'pending' })
                          },
                          activeCls: 'bg-gray-800 text-white',
                          idleCls: 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50',
                        },
                      ]
                    : []),
                  ...(queueCounts.paid
                    ? [
                        {
                          id: 'paid',
                          label: 'Paid',
                          count: queueCounts.paid,
                          active: queueApplied.status === 'paid',
                          onClick: () => {
                            setQueueStatus('paid')
                            applyQueueFilters({ status: 'paid' })
                          },
                          activeCls: 'bg-sky-700 text-white',
                          idleCls: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100',
                        },
                      ]
                    : []),
                  ...(queueCounts.rejected
                    ? [
                        {
                          id: 'rejected',
                          label: 'Rejected',
                          count: queueCounts.rejected,
                          active: queueApplied.status === 'rejected',
                          onClick: () => {
                            setQueueStatus('rejected')
                            applyQueueFilters({ status: 'rejected' })
                          },
                          activeCls: 'bg-rose-700 text-white',
                          idleCls: 'bg-rose-50 text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100',
                        },
                      ]
                    : []),
                  ...(queueCounts.refunded
                    ? [
                        {
                          id: 'refunded',
                          label: 'Refunded',
                          count: queueCounts.refunded,
                          active: queueApplied.status === 'refunded',
                          onClick: () => {
                            setQueueStatus('refunded')
                            applyQueueFilters({ status: 'refunded' })
                          },
                          activeCls: 'bg-violet-700 text-white',
                          idleCls: 'bg-violet-50 text-violet-900 ring-1 ring-violet-200 hover:bg-violet-100',
                        },
                      ]
                    : []),
                ].map((chip) => (
                  <button
                    key={chip.id || 'all-status'}
                    type="button"
                    onClick={chip.onClick}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      chip.active ? chip.activeCls : chip.idleCls
                    }`}
                  >
                    {chip.label}
                    <span className={`tabular-nums ${chip.active ? 'opacity-80' : 'opacity-60'}`}>
                      {chip.count ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 hidden gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-6">
                <select
                  aria-label="Channel"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
                  value={queueChannel}
                  onChange={(e) => {
                    const next = e.target.value
                    setQueueChannel(next)
                    const nextMode =
                      next === 'online' ? 'online' : next === 'cash' || next === 'phonepe_qr' ? 'offline' : queueMode
                    if (next === 'online') setQueueMode('online')
                    else if (next === 'cash' || next === 'phonepe_qr') setQueueMode('offline')
                    applyQueueFilters({ channel: next, mode: nextMode })
                  }}
                >
                  {QUEUE_CHANNEL_OPTIONS.map((o) => (
                    <option key={o.id || 'all-ch'} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Collected by"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
                  value={queueCollector}
                  onChange={(e) => {
                    const next = e.target.value
                    setQueueCollector(next)
                    applyQueueFilters({ collector: next })
                  }}
                >
                  {QUEUE_COLLECTOR_OPTIONS.map((o) => (
                    <option key={o.id || 'all-col'} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min ₹"
                  value={queueAmountMin}
                  onChange={(e) => setQueueAmountMin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyQueueFilters()}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max ₹"
                  value={queueAmountMax}
                  onChange={(e) => setQueueAmountMax(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyQueueFilters()}
                />
                <Input
                  type="date"
                  aria-label="From date"
                  value={queueDateFrom}
                  onChange={(e) => setQueueDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  aria-label="To date"
                  value={queueDateTo}
                  onChange={(e) => setQueueDateTo(e.target.value)}
                />
              </div>
            </div>

            <AdminPaymentQueueTable
              rows={queueRows}
              loading={queueLoading}
              {...queuePag.paginationProps}
              busy={busyAction}
              onVerify={setQueueVerifyTarget}
              onReject={(row) => {
                setQueueRejectTarget(row)
                setQueueRejectReason('')
              }}
              openBookingLabel="Open"
              emptyTitle="No payments match your filters"
              emptyHint="Try Reset, or clear channel / amount / date filters."
            />
          </Card>

          {queueFiltersOpen ? (
            <AdminPaymentFiltersDrawer
              draft={readQueueFilterDraft()}
              modeTabs={QUEUE_MODE_TABS}
              channelOptions={QUEUE_CHANNEL_OPTIONS}
              collectorOptions={QUEUE_COLLECTOR_OPTIONS}
              statusOptions={[
                { id: '', label: 'All', count: queueCounts.all },
                {
                  id: 'needs',
                  label: 'Needs verification',
                  count: queuePendingVerification || queueCounts.collected || 0,
                },
                { id: 'verified', label: 'Verified', count: queueCounts.verified },
                ...(queueCounts.pending
                  ? [{ id: 'pending', label: 'Pending', count: queueCounts.pending }]
                  : []),
                ...(queueCounts.paid ? [{ id: 'paid', label: 'Paid', count: queueCounts.paid }] : []),
                ...(queueCounts.rejected
                  ? [{ id: 'rejected', label: 'Rejected', count: queueCounts.rejected }]
                  : []),
                ...(queueCounts.refunded
                  ? [{ id: 'refunded', label: 'Refunded', count: queueCounts.refunded }]
                  : []),
              ]}
              onClose={() => setQueueFiltersOpen(false)}
              onApply={applyQueueFiltersFromDrawer}
              onReset={resetQueueFilters}
            />
          ) : null}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Tab content: 3. Withdrawal Requests */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4 sm:space-y-6">
          <Card hover={false} className="p-3 sm:p-5">
            <p className="mb-3 hidden text-xs leading-relaxed text-gray-500 sm:block">
              Payouts from physiotherapists and care managers. Click a row to review details before approve/reject.
              Manager cash settlements stay on{' '}
              <Link to="/admin/manager-settlements" className="font-semibold text-teal-700 underline underline-offset-2">
                Manager settlements
              </Link>
              .
            </p>
            <p className="mb-3 text-xs leading-relaxed text-gray-500 sm:hidden">
              Tap a request to review, then approve or reject.{' '}
              <Link to="/admin/manager-settlements" className="font-semibold text-teal-700 underline underline-offset-2">
                Manager settlements
              </Link>
            </p>

            {/* Mobile: search + filter icon */}
            <div className="flex items-center gap-2 sm:hidden">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Name, phone, or UPI"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyWithdrawalFilters()}
                />
              </div>
              <MobileFilterIconButton
                count={countWithdrawAdvancedFilters()}
                onClick={() => setWithdrawFiltersOpen(true)}
              />
            </div>
            {countWithdrawAdvancedFilters() > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
                <p className="text-xs text-gray-500">
                  {countWithdrawAdvancedFilters()} filter
                  {countWithdrawAdvancedFilters() === 1 ? '' : 's'} active
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-700"
                  onClick={resetWithdrawalFilters}
                >
                  Clear
                </button>
              </div>
            ) : null}

            {/* Desktop filters */}
            <div className="mt-1 hidden space-y-3 sm:block">
              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 scrollbar-none">
                {WITHDRAW_STATUS_TABS.map((t) => {
                  const active = withdrawalStatus === t.id
                  return (
                    <button
                      key={t.id || 'all-status'}
                      type="button"
                      onClick={() => {
                        setWithdrawalStatus(t.id)
                        applyWithdrawalFilters({ status: t.id })
                      }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t.label}
                      {t.id === 'pending' && summary?.pendingPayoutsCount > 0
                        ? ` (${summary.pendingPayoutsCount})`
                        : ''}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 scrollbar-none">
                {WITHDRAW_PAYEE_TABS.map((t) => {
                  const active = withdrawalPayee === t.id
                  return (
                    <button
                      key={t.id || 'all-payee'}
                      type="button"
                      onClick={() => {
                        setWithdrawalPayee(t.id)
                        applyWithdrawalFilters({ payee: t.id })
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              <div className="min-w-0">
                <label className="text-xs font-medium text-gray-500">Search</label>
                <Input
                  className="mt-1"
                  placeholder="Name, phone, or UPI"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyWithdrawalFilters()}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                  <label className="text-xs font-medium text-gray-500">From date</label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={withdrawalDateFrom}
                    onChange={(e) => setWithdrawalDateFrom(e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-gray-500">To date</label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={withdrawalDateTo}
                    onChange={(e) => setWithdrawalDateTo(e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-gray-500">Min amount (₹)</label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={withdrawalAmountMin}
                    onChange={(e) => setWithdrawalAmountMin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyWithdrawalFilters()}
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium text-gray-500">Max amount (₹)</label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Any"
                    value={withdrawalAmountMax}
                    onChange={(e) => setWithdrawalAmountMax(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyWithdrawalFilters()}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => applyWithdrawalFilters()}>
                  Apply
                </Button>
                <Button type="button" variant="ghost" onClick={resetWithdrawalFilters}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <Card hover={false} className="min-w-0 overflow-hidden p-0">
            {withdrawalLoading ? (
              <div className="p-4">
                <TableSkeleton rows={6} />
              </div>
            ) : withdrawalRows.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-gray-900">No withdrawal requests match your filters</p>
                <p className="mt-1 text-xs text-gray-500">Try Reset, or clear status / date / amount filters.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100 md:hidden">
                  {withdrawalRows.map((row) => {
                    const payee = withdrawPayee(row)
                    return (
                      <li key={row._id} className="p-3.5">
                        <button type="button" className="w-full text-left" onClick={() => openWithdrawalDetail(row)}>
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-gray-900">{payee.name}</p>
                              {payee.phone ? <p className="mt-0.5 text-xs text-gray-500">{payee.phone}</p> : null}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <WithdrawStatusBadge status={row.status} />
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                                  payee.kind === 'manager'
                                    ? 'bg-teal-50 text-teal-900 ring-teal-200'
                                    : 'bg-slate-50 text-slate-700 ring-slate-200'
                                }`}
                              >
                                {payee.kind === 'manager' ? 'Manager' : 'Physio'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[11px] text-gray-500">Requested</p>
                              <p className="tabular-nums text-base font-semibold text-gray-900">
                                {formatInr(row.amount)}
                              </p>
                            </div>
                            <p className="text-right text-[11px] leading-snug text-gray-500">
                              {formatDateTime(row.requestedAt)}
                            </p>
                          </div>

                          <div className="mt-2.5 rounded-lg bg-gray-50 px-2.5 py-2">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                              UPI
                            </p>
                            {row.payoutUpiId ? (
                              <p className="mt-0.5 break-all text-sm font-medium text-teal-800">{row.payoutUpiId}</p>
                            ) : (
                              <p className="mt-0.5 text-sm font-medium text-rose-600">No UPI</p>
                            )}
                          </div>

                          <p className="mt-2.5 text-xs font-semibold text-teal-700">View details →</p>
                        </button>
                        {row.status === 'pending' ? (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => startPayoutFromRow(row, 'approve')}
                              disabled={busyAction === `w-${row._id}`}
                              className="rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => startPayoutFromRow(row, 'reject')}
                              disabled={busyAction === `w-${row._id}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[920px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3">Payee</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Requested</th>
                        <th className="px-4 py-3">UPI</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawalRows.map((row) => {
                        const payee = withdrawPayee(row)
                        return (
                          <tr
                            key={row._id}
                            className="cursor-pointer hover:bg-gray-50/80"
                            onClick={() => openWithdrawalDetail(row)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{payee.name}</div>
                              {payee.phone ? <div className="text-xs text-gray-500">{payee.phone}</div> : null}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                                  payee.kind === 'manager'
                                    ? 'bg-teal-50 text-teal-900 ring-teal-200'
                                    : 'bg-slate-50 text-slate-700 ring-slate-200'
                                }`}
                              >
                                {payee.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <WithdrawStatusBadge status={row.status} />
                            </td>
                            <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">
                              {formatInr(row.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700">
                              {row.payoutUpiId ? (
                                <>
                                  <div className="font-medium text-teal-800">{row.payoutUpiId}</div>
                                  {row.payoutDisplayName ? (
                                    <div className="text-gray-500">{row.payoutDisplayName}</div>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-rose-600">No UPI</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTime(row.requestedAt)}</td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openWithdrawalDetail(row)}
                                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  Details
                                </button>
                                {row.status === 'pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startPayoutFromRow(row, 'approve')}
                                      disabled={busyAction === `w-${row._id}`}
                                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startPayoutFromRow(row, 'reject')}
                                      disabled={busyAction === `w-${row._id}`}
                                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {!withdrawalLoading && withdrawalRows.length > 0 ? (
              <div className="border-t border-gray-100 px-4 py-3">
                <Pagination {...withdrawalPag.paginationProps} />
              </div>
            ) : null}
          </Card>

          {withdrawFiltersOpen ? (
            <AdminWithdrawFiltersDrawer
              draft={readWithdrawFilterDraft()}
              statusTabs={WITHDRAW_STATUS_TABS}
              payeeTabs={WITHDRAW_PAYEE_TABS}
              pendingCount={summary?.pendingPayoutsCount || 0}
              onClose={() => setWithdrawFiltersOpen(false)}
              onApply={applyWithdrawalFiltersFromDrawer}
              onReset={resetWithdrawalFilters}
            />
          ) : null}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* Shared Modals and Drawers */}
      {/* ────────────────────────────────────────────────────────────────────── */}

      {/* Withdrawal request detail drawer */}
      {selectedWithdrawal && !payoutAction ? (
        <WithdrawalDetailDrawer
          row={selectedWithdrawal}
          payee={withdrawPayee(selectedWithdrawal)}
          busy={busyAction === `w-${selectedWithdrawal._id}`}
          onClose={closeWithdrawalDetail}
          onApprove={() => startPayoutFromRow(selectedWithdrawal, 'approve')}
          onReject={() => startPayoutFromRow(selectedWithdrawal, 'reject')}
          onOpenPhysioWallet={() => {
            const payee = withdrawPayee(selectedWithdrawal)
            if (payee.kind !== 'physio' || !payee.id) return
            closeWithdrawalDetail()
            openPhysioDetail({
              _id: payee.id,
              name: payee.name,
              phone: payee.phone,
              wallet: {},
            })
          }}
        />
      ) : null}

      {/* Detail Drawer (View Transactions) */}
      {selectedPhysio && !settleOpen && !payoutAction && !selectedWithdrawal && (
        <DetailDrawer
          physio={selectedPhysio}
          detail={physioDetail}
          loading={physioDetailLoading}
          onClose={closePhysioDetail}
          onSettle={() => openSettle(selectedPhysio)}
          onPayoutAction={(action, pending) =>
            setPayoutAction({
              requestId: pending._id,
              action,
              payeeName: selectedPhysio.name,
              payeeKind: 'physio',
              amount: pending.amount,
              payoutUpiId: pending.payoutUpiId || '',
              payoutDisplayName: pending.payoutDisplayName || '',
            })
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
                <FieldLabel required className="mb-1 block text-xs font-medium text-gray-600">
                  Amount (INR)
                </FieldLabel>
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
                  <span className="font-semibold text-gray-900">{payoutAction.payeeName || 'payee'}</span>
                  {payoutAction.payeeKind === 'manager' ? "'s settled commission" : "'s balance"}
                  and record a withdrawal transaction.
                </>
              ) : (
                <>This leaves the payee&apos;s balance unchanged. They can submit a new request later.</>
              )}
            </p>
            {payoutAction.payoutUpiId ? (
              <p className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
                Pay to UPI: {payoutAction.payoutUpiId}
                {payoutAction.payoutDisplayName ? ` · ${payoutAction.payoutDisplayName}` : ''}
              </p>
            ) : (
              <p className="mt-3 text-xs text-rose-700">No UPI ID on this withdrawal request.</p>
            )}
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
              Confirm <span className="font-semibold text-gray-900">{formatInr(queueVerifyTarget.amount)}</span>
              {isManagerPhonePe(queueVerifyTarget) ? (
                <>
                  {' '}
                  PhonePe QR collection by manager{' '}
                  <span className="font-semibold text-gray-900">
                    {queueVerifyTarget.managerName || 'Manager'}
                  </span>
                </>
              ) : (
                <>
                  {' '}
                  collected by{' '}
                  <span className="font-semibold text-gray-900">
                    {queueVerifyTarget.physioName || 'physiotherapist'}
                  </span>
                </>
              )}
              ? This posts the ledger entries for this installment.
            </p>
            <PaymentQueueVerifySummary row={queueVerifyTarget} />
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
            <p className="mt-1 text-sm text-gray-600">
              {isManagerPhonePe(queueRejectTarget)
                ? 'The manager can upload a new PhonePe screenshot after this.'
                : 'The physiotherapist can record a fresh collection after this.'}
            </p>
            <PaymentQueueVerifySummary row={queueRejectTarget} />
            <FieldLabel required className="mt-4 block text-xs font-medium text-gray-500">
              Reason
            </FieldLabel>
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

function WithdrawalDetailDrawer({ row, payee, busy, onClose, onApprove, onReject, onOpenPhysioWallet }) {
  const isPending = row.status === 'pending'
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
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Withdrawal request</p>
              <h2 className="type-page-title mt-0.5 text-gray-900">{payee.name}</h2>
              {payee.phone ? <p className="text-xs text-gray-500">{payee.phone}</p> : null}
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                payee.kind === 'manager'
                  ? 'bg-teal-50 text-teal-900 ring-teal-200'
                  : 'bg-slate-50 text-slate-700 ring-slate-200'
              }`}
            >
              {payee.label}
            </span>
            <WithdrawStatusBadge status={row.status} />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Amount requested</p>
            <p className="type-stat mt-1 text-gray-900">{formatInr(row.amount)}</p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 px-3 py-2">
              <dt className="text-xs text-gray-500">Requested at</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatDateTime(row.requestedAt)}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 px-3 py-2">
              <dt className="text-xs text-gray-500">Processed at</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {row.processedAt ? formatDateTime(row.processedAt) : '—'}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 px-3 py-2 sm:col-span-2">
              <dt className="text-xs text-gray-500">Pay to UPI</dt>
              <dd className="mt-0.5">
                {row.payoutUpiId ? (
                  <>
                    <p className="font-semibold text-teal-900">{row.payoutUpiId}</p>
                    {row.payoutDisplayName ? (
                      <p className="text-xs text-gray-500">{row.payoutDisplayName}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="font-medium text-rose-700">No UPI on this request</p>
                )}
              </dd>
            </div>
            {row.note ? (
              <div className="rounded-xl border border-gray-100 px-3 py-2 sm:col-span-2">
                <dt className="text-xs text-gray-500">Request note</dt>
                <dd className="mt-0.5 text-gray-800">{row.note}</dd>
              </div>
            ) : null}
            {row.payoutReference ? (
              <div className="rounded-xl border border-gray-100 px-3 py-2 sm:col-span-2">
                <dt className="text-xs text-gray-500">Payout reference</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{row.payoutReference}</dd>
              </div>
            ) : null}
            {row.rejectReason ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 sm:col-span-2">
                <dt className="text-xs text-rose-700">Reject reason</dt>
                <dd className="mt-0.5 text-rose-900">{row.rejectReason}</dd>
              </div>
            ) : null}
            <div className="rounded-xl border border-gray-100 px-3 py-2 sm:col-span-2">
              <dt className="text-xs text-gray-500">Request ID</dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-gray-600">{row._id}</dd>
            </div>
          </dl>

          {isPending ? (
            <Card hover={false} className="border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-amber-950">
                Verify the UPI ID, then transfer ₹{Number(row.amount).toFixed(2)} externally before approving.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" disabled={busy} onClick={onApprove}>
                  Approve payout
                </Button>
                <Button type="button" variant="outline" className="text-rose-700" disabled={busy} onClick={onReject}>
                  Reject
                </Button>
              </div>
            </Card>
          ) : null}

          {payee.kind === 'physio' && onOpenPhysioWallet ? (
            <Button type="button" variant="outline" onClick={onOpenPhysioWallet}>
              Open physiotherapist wallet
            </Button>
          ) : payee.kind === 'manager' ? (
            <Link
              to="/admin/manager-settlements"
              className="inline-flex text-sm font-semibold text-teal-700 underline underline-offset-2"
              onClick={onClose}
            >
              Open manager settlements →
            </Link>
          ) : null}
        </div>
      </div>
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
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 capitalize">
                      {t.type === 'settlement' ? 'fee collection' : t.type} · {t.direction}
                      {t.meta?.leg ? ` · ${t.meta.leg}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.createdAt)}</p>
                    {t.bookingRef?.id || t.bookingId ? (
                      <AdminCaseContext source={t} compact className="mt-1" />
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 tabular-nums font-medium ${
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
  return <TableSkeleton rows={3} />
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
