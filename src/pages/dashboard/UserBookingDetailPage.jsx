import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import RaiseDisputeModal from '../../components/dashboard/RaiseDisputeModal'
import PayInstallmentModal from '../../components/payments/PayInstallmentModal'
import SessionNotesReadOnly from '../../components/bookings/SessionNotesReadOnly'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import PendingBookingView from '../../components/bookings/patient/PendingBookingView'
import BookingDetailTabBar from '../../components/bookings/patient/BookingDetailTabBar'
import PlanProposedCard from '../../components/bookings/patient/PlanProposedCard'
import PatientSessionProgress from '../../components/bookings/patient/PatientSessionProgress'
import BookingDetailHeader, { PaymentsTabPanel } from '../../components/bookings/patient/BookingDetailSections'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ReviewSubmitModal from '../../components/reviews/ReviewSubmitModal'
import { StarRatingDisplay } from '../../components/reviews/StarRating'
import { normalizeSessionRows } from '../../components/physio/physioBookingHelpers'
import { isPlanLive, isAwaitingPatientConsent } from '../../utils/planStatus'
import { useReferralMyCode } from '../../hooks/useReferral'

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
  const [activeTab, setActiveTab] = useState('overview')
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

  async function consentToPlan(bookingId) {
    setApproving(true)
    try {
      await api.post(`/bookings/${bookingId}/consent-plan`)
      toast.success('Plan is live. Your care team will proceed with next steps.')
      await load()
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

  const planAwaitingConsent =
    booking?.serviceType === 'home' && isAwaitingPatientConsent(booking?.planStatus)
  const planLive = booking?.serviceType === 'home' && isPlanLive(booking?.planStatus)
  const rows = booking ? normalizeSessionRows(booking) : []
  const overallReview = reviews.find((r) => !r.sessionId)
  const hasCompletedSession = rows.some((r) => r.status === 'completed')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-border-subtle/80" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-gray-50/80 px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard/bookings')}>
          Back to bookings
        </Button>
      </div>
    )
  }

  if ((booking.status === 'pending' || booking.status === 'assigned') && !planAwaitingConsent && !planLive) {
    return <PendingBookingView booking={booking} />
  }

  const b = booking
  const paymentSummary = b.paymentSummary || null
  const paymentsList = Array.isArray(b.payments) ? b.payments : []
  const sessionsCount =
    paymentSummary?.sessionsCount || (Array.isArray(b.schedule) && b.schedule.length > 0 ? b.schedule.length : 1)
  const isOfflinePlan = b.serviceType === 'home' && b.homePlanPaymentMode === 'offline'
  const isOnlineBooking = b.serviceType === 'online' || (b.serviceType === 'home' && b.homePlanPaymentMode === 'online')
  const outstanding = Number(paymentSummary?.outstanding || 0)
  const planReady = b.serviceType === 'online' || isPlanLive(b.planStatus)
  const showInstallments =
    planReady && (sessionsCount > 1 || isOnlineBooking) && (Number(b.totalAmount || 0) > 0 || paymentsList.length > 0)
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

  const tabBadges = {
    overview: planAwaitingConsent,
    payments:
      b.paymentStatus === 'pending' &&
      planReady &&
      !(b.serviceType === 'home' && b.homePlanPaymentMode === 'offline'),
  }

  function handlePaid() {
    load()
    refreshWallet()
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/bookings"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to bookings
      </Link>

      <BookingDetailHeader booking={b} onRaiseDispute={() => setDisputeOpen(true)} />

      <BookingDetailTabBar activeTab={activeTab} onChange={setActiveTab} badges={tabBadges} />

      {activeTab === 'overview' ? (
        <div className="space-y-5">
          {planAwaitingConsent ? (
            <PlanProposedCard booking={b} onApprove={() => consentToPlan(b._id)} approving={approving} />
          ) : null}

          <SessionProgressTracker
            booking={b}
            variant="full"
            className="border-border-subtle bg-white ring-1 ring-border-subtle/80"
          />

          <PatientSessionProgress
            rows={rows}
            confirmingSessionId={confirmingSessionId}
            onConfirm={confirmSession}
          />

          {(overallReview || hasCompletedSession) && (
            <Card hover={false} className="border-border-subtle p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">Your feedback</h2>
              <p className="mt-1 text-xs text-ink-muted">Reviews help other patients choose the right physiotherapist.</p>
              {overallReview ? (
                <div className="mt-4 rounded-xl border border-border-subtle/80 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRatingDisplay value={overallReview.rating} size="sm" />
                    <span className="text-sm text-slate-600">{overallReview.rating}/5</span>
                  </div>
                  {overallReview.comment ? (
                    <p className="mt-3 text-sm leading-relaxed text-ink">{overallReview.comment}</p>
                  ) : null}
                  {physioPublicId ? (
                    <Link
                      to={`/physician/${String(physioPublicId)}`}
                      className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View public profile & all reviews →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink">How was your completed session? Share a quick rating.</p>
                  <Button type="button" className="shrink-0 rounded-xl" onClick={() => setReviewOpen(true)}>
                    Rate your session
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card hover={false} className="border-border-subtle p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-ink">Issue &amp; notes</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">{b.issue || '—'}</p>
            <p className="mt-3 text-xs capitalize text-ink-muted">Service: {b.serviceType || 'home'}</p>
            <div className="mt-4 border-t border-border-subtle/80 pt-4">
              <SessionNotesReadOnly booking={b} />
            </div>
          </Card>
        </div>
      ) : (
        <PaymentsTabPanel
          booking={b}
          paymentSummary={paymentSummary}
          paymentsList={paymentsList}
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
