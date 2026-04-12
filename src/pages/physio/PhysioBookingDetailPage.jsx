import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  marketplacePaymentStatusLabel,
  paymentStatusLabel,
  sessionStatusLabel,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import HomePlanForm from '../../components/physio/HomePlanForm'
import RescheduleModal from '../../components/physio/RescheduleModal'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import SessionNotesEditor from '../../components/bookings/SessionNotesEditor'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const actionBtn =
  'cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

export default function PhysioBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [rescheduleRow, setRescheduleRow] = useState(null)
  const [collectModalOpen, setCollectModalOpen] = useState(false)

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

  const showCreatePlan = useMemo(() => {
    if (!booking) return false
    return (
      booking.serviceType === 'home' &&
      (booking.planStatus === 'requested' || booking.planStatus === 'rejected' || booking.planStatus == null)
    )
  }, [booking])

  const showMarkCollected = useMemo(() => {
    if (!booking) return false
    return (
      booking.serviceType === 'home' &&
      booking.homePlanPaymentMode === 'offline' &&
      booking.planStatus === 'approved' &&
      booking.payment?.status === 'pending'
    )
  }, [booking])

  const canMarkComplete = useMemo(() => {
    if (!booking || booking.sessionStatus === 'completed') return false
    const offline = booking.serviceType === 'home' && booking.homePlanPaymentMode === 'offline'
    if (offline) {
      return booking.payment?.status === 'verified' && booking.paymentStatus === 'held'
    }
    return booking.payment?.status === 'paid' && booking.paymentStatus === 'held'
  }, [booking])

  const showPlanPending = useMemo(() => {
    if (!booking) return false
    return booking.serviceType === 'home' && booking.planStatus === 'proposed'
  }, [booking])

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

  async function createPlan(bookingId, payload) {
    setBusyId(bookingId)
    try {
      await api.patch(`/bookings/${bookingId}/create-plan`, payload)
      toast.success('Plan submitted to patient')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create plan')
    } finally {
      setBusyId(null)
    }
  }

  async function collectOfflinePayment(bookingId) {
    setBusyId(bookingId)
    try {
      await api.patch(`/bookings/${bookingId}/collect-payment`)
      toast.success('Payment marked as collected — awaiting admin verification')
      setCollectModalOpen(false)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not update payment')
    } finally {
      setBusyId(null)
    }
  }

  const collectAmountLabel =
    booking?.totalAmount != null
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
          Number(booking.totalAmount),
        )
      : 'the agreed amount'

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-gray-100" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
        <p className="text-sm font-medium text-gray-800">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/physio/bookings')}>
          Back to bookings
        </Button>
      </div>
    )
  }

  const b = booking
  const busy = busyId === b._id

  return (
    <div className="space-y-6">
      <Link
        to="/physio/bookings"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to bookings
      </Link>

      <Card hover={false} className="p-5 sm:p-6">
        <h1 className="sr-only">Booking details</h1>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Visit</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              b.sessionStatus === 'completed'
                ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
                : 'bg-amber-50 text-amber-900 ring-amber-200'
            }`}
          >
            {sessionStatusLabel(b)}
          </span>
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Escrow: {paymentStatusLabel(b.paymentStatus)}
          </span>
          {b.payment?.status != null && (
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-200">
              Pay: {marketplacePaymentStatusLabel(b.payment.status)}
            </span>
          )}
        </div>
      </Card>

      <SessionProgressTracker booking={b} variant="full" />

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Participants</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Patient</p>
            <p className="mt-1 font-medium text-gray-900">{b.userId?.name ?? '—'}</p>
            <p className="mt-0.5 text-sm text-gray-600">{b.userId?.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">You</p>
            <p className="mt-1 font-medium text-gray-900">{b.physioId?.name ?? '—'}</p>
            {b.physioId?.phone && <p className="mt-0.5 text-sm text-gray-600">{b.physioId.phone}</p>}
            {b.physioId?.specialization && (
              <p className="mt-1 text-xs text-gray-500">{b.physioId.specialization}</p>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Issue</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-800">{b.issue}</p>
        </div>
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Session timeline</h2>
        <div className="mt-4">
          <BookingSessionTimeline
            booking={b}
            reschedule={{
              enabled: true,
              onReschedule: (row) => setRescheduleRow(row),
            }}
          />
        </div>
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Session notes</h2>
        <p className="mt-1 text-xs text-gray-500">Saved notes are visible to the patient (read-only).</p>
        <div className="mt-4">
          <SessionNotesEditor booking={b} onSaved={load} />
        </div>
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Plan details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sessions</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{b.sessions != null ? b.sessions : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Price / session</dt>
            <dd className="mt-0.5 font-medium text-gray-900">
              {b.amountPerSession != null ? `₹${b.amountPerSession}` : '—'}
            </dd>
          </div>
          {b.discountPercent != null && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Discount</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{b.discountPercent}%</dd>
            </div>
          )}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">
              {b.totalAmount != null ? `₹${b.totalAmount}` : '—'}
            </dd>
          </div>
        </dl>
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Mode</dt>
            <dd className="font-medium text-gray-900">
              {b.serviceType === 'home' && b.homePlanPaymentMode ? b.homePlanPaymentMode : b.serviceType === 'home' ? '—' : 'Online'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Escrow</dt>
            <dd className="font-medium text-gray-900">{paymentStatusLabel(b.paymentStatus)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Payment step</dt>
            <dd className="font-medium text-gray-900">{marketplacePaymentStatusLabel(b.payment?.status)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Amount</dt>
            <dd className="font-semibold text-gray-900">
              {b.totalAmount != null ? `₹${b.totalAmount}` : '—'}
            </dd>
          </div>
        </dl>
        {b.offlinePaymentRejectReason && b.payment?.status === 'pending' && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-950">
            <p className="font-medium">Admin note</p>
            <p className="mt-0.5 text-xs">{b.offlinePaymentRejectReason}</p>
          </div>
        )}
        {showMarkCollected && (
          <div className="mt-4 border-t border-amber-100 pt-4">
            <p className="text-sm font-medium text-amber-950">Collect cash / UPI from the patient, then confirm below.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCollectModalOpen(true)}
              className={`mt-3 ${actionBtn} bg-amber-600 text-white hover:bg-amber-700`}
            >
              Mark as cash collected
            </button>
          </div>
        )}
        {b.serviceType === 'home' &&
          b.homePlanPaymentMode === 'offline' &&
          b.payment?.status === 'collected' &&
          !b.offlinePaymentVerified && (
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-sm text-sky-950">
              Collected — waiting for admin to verify payment before you can complete the session.
            </div>
          )}
      </Card>

      {showPlanPending && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/90 px-5 py-4 text-sm text-blue-950">
          <p className="font-medium">Awaiting patient approval</p>
        </div>
      )}

      {showCreatePlan && (
        <Card hover={false} className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900">Create home plan</h2>
          <div className="mt-4">
            <HomePlanForm booking={b} busy={busy} onSubmit={(payload) => createPlan(b._id, payload)} />
          </div>
        </Card>
      )}

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Actions</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <button
            type="button"
            disabled={busy || b.sessionStatus === 'completed' || !canMarkComplete}
            onClick={() => completeSession(b._id)}
            title={
              !canMarkComplete && b.sessionStatus !== 'completed'
                ? 'Payment must be confirmed (online paid or offline verified by admin) and held in escrow'
                : undefined
            }
            className={`${actionBtn} w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto`}
          >
            {b.sessionStatus === 'completed' ? 'Completed' : 'Mark complete'}
          </button>
        </div>
      </Card>

      {rescheduleRow != null && (
        <RescheduleModal
          key={rescheduleRow.key}
          booking={b}
          sessionRow={rescheduleRow}
          patchReschedule={(body) => api.patch(`/bookings/${b._id}/reschedule`, body)}
          onClose={() => setRescheduleRow(null)}
          onUpdated={load}
        />
      )}

      {collectModalOpen && b && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Confirm collection</h3>
            <p className="mt-3 text-sm text-gray-700">
              Have you received <span className="font-semibold text-gray-900">{collectAmountLabel}</span> from the
              patient?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCollectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => collectOfflinePayment(b._id)}>
                {busy ? 'Saving…' : 'Yes, confirm'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
