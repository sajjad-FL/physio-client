import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  formatPaidAt,
  marketplacePaymentStatusLabel,
  paymentAmountLabel,
  paymentModeLabel,
  billingTypeLabel,
  paymentStatusLabel,
  sessionStatusLabel,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import SessionNotesReadOnly from '../../components/bookings/SessionNotesReadOnly'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import InstallmentsCard from '../../components/payments/InstallmentsCard'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AdminAssignPhysioModal from '../../components/admin/AdminAssignPhysioModal'
import AdminAssignManagerModal from '../../components/admin/AdminAssignManagerModal'
import RescheduleModal from '../../components/physio/RescheduleModal'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { distanceKm, parseLatLng } from '../../utils/geoDistance'
import { usePricingSettings, computeTravelSurchargePreview } from '../../hooks/usePricingSettings'
import { DAILY_SLOTS } from '../../constants/slots'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'

export default function AdminBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings: pricingSettings } = usePricingSettings()
  const [booking, setBooking] = useState(null)
  const [physios, setPhysios] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rowBusy, setRowBusy] = useState(null)
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [assignPrice, setAssignPrice] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [notesModal, setNotesModal] = useState(null)
  const [resolveOpen, setResolveOpen] = useState(null)
  const [resolution, setResolution] = useState('')
  const [resolveAction, setResolveAction] = useState('reject')
  const [resolveSubmitting, setResolveSubmitting] = useState(false)
  const [rescheduleRow, setRescheduleRow] = useState(null)
  const [addSessionOpen, setAddSessionOpen] = useState(false)
  const [addSessionDate, setAddSessionDate] = useState('')
  const [addSessionTime, setAddSessionTime] = useState(DAILY_SLOTS[0] || '10:00-11:00')
  const [sessionBusy, setSessionBusy] = useState(null)
  const [paymentBusyId, setPaymentBusyId] = useState(null)
  const [rejectPayment, setRejectPayment] = useState(null)
  const [rejectPaymentReason, setRejectPaymentReason] = useState('')
  const [careManagers, setCareManagers] = useState([])
  const [assignManagerId, setAssignManagerId] = useState('')
  const [assignManagerModalOpen, setAssignManagerModalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [bRes, pRes, dRes, mRes] = await Promise.all([
        api.get(`/admin/bookings/${id}`),
        api.get('/physios', { params: { page: 1, limit: 100 } }),
        api.get('/admin/disputes', { params: { page: 1, limit: 20, bookingId: id } }),
        api.get('/admin/care-managers').catch(() => ({ data: { managers: [] } })),
      ])
      setBooking(bRes.data)
      setPhysios(pRes.data?.data || [])
      setDisputes(dRes.data?.data || [])
      setCareManagers(mRes.data?.managers || [])
      setAssignManagerId(bRes.data?.managerId?._id || bRes.data?.managerId || '')
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

  const b = booking
  const activeDispute = useMemo(() => disputes.find((d) => d.status === 'open' || d.status === 'under_review'), [disputes])

  const selectedPhysioForAssign = useMemo(
    () => physios.find((p) => String(p._id) === String(assignPhysioId)),
    [physios, assignPhysioId],
  )
  const selectedManagerForAssign = useMemo(() => {
    const fromList = careManagers.find((m) => String(m._id) === String(assignManagerId))
    if (fromList) return fromList
    if (
      assignManagerId &&
      b?.managerId &&
      typeof b.managerId === 'object' &&
      String(b.managerId._id) === String(assignManagerId)
    ) {
      return b.managerId
    }
    return null
  }, [careManagers, assignManagerId, b?.managerId])
  const selectedPhysioDistanceKm = useMemo(() => {
    if (!selectedPhysioForAssign || !b?.userId?.coordinates) return null
    const patient = parseLatLng(b.userId.coordinates)
    const physio = parseLatLng(selectedPhysioForAssign.coordinates)
    if (!patient || !physio) return null
    return distanceKm(patient.lat, patient.lng, physio.lat, physio.lng)
  }, [selectedPhysioForAssign, b?.userId?.coordinates])
  const assignPreview = useMemo(() => {
    const price = Number(assignPrice)
    if (!Number.isFinite(price) || price <= 0) return null
    const sessions = Math.max(1, Number(b?.sessions) || 1)
    const subtotal = price * sessions
    const floored = selectedPhysioDistanceKm == null ? null : Math.floor(selectedPhysioDistanceKm)
    const extraKm =
      floored == null
        ? 0
        : Math.max(0, floored - Number(pricingSettings.distanceSurchargeBaseKm || 0))
    const surcharge = computeTravelSurchargePreview(selectedPhysioDistanceKm, pricingSettings)
    const total = subtotal + surcharge
    return { sessions, subtotal, extraKm, surcharge, total }
  }, [assignPrice, selectedPhysioDistanceKm, b?.sessions, pricingSettings])

  /**
   * When admin picks a physio (or the booking already has one they are
   * revising), prefill the price-per-session input with a sensible default so
   * the admin rarely has to type it from scratch:
   *  1. existing booking.amountPerSession (if already set)
   *  2. otherwise the selected physio's profile pricePerSession
   * The admin is still free to override before hitting Assign.
   */
  useEffect(() => {
    if (!selectedPhysioForAssign) return
    if (assignPrice) return
    const bookingPrice = booking?.amountPerSession
    if (bookingPrice != null && Number(bookingPrice) > 0) {
      setAssignPrice(String(bookingPrice))
      return
    }
    const physioPrice = selectedPhysioForAssign.pricePerSession
    if (physioPrice != null && Number(physioPrice) > 0) {
      setAssignPrice(String(physioPrice))
    }
  }, [selectedPhysioForAssign, booking?.amountPerSession, assignPrice])

  /** Admin assigns physio; allow before or after patient payment (escrow may still be pending). */
  const canAssign = useMemo(() => {
    if (!b) return false
    if (b.physioId) return false
    if (b.status === 'completed') return false
    if (b.paymentStatus === 'refunded') return false
    return true
  }, [b])

  const canComplete = useMemo(() => {
    if (!b) return false
    return b.paymentStatus === 'held' && b.status !== 'completed'
  }, [b])

  const canRelease = useMemo(() => {
    if (!b) return false
    return b.paymentStatus === 'held' && b.sessionStatus === 'completed'
  }, [b])

  const canVerifyOffline = useMemo(() => {
    if (!b) return false
    return (
      b.serviceType === 'home' &&
      b.homePlanPaymentMode === 'offline' &&
      b.planStatus === 'approved' &&
      !b.offlinePaymentVerified &&
      b.payment?.status === 'collected'
    )
  }, [b])

  async function handleAssignManager() {
    if (!b || !assignManagerId) {
      toast.error('Choose a care manager.')
      return
    }
    setRowBusy('manager')
    try {
      await api.patch(`/admin/bookings/${b._id}/assign-manager`, { managerId: assignManagerId })
      toast.success('Care manager assigned')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign manager failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleAssign() {
    if (!b || !assignPhysioId) {
      toast.error('Choose a physiotherapist before assigning.')
      return
    }
    const priceNum = Number(assignPrice)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error('Enter a valid price per session before assigning.')
      return
    }
    setRowBusy('assign')
    try {
      await api.patch(
        `/bookings/${b._id}`,
        { physioId: assignPhysioId, status: 'assigned', amountPerSession: priceNum },      )
      toast.success('Assigned')
      setAssignPrice('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleComplete() {
    if (!b) return
    setRowBusy('complete')
    try {
      await api.patch(`/bookings/${b._id}`, { status: 'completed' })
      toast.success('Updated')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleVerifyOffline() {
    if (!b) return
    setRowBusy('verifyOff')
    try {
      await api.patch(`/bookings/${b._id}/verify-payment`, {})
      toast.success('Payment verified')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleVerifyInstallment(paymentId) {
    if (!paymentId) return
    setPaymentBusyId(String(paymentId))
    try {
      await api.post(`/admin/payments/${paymentId}/verify`, {})
      toast.success('Installment verified')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setPaymentBusyId(null)
    }
  }

  async function handleRejectInstallment() {
    if (!rejectPayment?._id) return
    const reason = rejectPaymentReason.trim()
    if (!reason) {
      toast.error('Enter a reason to reject this installment')
      return
    }
    setPaymentBusyId(String(rejectPayment._id))
    try {
      await api.post(`/admin/payments/${rejectPayment._id}/reject`, { reason })
      toast.success('Installment rejected')
      setRejectPayment(null)
      setRejectPaymentReason('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    } finally {
      setPaymentBusyId(null)
    }
  }

  async function handleRelease() {
    if (!b) return
    setRowBusy('release')
    try {
      await api.post('/payment/release', { bookingId: b._id })
      toast.success('Payment released')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Release failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function openNotes() {
    if (!b) return
    try {
      const res = await api.get(`/notes/${b._id}`)
      setNotesModal(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('No notes yet')
      } else {
        toast.error(err.response?.data?.message || 'Failed to load notes')
      }
    }
  }

  async function submitResolve(e) {
    e.preventDefault()
    if (!resolveOpen || !resolution.trim()) {
      toast.error('Resolution text is required')
      return
    }
    setResolveSubmitting(true)
    try {
      await api.patch(
        `/admin/disputes/${resolveOpen._id}`,
        { resolution: resolution.trim(), action: resolveAction },      )
      toast.success('Dispute updated')
      setResolveOpen(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setResolveSubmitting(false)
    }
  }

  async function submitAddSession(e) {
    e.preventDefault()
    if (!b?._id) return
    if (!addSessionDate || !addSessionTime) {
      toast.error('Choose date and slot')
      return
    }
    setSessionBusy('add')
    try {
      await api.post(
        `/admin/bookings/${b._id}/sessions`,
        { date: addSessionDate, timeSlot: addSessionTime },      )
      toast.success('Session added')
      setAddSessionOpen(false)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add session')
    } finally {
      setSessionBusy(null)
    }
  }

  async function handleDeleteSession(row) {
    if (!b?._id || !row?.sessionId) return
    const ok = window.confirm(`Delete session #${row.n} (${row.date}, ${row.time})?`)
    if (!ok) return
    setSessionBusy(String(row.sessionId))
    try {
      await api.delete(`/admin/bookings/${b._id}/sessions/${row.sessionId}`)
      toast.success('Session deleted')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete session')
    } finally {
      setSessionBusy(null)
    }
  }

  const actionBtn =
    'cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md disabled:pointer-events-none disabled:opacity-50'

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-brand" aria-hidden />
        <p className="text-sm font-medium text-ink-muted" role="status">
          Loading booking…
        </p>
      </div>
    )
  }

  if (error || !b) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-canvas/80 px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/admin')}>
          Back to bookings
        </Button>
      </div>
    )
  }

  const paidLine = formatPaidAt(b)
  const sessionPaymentMap = buildSessionPaymentMap(b, b.payments || [], b.paymentSummary || null)

  return (
    <div className="space-y-6">
      <Link
        to="/admin"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← Back to bookings
      </Link>

      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close"
            onClick={() => setNotesModal(null)}
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-ink">Clinical notes</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-ink-muted">Symptoms</dt>
                <dd className="text-ink">{notesModal.symptoms || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Diagnosis</dt>
                <dd className="text-ink">{notesModal.diagnosis || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Treatment plan</dt>
                <dd className="text-ink">{notesModal.treatmentPlan || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Notes</dt>
                <dd className="text-ink">{notesModal.notes || '—'}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm text-white shadow-sm hover:bg-ink/90"
              onClick={() => setNotesModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {resolveOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitResolve}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-border-subtle"
          >
            <h3 className="type-page-title text-ink">Resolve dispute</h3>
            <p className="mt-1 text-xs text-ink-muted">{resolveOpen.reason}</p>
            <label className="mt-4 block text-sm font-medium text-ink">Resolution</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm"
              rows={3}
              required
            />
            <label className="mt-3 block text-sm font-medium text-ink">Action</label>
            <select
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="reject">Reject</option>
              <option value="refund">Refund</option>
              <option value="release">Release</option>
            </select>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-border-subtle py-2 text-sm font-medium"
                onClick={() => setResolveOpen(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveSubmitting}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {resolveSubmitting ? '…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {addSessionOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitAddSession}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-border-subtle"
          >
            <h3 className="type-page-title text-ink">Add session</h3>
            <p className="mt-1 text-xs text-ink-muted">Choose a new date and time slot for this booking schedule.</p>
            <label className="mt-4 block text-sm font-medium text-ink">Date</label>
            <input
              type="date"
              value={addSessionDate}
              onChange={(e) => setAddSessionDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm"
              required
            />
            <label className="mt-3 block text-sm font-medium text-ink">Time slot</label>
            <select
              value={addSessionTime}
              onChange={(e) => setAddSessionTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm"
            >
              {DAILY_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-border-subtle py-2 text-sm font-medium"
                onClick={() => setAddSessionOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sessionBusy === 'add'}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {sessionBusy === 'add' ? 'Adding…' : 'Add session'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Visit</p>
        <p className="type-page-title mt-1 text-ink">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Booking: {b.status}
          </span>
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Session: {sessionStatusLabel(b)}
          </span>
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Payment: {paymentStatusLabel(b.paymentStatus)}
          </span>
        </div>
      </Card>

      <SessionProgressTracker
        booking={b}
        variant="full"
        className="border-border-subtle bg-white ring-1 ring-border-subtle/80"
      />

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Participants</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Patient</p>
            <p className="mt-1 font-medium text-ink">{b.userId?.name ?? '—'}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{b.userId?.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Physiotherapist</p>
            <p className="mt-1 font-medium text-ink">{b.physioId?.name ?? '—'}</p>
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

      {(b.paymentSummary || (Array.isArray(b.payments) && b.payments.length > 0)) && (
        <InstallmentsCard
          title="Installments"
          subtitle="Verify each collected offline installment so it counts toward the coverage gate."
          summary={b.paymentSummary}
          payments={b.payments}
          showSessionColumn
          renderRowActions={(p) => {
            if (p.mode !== 'offline' || p.status !== 'collected') return null
            const busy = paymentBusyId === String(p._id)
            return (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleVerifyInstallment(p._id)}
                  className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? '…' : 'Verify'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setRejectPayment(p)
                    setRejectPaymentReason('')
                  }}
                  className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )
          }}
        />
      )}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Session timeline</h2>
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
              onAdd: () => {
                setAddSessionDate(b?.date || '')
                setAddSessionTime(b?.timeSlot || DAILY_SLOTS[0] || '10:00-11:00')
                setAddSessionOpen(true)
              },
              onDelete: handleDeleteSession,
              canDelete: (row) => Boolean(row.sessionId),
              deletingSessionId: sessionBusy && sessionBusy !== 'add' ? sessionBusy : null,
              disableAdd: sessionBusy === 'add',
            }}
          />
        </div>
      </Card>

      {rescheduleRow != null && (
        <RescheduleModal
          key={rescheduleRow.key}
          booking={b}
          sessionRow={rescheduleRow}
          title="Reschedule session (admin)"
          patchReschedule={(body) => api.patch(`/admin/bookings/${b._id}/reschedule`, body)}
          onClose={() => setRescheduleRow(null)}
          onUpdated={load}
        />
      )}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Session notes</h2>
        <p className="mt-1 text-xs text-ink-muted">Written by the physiotherapist. Read-only for admin.</p>
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
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Plan status</dt>
            <dd className="mt-0.5 capitalize text-ink">{b.planStatus || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Total</dt>
            <dd className="mt-0.5 font-semibold text-ink">{b.totalAmount != null ? `₹${b.totalAmount}` : '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Distance at assign</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {b.distanceKmAtAssign != null
                ? `${Number(b.distanceKmAtAssign) < 10 ? Number(b.distanceKmAtAssign).toFixed(1) : Math.round(Number(b.distanceKmAtAssign))} km`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Distance surcharge</dt>
            <dd className="mt-0.5 font-medium text-ink">
              ₹{Number(b.distanceSurchargeAmount || 0).toFixed(2)}
              {Number(b.distanceExtraKm || 0) > 0 && Number(b.distanceSurchargePerKm || 0) > 0
                ? ` (${Number(b.distanceExtraKm)} km × ₹${Number(b.distanceSurchargePerKm)}/km)`
                : ''}
            </dd>
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
          {billingTypeLabel(b) ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Payment type</dt>
              <dd className="font-medium text-ink">{billingTypeLabel(b)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment hold</dt>
            <dd className="font-medium text-ink">{paymentStatusLabel(b.paymentStatus)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment step</dt>
            <dd className="font-medium text-ink">{marketplacePaymentStatusLabel(b.payment?.status)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-semibold tabular-nums text-ink">{paymentAmountLabel(b)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Paid at</dt>
            <dd className="text-ink">{paidLine || '—'}</dd>
          </div>
        </dl>
      </Card>

      {activeDispute && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Open dispute</p>
          <p className="mt-1 text-xs">{activeDispute.reason}</p>
        </div>
      )}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Actions — manage booking</h2>
        <div className="flex flex-col gap-4">
          {b.serviceType === 'home' ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <label className="text-xs font-medium text-ink-muted">Care manager</label>
                {b.managerId && !selectedManagerForAssign ? (
                  <p className="text-sm text-ink">
                    {typeof b.managerId === 'object' ? b.managerId.name : 'Assigned'} ·{' '}
                    {b.workflowStatus || '—'}
                  </p>
                ) : null}
                {!b.managerId && !selectedManagerForAssign ? (
                  <p className="text-xs text-amber-800">No care manager assigned yet</p>
                ) : null}
                {selectedManagerForAssign ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-white p-3 ring-1 ring-border-subtle/60">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-border-subtle">
                      {resolveFileUrl(selectedManagerForAssign.avatarUrl) ? (
                        <img
                          src={resolveFileUrl(selectedManagerForAssign.avatarUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                          {(selectedManagerForAssign.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{selectedManagerForAssign.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {selectedManagerForAssign.phone || '—'}
                        {selectedManagerForAssign.zones?.length
                          ? ` · ${selectedManagerForAssign.zones.length} zone${selectedManagerForAssign.zones.length === 1 ? '' : 's'}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={rowBusy === 'manager'}
                      onClick={() => setAssignManagerModalOpen(true)}
                      className="tap-feedback shrink-0 rounded-lg border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={rowBusy === 'manager'}
                    onClick={() => setAssignManagerModalOpen(true)}
                    className="tap-feedback w-full rounded-xl border border-dashed border-border-subtle bg-slate-50/80 px-4 py-4 text-left text-sm font-medium text-ink hover:border-teal-300 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
                  >
                    <span className="block text-ink">Choose care manager…</span>
                    <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                      Browse zone coverage, distance &amp; contact details
                    </span>
                  </button>
                )}
                <AdminAssignManagerModal
                  key={b?._id ? `mgr-${b._id}` : `mgr-${id}`}
                  open={assignManagerModalOpen}
                  onClose={() => setAssignManagerModalOpen(false)}
                  managers={careManagers}
                  patientCoords={b?.userId?.coordinates}
                  bookingPincode={b?.pincode || b?.userId?.pincode}
                  selectedId={assignManagerId}
                  onConfirmSelect={(managerId) => setAssignManagerId(managerId)}
                />
              </div>
              <Button
                type="button"
                disabled={rowBusy === 'manager' || !assignManagerId}
                onClick={handleAssignManager}
              >
                {rowBusy === 'manager' ? '…' : b.managerId ? 'Reassign manager' : 'Assign manager'}
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <label className="text-xs font-medium text-ink-muted">Assign physiotherapist</label>
              {canAssign && b.paymentStatus !== 'held' && (
                <p className="text-[11px] text-amber-800/90">
                  Patient has not paid yet. You can still assign now, and ask the patient to complete payment.
                </p>
              )}
              {selectedPhysioForAssign ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-white p-3 ring-1 ring-border-subtle/60">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-border-subtle">
                    {resolveFileUrl(selectedPhysioForAssign.avatar) ? (
                      <img
                        src={resolveFileUrl(selectedPhysioForAssign.avatar)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                        {(selectedPhysioForAssign.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{selectedPhysioForAssign.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {selectedPhysioForAssign.specialization || '—'} · {selectedPhysioForAssign.experience ?? 0} yrs
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={rowBusy === 'assign' || !canAssign}
                    title={!canAssign && b?.physioId ? 'Booking already has a physiotherapist' : undefined}
                    onClick={() => setAssignModalOpen(true)}
                    className="tap-feedback shrink-0 rounded-lg border border-border-subtle bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={rowBusy === 'assign' || !canAssign}
                  title={
                    !canAssign && b
                      ? b.physioId
                        ? 'This booking already has a physiotherapist'
                        : b.status === 'completed'
                          ? 'Completed bookings cannot be reassigned here'
                          : b.paymentStatus === 'refunded'
                            ? 'Refunded bookings cannot be assigned'
                            : undefined
                      : undefined
                  }
                  onClick={() => setAssignModalOpen(true)}
                  className="tap-feedback w-full rounded-xl border border-dashed border-border-subtle bg-slate-50/80 px-4 py-4 text-left text-sm font-medium text-ink hover:border-teal-300 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
                >
                  <span className="block text-ink">Choose physiotherapist…</span>
                  <span className="mt-0.5 block text-xs font-normal text-ink-muted">Browse photos, ratings &amp; experience</span>
                </button>
              )}
              <AdminAssignPhysioModal
                key={b?._id ? `assign-${b._id}` : `assign-${id}`}
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                physios={physios}
                patientCoords={b?.userId?.coordinates}
                selectedId={assignPhysioId}
                onConfirmSelect={(id) => setAssignPhysioId(id)}
              />
              {assignPhysioId && canAssign && (
                <div className="rounded-xl border border-border-subtle bg-white p-3 ring-1 ring-border-subtle/60">
                  <label
                    htmlFor="assign-price-input"
                    className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
                  >
                    Price per session (₹)
                  </label>
                  <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20">
                    <span className="pl-3 text-sm font-semibold text-slate-500">₹</span>
                    <input
                      id="assign-price-input"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={assignPrice}
                      onChange={(e) => setAssignPrice(e.target.value)}
                      placeholder={
                        selectedPhysioForAssign?.pricePerSession != null
                          ? String(selectedPhysioForAssign.pricePerSession)
                          : 'e.g. 500'
                      }
                      className="w-full min-w-0 rounded-lg bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-muted">
                    The patient will be charged this amount
                    {b?.sessions > 1 ? ` × ${b.sessions} session${b.sessions === 1 ? '' : 's'}` : ''}.
                    Physiotherapist earning and platform commission are recalculated automatically.
                  </p>
                  {assignPreview && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-700 ring-1 ring-slate-200">
                      <p>Base total: ₹{assignPreview.subtotal.toFixed(2)}</p>
                      <p className="mt-0.5">
                        Distance surcharge (₹{pricingSettings.distanceSurchargePerKmRupees}/km beyond {pricingSettings.distanceSurchargeBaseKm} km, floor):
                        {' '}
                        ₹{assignPreview.surcharge.toFixed(2)}
                        {selectedPhysioDistanceKm != null && (
                          <span className="text-slate-500">
                            {' '}
                            ({selectedPhysioDistanceKm < 10 ? selectedPhysioDistanceKm.toFixed(1) : Math.round(selectedPhysioDistanceKm)} km, extra {assignPreview.extraKm} km)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-900">Estimated final total: ₹{assignPreview.total.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={
                rowBusy === 'assign' ||
                !canAssign ||
                !assignPhysioId ||
                !(Number(assignPrice) > 0)
              }
              onClick={handleAssign}
              className={`${actionBtn} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
            >
              {rowBusy === 'assign' ? '…' : 'Assign'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={rowBusy === 'complete' || !canComplete}
              onClick={handleComplete}
              className={`${actionBtn} border border-border-subtle bg-white text-ink hover:bg-gray-50`}
            >
              {rowBusy === 'complete' ? '…' : 'Mark booking complete'}
            </button>
            {canVerifyOffline && (
              <button
                type="button"
                disabled={rowBusy === 'verifyOff'}
                onClick={handleVerifyOffline}
                className={`${actionBtn} bg-amber-600 text-white hover:bg-amber-700`}
              >
                {rowBusy === 'verifyOff' ? '…' : 'Verify payment'}
              </button>
            )}
            <button
              type="button"
              onClick={openNotes}
              className={`${actionBtn} border border-border-subtle bg-white text-ink hover:bg-gray-50`}
            >
              View notes
            </button>
            <button
              type="button"
              disabled={!canRelease || rowBusy === 'release'}
              onClick={handleRelease}
              className={`${actionBtn} bg-green-600 text-white hover:bg-green-700`}
            >
              {rowBusy === 'release' ? '…' : 'Release payment'}
            </button>
            {activeDispute && (
              <button
                type="button"
                onClick={() => {
                  setResolveOpen(activeDispute)
                  setResolution('')
                  setResolveAction('reject')
                }}
                className={`${actionBtn} border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100`}
              >
                Resolve dispute
              </button>
            )}
          </div>
        </div>
      </Card>

      {rejectPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-ink">Reject installment</h3>
            <p className="mt-2 text-sm text-ink-muted">
              This will mark the collection as rejected; the physiotherapist can record a corrected one.
            </p>
            <label htmlFor="reject-reason" className="mt-4 block text-sm font-medium text-ink">
              Reason
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectPaymentReason}
              onChange={(e) => setRejectPaymentReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. Amount mismatch with patient report"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectPayment(null)
                  setRejectPaymentReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={paymentBusyId === String(rejectPayment._id)}
                onClick={handleRejectInstallment}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {paymentBusyId === String(rejectPayment._id) ? '…' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
