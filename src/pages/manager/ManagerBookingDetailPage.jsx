import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import HomePlanForm from '../../components/physio/HomePlanForm'
import AdminAssignPhysioModal from '../../components/admin/AdminAssignPhysioModal'
import InstallmentsCard from '../../components/payments/InstallmentsCard'
import RecordCollectionModal from '../../components/payments/RecordCollectionModal'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import RescheduleModal from '../../components/physio/RescheduleModal'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'
import { hasComplimentaryAssessmentVisit } from '../../components/physio/physioBookingHelpers'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'
import { billingTypeLabel, paymentAmountLabel, bookingCodeBadge } from '../../utils/bookingDisplay'
import { managerWorkflowMeta } from '../../utils/managerWorkflow'
import StructuredAssessmentForm from '../../components/manager/StructuredAssessmentForm'
import SuggestTechniquePanel from '../../components/manager/SuggestTechniquePanel'
import {
  EMPTY_ASSESSMENT_DATA,
  validateAssessmentData,
} from '../../constants/assessmentForm'

function badgeToneClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'action':
      return 'bg-teal-50 text-teal-900 ring-teal-200/80'
    case 'waiting':
      return 'bg-blue-50 text-blue-900 ring-blue-200/80'
    case 'progress':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200/80'
  }
}

/** @typedef {'done' | 'current' | 'waiting' | 'upcoming'} StepState */

function buildWorkflowSteps(ctx) {
  const {
    b,
    assessmentDone,
    needsAssessment,
    canCreatePlan,
    awaitingConsent,
    planLive,
    hasPhysio,
    outstanding,
    hasPlan,
    paymentSummary,
    techniqueManaged,
  } = ctx
  const totalPaid = Number(paymentSummary?.totalPaid || 0)

  if (techniqueManaged) {
    return [
      {
        id: 'physio',
        num: 1,
        label: 'Physio',
        hint: hasPhysio ? b.physioId?.name || 'Assigned' : 'Assign for this technique visit',
        state: hasPhysio ? 'done' : 'current',
      },
      {
        id: 'payment',
        num: 2,
        label: 'Payment',
        hint:
          outstanding > 0.009
            ? `₹${Math.round(outstanding)} due`
            : totalPaid > 0
            ? 'Fully paid'
            : 'Record cash / UPI',
        state: !hasPhysio
          ? 'upcoming'
          : outstanding > 0.009
          ? 'current'
          : totalPaid > 0
          ? 'done'
          : 'current',
      },
    ]
  }

  /** @type {Array<{ id: string, num: number, label: string, hint: string, state: StepState }>} */
  const steps = [
    {
      id: 'assessment',
      num: 1,
      label: 'Assessment',
      hint: assessmentDone ? 'Saved' : 'Complimentary visit',
      state: assessmentDone ? 'done' : 'current',
    },
    {
      id: 'plan',
      num: 2,
      label: 'Care plan',
      hint: awaitingConsent
        ? 'Patient must consent'
        : planLive
        ? `${b.sessions || '—'} sessions · ${paymentAmountLabel(b)}`
        : canCreatePlan
        ? 'Set price & dates'
        : 'After assessment',
      state: needsAssessment
        ? 'upcoming'
        : awaitingConsent
        ? 'waiting'
        : canCreatePlan
        ? 'current'
        : hasPlan || planLive
        ? 'done'
        : 'upcoming',
    },
    {
      id: 'physio',
      num: 3,
      label: 'Physio',
      hint: hasPhysio ? b.physioId?.name || 'Assigned' : 'After plan is live',
      state: !planLive ? 'upcoming' : hasPhysio ? 'done' : 'current',
    },
    {
      id: 'payment',
      num: 4,
      label: 'Payment',
      hint:
        outstanding > 0.009
          ? `₹${Math.round(outstanding)} due`
          : totalPaid > 0
          ? 'Fully paid'
          : 'Record cash / UPI',
      state: !planLive
        ? 'upcoming'
        : outstanding > 0.009
        ? 'current'
        : totalPaid > 0
        ? 'done'
        : hasPhysio
        ? 'current'
        : 'upcoming',
    },
  ]
  return steps
}

