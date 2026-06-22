import { useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'

function todayInputValue() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function RescheduleModal({ booking, sessionRow, patchReschedule, onClose, onUpdated, title }) {
  const initialDate = sessionRow?.date || booking?.date || todayInputValue()
  const initialSlot = sessionRow?.time || booking?.timeSlot || DAILY_SLOTS[0]
  const [date, setDate] = useState(initialDate)
  const [timeSlot, setTimeSlot] = useState(initialSlot)
  const [busy, setBusy] = useState(false)

  if (!booking) return null

  const sessionLabel =
    sessionRow?.n != null ? `Session #${sessionRow.n}` : sessionRow?.sessionId ? 'This session' : 'Visit'

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = { date, timeSlot }
      if (sessionRow?.sessionId && String(sessionRow.sessionId) !== String(booking._id)) {
        payload.sessionId = sessionRow.sessionId
      }
      await patchReschedule(payload)
      toast.success('Session rescheduled')
      onUpdated?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reschedule')
    } finally {
      setBusy(false)
    }
  }

  const min = todayInputValue()
  const heading = title || 'Reschedule session'

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reschedule-title" className="type-page-title text-gray-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {sessionLabel} — currently{' '}
          <span className="font-medium text-gray-800">
            {formatBookingDateAndSlot(sessionRow?.date || booking.date, sessionRow?.time || booking.timeSlot)}
          </span>
        </p>
        {booking.rescheduled && booking.previousDate && !sessionRow?.sessionId && (
          <p className="mt-1 text-xs text-amber-800">
            Previously: {formatBookingDateAndSlot(booking.previousDate, booking.previousTimeSlot)}
          </p>
        )}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              New date
            </label>
            <input
              type="date"
              min={min}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              New time slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {DAILY_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {formatBookingTimeSlot(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 transition-all hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save new time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

export default RescheduleModal
