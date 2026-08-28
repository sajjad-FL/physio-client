import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr } from '../../utils/shopDisplay'
import { useShopCart } from '../../hooks/useShopCart'
import Skeleton from '../../components/ui/Skeleton'

export default function ShopProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [imageIdx, setImageIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const { updateItem } = useShopCart()

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await api.get(`/shop/products/${id}`)
      setProduct(data)
    } catch (err) {
      toastApiError(err, 'Product not found')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />
  }

  if (!product) {
    return (
      <div>
        <p className="text-sm text-ink-muted">Product not found.</p>
        <Link to="/dashboard/products" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">
          Back to shop
        </Link>
      </div>
    )
  }

  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
  const outOfStock = (product.stock ?? 0) <= 0
  const maxQty = Math.max(0, product.stock ?? 0)

  async function addToCart() {
    setBusy(true)
    try {
      await updateItem(product._id, qty)
      toast.success('Added to cart')
      navigate('/dashboard/cart')
    } catch (err) {
      toastApiError(err, 'Could not add to cart')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Link to="/dashboard/products" className="text-xs font-semibold text-teal-700 hover:underline">
        ← Back to shop
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-border-subtle">
            {images[imageIdx] ? (
              <img src={resolveFileUrl(images[imageIdx])} alt={product.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImageIdx(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 ${i === imageIdx ? 'ring-teal-600' : 'ring-transparent'}`}
                >
                  <img src={resolveFileUrl(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="type-page-title text-ink">{product.name}</h1>
          <p className="mt-2 text-xl font-bold text-ink">{formatInr(product.price)}</p>
          <p className={`mt-1 text-sm ${outOfStock ? 'text-red-600' : 'text-ink-muted'}`}>
            {outOfStock ? 'Out of stock' : `${product.stock} available`}
          </p>
          {product.description ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{product.description}</p>
          ) : null}

          {!outOfStock ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-ink-muted">
                Qty
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
                  className="ml-2 h-10 w-16 rounded-lg border border-border-subtle px-2 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={addToCart}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {busy ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
