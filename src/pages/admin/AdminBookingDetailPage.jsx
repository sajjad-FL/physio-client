import { useCallback, useEffect, useMemo, useState } from 'react'
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
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import SessionNotesReadOnly from '../../components/bookings/SessionNotesReadOnly'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const adminHeaders = () => ({
  headers: { Authorization: `Bearer ${import.meta.env.VITE_ADMIN_API_KEY || ''}` },
})

export default function AdminBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [physios, setPhysios] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rowBusy, setRowBusy] = useState(null)
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [notesModal, setNotesModal] = useState(null)
  const [resolveOpen, setResolveOpen] = useState(null)
  const [resolution, setResolution] = useState('')
  const [resolveAction, setResolveAction] = useState('reject')
  const [resolveSubmitting, setResolveSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [bRes, pRes, dRes] = await Promise.all([
        api.get(`/admin/bookings/${id}`, adminHeaders()),
        api.get('/physios', { params: { page: 1, limit: 100 } }),
        api.get('/admin/disputes', { ...adminHeaders(), params: { page: 1, limit: 20, bookingId: id } }),
      ])
      setBooking(bRes.data)
      setPhysios(pRes.data?.data || [])
      setDisputes(dRes.data?.data || [])
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

  const canAssign = useMemo(() => {
    if (!b) return false
    return b.paymentStatus === 'held' && !b.physioId && b.status !== 'completed'
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

  async function handleAssign() {
    if (!b || !assignPhysioId) {
      toast.error('Choose a physiotherapist before assigning.')
      return
    }
    setRowBusy('assign')
    try {
      await api.patch(`/bookings/${b._id}`, { physioId: assignPhysioId, status: 'assigned' }, adminHeaders())
      toast.success('Assigned')
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
      await api.patch(`/bookings/${b._id}`, { status: 'completed' }, adminHeaders())
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
      await api.patch(`/bookings/${b._id}/verify-payment`, {}, adminHeaders())
      toast.success('Payment verified')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setRowBusy(null)
    }
  }

  async function handleRelease() {
    if (!b) return
    setRowBusy('release')
    try {
      await api.post('/payment/release', { bookingId: b._id }, adminHeaders())
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
      const res = await api.get(`/notes/${b._id}`, adminHeaders())
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
        { resolution: resolution.trim(), action: resolveAction },
        adminHeaders(),
      )
      toast.success('Dispute updated')
      setResolveOpen(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setResolveSubmitting(false)
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
            <h3 className="text-lg font-semibold text-ink">Resolve dispute</h3>
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

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Visit</p>
        <p className="mt-1 text-xl font-semibold text-ink">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
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

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Session timeline</h2>
        <div className="mt-4">
          <BookingSessionTimeline booking={b} />
        </div>
      </Card>

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
            <dt className="text-ink-muted">Escrow</dt>
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
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className="text-xs font-medium text-ink-muted">Assign physiotherapist</label>
              <select
                value={assignPhysioId}
                onChange={(e) => setAssignPhysioId(e.target.value)}
                disabled={rowBusy === 'assign' || !canAssign}
                className="mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="">Select physio</option>
                {physios.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={rowBusy === 'assign' || !canAssign}
              onClick={handleAssign}
              className={`${actionBtn} bg-blue-600 text-white hover:bg-blue-700`}
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
    </div>
  )
}
