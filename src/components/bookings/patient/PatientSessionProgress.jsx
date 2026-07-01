import { formatBookingDateAndSlot } from '../../../utils/date'
import Card from '../../ui/Card'
import Button from '../../ui/Button'

export default function PatientSessionProgress({ rows, confirmingSessionId, onConfirm }) {
  if (!rows?.length) return null

  return (
    <Card hover={false} className="border-border-subtle p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Session Progress</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const isCompleted = r.status === 'completed'
          const isNoShow = r.status === 'no_show'
          const needsConfirm = isCompleted && !r.patientConfirmed
          const isConfirmed = isCompleted && r.patientConfirmed
          const confirming = confirmingSessionId === String(r.sessionId)
          const paymentAmt = Number(r.paymentAtCompletion || 0)

          if (needsConfirm) {
            return (
              <li key={r.key} className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="font-semibold text-slate-900">
                  Session {r.n} — {formatBookingDateAndSlot(r.date, r.time)}
                </p>
                <p className="mt-1 text-sm text-slate-600">Completed by your physiotherapist.</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Payment for this session</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {paymentAmt > 0 ? `₹${paymentAmt.toFixed(2)} collected` : 'No payment recorded'}
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full rounded-xl sm:w-auto"
                  disabled={confirming || !r.sessionId}
                  onClick={() => onConfirm(r.sessionId)}
                >
                  {confirming ? 'Confirming…' : 'Confirm session completed'}
                </Button>
              </li>
            )
          }

          return (
            <li
              key={r.key}
              className={[
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                isCompleted || isConfirmed ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white',
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isCompleted ? 'bg-emerald-600 text-white' : isNoShow ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700',
                ].join(' ')}
              >
                {isCompleted ? '✓' : isNoShow ? '×' : r.n}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">Session {r.n}</p>
                <p className="text-sm text-slate-600">{formatBookingDateAndSlot(r.date, r.time)}</p>
                {isNoShow && r.noShowReason ? (
                  <p className="mt-1 text-xs text-rose-800">{r.noShowReason}</p>
                ) : null}
                {isConfirmed ? (
                  <p className="mt-1 text-xs font-medium text-emerald-800">
                    Confirmed{paymentAmt > 0 ? ` · ₹${paymentAmt.toFixed(2)} paid` : ''}
                  </p>
                ) : null}
              </div>
              <span
                className={[
                  'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  isCompleted
                    ? isConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-100 text-emerald-800'
                    : isNoShow
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700',
                ].join(' ')}
              >
                {isCompleted ? (isConfirmed ? 'Confirmed' : 'Completed') : isNoShow ? 'No-show' : 'Scheduled'}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
