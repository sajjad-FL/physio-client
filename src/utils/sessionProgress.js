import { normalizeSessionRows, todayYmd } from '../components/physio/physioBookingHelpers'

/**
 * Derives completed vs total sessions. When the booking is marked complete, all sessions count as done.
 * Otherwise, sessions with a date strictly before today count as completed (schedule-based estimate).
 *
 * @param {object | null | undefined} booking
 * @returns {{ completed: number, total: number, percent: number, tier: 'red' | 'yellow' | 'green', isComplete: boolean }}
 */
export function getSessionProgress(booking) {
  if (!booking) {
    return { completed: 0, total: 1, percent: 0, tier: 'red', isComplete: false }
  }

  const rows = normalizeSessionRows(booking)
  const total = Math.max(1, Number(booking.sessions) || rows.length || 1)
  const today = todayYmd()

  if (booking.sessionStatus === 'completed') {
    return {
      completed: total,
      total,
      percent: 100,
      tier: 'green',
      isComplete: true,
    }
  }

  let completed = 0
  for (const r of rows) {
    if (String(r.date) < today) completed++
  }
  completed = Math.min(completed, total)

  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
  const tier = percent >= 67 ? 'green' : percent >= 34 ? 'yellow' : 'red'

  return {
    completed,
    total,
    percent,
    tier,
    isComplete: false,
  }
}

/**
 * @param {number} percent
 * @param {boolean} isComplete
 */
export function getSessionMilestoneMessage(percent, isComplete) {
  if (isComplete || percent >= 100) {
    return 'All sessions complete — outstanding work.'
  }
  if (percent === 0) {
    return 'Your care plan is underway — stay consistent for the best results.'
  }
  if (percent < 34) {
    return 'Great start — every session builds on the last.'
  }
  if (percent < 67) {
    return "You're making solid progress — keep it up."
  }
  return 'Almost there — one push to the finish line.'
}

/** Tailwind classes for track + fill */
export function getProgressTierStyles(tier) {
  if (tier === 'green') {
    return {
      track: 'bg-emerald-100/90 ring-1 ring-emerald-200/60',
      fill: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    }
  }
  if (tier === 'yellow') {
    return {
      track: 'bg-amber-100/90 ring-1 ring-amber-200/70',
      fill: 'bg-gradient-to-r from-amber-500 to-amber-400',
    }
  }
  return {
    track: 'bg-red-100/90 ring-1 ring-red-200/70',
    fill: 'bg-gradient-to-r from-red-500 to-rose-400',
  }
}
