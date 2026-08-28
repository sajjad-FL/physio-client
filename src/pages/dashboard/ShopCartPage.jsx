import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr } from '../../utils/shopDisplay'
import { useShopCart } from '../../hooks/useShopCart'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'

export default function ShopCartPage() {
  const { cart, loading, updateItem } = useShopCart()
  const [busyId, setBusyId] = useState(null)

  async function changeQty(productId, quantity) {
    setBusyId(productId)
    try {
      await updateItem(productId, quantity)
    } catch (err) {
      toastApiError(err, 'Could not update cart')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <ListSkeleton count={3} />
  }

  if (!cart.items?.length) {
    return (
      <div className="space-y-3">
        <h1 className="type-page-title text-ink">Cart</h1>
        <p className="text-sm text-ink-muted">Your cart is empty.</p>
        <Link to="/dashboard/products" className="inline-block text-sm font-semibold text-teal-700 hover:underline">
          Browse shop
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="type-page-title text-ink">Cart</h1>
        <Link to="/dashboard/products" className="text-xs font-semibold text-teal-700 hover:underline">
          Continue shopping
        </Link>
      </header>

      <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-white">
        {cart.items.map((line) => {
          const img = line.product?.imageUrl || line.product?.imageUrls?.[0]
          return (
            <li key={line.productId} className="flex gap-3 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                {img ? <img src={resolveFileUrl(img)} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{line.product?.name}</p>
                <p className="text-sm text-ink-muted">{formatInr(line.product?.price)} each</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === line.productId}
                    onClick={() => changeQty(line.productId, Math.max(0, line.quantity - 1))}
                    className="h-8 w-8 rounded-lg ring-1 ring-border-subtle"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    disabled={busyId === line.productId || line.quantity >= (line.product?.stock ?? 0)}
                    onClick={() => changeQty(line.productId, line.quantity + 1)}
                    className="h-8 w-8 rounded-lg ring-1 ring-border-subtle disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={busyId === line.productId}
                    onClick={() => changeQty(line.productId, 0)}
                    className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 text-sm font-bold text-ink">{formatInr(line.lineTotal)}</p>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
        <span className="font-semibold text-ink">Subtotal</span>
        <span className="text-lg font-bold text-ink">{formatInr(cart.subtotal)}</span>
      </div>

      <Link
        to="/dashboard/checkout"
        className="block rounded-xl bg-teal-600 py-3 text-center text-sm font-semibold text-white hover:bg-teal-700"
      >
        Proceed to checkout
      </Link>
    </div>
  )
}
