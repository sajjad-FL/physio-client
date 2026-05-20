import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../config/api'
import { buildRazorpayPrefill } from '../../utils/razorpayPrefill'

let razorpayScriptPromise = null

function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'))
  if (window.Razorpay) return Promise.resolve()
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
      document.body.appendChild(script)
    })
  }
  return razorpayScriptPromise
}

function roundMoney2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/**
 * Patient pay-next-installment modal. Default amount is
 * `summary.amountPerSession` (one session line, including per-visit distance on home plans);
 * upper bound is `summary.outstanding`.
 */
export default function PayInstallmentModal({
  open,
  booking,
  summary,
  onClose,
  onPaid,
  useWalletCredit = false,
  walletBalance = 0,
}) {
  const outstanding = roundMoney2(Number(summary?.outstanding || 0))
  const perSession = roundMoney2(Number(summary?.amountPerSession || 0))

  const defaultAmount = useMemo(() => {
    if (outstanding <= 0) return 0
    if (perSession > 0) return Math.min(perSession, outstanding)
    return outstanding
  }, [outstanding, perSession])

  const [amount, setAmount] = useState(defaultAmount)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [applyWallet, setApplyWallet] = useState(useWalletCredit)

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount)
      setError('')
      setSubmitting(false)
      setApplyWallet(useWalletCredit)
    }
  }, [open, defaultAmount, useWalletCredit])

  async function handlePay() {
    setError('')
    const amt = roundMoney2(Number(amount))
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter an amount greater than zero')
      return
    }
    if (amt > outstanding + 0.009) {
      setError(`Amount must be at most ₹${outstanding.toFixed(2)}`)
      return
    }
    setSubmitting(true)
    try {
      const created = await api.post('/payment/installments/create', {
        bookingId: booking?._id,
        amount: amt,
        ...(applyWallet && walletBalance > 0 ? { useWalletCredit: true } : {}),
      })
      const { paymentId, orderId, amount: orderAmount, currency, keyId } = created.data || {}

      await loadRazorpayCheckout()

      let prefill = {}
      try {
        const pr = await api.get('/profile')
        prefill = buildRazorpayPrefill({
          name: pr.data?.name,
          phone: pr.data?.phone,
          email: pr.data?.email,
        })
      } catch {
        prefill = {}
      }

      const options = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: 'PhysioKhom',
        order_id: orderId,
        prefill,
        handler: async function (response) {
          try {
            await api.post('/payment/installments/verify', {
              paymentId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Installment paid')
            onPaid?.()
            onClose?.()
          } catch (e) {
            const msg = e.response?.data?.message || e.message || 'Payment verification failed'
            setError(msg)
            toast.error(msg)
          } finally {
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
          },
        },
        theme: { color: '#635bff' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Could not start payment'
      setError(msg)
      toast.error(msg)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Pay installment"
      description={`Outstanding balance: ₹${outstanding.toFixed(2)}. Pay any amount up to this limit.`}
    >
      <div className="space-y-4">
        {walletBalance > 0 ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-teal-600"
              checked={applyWallet}
              onChange={(e) => setApplyWallet(e.target.checked)}
              disabled={submitting}
            />
            <span>Apply up to ₹{Math.min(walletBalance, outstanding).toFixed(0)} wallet credit</span>
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Amount (₹)</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={outstanding}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            disabled={submitting}
          />
          {perSession > 0 ? (
            <p className="mt-1 text-[11px] text-ink-muted">Typical installment: ₹{perSession.toFixed(2)} per session.</p>
          ) : null}
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePay} disabled={submitting || outstanding <= 0}>
            {submitting ? 'Processing…' : `Pay ₹${Number(amount || 0).toFixed(2)}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
