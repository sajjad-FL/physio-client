import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../config/api'

function roundMoney2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Physio records a cash / UPI collection for a booking. Amount defaults to
 * one-session fee and caps at outstanding balance.
 */
export default function RecordCollectionModal({ open, booking, summary, onClose, onRecorded }) {
  const outstanding = roundMoney2(Number(summary?.outstanding || 0))
  const perSession = roundMoney2(Number(summary?.amountPerSession || 0))

  const defaultAmount = useMemo(() => {
    if (outstanding <= 0) return 0
    if (perSession > 0) return Math.min(perSession, outstanding)
    return outstanding
  }, [outstanding, perSession])

  const [amount, setAmount] = useState(defaultAmount)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount)
      setNote('')
      setError('')
      setSubmitting(false)
    }
  }, [open, defaultAmount])

  async function handleSubmit(e) {
    e?.preventDefault?.()
    setError('')
    const amt = roundMoney2(Number(amount))
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than zero')
      return
    }
    if (amt > outstanding + 0.009) {
      setError(`Amount must be at most ₹${outstanding.toFixed(2)}`)
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/physio/bookings/${booking?._id}/collections`, {
        amount: amt,
        note: note.trim(),
      })
      toast.success('Collection recorded. Awaiting admin verification.')
      onRecorded?.()
      onClose?.()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not record collection'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Record collection"
      description={`Outstanding: ₹${outstanding.toFixed(2)}. Admin will verify before it unlocks a session.`}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={outstanding}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            disabled={submitting}
          />
          {perSession > 0 ? (
            <p className="mt-1 text-[11px] text-ink-muted">Default: ₹{perSession.toFixed(2)} per session.</p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Note (optional)</span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Cash received after session 2"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            disabled={submitting}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || outstanding <= 0}>
            {submitting ? 'Saving…' : 'Record collection'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
