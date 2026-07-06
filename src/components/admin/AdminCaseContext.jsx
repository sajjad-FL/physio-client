import { Link } from 'react-router-dom'
import { formatBookingDateAndSlot } from '../../utils/date'

/**
 * Normalize booking context from API shapes: bookingRef, populated bookingId, or flat queue row.
 */
export function resolveAdminCaseContext(source) {
  if (!source) return null

  const ref = source.bookingRef
  const booking = source.bookingId && typeof source.bookingId === 'object' ? source.bookingId : null

  const id =
    ref?.id ||
    booking?._id ||
    (typeof source.bookingId === 'string' ? source.bookingId : null) ||
    null

  const patientName =
    ref?.patientName ||
    source.patientName ||
    (booking?.userId && typeof booking.userId === 'object' ? booking.userId.name : null) ||
    null

  const issue = ref?.issue || source.bookingIssue || booking?.issue || null
  const date = ref?.date || source.bookingDate || booking?.date || null
  const timeSlot = ref?.timeSlot || source.bookingTimeSlot || booking?.timeSlot || null

  return { id, patientName, issue, date, timeSlot }
}

function shortBookingId(id) {
  if (!id) return null
  const s = String(id)
  return s.length > 6 ? s.slice(-6) : s
}

/**
 * @param {{ source?: object, bookingRef?: object, bookingId?: string|object, patientName?: string, bookingIssue?: string, bookingDate?: string, bookingTimeSlot?: string, compact?: boolean, showLink?: boolean, showPatient?: boolean, showIdSuffix?: boolean, className?: string }} props
 */
export default function AdminCaseContext({
  source,
  bookingRef,
  bookingId,
  patientName: patientNameProp,
  bookingIssue,
  bookingDate,
  bookingTimeSlot,
  compact = false,
  showLink = true,
  showPatient = true,
  showIdSuffix = false,
  className = '',
}) {
  const ctx = resolveAdminCaseContext(
    source || {
      bookingRef,
      bookingId,
      patientName: patientNameProp,
      bookingIssue,
      bookingDate,
      bookingTimeSlot,
    },
  )
  if (!ctx) return <span className="text-gray-400">—</span>

  const visitLine = [ctx.issue, formatBookingDateAndSlot(ctx.date, ctx.timeSlot)]
    .filter(Boolean)
    .join(' · ')
  const idSuffix = showIdSuffix ? shortBookingId(ctx.id) : null

  if (compact) {
    return (
      <div className={className}>
        {showPatient && ctx.patientName ? (
          <div className="font-medium text-gray-900">{ctx.patientName}</div>
        ) : null}
        {visitLine ? <div className="text-xs text-gray-500">{visitLine}</div> : null}
        {idSuffix ? <div className="text-[10px] text-gray-400">#{idSuffix}</div> : null}
        {showLink && ctx.id ? (
          <Link
            to={`/admin/bookings/${ctx.id}`}
            className="mt-0.5 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            View case →
          </Link>
        ) : null}
      </div>
    )
  }

  return (
    <div className={className}>
      {showPatient ? (
        <p className="font-medium text-gray-900">{ctx.patientName || 'Patient'}</p>
      ) : null}
      {visitLine ? <p className="text-xs text-gray-500">{visitLine}</p> : null}
      {idSuffix ? <p className="text-[10px] text-gray-400">Case #{idSuffix}</p> : null}
      {showLink && ctx.id ? (
        <Link
          to={`/admin/bookings/${ctx.id}`}
          className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          View case →
        </Link>
      ) : null}
    </div>
  )
}

export function AdminCaseContextSummary({ source, className = '' }) {
  const ctx = resolveAdminCaseContext(source)
  if (!ctx) return null
  const parts = [
    ctx.patientName,
    ctx.issue,
    formatBookingDateAndSlot(ctx.date, ctx.timeSlot),
  ].filter(Boolean)
  if (!parts.length) return null
  return <p className={`text-sm text-gray-700 ${className}`}>{parts.join(' · ')}</p>
}
