import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const adminHeaders = () => ({
  headers: { Authorization: `Bearer ${import.meta.env.VITE_ADMIN_API_KEY || ''}` },
})

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

  const openEntries = (ledger?.entries || []).filter((e) => e.status === 'open')

  return (
    <div className="space-y-6">
      <Card hover={false} className="p-5">
        <h2 className="font-semibold text-slate-900">Manager batch settlement</h2>
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
          <ul className="mt-3 space-y-2">
            {openEntries.map((e) => (
              <li key={e._id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedEntryIds.includes(e._id)}
                  onChange={() => toggleEntry(e._id)}
                />
                <span>
                  ₹{Number(e.amount).toFixed(2)} — {e.bookingId?.issue || 'Booking'}
                </span>
              </li>
            ))}
          </ul>
          <Button type="button" className="mt-4" disabled={busy || !selectedEntryIds.length} onClick={createBatch}>
            Create settlement batch
          </Button>
        </Card>
      ) : null}

      <div className="space-y-2">
        {batches.map((batch) => (
          <Card key={batch._id} hover={false} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">
                  {batch.managerId?.name || 'Manager'} · ₹{Number(batch.expectedAmount).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">{batch.status}</p>
              </div>
              {batch.status === 'open' ? (
                <Button type="button" disabled={busy} onClick={() => settleBatch(batch._id)}>
                  Mark settled
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
