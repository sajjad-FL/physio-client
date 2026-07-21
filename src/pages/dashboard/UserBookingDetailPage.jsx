import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import RaiseDisputeModal from '../../components/dashboard/RaiseDisputeModal'
import PayInstallmentModal from '../../components/payments/PayInstallmentModal'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import PendingBookingView from '../../components/bookings/patient/PendingBookingView'
import PlanProposedCard from '../../components/bookings/patient/PlanProposedCard'
import PatientSessionProgress from '../../components/bookings/patient/PatientSessionProgress'
import PatientPhysioCard from '../../components/bookings/patient/PatientPhysioCard'
import { PaymentsTabPanel } from '../../components/bookings/patient/BookingDetailSections'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import BookingWorkflowStepRail from '../../components/bookings/BookingWorkflowStepRail'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'
import ReviewSubmitModal from '../../components/reviews/ReviewSubmitModal'
import { StarRatingDisplay } from '../../components/reviews/StarRating'
import { normalizeSessionRows } from '../../components/physio/physioBookingHelpers'
import { isPlanLive, isAwaitingPatientConsent } from '../../utils/planStatus'
import { formatBookingDateAndSlot } from '../../utils/date'
import { formatBookingVisitWithCondition, billingTypeLabel, paymentAmountLabel, bookingCodeBadge } from '../../utils/bookingDisplay'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'
import {
  buildPatientWorkflowSteps,
  defaultPatientOpenStep,
  patientPageContext,
} from '../../utils/patientBookingWorkflow'
import { useReferralMyCode } from '../../hooks/useReferral'

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

