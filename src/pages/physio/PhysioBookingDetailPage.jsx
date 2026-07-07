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
  sessionStatusLabel,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import HomePlanForm from '../../components/physio/HomePlanForm'
import RescheduleModal from '../../components/physio/RescheduleModal'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import SessionNotesEditor from '../../components/bookings/SessionNotesEditor'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import InstallmentsCard from '../../components/payments/InstallmentsCard'
import RecordCollectionModal from '../../components/payments/RecordCollectionModal'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { isPlanLive } from '../../utils/planStatus'

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
  const [busySessionKey, setBusySessionKey] = useState(null)
  const [noShowRow, setNoShowRow] = useState(null)
  const [noShowReason, setNoShowReason] = useState('')
  const [recordCollectionOpen, setRecordCollectionOpen] = useState(false)

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
    if (booking.managerId) return false
    return (
      booking.serviceType === 'home' &&
      (booking.planStatus === 'requested' || booking.planStatus === 'rejected' || booking.planStatus == null)
    )
  }, [booking])

  const hasSchedulePlan = useMemo(
    () => Array.isArray(booking?.schedule) && booking.schedule.length > 0,
    [booking],
  )

  const paymentSummary = booking?.paymentSummary || null
  const paymentsList = useMemo(
    () => (Array.isArray(booking?.payments) ? booking.payments : []),
    [booking],
  )

  const sessionsCount = paymentSummary?.sessionsCount || (hasSchedulePlan ? booking.schedule.length : 1)
  const unlockedSessions = Number(
    paymentSummary?.unlockedSessions ?? paymentSummary?.coveredSessions ?? 0,
  )
  const isOfflinePlan =
    booking?.serviceType === 'home' && booking?.homePlanPaymentMode === 'offline'
  const outstanding = Number(paymentSummary?.outstanding || 0)
  const showInstallments =
    isPlanLive(booking?.planStatus) ||
    booking?.serviceType === 'online' ||
    paymentsList.length > 0

  /**
   * Booking-level block reason. With the percentage-based unlock rule, only
   * the extreme "nothing unlocked" case (e.g. N=1 unpaid) blocks at booking
   * level; per-row gating handles partial coverage.
   */
  const isHomeCare = booking?.serviceType === 'home'
  const paymentGateSkipped = Boolean(booking?.managerId || isHomeCare)

  const paymentBlockReason = useMemo(() => {
    if (!booking) return 'Booking not loaded'
    if (paymentGateSkipped) return ''
    if (!paymentSummary) {
      if (booking.paymentStatus !== 'held') return 'Payment must be secured before completion'
      return ''
    }
    if (unlockedSessions <= 0) {
      return 'Collect at least one installment before completing any session.'
    }
    return ''
  }, [booking, paymentSummary, unlockedSessions])

  const canMarkComplete = useMemo(() => {
    if (!booking || booking.sessionStatus === 'completed') return false
    return !paymentBlockReason
  }, [booking, paymentBlockReason])

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

  async function completeOneSession(row) {
    if (!booking || !row?.sessionId) return
    const key = String(row.sessionId)
    setBusySessionKey(key)
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
    const key = String(noShowRow.sessionId)
    setBusySessionKey(key)
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create plan')
    } finally {
      setBusyId(null)
    }
  }

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
  const canStartNavigation = Boolean(b.userId?.coordinates || String(b.userId?.location || '').trim())

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
        <p className="type-page-title mt-1 text-gray-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
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
            Payment hold: {paymentStatusLabel(b.paymentStatus)}
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
              className="mt-2 inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start
            </button>
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

      {showInstallments && (
        <InstallmentsCard
          title={isOfflinePlan ? 'Collections' : 'Installments'}
          subtitle={
            isOfflinePlan
              ? 'Record each cash/UPI hand-off. Admin verifies before it unlocks a session.'
              : 'Patient pays online per installment. Each verified payment unlocks the next session.'
          }
          summary={paymentSummary}
          payments={paymentsList}
          emptyMessage={
            isOfflinePlan
              ? 'No collections recorded yet. Record the first one after the patient pays you.'
              : 'No online installments yet.'
          }
        >
          {isOfflinePlan && outstanding > 0.009 && isPlanLive(b.planStatus) && !b.managerId ? (
            <Button type="button" onClick={() => setRecordCollectionOpen(true)}>
              Record collection
            </Button>
          ) : null}
        </InstallmentsCard>
      )}

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Session timeline</h2>
        <p className="mt-1 text-xs text-gray-500">
          Mark each session complete after you finish the visit. No-show is for sessions the patient
          missed.
        </p>
        {paymentSummary && !paymentGateSkipped && unlockedSessions < sessionsCount && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-950">
            {unlockedSessions === 0
              ? `Collect at least one installment to unlock session #1.`
              : `You can mark up to session #${unlockedSessions} of ${sessionsCount}. Collect the next installment to open more.`}
          </div>
        )}
        <div className="mt-4">
          <BookingSessionTimeline
            booking={b}
            reschedule={{
              enabled: true,
              onReschedule: (row) => setRescheduleRow(row),
            }}
            physioActions={{
              enabled: true,
              /**
               * Keep actions visible for all rows; rowBlockedReason enforces
               * coverage gate per session number so already-covered sessions
               * remain actionable (e.g. 2/5 paid allows #1 and #2).
               */
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
                    : `Session #${ordinal} is locked. Currently unlocked: up to #${unlockedSessions} of ${sessionsCount}. Collect the next installment to open more.`
                }
                return ''
              },
              onComplete: (row) => {
                if (paymentBlockReason) {
                  toast.error(paymentBlockReason)
                  return
                }
                if (row.perSession) {
                  completeOneSession(row)
                } else {
                  completeSession(b._id)
                }
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
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Plan status</dt>
            <dd className="mt-0.5 capitalize text-gray-900">{b.planStatus || '—'}</dd>
          </div>
          {b.discountPercent != null && b.discountPercent > 0 && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Discount</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{b.discountPercent}%</dd>
            </div>
          )}
          {billingTypeLabel(b) ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment type</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{billingTypeLabel(b)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Total</dt>
            <dd className="mt-0.5 font-semibold text-gray-900">{paymentAmountLabel(b)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Distance at assign</dt>
            <dd className="mt-0.5 font-medium text-gray-900">
              {b.distanceKmAtAssign != null
                ? `${Number(b.distanceKmAtAssign) < 10 ? Number(b.distanceKmAtAssign).toFixed(1) : Math.round(Number(b.distanceKmAtAssign))} km`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Distance surcharge</dt>
            <dd className="mt-0.5 font-medium text-gray-900">
              ₹{Number(b.distanceSurchargeAmount || 0).toFixed(2)}
              {Number(b.distanceExtraKm || 0) > 0 && Number(b.distanceSurchargePerKm || 0) > 0
                ? ` (${Number(b.distanceExtraKm)} km × ₹${Number(b.distanceSurchargePerKm)}/km)`
                : ''}
            </dd>
          </div>
        </dl>
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Mode</dt>
            <dd className="font-medium text-gray-900">{paymentModeLabel(b)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Payment hold</dt>
            <dd className="font-medium text-gray-900">{paymentStatusLabel(b.paymentStatus)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Payment step</dt>
            <dd className="font-medium text-gray-900">{marketplacePaymentStatusLabel(b.payment?.status)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Amount</dt>
            <dd className="font-semibold text-gray-900">{paymentAmountLabel(b)}</dd>
          </div>
        </dl>
        {b.offlinePaymentRejectReason && b.payment?.status === 'pending' && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 text-sm text-rose-950">
            <p className="font-medium">Admin note</p>
            <p className="mt-0.5 text-xs">{b.offlinePaymentRejectReason}</p>
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

      {!hasSchedulePlan && (
        <Card hover={false} className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Actions</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              disabled={busy || b.sessionStatus === 'completed' || !canMarkComplete}
              onClick={() => completeSession(b._id)}
              title={
                !canMarkComplete && b.sessionStatus !== 'completed' ? paymentBlockReason : undefined
              }
              className={`${actionBtn} w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto`}
            >
              {b.sessionStatus === 'completed' ? 'Completed' : 'Mark complete'}
            </button>
          </div>
        </Card>
      )}

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

      {noShowRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">Mark session as no-show</h3>
            <p className="mt-2 text-sm text-gray-700">
              Session #{noShowRow.n} · {formatBookingDateAndSlot(noShowRow.date, noShowRow.time)}
            </p>
            <label htmlFor="no-show-reason" className="mt-4 block text-sm font-medium text-gray-800">
              Reason (optional)
            </label>
            <textarea
              id="no-show-reason"
              rows={3}
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. Patient was not at home; could not reach by phone."
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
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
      )}

      <RecordCollectionModal
        open={recordCollectionOpen}
        booking={b}
        summary={paymentSummary}
        onClose={() => setRecordCollectionOpen(false)}
        onRecorded={load}
      />
    </div>
  )
}
