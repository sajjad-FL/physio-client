import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  marketplacePaymentStatusLabel,
  paymentAmountLabel,
  paymentModeLabel,
  billingTypeLabel,
  paymentStatusLabel,
  bookingCodeBadge,
  resolveBookingUpcomingVisit,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import HomePlanForm from '../../components/physio/HomePlanForm'
import RescheduleModal from '../../components/physio/RescheduleModal'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import BookingWorkflowStepRail from '../../components/bookings/BookingWorkflowStepRail'
import SessionNotesModal from '../../components/bookings/SessionNotesModal'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import InstallmentsCard from '../../components/payments/InstallmentsCard'
import RecordCollectionModal from '../../components/payments/RecordCollectionModal'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'
import { openGoogleMapsDestination } from '../../utils/googleMaps'
import { isPlanLive } from '../../utils/planStatus'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'
import {
  buildPhysioWorkflowSteps,
  defaultPhysioOpenStep,
  physioPageContext,
} from '../../utils/physioBookingWorkflow'

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

function PlanSummaryGrid({ b }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-slate-50/80 p-4 text-sm sm:gap-4">
      <div className="min-w-0">
        <dt className="text-slate-500">Sessions</dt>
        <dd className="mt-0.5 font-semibold text-slate-900">{b.sessions ?? '—'}</dd>
      </div>
      {b.amountPerSession != null ? (
        <div className="min-w-0">
          <dt className="text-slate-500">Per session</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">₹{Number(b.amountPerSession).toFixed(0)}</dd>
        </div>
      ) : null}
      {b.discountPercent != null && b.discountPercent > 0 ? (
        <div className="min-w-0">
          <dt className="text-slate-500">Discount</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{b.discountPercent}%</dd>
        </div>
      ) : null}
      <div className="min-w-0">
        <dt className="text-slate-500">Total</dt>
        <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{paymentAmountLabel(b)}</dd>
      </div>
      {billingTypeLabel(b) ? (
        <div className="min-w-0 col-span-2 sm:col-span-1">
          <dt className="text-slate-500">Payment type</dt>
          <dd className="mt-0.5 font-semibold text-slate-900">{billingTypeLabel(b)}</dd>
        </div>
      ) : null}
    </dl>
  )
}

