import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AdminCaseContext, { resolveAdminCaseContext } from '../../components/admin/AdminCaseContext'

const adminHeaders = () => ({
  headers: { Authorization: `Bearer ${import.meta.env.VITE_ADMIN_API_KEY || ''}` },
})

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

  useEffect(() => {
    api.get('/admin/care-managers', adminHeaders()).then((res) => {
      setManagers(res.data?.managers || [])
    })
    api.get('/admin/settlement-batches', adminHeaders()).then((res) => {
      setBatches(res.data?.batches || [])
    })
  }, [])

  const loadLedger = useCallback(async (managerId) => {
    if (!managerId) return
    try {
      const res = await api.get(`/admin/managers/${managerId}/ledger`, adminHeaders())
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
        { ledgerEntryIds: selectedEntryIds },
        adminHeaders(),
      )
      toast.success('Settlement batch created')
      await loadLedger(selectedManagerId)
      const res = await api.get('/admin/settlement-batches', adminHeaders())
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
      await api.patch(`/admin/settlement-batches/${batchId}/settle`, {}, adminHeaders())
      toast.success('Batch settled')
      const res = await api.get('/admin/settlement-batches', adminHeaders())
      setBatches(res.data?.batches || [])
      if (selectedManagerId) await loadLedger(selectedManagerId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not settle batch')
    } finally {
      setBusy(false)
    }
  }

  const allEntries = ledger?.entries || []
  const openEntries = allEntries.filter((e) => e.status === 'open')
  const historyEntries = allEntries.filter((e) => e.status !== 'open')

  return (
    <div className="space-y-6">
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
          <p className="mt-2 text-sm text-slate-600">
            Open balance: ₹{Number(ledger.openTotal || 0).toFixed(2)}
          </p>
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
    </div>
  )
}
