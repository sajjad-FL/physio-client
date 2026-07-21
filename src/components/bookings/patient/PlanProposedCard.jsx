import { useState } from 'react'
import { formatBookingDateAndSlot } from '../../../utils/date'
import { hasComplimentaryAssessmentVisit } from '../../physio/physioBookingHelpers'
import Button from '../../ui/Button'
import Card from '../../ui/Card'

const PREVIEW_COUNT = 3

export default function PlanProposedCard({ booking: b, onApprove, approving }) {
  const [showAllSessions, setShowAllSessions] = useState(false)
  const schedule = Array.isArray(b.schedule) ? b.schedule : []
  const hiddenCount = Math.max(0, schedule.length - PREVIEW_COUNT)
  const visibleSessions = showAllSessions ? schedule : schedule.slice(0, PREVIEW_COUNT)

  return (
    <Card hover={false} className="border-teal-100 bg-teal-50/30 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Your Care Plan</h2>
          <p className="mt-0.5 text-sm text-slate-600">Review the details below and consent to proceed</p>
        </div>
      </div>

      {(b.sessions != null || b.amountPerSession != null || Number(b.totalAmount || 0) > 0) && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          {b.sessions != null ? (
            <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200/80">
              <p className="text-lg font-bold text-slate-900">{b.sessions}</p>
              <p className="text-xs text-slate-500">Sessions</p>
            </div>
          ) : null}
          {b.amountPerSession != null ? (
            <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200/80">
              <p className="text-lg font-bold text-slate-900">₹{b.amountPerSession}</p>
              <p className="text-xs text-slate-500">Per session</p>
            </div>
          ) : null}
          {Number(b.totalAmount || 0) > 0 ? (
            <div className="rounded-xl bg-white p-3 text-center ring-1 ring-slate-200/80">
              <p className="text-lg font-bold text-slate-900">₹{Number(b.totalAmount).toFixed(0)}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          ) : null}
        </div>
      )}

      {schedule.length > 0 ? (
        <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled Sessions</p>
          {hasComplimentaryAssessmentVisit(b) ? (
            <p className="mt-2 text-sm text-teal-800">
              Includes 1 complimentary assessment visit on{' '}
              <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span>
              {b.assessmentCompletedAt ? ' (already completed by your care manager)' : ' (Care Manager)'}.
            </p>
          ) : null}
          <ul className="mt-3 space-y-2">
            {visibleSessions.map((s, i) => (
              <li key={`${s.date}-${s.time}-${i}`} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {formatBookingDateAndSlot(s.date, s.time)}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowAllSessions((v) => !v)}
              className="mt-2 text-left text-xs font-semibold text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline"
              aria-expanded={showAllSessions}
            >
              {showAllSessions ? 'Show fewer sessions' : `+${hiddenCount} more sessions`}
            </button>
          ) : null}
        </div>
      ) : null}

      <Button type="button" className="mt-5 w-full rounded-xl" disabled={approving} onClick={onApprove}>
        {approving ? 'Submitting…' : 'I consent to this plan'}
      </Button>
    </Card>
  )
}
