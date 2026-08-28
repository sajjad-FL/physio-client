import { bookingStatusBadge, paymentBadge } from '../pages/dashboard/dashboardUtils'
import { paymentAmountLabel } from './bookingDisplay'
import { isAwaitingPatientConsent, isPlanLive } from './planStatus'

function badgeToneFromStatus(st) {
  const label = st.label
  if (label === 'Completed' || label === 'Plan Active') return 'progress'
  if (label === 'Consent to Plan') return 'waiting'
  if (label === 'Awaiting care team' || label === 'Pending') return 'muted'
  if (label === 'Awaiting Payment' || label === 'Pay Installment') return 'urgent'
  return 'action'
}

export function patientWorkflowMeta(b) {
  const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus, b.planStatus)
  return {
    label: st.label,
    tone: badgeToneFromStatus(st),
    cls: st.cls,
  }
}

/** @typedef {'done' | 'current' | 'waiting' | 'upcoming'} StepState */

/**
 * @param {object} ctx
 * @returns {Array<{ id: string, num: number, label: string, hint: string, state: StepState }>}
 */
export function buildPatientWorkflowSteps(ctx) {
  const {
    b,
    isOnline,
    planLive,
    awaitingConsent,
    assessmentDone,
    careTeamActive,
    hasPhysio,
    hasPlan,
    outstanding,
    totalPaid,
    sessionsComplete,
    needsSessionConfirm,
  } = ctx

  if (isOnline) {
    return [
      {
        id: 'team',
        num: 1,
        label: 'Booking',
        hint: hasPhysio ? b.physioId?.name || 'Physio assigned' : 'Confirming',
        state: hasPhysio || b.status === 'scheduled' ? 'done' : 'current',
      },
      {
        id: 'treatment',
        num: 2,
        label: 'Session',
        hint: sessionsComplete ? 'Completed' : formatBookingHint(b),
        state: sessionsComplete ? 'done' : b.status === 'scheduled' || planLive ? 'current' : 'upcoming',
      },
      {
        id: 'payment',
        num: 3,
        label: 'Payment',
        hint:
          outstanding > 0.009
            ? `₹${Math.round(outstanding)} due`
            : totalPaid > 0
            ? 'Paid'
            : paymentBadge(b.paymentStatus).label,
        state:
          outstanding > 0.009 && planLive
            ? 'current'
            : totalPaid > 0 || b.paymentStatus === 'held' || b.paymentStatus === 'released'
            ? 'done'
            : 'current',
      },
    ]
  }

  if (b.serviceType === 'clinic' || b.carePath === 'clinic_visit') {
    const clinicName = typeof b.clinicId === 'object' ? b.clinicId?.name : null
    return [
      {
        id: 'team',
        num: 1,
        label: 'Clinic',
        hint: clinicName || (b.clinicId ? 'Clinic assigned' : 'Awaiting clinic'),
        state: b.clinicId ? 'done' : 'current',
      },
      {
        id: 'treatment',
        num: 2,
        label: 'Visit',
        hint: sessionsComplete ? 'Completed' : formatBookingHint(b),
        state: !b.clinicId ? 'upcoming' : sessionsComplete ? 'done' : 'current',
      },
      {
        id: 'payment',
        num: 3,
        label: 'Payment',
        hint:
          outstanding > 0.009
            ? `₹${Math.round(outstanding)} due`
            : totalPaid > 0
              ? 'Paid'
              : 'Pay at clinic',
        state:
          outstanding > 0.009
            ? 'current'
            : totalPaid > 0 || b.paymentStatus === 'held' || b.paymentStatus === 'released'
              ? 'done'
              : b.clinicId
                ? 'current'
                : 'upcoming',
      },
    ]
  }

  const techniqueDirect =
    b.carePath === 'technique_direct' || b.workflowStatus === 'pending_physio_assignment'
  const techniqueManaged = b.carePath === 'technique_managed'
  const techniqueShort = techniqueDirect || techniqueManaged

  if (techniqueShort) {
    return [
      {
        id: 'team',
        num: 1,
        label: techniqueManaged ? 'Care manager' : 'Physiotherapist',
        hint: techniqueManaged
          ? hasPhysio
            ? b.physioId?.name || 'Physio assigned'
            : b.managerId?.name
              ? `${b.managerId.name} will assign physio`
              : 'Your care manager will assign a physio'
          : hasPhysio
            ? b.physioId?.name || 'Assigned'
            : 'Finding your physiotherapist',
        state: hasPhysio ? 'done' : 'current',
      },
      {
        id: 'treatment',
        num: 2,
        label: 'Treatment',
        hint: sessionsComplete
          ? 'Completed'
          : hasPhysio
          ? formatBookingHint(b)
          : 'After physio is assigned',
        state: !hasPhysio ? 'upcoming' : sessionsComplete ? 'done' : 'current',
      },
      {
        id: 'payment',
        num: 3,
        label: 'Payment',
        hint:
          outstanding > 0.009
            ? `₹${Math.round(outstanding)} due`
            : totalPaid > 0
            ? 'Fully paid'
            : paymentAmountLabel(b) || 'Pay after assignment',
        state: !hasPhysio
          ? 'upcoming'
          : outstanding > 0.009
          ? 'current'
          : totalPaid > 0 || b.paymentStatus === 'held' || b.paymentStatus === 'released'
          ? 'done'
          : 'current',
      },
    ]
  }

  return [
    {
      id: 'team',
      num: 1,
      label: 'Care team',
      hint: assessmentDone
        ? 'Assessment done'
        : careTeamActive
        ? 'Home assessment visit'
        : 'Assigning manager',
      state: assessmentDone || hasPlan ? 'done' : careTeamActive ? 'current' : 'upcoming',
    },
    {
      id: 'plan',
      num: 2,
      label: 'Care plan',
      hint: awaitingConsent
        ? 'Your consent needed'
        : planLive
        ? `${b.sessions || '—'} sessions · ${paymentAmountLabel(b)}`
        : assessmentDone
        ? 'Manager drafting plan'
        : 'After assessment',
      state: !assessmentDone && !hasPlan
        ? 'upcoming'
        : awaitingConsent
        ? 'waiting'
        : planLive
        ? 'done'
        : assessmentDone
        ? 'current'
        : 'upcoming',
    },
    {
      id: 'treatment',
      num: 3,
      label: 'Treatment',
      hint: hasPhysio ? b.physioId?.name || 'Physio assigned' : 'After plan is live',
      state: !planLive
        ? 'upcoming'
        : sessionsComplete
        ? 'done'
        : needsSessionConfirm || hasPhysio
        ? 'current'
        : 'current',
    },
    {
      id: 'payment',
      num: 4,
      label: 'Payment',
      hint:
        outstanding > 0.009
          ? `₹${Math.round(outstanding)} due`
          : totalPaid > 0
          ? 'Fully paid'
          : b.homePlanPaymentMode === 'offline'
          ? 'Pay physio at visit'
          : 'Pay online',
      state: !planLive
        ? 'upcoming'
        : outstanding > 0.009
        ? 'current'
        : totalPaid > 0 || b.paymentStatus === 'held' || b.paymentStatus === 'released'
        ? 'done'
        : 'current',
    },
  ]
}

