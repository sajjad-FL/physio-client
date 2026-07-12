import {
  AFFECTED_AREAS,
  EMPTY_ASSESSMENT_DATA,
  FINDINGS,
  PATIENT_GOALS,
  PRECAUTIONS,
  MOBILITY_OPTIONS,
  SLEEP_OPTIONS,
  validateAssessmentData,
} from '../../constants/assessmentForm'
import { ChipGroup, ScalePicker } from '../bookings/ProgressFieldControls'

/**
 * @param {{
 *   value: object,
 *   onChange: (next: object) => void,
 * }} props
 */
export default function StructuredAssessmentForm({ value, onChange }) {
  const data = { ...EMPTY_ASSESSMENT_DATA, ...(value || {}) }

  function patch(partial) {
    onChange({ ...data, ...partial })
  }

  const err = validateAssessmentData(data)

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Tap to capture baseline progress. Physio will update the same scores each session.
      </p>

      <ScalePicker
        label="Pain now"
        hint="0 = no pain · 10 = worst pain"
        value={data.painNow}
        onChange={(painNow) => patch({ painNow })}
        required
      />
      <ScalePicker
        label="Function / daily activity"
        hint="0 = cannot do daily tasks · 10 = normal"
        value={data.functionNow}
        onChange={(functionNow) => patch({ functionNow })}
        required
      />
      <ScalePicker
        label="Pain on movement"
        hint="Optional — often more sensitive than pain at rest"
        value={data.painOnMovement}
        onChange={(painOnMovement) => patch({ painOnMovement })}
      />

      <ChipGroup
        label="Affected areas"
        options={AFFECTED_AREAS}
        value={data.areas}
        onChange={(areas) =>
          patch({
            areas,
            areasOther: areas.includes('Other') ? data.areasOther : '',
          })
        }
        multi
        required
      />
      {data.areas?.includes('Other') ? (
        <input
          type="text"
          value={data.areasOther || ''}
          onChange={(e) => patch({ areasOther: e.target.value })}
          placeholder="Describe other affected area…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      ) : null}
      <ChipGroup
        label="Key findings"
        options={FINDINGS}
        value={data.findings}
        onChange={(findings) =>
          patch({
            findings,
            findingsOther: findings.includes('Other') ? data.findingsOther : '',
          })
        }
        multi
      />
      {data.findings?.includes('Other') ? (
        <input
          type="text"
          value={data.findingsOther || ''}
          onChange={(e) => patch({ findingsOther: e.target.value })}
          placeholder="Describe other key finding…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      ) : null}
      <ChipGroup
        label="Precautions"
        options={PRECAUTIONS}
        value={data.precautions}
        onChange={(precautions) =>
          patch({
            precautions,
            precautionsOther: precautions.includes('Other') ? data.precautionsOther : '',
          })
        }
        multi
      />
      {data.precautions?.includes('Other') ? (
        <input
          type="text"
          value={data.precautionsOther || ''}
          onChange={(e) => patch({ precautionsOther: e.target.value })}
          placeholder="Describe other precaution…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      ) : null}
      <ChipGroup
        label="Sleep last night"
        options={SLEEP_OPTIONS}
        value={data.sleep}
        onChange={(sleep) => patch({ sleep })}
      />
      <ChipGroup
        label="Walking / mobility"
        options={MOBILITY_OPTIONS}
        value={data.mobility}
        onChange={(mobility) => patch({ mobility })}
      />
      <ChipGroup
        label="Patient goal"
        options={PATIENT_GOALS}
        value={data.patientGoal}
        onChange={(patientGoal) => patch({ patientGoal })}
      />
      {data.patientGoal === 'Other' ? (
        <input
          type="text"
          value={data.patientGoalOther || ''}
          onChange={(e) => patch({ patientGoalOther: e.target.value })}
          placeholder="Describe the goal…"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      ) : null}

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Extra notes <span className="font-normal normal-case text-slate-400">(optional)</span>
        </label>
        <textarea
          value={data.extraNotes || ''}
          onChange={(e) => patch({ extraNotes: e.target.value })}
          rows={3}
          placeholder="Anything chips don’t cover…"
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {err ? <p className="text-xs text-amber-800">Still needed: {err}</p> : null}
    </div>
  )
}
