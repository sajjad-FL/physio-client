export function bookingStatusBadge(status, sessionStatus, paymentStatus, planStatus) {
  if (paymentStatus === 'refunded') {
    return { label: 'Refunded', cls: 'bg-rose-50 text-rose-900 ring-rose-200/80' }
  }
  if (status === 'completed' || sessionStatus === 'completed') {
    return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' }
  }
  if (planStatus === 'proposed') {
    return { label: 'Approve Plan', cls: 'bg-orange-50 text-orange-950 ring-orange-200/80' }
  }
  if (paymentStatus === 'pending' && (planStatus === 'approved' || status === 'assigned')) {
    return { label: 'Pay Installment', cls: 'bg-amber-50 text-amber-950 ring-amber-200/80' }
  }
  if (status === 'scheduled' || status === 'accepted' || sessionStatus === 'scheduled') {
    return { label: 'Scheduled', cls: 'bg-teal-50 text-teal-900 ring-teal-200/80' }
  }
  if (status === 'assigned') {
    return { label: 'Therapist Assigned', cls: 'bg-sky-50 text-sky-900 ring-sky-200/80' }
  }
  if (status === 'pending') {
    return { label: 'Finding Therapist', cls: 'bg-slate-50 text-slate-700 ring-slate-200/80' }
  }
  return { label: 'Pending', cls: 'bg-amber-50 text-amber-900 ring-amber-200/80' }
}

export function paymentBadge(paymentStatus) {
  const map = {
    pending: { label: 'Payment pending', cls: 'bg-amber-50 text-amber-900 ring-amber-200/80' },
    held: { label: 'Payment secured', cls: 'bg-sky-50 text-sky-900 ring-sky-200/80' },
    released: { label: 'Released', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' },
    refunded: { label: 'Refunded', cls: 'bg-rose-50 text-rose-900 ring-rose-200/80' },
  }
  return map[paymentStatus] || { label: paymentStatus || '—', cls: 'bg-canvas text-ink-muted ring-border-subtle' }
}

export function disputeStatusBadge(status) {
  const map = {
    open: { label: 'Open', cls: 'bg-amber-50 text-amber-900 ring-amber-200/80' },
    under_review: { label: 'Under review', cls: 'bg-sky-50 text-sky-900 ring-sky-200/80' },
    resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' },
    rejected: { label: 'Rejected', cls: 'bg-ink/5 text-ink-muted ring-border-subtle' },
  }
  return map[status] || { label: status, cls: 'bg-canvas text-ink-muted ring-border-subtle' }
}
