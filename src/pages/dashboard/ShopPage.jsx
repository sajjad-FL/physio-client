import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import ShopProductCard from '../../components/shop/ShopProductCard'
import CardGridSkeleton from '../../components/ui/skeletons/CardGridSkeleton'
import { useShopCart } from '../../hooks/useShopCart'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const { updateItem, itemCount } = useShopCart()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/shop/products', { params: { limit: 50 } })
      setProducts(data?.data || [])
    } catch (err) {
      toastApiError(err, 'Could not load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function addToCart(product) {
    setBusyId(product._id)
    try {
      await updateItem(product._id, 1)
      toast.success('Added to cart')
    } catch (err) {
      toastApiError(err, 'Could not add to cart')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div>
          <h1 className="type-page-title text-ink">Shop</h1>
          <p className="mt-1 type-caption text-ink-muted">
            Recovery products with cash on delivery. Browse, add to cart, and place your order.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/2 transition hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-800"
          >
            <svg className="h-4 w-4 shrink-0 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            My orders
          </Link>
          <Link
            to="/dashboard/cart"
            className="relative inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 motion-safe:active:scale-[0.98]"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Cart
            {itemCount > 0 ? (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold tabular-nums">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <p className="text-sm text-ink-muted">No products available right now.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,160px))] gap-3">
          {products.map((p) => (
            <ShopProductCard key={p._id} product={p} onAddToCart={addToCart} busy={busyId === p._id} />
          ))}
        </div>
      )}
    </div>
  )
}
