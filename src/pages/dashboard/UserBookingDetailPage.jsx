import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  formatPaidAt,
  marketplacePaymentStatusLabel,
  paymentAmountLabel,
  paymentModeLabel,
  paymentStatusLabel,
  sessionStatusLabel,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import RaiseDisputeModal from '../../components/dashboard/RaiseDisputeModal'
import RazorpayPayButton from '../../components/RazorpayPayButton'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import SessionNotesReadOnly from '../../components/bookings/SessionNotesReadOnly'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ReviewSubmitModal from '../../components/reviews/ReviewSubmitModal'
import { StarRatingDisplay } from '../../components/reviews/StarRating'
import { bookingStatusBadge, paymentBadge } from './dashboardUtils'

const actionBtn =
  'cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

export default function UserBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/bookings/${id}`)
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

  async function approvePlan(bookingId) {
    try {
      await api.patch(`/bookings/${bookingId}/approve`)
      toast.success('Plan approved. You can now pay.')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not approve plan')
    }
  }

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

  const b = booking
  const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
  const pay = paymentBadge(b.paymentStatus)
  const paidLine = formatPaidAt(b)

  const showPay =
    b.paymentStatus === 'pending' &&
    (b.serviceType === 'online' || b.planStatus === 'approved') &&
    !(b.serviceType === 'home' && b.homePlanPaymentMode === 'offline')

  const showOfflineMsg =
    b.serviceType === 'home' &&
    b.homePlanPaymentMode === 'offline' &&
    b.planStatus === 'approved' &&
    b.payment?.status !== 'verified'

  const physioPublicId = b.physioId && typeof b.physioId === 'object' ? b.physioId._id : b.physioId
  const review = b.review

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/bookings"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to bookings
      </Link>

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Visit</p>
        <p className="mt-1 text-xl font-semibold text-ink">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
        {b.rescheduled && b.previousDate && (
          <p className="mt-2 text-xs text-amber-800">
            Rescheduled from {formatBookingDateAndSlot(b.previousDate, b.previousTimeSlot)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${st.cls}`}>{st.label}</span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pay.cls}`}>
            {pay.label}
          </span>
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Session: {sessionStatusLabel(b)}
          </span>
        </div>
      </Card>

      <SessionProgressTracker
        booking={b}
        variant="full"
        className="border-border-subtle bg-white ring-1 ring-border-subtle/80"
      />

      {(review?.canSubmit || review?.submitted) && (
        <Card hover={false} className="border-border-subtle p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Your feedback</h2>
          <p className="mt-1 text-xs text-ink-muted">Reviews help other patients choose the right physiotherapist.</p>
          {review.submitted ? (
            <div className="mt-4 rounded-xl border border-border-subtle/80 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">Your review</span>
                <StarRatingDisplay value={review.submitted.rating} size="sm" />
              </div>
              {review.submitted.comment ? (
                <p className="mt-3 text-sm leading-relaxed text-ink">{review.submitted.comment}</p>
              ) : null}
              <p className="mt-2 text-xs text-ink-muted">
                {review.submitted.createdAt
                  ? new Date(review.submitted.createdAt).toLocaleString()
                  : ''}
              </p>
              {physioPublicId && (
                <Link
                  to={`/physician/${String(physioPublicId)}`}
                  className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  View public profile & all reviews →
                </Link>
              )}
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
        <h2 className="text-sm font-semibold text-ink">Participants</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">You</p>
            <p className="mt-1 font-medium text-ink">{b.userId?.name ?? '—'}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{b.userId?.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Physiotherapist</p>
            <p className="mt-1 font-medium text-ink">{b.physioId?.name || 'Not assigned yet'}</p>
            {b.physioId?.phone && <p className="mt-0.5 text-sm text-ink-muted">{b.physioId.phone}</p>}
            {b.physioId?.specialization && (
              <p className="mt-1 text-xs text-ink-muted">{b.physioId.specialization}</p>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-border-subtle/80 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Issue</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{b.issue}</p>
        </div>
        <p className="mt-3 text-xs capitalize text-ink-muted">Service: {b.serviceType || 'home'}</p>
      </Card>

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Session timeline</h2>
        <div className="mt-4">
          <BookingSessionTimeline booking={b} />
        </div>
      </Card>

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Session notes</h2>
        <p className="mt-1 text-xs text-ink-muted">From your physiotherapist. Read-only.</p>
        <div className="mt-4">
          <SessionNotesReadOnly booking={b} />
        </div>
      </Card>

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Plan details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Sessions</dt>
            <dd className="mt-0.5 font-medium text-ink">{b.sessions != null ? b.sessions : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Price / session</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {b.amountPerSession != null ? `₹${b.amountPerSession}` : '—'}
            </dd>
          </div>
          {b.discountPercent != null && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Discount</dt>
              <dd className="mt-0.5 font-medium text-ink">{b.discountPercent}%</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Plan status</dt>
            <dd className="mt-0.5 capitalize text-ink">{b.planStatus || '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Payment</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Mode</dt>
            <dd className="font-medium text-ink">{paymentModeLabel(b)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Status</dt>
            <dd>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${pay.cls}`}>
                {pay.label}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-semibold tabular-nums text-ink">{paymentAmountLabel(b)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Escrow</dt>
            <dd className="text-ink">{paymentStatusLabel(b.paymentStatus)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment step</dt>
            <dd className="font-medium text-ink">{marketplacePaymentStatusLabel(b.payment?.status)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Paid at</dt>
            <dd className="text-ink">{paidLine || '—'}</dd>
          </div>
        </dl>
      </Card>

      {showOfflineMsg && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Offline payment</p>
          <p className="mt-1 text-xs text-amber-900/90">
            {b.payment?.status === 'collected'
              ? 'Your physiotherapist marked payment as collected. Our team will verify shortly — escrow updates once verified.'
              : 'Pay your physiotherapist as agreed (cash/UPI). They will mark payment as collected, then we verify before the session can be completed.'}
          </p>
        </div>
      )}

      {showPay && (
        <Card hover={false} className="border-border-subtle p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Pay online</h2>
          <p className="mt-1 text-xs text-ink-muted">Complete payment to confirm your booking.</p>
          <div className="mt-4">
            <RazorpayPayButton bookingId={b._id} onPaid={load} />
          </div>
        </Card>
      )}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Actions</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <button
            type="button"
            onClick={() => setDisputeOpen(true)}
            className={`${actionBtn} w-full border border-rose-200 bg-rose-50/90 text-rose-900 hover:border-rose-300 hover:bg-rose-50 sm:w-auto`}
          >
            Raise dispute
          </button>
          {b.serviceType === 'home' && b.planStatus === 'proposed' && (
            <button
              type="button"
              onClick={() => approvePlan(b._id)}
              className={`${actionBtn} w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto`}
            >
              Approve plan
            </button>
          )}
        </div>
      </Card>

      {disputeOpen && (
        <RaiseDisputeModal booking={b} onClose={() => setDisputeOpen(false)} onCreated={load} />
      )}

      <ReviewSubmitModal
        open={reviewOpen}
        bookingId={b._id}
        physioName={typeof b.physioId === 'object' ? b.physioId?.name : undefined}
        onClose={() => setReviewOpen(false)}
        onSubmitted={load}
      />
    </div>
  )
}
