import { useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { normalizeSessionRows } from '../physio/physioBookingHelpers'
import { formatBookingDateAndSlot } from '../../utils/date'
import Button from '../ui/Button'

function formatUpdated(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return null
  }
}

function SessionNoteCard({ row, onSaved }) {
  const [text, setText] = useState(row.notes?.text || '')
  const [busy, setBusy] = useState(false)
  const [meta, setMeta] = useState({
    createdAt: row.notes?.createdAt,
    updatedAt: row.notes?.updatedAt,
  })

  useEffect(() => {
    setText(row.notes?.text || '')
    setMeta({
      createdAt: row.notes?.createdAt,
      updatedAt: row.notes?.updatedAt,
    })
  }, [row.notes?.text, row.notes?.createdAt, row.notes?.updatedAt])

  async function save() {
    if (!row.sessionId) {
      toast.error('Cannot save: session reference missing.')
      return
    }
    setBusy(true)
    try {
      const res = await api.patch(`/sessions/${row.sessionId}/notes`, { text })
      const n = res.data?.notes
      if (n) {
        setMeta({ createdAt: n.createdAt, updatedAt: n.updatedAt })
      }
      toast.success('Notes saved')
      onSaved?.()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save notes')
    } finally {
      setBusy(false)
    }
  }

  const updatedLabel = formatUpdated(meta.updatedAt)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-100/80 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Session {row.n}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatBookingDateAndSlot(row.date, row.time)}</p>
        </div>
      </div>
      <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Clinical / session notes
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Observations, exercises given, pain levels, follow-up…"
        className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 text-sm text-gray-900 shadow-inner outline-none ring-0 transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="primary" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save notes'}
        </Button>
        <p className="text-xs text-gray-500">
          {updatedLabel ? (
            <>Last updated {updatedLabel}</>
          ) : (
            <span className="text-gray-400">Not saved yet</span>
          )}
        </p>
      </div>
    </div>
  )
}

/**
 * @param {{ booking: object, onSaved?: () => void }} props
 */
export default function SessionNotesEditor({ booking, onSaved }) {
  const rows = normalizeSessionRows(booking)

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <SessionNoteCard key={r.key} row={r} onSaved={onSaved} />
      ))}
    </div>
  )
}
