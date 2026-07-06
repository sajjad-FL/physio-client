import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../config/api'
import { normalizeSessionRows } from '../physio/physioBookingHelpers'
import {
  buildSessionPaymentMap,
  defaultCollectionSessionId,
  sessionRowKey,
} from '../../utils/sessionPaymentMap'

function roundMoney2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Record a cash / UPI collection for a booking. Amount defaults to
 * one-session fee and caps at outstanding balance.
 */
export default function RecordCollectionModal({
  open,
  booking,
  summary,
  onClose,
  onRecorded,
  apiPath,
  title = 'Record collection',
  description,
  successMessage,
  payments,
}) {
  const outstanding = roundMoney2(Number(summary?.outstanding || 0))
  const perSession = roundMoney2(Number(summary?.amountPerSession || 0))
  const isManager = Boolean(apiPath?.includes('/manager/'))
  const sessionRows = useMemo(() => normalizeSessionRows(booking || {}), [booking])
  const hasMultiSession = sessionRows.length > 1 && sessionRows.some((r) => r.sessionId)
  const sessionPaymentMap = useMemo(
    () => (isManager ? buildSessionPaymentMap(booking, payments, summary) : {}),
    [isManager, booking, payments, summary],
  )
  const defaultSessionId = useMemo(
    () =>
      isManager && hasMultiSession
        ? defaultCollectionSessionId(booking, sessionPaymentMap, perSession)
        : null,
    [isManager, hasMultiSession, booking, sessionPaymentMap, perSession],
  )

  const [selectedSessionId, setSelectedSessionId] = useState(defaultSessionId || '')

  const defaultAmount = useMemo(() => {
    if (outstanding <= 0) return 0
    if (perSession > 0) return Math.min(perSession, outstanding)
    return outstanding
  }, [outstanding, perSession])

  const [amount, setAmount] = useState(defaultAmount)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = roundMoney2(Number(amount))
  const amountOverLimit =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount > outstanding + 0.009
  const amountInvalid = amount !== '' && amount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
  const canSubmit =
    outstanding > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= outstanding + 0.009

  function handleAmountChange(e) {
    const raw = e.target.value
    setAmount(raw)
    setError('')
    const next = roundMoney2(Number(raw))
    if (raw !== '' && Number.isFinite(next) && next > outstanding + 0.009) {
      setError(`Cannot exceed pending payment of ₹${outstanding.toFixed(2)}`)
    }
  }

  function handleAmountBlur() {
    if (amount === '' || amount === null) return
    const next = roundMoney2(Number(amount))
    if (!Number.isFinite(next)) return
    if (next > outstanding + 0.009) {
      setAmount(String(outstanding))
      setError('')
    }
  }

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount)
      setNote('')
      setError('')
      setSubmitting(false)
      setSelectedSessionId(defaultSessionId || '')
    }
  }, [open, defaultAmount, defaultSessionId])

  async function handleSubmit(e) {
    e?.preventDefault?.()
    setError('')
    const amt = roundMoney2(Number(amount))
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than zero')
      return
    }
    if (amt > outstanding + 0.009) {
      setError(`Cannot record more than the pending payment of ₹${outstanding.toFixed(2)}`)
      return
    }
    setSubmitting(true)
    try {
      const path = apiPath || `/physio/bookings/${booking?._id}/collections`
      const payload = { amount: amt, note: note.trim() }
      if (isManager && hasMultiSession && selectedSessionId) {
        payload.sessionId = selectedSessionId
      }
      await api.post(path, payload)
      toast.success(
        successMessage ||
          (apiPath?.includes('/manager/')
            ? 'Collection recorded — see Finance → Collections for settlement status.'
            : 'Collection recorded. Awaiting admin verification.'),
      )
      onRecorded?.()
      onClose?.()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not record collection'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const outstandingLabel = `₹${outstanding.toFixed(2)}`

  const defaultDescription = apiPath?.includes('/manager/') ? (
    <>
      Pending:{' '}
      <strong className="font-semibold text-slate-800">{outstandingLabel}</strong>. This updates the
      patient plan and adds an entry under Finance → Collections until admin batch settlement.
    </>
  ) : (
    <>
      Pending:{' '}
      <strong className="font-semibold text-slate-800">{outstandingLabel}</strong>. Admin will verify
      before it unlocks a session.
    </>
  )

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={title}
      description={description ?? defaultDescription}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={outstanding}
            step="0.01"
            value={amount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            aria-invalid={amountOverLimit || amountInvalid}
            className={[
              'mt-1.5 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2',
              amountOverLimit || amountInvalid
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-teal-600 focus:ring-teal-600/20',
            ].join(' ')}
            disabled={submitting}
          />
          <p className="mt-1 text-[11px] text-ink-muted">
            Maximum: <strong className="font-semibold text-slate-700">₹{outstanding.toFixed(2)}</strong> (pending)
          </p>
          {perSession > 0 ? (
            <p className="mt-0.5 text-[11px] text-ink-muted">
              Suggested: <strong className="font-semibold text-slate-700">₹{perSession.toFixed(2)}</strong> per
              session.
            </p>
          ) : null}
          {amountOverLimit ? (
            <p className="mt-1 text-xs font-medium text-rose-700">
              Amount cannot exceed pending payment of ₹{outstanding.toFixed(2)}.
            </p>
          ) : null}
        </label>

        {isManager && hasMultiSession ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">For session</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              disabled={submitting}
            >
              {sessionRows
                .filter((r) => r.sessionId)
                .map((r) => {
                  const rec = sessionPaymentMap[sessionRowKey(r)]?.recorded || 0
                  const pendingForSession =
                    perSession > 0 ? Math.max(0, roundMoney2(perSession - rec)) : outstanding
                  return (
                    <option key={r.sessionId} value={r.sessionId}>
                      Session #{r.n} — ₹{pendingForSession.toFixed(0)} pending
                      {rec > 0 ? ` (${rec.toFixed(0)} recorded)` : ''}
                    </option>
                  )
                })}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Note (optional)</span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Cash received after session 2"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            disabled={submitting}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Saving…' : 'Record collection'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
