import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { formatInr, shopOrderStatusClass, shopOrderStatusLabel } from '../../utils/shopDisplay'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Pagination from '../../components/Pagination'

const STATUS_TABS = ['', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function AdminShopOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (status) params.status = status
      if (search.trim()) params.search = search.trim()
      const { data } = await api.get('/admin/shop/orders', { params })
      setOrders(data?.data || [])
      setTotalPages(data?.totalPages || 1)
    } catch (err) {
      toastApiError(err, 'Could not load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <AdminPageHeader
        title="Shop orders"
        subtitle="Manage patient product orders — confirm, ship, deliver, or cancel."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Shop orders' }]}
        actions={
          <Link to="/admin/products" className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-border-subtle hover:bg-slate-50">
            Products
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-ink-muted'}`}
          >
            {s ? shopOrderStatusLabel(s) : 'All'}
          </button>
        ))}
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          load()
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, phone, name"
          className="h-10 flex-1 rounded-lg border border-border-subtle px-3 text-sm"
        />
        <button type="submit" className="rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink-muted">No orders found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-slate-50 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/admin/shop/orders/${o._id}`} className="font-semibold text-teal-700 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.customerName || o.customer?.name || '—'}</p>
                    <p className="text-xs text-ink-muted">{o.customerPhone || o.customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3">{formatInr(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${shopOrderStatusClass(o.status)}`}>
                      {shopOrderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
