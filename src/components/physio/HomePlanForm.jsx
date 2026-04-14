import { useEffect, useMemo, useState } from 'react'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingTimeSlot } from '../../utils/date'
import Button from '../ui/Button'
import DragSelectCalendar from './DragSelectCalendar'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function toYMD(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatSummaryDay(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

const fieldLabel = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500'
const fieldInput =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'

/**
 * @param {object} props
 * @param {object} props.booking — booking row with timeSlot, physioId
 * @param {boolean} props.busy
 * @param {(payload: { sessions: number, amountPerSession: number, discountPercent: number, paymentMode: 'online'|'offline', schedule: { date: string, time: string }[] }) => void} props.onSubmit
 */
export default function HomePlanForm({ booking, busy, onSubmit }) {
  const defaultSlot =
    booking?.timeSlot && DAILY_SLOTS.includes(booking.timeSlot) ? booking.timeSlot : DAILY_SLOTS[0]
  const defaultAmount = booking?.physioId?.pricePerSession != null ? String(booking.physioId.pricePerSession) : ''
  const physio = booking?.physioId
  const feeLo = Number(physio?.pricePerSession)
  const feeHi = physio?.pricePerSessionMax != null ? Number(physio.pricePerSessionMax) : NaN
  const hasFeeRange = Number.isFinite(feeLo) && Number.isFinite(feeHi) && feeHi > feeLo

  const [sessions, setSessions] = useState(1)
  const [amountPerSession, setAmountPerSession] = useState(defaultAmount)
  const [discount, setDiscount] = useState(0)
  const [sessionTime, setSessionTime] = useState(defaultSlot)
  const [paymentMode, setPaymentMode] = useState('online')
  const [selectedDates, setSelectedDates] = useState([])

  useEffect(() => {
    setAmountPerSession(defaultAmount)
    setSessionTime(defaultSlot)
  }, [booking._id, defaultAmount, defaultSlot])

  useEffect(() => {
    setSelectedDates((prev) => {
      if (prev.length <= sessions) return prev
      const sorted = [...prev].sort((a, b) => a - b)
      return sorted.slice(0, sessions)
    })
  }, [sessions])

  const totals = useMemo(() => {
    const n = Number(amountPerSession)
    const s = Number(sessions) || 0
    const d = Math.min(15, Math.max(0, Number(discount) || 0))
    if (!Number.isFinite(n) || n <= 0 || s < 1) {
      return { subtotal: 0, discountAmount: 0, final: 0, discountPct: d }
    }
    const subtotal = s * n
    const discountAmount = round2(subtotal * (d / 100))
    const final = round2(subtotal - discountAmount)
    return { subtotal, discountAmount, final, discountPct: d }
  }, [amountPerSession, sessions, discount])

  const dateMismatch = selectedDates.length !== Number(sessions)
  const amt = Number(amountPerSession)
  const feeInRange = !hasFeeRange || (Number.isFinite(amt) && amt >= feeLo && amt <= feeHi)
  const canSubmit =
    Number(sessions) >= 1 &&
    Number(amountPerSession) > 0 &&
    feeInRange &&
    !dateMismatch &&
    totals.final > 0 &&
    !busy

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    const sorted = [...selectedDates].sort((a, b) => a - b)
    const schedule = sorted.map((d) => ({ date: toYMD(d), time: sessionTime }))
    onSubmit({
      sessions: Number(sessions),
      amountPerSession: Number(amountPerSession),
      discountPercent: totals.discountPct,
      paymentMode,
      schedule,
    })
  }

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [booking._id])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6 rounded-2xl border border-gray-100 bg-gray-50/40 p-5 shadow-sm ring-1 ring-gray-100/80 lg:p-6">
          <h3 className="text-sm font-semibold text-gray-900">Plan details</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-5">
              <div>
                <label className={fieldLabel}>Number of sessions</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sessions}
                  onChange={(e) => setSessions(Math.max(1, Number(e.target.value) || 1))}
                  className={fieldInput}
                />
              </div>
              <div>
                <label className={fieldLabel}>Amount per session (₹)</label>
                {physio && hasFeeRange ? (
                  <p className="mb-2 text-xs text-gray-600">
                    Agreed fee band: {formatPhysioSessionFeeLabel(physio)}/session — enter an amount in this range.
                  </p>
                ) : null}
                <input
                  type="number"
                  min={hasFeeRange ? feeLo : 1}
                  max={hasFeeRange ? feeHi : undefined}
                  step={1}
                  value={amountPerSession}
                  onChange={(e) => setAmountPerSession(e.target.value)}
                  placeholder={hasFeeRange ? `${feeLo}–${feeHi}` : 'e.g. 800'}
                  className={fieldInput}
                />
                {hasFeeRange && Number.isFinite(amt) && !feeInRange ? (
                  <p className="mt-1 text-xs text-red-600">Enter an amount between ₹{feeLo} and ₹{feeHi}.</p>
                ) : null}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Discount (max 15%)</label>
              <input
                type="number"
                min={0}
                max={15}
                step={0.5}
                value={discount}
                onChange={(e) => setDiscount(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
                className={fieldInput}
              />
            </div>
            <div>
              <label className={fieldLabel}>Session time (each visit)</label>
              <select
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className={`${fieldInput} cursor-pointer`}
              >
                {DAILY_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatBookingTimeSlot(slot)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className={`${fieldLabel} mb-3`}>Payment mode</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
                <input
                  type="radio"
                  name={`pm-${booking._id}`}
                  checked={paymentMode === 'online'}
                  onChange={() => setPaymentMode('online')}
                  className="text-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">Online</span>
                  <span className="block text-xs text-gray-500">Patient pays after approving</span>
                </span>
              </label>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
                <input
                  type="radio"
                  name={`pm-${booking._id}`}
                  checked={paymentMode === 'offline'}
                  onChange={() => setPaymentMode('offline')}
                  className="text-blue-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900">Offline</span>
                  <span className="block text-xs text-gray-500">Cash / UPI — you verify later</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Session dates</h3>
            <p className="mt-1 text-xs text-gray-500">Pick {sessions} date{sessions === 1 ? '' : 's'} — click or drag on the calendar.</p>
          </div>
          <DragSelectCalendar
            selectedDates={selectedDates}
            onDatesChange={setSelectedDates}
            minDate={today}
            maxSelectable={sessions}
          />
          {dateMismatch && (
            <p className="text-sm text-amber-800">
              Select exactly {sessions} date{sessions === 1 ? '' : 's'} (currently {selectedDates.length}).
            </p>
          )}
          {selectedDates.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-inner ring-1 ring-gray-100">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-blue-900 ring-1 ring-blue-100">
                  {selectedDates.length} / {sessions}
                </span>
              </div>
              <div className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-gray-50/80 px-3 py-2">
                <p className="text-sm leading-7 text-gray-900">
                  {[...selectedDates]
                    .sort((a, b) => a - b)
                    .map((d, i, arr) => (
                      <span key={d.getTime()}>
                        <span className="font-medium">{formatSummaryDay(d)}</span>
                        {i < arr.length - 1 && <span className="text-gray-300"> · </span>}
                      </span>
                    ))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/95 via-white to-amber-50/40 p-6 shadow-lg shadow-blue-900/5 ring-1 ring-blue-100/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-amber-400/80" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-900/90">Total for patient</p>
        <dl className="relative mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-gray-600">
            <dt>Subtotal ({sessions} × ₹{amountPerSession || '—'})</dt>
            <dd className="tabular-nums font-medium">₹{totals.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-gray-600">
            <dt>Discount ({totals.discountPct}%)</dt>
            <dd className="tabular-nums font-medium text-emerald-800">− ₹{totals.discountAmount.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-blue-200/70 pt-4 text-xl font-bold text-gray-900">
            <dt>Patient pays</dt>
            <dd className="tabular-nums text-blue-700">₹{totals.final.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" className="min-w-[200px]" disabled={!canSubmit}>
          {busy ? 'Submitting…' : 'Submit home plan'}
        </Button>
      </div>
    </form>
  )
}
