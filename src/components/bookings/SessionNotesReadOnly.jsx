import { formatBookingDateAndSlot } from '../../utils/date'
import { normalizeSessionRows } from '../physio/physioBookingHelpers'

function formatUpdated(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return null
  }
}

/**
 * Read-only session notes under each session row.
 * @param {{ row: object, showLabel?: boolean }} props — row from normalizeSessionRows
 */
export function SessionNoteReadOnlyBlock({ row, showLabel = true }) {
  const text = row.notes?.text?.trim()
  const updated = formatUpdated(row.notes?.updatedAt)

  return (
    <div className="mt-2 w-full rounded-lg border border-gray-100 bg-white/90 px-3 py-2.5 text-left shadow-sm">
      {showLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Session notes</p>
      )}
      {text ? (
        <>
          <p className={`whitespace-pre-wrap text-xs leading-relaxed text-gray-800 ${showLabel ? 'mt-1' : ''}`}>
            {text}
          </p>
          {updated && <p className="mt-2 text-[11px] text-gray-500">Updated {updated}</p>}
        </>
      ) : (
        <p className={`text-xs italic text-gray-500 ${showLabel ? 'mt-1' : ''}`}>No notes yet</p>
      )}
    </div>
  )
}

/**
 * Card list for patient/admin detail pages (same rows as timeline).
 * @param {{ booking: object }} props
 */
export default function SessionNotesReadOnly({ booking }) {
  const rows = normalizeSessionRows(booking)

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3">
          <p className="text-[11px] font-semibold text-gray-500">
            Session {r.n} · {formatBookingDateAndSlot(r.date, r.time)}
          </p>
          <div className="mt-2">
            <SessionNoteReadOnlyBlock row={r} showLabel={false} />
          </div>
        </div>
      ))}
    </div>
  )
}
