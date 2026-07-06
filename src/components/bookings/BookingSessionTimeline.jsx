import { formatBookingDateAndSlot } from '../../utils/date'
import { normalizeSessionRows, todayYmd } from '../physio/physioBookingHelpers'
import { StarRatingDisplay } from '../reviews/StarRating'

function statusBadgeClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
  if (status === 'no_show') return 'bg-rose-50 text-rose-900 ring-rose-200'
  if (status === 'rescheduled') return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-50 text-slate-800 ring-slate-200'
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'no_show') return 'No-show'
  if (status === 'rescheduled') return 'Rescheduled'
  return 'Scheduled'
}

/**
 * @param {{
 *   booking: object,
 *   reschedule?: { enabled: boolean, onReschedule: (row) => void },
 *   adminSessions?: {
 *     enabled: boolean,
 *     onAdd?: () => void,
 *     onDelete?: (row) => void,
 *     canDelete?: (row, rows) => boolean,
 *     deletingSessionId?: string | null,
 *     disableAdd?: boolean,
 *   },
 *   physioActions?: {
 *     enabled: boolean,
 *     onComplete: (row) => void,
 *     onNoShow?: (row) => void,
 *     busySessionId?: string | null,
 *     canAct?: boolean,
 *     blockedReason?: string,
 *     rowBlockedReason?: (row: object) => string,
 *   },
 *   patientActions?: {
 *     enabled: boolean,
 *     reviewedSessionIds?: Set<string>,
 *     ratingsBySessionId?: Record<string, { rating: number, comment?: string }>,
 *     onRate: (row) => void,
 *     rowBlockedReason?: (row: object) => string,
 *   },
 *   sessionPayments?: Record<string, { recorded: number, items?: Array }>,
 * }} props
 */
