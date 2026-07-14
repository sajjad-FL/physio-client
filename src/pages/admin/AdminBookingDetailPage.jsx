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
  bookingCodeBadge,
} from '../../utils/bookingDisplay'
import toast from 'react-hot-toast'
import BookingSessionTimeline from '../../components/bookings/BookingSessionTimeline'
import BookingWorkflowStepRail from '../../components/bookings/BookingWorkflowStepRail'
import SessionProgressTracker from '../../components/bookings/SessionProgressTracker'
import InstallmentsCard from '../../components/payments/InstallmentsCard'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import FieldLabel from '../../components/ui/FieldLabel'
import AdminAssignPhysioModal from '../../components/admin/AdminAssignPhysioModal'
import AdminAssignManagerModal from '../../components/admin/AdminAssignManagerModal'
import RescheduleModal from '../../components/physio/RescheduleModal'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { distanceKm, parseLatLng } from '../../utils/geoDistance'
import { usePricingSettings, computeTravelSurchargePreview } from '../../hooks/usePricingSettings'
import { DAILY_SLOTS } from '../../constants/slots'
import { buildSessionPaymentMap } from '../../utils/sessionPaymentMap'
import {
  adminPageContext,
  buildAdminWorkflowSteps,
  defaultAdminOpenStep,
} from '../../utils/adminBookingWorkflow'

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

