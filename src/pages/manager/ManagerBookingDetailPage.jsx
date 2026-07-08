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
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'
import { billingTypeLabel, paymentAmountLabel } from '../../utils/bookingDisplay'
import { managerWorkflowMeta } from '../../utils/managerWorkflow'

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
  } = ctx
  const totalPaid = Number(paymentSummary?.totalPaid || 0)

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
  return (
    <ol className="grid grid-cols-4 gap-1 sm:gap-2">
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
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [rescheduleRow, setRescheduleRow] = useState(null)
  const [sessionBusy, setSessionBusy] = useState(null)
  const [openStep, setOpenStep] = useState('assessment')
  const [stepReady, setStepReady] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [bRes, pRes] = await Promise.all([
        api.get(`/manager/bookings/${id}`),
        api.get('/manager/physios', { params: { bookingId: id } }),
      ])
      setBooking(bRes.data)
      setAssessmentNotes(bRes.data?.assessmentNotes || '')
      setPhysios(pRes.data?.physios || [])
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
    const planLive = b.planStatus === 'live' || b.planStatus === 'approved'
    const awaitingConsent = b.planStatus === 'awaiting_consent' || b.planStatus === 'proposed'
    const assessmentDone = Boolean(b.assessmentCompletedAt)
    const canCreatePlan = !awaitingConsent && !planLive && assessmentDone
    const needsAssessment = !awaitingConsent && !planLive && !assessmentDone
    const paymentSummary = b.paymentSummary || null
    const payments = b.payments || []
    const outstanding = Number(paymentSummary?.outstanding || 0)
    const canCollect = planLive && outstanding > 0.009
    const hasPlan = !canCreatePlan && !needsAssessment
    const hasPhysio = Boolean(b.physioId)
    const workflowMeta = managerWorkflowMeta({ ...b, paymentSummary })

    return {
      b,
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

  const selectedPhysioForAssign = useMemo(
    () => physios.find((p) => String(p._id) === String(assignPhysioId)),
    [physios, assignPhysioId],
  )

  async function saveAssessment() {
    setBusy(true)
    try {
      const res = await api.patch(`/manager/bookings/${id}/assessment`, { assessmentNotes })
      setBooking(res.data)
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

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
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
            <p className="mt-0.5 text-sm text-slate-600">{b.issue}</p>
            <p className="mt-2 text-sm text-slate-500">
              {formatBookingDateAndSlot(b.date, b.timeSlot)}
              {b.userId?.location ? ` · ${b.userId.location}` : ''}
            </p>
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

      {/* 4-step workflow — tap a step to open it */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:p-3 md:p-4">
        <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3">Your checklist</p>
        <StepRail steps={steps} openStep={openStep} onSelect={setOpenStep} />
      </div>

      {/* One panel — only the selected step */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Step {activeStepMeta?.num || 1} of 4
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{activeStepMeta?.label}</h2>
          {activeStepMeta?.state === 'waiting' ? (
            <p className="mt-1 text-sm text-blue-800">Waiting on the patient — you can still edit the plan below.</p>
          ) : null}
        </div>

        {openStep === 'assessment' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Visit on <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span> is
              complimentary. Save your notes, then move to step 2.
            </p>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              rows={5}
              value={assessmentNotes}
              onChange={(e) => setAssessmentNotes(e.target.value)}
              placeholder="Findings, mobility, recommended sessions…"
            />
            <Button type="button" disabled={busy} onClick={saveAssessment}>
              {pageCtx.assessmentDone ? 'Save changes' : 'Save & continue'}
            </Button>
          </div>
        )}

        {openStep === 'plan' && (
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
            {!planLive && !hasPhysio ? (
              <p className="text-sm text-slate-600">Available after the patient consents to the care plan (step 2).</p>
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
                    Fully paid. See{' '}
                    <Link to="/manager/ledger" className="font-semibold underline">
                      Finance → Collections
                    </Link>{' '}
                    for settlement status.
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>

      {/* Visit schedule — always visible once a plan exists */}
      {hasPlan ? (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
          <h3 className="text-base font-semibold text-slate-900">Visit schedule</h3>
          <p className="mt-1 text-sm text-slate-500">Complimentary assessment + treatment sessions.</p>
          <div className="mt-4">
            <BookingSessionTimeline
              booking={b}
              sessionPayments={sessionPaymentMap}
              reschedule={{
                enabled: true,
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
