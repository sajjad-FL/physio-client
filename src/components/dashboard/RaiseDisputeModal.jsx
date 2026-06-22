import { useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { formatBookingDateAndSlot } from '../../utils/date'

const REASONS = ['Service quality', 'Late / no-show', 'Billing or payment', 'Safety concern', 'Other']

export default function RaiseDisputeModal({ booking, onClose, onCreated }) {
  const [reason, setReason] = useState(REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  if (!booking) return null

  const effectiveReason = reason === 'Other' ? customReason.trim() : reason

  async function submit(e) {
    e.preventDefault()
    if (!effectiveReason) {
      toast.error('Please enter a reason')
      return
    }
    if (!description.trim()) {
      toast.error('Please describe what happened')
      return
    }
    setSaving(true)
    try {
      await api.post('/disputes', {
        bookingId: booking._id,
        reason: effectiveReason,
        description: description.trim(),
      })
      toast.success('Dispute submitted')
      onCreated?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit dispute')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-border-subtle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
      >
        <h2 id="dispute-title" className="type-page-title text-ink">
          Raise a dispute
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{formatBookingDateAndSlot(booking.date, booking.timeSlot)}</span>
          <span className="text-ink-muted"> — </span>
          {booking.issue}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {reason === 'Other' && (
              <input
                className="mt-2 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
                placeholder="Describe the reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Description</label>
            <textarea
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
              placeholder="What went wrong? Include dates and details."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {saving ? 'Submitting…' : 'Submit dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
