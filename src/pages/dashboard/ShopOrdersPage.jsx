import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr, shopOrderStatusClass, shopOrderStatusLabel } from '../../utils/shopDisplay'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'

function itemSummary(items = []) {
  const names = items.map((i) => i.name).filter(Boolean)
  if (!names.length) return 'No items'
  if (names.length === 1) return names[0]
  return `${names[0]} + ${names.length - 1} more`
}

function OrderCard({ order }) {
  const items = order.items || []
  const preview = items.slice(0, 3)
  const extra = items.length - preview.length
  const address = order.shippingAddress?.text?.trim()

  return (
    <Link
      to={`/dashboard/orders/${order._id}`}
      className="group block overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm ring-1 ring-black/2 transition hover:border-teal-200 hover:shadow-md"
    >
      <div className="border-b border-border-subtle bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-ink">{order.orderNumber}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {new Date(order.createdAt).toLocaleString(undefined, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shopOrderStatusClass(order.status)}`}>
            {shopOrderStatusLabel(order.status)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {preview.length > 0 ? (
          <div className="flex items-start gap-3">
            <div className="flex -space-x-2">
              {preview.map((item) => (
                <div
                  key={`${item.productId}-${item.name}`}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-slate-100 ring-1 ring-border-subtle"
                >
                  {item.imageUrl ? (
                    <img src={resolveFileUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-muted">—</div>
                  )}
                </div>
              ))}
              {extra > 0 ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-white bg-slate-100 text-xs font-semibold text-ink-muted ring-1 ring-border-subtle">
                  +{extra}
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-ink">{itemSummary(items)}</p>
              <ul className="mt-1.5 space-y-0.5">
                {items.slice(0, 2).map((item) => (
                  <li key={`${item.productId}-line`} className="text-xs text-ink-muted">
                    {item.name} × {item.quantity} · {formatInr(item.price * item.quantity)}
                  </li>
                ))}
                {items.length > 2 ? (
                  <li className="text-xs text-ink-muted">+ {items.length - 2} more item(s)</li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : null}

        {address ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Delivery</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-ink">{address}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink">{formatInr(order.total)}</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Cash on delivery
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:underline">
            View details
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { page, pageSize, applyMeta, clearMeta, paginationProps } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/shop/orders', { params: { page, limit: pageSize } })
      setOrders(data?.data || [])
      applyMeta(data)
    } catch (err) {
      toastApiError(err, 'Could not load orders')
      setOrders([])
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="type-page-title text-ink">My orders</h1>
            <p className="mt-1 type-caption text-ink-muted">Track your shop orders and delivery status.</p>
          </div>
        </div>
        <Link
          to="/dashboard/products"
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/2 transition hover:border-teal-200 hover:bg-teal-50/50 hover:text-teal-800"
        >
          <svg className="h-4 w-4 shrink-0 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          Continue shopping
        </Link>
      </header>

      {loading ? (
        <ListSkeleton count={4} />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-white p-8 text-center">
          <p className="text-sm text-ink-muted">No orders yet.</p>
          <Link to="/dashboard/products" className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline">
            Browse shop
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o._id}>
              <OrderCard order={o} />
            </li>
          ))}
        </ul>
      )}

      <Pagination {...paginationProps} />
    </div>
  )
}
