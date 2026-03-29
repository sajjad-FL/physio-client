import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { formatBookingTimeSlot } from '../../utils/date'
import { buildSessionDateSet, getSessionsForYmd, ymdFromDate } from './physioBookingHelpers'

function statusLabel(booking) {
  return booking.sessionStatus === 'completed' ? 'Completed' : 'Scheduled'
}

function statusClass(booking) {
  return booking.sessionStatus === 'completed'
    ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
    : 'bg-amber-50 text-amber-900 ring-amber-200'
}

export default function SessionsCalendarView({ bookings }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = new Date()
    t.setHours(12, 0, 0, 0)
    return t
  })

  const sessionDates = useMemo(() => buildSessionDateSet(bookings), [bookings])

  const selectedYmd = ymdFromDate(selectedDate)
  const daySessions = useMemo(() => getSessionsForYmd(bookings, selectedYmd), [bookings, selectedYmd])

  return (
    <div className="physio-calendar-shell space-y-6">
      <div className="w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80 sm:p-4">
        <Calendar
          value={selectedDate}
          onChange={(value) => {
            const d = Array.isArray(value) ? value[0] : value
            if (d instanceof Date) setSelectedDate(d)
          }}
          calendarType="iso8601"
          className="!w-full max-w-none border-0"
          tileClassName={({ date, view }) => {
            if (view !== 'month') return null
            const y = ymdFromDate(date)
            return sessionDates.has(y) ? 'physio-cal-tile--busy' : null
          }}
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-4 ring-1 ring-gray-100/80 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-900">
          {selectedDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        {daySessions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
            No sessions on this day for the current filters and search.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {daySessions.map(({ booking: b, row: r }) => (
              <li key={`${b._id}-${r.key}`}>
                <Link
                  to={`/physio/bookings/${b._id}`}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:border-blue-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{formatBookingTimeSlot(r.time)}</p>
                    <p className="mt-0.5 truncate text-sm text-gray-700">{b.userId?.name ?? '—'}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(b)}`}
                    >
                      {statusLabel(b)}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">View details →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
