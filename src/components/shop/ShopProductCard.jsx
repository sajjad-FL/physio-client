import { Link } from 'react-router-dom'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr } from '../../utils/shopDisplay'

export default function ShopProductCard({ product, onAddToCart, busy }) {
  const outOfStock = (product.stock ?? 0) <= 0
  const image = product.imageUrl || product.imageUrls?.[0]

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm ring-1 ring-black/2">
      <Link to={`/dashboard/products/${product._id}`} className="block">
        <div className="aspect-[4/3] w-full bg-slate-50">
          {image ? (
            <img src={resolveFileUrl(image)} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-muted">No image</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <Link to={`/dashboard/products/${product._id}`} className="line-clamp-2 text-xs font-semibold text-ink hover:text-teal-700">
          {product.name}
        </Link>
        <p className="mt-1 text-sm font-bold text-ink">{formatInr(product.price)}</p>
        <p className={`mt-0.5 text-[11px] ${outOfStock ? 'text-red-600' : 'text-ink-muted'}`}>
          {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </p>
        <button
          type="button"
          disabled={outOfStock || busy}
          onClick={() => onAddToCart?.(product)}
          className="mt-2 rounded-lg bg-teal-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
