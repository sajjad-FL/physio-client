import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { TECHNIQUES } from '../../constants/techniques'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingTimeSlot } from '../../utils/date'
import { usePricingSettings } from '../../hooks/usePricingSettings'
import Button from '../ui/Button'
import FieldLabel from '../ui/FieldLabel'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = String(ymd).split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const DEFAULT_SESSIONS_BY_ISSUE = {
  'Cupping Therapy': 1,
  'Kinesio Taping': 1,
  'Dry Needling': 3,
  IASTM: 4,
}

function buildDefaultDates(count, startYmd = todayISO()) {
  return Array.from({ length: count }, (_, i) => addDaysYmd(startYmd, i))
}

function buildDefaultTimes(count, slot = '') {
  return Array.from({ length: count }, () => slot)
}

/**
 * Manager books a technique visit for the patient on this case.
 * Always technique_managed — patient pays totalAmount; payout uses with-manager split.
 * Each session can have its own date and time slot.
 */
export default function SuggestTechniquePanel({ sourceBookingId, disabled = false }) {
  const navigate = useNavigate()
  const { settings } = usePricingSettings()
  const [open, setOpen] = useState(false)
  const [issue, setIssue] = useState('')
  const [sessions, setSessions] = useState(1)
  const [visitDates, setVisitDates] = useState(() => buildDefaultDates(1))
  const [visitTimes, setVisitTimes] = useState(() => buildDefaultTimes(1))
  const [busy, setBusy] = useState(false)

  const prices = settings?.techniquePrices || {}
  const minDate = todayISO()

  const options = useMemo(
    () =>
      TECHNIQUES.map((t) => {
        const p = Number(prices[t.bookingIssue])
        const priceOk = Number.isFinite(p) && p > 0
        return {
          issue: t.bookingIssue,
          label: t.label,
          price: priceOk ? p : null,
          priceLabel: priceOk ? `₹${p.toLocaleString('en-IN')}` : null,
        }
      }),
    [prices],
  )

  const unitPrice = Number(prices[issue])
  const unitOk = Number.isFinite(unitPrice) && unitPrice > 0
  const sessionCount = Math.min(15, Math.max(1, Math.round(Number(sessions) || 1)))
  const totalAmount = unitOk ? unitPrice * sessionCount : null
  const selectedLabel = options.find((o) => o.issue === issue)?.label

  useEffect(() => {
    setVisitDates((prev) => {
      if (prev.length === sessionCount) return prev
      if (prev.length < sessionCount) {
        const start = prev[prev.length - 1] || todayISO()
        const extra = Array.from({ length: sessionCount - prev.length }, (_, i) =>
          addDaysYmd(start, i + 1),
        )
        return [...prev, ...extra]
      }
      return prev.slice(0, sessionCount)
    })
    setVisitTimes((prev) => {
      if (prev.length === sessionCount) return prev
      if (prev.length < sessionCount) {
        const fill = prev[prev.length - 1] || ''
        return [...prev, ...Array.from({ length: sessionCount - prev.length }, () => fill)]
      }
      return prev.slice(0, sessionCount)
    })
  }, [sessionCount])

  function selectIssue(nextIssue) {
    const nextSessions = DEFAULT_SESSIONS_BY_ISSUE[nextIssue] ?? 1
    setIssue(nextIssue)
    setSessions(nextSessions)
    setVisitDates(buildDefaultDates(nextSessions))
    setVisitTimes(buildDefaultTimes(nextSessions))
  }

  function setVisitDateAt(index, value) {
    setVisitDates((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function setVisitTimeAt(index, value) {
    setVisitTimes((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function bumpSessions(delta) {
    const next = Math.min(15, Math.max(1, sessionCount + delta))
    setSessions(next)
  }

  async function submit() {
    if (!issue) {
      toast.error('Choose a technique')
      return
    }
    if (sessionCount < 1 || sessionCount > 15) {
      toast.error('Sessions must be between 1 and 15')
      return
    }
    if (visitDates.length !== sessionCount || visitDates.some((d) => !d)) {
      toast.error('Pick a date for every session')
      return
    }
    if (visitTimes.length !== sessionCount || visitTimes.some((t) => !t)) {
      toast.error('Pick a time for every session')
      return
    }
    setBusy(true)
    try {
      const res = await api.post(`/manager/bookings/${sourceBookingId}/suggest-technique`, {
        issue,
        sessions: sessionCount,
        dates: visitDates,
        times: visitTimes,
        // First session time kept for older API consumers
        timeSlot: visitTimes[0],
      })
      toast.success(
        sessionCount > 1
          ? `${issue} · ${sessionCount} sessions — assign a physiotherapist next`
          : `${issue} booked — assign a physiotherapist next`,
      )
      navigate(`/manager/bookings/${res.data._id}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not book technique')
    } finally {
      setBusy(false)
    }
  }

  const allDatesFilled = visitDates.length === sessionCount && visitDates.every(Boolean)
  const allTimesFilled = visitTimes.length === sessionCount && visitTimes.every(Boolean)
  const canSubmit = !busy && !!issue && allDatesFilled && allTimesFilled && sessionCount >= 1

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">Suggest technique</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Book a separate technique visit under your care. Each session can have its own date and
            time.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setOpen((v) => !v)}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
            open
              ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          } disabled:opacity-50`}
        >
          {open ? 'Close' : 'Book technique'}
        </button>
      </div>

      {open ? (
        <div className="space-y-5 border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
          <section>
            <FieldLabel required className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Technique
            </FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => {
                const selected = issue === o.issue
                return (
                  <button
                    key={o.issue}
                    type="button"
                    disabled={busy}
                    onClick={() => selectIssue(o.issue)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                      selected
                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500/25'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${selected ? 'text-teal-900' : 'text-slate-900'}`}
                    >
                      {o.label}
                    </span>
                    <span
                      className={`shrink-0 text-sm tabular-nums ${
                        selected ? 'font-semibold text-teal-800' : 'text-slate-500'
                      }`}
                    >
                      {o.priceLabel || '—'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</p>
                <p className="mt-0.5 text-xs text-slate-500">1–15 visits · same technique</p>
              </div>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  disabled={busy || !issue || sessionCount <= 1}
                  onClick={() => bumpSessions(-1)}
                  className="h-10 w-10 text-lg font-semibold text-slate-600 hover:bg-white disabled:opacity-40"
                  aria-label="Fewer sessions"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={15}
                  step={1}
                  value={sessions}
                  disabled={busy || !issue}
                  onChange={(e) => setSessions(e.target.value)}
                  onBlur={() => setSessions(sessionCount)}
                  className="h-10 w-14 border-x border-slate-200 bg-white text-center text-sm font-semibold tabular-nums focus:outline-none disabled:bg-slate-50"
                />
                <button
                  type="button"
                  disabled={busy || !issue || sessionCount >= 15}
                  onClick={() => bumpSessions(1)}
                  className="h-10 w-10 text-lg font-semibold text-slate-600 hover:bg-white disabled:opacity-40"
                  aria-label="More sessions"
                >
                  +
                </button>
              </div>
            </div>

            {totalAmount != null ? (
              <div className="mt-3 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-950">
                <p className="font-semibold">
                  Patient pays ₹{totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="mt-0.5 text-xs text-teal-800/90">
                  {sessionCount} × ₹{unitPrice.toLocaleString('en-IN')}
                  {selectedLabel ? ` · ${selectedLabel}` : ''} · with-manager booking
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Select a technique to see the patient total.</p>
            )}
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visit schedule
            </p>
            <div className="space-y-3">
              {Array.from({ length: sessionCount }, (_, i) => (
                <div
                  key={`visit-${i}`}
                  className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5"
                >
                  <p className="mb-2.5 text-sm font-semibold text-slate-900">Session {i + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel required className="mb-1 block text-xs font-medium text-slate-500">
                        Date
                      </FieldLabel>
                      <input
                        type="date"
                        min={minDate}
                        value={visitDates[i] || ''}
                        disabled={busy}
                        onChange={(e) => setVisitDateAt(i, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <FieldLabel required className="mb-1 block text-xs font-medium text-slate-500">
                        Time
                      </FieldLabel>
                      <select
                        value={visitTimes[i] || ''}
                        disabled={busy}
                        onChange={(e) => setVisitTimeAt(i, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Select time…</option>
                        {DAILY_SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {formatBookingTimeSlot(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-4">
            <Button type="button" disabled={!canSubmit} onClick={submit}>
              {busy ? 'Booking…' : 'Create technique booking'}
            </Button>
            {!canSubmit && !busy ? (
              <p className="text-xs text-slate-500">
                Choose technique, then a date and time for every session.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
