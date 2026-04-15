export function bookingStatusBadge(status, sessionStatus, paymentStatus) {
  if (paymentStatus === 'refunded') {
    return { label: 'Dispute / refunded', cls: 'bg-rose-50 text-rose-900 ring-rose-200/80' }
  }
  if (status === 'completed' && sessionStatus === 'completed' && paymentStatus === 'released') {
    return { label: 'Completed', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' }
  }
  if (status === 'completed') {
    return { label: 'Session done', cls: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' }
  }
  if (status === 'assigned') {
    return { label: 'Assigned', cls: 'bg-brand-soft text-brand ring-brand/25' }
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
