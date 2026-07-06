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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save assessment')
    } finally {
      setBusy(false)
    }
  }

  async function submitPlan(payload) {
    setBusy(true)
    try {
      const res = await api.patch(`/manager/bookings/${id}/create-plan`, payload)
      setBooking(res.data)
      toast.success('Plan sent for patient consent')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create plan')
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not assign physio')
    } finally {
      setBusy(false)
    }
  }

  async function onCollectionRecorded() {
    await load()
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
  if (!booking) {
    return (
      <Card hover={false} className="p-6">
        <p className="text-slate-600">Booking not found.</p>
        <Link to="/manager/bookings" className="mt-3 inline-block text-teal-700">
          Back to cases
        </Link>
      </Card>
    )
  }

  const b = booking
  const planLive = b.planStatus === 'live' || b.planStatus === 'approved'
  const awaitingConsent = b.planStatus === 'awaiting_consent' || b.planStatus === 'proposed'
  const canCreatePlan = !awaitingConsent && !planLive
  const paymentSummary = b.paymentSummary || null
  const payments = b.payments || []
  const outstanding = Number(paymentSummary?.outstanding || 0)
  const canCollect = planLive && outstanding > 0.009
  const hasPlan = !canCreatePlan
  const sessionPaymentMap = buildSessionPaymentMap(b, payments, paymentSummary)

  async function handleDeleteSession(row) {
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

  return (
    <div className="space-y-4">
      <Link to="/manager/bookings" className="text-sm font-medium text-teal-700">
        ← All cases
      </Link>

      <Card hover={false} className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">{b.userId?.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{b.issue}</p>
        <p className="mt-2 text-sm text-slate-500">
          {formatBookingDateAndSlot(b.date, b.timeSlot)} · {b.userId?.location}
        </p>
        {b.managerId ? (
          <p className="mt-2 text-xs text-slate-500">Workflow: {b.workflowStatus || '—'}</p>
        ) : null}
      </Card>

      <Card hover={false} className="p-5">
        <h3 className="font-semibold text-slate-900">Assessment notes</h3>
        <textarea
          className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
          rows={4}
          value={assessmentNotes}
          onChange={(e) => setAssessmentNotes(e.target.value)}
          placeholder="Visit findings, mobility, recommended sessions…"
        />
        <Button type="button" className="mt-3" disabled={busy} onClick={saveAssessment}>
          Save assessment
        </Button>
      </Card>

      {canCreatePlan ? (
        <Card hover={false} className="p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Create treatment plan</h3>
          <HomePlanForm booking={b} busy={busy} onSubmit={submitPlan} />
        </Card>
      ) : null}

      {awaitingConsent ? (
        <Card hover={false} className="border-amber-100 bg-amber-50/40 p-5">
          <p className="text-sm text-amber-900">Waiting for patient one-tap consent on the plan.</p>
        </Card>
      ) : null}

      {planLive && !b.physioId ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Assign physiotherapist</h3>
          <p className="mt-1 text-xs text-slate-500">
            Verified therapists in your service zone. Filter by distance, rating, and specialty.
          </p>
          <div className="mt-4 space-y-3">
            {selectedPhysioForAssign ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 ring-1 ring-slate-200/80">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
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
                    {selectedPhysioForAssign.specialization || '—'} · {selectedPhysioForAssign.experience ?? 0} yrs
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setAssignModalOpen(true)}
                  className="tap-feedback shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setAssignModalOpen(true)}
                className="tap-feedback w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-left text-sm font-medium text-slate-900 hover:border-teal-300 hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
              >
                <span className="block text-slate-900">Choose physiotherapist…</span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Browse photos, ratings &amp; experience
                </span>
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
        </Card>
      ) : null}

      {b.physioId ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Assigned physio</h3>
          <p className="mt-2 text-sm text-slate-700">{b.physioId?.name}</p>
        </Card>
      ) : null}

      {hasPlan ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Session timeline</h3>
          <p className="mt-1 text-xs text-slate-500">
            View scheduled visits. Reschedule or remove sessions that have not been completed yet.
          </p>
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
        </Card>
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

      {planLive ? (
        <>
          <InstallmentsCard
            title="Payment & collections"
            subtitle="Record cash/UPI on this case. The same amount appears under Finance → Collections until admin batch settlement."
            summary={paymentSummary}
            payments={payments}
            showSessionColumn
            emptyMessage="No collections recorded yet for this case."
          >
            {canCollect ? (
              <Button type="button" disabled={busy} onClick={() => setCollectionModalOpen(true)}>
                Record collection
              </Button>
            ) : null}
          </InstallmentsCard>

          {!canCollect && outstanding <= 0.009 && Number(paymentSummary?.totalPaid || 0) > 0 ? (
            <Card hover={false} className="border-emerald-100 bg-emerald-50/40 p-5">
              <p className="text-sm font-medium text-emerald-900">Plan fully paid</p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Collections you recorded are listed under{' '}
                <Link to="/manager/ledger" className="font-semibold underline">
                  Finance → Collections
                </Link>{' '}
                until admin settles them in batch.
              </p>
            </Card>
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
        </>
      ) : null}
    </div>
  )
}
