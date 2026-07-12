import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  SLEEP_OPTIONS,
  MOBILITY_OPTIONS,
  VS_LAST_VISIT_OPTIONS,
  HOME_EXERCISES_OPTIONS,
  PAIN_MEDS_OPTIONS,
} from '../../constants/assessmentForm'

function optionLabel(options, value) {
  if (!value) return null
  return options.find((o) => o.value === value)?.label || value
}

function formatUpdated(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return null
  }
}

function mapChipList(list, otherText) {
  if (!Array.isArray(list) || !list.length) return []
  return list.map((a) =>
    a === 'Other' && String(otherText || '').trim() ? `Other (${String(otherText).trim()})` : a,
  )
}

function ScoreCard({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
        <span className="text-sm font-medium text-slate-400">/10</span>
      </p>
    </div>
  )
}

function ChipGroup({ label, items }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-900 ring-1 ring-teal-200/80"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-slate-900">{value}</span>
    </div>
  )
}

/**
 * Structured read-only body for assessment baseline or per-visit progress.
 */
export function SessionNotesDetailBody({ row, booking = null }) {
  const isAssessment = Boolean(row?.complimentary)
  const data = isAssessment
    ? booking?.assessmentData && typeof booking.assessmentData === 'object'
      ? booking.assessmentData
      : null
    : row?.notes?.painNow != null ||
        row?.notes?.functionNow != null ||
        row?.notes?.sleep ||
        row?.notes?.mobility
      ? row.notes
      : null

  const hasScores =
    data?.painNow != null || data?.painOnMovement != null || data?.functionNow != null

  const freeText = isAssessment
    ? String(data?.extraNotes || '').trim() ||
      (!data ? String(row?.notes?.text || '').trim() : '')
    : (() => {
        // Session notes.text is a full summary dump; only show the trailing free-text Notes: part
        // when structured scores already cover the rest.
        const raw = String(row?.notes?.text || '').trim()
        if (!hasScores) return raw
        const m = raw.match(/(?:^|\n)Notes:\s*([\s\S]+)$/)
        return m ? m[1].trim() : ''
      })()

  const updated = formatUpdated(
    isAssessment ? booking?.assessmentCompletedAt || row?.notes?.updatedAt : row?.notes?.updatedAt,
  )

  const areas = mapChipList(data?.areas, data?.areasOther)
  const findings = mapChipList(data?.findings, data?.findingsOther)
  const precautions = mapChipList(data?.precautions, data?.precautionsOther)
  const goal =
    data?.patientGoal === 'Other' && String(data?.patientGoalOther || '').trim()
      ? String(data.patientGoalOther).trim()
      : data?.patientGoal || null

  const hasStructured =
    hasScores ||
    areas.length ||
    findings.length ||
    precautions.length ||
    data?.sleep ||
    data?.mobility ||
    goal ||
    data?.vsLastVisit ||
    data?.homeExercises ||
    data?.painMeds

  if (!hasStructured && !freeText) {
    return <p className="text-sm italic text-slate-500">No notes recorded yet.</p>
  }

  return (
    <div className="space-y-5">
      {hasScores ? (
        <div className="grid grid-cols-3 gap-2">
          <ScoreCard label="Pain now" value={data.painNow} />
          <ScoreCard label="On movement" value={data.painOnMovement} />
          <ScoreCard label="Function" value={data.functionNow} />
        </div>
      ) : null}

      <ChipGroup label="Affected areas" items={areas} />
      <ChipGroup label="Key findings" items={findings} />
      <ChipGroup label="Precautions" items={precautions} />

      {data?.sleep ||
      data?.mobility ||
      goal ||
      data?.vsLastVisit ||
      data?.homeExercises ||
      data?.painMeds ? (
        <div className="rounded-xl border border-slate-200 px-3">
          <DetailRow label="Sleep" value={optionLabel(SLEEP_OPTIONS, data.sleep)} />
          <DetailRow label="Walking / mobility" value={optionLabel(MOBILITY_OPTIONS, data.mobility)} />
          <DetailRow label="Patient goal" value={goal} />
          <DetailRow label="Vs last visit" value={optionLabel(VS_LAST_VISIT_OPTIONS, data.vsLastVisit)} />
          <DetailRow
            label="Home exercises"
            value={optionLabel(HOME_EXERCISES_OPTIONS, data.homeExercises)}
          />
          <DetailRow label="Pain meds" value={optionLabel(PAIN_MEDS_OPTIONS, data.painMeds)} />
        </div>
      ) : null}

      {freeText ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Notes</p>
          <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-relaxed text-slate-800">
            {freeText}
          </p>
        </div>
      ) : null}

      {updated ? <p className="text-xs text-slate-500">Updated {updated}</p> : null}
    </div>
  )
}

/**
 * Modal to view assessment / session notes in a proper layout.
 */
export default function SessionNotesViewModal({ open, onClose, row, booking, viewerHint }) {
  if (!row) return null

  const isAssessment = Boolean(row.complimentary)
  const title = isAssessment ? 'Assessment notes' : `Session ${row.n} notes`
  const description = [
    formatBookingDateAndSlot(row.date, row.time),
    isAssessment ? 'Complimentary baseline' : null,
    viewerHint || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} className="max-w-md">
      <SessionNotesDetailBody row={row} booking={booking} />
      <div className="mt-6 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