export default function PhysioBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [rescheduleRow, setRescheduleRow] = useState(null)
  const [busySessionKey, setBusySessionKey] = useState(null)
  const [noShowRow, setNoShowRow] = useState(null)
  const [noShowReason, setNoShowReason] = useState('')
  const [recordCollectionOpen, setRecordCollectionOpen] = useState(false)
  const [notesRow, setNotesRow] = useState(null)
  const [openStep, setOpenStep] = useState('patient')
  const [stepReady, setStepReady] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/physio/bookings/${id}`)
      setBooking(res.data)
    } catch (e) {
      const msg =
        e.response?.status === 404 ? 'Booking not found' : e.response?.data?.message || 'Failed to load'
      setError(msg)
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
    setOpenStep('patient')
  }, [id])

  const pageCtx = useMemo(() => {
    if (!booking) return null
    const sessionsCount =
      booking.paymentSummary?.sessionsCount ||
      (Array.isArray(booking.schedule) && booking.schedule.length > 0 ? booking.schedule.length : 1)
    const unlockedSessions = Number(
      booking.paymentSummary?.unlockedSessions ?? booking.paymentSummary?.coveredSessions ?? 0,
    )
    const isOfflinePlan = booking.serviceType === 'home' && booking.homePlanPaymentMode === 'offline'
    const isHomeCare = booking.serviceType === 'home'
    const paymentGateSkipped = Boolean(booking.managerId || isHomeCare)
    const showInstallments =
      isPlanLive(booking.planStatus) ||
      booking.serviceType === 'online' ||
      (Array.isArray(booking.payments) && booking.payments.length > 0)

    let paymentBlockReason = ''
    if (!paymentGateSkipped) {
      const ps = booking.paymentSummary
      if (!ps && booking.paymentStatus !== 'held') {
        paymentBlockReason = 'Payment must be secured before completion'
      } else if (ps && unlockedSessions <= 0) {
        paymentBlockReason = 'Collect at least one installment before completing any session.'
      }
    }

    return physioPageContext(booking, {
      sessionsCount,
      unlockedSessions,
      isOfflinePlan,
      paymentGateSkipped,
      paymentBlockReason,
      showInstallments,
      canMarkComplete: booking.sessionStatus !== 'completed' && !paymentBlockReason,
      sessionPaymentMap: buildSessionPaymentMap(
        booking,
        Array.isArray(booking.payments) ? booking.payments : [],
        booking.paymentSummary,
      ),
    })
  }, [booking])

  const steps = useMemo(() => (pageCtx ? buildPhysioWorkflowSteps(pageCtx) : []), [pageCtx])

  useEffect(() => {
    if (!steps.length || stepReady) return
    setOpenStep(defaultPhysioOpenStep(steps))
    setStepReady(true)
  }, [steps, stepReady])

  async function completeSession(bookingId) {
    setBusyId(bookingId)
    try {
      await api.post(`/physio/sessions/${bookingId}/complete`)
      toast.success('Session marked complete')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setBusyId(null)
    }
  }

  async function completeOneSession(row) {
    if (!booking || !row?.sessionId) return
    setBusySessionKey(String(row.sessionId))
    try {
      await api.post(`/physio/sessions/${booking._id}/${row.sessionId}/complete`)
      toast.success(`Session #${row.n} marked complete`)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setBusySessionKey(null)
    }
  }

  async function submitNoShow() {
    if (!booking || !noShowRow?.sessionId) return
    setBusySessionKey(String(noShowRow.sessionId))
    try {
      await api.post(`/physio/sessions/${booking._id}/${noShowRow.sessionId}/no-show`, {
        reason: noShowReason.trim(),
      })
      toast.success(`Session #${noShowRow.n} marked as no-show`)
      setNoShowRow(null)
      setNoShowReason('')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setBusySessionKey(null)
    }
  }

  async function createPlan(bookingId, payload) {
    setBusyId(bookingId)
    try {
      await api.patch(`/bookings/${bookingId}/create-plan`, payload)
      toast.success('Plan submitted to patient')
      await load()
      setOpenStep('sessions')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create plan')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !pageCtx) {
    return (
      <Card hover={false} className="p-6">
        <p className="text-slate-600">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/physio/bookings')}>
          Back to bookings
        </Button>
      </Card>
    )
  }

  const {
    b,
    isOnline,
    planLive,
    hasSchedulePlan,
    showCreatePlan,
    showPlanPending,
    paymentSummary,
    payments,
    outstanding,
    sessionsCount,
    unlockedSessions,
    isOfflinePlan,
    paymentGateSkipped,
    paymentBlockReason,
    showInstallments,
    canMarkComplete,
    sessionPaymentMap,
    workflowMeta,
  } = pageCtx

  const busy = busyId === b._id
  const canStartNavigation = Boolean(b.userId?.coordinates || String(b.userId?.location || '').trim())
  const activeStepMeta = steps.find((s) => s.id === openStep)
  const stepColumns = isOnline ? 3 : 4
  const upcomingVisit = resolveBookingUpcomingVisit(b)

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-4">
      {/* Header — mirrors manager / patient case detail */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <Link to="/physio/bookings" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          ← All bookings
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900">{b.userId?.name || 'Patient'}</h1>
            {bookingCodeBadge(b) ? (
              <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{bookingCodeBadge(b)}</p>
            ) : null}
            <p className="mt-0.5 text-sm text-slate-600">{b.issue || '—'}</p>
            <p className="mt-2 text-sm text-slate-500">
              {formatBookingDateAndSlot(upcomingVisit.date || b.date, upcomingVisit.time || b.timeSlot)}
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

      {/* Checklist */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:p-3 md:p-4">
        <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3">
          Your checklist
        </p>
        <BookingWorkflowStepRail
          steps={steps}
          openStep={openStep}
          onSelect={setOpenStep}
          columns={stepColumns}
        />
      </div>

      {/* Active step panel */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Step {activeStepMeta?.num || 1} of {steps.length}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{activeStepMeta?.label}</h2>
          {activeStepMeta?.state === 'waiting' ? (
            <p className="mt-1 text-sm text-blue-800">Waiting on the patient to approve the care plan.</p>
          ) : null}
        </div>

        {openStep === 'patient' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{b.userId?.name ?? '—'}</p>
              <p className="mt-0.5 text-sm text-slate-600">{b.userId?.phone ?? '—'}</p>
              {b.userId?.location ? (
                <p className="mt-2 text-sm text-slate-600">{b.userId.location}</p>
              ) : null}
              {b.serviceType === 'home' ? (
                <button
                  type="button"
                  onClick={() =>
                    openGoogleMapsDestination({
                      coordinates: b.userId?.coordinates,
                      address: b.userId?.location,
                    })
                  }
                  disabled={!canStartNavigation}
                  title={canStartNavigation ? 'Start navigation' : 'Address not available'}
                  className="mt-3 inline-flex items-center rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start navigation
                </button>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{b.issue || '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                {b.serviceType === 'online' ? 'Online' : 'Home visit'}
              </span>
              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                Hold: {paymentStatusLabel(b.paymentStatus)}
              </span>
            </div>
          </div>
        )}

        {openStep === 'plan' && !isOnline && (
          <div className="space-y-4">
            {showPlanPending ? (
              <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-950">
                Plan sent — waiting for the patient to consent before sessions can proceed.
              </p>
            ) : null}

            {showCreatePlan ? (
              <HomePlanForm booking={b} busy={busy} onSubmit={(payload) => createPlan(b._id, payload)} embedded />
            ) : null}

            {planLive && !showCreatePlan ? (
              <>
                <p className="text-sm text-slate-600">Active care plan for this patient.</p>
                <PlanSummaryGrid b={b} />
              </>
            ) : null}

            {!planLive && !showCreatePlan && !showPlanPending ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {b.managerId
                  ? 'Care manager will prepare the plan after assessment.'
                  : 'Create a home plan when you are ready to propose sessions and pricing.'}
              </p>
            ) : null}
          </div>
        )}

        {openStep === 'sessions' && (
          <div className="space-y-4">
            {!planLive && !isOnline && !hasSchedulePlan ? (
              <p className="text-sm text-slate-600">Sessions open after the care plan is live.</p>
            ) : null}

            <SessionProgressTracker
              booking={b}
              variant="full"
              className="border-slate-200 bg-slate-50/50 ring-1 ring-slate-100"
            />

            {paymentSummary && !paymentGateSkipped && unlockedSessions < sessionsCount ? (
              <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-950">
                {unlockedSessions === 0
                  ? 'Collect at least one installment to unlock session #1.'
                  : `You can mark up to session #${unlockedSessions} of ${sessionsCount}. Collect the next installment to open more.`}
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Visit schedule</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Mark complete, log progress each visit, or reschedule. Assessment baseline shows on the complementary visit.
                </p>
              <div className="mt-3">
                <BookingSessionTimeline
                  booking={b}
                  sessionPayments={sessionPaymentMap}
                  reschedule={{
                    enabled: true,
                    onReschedule: (row) => setRescheduleRow({ ...row }),
                  }}
                  physioActions={{
                    enabled: true,
                    canAct: true,
                    blockedReason: paymentBlockReason,
                    busySessionId: busySessionKey,
                    rowBlockedReason: (row) => {
                      if (paymentGateSkipped) return ''
                      if (!paymentSummary) return ''
                      const ordinal = row?.perSession ? Number(row.n || 0) : 1
                      if (ordinal <= 0) return ''
                      if (ordinal > unlockedSessions) {
                        return unlockedSessions === 0
                          ? `Session #${ordinal} is locked. Collect at least one installment to open it.`
                          : `Session #${ordinal} is locked. Currently unlocked: up to #${unlockedSessions} of ${sessionsCount}.`
                      }
                      return ''
                    },
                    onComplete: (row) => {
                      if (paymentBlockReason) {
                        toast.error(paymentBlockReason)
                        return
                      }
                      if (row.perSession) completeOneSession(row)
                      else completeSession(b._id)
                    },
                    onNoShow: (row) => {
                      if (paymentBlockReason) {
                        toast.error(paymentBlockReason)
                        return
                      }
                      if (row.perSession) {
                        setNoShowReason('')
                        setNoShowRow(row)
                      }
                    },
                    onNotes: (row) => setNotesRow(row),
                  }}
                />
              </div>
            </div>

            {!hasSchedulePlan && b.sessionStatus !== 'completed' ? (
              <Button
                type="button"
                disabled={busy || !canMarkComplete}
                title={!canMarkComplete ? paymentBlockReason : undefined}
                onClick={() => completeSession(b._id)}
              >
                {busy ? 'Saving…' : 'Mark visit complete'}
              </Button>
            ) : null}
          </div>
        )}

        {openStep === 'payment' && (
          <div className="space-y-4">
            {!planLive && !isOnline ? (
              <p className="text-sm text-slate-600">Payment details appear after the plan goes live.</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm">
                  <div className="min-w-0">
                    <dt className="text-slate-500">Mode</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{paymentModeLabel(b)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">{paymentAmountLabel(b)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500">Hold</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{paymentStatusLabel(b.paymentStatus)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {marketplacePaymentStatusLabel(b.payment?.status)}
                    </dd>
                  </div>
                  {outstanding > 0.009 ? (
                    <div className="min-w-0 col-span-2">
                      <dt className="text-slate-500">Outstanding</dt>
                      <dd className="mt-0.5 text-base font-semibold tabular-nums text-rose-700">
                        ₹{outstanding.toFixed(0)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {b.offlinePaymentRejectReason && b.payment?.status === 'pending' ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-950">
                    <p className="font-medium">Admin note</p>
                    <p className="mt-0.5 text-xs">{b.offlinePaymentRejectReason}</p>
                  </div>
                ) : null}

                {showInstallments ? (
                  <InstallmentsCard
                    title={isOfflinePlan ? 'Collections' : 'Installments'}
                    subtitle={
                      isOfflinePlan
                        ? 'Record each cash/UPI hand-off from the patient.'
                        : 'Patient pays online per installment.'
                    }
                    summary={paymentSummary}
                    payments={payments}
                    emptyMessage={
                      isOfflinePlan ? 'No collections recorded yet.' : 'No online installments yet.'
                    }
                  >
                    {isOfflinePlan && outstanding > 0.009 && planLive && !b.managerId ? (
                      <Button type="button" onClick={() => setRecordCollectionOpen(true)}>
                        Record collection
                      </Button>
                    ) : null}
                  </InstallmentsCard>
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
          requireUniqueDate
          patchReschedule={(body) => api.patch(`/bookings/${b._id}/reschedule`, body)}
          onClose={() => setRescheduleRow(null)}
          onUpdated={load}
        />
      ) : null}

      {noShowRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-slate-900">Mark session as no-show</h3>
            <p className="mt-2 text-sm text-slate-700">
              Session #{noShowRow.n} · {formatBookingDateAndSlot(noShowRow.date, noShowRow.time)}
            </p>
            <label htmlFor="no-show-reason" className="mt-4 block text-sm font-medium text-slate-800">
              Reason (optional)
            </label>
            <textarea
              id="no-show-reason"
              rows={3}
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. Patient was not at home; could not reach by phone."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setNoShowRow(null)
                  setNoShowReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busySessionKey != null}
                onClick={submitNoShow}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {busySessionKey != null ? 'Saving…' : 'Mark no-show'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <RecordCollectionModal
        open={recordCollectionOpen}
        booking={b}
        summary={paymentSummary}
        onClose={() => setRecordCollectionOpen(false)}
        onRecorded={load}
      />

      <SessionNotesModal
        open={notesRow != null}
        row={notesRow}
        booking={b}
        onClose={() => setNotesRow(null)}
        onSaved={load}
      />
    </div>
  )
}
