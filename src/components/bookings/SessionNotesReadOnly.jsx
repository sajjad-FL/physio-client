import { formatBookingDateAndSlot } from '../../utils/date'
import { normalizeSessionRows } from '../physio/physioBookingHelpers'
import { formatProgressHistoryLine } from '../../constants/assessmentForm'
import { SessionNotesDetailBody } from './SessionNotesViewModal'

/**
 * Read-only session notes under each session row (legacy inline — prefer modal).
 * @param {{ row: object, showLabel?: boolean, booking?: object }} props
 */
export function SessionNoteReadOnlyBlock({ row, showLabel = true, booking = null }) {
  const isAssessment = Boolean(row.complimentary)

  return (
    <div className="mt-2 w-full space-y-2 rounded-lg border border-gray-100 bg-white/90 px-3 py-2.5 text-left shadow-sm">
      {showLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {isAssessment ? 'Assessment notes' : 'Session notes'}
        </p>
      )}
      <SessionNotesDetailBody row={row} booking={booking} />
    </div>
  )
}

/**
 * Card list for patient/admin detail pages (same rows as timeline).
 * @param {{ booking: object }} props
 */
export default function SessionNotesReadOnly({ booking }) {
  const rows = normalizeSessionRows(booking)
  const history = formatProgressHistoryLine(booking)

  return (
    <div className="space-y-3">
      {history ? (
        <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-xs font-medium text-teal-950">
          Progress · {history}
        </div>
      ) : null}
      {rows.map((r) => (
        <div key={r.key} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3">
          <p className="text-[11px] font-semibold text-gray-500">
            {r.complimentary ? 'Assessment' : `Session ${r.n}`} · {formatBookingDateAndSlot(r.date, r.time)}
          </p>
          <div className="mt-2">
            <SessionNoteReadOnlyBlock row={r} showLabel={false} booking={booking} />
          </div>
        </div>
      ))}
    </div>
  )
}