export default function UserBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [sessionReviewTarget, setSessionReviewTarget] = useState(null)
  const [payInstallmentOpen, setPayInstallmentOpen] = useState(false)
  const [useWalletCredit, setUseWalletCredit] = useState(false)
  const [openStep, setOpenStep] = useState('team')
  const [stepReady, setStepReady] = useState(false)
  const [approving, setApproving] = useState(false)
  const [confirmingSessionId, setConfirmingSessionId] = useState(null)
  const { walletBalance, refresh: refreshWallet } = useReferralMyCode()

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [bookingRes, reviewsRes] = await Promise.all([
        api.get(`/bookings/${id}`),
        api.get(`/reviews/booking/${id}`).catch(() => ({ data: { data: [] } })),
      ])
      setBooking(bookingRes.data)
      setReviews(Array.isArray(reviewsRes.data?.data) ? reviewsRes.data.data : [])
    } catch (e) {
      const msg =
        e.response?.status === 404 ? 'Booking not found' : e.response?.data?.message || 'Failed to load'
      setError(msg)
      setBooking(null)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setStepReady(false)
    setOpenStep('team')
  }, [id])

  const pageCtx = useMemo(() => {
    const base = patientPageContext(booking)
    if (!base) return null
    const rows = normalizeSessionRows(base.b)
    const needsSessionConfirm = rows.some((r) => r.status === 'completed' && !r.patientConfirmed && !r.complimentary)
    return { ...base, rows, needsSessionConfirm }
  }, [booking])

  const steps = useMemo(() => {
    if (!pageCtx) return []
    return buildPatientWorkflowSteps(pageCtx)
  }, [pageCtx])

  useEffect(() => {
    if (!steps.length || stepReady) return
    setOpenStep(defaultPatientOpenStep(steps))
    setStepReady(true)
  }, [steps, stepReady])

  async function consentToPlan(bookingId) {
    setApproving(true)
    try {
      await api.post(`/bookings/${bookingId}/consent-plan`)
      toast.success('Plan is live. Your care team will proceed with next steps.')
      await load()
      setOpenStep('treatment')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not submit consent')
    } finally {
      setApproving(false)
    }
  }

  async function confirmSession(sessionId) {
    if (!booking?._id || !sessionId || confirmingSessionId) return
    setConfirmingSessionId(String(sessionId))
    try {
      await api.post(`/bookings/${booking._id}/sessions/${sessionId}/confirm`)
      toast.success('Session confirmed')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not confirm session')
    } finally {
      setConfirmingSessionId(null)
    }
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !pageCtx) {
    return (
      <Card hover={false} className="p-6">
        <p className="text-slate-600">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard/bookings')}>
          Back to bookings
        </Button>
      </Card>
    )
  }

  const planAwaitingConsent =
    pageCtx.b.serviceType === 'home' && isAwaitingPatientConsent(pageCtx.b.planStatus)
  const planLiveEarly =
    pageCtx.b.serviceType === 'home' && isPlanLive(pageCtx.b.planStatus)
  const clinicAwaitingFacility =
    pageCtx.b.serviceType === 'clinic' && !pageCtx.b.clinicId

  if (
    clinicAwaitingFacility ||
    ((pageCtx.b.status === 'pending' || pageCtx.b.status === 'assigned') &&
      !planAwaitingConsent &&
      !planLiveEarly &&
      pageCtx.b.serviceType !== 'clinic')
  ) {
    return <PendingBookingView booking={pageCtx.b} />
  }

  const {
    b,
    isOnline,
    planLive,
    awaitingConsent,
    assessmentDone,
    hasPhysio,
    hasPlan,
    paymentSummary,
    payments,
    outstanding,
    rows,
    needsSessionConfirm,
    workflowMeta,
  } = pageCtx

  const sessionsCount =
    paymentSummary?.sessionsCount || (Array.isArray(b.schedule) && b.schedule.length > 0 ? b.schedule.length : 1)
  const isOfflinePlan = b.serviceType === 'home' && b.homePlanPaymentMode === 'offline'
  const isOnlineBooking = b.serviceType === 'online' || (b.serviceType === 'home' && b.homePlanPaymentMode === 'online')
  const planReady = b.serviceType === 'online' || isPlanLive(b.planStatus)
  const showInstallments =
    planReady && (sessionsCount > 1 || isOnlineBooking) && (Number(b.totalAmount || 0) > 0 || payments.length > 0)
  const canPayInstallment = isOnlineBooking && planReady && outstanding > 0.009
  const showLegacyPay =
    !showInstallments &&
    b.paymentStatus === 'pending' &&
    planReady &&
    !(b.serviceType === 'home' && b.homePlanPaymentMode === 'offline')
  const showOfflineMsg =
    b.serviceType === 'home' &&
    b.homePlanPaymentMode === 'offline' &&
    isPlanLive(b.planStatus) &&
    b.payment?.status !== 'verified'

  const physioPublicId = b.physioId && typeof b.physioId === 'object' ? b.physioId._id : b.physioId
  const physioDisplayName = typeof b.physioId === 'object' ? b.physioId?.name : undefined
  const physio = typeof b.physioId === 'object' ? b.physioId : null
  const managerName = b.managerId && typeof b.managerId === 'object' ? b.managerId.name : null

  const overallReview = reviews.find((r) => !r.sessionId)
  const hasCompletedSession = rows.some((r) => r.status === 'completed')
  const reviewedSessionIds = new Set(
    reviews.filter((r) => r.sessionId).map((r) => String(r.sessionId)),
  )
  if (overallReview && !rows.some((r) => r.perSession)) {
    reviewedSessionIds.add('__primary__')
  }
  const ratingsBySessionId = Object.fromEntries(
    reviews.filter((r) => r.sessionId).map((r) => [String(r.sessionId), { rating: r.rating, comment: r.comment }]),
  )
  if (overallReview && !rows.some((r) => r.perSession)) {
    ratingsBySessionId.__primary__ = { rating: overallReview.rating, comment: overallReview.comment }
  }

  const sessionPaymentMap = buildSessionPaymentMap(b, payments, paymentSummary)
  const activeStepMeta = steps.find((s) => s.id === openStep)
  const stepColumns = isOnline || b.serviceType === 'clinic' ? 3 : 4

  function handlePaid() {
    load()
    refreshWallet()
  }

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-4">
      {/* Header — mirrors manager case detail */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <Link to="/dashboard/bookings" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          ← All bookings
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900">{b.issue || 'Your session'}</h1>
            {bookingCodeBadge(b) ? (
              <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{bookingCodeBadge(b)}</p>
            ) : null}
            <p className="mt-0.5 text-sm text-slate-600">
              {physioDisplayName ||
                (typeof b.clinicId === 'object' ? b.clinicId?.name : null) ||
                managerName ||
                (isOnline ? 'Online consultation' : b.serviceType === 'clinic' ? 'Clinic visit' : 'Home visit')}
            </p>
            <p className="mt-2 text-sm text-slate-500">{formatBookingVisitWithCondition(b)}</p>
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
          Your progress
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
            <p className="mt-1 text-sm text-blue-800">Action needed — review and consent to your care plan below.</p>
          ) : null}
        </div>

        {openStep === 'team' && (
          <div className="space-y-4">
            {isOnline ? (
              <p className="text-sm text-slate-600">
                Your online session is booked for{' '}
                <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span>.
                {hasPhysio ? ` ${physioDisplayName} will see you.` : ' We are confirming your physiotherapist.'}
              </p>
            ) : b.serviceType === 'clinic' ? (
              <p className="text-sm text-slate-600">
                Your clinic visit is scheduled for{' '}
                <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span>
                {typeof b.clinicId === 'object' && b.clinicId?.name ? (
                  <>
                    {' '}
                    at <span className="font-medium">{b.clinicId.name}</span>
                    {b.clinicId.address ? ` (${b.clinicId.address})` : ''}.
                  </>
                ) : (
                  '. Our team is confirming the facility.'
                )}
                {hasPhysio ? ` ${physioDisplayName} will treat you at the clinic.` : ''}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  {managerName ? (
                    <>
                      <span className="font-medium">{managerName}</span> is your care manager. The first home visit on{' '}
                      <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span> is a
                      complimentary assessment.
                    </>
                  ) : (
                    <>
                      Our team is assigning a care manager for your home visit on{' '}
                      <span className="font-medium">{formatBookingDateAndSlot(b.date, b.timeSlot)}</span>.
                    </>
                  )}
                </p>
                {assessmentDone ? (
                  <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Assessment completed — your care manager will prepare your treatment plan next.
                  </p>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    No action needed from you right now. We will notify you when your plan is ready to review.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {openStep === 'plan' && !isOnline && (
          <div className="space-y-4">
            {!assessmentDone && !hasPlan ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                Your care manager will create a plan after the home assessment visit.
              </p>
            ) : null}

            {awaitingConsent ? (
              <PlanProposedCard booking={b} onApprove={() => consentToPlan(b._id)} approving={approving} />
            ) : null}

            {planLive && !awaitingConsent ? (
              <>
                <p className="text-sm text-slate-600">You consented to this plan. Your care team is coordinating visits.</p>
                <PlanSummaryGrid b={b} />
              </>
            ) : null}
          </div>
        )}

        {openStep === 'treatment' && (
          <div className="space-y-4">
            {!planLive && !isOnline ? (
              <p className="text-sm text-slate-600">Treatment sessions begin after you consent to the care plan.</p>
            ) : null}

            {physio ? <PatientPhysioCard physio={physio} /> : null}

            <SessionProgressTracker
              booking={b}
              variant="full"
              className="border-slate-200 bg-slate-50/50 ring-1 ring-slate-100"
            />

            {needsSessionConfirm ? (
              <PatientSessionProgress
                rows={rows}
                confirmingSessionId={confirmingSessionId}
                onConfirm={confirmSession}
              />
            ) : null}

            {rows.length > 0 && (hasPlan || isOnline) ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {isOnline ? 'Your sessions' : 'Visit schedule'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isOnline
                    ? 'Session dates — tap View details for physio notes'
                    : 'Assessment and treatment — tap View notes on Assessment for care-manager notes'}
                </p>
                <div className="mt-3">
                  <BookingSessionTimeline
                    booking={b}
                    sessionPayments={sessionPaymentMap}
                    patientActions={{
                      enabled: true,
                      reviewedSessionIds,
                      ratingsBySessionId,
                      onRate: (row) =>
                        setSessionReviewTarget({
                          sessionId: row.sessionId,
                          label: row.complimentary
                            ? 'Assessment'
                            : row.n
                            ? `Session ${row.n}`
                            : formatBookingDateAndSlot(row.date, row.time),
                        }),
                    }}
                  />
                </div>
              </div>
            ) : null}

            {(overallReview || hasCompletedSession) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Your feedback</h3>
                {overallReview ? (
                  <div className="mt-3">
                    <StarRatingDisplay value={overallReview.rating} size="sm" />
                    {overallReview.comment ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{overallReview.comment}</p>
                    ) : null}
                    {physioPublicId ? (
                      <Link
                        to={`/physician/${String(physioPublicId)}`}
                        className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:text-teal-900"
                      >
                        View physio profile →
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">How was your session?</p>
                    <Button type="button" className="shrink-0 rounded-xl" onClick={() => setReviewOpen(true)}>
                      Rate session
                    </Button>
                  </div>
                )}
              </div>
            )}

            {b.sessionStatus !== 'completed' ? (
              <button
                type="button"
                onClick={() => setDisputeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Raise dispute
              </button>
            ) : null}
          </div>
        )}

        {openStep === 'payment' && (
          <PaymentsTabPanel
            booking={b}
            paymentSummary={paymentSummary}
            paymentsList={payments}
            sessionsCount={sessionsCount}
            isOfflinePlan={isOfflinePlan}
            isOnlineBooking={isOnlineBooking}
            outstanding={outstanding}
            planReady={planReady}
            showInstallments={showInstallments}
            canPayInstallment={canPayInstallment}
            showLegacyPay={showLegacyPay}
            showOfflineMsg={showOfflineMsg}
            useWalletCredit={useWalletCredit}
            setUseWalletCredit={setUseWalletCredit}
            walletBalance={walletBalance}
            onPayInstallment={() => setPayInstallmentOpen(true)}
            onPaid={handlePaid}
          />
        )}
      </div>

      {disputeOpen && (
        <RaiseDisputeModal booking={b} onClose={() => setDisputeOpen(false)} onCreated={load} />
      )}

      <ReviewSubmitModal
        open={reviewOpen}
        bookingId={b._id}
        physioName={physioDisplayName}
        onClose={() => setReviewOpen(false)}
        onSubmitted={load}
      />

      <ReviewSubmitModal
        open={sessionReviewTarget != null}
        bookingId={b._id}
        sessionId={sessionReviewTarget?.sessionId}
        sessionLabel={sessionReviewTarget?.label}
        physioName={physioDisplayName}
        onClose={() => setSessionReviewTarget(null)}
        onSubmitted={load}
      />

      <PayInstallmentModal
        open={payInstallmentOpen}
        booking={b}
        summary={paymentSummary}
        onClose={() => setPayInstallmentOpen(false)}
        onPaid={handlePaid}
        useWalletCredit={useWalletCredit}
        walletBalance={walletBalance}
      />
    </div>
  )
}
