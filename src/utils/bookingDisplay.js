import { formatBookingDateAndSlot } from './date'

/** Patient-facing label for what they booked (stroke, knee pain, etc.). */
export function bookingConditionLabel(b) {
  const text = typeof b === 'string' ? b : b?.issue
  const trimmed = String(text || '').trim()
  return trimmed || null
}

/** e.g. "8 Jul, 6:00 PM – 7:00 PM (Stroke / Paralysis)" */
export function formatBookingVisitWithCondition(input) {
  if (input == null) return '—'

  const date = input.date
  const timeSlot = input.timeSlot ?? input.time
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
  if (b.serviceType === 'home') {
    if (b.homePlanPaymentMode === 'offline') return 'Offline (cash / UPI)'
    if (b.homePlanPaymentMode === 'online') return 'Online'
    return '—'
  }
  return 'Online'
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
