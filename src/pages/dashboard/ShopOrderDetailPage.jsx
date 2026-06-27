import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr, shopOrderStatusClass, shopOrderStatusLabel } from '../../utils/shopDisplay'
import ShopOrderStatusTimeline from '../../components/shop/ShopOrderStatusTimeline'

export default function ShopOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await api.get(`/shop/orders/${id}`)
      setOrder(data)
    } catch (err) {
      toastApiError(err, 'Order not found')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="text-sm text-ink-muted">Loading order…</p>
  if (!order) {
    return (
      <div>
        <p className="text-sm text-ink-muted">Order not found.</p>
        <Link to="/dashboard/orders" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/dashboard/orders" className="text-xs font-semibold text-teal-700 hover:underline">
        ← My orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="type-page-title text-ink">{order.orderNumber}</h1>
          <p className="text-xs text-ink-muted">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shopOrderStatusClass(order.status)}`}>
          {shopOrderStatusLabel(order.status)}
        </span>
      </header>

      <ShopOrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />

      <div className="rounded-2xl border border-border-subtle bg-white p-4">
        <h2 className="text-sm font-semibold text-ink">Items</h2>
        <ul className="mt-3 divide-y divide-border-subtle">
          {order.items?.map((item) => (
            <li key={`${item.productId}-${item.name}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                {item.imageUrl ? (
                  <img src={resolveFileUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {formatInr(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink">{formatInr(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border-subtle pt-3 text-sm font-bold">
          <span>Total (COD)</span>
          <span>{formatInr(order.total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-4">
        <h2 className="text-sm font-semibold text-ink">Delivery address</h2>
        <p className="mt-2 text-sm text-ink-muted">{order.shippingAddress?.text || '—'}</p>
        {order.patientNote ? (
          <>
            <h2 className="mt-4 text-sm font-semibold text-ink">Your note</h2>
            <p className="mt-1 text-sm text-ink-muted">{order.patientNote}</p>
          </>
        ) : null}
      </div>

      {order.status === 'cancelled' && order.cancelReason ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          <strong>Cancellation reason:</strong> {order.cancelReason}
        </div>
      ) : null}
    </div>
  )
}
