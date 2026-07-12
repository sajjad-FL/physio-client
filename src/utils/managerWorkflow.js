const WORKFLOW = {
  manager_assigned: {
    label: 'Visit pending',
    hint: 'Complete home assessment',
    tone: 'urgent',
  },
  assessment_done: {
    label: 'Create plan',
    hint: 'Draft treatment plan for patient',
    tone: 'urgent',
  },
  awaiting_patient_consent: {
    label: 'Awaiting consent',
    hint: 'Patient must consent to the plan',
    tone: 'waiting',
  },
  plan_live: {
    label: 'Assign physio',
    hint: 'Plan is live — assign a physiotherapist',
    tone: 'action',
  },
  pending_physio_assignment: {
    label: 'Assign physio',
    hint: 'Technique session — assign a physiotherapist',
    tone: 'action',
  },
  physio_assigned: {
    label: 'Collect payment',
    hint: 'Record cash/UPI collection if offline',
    tone: 'action',
  },
  payment_recorded: {
    label: 'In treatment',
    hint: 'Sessions in progress',
    tone: 'progress',
  },
  in_treatment: {
    label: 'In treatment',
    hint: 'Sessions in progress',
    tone: 'progress',
  },
  pending_manager_assignment: {
    label: 'Awaiting manager',
    hint: 'Waiting for manager assignment',
    tone: 'muted',
  },
}

export const MANAGER_ACTION_STATUSES = new Set([
  'manager_assigned',
  'assessment_done',
  'plan_live',
  'physio_assigned',
])

export const MANAGER_WAITING_STATUSES = new Set(['awaiting_patient_consent'])

export const MANAGER_ACTIVE_STATUSES = new Set(['payment_recorded', 'in_treatment'])

function outstandingForBooking(b) {
  const ps = b?.paymentSummary
  if (ps && Number.isFinite(Number(ps.outstanding))) {
    return Number(ps.outstanding)
  }
  const total = Number(b?.totalAmount || b?.payment?.amount || 0)
  const paid = Number(b?.totalPaid || ps?.totalPaid || 0)
  return Math.max(0, total - paid)
}

function totalPaidForBooking(b) {
  const ps = b?.paymentSummary
  if (ps && Number.isFinite(Number(ps.totalPaid))) return Number(ps.totalPaid)
  return Number(b?.totalPaid || 0)
}

/**
 * Payment-aware workflow badge for manager case list.
 */
export function isTechniqueManagedBooking(b) {
  return b?.carePath === 'technique_managed'
}

export function managerWorkflowMeta(b) {
  const outstanding = outstandingForBooking(b)
  const totalPaid = totalPaidForBooking(b)
  const ws = b?.workflowStatus

  if (isTechniqueManagedBooking(b) && (ws === 'plan_live' || !b?.physioId)) {
    if (!b?.physioId) {
      return {
        label: 'Assign physio',
        hint: 'Technique session — assign a physiotherapist',
        tone: 'action',
      }
    }
  }

  if (outstanding <= 0.009 && totalPaid > 0) {
    return {
      label: 'In treatment',
      hint: '',
      tone: 'progress',
    }
  }

  if (
    (ws === 'physio_assigned' || ws === 'payment_recorded') &&
    outstanding > 0.009 &&
    (totalPaid > 0 || b?.paymentCollectionStatus === 'partial')
  ) {
    return {
      label: `Partial payment — ₹${outstanding.toFixed(0)} pending`,
      hint: 'Record remaining cash/UPI on the case',
      tone: 'action',
    }
  }

  if (ws === 'physio_assigned' && outstanding > 0.009) {
    return {
      label: 'Collect payment',
      hint: `₹${outstanding.toFixed(0)} pending — record cash/UPI on the case`,
      tone: 'action',
    }
  }

  return (
    WORKFLOW[ws] || {
      label: ws || 'Review',
      hint: 'Open case to review next steps',
      tone: 'muted',
    }
  )
}

export function managerNeedsAction(b) {
  const ws = b?.workflowStatus
  if (isTechniqueManagedBooking(b) && !b?.physioId) return true
  if (!MANAGER_ACTION_STATUSES.has(ws)) {
    if (ws === 'payment_recorded' && outstandingForBooking(b) > 0.009) {
      return true
    }
    return false
  }
  if (ws === 'physio_assigned' && outstandingForBooking(b) <= 0.009 && totalPaidForBooking(b) > 0) {
    return false
  }
  return true
}

export function managerMatchesFilter(b, filterId) {
  const ws = b?.workflowStatus
  if (filterId === 'all') return true
  if (filterId === 'action') return managerNeedsAction(b)
  if (filterId === 'waiting') return MANAGER_WAITING_STATUSES.has(ws)
  if (filterId === 'active') {
    return MANAGER_ACTIVE_STATUSES.has(ws) || (outstandingForBooking(b) <= 0.009 && totalPaidForBooking(b) > 0)
  }
  return true
}

export function managerOutstanding(b) {
  return outstandingForBooking(b)
}

/** @param {object} b @param {{ workflow?: string, date?: string }} filters */
export function matchesManagerListFilters(b, filters) {
  if (!managerMatchesFilter(b, filters?.workflow || 'all')) return false

  const dateFilter = filters?.date || 'all'
  if (dateFilter === 'all') return true

  const d = String(b?.date || '')
  if (!d) return false

  const today = new Date()
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  if (dateFilter === 'today') return d === t
  if (dateFilter === 'upcoming') return d > t
  if (dateFilter === 'past') return d < t
  return true
}

/** Lower tier = higher in the list. */
export function managerCaseSortTier(b) {
  const ws = b?.workflowStatus
  const outstanding = outstandingForBooking(b)
  const totalPaid = totalPaidForBooking(b)
  const planLive = b?.planStatus === 'live' || b?.planStatus === 'approved'

  if (planLive && outstanding > 0.009) return 1
  if (isTechniqueManagedBooking(b) && !b?.physioId) return 1
  if (ws === 'manager_assigned') return 2
  if (ws === 'assessment_done') return 3
  if (ws === 'plan_live') return 4
  if (ws === 'physio_assigned' && managerNeedsAction(b)) return 5
  if (MANAGER_WAITING_STATUSES.has(ws)) return 50
  if (MANAGER_ACTIVE_STATUSES.has(ws) || (outstanding <= 0.009 && totalPaid > 0)) return 80
  return 100
}

/** @param {object} a @param {object} b */
export function compareManagerCases(a, b) {
  const tierA = managerCaseSortTier(a)
  const tierB = managerCaseSortTier(b)
  if (tierA !== tierB) return tierA - tierB

  const outA = managerOutstanding(a)
  const outB = managerOutstanding(b)
  if (outA !== outB) return outB - outA

  const dateA = String(a?.date || '')
  const dateB = String(b?.date || '')
  if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB)

  const updatedA = String(a?.updatedAt || '')
  const updatedB = String(b?.updatedAt || '')
  return updatedB.localeCompare(updatedA)
}

export { WORKFLOW as MANAGER_WORKFLOW }
