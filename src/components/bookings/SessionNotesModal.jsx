import { useEffect, useMemo, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  EMPTY_SESSION_PROGRESS,
  HOME_EXERCISES_OPTIONS,
  MOBILITY_OPTIONS,
  PAIN_MEDS_OPTIONS,
  SLEEP_OPTIONS,
  VS_LAST_VISIT_OPTIONS,
  validateSessionProgress,
} from '../../constants/assessmentForm'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { ChipGroup, ScalePicker } from './ProgressFieldControls'

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
  const [form, setForm] = useState({ ...EMPTY_SESSION_PROGRESS })
  const [busy, setBusy] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    if (!open || !row) return
    const n = row.notes || {}
    let extra = n.text || ''
    if (n.painNow != null && extra) {
      const match = extra.match(/(?:^|\n)Notes: ([\s\S]+)$/)
      extra = match ? match[1] : ''
    }
    setForm({
      ...EMPTY_SESSION_PROGRESS,
      painNow: n.painNow ?? null,
      functionNow: n.functionNow ?? null,
      painOnMovement: n.painOnMovement ?? null,
      sleep: n.sleep || null,
      mobility: n.mobility || null,
      vsLastVisit: n.vsLastVisit || null,
      homeExercises: n.homeExercises || null,
      painMeds: n.painMeds || null,
      text: extra,
    })
    setUpdatedAt(n.updatedAt || null)
  }, [open, row])

  const baseline = booking?.assessmentData
  const baselineLine = useMemo(() => {
    if (!baseline) return null
    const parts = []
    if (baseline.painNow != null) parts.push(`Pain ${baseline.painNow}`)
    if (baseline.functionNow != null) parts.push(`Function ${baseline.functionNow}`)
    if (baseline.areas?.length) parts.push(baseline.areas.slice(0, 3).join(', '))
    return parts.length ? parts.join(' · ') : null
  }, [baseline])

  if (!row || !booking) return null

  const hasProgress = row.notes?.painNow != null || Boolean(row.notes?.text?.trim())
  const sessionLabel = row.complimentary
    ? row.label || 'Assessment'
    : row.n != null
      ? `Session #${row.n}`
      : 'Session'
  const updatedLabel = formatUpdated(updatedAt)
  const validationError = validateSessionProgress(form)

  function patch(partial) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function save() {
    if (validationError) {
      toast.error(validationError)
      return
    }
    const targetId = row.sessionId || booking._id
    if (!targetId) {
      toast.error('Cannot save: session reference missing.')
      return
    }
    setBusy(true)
    try {
      const res = await api.patch(`/sessions/${targetId}/notes`, {
        painNow: form.painNow,
        functionNow: form.functionNow,
        painOnMovement: form.painOnMovement,
        sleep: form.sleep,
        mobility: form.mobility,
        vsLastVisit: form.vsLastVisit,
        homeExercises: form.homeExercises,
        painMeds: form.painMeds,
        text: form.text,
      })
      const n = res.data?.notes
      if (n?.updatedAt) setUpdatedAt(n.updatedAt)
      toast.success('Session progress saved')
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
      title={hasProgress ? 'Update session progress' : 'Session progress'}
      description={`${sessionLabel} · ${formatBookingDateAndSlot(row.date, row.time)}`}
    >
      <p className="text-xs text-slate-500">
        Update scores each visit so we can track recovery. Patient can view after you save.
      </p>

      {baselineLine ? (
        <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/70 px-3 py-2 text-xs text-teal-950">
          <span className="font-semibold">Baseline · </span>
          {baselineLine}
        </div>
      ) : null}

      <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1">
        <ScalePicker
          label="Pain now"
          hint="0 = no pain · 10 = worst"
          value={form.painNow}
          onChange={(painNow) => patch({ painNow })}
          required
        />
        <ScalePicker
          label="Function / daily activity"
          hint="0 = cannot do daily tasks · 10 = normal"
          value={form.functionNow}
          onChange={(functionNow) => patch({ functionNow })}
          required
        />
        <ScalePicker
          label="Pain on movement"
          value={form.painOnMovement}
          onChange={(painOnMovement) => patch({ painOnMovement })}
        />
        <ChipGroup
          label="Sleep last night"
          options={SLEEP_OPTIONS}
          value={form.sleep}
          onChange={(sleep) => patch({ sleep })}
        />
        <ChipGroup
          label="Walking / mobility"
          options={MOBILITY_OPTIONS}
          value={form.mobility}
          onChange={(mobility) => patch({ mobility })}
        />
        <ChipGroup
          label="Compared to last visit"
          options={VS_LAST_VISIT_OPTIONS}
          value={form.vsLastVisit}
          onChange={(vsLastVisit) => patch({ vsLastVisit })}
        />
        <ChipGroup
          label="Home exercises done"
          options={HOME_EXERCISES_OPTIONS}
          value={form.homeExercises}
          onChange={(homeExercises) => patch({ homeExercises })}
        />
        <ChipGroup
          label="Pain meds today"
          options={PAIN_MEDS_OPTIONS}
          value={form.painMeds}
          onChange={(painMeds) => patch({ painMeds })}
        />
        <div>
          <label
            htmlFor="session-notes-text"
            className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            Extra notes <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <textarea
            id="session-notes-text"
            value={form.text}
            onChange={(e) => patch({ text: e.target.value })}
            rows={3}
            placeholder="Interventions, exercises given, follow-up…"
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {updatedLabel ? <>Last updated {updatedLabel}</> : <span className="text-slate-400">Not saved yet</span>}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={busy || Boolean(validationError)} onClick={save}>
            {busy ? 'Saving…' : 'Save progress'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