function defaultOpenStep(steps) {
  return steps.find((s) => s.state === 'current' || s.state === 'waiting')?.id || steps.find((s) => s.state === 'done')?.id || 'assessment'
}

function StepRail({ steps, openStep, onSelect }) {
  const cols = steps.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'
  return (
    <ol className={`grid ${cols} gap-1 sm:gap-2`}>
      {steps.map((step, i) => {
        const isOpen = openStep === step.id
        const done = step.state === 'done'
        const waiting = step.state === 'waiting'
        const current = step.state === 'current'
        const upcoming = step.state === 'upcoming'

        let circleCls =
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition '
        if (done) circleCls += 'bg-emerald-600 text-white'
        else if (waiting) circleCls += 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
        else if (current || isOpen) circleCls += 'bg-teal-600 text-white ring-2 ring-teal-300'
        else if (upcoming) circleCls += 'bg-slate-100 text-slate-400'
        else circleCls += 'bg-slate-200 text-slate-600'

        return (
          <li key={step.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              className={`tap-feedback flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition sm:px-2 ${
                isOpen ? 'bg-teal-50 ring-1 ring-teal-200/80' : 'hover:bg-slate-50'
              }`}
            >
              <span className={circleCls}>{done ? '✓' : step.num}</span>
              <span className={`w-full truncate text-[11px] font-semibold sm:text-xs ${isOpen ? 'text-teal-900' : 'text-slate-700'}`}>
                {step.label}
              </span>
              <span className="hidden w-full truncate text-[10px] text-slate-500 sm:block">{step.hint}</span>
            </button>
            {i < steps.length - 1 ? (
              <div className="pointer-events-none absolute hidden" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function PlanSummaryGrid({ b }) {
  return (
    <dl className="grid gap-3 rounded-xl bg-slate-50/80 p-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-slate-500">Sessions</dt>
        <dd className="mt-0.5 font-semibold text-slate-900">{b.sessions ?? '—'}</dd>
      </div>
      {b.amountPerSession != null ? (
        <div>
          <dt className="text-slate-500">Per session</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">₹{Number(b.amountPerSession).toFixed(0)}</dd>
        </div>
      ) : null}
      <div>
        <dt className="text-slate-500">Total</dt>
        <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{paymentAmountLabel(b)}</dd>
      </div>
      {billingTypeLabel(b) ? (
        <div>
          <dt className="text-slate-500">Payment type</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{billingTypeLabel(b)}</dd>
        </div>
      ) : null}
    </dl>
  )
}

export default function ManagerBookingDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [physios, setPhysios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [assessmentData, setAssessmentData] = useState({ ...EMPTY_ASSESSMENT_DATA })
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [clinics, setClinics] = useState([])
  const [assignClinicId, setAssignClinicId] = useState('')
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [rescheduleRow, setRescheduleRow] = useState(null)
  const [sessionBusy, setSessionBusy] = useState(null)
  const [openStep, setOpenStep] = useState('assessment')
  const [stepReady, setStepReady] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [bRes, pRes, cRes] = await Promise.all([
        api.get(`/manager/bookings/${id}`),
        api.get('/manager/physios', { params: { bookingId: id } }),
        api.get('/manager/clinics', { params: { active: '1' } }).catch(() => ({ data: { clinics: [] } })),
      ])
      setBooking(bRes.data)
      setAssessmentData(
        bRes.data?.assessmentData && typeof bRes.data.assessmentData === 'object'
          ? { ...EMPTY_ASSESSMENT_DATA, ...bRes.data.assessmentData }
          : {
              ...EMPTY_ASSESSMENT_DATA,
              extraNotes: bRes.data?.assessmentNotes || '',
            },
      )
      setPhysios(pRes.data?.physios || [])
      setClinics(cRes.data?.clinics || [])
      if (bRes.data?.clinicId) {
        setAssignClinicId(bRes.data.clinicId?._id || bRes.data.clinicId || '')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load booking')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setStepReady(false)
    setOpenStep('assessment')
  }, [id])

  const pageCtx = useMemo(() => {
    if (!booking) return null
    const b = booking
    const techniqueManaged = b.carePath === 'technique_managed'
    const planLive = b.planStatus === 'live' || b.planStatus === 'approved' || techniqueManaged
    const awaitingConsent = techniqueManaged
      ? false
      : b.planStatus === 'awaiting_consent' || b.planStatus === 'proposed'
    const assessmentDone = techniqueManaged ? true : Boolean(b.assessmentCompletedAt)
    const canCreatePlan = techniqueManaged ? false : !awaitingConsent && !planLive && assessmentDone
    const needsAssessment = techniqueManaged ? false : !awaitingConsent && !planLive && !assessmentDone
    const paymentSummary = b.paymentSummary || null
    const payments = b.payments || []
    const outstanding = Number(paymentSummary?.outstanding || 0)
    const canCollect = planLive && outstanding > 0.009
    const hasPlan = techniqueManaged ? true : !canCreatePlan && !needsAssessment
    const hasPhysio = Boolean(b.physioId)
    const workflowMeta = managerWorkflowMeta({ ...b, paymentSummary })

    return {
      b,
      techniqueManaged,
      planLive,
      awaitingConsent,
      assessmentDone,
      canCreatePlan,
      needsAssessment,
      paymentSummary,
      payments,
      outstanding,
      canCollect,
      hasPlan,
      hasPhysio,
      workflowMeta,
      sessionPaymentMap: buildSessionPaymentMap(b, payments, paymentSummary),
    }
  }, [booking])

  const steps = useMemo(() => (pageCtx ? buildWorkflowSteps(pageCtx) : []), [pageCtx])

  useEffect(() => {
    if (!steps.length || stepReady) return
    setOpenStep(defaultOpenStep(steps))
    setStepReady(true)
  }, [steps, stepReady])

  useEffect(() => {
    if (!pageCtx?.techniqueManaged) return
    if (openStep === 'assessment' || openStep === 'plan') {
      setOpenStep(defaultOpenStep(steps.length ? steps : [{ id: 'physio', state: 'current' }]))
    }
  }, [pageCtx?.techniqueManaged, openStep, steps])

  const selectedPhysioForAssign = useMemo(
    () => physios.find((p) => String(p._id) === String(assignPhysioId)),
    [physios, assignPhysioId],
  )

  async function saveAssessment() {
    const err = validateAssessmentData(assessmentData)
    if (err) {
      toast.error(err)
      return
    }
    setBusy(true)
    try {
      const res = await api.patch(`/manager/bookings/${id}/assessment`, { assessmentData })
      setBooking(res.data)
      if (res.data?.assessmentData) {
        setAssessmentData({ ...EMPTY_ASSESSMENT_DATA, ...res.data.assessmentData })
      }
      toast.success('Assessment saved')
      setOpenStep('plan')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save assessment')
    } finally {
      setBusy(false)
    }
  }

  async function submitPlan(payload) {
    setBusy(true)
    const wasEdit =
      booking?.planStatus === 'awaiting_consent' || booking?.planStatus === 'proposed'
    try {
      const res = await api.patch(`/manager/bookings/${id}/create-plan`, payload)
      setBooking(res.data)
      toast.success(wasEdit ? 'Plan updated' : 'Plan sent for patient consent')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save plan')
    } finally {
      setBusy(false)
    }
  }

  async function assignPhysio() {
    if (!assignPhysioId) return
    setBusy(true)
    try {
      const res = await api.patch(`/manager/bookings/${id}/assign-physio`, { physioId: assignPhysioId })
      setBooking(res.data)
      toast.success('Physiotherapist assigned')
      setOpenStep('payment')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not assign physio')
    } finally {
      setBusy(false)
    }
  }

  async function assignClinic() {
    if (!assignClinicId) return
    setBusy(true)
    try {
      const res = await api.patch(`/manager/bookings/${id}/assign-clinic`, { clinicId: assignClinicId })
      setBooking(res.data)
      toast.success('Clinic assigned — case moves to clinic care')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not assign clinic')
    } finally {
      setBusy(false)
    }
  }

  async function onCollectionRecorded() {
    await load()
  }

  async function handleDeleteSession(row) {
    const b = pageCtx?.b
    if (!b?._id || !row?.sessionId) return
    const ok = window.confirm(`Delete session #${row.n} (${row.date}, ${row.time})?`)
    if (!ok) return
    setSessionBusy(String(row.sessionId))
    try {
      await api.delete(`/manager/bookings/${b._id}/sessions/${row.sessionId}`)
      toast.success('Session deleted')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not delete session')
    } finally {
      setSessionBusy(null)
    }
  }

  if (loading) return <DetailSkeleton />
  if (!pageCtx) {
    return (
      <Card hover={false} className="p-6">
        <p className="text-slate-600">Booking not found.</p>
        <Link to="/manager/bookings" className="mt-3 inline-block text-teal-700">
          Back to cases
        </Link>
      </Card>
    )
  }

  const {
    b,
    planLive,
    awaitingConsent,
    canCreatePlan,
    needsAssessment,
    paymentSummary,
    payments,
    outstanding,
    canCollect,
    hasPlan,
    hasPhysio,
    workflowMeta,
    sessionPaymentMap,
  } = pageCtx

  const activeStepMeta = steps.find((s) => s.id === openStep)
  const canRescheduleBooking =
    Boolean(b) && b.sessionStatus !== 'completed' && Boolean(b.date) && Boolean(b.timeSlot)
  const assessmentStillOpen =
    hasComplimentaryAssessmentVisit(b) && !b.assessmentCompletedAt

  function openPrimaryReschedule() {
    const hasSchedule = Array.isArray(b.schedule) && b.schedule.length > 0
    if (assessmentStillOpen) {
      setRescheduleRow({
        key: `${b._id}-assessment-reschedule`,
        sessionId: null,
        date: b.date,
        time: b.timeSlot,
        n: null,
        label: 'Assessment visit',
        complimentary: true,
      })
      return
    }
    if (hasSchedule) {
      const idx = b.schedule.findIndex(
        (s) => s.status !== 'completed' && s.status !== 'no_show',
      )
      const i = idx >= 0 ? idx : 0
      const next = b.schedule[i]
      setRescheduleRow({
        key: `${b._id}-s-${i}-reschedule`,
        sessionId: next?._id != null ? String(next._id) : null,
        date: next?.date || b.date,
        time: next?.time || b.timeSlot,
        n: i + 1,
        complimentary: false,
      })
      return
    }
    setRescheduleRow({
      key: `${b._id}-primary-reschedule`,
      sessionId: null,
      date: b.date,
      time: b.timeSlot,
      n: 1,
      label: 'Visit',
      complimentary: false,
    })
  }

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-4">
      {/* Patient header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <Link to="/manager/bookings" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          ← All cases
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900">{b.userId?.name || 'Patient'}</h1>
            {bookingCodeBadge(b) ? (
              <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{bookingCodeBadge(b)}</p>
            ) : null}
            <p className="mt-0.5 text-sm text-slate-600">{b.issue}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-500">
                {formatBookingDateAndSlot(b.date, b.timeSlot)}
                {b.userId?.location ? ` · ${b.userId.location}` : ''}
              </p>
              {canRescheduleBooking ? (
                <button
                  type="button"
                  onClick={openPrimaryReschedule}
                  className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-50"
                >
                  Reschedule
                </button>
              ) : null}
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeToneClass(
              workflowMeta.tone,
            )}`}
          >
            {workflowMeta.label}
          </span>
        </div>
      </div>

      <SuggestTechniquePanel sourceBookingId={b._id} disabled={busy} />

      {/* 4-step workflow — tap a step to open it */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:p-3 md:p-4">
        <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3">Your checklist</p>
        <StepRail steps={steps} openStep={openStep} onSelect={setOpenStep} />
      </div>

      {/* One panel — only the selected step */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Step {activeStepMeta?.num || 1} of {steps.length || 4}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{activeStepMeta?.label}</h2>
          {pageCtx.techniqueManaged ? (
            <p className="mt-1 text-sm text-slate-600">
              Technique session — assign a physiotherapist and record payment. No assessment or care plan needed.
            </p>
          ) : null}
          {activeStepMeta?.state === 'waiting' ? (
            <p className="mt-1 text-sm text-blue-800">Waiting on the patient — you can still edit the plan below.</p>
          ) : null}
        </div>

        {openStep === 'assessment' && !pageCtx.techniqueManaged && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Visit on <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span> is
              complimentary. Capture baseline scores, then move to step 2.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Assessment visit</h3>
              <p className="mt-0.5 text-xs text-slate-500">Change the date or time if the patient needs another slot.</p>
              <div className="mt-3">
                <BookingSessionTimeline
                  booking={b}
                  notesViewer={{ enabled: true }}
                  reschedule={{
                    enabled: true,
                    includeComplimentary: true,
                    onReschedule: (row) => setRescheduleRow(row),
                  }}
                />
              </div>
            </div>
            <StructuredAssessmentForm value={assessmentData} onChange={setAssessmentData} />
            <Button type="button" disabled={busy || Boolean(validateAssessmentData(assessmentData))} onClick={saveAssessment}>
              {pageCtx.assessmentDone ? 'Save changes' : 'Save & continue'}
            </Button>
          </div>
        )}

        {openStep === 'plan' && !pageCtx.techniqueManaged && (
          <div className="space-y-4">
            {needsAssessment ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Complete step 1 (Assessment) first.
              </p>
            ) : null}

            {canCreatePlan ? (
              <HomePlanForm booking={b} busy={busy} onSubmit={submitPlan} allowCustomFee embedded />
            ) : null}

            {awaitingConsent ? (
              <>
                <p className="text-sm text-amber-900">
                  Patient has not consented yet — fix amount or dates if needed, then resubmit.
                </p>
                <HomePlanForm
                  booking={b}
                  busy={busy}
                  onSubmit={submitPlan}
                  allowCustomFee
                  embedded
                  submitLabel="Update home plan"
                />
              </>
            ) : null}

            {hasPlan && !canCreatePlan && !awaitingConsent ? (
              <>
                <p className="text-sm text-slate-600">Plan is locked after patient consent.</p>
                <PlanSummaryGrid b={b} />
              </>
            ) : null}
          </div>
        )}

        {openStep === 'physio' && (
          <div className="space-y-4">
            {!planLive && !hasPhysio && !pageCtx.techniqueManaged ? (
              <p className="text-sm text-slate-600">Available after the patient consents to the care plan (step 2).</p>
            ) : null}
            {pageCtx.techniqueManaged && !hasPhysio ? (
              <p className="text-sm text-slate-600">
                Fixed technique price {paymentAmountLabel(b)}. Assign a physiotherapist for this{' '}
                {b.serviceType === 'clinic' ? 'clinic visit' : 'home visit'}.
              </p>
            ) : null}

            {hasPhysio ? (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-800">Assigned</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{b.physioId?.name}</p>
                <p className="text-sm text-slate-600">
                  {b.physioId?.specialization || '—'} · {b.physioId?.experience ?? 0} yrs
                </p>
              </div>
            ) : null}

            {planLive && !hasPhysio ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Pick a verified therapist in the patient&apos;s zone.</p>
                {selectedPhysioForAssign ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {resolveFileUrl(selectedPhysioForAssign.avatar) ? (
                        <img src={resolveFileUrl(selectedPhysioForAssign.avatar)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                          {(selectedPhysioForAssign.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{selectedPhysioForAssign.name}</p>
                      <p className="truncate text-xs text-slate-500">{selectedPhysioForAssign.specialization || '—'}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setAssignModalOpen(true)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setAssignModalOpen(true)}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-left text-sm font-medium hover:border-teal-300 hover:bg-teal-50/40 sm:w-auto sm:min-w-[260px]"
                  >
                    Choose physiotherapist…
                  </button>
                )}
                <AdminAssignPhysioModal
                  key={b?._id ? `mgr-assign-${b._id}` : `mgr-assign-${id}`}
                  open={assignModalOpen}
                  onClose={() => setAssignModalOpen(false)}
                  physios={physios}
                  patientCoords={b?.userId?.coordinates}
                  selectedId={assignPhysioId}
                  onConfirmSelect={(physioId) => setAssignPhysioId(physioId)}
                  profileTo={(physioId) => `/physician/${physioId}`}
                />
                <Button type="button" disabled={busy || !assignPhysioId} onClick={assignPhysio}>
                  Assign physio
                </Button>
              </div>
            ) : null}

            {b.assessmentCompletedAt || b.workflowStatus === 'assessment_done' || b.planStatus ? (
              <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/30 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Refer to clinic</h3>
                <p className="text-xs text-slate-500">
                  If the patient needs facility equipment, assign a clinic. You remain the referrer for commission.
                </p>
                {b.clinicId ? (
                  <p className="text-sm text-slate-700">
                    Assigned: {typeof b.clinicId === 'object' ? b.clinicId.name : 'Clinic'}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={assignClinicId}
                    onChange={(e) => setAssignClinicId(e.target.value)}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Choose clinic…</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" disabled={busy || !assignClinicId} onClick={assignClinic}>
                    Assign clinic
                  </Button>
                </div>
              </div>
            ) : null}

            {hasPlan ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Visit schedule</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sessions and notes from the physiotherapist — tap Reschedule to change a visit time.
                </p>
                <div className="mt-3">
                  <BookingSessionTimeline
                    booking={b}
                    sessionPayments={sessionPaymentMap}
                    notesViewer={{ enabled: true }}
                    reschedule={{
                      enabled: true,
                      includeComplimentary: true,
                      onReschedule: (row) => setRescheduleRow(row),
                    }}
                    adminSessions={{
                      enabled: true,
                      onDelete: handleDeleteSession,
                      canDelete: (row) => Boolean(row.sessionId),
                      deletingSessionId: sessionBusy,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {openStep === 'payment' && (
          <div className="space-y-4">
            {!planLive ? (
              <p className="text-sm text-slate-600">Opens after the plan goes live (patient consent).</p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Record cash or UPI. Outstanding:{' '}
                  <span className="font-semibold tabular-nums text-slate-900">
                    {outstanding > 0.009 ? `₹${outstanding.toFixed(0)}` : '₹0'}
                  </span>
                  . Cash you record waits under{' '}
                  <Link to="/manager/finance?tab=cash" className="font-semibold text-teal-700 underline">
                    Finance
                  </Link>{' '}
                  until admin settles — then your commission is withdrawable.
                </p>
                <InstallmentsCard
                  title="Collections"
                  subtitle=""
                  summary={paymentSummary}
                  payments={payments}
                  showSessionColumn
                  emptyMessage="No collections yet."
                >
                  {canCollect ? (
                    <Button type="button" disabled={busy} onClick={() => setCollectionModalOpen(true)}>
                      Record collection
                    </Button>
                  ) : null}
                </InstallmentsCard>
                {!canCollect && outstanding <= 0.009 && Number(paymentSummary?.totalPaid || 0) > 0 ? (
                  <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Fully paid. Check{' '}
                    <Link to="/manager/finance?tab=cash" className="font-semibold underline">
                      Finance
                    </Link>{' '}
                    for cash waiting on admin and your commission.
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>

      {rescheduleRow != null ? (
        <RescheduleModal
          key={rescheduleRow.key}
          booking={b}
          sessionRow={rescheduleRow}
          title="Reschedule session"
          patchReschedule={(body) => api.patch(`/manager/bookings/${b._id}/reschedule`, body)}
          onClose={() => setRescheduleRow(null)}
          onUpdated={load}
        />
      ) : null}

      <RecordCollectionModal
        open={collectionModalOpen}
        booking={b}
        summary={paymentSummary}
        payments={payments}
        apiPath={`/manager/bookings/${id}/collections`}
        onClose={() => setCollectionModalOpen(false)}
        onRecorded={onCollectionRecorded}
      />
    </div>
  )
}
