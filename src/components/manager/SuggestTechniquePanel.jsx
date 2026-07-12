import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { TECHNIQUES } from '../../constants/techniques'
import { DAILY_SLOTS } from '../../constants/slots'
import { formatBookingTimeSlot } from '../../utils/date'
import { usePricingSettings } from '../../hooks/usePricingSettings'
import Button from '../ui/Button'

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

/**
 * Manager books a technique visit (cupping, etc.) for the patient on this case.
 * Creates a separate technique_managed booking under the same manager.
 * Multi-session: one booking with a visit schedule — manager picks each visit date.
 */
export default function SuggestTechniquePanel({ sourceBookingId, disabled = false }) {
  const navigate = useNavigate()
  const { settings } = usePricingSettings()
  const [open, setOpen] = useState(false)
  const [issue, setIssue] = useState('')
  const [sessions, setSessions] = useState(1)
  const [visitDates, setVisitDates] = useState(() => buildDefaultDates(1))
  const [timeSlot, setTimeSlot] = useState('')
  const [busy, setBusy] = useState(false)

  const prices = settings?.techniquePrices || {}
  const minDate = todayISO()

  const options = useMemo(
    () =>
      TECHNIQUES.map((t) => {
        const p = Number(prices[t.bookingIssue])
        const priceLabel = Number.isFinite(p) && p > 0 ? `₹${p.toLocaleString('en-IN')}` : null
        return { issue: t.bookingIssue, label: t.label, priceLabel }
      }),
    [prices],
  )

  const unitPrice = Number(prices[issue])
  const unitOk = Number.isFinite(unitPrice) && unitPrice > 0
  const sessionCount = Math.min(15, Math.max(1, Math.round(Number(sessions) || 1)))
  const totalAmount = unitOk ? unitPrice * sessionCount : null

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
  }, [sessionCount])

  function selectIssue(nextIssue) {
    const nextSessions = DEFAULT_SESSIONS_BY_ISSUE[nextIssue] ?? 1
    setIssue(nextIssue)
    setSessions(nextSessions)
    setVisitDates(buildDefaultDates(nextSessions))
  }

  function setVisitDateAt(index, value) {
    setVisitDates((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  async function submit() {
    if (!issue || !timeSlot) {
      toast.error('Choose technique and time slot')
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
    setBusy(true)
    try {
      const res = await api.post(`/manager/bookings/${sourceBookingId}/suggest-technique`, {
        issue,
        timeSlot,
        sessions: sessionCount,
        dates: visitDates,
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

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Suggest technique</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Book cupping, dry needling, taping, or IASTM as a separate visit for this patient.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50"
        >
          {open ? 'Close' : 'Book technique'}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Technique
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const selected = issue === o.issue
                return (
                  <button
                    key={o.issue}
                    type="button"
                    disabled={busy}
                    onClick={() => selectIssue(o.issue)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-1 ring-teal-500/30'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium">{o.label}</span>
                    {o.priceLabel ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{o.priceLabel}/visit</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="block max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sessions
            </span>
            <input
              type="number"
              min={1}
              max={15}
              step={1}
              value={sessions}
              disabled={busy || !issue}
              onChange={(e) => setSessions(e.target.value)}
              onBlur={() => setSessions(sessionCount)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50"
            />
            {totalAmount != null ? (
              <p className="mt-1.5 text-xs font-medium text-slate-700">
                Total {sessionCount} × ₹{unitPrice.toLocaleString('en-IN')} = ₹
                {totalAmount.toLocaleString('en-IN')}
              </p>
            ) : null}
          </label>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Visit dates
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: sessionCount }, (_, i) => (
                <label key={`visit-${i}`} className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    Session {i + 1}
                  </span>
                  <input
                    type="date"
                    min={minDate}
                    value={visitDates[i] || ''}
                    disabled={busy}
                    onChange={(e) => setVisitDateAt(i, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time slot (same for all visits)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DAILY_SLOTS.map((s) => {
                const selected = timeSlot === s
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => setTimeSlot(s)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      selected
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {formatBookingTimeSlot(s)}
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            type="button"
            disabled={busy || !issue || !timeSlot || !allDatesFilled || sessionCount < 1}
            onClick={submit}
          >
            {busy ? 'Booking…' : 'Create technique booking'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
