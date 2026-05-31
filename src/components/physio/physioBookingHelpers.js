/** @param {Date} d */
export function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayYmd() {
  return ymdFromDate(new Date())
}

export function normalizeSessionRows(b) {
  if (Array.isArray(b.schedule) && b.schedule.length > 0) {
    return b.schedule
      .map((s, i) => ({
        key: `${b._id}-s-${i}`,
        sessionId: s._id != null ? String(s._id) : null,
        date: s.date,
        time: s.time,
        n: i + 1,
        notes: s.notes || null,
        status: s.status || 'scheduled',
        completedAt: s.completedAt || null,
        noShowReason: s.noShowReason || '',
        /** Multi-session plan rows carry their own per-session status. */
        perSession: true,
      }))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  }
  return [
    {
      key: `${b._id}-s-0`,
      /**
       * Single-session bookings don't have schedule entries, so the primary
       * visit has no per-session id. Leave sessionId null — callers that
       * target a specific session (per-session complete / rating) should
       * treat this as the primary visit and omit sessionId on the wire.
       */
      sessionId: null,
      date: b.date,
      time: b.timeSlot,
      n: 1,
      notes: b.primarySessionNotes || null,
      status: b.sessionStatus === 'completed' ? 'completed' : 'scheduled',
      completedAt: null,
      noShowReason: '',
      perSession: false,
    },
  ]
}

export function matchesFilters(b, filters) {
  if (filters.status === 'scheduled' && b.sessionStatus === 'completed') return false
  if (filters.status === 'completed' && b.sessionStatus !== 'completed') return false
  if (filters.status === 'rescheduled' && !b.rescheduled) return false

  if (filters.service === 'online' && b.serviceType !== 'online') return false
  if (filters.service === 'home' && b.serviceType !== 'home') return false

  const t = todayYmd()
  const d = String(b.date || '')
  if (filters.date === 'today' && d !== t) return false
  if (filters.date === 'upcoming' && !(d > t)) return false
  if (filters.date === 'past' && !(d < t)) return false

  return true
}

/** @param {string} ymd */
export function getSessionsForYmd(bookings, ymd) {
  const out = []
  for (const b of bookings) {
    const rows = normalizeSessionRows(b)
    for (const r of rows) {
      if (r.date === ymd) {
        out.push({ booking: b, row: r })
      }
    }
  }
  return out
}

export function buildSessionDateSet(bookings) {
  const set = new Set()
  for (const b of bookings) {
    for (const r of normalizeSessionRows(b)) {
      set.add(r.date)
    }
  }
  return set
}
