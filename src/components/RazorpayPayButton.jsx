import { useMemo, useState } from 'react'
import { api } from '../config/api'
import { loadRazorpayCheckout } from '../utils/loadRazorpayCheckout'
import { buildRazorpayPrefill } from '../utils/razorpayPrefill'

export default function RazorpayPayButton({ bookingId, onPaid, useWalletCredit = false, walletBalance = 0 }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buttonLabel = useMemo(() => (loading ? 'Processing…' : 'Pay securely'), [loading])

  async function handlePay() {
    setError('')
    setLoading(true)

    try {
      const orderRes = await api.post('/payment/create-order', {
        bookingId,
        ...(useWalletCredit && walletBalance > 0 ? { useWalletCredit: true } : {}),
      })
      const { orderId, amount, currency, keyId } = orderRes.data || {}

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
        amount,
        currency,
        name: 'PhysiOkhom',
        order_id: orderId,
        handler: async function (response) {
          try {
            await api.post('/payment/verify', {
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            onPaid?.()
          } catch (e) {
            setError(e.response?.data?.message || e.message || 'Payment verification failed')
          }
        },
        prefill,
        theme: {
          color: '#635bff',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surface-card rounded-2xl p-6 sm:p-7">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="interactive-press flex h-11 w-full items-center justify-center rounded-lg bg-brand text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(10,37,64,0.08)] transition-colors duration-200 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Secure Razorpay checkout. Your payment is kept safe and paid out only after session completion and platform
        confirmation.
      </p>
    </div>
  )
}

