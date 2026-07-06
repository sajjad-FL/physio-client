import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import HomePlanForm from '../../components/physio/HomePlanForm'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function ManagerBookingDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [physios, setPhysios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [assessmentNotes, setAssessmentNotes] = useState('')
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [collectionAmount, setCollectionAmount] = useState('')
  const [collectionNote, setCollectionNote] = useState('')

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

  async function recordCollection() {
    const amount = Number(collectionAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setBusy(true)
    try {
      await api.post(`/manager/bookings/${id}/collections`, { amount, note: collectionNote })
      toast.success('Collection recorded')
      setCollectionAmount('')
      setCollectionNote('')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not record collection')
    } finally {
      setBusy(false)
    }
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
          <select
            className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
            value={assignPhysioId}
            onChange={(e) => setAssignPhysioId(e.target.value)}
          >
            <option value="">Select physio…</option>
            {physios.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {p.specialization || 'Physio'}
              </option>
            ))}
          </select>
          <Button type="button" className="mt-3" disabled={busy || !assignPhysioId} onClick={assignPhysio}>
            Assign physio
          </Button>
        </Card>
      ) : null}

      {b.physioId ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Assigned physio</h3>
          <p className="mt-2 text-sm text-slate-700">{b.physioId?.name}</p>
        </Card>
      ) : null}

      {planLive ? (
        <Card hover={false} className="p-5">
          <h3 className="font-semibold text-slate-900">Record collection</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              className="rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Amount (₹)"
              value={collectionAmount}
              onChange={(e) => setCollectionAmount(e.target.value)}
            />
            <input
              type="text"
              className="rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Note (optional)"
              value={collectionNote}
              onChange={(e) => setCollectionNote(e.target.value)}
            />
          </div>
          <Button type="button" className="mt-3" disabled={busy} onClick={recordCollection}>
            Record collection
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
