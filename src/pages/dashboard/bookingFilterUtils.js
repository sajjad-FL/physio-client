import { normalizeSessionRows, ymdFromDate } from '../../components/physio/physioBookingHelpers'

/**
 * @param {object} booking
 * @param {{ filter: string, dateRange: [Date, Date] | null, today: string }} opts
 */
export function matchesPatientBookingFilter(booking, { filter, dateRange, today }) {
  const rows = normalizeSessionRows(booking)
  const dates = [...new Set(rows.map((r) => r.date).filter(Boolean))]
  if (dates.length === 0) return filter === 'all'

  if (filter === 'all') return true
  if (filter === 'today') return dates.some((d) => d === today)
  if (filter === 'upcoming') return dates.some((d) => d > today)
  if (filter === 'past') return dates.some((d) => d < today)
  if (filter === 'range') {
    if (!dateRange?.[0] || !dateRange?.[1]) return false
    const start = ymdFromDate(dateRange[0])
    const end = ymdFromDate(dateRange[1])
    const lo = start <= end ? start : end
    const hi = start <= end ? end : start
    return dates.some((d) => d >= lo && d <= hi)
  }
  return true
}

/** Most recently created booking first; tie-break by session date/time. */
export function comparePatientBookingsLatestFirst(a, b) {
  const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0
  const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0
  if (tb !== ta) return tb - ta
  const dateCmp = String(b.date || '').localeCompare(String(a.date || ''))
  if (dateCmp !== 0) return dateCmp
  return String(b.timeSlot || '').localeCompare(String(a.timeSlot || ''))
}

export function sortPatientBookingsLatestFirst(list) {
  return [...list].sort(comparePatientBookingsLatestFirst)
}
