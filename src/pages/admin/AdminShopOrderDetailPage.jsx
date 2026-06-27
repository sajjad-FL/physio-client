import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr, shopOrderStatusClass, shopOrderStatusLabel } from '../../utils/shopDisplay'
import ShopOrderStatusTimeline from '../../components/shop/ShopOrderStatusTimeline'

const NEXT_ACTIONS = {
  placed: [{ status: 'confirmed', label: 'Confirm order' }],
  confirmed: [{ status: 'shipped', label: 'Mark shipped' }],
  shipped: [{ status: 'delivered', label: 'Mark delivered' }],
}

export default function AdminShopOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/shop/orders/${id}`)
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

  async function updateStatus(status, extra = {}) {
    setBusy(true)
    try {
      const { data } = await api.patch(`/admin/shop/orders/${id}/status`, { status, ...extra })
      setOrder(data)
      setShowCancel(false)
      setCancelReason('')
      toast.success(`Order ${shopOrderStatusLabel(status).toLowerCase()}`)
    } catch (err) {
      toastApiError(err, 'Could not update order')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>
  if (!order) {
    return (
      <div>
        <p className="text-sm text-ink-muted">Order not found.</p>
        <Link to="/admin/shop/orders" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const actions = NEXT_ACTIONS[order.status] || []
  const canCancel = ['placed', 'confirmed', 'shipped'].includes(order.status)

  return (
    <div className="space-y-4">
      <Link to="/admin/shop/orders" className="text-xs font-semibold text-teal-700 hover:underline">
        ← Shop orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-ink-muted">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${shopOrderStatusClass(order.status)}`}>
          {shopOrderStatusLabel(order.status)}
        </span>
      </div>

      <ShopOrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={busy}
            onClick={() => updateStatus(a.status)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {a.label}
          </button>
        ))}
        {canCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowCancel(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            Cancel order
          </button>
        ) : null}
      </div>

      {showCancel ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <label className="block text-sm font-semibold text-red-800">Cancellation reason</label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy || !cancelReason.trim()}
              onClick={() => updateStatus('cancelled', { cancelReason: cancelReason.trim() })}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Confirm cancel
            </button>
            <button type="button" onClick={() => setShowCancel(false)} className="text-xs font-semibold text-red-800">
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <h2 className="text-sm font-semibold text-ink">Customer</h2>
          <p className="mt-2 text-sm">{order.customerName || order.customer?.name}</p>
          <p className="text-sm text-ink-muted">{order.customerPhone || order.customer?.phone}</p>
          <p className="text-sm text-ink-muted">{order.customer?.email}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-white p-4">
          <h2 className="text-sm font-semibold text-ink">Delivery</h2>
          <p className="mt-2 text-sm text-ink-muted">{order.shippingAddress?.text || '—'}</p>
          {order.patientNote ? <p className="mt-2 text-xs text-ink-muted">Note: {order.patientNote}</p> : null}
          <p className="mt-2 text-sm font-semibold">Payment: Cash on Delivery</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-4">
        <h2 className="text-sm font-semibold text-ink">Items</h2>
        <ul className="mt-3 divide-y divide-border-subtle">
          {order.items?.map((item) => (
            <li key={`${item.productId}-${item.name}`} className="flex gap-3 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                {item.imageUrl ? <img src={resolveFileUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {formatInr(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatInr(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border-subtle pt-3 font-bold">
          <span>Total</span>
          <span>{formatInr(order.total)}</span>
        </div>
      </div>
    </div>
  )
}
