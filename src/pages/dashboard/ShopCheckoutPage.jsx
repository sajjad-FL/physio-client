import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { formatInr } from '../../utils/shopDisplay'
import { useShopCart } from '../../hooks/useShopCart'

export default function ShopCheckoutPage() {
  const navigate = useNavigate()
  const { cart, loading, refresh, clear } = useShopCart()
  const [address, setAddress] = useState('')
  const [patientNote, setPatientNote] = useState('')
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    api
      .get('/profile')
      .then(({ data }) => {
        setAddress(data?.address?.text || data?.location || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading && !cart.items?.length) {
      navigate('/dashboard/cart', { replace: true })
    }
  }, [loading, cart.items, navigate])

  async function placeOrder(e) {
    e.preventDefault()
    if (!address.trim()) {
      toast.error('Delivery address is required')
      return
    }
    setPlacing(true)
    try {
      const { data } = await api.post('/shop/orders', {
        shippingAddress: { text: address.trim() },
        patientNote: patientNote.trim(),
      })
      await clear()
      toast.success('Order placed')
      navigate(`/dashboard/orders/${data._id}`, { replace: true })
    } catch (err) {
      toastApiError(err, 'Could not place order')
      await refresh()
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="type-page-title text-ink">Checkout</h1>

      <form onSubmit={placeOrder} className="space-y-4">
        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <h2 className="text-sm font-semibold text-ink">Delivery address</h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
            className="mt-2 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            placeholder="Full delivery address"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <h2 className="text-sm font-semibold text-ink">Order note (optional)</h2>
          <textarea
            value={patientNote}
            onChange={(e) => setPatientNote(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            placeholder="Any instructions for delivery"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <h2 className="text-sm font-semibold text-ink">Payment</h2>
          <p className="mt-1 text-sm text-ink-muted">Cash on Delivery (COD) — pay when your order arrives.</p>
          <p className="mt-3 text-lg font-bold text-ink">Total: {formatInr(cart.subtotal)}</p>
          <p className="text-xs text-ink-muted">{cart.itemCount} item(s)</p>
        </div>

        <button
          type="submit"
          disabled={placing}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {placing ? 'Placing order…' : 'Place order'}
        </button>
        <Link to="/dashboard/cart" className="block text-center text-xs font-semibold text-teal-700 hover:underline">
          Back to cart
        </Link>
      </form>
    </div>
  )
}
