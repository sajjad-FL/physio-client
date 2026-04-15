import { formatBookingDateAndSlot } from '../../utils/date'
import { normalizeSessionRows, todayYmd } from '../physio/physioBookingHelpers'

function sessionRowStatus(booking) {
  if (booking.sessionStatus === 'completed') return 'completed'
  if (booking.rescheduled) return 'rescheduled'
  return 'scheduled'
}

function statusBadgeClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
  if (status === 'rescheduled') return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-50 text-slate-800 ring-slate-200'
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'rescheduled') return 'Rescheduled'
  return 'Scheduled'
}

/**
 * @param {{
 *   booking: object,
 *   reschedule?: { enabled: boolean, onReschedule: (row: { key: string, sessionId: string | null, date: string, time: string, n: number }) => void },
 *   adminSessions?: {
 *     enabled: boolean,
 *     onAdd?: () => void,
 *     onDelete?: (row: { key: string, sessionId: string | null, date: string, time: string, n: number }) => void,
 *     canDelete?: (row, rows) => boolean — default: rows.length > 1; admin passes (row) => Boolean(row.sessionId) to allow removing the last timeline row.
 *     deletingSessionId?: string | null,
 *     disableAdd?: boolean,
 *   },
 * }} props
 */
export default function BookingSessionTimeline({ booking, reschedule, adminSessions }) {
  const rows = normalizeSessionRows(booking)
  const tday = todayYmd()
  const visitDone = booking.sessionStatus === 'completed'
  const rescheduled = Boolean(booking.rescheduled)
  const rowStatus = sessionRowStatus(booking)
  const showReschedule = Boolean(reschedule?.enabled && reschedule?.onReschedule && !visitDone)
  const showAddSession = Boolean(adminSessions?.enabled && adminSessions?.onAdd && !visitDone)

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        rescheduled ? 'border-amber-200/90 bg-amber-50/50' : 'border-gray-100 bg-gray-50/60'
      }`}
    >
      {showAddSession ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            disabled={Boolean(adminSessions?.disableAdd)}
            onClick={adminSessions.onAdd}
            className="tap-feedback rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add session
          </button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {rows.map((r) => {
          let rowCls =
            'rounded-lg border px-3 py-2 text-sm transition-colors duration-150 flex flex-wrap items-center justify-between gap-2 '
          if (visitDone) {
            rowCls += 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
          } else if (r.date === tday) {
            rowCls += 'border-blue-300 bg-blue-50 text-blue-950 ring-1 ring-blue-200/80'
          } else if (rescheduled) {
            rowCls += 'border-amber-200/80 bg-amber-50/40 text-gray-800'
          } else {
            rowCls += 'border-gray-100 bg-white text-gray-800'
          }

          const allowDelete = Boolean(
            adminSessions?.enabled &&
              adminSessions?.onDelete &&
              !visitDone &&
              (adminSessions?.canDelete ? adminSessions.canDelete(r, rows) : rows.length > 1),
          )
          const deleting = String(adminSessions?.deletingSessionId || '') === String(r.sessionId || '')

          return (
            <li key={r.key} className={rowCls}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="min-w-0">
                    <span className="font-medium">#{r.n}</span>
                    <span className="text-gray-500"> · </span>
                    {formatBookingDateAndSlot(r.date, r.time)}
                    {visitDone && <span className="ml-2 text-xs font-semibold text-emerald-800">Done</span>}
                    {!visitDone && r.date === tday && (
                      <span className="ml-2 text-xs font-semibold text-blue-800">Today</span>
                    )}
                  </div>
                  {showReschedule && (
                    <button
                      type="button"
                      onClick={() => reschedule.onReschedule(r)}
                      className="tap-feedback shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-50"
                    >
                      Reschedule
                    </button>
                  )}
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => adminSessions.onDelete(r)}
                      className="tap-feedback shrink-0 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(
                  rowStatus,
                )}`}
              >
                {statusLabel(rowStatus)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
