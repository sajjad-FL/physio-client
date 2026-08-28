import { formatBookingDateAndSlot } from './date'
import { hasComplimentaryAssessmentVisit, toBookingYmd } from '../components/physio/physioBookingHelpers'

/** Patient-facing label for what they booked (stroke, knee pain, etc.). */
export function bookingConditionLabel(b) {
  const text = typeof b === 'string' ? b : b?.issue
  const trimmed = String(text || '').trim()
  return trimmed || null
}

/**
 * Date/time for booking cards and headers.
 * When a multi-visit schedule exists, use the chronologically first visit —
 * booking.date can be stale (array index 0 after reschedule / duplicates).
 */
export function resolveBookingDisplayVisit(b) {
  if (!b || typeof b !== 'object') return { date: undefined, time: undefined }
  if (Array.isArray(b.schedule) && b.schedule.length > 0) {
    const sorted = [...b.schedule].sort((a, c) => {
      const byDate = String(a?.date || '').localeCompare(String(c?.date || ''))
      if (byDate !== 0) return byDate
      return String(a?.time || '').localeCompare(String(c?.time || ''))
    })
    const first = sorted[0]
    return {
      date: first?.date || b.date,
      time: first?.time || b.timeSlot,
    }
  }
  return { date: b.date, time: b.timeSlot }
}

/**
 * Next visit for physio headers: first incomplete schedule session
 * (skip completed / no-show). If all are done, falls back to the last schedule
 * date, then booking.date.
 */
export function resolveBookingUpcomingVisit(b) {
  if (!b || typeof b !== 'object') return { date: undefined, time: undefined }

  if (Array.isArray(b.schedule) && b.schedule.length > 0) {
    const pending = b.schedule
      .filter((s) => s && s.status !== 'completed' && s.status !== 'no_show' && s.date)
      .sort((a, c) => {
        const byDate = String(a.date || '').localeCompare(String(c.date || ''))
        if (byDate !== 0) return byDate
        return String(a.time || '').localeCompare(String(c.time || ''))
      })
    if (pending.length > 0) {
      return { date: pending[0].date, time: pending[0].time || b.timeSlot }
    }
    const last = [...b.schedule]
      .filter((s) => s?.date)
      .sort((a, c) => String(a.date || '').localeCompare(String(c.date || '')))
      .at(-1)
    if (last) return { date: last.date, time: last.time || b.timeSlot }
  }

  return { date: b.date, time: b.timeSlot }
}

/**
 * Manager case header: complimentary assessment lives on booking.date / timeSlot
 * (separate from treatment schedule[]). Always prefer that assessment slot.
 * If a past treatment reschedule overwrote booking.date, recover from previousDate
 * when it still sits before the treatment plan.
 */
export function resolveBookingAssessmentVisit(b) {
  if (!b || typeof b !== 'object') return { date: undefined, time: undefined }

  let date = b.date
  let time = b.timeSlot

  if (hasComplimentaryAssessmentVisit(b) && Array.isArray(b.schedule) && b.schedule.length > 0) {
    const scheduleYmds = b.schedule
      .map((s) => toBookingYmd(s?.date))
      .filter(Boolean)
      .sort()
    const dateYmd = toBookingYmd(date)
    if (dateYmd && scheduleYmds.includes(dateYmd) && b.previousDate) {
      const prev = toBookingYmd(b.previousDate)
      if (prev && prev < scheduleYmds[0]) {
        date = b.previousDate
        time = b.previousTimeSlot || time
      }
    }
  }

  return { date, time }
}

/** e.g. "8 Jul, 6:00 PM – 7:00 PM (Stroke / Paralysis)" */
export function formatBookingVisitWithCondition(input) {
  if (input == null) return '—'

  const slot = resolveBookingDisplayVisit(input.booking && input.date == null ? input.booking : input)
  const date = slot.date ?? input.date
  const timeSlot = slot.time ?? input.timeSlot ?? input.time
  const conditionSource = input.booking ?? input
  const visit = formatBookingDateAndSlot(date, timeSlot)
  const condition = bookingConditionLabel(conditionSource)

  if (!visit && !condition) return '—'
  if (!condition) return visit
  if (!visit) return `(${condition})`
  return `${visit} (${condition})`
}

export function paymentAmountLabel(b) {
  if (b.totalAmount != null && Number(b.totalAmount) > 0) {
    return `₹${Number(b.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (b.amountPaise != null && Number(b.amountPaise) > 0) {
    return `₹${(Number(b.amountPaise) / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  return '—'
}

/** Human-readable booking ID e.g. `2026-101`, or null if not assigned yet. */
export function formatBookingCode(b) {
  const code = typeof b === 'string' ? b : b?.bookingCode
  const trimmed = String(code || '').trim()
  return trimmed || null
}

/** Compact label for cards: `#2026-101` or empty string. */
export function bookingCodeBadge(b) {
  const code = formatBookingCode(b)
  return code ? `#${code}` : ''
}

export function paymentModeLabel(b) {
  if (b.serviceType === 'clinic') {
    return 'Clinic (cash / UPI)'
  }
  if (b.serviceType === 'home') {
    if (b.homePlanPaymentMode === 'offline') return 'Offline (cash / UPI)'
    if (b.homePlanPaymentMode === 'online') return 'Online'
    return '—'
  }
  return 'Online'
}

/** Short service-type label for lists and badges. */
export function serviceTypeLabel(serviceType) {
  if (serviceType === 'online') return 'Online'
  if (serviceType === 'clinic') return 'Clinic'
  return 'Home'
}

export function billingTypeLabel(b) {
  if (b.serviceType !== 'home' || !b.homePlanBillingType) return null
  if (b.homePlanBillingType === 'full') return 'Full payment'
  if (b.homePlanBillingType === 'installment') return 'Installment'
  return null
}

export function formatPaidAt(b) {
  const raw = b.paidAt || b.heldAt
  if (!raw) return null
  try {
    return new Date(raw).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export function paymentStatusLabel(ps) {
  const m = {
    pending: 'Pending',
    held: 'Payment secured',
    released: 'Released',
    refunded: 'Refunded',
  }
  return m[ps] || ps || '—'
}

/** Marketplace `booking.payment.status` (patient ↔ physio ↔ admin). */
export function marketplacePaymentStatusLabel(status) {
  const m = {
    pending: 'Awaiting payment',
    paid: 'Paid (online)',
    collected: 'Collected (pending admin)',
    verified: 'Verified (offline)',
    refunded: 'Refunded',
  }
  return m[status] || status || '—'
}

export function sessionStatusLabel(b) {
  if (b.sessionStatus === 'completed') return 'Completed'
  if (b.rescheduled) return 'Rescheduled'
  return 'Scheduled'
}

/** Combined label for list cards (date + timeSlot or schedule row) */
export function formatSessionLine(date, time) {
  return formatBookingDateAndSlot(date, time)
}
