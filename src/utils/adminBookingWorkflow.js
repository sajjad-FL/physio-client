import { paymentAmountLabel } from './bookingDisplay'
import { isPlanLive } from './planStatus'
import { normalizeSessionRows } from '../components/physio/physioBookingHelpers'

/** @typedef {'done' | 'current' | 'waiting' | 'upcoming'} StepState */

/**
 * Priority badge for admin case detail.
 * @param {object} b
 * @param {object} ctx
 */
export function adminWorkflowMeta(b, ctx) {
  const {
    activeDispute,
    needsManager,
    canAssign,
    needsPaymentVerify,
    canVerifyOffline,
    canRelease,
    sessionsComplete,
  } = ctx

  if (activeDispute) {
    return { label: 'Open dispute', tone: 'urgent' }
  }
  if (needsManager) {
    return { label: 'Assign manager', tone: 'action' }
  }
  if (canAssign) {
    return { label: 'Assign physio', tone: 'action' }
  }
  if (needsPaymentVerify || canVerifyOffline) {
    return { label: 'Verify payments', tone: 'action' }
  }
  if (canRelease) {
    return { label: 'Release payment', tone: 'action' }
  }
  if (sessionsComplete && b.paymentStatus === 'released') {
    return { label: 'Closed', tone: 'muted' }
  }
  if (sessionsComplete) {
    return { label: 'Sessions done', tone: 'progress' }
  }
  if (isPlanLive(b.planStatus) || b.serviceType === 'online' || b.physioId) {
    return { label: 'In treatment', tone: 'progress' }
  }
  return { label: b.status || 'Open', tone: 'muted' }
}

/**
 * @param {object} ctx
 * @returns {Array<{ id: string, num: number, label: string, hint: string, state: StepState }>}
 */
export function buildAdminWorkflowSteps(ctx) {
  const {
    b,
    isOnline,
    hasManager,
    hasPhysio,
    needsManager,
    canAssign,
    sessionsComplete,
    completedCount,
    totalSessions,
    needsPaymentVerify,
    canVerifyOffline,
    canRelease,
    outstanding,
    activeDispute,
    paymentSummary,
  } = ctx

  const totalPaid = Number(paymentSummary?.totalPaid || 0)
  const steps = []
  let num = 1

  steps.push({
    id: 'case',
    num: num++,
    label: 'Case',
    hint: b.userId?.name || 'Overview',
    state: 'done',
  })

  steps.push({
    id: 'staffing',
    num: num++,
    label: 'Staffing',
    hint: needsManager
      ? 'Assign manager'
      : canAssign
      ? 'Assign physio'
      : hasPhysio
      ? b.physioId?.name || 'Staffed'
      : hasManager
      ? 'Manager assigned'
      : 'Team',
    state: needsManager || canAssign ? 'current' : hasPhysio || (isOnline && hasPhysio) ? 'done' : hasManager ? 'done' : 'upcoming',
  })

  steps.push({
    id: 'sessions',
    num: num++,
    label: 'Sessions',
    hint: totalSessions
      ? `${completedCount}/${totalSessions} done`
      : sessionsComplete
      ? 'Completed'
      : 'Schedule',
    state: sessionsComplete
      ? 'done'
      : hasPhysio || isOnline || Array.isArray(b.schedule)
      ? 'current'
      : 'upcoming',
  })

  steps.push({
    id: 'payments',
    num: num++,
    label: 'Payments',
    hint: canRelease
      ? 'Ready to release'
      : needsPaymentVerify || canVerifyOffline
      ? 'Verify needed'
      : outstanding > 0.009
      ? `₹${Math.round(outstanding)} due`
      : totalPaid > 0
      ? 'Paid'
      : paymentAmountLabel(b) || 'Payment',
    state:
      canRelease || needsPaymentVerify || canVerifyOffline
        ? 'current'
        : outstanding > 0.009
        ? 'current'
        : totalPaid > 0 || b.paymentStatus === 'released' || b.paymentStatus === 'held'
        ? b.paymentStatus === 'released'
          ? 'done'
          : 'current'
        : hasPhysio || isPlanLive(b.planStatus) || isOnline
        ? 'current'
        : 'upcoming',
  })

  if (activeDispute) {
    steps.push({
      id: 'disputes',
      num: num++,
      label: 'Disputes',
      hint: 'Action needed',
      state: 'waiting',
    })
  }

  return steps
}

export function defaultAdminOpenStep(steps) {
  return (
    steps.find((s) => s.state === 'waiting' || s.state === 'current')?.id ||
    steps.find((s) => s.state === 'done')?.id ||
    steps[0]?.id ||
    'case'
  )
}

/**
 * @param {object | null} booking
 * @param {{ disputes?: Array, extras?: object }} [opts]
 */
export function adminPageContext(booking, opts = {}) {
  if (!booking) return null
  const b = booking
  const disputes = opts.disputes || []
  const activeDispute = disputes.find((d) => d.status === 'open' || d.status === 'under_review') || null
  const isOnline = b.serviceType === 'online'
  const isHome = b.serviceType === 'home'
  const hasManager = Boolean(b.managerId)
  const hasPhysio = Boolean(b.physioId)
  const needsManager = isHome && !hasManager
  const paymentSummary = b.paymentSummary || null
  const payments = Array.isArray(b.payments) ? b.payments : []
  const outstanding = Number(paymentSummary?.outstanding || 0)
  const rows = normalizeSessionRows(b)
  const completedCount = rows.filter((r) => r.status === 'completed').length
  const totalSessions = rows.length
  const sessionsComplete = b.sessionStatus === 'completed'

  const canAssign = !hasPhysio && b.status !== 'completed' && b.paymentStatus !== 'refunded'
  const canComplete = b.paymentStatus === 'held' && b.status !== 'completed'
  const canRelease = b.paymentStatus === 'held' && b.sessionStatus === 'completed'
  const canVerifyOffline =
    isHome &&
    b.homePlanPaymentMode === 'offline' &&
    b.planStatus === 'approved' &&
    !b.offlinePaymentVerified &&
    b.payment?.status === 'collected'

  const needsPaymentVerify = payments.some((p) => p.mode === 'offline' && p.status === 'collected')

  const ctx = {
    b,
    isOnline,
    isHome,
    hasManager,
    hasPhysio,
    needsManager,
    paymentSummary,
    payments,
    outstanding,
    rows,
    completedCount,
    totalSessions,
    sessionsComplete,
    canAssign,
    canComplete,
    canRelease,
    canVerifyOffline,
    needsPaymentVerify,
    activeDispute,
    planLive: isPlanLive(b.planStatus) || isOnline,
    ...(opts.extras || {}),
  }

  return {
    ...ctx,
    workflowMeta: adminWorkflowMeta(b, ctx),
  }
}
