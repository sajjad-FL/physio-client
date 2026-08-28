import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'
import { bookingCodeBadge } from '../../utils/bookingDisplay'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function ClinicBookingDetailPage() {
  const { id } = useParams()
  const { refreshNavCounts } = useOutletContext() || {}
  const [b, setB] = useState(null)
  const [physios, setPhysios] = useState([])
  const [assignPhysioId, setAssignPhysioId] = useState('')
  const [amount, setAmount] = useState('')
  const [channel, setChannel] = useState('cash')
  const [note, setNote] = useState('')
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingRes, physioRes] = await Promise.all([
        api.get(`/clinic/bookings/${id}`),
        api.get('/clinic/physios'),
      ])
      setB(bookingRes.data)
      setPhysios(physioRes.data?.physios || [])
      const outstanding = bookingRes.data?.paymentSummary?.outstanding
      if (outstanding != null) setAmount(String(outstanding))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load booking')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function assignPhysio() {
    if (!assignPhysioId) return
    setBusy(true)
    try {
      const res = await api.patch(`/clinic/bookings/${id}/assign-physio`, { physioId: assignPhysioId })
      setB(res.data)
      toast.success('Physiotherapist assigned')
      refreshNavCounts?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed')
    } finally {
      setBusy(false)
    }
  }

  async function recordCollection() {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('amount', String(n))
      form.append('collectionChannel', channel)
      form.append('note', note)
      if (channel === 'phonepe_qr' && proof) form.append('proof', proof)
      const res = await api.post(`/clinic/bookings/${id}/collections`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setB(res.data?.booking || res.data)
      toast.success(channel === 'phonepe_qr' ? 'PhonePe collection recorded' : 'Cash recorded')
      refreshNavCounts?.()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Collection failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (!b) {
    return (
      <p className="text-sm text-slate-600">
        Booking not found. <Link to="/clinic/bookings" className="font-semibold text-teal-700">Back</Link>
      </p>
    )
  }

  const patient = b.userId?.name || 'Patient'
  const outstanding = Number(b.paymentSummary?.outstanding ?? 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/clinic/bookings" className="text-sm font-medium text-teal-700 hover:underline">
          ← Cases
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{patient}</h1>
          {bookingCodeBadge(b)}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {b.issue} · {b.date} {b.timeSlot}
          {b.clinicSource === 'manager_referred' ? ' · Manager referred' : ' · Direct'}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Assign clinic physio</h2>
        <p className="mt-1 text-xs text-slate-500">
          Current: {b.physioId?.name || 'None'}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={assignPhysioId}
            onChange={(e) => setAssignPhysioId(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="">Select physiotherapist</option>
            {physios.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !assignPhysioId}
            onClick={assignPhysio}
            className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Collect payment</h2>
        <p className="mt-1 text-xs text-slate-500">
          Outstanding {formatInr(outstanding)} · Total {formatInr(b.totalAmount)}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="phonepe_qr">PhonePe QR</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-xs font-medium text-slate-600">
          Note
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </label>
        {channel === 'phonepe_qr' ? (
          <label className="mt-3 block text-xs font-medium text-slate-600">
            Payment screenshot
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProof(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm"
            />
          </label>
        ) : null}
        <button
          type="button"
          disabled={busy || outstanding <= 0}
          onClick={recordCollection}
          className="mt-4 h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Record collection
        </button>
      </section>
    </div>
  )
}
