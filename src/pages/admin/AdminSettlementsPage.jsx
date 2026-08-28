import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { resolveAdminCaseContext } from '../../components/admin/AdminCaseContext'
import AdminFilterSheet, {
  FILTER_FIELD,
  MobileFilterIconButton,
} from '../../components/admin/AdminFilterSheet'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import TableSkeleton from '../../components/ui/skeletons/TableSkeleton'

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatInr(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

function caseLabel(entry) {
  const ctx = resolveAdminCaseContext(entry)
  return [ctx?.patientName, ctx?.issue].filter(Boolean).join(' · ') || 'Case'
}

const TABS = [
  { id: 'settle', label: 'Settle' },
  { id: 'batches', label: 'Open batches' },
  { id: 'history', label: 'History' },
]

export default function AdminSettlementsPage() {
  const [managers, setManagers] = useState([])
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [ledger, setLedger] = useState(null)
  const [batches, setBatches] = useState([])
  const [selectedEntryIds, setSelectedEntryIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState('settle')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [pendingPhonePeCount, setPendingPhonePeCount] = useState(0)
  const [pendingManagerPayouts, setPendingManagerPayouts] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [historySort, setHistorySort] = useState('newest')
  const [historyFiltersOpen, setHistoryFiltersOpen] = useState(false)
  const historyPag = usePagination()
  const ledgerPag = usePagination()

  const loadBatches = useCallback(async () => {
    try {
      const res = await api.get('/admin/settlement-batches', { params: { limit: 50 } })
      setBatches(res.data?.batches || res.data?.data || [])
    } catch {
      setBatches([])
    }
  }, [])

  useEffect(() => {
    api.get('/admin/care-managers').then((res) => {
      setManagers(res.data?.managers || [])
    })
    loadBatches()
    api
      .get('/admin/payments', { params: { mode: 'offline', status: 'collected', limit: 1 } })
      .then((res) => setPendingPhonePeCount(Number(res.data?.pendingVerification || 0)))
      .catch(() => setPendingPhonePeCount(0))
    api
      .get('/withdraw', { params: { payee: 'manager', status: 'pending', limit: 1 } })
      .then((res) => {
        const total = Number(res.data?.total)
        if (Number.isFinite(total)) {
          setPendingManagerPayouts(total)
          return
        }
        const list = Array.isArray(res.data) ? res.data : res.data?.data || []
        setPendingManagerPayouts(list.filter((r) => r.status === 'pending').length)
      })
      .catch(() => setPendingManagerPayouts(0))
  }, [loadBatches])

  const loadLedger = useCallback(async (managerId) => {
    if (!managerId) {
      setLedger(null)
      setSelectedEntryIds([])
      ledgerPag.clearMeta()
      return
    }
    try {
      const res = await api.get(`/admin/managers/${managerId}/ledger`, {
        params: { status: 'open', page: ledgerPag.page, limit: ledgerPag.pageSize },
      })
      setLedger(res.data)
      ledgerPag.applyMeta({
        total: Number(res.data?.total) || (res.data?.entries || []).length,
        totalPages: Number(res.data?.totalPages) || 1,
      })
      setSelectedEntryIds([])
    } catch {
      setLedger(null)
      ledgerPag.clearMeta()
    }
  }, [ledgerPag.page, ledgerPag.pageSize, ledgerPag.applyMeta, ledgerPag.clearMeta])

  useEffect(() => {
    ledgerPag.resetPage()
  }, [selectedManagerId, ledgerPag.resetPage])

  useEffect(() => {
    loadLedger(selectedManagerId)
  }, [selectedManagerId, loadLedger])

  function toggleEntry(id) {
    setSelectedEntryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function selectAllOpen() {
    setSelectedEntryIds(openEntries.map((e) => e._id))
  }

  async function createBatch() {
    if (!selectedManagerId || !selectedEntryIds.length) return
    setBusy(true)
    try {
      await api.post(`/admin/managers/${selectedManagerId}/settlement-batches`, {
        ledgerEntryIds: selectedEntryIds,
      })
      toast.success('Batch created')
      await loadLedger(selectedManagerId)
      await loadBatches()
      setActiveTab('batches')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create batch')
    } finally {
      setBusy(false)
    }
  }

  async function settleBatch(batchId) {
    setBusy(true)
    try {
      await api.patch(`/admin/settlement-batches/${batchId}/settle`, {})
      toast.success('Marked settled')
      setSelectedBatch(null)
      await loadBatches()
      if (selectedManagerId) await loadLedger(selectedManagerId)
      setActiveTab('history')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not settle batch')
    } finally {
      setBusy(false)
    }
  }

  const openEntries = useMemo(() => ledger?.entries || [], [ledger])

  const visibleBatches = useMemo(() => {
    let list = batches
    if (selectedManagerId) {
      list = list.filter((b) => String(b.managerId?._id || b.managerId) === String(selectedManagerId))
    }
    return {
      open: list.filter((b) => b.status === 'open'),
      settled: list.filter((b) => b.status !== 'open'),
    }
  }, [batches, selectedManagerId])

  const historyRows = useMemo(() => {
    let list = [...visibleBatches.settled]
    const q = historySearch.trim().toLowerCase()
    if (q) {
      list = list.filter((b) => {
        const name = String(b.managerId?.name || '').toLowerCase()
        const phone = String(b.managerId?.phone || '')
        return name.includes(q) || phone.includes(q)
      })
    }
    if (historyDateFrom) {
      const from = new Date(`${historyDateFrom}T00:00:00`)
      list = list.filter((b) => {
        const d = new Date(b.settledAt || b.distributedAt || b.createdAt)
        return !Number.isNaN(d.getTime()) && d >= from
      })
    }
    if (historyDateTo) {
      const to = new Date(`${historyDateTo}T23:59:59.999`)
      list = list.filter((b) => {
        const d = new Date(b.settledAt || b.distributedAt || b.createdAt)
        return !Number.isNaN(d.getTime()) && d <= to
      })
    }
    list.sort((a, b) => {
      if (historySort === 'amount-high') {
        return Number(b.expectedAmount || 0) - Number(a.expectedAmount || 0)
      }
      if (historySort === 'amount-low') {
        return Number(a.expectedAmount || 0) - Number(b.expectedAmount || 0)
      }
      const da = new Date(a.settledAt || a.distributedAt || a.createdAt).getTime()
      const db = new Date(b.settledAt || b.distributedAt || b.createdAt).getTime()
      return historySort === 'oldest' ? da - db : db - da
    })
    return list
  }, [visibleBatches.settled, historySearch, historyDateFrom, historyDateTo, historySort])

  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / historyPag.pageSize))
  const pagedHistoryRows = useMemo(() => {
    const start = (historyPag.page - 1) * historyPag.pageSize
    return historyRows.slice(start, start + historyPag.pageSize)
  }, [historyRows, historyPag.page, historyPag.pageSize])

  useEffect(() => {
    historyPag.resetPage()
  }, [historySearch, historyDateFrom, historyDateTo, historySort, selectedManagerId, historyPag.resetPage])

  useEffect(() => {
    historyPag.applyMeta({ total: historyRows.length, totalPages: historyTotalPages })
  }, [historyRows.length, historyTotalPages, historyPag.applyMeta])

  useEffect(() => {
    if (historyPag.page > historyTotalPages) historyPag.setPage(historyTotalPages)
  }, [historyPag.page, historyTotalPages, historyPag.setPage])

  const historyStats = useMemo(() => {
    const cash = historyRows.reduce((s, b) => s + Number(b.expectedAmount || 0), 0)
    const commission = historyRows.reduce((s, b) => s + Number(b.commissionTotal || 0), 0)
    const cases = historyRows.reduce(
      (s, b) => s + Number(b.entryCount ?? b.entries?.length ?? 0),
      0,
    )
    return { cash, commission, cases, count: historyRows.length }
  }, [historyRows])

  const historyFilterCount =
    Number(Boolean(historyDateFrom)) +
    Number(Boolean(historyDateTo)) +
    Number(historySort !== 'newest')

  function resetHistoryFilters() {
    setHistorySearch('')
    setHistoryDateFrom('')
    setHistoryDateTo('')
    setHistorySort('newest')
  }

  const selectedManager = managers.find((m) => String(m._id) === String(selectedManagerId))

  const tabCounts = {
    settle: ledgerPag.total || openEntries.length,
    batches: visibleBatches.open.length,
    history: visibleBatches.settled.length,
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden sm:space-y-5">
      <AdminPageHeader
        title="Manager settlements"
        subtitle="Hand off cash with a care manager, then mark the batch settled."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Manager settlements' }]}
        actions={
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <AdminLink to="/admin/finance?tab=queue">
              Payments{pendingPhonePeCount > 0 ? ` (${pendingPhonePeCount})` : ''} →
            </AdminLink>
            <AdminLink to="/admin/finance?tab=withdrawals">
              Withdrawals{pendingManagerPayouts > 0 ? ` (${pendingManagerPayouts})` : ''} →
            </AdminLink>
          </div>
        }
      />

      {/* Manager picker + stats */}
      <Card hover={false} className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <label className="text-xs font-medium text-slate-500">Care manager</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm"
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
            >
              <option value="">All managers (batches only)</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name || m.phone}
                </option>
              ))}
            </select>
          </div>
          {selectedManagerId && ledger ? (
            <div className="grid grid-cols-2 gap-2 sm:w-72">
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Open cash</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                  {formatInr(ledger.openTotal)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800/80">Commission</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-amber-950">
                  {formatInr(ledger.pendingCommission)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <nav className="flex gap-1 overflow-x-auto px-2 scrollbar-none sm:px-3" aria-label="Settlement tabs">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            const count = tabCounts[tab.id]
            const disabled = tab.id === 'settle' && !selectedManagerId
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                  active
                    ? 'border-teal-600 text-teal-700'
                    : disabled
                      ? 'cursor-not-allowed border-transparent text-slate-300'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {count > 0 ? (
                  <span
                    className={`ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      active ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-3 sm:p-4">
          {activeTab === 'settle' ? (
            !selectedManagerId ? (
              <EmptyHint>Select a care manager above to settle open collections.</EmptyHint>
            ) : ledger === null ? (
              <TableSkeleton rows={5} />
            ) : openEntries.length === 0 ? (
              <EmptyHint>
                No open collections for {selectedManager?.name || 'this manager'}.
                {visibleBatches.open.length > 0 ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="font-semibold text-teal-700 underline underline-offset-2"
                      onClick={() => setActiveTab('batches')}
                    >
                      View {visibleBatches.open.length} open batch
                      {visibleBatches.open.length === 1 ? '' : 'es'}
                    </button>
                  </>
                ) : null}
              </EmptyHint>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">
                    Select collections to include in a batch.
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-700 hover:underline"
                    onClick={selectAllOpen}
                  >
                    Select page
                  </button>
                </div>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {openEntries.map((e) => {
                    const ctx = resolveAdminCaseContext(e)
                    const checked = selectedEntryIds.includes(e._id)
                    return (
                      <li key={e._id}>
                        <label className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={checked}
                            onChange={() => toggleEntry(e._id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-semibold tabular-nums text-slate-900">
                                {formatInr(e.amount)}
                              </span>
                              {ctx?.id ? (
                                <Link
                                  to={`/admin/bookings/${ctx.id}`}
                                  className="shrink-0 text-xs font-semibold text-teal-700 hover:underline"
                                  onClick={(ev) => ev.stopPropagation()}
                                >
                                  Case →
                                </Link>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-slate-600">{caseLabel(e)}</span>
                            {Number(e.managerCommissionAmount) > 0 ? (
                              <span className="mt-0.5 block text-xs text-emerald-700">
                                Manager share {formatInr(e.managerCommissionAmount)}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={busy || !selectedEntryIds.length}
                  onClick={createBatch}
                >
                  Create batch ({selectedEntryIds.length})
                </Button>
                <Pagination {...ledgerPag.paginationProps} />
              </div>
            )
          ) : null}

          {activeTab === 'batches' ? (
            visibleBatches.open.length === 0 ? (
              <EmptyHint>
                {selectedManagerId
                  ? 'No open batches for this manager.'
                  : 'No open settlement batches.'}
              </EmptyHint>
            ) : (
              <ul className="space-y-2">
                {visibleBatches.open.map((batch) => (
                  <BatchRow
                    key={batch._id}
                    batch={batch}
                    busy={busy}
                    onOpen={() => setSelectedBatch(batch)}
                    onSettle={() => settleBatch(batch._id)}
                    showSettle
                  />
                ))}
              </ul>
            )
          ) : null}

          {activeTab === 'history' ? (
            visibleBatches.settled.length === 0 ? (
              <EmptyHint>
                {selectedManagerId ? 'No settled batches for this manager yet.' : 'No settled batches yet.'}
              </EmptyHint>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <HistoryStat label="Batches" value={String(historyStats.count)} />
                  <HistoryStat label="Cash settled" value={formatInr(historyStats.cash)} />
                  <HistoryStat label="Manager share" value={formatInr(historyStats.commission)} />
                  <HistoryStat label="Cases" value={String(historyStats.cases)} />
                </div>

                <div className="flex items-center gap-2 sm:hidden">
                  <input
                    type="search"
                    aria-label="Search settlement history"
                    placeholder="Search manager…"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
                  />
                  <MobileFilterIconButton
                    count={historyFilterCount}
                    onClick={() => setHistoryFiltersOpen(true)}
                    label="Open history filters"
                  />
                </div>

                <div className="hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    type="search"
                    placeholder="Search manager…"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
                  />
                  <input
                    type="date"
                    aria-label="From date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                  />
                  <input
                    type="date"
                    aria-label="To date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm"
                  />
                  <select
                    aria-label="Sort history"
                    value={historySort}
                    onChange={(e) => setHistorySort(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="amount-high">Amount: high → low</option>
                    <option value="amount-low">Amount: low → high</option>
                  </select>
                </div>

                {(historySearch || historyDateFrom || historyDateTo || historySort !== 'newest') && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Showing {historyRows.length} of {visibleBatches.settled.length}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      onClick={resetHistoryFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                {historyRows.length === 0 ? (
                  <EmptyHint>No settled batches match these filters.</EmptyHint>
                ) : (
                  <>
                    <ul className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
                      {pagedHistoryRows.map((batch) => (
                        <HistoryRow
                          key={batch._id}
                          batch={batch}
                          onOpen={() => setSelectedBatch(batch)}
                        />
                      ))}
                    </ul>
                    <Pagination {...historyPag.paginationProps} />
                  </>
                )}
              </div>
            )
          ) : null}
        </div>
      </div>

      {selectedBatch ? (
        <BatchDetailDrawer
          batch={selectedBatch}
          busy={busy}
          onClose={() => setSelectedBatch(null)}
          onSettle={
            selectedBatch.status === 'open' ? () => settleBatch(selectedBatch._id) : null
          }
        />
      ) : null}

      {historyFiltersOpen ? (
        <HistoryFiltersSheet
          filters={{
            search: historySearch,
            dateFrom: historyDateFrom,
            dateTo: historyDateTo,
            sort: historySort,
          }}
          onClose={() => setHistoryFiltersOpen(false)}
          onApply={(filters) => {
            setHistorySearch(filters.search)
            setHistoryDateFrom(filters.dateFrom)
            setHistoryDateTo(filters.dateTo)
            setHistorySort(filters.sort)
          }}
          onReset={resetHistoryFilters}
        />
      ) : null}
    </div>
  )
}

function HistoryFiltersSheet({ filters, onClose, onApply, onReset }) {
  const [draft, setDraft] = useState(filters)
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }))

  return (
    <AdminFilterSheet
      title="History filters"
      onClose={onClose}
      onApply={() => onApply(draft)}
      onReset={onReset}
    >
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search manager
        </label>
        <input
          type="search"
          className={FILTER_FIELD}
          placeholder="Name or phone"
          value={draft.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </label>
          <input
            type="date"
            className={FILTER_FIELD}
            value={draft.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </label>
          <input
            type="date"
            className={FILTER_FIELD}
            value={draft.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sort
        </label>
        <select
          className={FILTER_FIELD}
          value={draft.sort}
          onChange={(e) => set('sort', e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="amount-high">Amount: high → low</option>
          <option value="amount-low">Amount: low → high</option>
        </select>
      </div>
    </AdminFilterSheet>
  )
}

function EmptyHint({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

function HistoryStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

function HistoryRow({ batch, onOpen }) {
  const cases = batch.entryCount ?? batch.entries?.length ?? 0
  const settledAt = batch.settledAt || batch.distributedAt || batch.createdAt
  const cuts = batchCuts(batch)
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-teal-50/60 sm:px-4"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{batch.managerId?.name || 'Manager'}</p>
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
              Settled
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {formatDate(settledAt)}
            {cases ? ` · ${cases} case${cases === 1 ? '' : 's'}` : ''}
            <span className="mx-1.5 text-slate-300">·</span>
            Cash {formatInr(cuts.cash)}
          </p>
          <CutsBreakdown cuts={cuts} compact />
        </div>
        <span className="shrink-0 text-xs font-semibold text-teal-700">Details →</span>
      </button>
    </li>
  )
}

function batchCuts(batch) {
  const preview = batch?.distributionPreview
  if (preview) {
    return {
      cash: Number(batch.expectedAmount) || 0,
      physio: Number(preview.physioTotal) || 0,
      manager: Number(preview.managerTotal) || 0,
      platform: Number(preview.platformTotal) || 0,
      source: 'preview',
    }
  }
  const cash = Number(batch?.expectedAmount) || 0
  const physio = Number(batch?.physioPayoutTotal) || 0
  const manager = Number(batch?.commissionTotal) || 0
  const platform = Math.max(0, Math.round((cash - physio - manager) * 100) / 100)
  return { cash, physio, manager, platform, source: 'stored' }
}

function CutsBreakdown({ cuts, compact = false }) {
  const items = [
    { key: 'physio', label: 'Physio gets', value: cuts.physio, tone: 'text-slate-800' },
    { key: 'manager', label: 'Manager gets', value: cuts.manager, tone: 'text-emerald-800' },
    { key: 'platform', label: 'Platform keeps', value: cuts.platform, tone: 'text-sky-800' },
  ]
  return (
    <div
      className={[
        'grid grid-cols-3 gap-2',
        compact ? '' : 'rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100',
      ].join(' ')}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={compact ? '' : 'rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100'}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className={`mt-0.5 text-sm font-semibold tabular-nums ${item.tone}`}>{formatInr(item.value)}</p>
        </div>
      ))}
    </div>
  )
}

function BatchRow({ batch, busy, onOpen, onSettle, showSettle, settled }) {
  const cases = batch.entryCount ?? batch.entries?.length ?? 0
  const cuts = batchCuts(batch)

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-3 px-3 py-3.5 text-left transition hover:bg-slate-50/80 sm:px-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{batch.managerId?.name || 'Manager'}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {settled
                ? `Settled ${formatDate(batch.settledAt || batch.distributedAt || batch.createdAt)}`
                : `Created ${formatDate(batch.createdAt)}`}
              {cases ? ` · ${cases} case${cases === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Cash in</p>
            <p className="text-base font-semibold tabular-nums text-slate-900">{formatInr(cuts.cash)}</p>
            <span className="mt-1 inline-block text-xs font-semibold text-teal-700">Details →</span>
          </div>
        </div>

        <CutsBreakdown cuts={cuts} />
        {!settled ? (
          <p className="text-[11px] text-slate-500">
            On settle these amounts credit physio + manager wallets; platform share stays with you.
          </p>
        ) : null}
      </button>
      {showSettle ? (
        <div className="border-t border-slate-100 px-3 py-2.5 sm:px-4">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              onSettle?.()
            }}
          >
            Mark settled
          </Button>
        </div>
      ) : null}
    </li>
  )
}

function BatchDetailDrawer({ batch, busy, onClose, onSettle }) {
  const entries = batch.entries || []
  const isOpen = batch.status === 'open'
  const preview = batch.distributionPreview

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Settlement batch</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
              {batch.managerId?.name || 'Manager'}
            </h2>
            <p className="text-sm tabular-nums text-slate-600">{formatInr(batch.expectedAmount)}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                isOpen
                  ? 'bg-amber-50 text-amber-900 ring-amber-200'
                  : 'bg-emerald-50 text-emerald-900 ring-emerald-200'
              }`}
            >
              {isOpen ? 'Open' : 'Settled'}
            </span>
            <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
              {entries.length || batch.entryCount || 0} cases
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <dt className="text-xs text-slate-500">Created</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{formatDate(batch.createdAt)}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 px-3 py-2">
              <dt className="text-xs text-slate-500">{isOpen ? 'Status' : 'Settled'}</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {isOpen ? 'Awaiting hand-off' : formatDate(batch.settledAt || batch.distributedAt)}
              </dd>
            </div>
          </dl>

          {isOpen && preview ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Who gets what on settle
              </p>
              <CutsBreakdown cuts={batchCuts(batch)} />
            </div>
          ) : null}

          {!isOpen ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distributed</p>
              <CutsBreakdown cuts={batchCuts(batch)} />
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Cases</h3>
            {entries.length === 0 ? (
              <p className="text-sm text-slate-500">No case details on this batch.</p>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {entries.map((e) => {
                  const ctx = resolveAdminCaseContext(e)
                  return (
                    <li key={e._id} className="flex items-start justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-semibold tabular-nums text-slate-900">{formatInr(e.amount)}</p>
                        <p className="truncate text-sm text-slate-600">{caseLabel(e)}</p>
                      </div>
                      {ctx?.id ? (
                        <Link
                          to={`/admin/bookings/${ctx.id}`}
                          className="shrink-0 text-xs font-semibold text-teal-700 hover:underline"
                        >
                          Open →
                        </Link>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {onSettle ? (
          <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
            <Button type="button" className="w-full" disabled={busy} onClick={onSettle}>
              Mark settled
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
