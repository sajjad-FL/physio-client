import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../config/api'
import { assetUrl } from '../../utils/assetUrl'
import { normalizeSessionRows } from '../physio/physioBookingHelpers'
import {
  buildSessionPaymentMap,
  defaultCollectionSessionId,
  sessionRowKey,
} from '../../utils/sessionPaymentMap'
import { prepareUploadFile } from '../../utils/compressImage.js'
import { MAX_UPLOAD_BYTES } from '../../constants/uploadLimits.js'
import FieldLabel from '../ui/FieldLabel'

function roundMoney2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Record a cash / UPI collection for a booking. Amount defaults to
 * one-session fee and caps at outstanding balance.
 * Managers can choose Cash (handoff) or PhonePe QR (screenshot → admin confirm).
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
  const [method, setMethod] = useState('cash')
  const [qrUrl, setQrUrl] = useState('')
  const [qrConfigured, setQrConfigured] = useState(true)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrExpanded, setQrExpanded] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')

  const defaultAmount = useMemo(() => {
    if (outstanding <= 0) return 0
    if (perSession > 0) return Math.min(perSession, outstanding)
    return outstanding
  }, [outstanding, perSession])

  const [amount, setAmount] = useState(defaultAmount)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const parsedAmount = roundMoney2(Number(amount))
  const amountOverLimit =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount > outstanding + 0.009
  const amountInvalid = amount !== '' && amount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
  const phonePeReady = method !== 'phonepe_qr' || (qrConfigured && Boolean(proofFile))
  const canSubmit =
    outstanding > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= outstanding + 0.009 &&
    phonePeReady

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

  function clearProof() {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(null)
    setProofPreview('')
  }

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount)
      setNote('')
      setError('')
      setSubmitting(false)
      setConfirmOpen(false)
      setSelectedSessionId(defaultSessionId || '')
      setMethod('cash')
      setQrExpanded(false)
      clearProof()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, defaultAmount, defaultSessionId])

  useEffect(() => {
    if (!open || !isManager || method !== 'phonepe_qr') return undefined
    let cancelled = false
    setQrLoading(true)
    api
      .get('/manager/payment-qr')
      .then(({ data }) => {
        if (cancelled) return
        setQrUrl(data.phonePeQrUrl || '')
        setQrConfigured(Boolean(data.configured && data.phonePeQrUrl))
      })
      .catch(() => {
        if (cancelled) return
        setQrUrl('')
        setQrConfigured(false)
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isManager, method])

  async function onProofChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Payment screenshot must be JPEG, PNG, or WebP')
      return
    }
    try {
      if (file.size > 400 * 1024) toast.loading('Optimizing image…', { id: 'img-compress' })
      const prepared = await prepareUploadFile(file, 'payment')
      toast.dismiss('img-compress')
      if (prepared.size > MAX_UPLOAD_BYTES) {
        setError('Screenshot is still too large after optimization')
        return
      }
      if (proofPreview) URL.revokeObjectURL(proofPreview)
      setProofFile(prepared)
      setProofPreview(URL.createObjectURL(prepared))
      setError('')
    } catch (err) {
      toast.dismiss('img-compress')
      setError(err?.message || 'Could not optimize screenshot')
    }
  }

  function validateBeforeConfirm() {
    setError('')
    const amt = roundMoney2(Number(amount))
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than zero')
      return false
    }
    if (amt > outstanding + 0.009) {
      setError(`Cannot record more than the pending payment of ₹${outstanding.toFixed(2)}`)
      return false
    }
    if (isManager && method === 'phonepe_qr') {
      if (!qrConfigured) {
        setError('PhonePe QR is not set up. Ask admin to upload it under Platform settings.')
        return false
      }
      if (!proofFile) {
        setError('Upload a screenshot of the PhonePe payment')
        return false
      }
    }
    return true
  }

  function handleFormSubmit(e) {
    e?.preventDefault?.()
    if (!validateBeforeConfirm()) return
    setConfirmOpen(true)
  }

  async function confirmAndRecord() {
    if (!validateBeforeConfirm()) {
      setConfirmOpen(false)
      return
    }
    const amt = roundMoney2(Number(amount))
    setSubmitting(true)
    try {
      const path = apiPath || `/physio/bookings/${booking?._id}/collections`
      if (isManager && method === 'phonepe_qr') {
        const form = new FormData()
        form.append('amount', String(amt))
        form.append('collectionChannel', 'phonepe_qr')
        if (note.trim()) form.append('note', note.trim())
        if (hasMultiSession && selectedSessionId) form.append('sessionId', selectedSessionId)
        form.append('proof', proofFile)
        await api.post(path, form)
        toast.success(successMessage || 'Screenshot submitted — waiting for admin to confirm.')
      } else {
        const payload = { amount: amt, note: note.trim() }
        if (isManager) payload.collectionChannel = 'cash'
        if (isManager && hasMultiSession && selectedSessionId) {
          payload.sessionId = selectedSessionId
        }
        await api.post(path, payload)
        toast.success(
          successMessage ||
            (apiPath?.includes('/manager/')
              ? 'Collection recorded — see Finance for cash waiting on admin.'
              : 'Collection recorded. Awaiting admin verification.'),
        )
      }
      setConfirmOpen(false)
      onRecorded?.()
      onClose?.()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not record collection'
      setConfirmOpen(false)
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const outstandingLabel = `₹${outstanding.toFixed(2)}`
  const amountLabel = `₹${parsedAmount.toFixed(2)}`
  const qrSrc = assetUrl(qrUrl)
  const confirmMethodLabel = method === 'phonepe_qr' ? 'PhonePe QR' : 'Cash'

  const defaultDescription = apiPath?.includes('/manager/') ? (
    <>
      Pending:{' '}
      <strong className="font-semibold text-slate-800">{outstandingLabel}</strong>. Choose cash handoff or
      PhonePe QR (patient pays admin QR; you upload the screenshot).
    </>
  ) : (
    <>
      Pending:{' '}
      <strong className="font-semibold text-slate-800">{outstandingLabel}</strong>. Admin will verify
      before it unlocks a session.
    </>
  )

  return (
    <>
      <Modal
        open={open}
        onClose={submitting || confirmOpen ? undefined : onClose}
        title={title}
        description={description ?? defaultDescription}
      >
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {isManager ? (
            <div>
              <FieldLabel required className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Payment method
              </FieldLabel>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setMethod('cash')}
                  className={[
                    'rounded-xl border px-3 py-2 text-sm font-medium transition',
                    method === 'cash'
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Cash
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setMethod('phonepe_qr')}
                  className={[
                    'rounded-xl border px-3 py-2 text-sm font-medium transition',
                    method === 'phonepe_qr'
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  PhonePe QR
                </button>
              </div>
            </div>
          ) : null}

          {isManager && method === 'phonepe_qr' ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {qrLoading ? (
                <p className="text-sm text-slate-600">Loading QR…</p>
              ) : !qrConfigured || !qrSrc ? (
                <p className="text-sm text-rose-800">
                  PhonePe QR is not configured. Ask admin to upload it under Platform settings.
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQrExpanded(true)}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2"
                  >
                    <img src={qrSrc} alt="PhonePe QR" className="h-40 w-40 object-contain" />
                  </button>
                  <p className="text-center text-xs text-slate-600">
                    Tap QR to enlarge. Patient scans and pays, then upload the payment screenshot below.
                  </p>
                </div>
              )}

              <div>
                <FieldLabel required className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Payment screenshot
                </FieldLabel>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onProofChange}
                  disabled={submitting || !qrConfigured}
                  className="mt-1.5 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="Payment screenshot preview"
                    className="mt-2 max-h-32 rounded-lg border border-slate-200 object-contain"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <FieldLabel htmlFor="collection-amount" required className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Amount (₹)
            </FieldLabel>
            <input
              id="collection-amount"
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
          </div>

          {isManager && hasMultiSession ? (
            <div>
              <FieldLabel htmlFor="collection-session" required className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                For session
              </FieldLabel>
              <select
                id="collection-session"
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
            </div>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Note (optional)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder={
                method === 'phonepe_qr' ? 'e.g. UPI ref after session 2' : 'e.g. Cash received after session 2'
              }
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
              {method === 'phonepe_qr' ? 'Submit screenshot' : 'Record collection'}
            </Button>
          </div>
        </form>
      </Modal>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[3px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) setConfirmOpen(false)
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="collection-confirm-title"
            aria-describedby="collection-confirm-desc"
            className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-900/20 motion-safe:animate-enter-scale"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-100">
              <svg
                className="h-6 w-6 text-teal-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-1.5v.75c0 .414-.336.75-.75.75h-.75m0-3.75h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            </div>

            <h3 id="collection-confirm-title" className="mt-4 text-center text-lg font-semibold tracking-tight text-slate-900">
              Confirm you received this amount
            </h3>
            <p id="collection-confirm-desc" className="mt-2 text-center text-sm leading-relaxed text-slate-600">
              {method === 'phonepe_qr'
                ? 'Make sure the patient paid this amount and your screenshot matches before you continue.'
                : 'Make sure you have received this amount in hand before recording the collection.'}
            </p>

            <div className="mt-5 rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/90 to-white px-4 py-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800/70">
                Amount to record
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-teal-950">
                {amountLabel}
              </p>
              {isManager ? (
                <p className="mt-2 text-xs font-medium text-slate-500">via {confirmMethodLabel}</p>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" className="w-full" disabled={submitting} onClick={confirmAndRecord}>
                {submitting ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {qrExpanded && qrSrc ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setQrExpanded(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-900"
            onClick={() => setQrExpanded(false)}
          >
            Close
          </button>
          <img
            src={qrSrc}
            alt="PhonePe QR enlarged"
            className="max-h-[90vh] max-w-full rounded-2xl bg-white object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