export default function BookingSessionTimeline({
  booking,
  reschedule,
  adminSessions,
  physioActions,
  patientActions,
  sessionPayments,
}) {
  const rows = normalizeSessionRows(booking)
  const tday = todayYmd()
  const bookingDone = booking.sessionStatus === 'completed'
  const bookingRescheduled = Boolean(booking.rescheduled)
  const showAddSession = Boolean(adminSessions?.enabled && adminSessions?.onAdd && !bookingDone)

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        bookingRescheduled ? 'border-amber-200/90 bg-amber-50/50' : 'border-gray-100 bg-gray-50/60'
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
          const rowStatus =
            r.status === 'completed' || r.status === 'no_show'
              ? r.status
              : bookingRescheduled && r.date !== tday
              ? 'rescheduled'
              : 'scheduled'
          const rowDone = r.status === 'completed'
          const rowNoShow = r.status === 'no_show'
          const showReschedule = Boolean(
            reschedule?.enabled && reschedule?.onReschedule && !rowDone && !rowNoShow,
          )

          let rowCls =
            'rounded-lg border px-3 py-2 text-sm transition-colors duration-150 flex flex-wrap items-center justify-between gap-2 '
          if (rowDone) {
            rowCls += 'border-emerald-200 bg-emerald-50/90 text-emerald-950'
          } else if (rowNoShow) {
            rowCls += 'border-rose-200 bg-rose-50/80 text-rose-950'
          } else if (r.date === tday) {
            rowCls += 'border-blue-300 bg-blue-50 text-blue-950 ring-1 ring-blue-200/80'
          } else if (bookingRescheduled) {
            rowCls += 'border-amber-200/80 bg-amber-50/40 text-gray-800'
          } else {
            rowCls += 'border-gray-100 bg-white text-gray-800'
          }

          const allowDelete = Boolean(
            adminSessions?.enabled &&
              adminSessions?.onDelete &&
              !rowDone &&
              !rowNoShow &&
              (adminSessions?.canDelete ? adminSessions.canDelete(r, rows) : rows.length > 1),
          )
          const deleting = String(adminSessions?.deletingSessionId || '') === String(r.sessionId || '')
          const busyKey = String(r.sessionId || r.key)
          const actBusy = String(physioActions?.busySessionId || '') === busyKey

          const isTodayOrPast = r.date <= tday
          /** Show the physio-side buttons on every pending row so the
           * physio always sees them; disable (with tooltip) when payment
           * coverage isn't sufficient or the date is in the future. */
          const showPhysioButtons =
            Boolean(physioActions?.enabled) && !rowDone && !rowNoShow
          const perRowReason =
            typeof physioActions?.rowBlockedReason === 'function'
              ? physioActions.rowBlockedReason(r) || ''
              : ''
          const patientLockReason =
            typeof patientActions?.rowBlockedReason === 'function'
              ? patientActions.rowBlockedReason(r) || ''
              : ''
          const lockBadgeReason = perRowReason || patientLockReason
          const blockedReason = !isTodayOrPast
            ? 'You can mark this session once its scheduled day arrives'
            : perRowReason
            ? perRowReason
            : physioActions?.canAct === false
            ? physioActions?.blockedReason ||
              'Payment must be confirmed before you can complete this session'
            : ''
          const canActOnRow = showPhysioButtons && !blockedReason

          const reviewed =
            patientActions?.reviewedSessionIds?.has(String(r.sessionId || '')) ||
            (patientActions?.reviewedSessionIds?.has('__primary__') && !r.perSession)
          const submittedRating = r.sessionId
            ? patientActions?.ratingsBySessionId?.[String(r.sessionId)]
            : patientActions?.ratingsBySessionId?.__primary__
          const showRateBtn =
            Boolean(patientActions?.enabled && patientActions?.onRate) && rowDone && !reviewed
          const showRatedBadge = Boolean(patientActions?.enabled) && rowDone && reviewed

          const payKey = r.sessionId ? String(r.sessionId) : '__primary__'
          const payEntry = sessionPayments?.[payKey]
          const hasPaymentInfo = Boolean(sessionPayments)

          return (
            <li key={r.key} className={rowCls}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="min-w-0">
                    <span className="font-medium">#{r.n}</span>
                    <span className="text-gray-500"> · </span>
                    {formatBookingDateAndSlot(r.date, r.time)}
                    {rowDone && <span className="ml-2 text-xs font-semibold text-emerald-800">Done</span>}
                    {rowNoShow && (
                      <span className="ml-2 text-xs font-semibold text-rose-800">No-show</span>
                    )}
                    {!rowDone && !rowNoShow && r.date === tday && (
                      <span className="ml-2 text-xs font-semibold text-blue-800">Today</span>
                    )}
                    {!rowDone && !rowNoShow && lockBadgeReason && (
                      <span
                        title={lockBadgeReason}
                        className="ml-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M5.25 10.5h13.5A1.5 1.5 0 0120.25 12v7.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
                        </svg>
                        Locked
                      </span>
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
                  {showPhysioButtons && (
                    <button
                      type="button"
                      disabled={actBusy || !canActOnRow}
                      onClick={canActOnRow ? () => physioActions.onComplete(r) : undefined}
                      title={blockedReason || undefined}
                      className="tap-feedback shrink-0 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actBusy ? 'Saving…' : 'Mark complete'}
                    </button>
                  )}
                  {showPhysioButtons && physioActions?.onNoShow && r.perSession && (
                    <button
                      type="button"
                      disabled={actBusy || !canActOnRow}
                      onClick={canActOnRow ? () => physioActions.onNoShow(r) : undefined}
                      title={blockedReason || undefined}
                      className="tap-feedback shrink-0 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      No-show
                    </button>
                  )}
                  {showRateBtn && (
                    <button
                      type="button"
                      onClick={() => patientActions.onRate(r)}
                      className="tap-feedback shrink-0 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-50"
                    >
                      Rate session
                    </button>
                  )}
                  {showRatedBadge && submittedRating && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
                      <StarRatingDisplay value={Number(submittedRating.rating) || 0} size="sm" />
                      <span>Rated</span>
                    </span>
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
                {rowNoShow && r.noShowReason && (
                  <p className="mt-1 text-xs text-rose-900/80">Reason: {r.noShowReason}</p>
                )}
                {hasPaymentInfo ? (
                  <p className="mt-1 text-xs">
                    {payEntry?.recorded > 0.009 ? (
                      <span className="font-semibold text-teal-800">
                        ₹{Number(payEntry.recorded).toFixed(2)} recorded
                        {payEntry.items?.some((i) => i.explicit === false) ? (
                          <span className="ml-1 font-normal text-slate-500">(allocated)</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-slate-500">No payment recorded yet</span>
                    )}
                  </p>
                ) : null}
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
