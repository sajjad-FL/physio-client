import { useEffect, useMemo, useState } from 'react'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../../utils/date'
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

/** Parse YYYY-MM-DD to local midnight Date (any date, including past). */
function parseYmdLocalDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function formatSummaryDay(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function existingPlanDefaults(booking, { allowCustomFee, allowedSessionCounts, defaultSessionCount, defaultSlot, defaultAmount }) {
  const hasExistingPlan =
    Number(booking?.sessions) > 0 &&
    Array.isArray(booking?.schedule) &&
    booking.schedule.length > 0

  if (!hasExistingPlan) {
    const primaryDate = allowCustomFee ? null : parseBookingPrimaryDate(booking?.date)
    return {
      sessions: defaultSessionCount,
      amountPerSession: defaultAmount,
      billingType: 'installment',
      paymentMode: 'offline',
      sessionTime: defaultSlot,
      selectedDates: primaryDate ? [primaryDate] : [],
      isEditing: false,
    }
  }

  const scheduleDates = booking.schedule
    .map((s) => parseYmdLocalDate(s?.date))
    .filter(Boolean)
    .sort((a, b) => a - b)
  const firstTime = booking.schedule[0]?.time
  const sessionTime = firstTime && DAILY_SLOTS.includes(firstTime) ? firstTime : defaultSlot
  const sessionCount = Number(booking.sessions)
  const amount =
    booking.amountPerSession != null && Number.isFinite(Number(booking.amountPerSession))
      ? String(booking.amountPerSession)
      : defaultAmount

  return {
    sessions: allowedSessionCounts.includes(sessionCount) ? sessionCount : defaultSessionCount,
    amountPerSession: amount,
    billingType: booking.homePlanBillingType === 'full' ? 'full' : 'installment',
    paymentMode: booking.homePlanPaymentMode === 'online' ? 'online' : 'offline',
    sessionTime,
    selectedDates: scheduleDates,
    isEditing: true,
  }
}

const fieldLabel = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500'
const fieldInput =
  'w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:py-3'

/**
 * @param {object} props
 * @param {object} props.booking — booking row with timeSlot, physioId
 * @param {boolean} props.busy
 * @param {boolean} [props.allowCustomFee] — manager flow: patient price is editable (≥ physio rate + manager commission) instead of locked to the physio rate
 * @param {string} [props.submitLabel] — override submit button label
 * @param {boolean} [props.embedded] — nested inside another panel (manager case detail); lighter padding, no double card chrome
 * @param {(payload: { sessions: number, amountPerSession: number, discountPercent: number, billingType: 'full'|'installment', paymentMode: 'online'|'offline', schedule: { date: string, time: string }[] }) => void} props.onSubmit
 */
export default function HomePlanForm({
  booking,
  busy,
  onSubmit,
  allowCustomFee = false,
  submitLabel,
  embedded = false,
}) {
  const { settings: pricingSettings, reload: reloadPricingSettings } = usePricingSettings()
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

  const tierFullPaymentDiscount = (sessionCount) => {
    const tier = tierBySessions.get(Number(sessionCount))
    const raw = Number(tier?.defaultDiscountPercent)
    if (!Number.isFinite(raw) || raw < 0) return 0
    return Math.round(raw * 100) / 100
  }

  const resolveDiscount = (sessionCount, type) =>
    type === 'full' ? tierFullPaymentDiscount(sessionCount) : 0

  const defaultSlot =
    booking?.timeSlot && DAILY_SLOTS.includes(booking.timeSlot) ? booking.timeSlot : DAILY_SLOTS[0]
  const physio = booking?.physioId
  const feeLo = Number(physio?.pricePerSession)
  const hasPhysioRate = Number.isFinite(feeLo) && feeLo > 0
  /** Physio flow: fee locked to own rate. Manager flow (allowCustomFee): editable with a floor. */
  const fixedFee = hasPhysioRate && !allowCustomFee
  const managerCommission = allowCustomFee
    ? Number(pricingSettings.managerCommissionPerSessionRupees) || 0
    : 0
  const minFee = allowCustomFee && hasPhysioRate ? round2(feeLo + managerCommission) : null
  const defaultAmount =
    minFee != null ? String(minFee) : hasPhysioRate ? String(feeLo) : ''
  const assessmentDateForBlock = useMemo(() => {
    if (!allowCustomFee || !booking?.date) return null
    return parseYmdLocalDate(booking.date)
  }, [allowCustomFee, booking?.date])
  const disabledCalendarDates = useMemo(
    () => (assessmentDateForBlock ? [assessmentDateForBlock] : []),
    [assessmentDateForBlock],
  )
  const assessmentDateYmd = allowCustomFee ? String(booking?.date || '').trim() : ''

  const planDefaults = useMemo(
    () =>
      existingPlanDefaults(booking, {
        allowCustomFee,
        allowedSessionCounts,
        defaultSessionCount,
        defaultSlot,
        defaultAmount,
      }),
    [
      booking?._id,
      booking?.sessions,
      booking?.schedule,
      booking?.amountPerSession,
      booking?.homePlanBillingType,
      booking?.homePlanPaymentMode,
      allowCustomFee,
      allowedSessionCounts,
      defaultSessionCount,
      defaultSlot,
      defaultAmount,
    ],
  )

  const [sessions, setSessions] = useState(planDefaults.sessions)
  const [amountPerSession, setAmountPerSession] = useState(planDefaults.amountPerSession)
  const [billingType, setBillingType] = useState(planDefaults.billingType)
  const [sessionTime, setSessionTime] = useState(planDefaults.sessionTime)
  const [paymentMode, setPaymentMode] = useState(planDefaults.paymentMode)
  const [selectedDates, setSelectedDates] = useState(planDefaults.selectedDates)

  const discount = useMemo(
    () => resolveDiscount(sessions, billingType),
    [sessions, billingType, tierBySessions, maxDiscountPercent],
  )

  useEffect(() => {
    reloadPricingSettings()
  }, [reloadPricingSettings])

  useEffect(() => {
    setAmountPerSession(planDefaults.amountPerSession)
    setSessionTime(planDefaults.sessionTime)
    setSelectedDates(planDefaults.selectedDates)
    setSessions(planDefaults.sessions)
    setBillingType(planDefaults.billingType)
    setPaymentMode(planDefaults.paymentMode)
  }, [booking._id, planDefaults])

  function handleDatesChange(updater) {
    setSelectedDates((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (!assessmentDateYmd) return next
      return next.filter((d) => toYMD(d) !== assessmentDateYmd)
    })
  }

  function handleSessionsChange(nextRaw) {
    const next = Number(nextRaw)
    if (!allowedSessionCounts.includes(next)) return
    setSessions(next)
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
    const d = billingType === 'full' ? Math.max(0, Number(discount) || 0) : 0
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
  }, [amountPerSession, sessions, discount, billingType, perVisitTravel])

  const showAssignmentPricing = Boolean(
    booking &&
      (booking.totalAmount != null ||
        booking.distanceKmAtAssign != null ||
        Number(booking.distanceSurchargeAmount) > 0),
  )

  const dateMismatch = selectedDates.length !== Number(sessions)
  const amt = Number(amountPerSession)
  const feeOk = fixedFee ? amt === feeLo : minFee == null || amt >= minFee
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
      billingType,
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
    <form
      onSubmit={handleSubmit}
      className={`min-w-0 max-w-full ${embedded ? 'space-y-5 sm:space-y-6' : 'space-y-8'}`}
    >
      <div className={`grid min-w-0 max-w-full ${embedded ? 'gap-5' : 'gap-8 lg:grid-cols-2 lg:items-start'}`}>
        <div
          className={
            embedded
              ? 'min-w-0 space-y-4'
              : 'space-y-6 rounded-2xl border border-gray-100 bg-gray-50/40 p-4 shadow-sm ring-1 ring-gray-100/80 sm:p-5 lg:p-6'
          }
        >
          {!embedded ? <h3 className="text-sm font-semibold text-gray-900">Plan details</h3> : null}
          <div className={`grid min-w-0 ${embedded ? 'gap-4' : 'gap-5'}`}>
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
              <p className={`${fieldLabel} mb-3`}>Payment type</p>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-blue-200 sm:items-center sm:gap-3 sm:px-4 sm:py-3 has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
                  <input
                    type="radio"
                    name={`bt-${booking._id}`}
                    checked={billingType === 'full'}
                    onChange={() => setBillingType('full')}
                    className="text-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">Full payment</span>
                    <span className="block text-xs text-gray-500">Patient pays entire plan upfront — admin discount applies</span>
                  </span>
                </label>
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-blue-200 sm:items-center sm:gap-3 sm:px-4 sm:py-3 has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
                  <input
                    type="radio"
                    name={`bt-${booking._id}`}
                    checked={billingType === 'installment'}
                    onChange={() => setBillingType('installment')}
                    className="text-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">Installment</span>
                    <span className="block text-xs text-gray-500">Pay over time per milestones — no discount</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <p className={`${fieldLabel} mb-3`}>Payment mode</p>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-blue-200 sm:items-center sm:gap-3 sm:px-4 sm:py-3 has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
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
                <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-blue-200 sm:items-center sm:gap-3 sm:px-4 sm:py-3 has-[:checked]:border-blue-500 has-[:checked]:ring-2 has-[:checked]:ring-blue-500/20">
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
              </div>
            </div>

            <div className={embedded ? 'space-y-4' : 'grid gap-5 sm:grid-cols-2'}>
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
                ) : null}
                {!fixedFee && allowCustomFee ? (
                  <p className="mb-2 text-xs text-gray-600">
                    {minFee != null
                      ? `Patient price per session — at least ₹${minFee} (physiotherapist rate ₹${feeLo}` +
                        (managerCommission > 0 ? ` + manager commission ₹${managerCommission}` : '') +
                        ').'
                      : 'Patient price per session. When you assign a physiotherapist later, this must cover their rate' +
                        (managerCommission > 0 ? ` plus the ₹${managerCommission} manager commission` : '') +
                        '.'}
                  </p>
                ) : null}
                {!fixedFee && perVisitTravel > 0 ? (
                  <p className="mb-2 text-xs text-gray-600">
                    Assignment distance surcharge ₹{perVisitTravel.toFixed(2)} per home visit is added to each
                    session in the total below.
                  </p>
                ) : null}
                <input
                  type="number"
                  min={fixedFee ? feeLo : minFee ?? 1}
                  max={fixedFee ? round2(feeLo + perVisitTravel) : undefined}
                  step={1}
                  value={fixedFee ? String(round2(feeLo + perVisitTravel)) : amountPerSession}
                  onChange={(e) => setAmountPerSession(e.target.value)}
                  placeholder={fixedFee ? String(feeLo) : minFee != null ? String(minFee) : 'e.g. 800'}
                  readOnly={fixedFee}
                  className={`${fieldInput}${fixedFee ? ' cursor-not-allowed bg-gray-50 text-gray-700' : ''}`}
                />
                {fixedFee && Number.isFinite(amt) && !feeOk ? (
                  <p className="mt-1 text-xs text-red-600">Per-session amount must match your fixed rate of ₹{feeLo}.</p>
                ) : null}
                {!fixedFee && minFee != null && Number.isFinite(amt) && amt > 0 && !feeOk ? (
                  <p className="mt-1 text-xs text-red-600">
                    Must be at least ₹{minFee} to cover the physiotherapist rate
                    {managerCommission > 0 ? ' and manager commission' : ''}.
                  </p>
                ) : null}
              </div>
              <div>
                <label className={fieldLabel}>Discount (max {maxDiscountPercent}%)</label>
                <input
                  type="number"
                  min={0}
                  max={maxDiscountPercent}
                  step={0.5}
                  value={discount}
                  readOnly
                  className={`${fieldInput} cursor-not-allowed bg-gray-50 text-gray-700`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {billingType === 'full'
                    ? 'Set by admin for full payment on this plan length.'
                    : 'Installment plans have no discount.'}
                </p>
              </div>
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
        </div>

        <div className={`min-w-0 space-y-4 ${embedded ? 'border-t border-slate-200/80 pt-5' : ''}`}>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Treatment session dates</h3>
            <p className="mt-1 text-xs text-gray-500">
              Pick {sessions} treatment date{sessions === 1 ? '' : 's'} — click or drag on the calendar.
            </p>
          </div>
          {allowCustomFee && booking?.date ? (
            <div className="rounded-xl border border-teal-200/90 bg-teal-50/60 px-3 py-2.5 text-sm text-teal-950 ring-1 ring-teal-100/80 sm:px-4 sm:py-3">
              <p>
                Assessment visit on{' '}
                <span className="font-semibold">{formatBookingDateAndSlot(booking.date, booking.timeSlot)}</span>{' '}
                is <span className="font-semibold">complimentary</span> (Care Manager). Select{' '}
                <span className="font-semibold">{sessions}</span> treatment session date
                {sessions === 1 ? '' : 's'} for the physiotherapist below.
              </p>
            </div>
          ) : null}
          <DragSelectCalendar
            selectedDates={selectedDates}
            onDatesChange={handleDatesChange}
            minDate={today}
            maxSelectable={sessions}
            disabledDates={disabledCalendarDates}
          />
          {dateMismatch && (
            <p className="text-sm text-amber-800">
              Select exactly {sessions} treatment date{sessions === 1 ? '' : 's'} (currently {selectedDates.length}).
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
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 px-3 py-3 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100/80 sm:px-5 sm:py-4">
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

      <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/95 via-white to-amber-50/40 p-4 shadow-lg shadow-blue-900/5 ring-1 ring-blue-100/60 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-amber-400/80" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wide text-blue-900/90">Total for patient</p>
        <dl className="relative mt-3 space-y-2.5 text-sm sm:mt-4 sm:space-y-3">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 text-gray-600">
            <dt className="min-w-0">
              Subtotal ({sessions} × ₹{totals.linePerSession > 0 ? totals.linePerSession.toFixed(2) : amountPerSession || '—'})
            </dt>
            <dd className="shrink-0 tabular-nums font-medium">₹{totals.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 text-gray-600">
            <dt>Discount ({totals.discountPct}%)</dt>
            <dd className="shrink-0 tabular-nums font-medium text-emerald-800">− ₹{totals.discountAmount.toFixed(2)}</dd>
          </div>
          <div className="type-stat flex flex-col gap-0.5 border-t border-blue-200/70 pt-3 text-gray-900 sm:flex-row sm:justify-between sm:gap-4 sm:pt-4">
            <dt>Patient pays</dt>
            <dd className="shrink-0 tabular-nums text-lg text-blue-700 sm:text-base">₹{totals.patientPays.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-3 pb-1">
        <Button
          type="submit"
          variant="primary"
          className="w-full sm:min-w-[200px] sm:w-auto"
          disabled={!canSubmit}
        >
          {busy
            ? 'Submitting…'
            : submitLabel || (planDefaults.isEditing ? 'Update home plan' : 'Submit home plan')}
        </Button>
      </div>
    </form>
  )
}
