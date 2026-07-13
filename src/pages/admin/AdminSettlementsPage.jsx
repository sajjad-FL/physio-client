import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AdminCaseContext, { resolveAdminCaseContext } from '../../components/admin/AdminCaseContext'

const LEDGER_STATUS_LABEL = {
  open: 'Awaiting settlement',
  batched: 'In settlement batch',
  settled: 'Settled',
  disputed: 'Disputed',
}

function ledgerStatusLabel(status) {
  return LEDGER_STATUS_LABEL[status] || status || '—'
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function LedgerEntryCard({ entry, selectable, checked, onToggle }) {
  const collectedLabel = entry.collectedAt ? `Collected ${formatDate(entry.collectedAt)}` : null
  const ctx = resolveAdminCaseContext(entry)

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {selectable ? (
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              onChange={onToggle}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">₹{Number(entry.amount).toFixed(2)}</p>
            <AdminCaseContext source={entry} showLink={false} className="mt-0.5" />
            <p className="mt-1 text-xs font-medium text-amber-800">{ledgerStatusLabel(entry.status)}</p>
            {Number(entry.managerCommissionAmount) > 0 ? (
              <p className="text-xs font-medium text-emerald-700">
                Manager commission: ₹{Number(entry.managerCommissionAmount).toFixed(2)}
              </p>
            ) : null}
            {entry.distribution?.distributedAt ? (
              <p className="text-xs text-slate-500">
                Distributed: physio ₹{Number(entry.distribution.physioShare || 0).toFixed(2)} · manager ₹
                {Number(entry.distribution.managerShare || 0).toFixed(2)} · platform ₹
                {Number(entry.distribution.platformShare || 0).toFixed(2)}
              </p>
            ) : null}
            {collectedLabel ? <p className="text-xs text-slate-500">{collectedLabel}</p> : null}
            {entry.note ? <p className="mt-1 text-xs text-slate-500">{entry.note}</p> : null}
          </div>
        </div>
        {ctx?.id ? (
          <Link
            to={`/admin/bookings/${ctx.id}`}
            className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            View case →
          </Link>
        ) : null}
      </div>
    </li>
  )
}

function BatchCard({ batch, busy, onSettle }) {
  const entries = batch.entries || []
  const created = formatDate(batch.createdAt)

  return (
    <Card hover={false} className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">
            {batch.managerId?.name || 'Manager'} · ₹{Number(batch.expectedAmount).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">
            {batch.status}
            {created ? ` · Created ${created}` : ''}
            {batch.entryCount != null ? ` · ${batch.entryCount} case${batch.entryCount === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        {batch.status === 'open' ? (
          <Button type="button" disabled={busy} onClick={() => onSettle(batch._id)}>
            Mark settled
          </Button>
        ) : null}
      </div>
      {batch.status === 'open' && batch.distributionPreview ? (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
          On settle: physio ₹{Number(batch.distributionPreview.physioTotal || 0).toFixed(2)} · manager
          commission ₹{Number(batch.distributionPreview.managerTotal || 0).toFixed(2)} · platform ₹
          {Number(batch.distributionPreview.platformTotal || 0).toFixed(2)}
        </p>
      ) : null}
      {batch.status === 'settled' && batch.distributedAt ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-100">
          Distributed: physio ₹{Number(batch.physioPayoutTotal || 0).toFixed(2)} · manager commission ₹
          {Number(batch.commissionTotal || 0).toFixed(2)}
        </p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {entries.map((e) => {
            const ctx = resolveAdminCaseContext(e)
            const label = [ctx?.patientName, ctx?.issue].filter(Boolean).join(' · ') || 'Case'
            return (
              <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="min-w-0 text-slate-700">
                  <span className="font-medium text-slate-900">₹{Number(e.amount).toFixed(2)}</span>
                  <span className="mx-1 text-slate-400">·</span>
                  {label}
                </span>
                {ctx?.id ? (
                  <Link
                    to={`/admin/bookings/${ctx.id}`}
                    className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View case →
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </Card>
  )
}

export default function AdminSettlementsPage() {
  const [managers, setManagers] = useState([])
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [ledger, setLedger] = useState(null)
  const [batches, setBatches] = useState([])
  const [selectedEntryIds, setSelectedEntryIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [payoutRequests, setPayoutRequests] = useState([])
  const [payoutBusyId, setPayoutBusyId] = useState(null)
  const [payoutModal, setPayoutModal] = useState(null) // { request, action: 'approved'|'rejected' }
  const [payoutRef, setPayoutRef] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [pendingPhonePeCount, setPendingPhonePeCount] = useState(0)

  const loadPayoutRequests = useCallback(async () => {
    try {
      const res = await api.get('/withdraw', { params: { payee: 'manager' } })
      setPayoutRequests(Array.isArray(res.data) ? res.data : [])
    } catch {
      setPayoutRequests([])
    }
  }, [])

  useEffect(() => {
    api.get('/admin/care-managers').then((res) => {
      setManagers(res.data?.managers || [])
    })
    api.get('/admin/settlement-batches').then((res) => {
      setBatches(res.data?.batches || [])
    })
    loadPayoutRequests()
    api
      .get('/admin/payments', { params: { mode: 'offline', status: 'collected', limit: 1 } })
      .then((res) => {
        setPendingPhonePeCount(Number(res.data?.pendingVerification || 0))
      })
      .catch(() => setPendingPhonePeCount(0))
  }, [loadPayoutRequests])

  const loadLedger = useCallback(async (managerId) => {
    if (!managerId) return
    try {
      const res = await api.get(`/admin/managers/${managerId}/ledger`)
      setLedger(res.data)
      setSelectedEntryIds([])
    } catch {
      setLedger(null)
    }
  }, [])

  useEffect(() => {
    if (selectedManagerId) loadLedger(selectedManagerId)
  }, [selectedManagerId, loadLedger])

  function toggleEntry(id) {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function createBatch() {
    if (!selectedManagerId || !selectedEntryIds.length) return
    setBusy(true)
    try {
      await api.post(
        `/admin/managers/${selectedManagerId}/settlement-batches`,
        { ledgerEntryIds: selectedEntryIds },      )
      toast.success('Settlement batch created')
      await loadLedger(selectedManagerId)
      const res = await api.get('/admin/settlement-batches')
      setBatches(res.data?.batches || [])
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
      toast.success('Batch settled')
      const res = await api.get('/admin/settlement-batches')
      setBatches(res.data?.batches || [])
      if (selectedManagerId) await loadLedger(selectedManagerId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not settle batch')
    } finally {
      setBusy(false)
    }
  }

  async function submitPayoutModal() {
    if (!payoutModal) return
    const { request, action } = payoutModal
    setPayoutBusyId(String(request._id))
    try {
      await api.patch(`/withdraw/${request._id}`, {
        status: action,
        payoutReference: action === 'approved' ? payoutRef.trim() : '',
        note: action === 'rejected' ? payoutNote.trim() : '',
      })
      toast.success(action === 'approved' ? 'Payout approved' : 'Request rejected')
      setPayoutModal(null)
      setPayoutRef('')
      setPayoutNote('')
      await loadPayoutRequests()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not process request')
    } finally {
      setPayoutBusyId(null)
    }
  }

  function openPayoutModal(request, action) {
    setPayoutRef('')
    setPayoutNote('')
    setPayoutModal({ request, action })
  }

  const allEntries = ledger?.entries || []
  const openEntries = allEntries.filter((e) => e.status === 'open')
  const historyEntries = allEntries.filter((e) => e.status !== 'open')
  const pendingPayouts = payoutRequests.filter((r) => r.status === 'pending')
  const processedPayouts = payoutRequests.filter((r) => r.status !== 'pending').slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
        <p className="font-semibold">Looking for manager PhonePe QR screenshots?</p>
        <p className="mt-1 text-teal-900/90">
          Those are verified under{' '}
          <Link to="/admin/finance?tab=queue" className="font-semibold underline underline-offset-2">
            Payment history
          </Link>
          {pendingPhonePeCount > 0 ? (
            <>
              {' '}
              — <span className="font-semibold">{pendingPhonePeCount} awaiting verification</span>.
            </>
          ) : (
            <> (filter Offline + Collected / Needs verification).</>
          )}{' '}
          This page is only for cash hand-off settlement batches and manager withdrawal approvals.
        </p>
      </div>
      <Card hover={false} className="p-5">
        <h2 className="font-semibold text-slate-900">Manager batch settlement</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each row shows which patient and case a collection came from before you batch-settle with the care manager.
        </p>
        <select
          className="mt-3 w-full max-w-md rounded-xl border border-slate-200 p-3 text-sm"
          value={selectedManagerId}
          onChange={(e) => setSelectedManagerId(e.target.value)}
        >
          <option value="">Select care manager…</option>
          {managers.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name || m.phone}
            </option>
          ))}
        </select>
        {ledger ? (
          <div className="mt-2 space-y-0.5 text-sm text-slate-600">
            <p>Open balance: ₹{Number(ledger.openTotal || 0).toFixed(2)}</p>
            <p>
              Commission — pending: ₹{Number(ledger.pendingCommission || 0).toFixed(2)} · credited: ₹
              {Number(ledger.settledCommission || 0).toFixed(2)}
            </p>
          </div>
        ) : null}
      </Card>

      {openEntries.length > 0 ? (
        <Card hover={false} className="p-5">
          <h3 className="font-medium text-slate-900">Open ledger entries</h3>
          <p className="mt-1 text-xs text-slate-500">Select entries to include in a settlement batch.</p>
          <ul className="mt-3 space-y-2">
            {openEntries.map((e) => (
              <LedgerEntryCard
                key={e._id}
                entry={e}
                selectable
                checked={selectedEntryIds.includes(e._id)}
                onToggle={() => toggleEntry(e._id)}
              />
            ))}
          </ul>
          <Button type="button" className="mt-4" disabled={busy || !selectedEntryIds.length} onClick={createBatch}>
            Create settlement batch
          </Button>
        </Card>
      ) : selectedManagerId ? (
        <Card hover={false} className="p-5 text-sm text-slate-600">
          No open ledger entries for this manager.
        </Card>
      ) : null}

      {selectedManagerId && historyEntries.length > 0 ? (
        <Card hover={false} className="p-5">
          <h3 className="font-medium text-slate-900">All entries</h3>
          <p className="mt-1 text-xs text-slate-500">Batched and settled collections for audit.</p>
          <ul className="mt-3 space-y-2">
            {historyEntries.map((e) => (
              <LedgerEntryCard key={e._id} entry={e} />
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Settlement batches</h3>
        {batches.length === 0 ? (
          <Card hover={false} className="p-4 text-sm text-slate-600">
            No settlement batches yet.
          </Card>
        ) : (
          batches.map((batch) => (
            <BatchCard key={batch._id} batch={batch} busy={busy} onSettle={settleBatch} />
          ))
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Manager payout requests</h3>
        {pendingPayouts.length === 0 && processedPayouts.length === 0 ? (
          <Card hover={false} className="p-4 text-sm text-slate-600">
            No manager withdrawal requests yet. Managers request payouts of settled commission from their
            Earnings page.
          </Card>
        ) : (
          <>
            {pendingPayouts.map((r) => {
              const rowBusy = payoutBusyId === String(r._id)
              return (
                <Card key={r._id} hover={false} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {r.managerId?.name || 'Manager'} · ₹{Number(r.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Requested {formatDate(r.requestedAt)}
                        {r.managerId?.phone ? ` · ${r.managerId.phone}` : ''}
                      </p>
                      {r.payoutUpiId ? (
                        <p className="mt-1 text-xs font-medium text-teal-800">
                          Pay to UPI: {r.payoutUpiId}
                          {r.payoutDisplayName ? ` · ${r.payoutDisplayName}` : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-rose-700">No UPI on this request</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" disabled={rowBusy} onClick={() => openPayoutModal(r, 'approved')}>
                        {rowBusy ? '…' : 'Approve'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={rowBusy}
                        onClick={() => openPayoutModal(r, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
            {processedPayouts.map((r) => (
              <Card key={r._id} hover={false} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700">
                      <span className="font-medium text-slate-900">
                        {r.managerId?.name || 'Manager'} · ₹{Number(r.amount).toFixed(2)}
                      </span>
                      <span className="mx-1 text-slate-400">·</span>
                      <span className={r.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}>
                        {r.status}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(r.processedAt || r.requestedAt)}
                      {r.payoutUpiId ? ` · UPI: ${r.payoutUpiId}` : ''}
                      {r.payoutReference ? ` · Ref: ${r.payoutReference}` : ''}
                      {r.rejectReason ? ` · ${r.rejectReason}` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {payoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-900">
              {payoutModal.action === 'approved' ? 'Approve manager payout' : 'Reject payout'}
            </h3>
            <div className="mt-3 space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <p className="font-medium text-slate-900">
                {payoutModal.request.managerId?.name || 'Manager'} · ₹
                {Number(payoutModal.request.amount).toFixed(2)}
              </p>
              {payoutModal.request.managerId?.phone ? (
                <p className="text-xs text-slate-500">{payoutModal.request.managerId.phone}</p>
              ) : null}
              {payoutModal.request.payoutUpiId ? (
                <p className="text-sm font-semibold text-teal-800">
                  Pay to: {payoutModal.request.payoutUpiId}
                  {payoutModal.request.payoutDisplayName
                    ? ` (${payoutModal.request.payoutDisplayName})`
                    : ''}
                </p>
              ) : (
                <p className="text-xs text-rose-700">This request has no UPI ID saved.</p>
              )}
            </div>
            {payoutModal.action === 'approved' ? (
              <label className="mt-4 block text-xs font-medium text-slate-600">
                Payout reference / UTR (optional)
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="Bank / UPI transaction id after you pay"
                />
              </label>
            ) : (
              <label className="mt-4 block text-xs font-medium text-slate-600">
                Reason (optional)
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="Why rejected"
                />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayoutModal(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={Boolean(payoutBusyId)}
                onClick={submitPayoutModal}
              >
                {payoutBusyId
                  ? '…'
                  : payoutModal.action === 'approved'
                    ? 'Confirm approve'
                    : 'Confirm reject'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