function formatBookingHint(b) {
  if (b.sessionStatus === 'completed') return 'Done'
  return 'Scheduled'
}

export function defaultPatientOpenStep(steps) {
  return (
    steps.find((s) => s.state === 'waiting' || s.state === 'current')?.id ||
    steps.find((s) => s.state === 'done')?.id ||
    steps[0]?.id ||
    'team'
  )
}

export function patientPageContext(booking) {
  if (!booking) return null
  const b = booking
  const isOnline = b.serviceType === 'online'
  const isClinic = b.serviceType === 'clinic' || b.carePath === 'clinic_visit'
  const techniqueDirect =
    b.carePath === 'technique_direct' || b.workflowStatus === 'pending_physio_assignment'
  const techniqueManaged = b.carePath === 'technique_managed'
  const techniqueShort = techniqueDirect || techniqueManaged
  const planLive =
    isPlanLive(b.planStatus) ||
    isOnline ||
    isClinic ||
    (techniqueShort && Boolean(b.physioId)) ||
    techniqueManaged
  const awaitingConsent =
    !isOnline && !isClinic && !techniqueShort && isAwaitingPatientConsent(b.planStatus)
  const assessmentDone = Boolean(b.assessmentCompletedAt) || techniqueShort
  const careTeamActive = techniqueShort
    ? Boolean(b.physioId) || (techniqueManaged && Boolean(b.managerId))
    : b.status === 'pending' ||
      b.status === 'assigned' ||
      Boolean(b.managerId) ||
      !assessmentDone
  const hasPhysio = Boolean(b.physioId)
  const hasPlan = planLive || awaitingConsent || Boolean(b.schedule?.length)
  const paymentSummary = b.paymentSummary || null
  const outstanding = Number(paymentSummary?.outstanding || 0)
  const totalPaid = Number(paymentSummary?.totalPaid || b.totalPaid || 0)
  const sessionsComplete = b.sessionStatus === 'completed'

  return {
    b,
    isOnline,
    planLive,
    awaitingConsent,
    assessmentDone,
    careTeamActive,
    hasPhysio,
    hasPlan,
    paymentSummary,
    payments: Array.isArray(b.payments) ? b.payments : [],
    outstanding,
    totalPaid,
    sessionsComplete,
    techniqueManaged,
    workflowMeta: patientWorkflowMeta(b),
  }
}
