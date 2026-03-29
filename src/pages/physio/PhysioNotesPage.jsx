import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import toast from 'react-hot-toast'

export default function PhysioNotesPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteForms, setNoteForms] = useState({})
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/physio/bookings', { params: { page: 1, limit: 50 } })
      const list = res.data?.data || []
      setBookings(list)

      const initial = {}
      for (const b of list) {
        try {
          const n = await api.get(`/notes/${b._id}`)
          initial[b._id] = {
            symptoms: n.data?.symptoms || '',
            diagnosis: n.data?.diagnosis || '',
            treatmentPlan: n.data?.treatmentPlan || '',
            notes: n.data?.notes || '',
          }
        } catch {
          initial[b._id] = {
            symptoms: '',
            diagnosis: '',
            treatmentPlan: '',
            notes: '',
          }
        }
      }
      setNoteForms(initial)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function setField(bookingId, key, value) {
    setNoteForms((prev) => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], [key]: value },
    }))
  }

  async function saveNotes(bookingId) {
    const f = noteForms[bookingId] || {}
    setBusyId(bookingId)
    try {
      await api.post('/notes', {
        bookingId,
        symptoms: f.symptoms || '',
        diagnosis: f.diagnosis || '',
        treatmentPlan: f.treatmentPlan || '',
        notes: f.notes || '',
      })
      toast.success('Notes saved')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save notes')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Clinical notes</h1>
        <p className="mt-1 text-sm text-ink-muted">SOAP-style documentation per visit. Required before admin release.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-border-subtle/80" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-ink-muted">No bookings to document.</p>
      ) : (
        <ul className="space-y-8">
          {bookings.map((b) => (
            <li key={b._id} className="surface-card overflow-hidden rounded-2xl shadow-sm ring-1 ring-border-subtle/80">
              <header className="border-b border-border-subtle/60 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4">
                <p className="text-sm font-semibold text-ink">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                <p className="mt-1 text-xs font-medium text-ink-muted">{b.userId?.name ?? '—'}</p>
              </header>
              <div className="px-5 py-5">
                <p className="text-sm text-ink-muted">{b.issue}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Symptoms</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
                      rows={2}
                      value={noteForms[b._id]?.symptoms ?? ''}
                      onChange={(e) => setField(b._id, 'symptoms', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Diagnosis</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
                      rows={2}
                      value={noteForms[b._id]?.diagnosis ?? ''}
                      onChange={(e) => setField(b._id, 'diagnosis', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Treatment plan</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
                      rows={2}
                      value={noteForms[b._id]?.treatmentPlan ?? ''}
                      onChange={(e) => setField(b._id, 'treatmentPlan', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-muted">Notes</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
                      rows={2}
                      value={noteForms[b._id]?.notes ?? ''}
                      onChange={(e) => setField(b._id, 'notes', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === b._id}
                  onClick={() => saveNotes(b._id)}
                  className="mt-4 cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  Save notes
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
