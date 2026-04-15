import { useMemo, useState } from 'react'
import { api } from '../config/api'

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
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
      document.body.appendChild(script)
    })
  }

  return razorpayScriptPromise
}

export default function RazorpayPayButton({ bookingId, onPaid }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const buttonLabel = useMemo(() => (loading ? 'Processing…' : 'Pay securely'), [loading])

  async function handlePay() {
    setError('')
    setLoading(true)

    try {
      const orderRes = await api.post('/payment/create-order', { bookingId })
      const { orderId, amount, currency, keyId } = orderRes.data || {}

      await loadRazorpayCheckout()

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'NearbyPhysio',
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
        prefill: {
          // Customer phone is optional; we already have it in the token-backed user record.
          // Leave empty to keep this MVP minimal.
        },
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