const actionBtn =
  'cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md disabled:pointer-events-none disabled:opacity-50'

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
  const [openStep, setOpenStep] = useState('case')
  const [stepReady, setStepReady] = useState(false)

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

  useEffect(() => {
    setStepReady(false)
    setOpenStep('case')
  }, [id])

  const pageCtx = useMemo(() => adminPageContext(booking, { disputes }), [booking, disputes])
  const steps = useMemo(() => (pageCtx ? buildAdminWorkflowSteps(pageCtx) : []), [pageCtx])

  useEffect(() => {
    if (!steps.length || stepReady) return
    setOpenStep(defaultAdminOpenStep(steps))
    setStepReady(true)
  }, [steps, stepReady])

  useEffect(() => {
    if (!steps.length) return
    if (!steps.some((s) => s.id === openStep)) {
      setOpenStep(defaultAdminOpenStep(steps))
    }
  }, [steps, openStep])

  const b = booking
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
      setOpenStep('staffing')
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
      await api.patch(`/bookings/${b._id}`, {
        physioId: assignPhysioId,
        status: 'assigned',
        amountPerSession: priceNum,
      })
      toast.success('Assigned')
      setAssignPrice('')
      await load()
      setOpenStep('sessions')
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
      toast.error(err.response?.data?.message || 'Failed to load notes')
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
      await api.patch(`/admin/disputes/${resolveOpen._id}`, {
        resolution: resolution.trim(),
        action: resolveAction,
      })
      toast.success('Dispute updated')
      setResolveOpen(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
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
      await api.post(`/admin/bookings/${b._id}/sessions`, {
        date: addSessionDate,
        timeSlot: addSessionTime,
      })
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

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
  }

  if (error || !pageCtx || !b) {
    return (
      <Card hover={false} className="p-6">
        <p className="text-slate-600">{error || 'Unable to load booking.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/admin')}>
          Back to bookings
        </Button>
      </Card>
    )
  }

  const {
    isHome,
    canAssign,
    canComplete,
    canRelease,
    canVerifyOffline,
    activeDispute,
    paymentSummary,
    payments,
    workflowMeta,
  } = pageCtx

  const paidLine = formatPaidAt(b)
  const sessionPaymentMap = buildSessionPaymentMap(b, payments, paymentSummary)
  const activeStepMeta = steps.find((s) => s.id === openStep)
  const stepColumns = steps.length >= 5 ? 5 : steps.length === 3 ? 3 : 4
  const managerName = typeof b.managerId === 'object' ? b.managerId?.name : null

  return (
    <div className="min-w-0 max-w-full space-y-3 overflow-x-hidden sm:space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 md:p-5">
        <Link to="/admin" className="text-sm font-medium text-teal-700 hover:text-teal-800">
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

      {/* Checklist */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm sm:p-3 md:p-4">
        <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3">
          Admin checklist
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
            <p className="mt-1 text-sm text-blue-800">Action needed on this step.</p>
          ) : null}
        </div>

        {openStep === 'case' && (
          <div className="space-y-4">
            <SessionProgressTracker
              booking={b}
              variant="full"
              className="border-slate-200 bg-slate-50/50 ring-1 ring-slate-100"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</p>
                <p className="mt-1 font-semibold text-slate-900">{b.userId?.name ?? '—'}</p>
                <p className="mt-0.5 text-sm text-slate-600">{b.userId?.phone ?? '—'}</p>
                {b.userId?.location ? (
                  <p className="mt-2 text-sm text-slate-600">{b.userId.location}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team</p>
                <p className="mt-1 text-sm text-slate-800">
                  <span className="font-medium">Manager:</span> {managerName || '—'}
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  <span className="font-medium">Physio:</span> {b.physioId?.name || '—'}
                </p>
                {b.physioId?.specialization ? (
                  <p className="mt-1 text-xs text-slate-500">{b.physioId.specialization}</p>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800">{b.issue || '—'}</p>
              <p className="mt-2 text-xs capitalize text-slate-500">
                Service: {b.serviceType || 'home'}
              </p>
            </div>
            <button
              type="button"
              onClick={openNotes}
              className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
            >
              View clinical notes
            </button>
          </div>
        )}

        {openStep === 'staffing' && (
          <div className="space-y-6">
            {isHome ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Care manager</p>
                {b.managerId && !selectedManagerForAssign ? (
                  <p className="text-sm text-slate-700">
                    {typeof b.managerId === 'object' ? b.managerId.name : 'Assigned'} ·{' '}
                    {b.workflowStatus || '—'}
                  </p>
                ) : null}
                {!b.managerId && !selectedManagerForAssign ? (
                  <p className="text-xs text-amber-800">No care manager assigned yet</p>
                ) : null}
                {selectedManagerForAssign ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                      <p className="text-sm font-semibold text-slate-900">{selectedManagerForAssign.name}</p>
                      <p className="truncate text-xs text-slate-500">
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
                      className="tap-feedback shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={rowBusy === 'manager'}
                    onClick={() => setAssignManagerModalOpen(true)}
                    className="tap-feedback w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-left text-sm font-medium hover:border-teal-300 hover:bg-teal-50/40 disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
                  >
                    <span className="block text-slate-900">Choose care manager…</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
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
                <Button
                  type="button"
                  disabled={rowBusy === 'manager' || !assignManagerId}
                  onClick={handleAssignManager}
                >
                  {rowBusy === 'manager' ? '…' : b.managerId ? 'Reassign manager' : 'Assign manager'}
                </Button>
              </div>
            ) : null}

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900">Physiotherapist</p>
              {canAssign && b.paymentStatus !== 'held' && (
                <p className="text-[11px] text-amber-800/90">
                  Patient has not paid yet. You can still assign now, and ask the patient to complete payment.
                </p>
              )}
              {selectedPhysioForAssign ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                    <p className="text-sm font-semibold text-slate-900">{selectedPhysioForAssign.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {selectedPhysioForAssign.specialization || '—'} ·{' '}
                      {selectedPhysioForAssign.experience ?? 0} yrs
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={rowBusy === 'assign' || !canAssign}
                    title={!canAssign && b?.physioId ? 'Booking already has a physiotherapist' : undefined}
                    onClick={() => setAssignModalOpen(true)}
                    className="tap-feedback shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
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
                  className="tap-feedback w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-left text-sm font-medium hover:border-teal-300 hover:bg-teal-50/40 disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
                >
                  <span className="block text-slate-900">Choose physiotherapist…</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    Browse photos, ratings &amp; experience
                  </span>
                </button>
              )}
              <AdminAssignPhysioModal
                key={b?._id ? `assign-${b._id}` : `assign-${id}`}
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                physios={physios}
                patientCoords={b?.userId?.coordinates}
                selectedId={assignPhysioId}
                onConfirmSelect={(physioId) => setAssignPhysioId(physioId)}
              />
              {assignPhysioId && canAssign && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <label
                    htmlFor="assign-price-input"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
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
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    The patient will be charged this amount
                    {b?.sessions > 1 ? ` × ${b.sessions} sessions` : ''}.
                  </p>
                  {assignPreview && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-700 ring-1 ring-slate-200">
                      <p>Base total: ₹{assignPreview.subtotal.toFixed(2)}</p>
                      <p className="mt-0.5">
                        Distance surcharge (₹{pricingSettings.distanceSurchargePerKmRupees}/km beyond{' '}
                        {pricingSettings.distanceSurchargeBaseKm} km): ₹{assignPreview.surcharge.toFixed(2)}
                        {selectedPhysioDistanceKm != null && (
                          <span className="text-slate-500">
                            {' '}
                            (
                            {selectedPhysioDistanceKm < 10
                              ? selectedPhysioDistanceKm.toFixed(1)
                              : Math.round(selectedPhysioDistanceKm)}{' '}
                            km, extra {assignPreview.extraKm} km)
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-900">
                        Estimated final total: ₹{assignPreview.total.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                disabled={
                  rowBusy === 'assign' || !canAssign || !assignPhysioId || !(Number(assignPrice) > 0)
                }
                onClick={handleAssign}
                className={`${actionBtn} bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50`}
              >
                {rowBusy === 'assign' ? '…' : 'Assign physio'}
              </button>
              {!canAssign && b.physioId ? (
                <p className="text-sm text-emerald-800">
                  Physio already assigned: <span className="font-semibold">{b.physioId.name}</span>
                </p>
              ) : null}
            </div>
          </div>
        )}

        {openStep === 'sessions' && (
          <div className="space-y-4">
            <SessionProgressTracker
              booking={b}
              variant="full"
              className="border-slate-200 bg-slate-50/50 ring-1 ring-slate-100"
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Visit schedule</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Add, reschedule, or delete sessions. Tap View details for physio notes on a row.
              </p>
              <div className="mt-3">
                <BookingSessionTimeline
                  booking={b}
                  sessionPayments={sessionPaymentMap}
                  notesViewer={{ enabled: true }}
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
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={rowBusy === 'complete' || !canComplete}
                onClick={handleComplete}
                className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
              >
                {rowBusy === 'complete' ? '…' : 'Mark booking complete'}
              </button>
              <button
                type="button"
                onClick={openNotes}
                className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`}
              >
                View clinical notes
              </button>
            </div>
          </div>
        )}

        {openStep === 'payments' && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-slate-50/80 p-4 text-sm">
              <div className="min-w-0">
                <dt className="text-slate-500">Sessions</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{b.sessions != null ? b.sessions : '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-500">Price / session</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">
                  {b.amountPerSession != null ? `₹${b.amountPerSession}` : '—'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-500">Plan status</dt>
                <dd className="mt-0.5 capitalize font-semibold text-slate-900">{b.planStatus || '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-500">Total</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{paymentAmountLabel(b)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-slate-500">Distance</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {b.distanceKmAtAssign != null
                    ? `${Number(b.distanceKmAtAssign) < 10 ? Number(b.distanceKmAtAssign).toFixed(1) : Math.round(Number(b.distanceKmAtAssign))} km`
                    : '—'}
                </dd>
              </div>
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <dt className="text-slate-500">Surcharge</dt>
                <dd className="mt-0.5 wrap-break-word font-semibold text-slate-900">
                  ₹{Number(b.distanceSurchargeAmount || 0).toFixed(2)}
                  {Number(b.distanceExtraKm || 0) > 0 && Number(b.distanceSurchargePerKm || 0) > 0
                    ? ` (${Number(b.distanceExtraKm)} km × ₹${Number(b.distanceSurchargePerKm)}/km)`
                    : ''}
                </dd>
              </div>
            </dl>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div className="min-w-0">
                <dt className="text-slate-500">Mode</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{paymentModeLabel(b)}</dd>
              </div>
              {billingTypeLabel(b) ? (
                <div className="min-w-0">
                  <dt className="text-slate-500">Payment type</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{billingTypeLabel(b)}</dd>
                </div>
              ) : null}
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
              <div className="min-w-0 col-span-2">
                <dt className="text-slate-500">Paid at</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{paidLine || '—'}</dd>
              </div>
            </dl>

            {(paymentSummary || payments.length > 0) && (
              <InstallmentsCard
                title="Installments"
                subtitle="Verify each collected offline installment so it counts toward the coverage gate."
                summary={paymentSummary}
                payments={payments}
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
                        className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
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
                        className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )
                }}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {canVerifyOffline && (
                <button
                  type="button"
                  disabled={rowBusy === 'verifyOff'}
                  onClick={handleVerifyOffline}
                  className={`${actionBtn} bg-amber-600 text-white hover:bg-amber-700`}
                >
                  {rowBusy === 'verifyOff' ? '…' : 'Verify offline payment'}
                </button>
              )}
              <button
                type="button"
                disabled={!canRelease || rowBusy === 'release'}
                onClick={handleRelease}
                className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
              >
                {rowBusy === 'release' ? '…' : 'Release payment'}
              </button>
            </div>
          </div>
        )}

        {openStep === 'disputes' && (
          <div className="space-y-4">
            {activeDispute ? (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p className="font-semibold">Open dispute</p>
                  <p className="mt-1 text-xs">{activeDispute.reason}</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setResolveOpen(activeDispute)
                    setResolution('')
                    setResolveAction('reject')
                  }}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Resolve dispute
                </Button>
              </>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                No open disputes on this booking.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close"
            onClick={() => setNotesModal(null)}
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Clinical notes</h3>
            {notesModal.empty ? (
              <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                No SOAP clinical notes yet. The physiotherapist can add them from Clinical notes.
                Per-visit notes are still available under Sessions → View details.
              </p>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Symptoms</dt>
                <dd className="text-slate-900">{notesModal.symptoms || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Diagnosis</dt>
                <dd className="text-slate-900">{notesModal.diagnosis || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Treatment plan</dt>
                <dd className="text-slate-900">{notesModal.treatmentPlan || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd className="text-slate-900">{notesModal.notes || '—'}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-sm hover:bg-slate-800"
              onClick={() => setNotesModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {resolveOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitResolve}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
          >
            <h3 className="type-page-title text-slate-900">Resolve dispute</h3>
            <p className="mt-1 text-xs text-slate-500">{resolveOpen.reason}</p>
            <FieldLabel required className="mt-4 block text-sm font-medium text-slate-800">
              Resolution
            </FieldLabel>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              required
            />
            <FieldLabel required className="mt-3 block text-sm font-medium text-slate-800">
              Action
            </FieldLabel>
            <select
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="reject">Reject</option>
              <option value="refund">Refund</option>
              <option value="release">Release</option>
            </select>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium"
                onClick={() => setResolveOpen(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveSubmitting}
                className="flex-1 rounded-xl bg-teal-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {resolveSubmitting ? '…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {addSessionOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitAddSession}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
          >
            <h3 className="type-page-title text-slate-900">Add session</h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose a new date and time slot for this booking schedule.
            </p>
            <FieldLabel required className="mt-4 block text-sm font-medium text-slate-800">
              Date
            </FieldLabel>
            <input
              type="date"
              value={addSessionDate}
              onChange={(e) => setAddSessionDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <FieldLabel required className="mt-3 block text-sm font-medium text-slate-800">
              Time slot
            </FieldLabel>
            <select
              value={addSessionTime}
              onChange={(e) => setAddSessionTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
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
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium"
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

      {rejectPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
        >
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="type-page-title text-slate-900">Reject installment</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will mark the collection as rejected; the physiotherapist can record a corrected one.
            </p>
            <label htmlFor="reject-reason" className="mt-4 block text-sm font-medium text-slate-800">
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
