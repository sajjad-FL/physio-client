import { useEffect, useMemo, useState } from 'react'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingTimeSlot } from '../../utils/date'
import Button from '../ui/Button'
import DragSelectCalendar from './DragSelectCalendar'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'
import { paymentAmountLabel } from '../../utils/bookingDisplay.js'
import { usePricingSettings } from '../../hooks/usePricingSettings'

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

/**
 * Parse a YYYY-MM-DD booking date into a local midnight Date, but only return
 * it if it's today or in the future — past primary sessions shouldn't pre-fill
 * the calendar as a plan session.
 */
function parseBookingPrimaryDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d.getTime() >= today.getTime() ? d : null
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
  const { settings: pricingSettings } = usePricingSettings()
  const allowedSessionCounts = pricingSettings.allowedPlanSessionCounts?.length
    ? pricingSettings.allowedPlanSessionCounts
    : [7, 15, 30]
  const maxDiscountPercent = Number(pricingSettings.homePlanMaxDiscountPercent) || 15
  const tierBySessions = useMemo(() => {
    const map = new Map()
    for (const tier of pricingSettings.planTiers || []) {
      map.set(Number(tier.sessions), tier)
    }
    return map
  }, [pricingSettings.planTiers])

  const defaultSessionCount = allowedSessionCounts[0] ?? 7
  const defaultTierDiscount = Number(tierBySessions.get(defaultSessionCount)?.defaultDiscountPercent) || 0

  const defaultSlot =
    booking?.timeSlot && DAILY_SLOTS.includes(booking.timeSlot) ? booking.timeSlot : DAILY_SLOTS[0]
  const defaultAmount = booking?.physioId?.pricePerSession != null ? String(booking.physioId.pricePerSession) : ''
  const physio = booking?.physioId
  const feeLo = Number(physio?.pricePerSession)
  const fixedFee = Number.isFinite(feeLo) && feeLo > 0
  const defaultPrimaryDate = useMemo(
    () => parseBookingPrimaryDate(booking?.date),
    [booking?.date],
  )

  const [sessions, setSessions] = useState(defaultSessionCount)
  const [amountPerSession, setAmountPerSession] = useState(defaultAmount)
  const [discount, setDiscount] = useState(defaultTierDiscount)
  const [sessionTime, setSessionTime] = useState(defaultSlot)
  const [paymentMode, setPaymentMode] = useState('online')
  const [selectedDates, setSelectedDates] = useState(() =>
    defaultPrimaryDate ? [defaultPrimaryDate] : [],
  )

  const defaultPrimaryDateKey = defaultPrimaryDate ? defaultPrimaryDate.getTime() : null

  useEffect(() => {
    setAmountPerSession(defaultAmount)
    setSessionTime(defaultSlot)
    setSelectedDates(defaultPrimaryDate ? [defaultPrimaryDate] : [])
    setSessions(defaultSessionCount)
    setDiscount(defaultTierDiscount)
  }, [booking._id, defaultAmount, defaultSlot, defaultPrimaryDate, defaultPrimaryDateKey, defaultSessionCount, defaultTierDiscount])

  function handleSessionsChange(nextRaw) {
    const next = Number(nextRaw)
    if (!allowedSessionCounts.includes(next)) return
    setSessions(next)
    const tier = tierBySessions.get(next)
    if (tier != null && tier.defaultDiscountPercent != null) {
      setDiscount(Math.min(maxDiscountPercent, Math.max(0, Number(tier.defaultDiscountPercent) || 0)))
    }
  }

  useEffect(() => {
    setSelectedDates((prev) => {
      if (prev.length <= sessions) return prev
      const sorted = [...prev].sort((a, b) => a - b)
      return sorted.slice(0, sessions)
    })
  }, [sessions])

  const perVisitTravel = useMemo(
    () => round2(Math.max(0, Number(booking?.distanceSurchargeAmount) || 0)),
    [booking?._id, booking?.distanceSurchargeAmount],
  )

  const totals = useMemo(() => {
    const n = Number(amountPerSession)
    const s = Number(sessions) || 0
    const d = Math.min(maxDiscountPercent, Math.max(0, Number(discount) || 0))
    if (!Number.isFinite(n) || n <= 0 || s < 1) {
      return {
        subtotal: 0,
        discountAmount: 0,
        linePerSession: 0,
        discountPct: d,
        patientPays: 0,
      }
    }
    const linePerSession = round2(n + perVisitTravel)
    const subtotal = round2(s * linePerSession)
    const discountAmount = round2(subtotal * (d / 100))
    const patientPays = round2(subtotal - discountAmount)
    return { subtotal, discountAmount, linePerSession, discountPct: d, patientPays }
  }, [amountPerSession, sessions, discount, perVisitTravel, maxDiscountPercent])

  const showAssignmentPricing = Boolean(
    booking &&
      (booking.totalAmount != null ||
        booking.distanceKmAtAssign != null ||
        Number(booking.distanceSurchargeAmount) > 0),
  )

  const dateMismatch = selectedDates.length !== Number(sessions)
  const amt = Number(amountPerSession)
  const feeOk = !fixedFee || amt === feeLo
  const canSubmit =
    allowedSessionCounts.includes(Number(sessions)) &&
    Number(amountPerSession) > 0 &&
    feeOk &&
    !dateMismatch &&
    totals.patientPays > 0 &&
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
                <select
                  value={sessions}
                  onChange={(e) => handleSessionsChange(e.target.value)}
                  className={`${fieldInput} cursor-pointer`}
                >
                  {allowedSessionCounts.map((count) => {
                    const tier = tierBySessions.get(count)
                    const label = tier?.label || `${count} sessions`
                    return (
                      <option key={count} value={count}>
                        {label} ({count} sessions)
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Amount per session (₹)</label>
                {physio && fixedFee ? (
                  <p className="mb-2 text-xs text-gray-600">
                    Fixed session rate: {formatPhysioSessionFeeLabel(physio)}
                    {perVisitTravel > 0 ? (
                      <span className="mt-1 block text-gray-700">
                        Assignment distance surcharge (₹{perVisitTravel.toFixed(2)} per home visit) is included in
                        amount per session and multiplied by the number of sessions.
                      </span>
                    ) : (
                      <span className="mt-1 block text-gray-600">Shown amount is what the patient pays per session.</span>
                    )}
                  </p>
                ) : perVisitTravel > 0 ? (
                  <p className="mb-2 text-xs text-gray-600">
                    Assignment distance surcharge ₹{perVisitTravel.toFixed(2)} per home visit is added to each
                    session in the total below.
                  </p>
                ) : null}
                <input
                  type="number"
                  min={fixedFee ? feeLo : 1}
                  max={fixedFee ? round2(feeLo + perVisitTravel) : undefined}
                  step={1}
                  value={fixedFee ? String(round2(feeLo + perVisitTravel)) : amountPerSession}
                  onChange={(e) => setAmountPerSession(e.target.value)}
                  placeholder={fixedFee ? String(feeLo) : 'e.g. 800'}
                  readOnly={fixedFee}
                  className={`${fieldInput}${fixedFee ? ' cursor-not-allowed bg-gray-50 text-gray-700' : ''}`}
                />
                {fixedFee && Number.isFinite(amt) && !feeOk ? (
                  <p className="mt-1 text-xs text-red-600">Per-session amount must match your fixed rate of ₹{feeLo}.</p>
                ) : null}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Discount (max {maxDiscountPercent}%)</label>
              <input
                type="number"
                min={0}
                max={maxDiscountPercent}
                step={0.5}
                value={discount}
                onChange={(e) =>
                  setDiscount(Math.min(maxDiscountPercent, Math.max(0, Number(e.target.value) || 0)))
                }
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

      {showAssignmentPricing && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 px-5 py-4 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100/80">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900/90">Current booking (after assignment)</p>
          <p className="mt-1 text-xs text-amber-900/75">
            What the patient owes for this booking at assignment (often one visit). The blue total is your proposed plan:
            each scheduled home visit uses the same distance surcharge as at assignment.
          </p>
          <dl className="mt-3 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-amber-900/80">Distance at assign</dt>
              <dd className="font-medium tabular-nums text-amber-950">
                {booking.distanceKmAtAssign != null
                  ? `${Number(booking.distanceKmAtAssign) < 10 ? Number(booking.distanceKmAtAssign).toFixed(1) : Math.round(Number(booking.distanceKmAtAssign))} km`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-amber-900/80">Distance surcharge (per home visit)</dt>
              <dd className="font-medium tabular-nums text-amber-950">
                ₹{Number(booking.distanceSurchargeAmount || 0).toFixed(2)}
                {Number(booking.distanceExtraKm || 0) > 0 && Number(booking.distanceSurchargePerKm || 0) > 0
                  ? ` (${Number(booking.distanceExtraKm)} km × ₹${Number(booking.distanceSurchargePerKm)}/km)`
                  : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-amber-200/80 pt-2 font-semibold text-amber-950">
              <dt>Total on booking</dt>
              <dd className="tabular-nums">{paymentAmountLabel(booking)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/95 via-white to-amber-50/40 p-6 shadow-lg shadow-blue-900/5 ring-1 ring-blue-100/60">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-amber-400/80" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-900/90">Total for patient</p>
        <dl className="relative mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-gray-600">
            <dt>
              Subtotal ({sessions} × ₹{totals.linePerSession > 0 ? totals.linePerSession.toFixed(2) : amountPerSession || '—'})
            </dt>
            <dd className="tabular-nums font-medium">₹{totals.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-gray-600">
            <dt>Discount ({totals.discountPct}%)</dt>
            <dd className="tabular-nums font-medium text-emerald-800">− ₹{totals.discountAmount.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-blue-200/70 pt-4 text-xl font-bold text-gray-900">
            <dt>Patient pays</dt>
            <dd className="tabular-nums text-blue-700">₹{totals.patientPays.toFixed(2)}</dd>
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
