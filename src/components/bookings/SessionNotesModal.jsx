import { useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { formatBookingDateAndSlot } from '../../utils/date'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function formatUpdated(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return null
  }
}

/**
 * @param {{ open: boolean, row: object | null, booking: object | null, onClose: () => void, onSaved?: () => void }} props
 */
export default function SessionNotesModal({ open, row, booking, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    if (!open || !row) return
    setText(row.notes?.text || '')
    setUpdatedAt(row.notes?.updatedAt || null)
  }, [open, row])

  if (!row || !booking) return null

  const hasNotes = Boolean(row.notes?.text?.trim())
  const sessionLabel = row.complimentary
    ? row.label || 'Assessment'
    : row.n != null
    ? `Session #${row.n}`
    : 'Session'
  const updatedLabel = formatUpdated(updatedAt)

  async function save() {
    const targetId = row.sessionId || booking._id
    if (!targetId) {
      toast.error('Cannot save: session reference missing.')
      return
    }
    setBusy(true)
    try {
      const res = await api.patch(`/sessions/${targetId}/notes`, { text })
      const n = res.data?.notes
      if (n?.updatedAt) setUpdatedAt(n.updatedAt)
      toast.success('Session notes saved')
      onSaved?.()
      onClose?.()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save notes')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      centered
      title={hasNotes ? 'Edit session notes' : 'Add session notes'}
      description={`${sessionLabel} · ${formatBookingDateAndSlot(row.date, row.time)}`}
    >
      <p className="text-xs text-slate-500">The patient can view these notes after you save.</p>
      <label htmlFor="session-notes-text" className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Clinical / session notes
      </label>
      <textarea
        id="session-notes-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Observations, exercises given, pain levels, follow-up…"
        className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {updatedLabel ? <>Last updated {updatedLabel}</> : <span className="text-slate-400">Not saved yet</span>}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save notes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
