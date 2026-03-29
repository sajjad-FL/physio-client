import { useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'

function todayInputValue() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function RescheduleModal({ booking, onClose, onUpdated }) {
  const [date, setDate] = useState(booking?.date || todayInputValue())
  const [timeSlot, setTimeSlot] = useState(booking?.timeSlot || DAILY_SLOTS[0])
  const [busy, setBusy] = useState(false)

  if (!booking) return null

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.patch(`/bookings/${booking._id}/reschedule`, { date, timeSlot })
      toast.success('Visit rescheduled')
      onUpdated?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reschedule')
    } finally {
      setBusy(false)
    }
  }

  const min = todayInputValue()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200"
      >
        <h2 id="reschedule-title" className="text-lg font-semibold text-gray-900">
          Reschedule visit
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Current:{' '}
          <span className="font-medium text-gray-800">
            {formatBookingDateAndSlot(booking.date, booking.timeSlot)}
          </span>
        </p>
        {booking.rescheduled && booking.previousDate && (
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
}
