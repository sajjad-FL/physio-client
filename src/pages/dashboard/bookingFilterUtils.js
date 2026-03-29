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
