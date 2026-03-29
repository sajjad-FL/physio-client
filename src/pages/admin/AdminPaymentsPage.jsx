import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/Pagination'

const adminHeaders = () => ({
  headers: { Authorization: `Bearer ${import.meta.env.VITE_ADMIN_API_KEY || ''}` },
})

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function statusBadge(status) {
  const s = status || 'pending'
  if (s === 'verified') {
    return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
  }
  if (s === 'collected') {
    return 'bg-amber-50 text-amber-900 ring-amber-200'
  }
  return 'bg-gray-100 text-gray-800 ring-gray-200'
}

function statusLabel(status) {
  const m = { pending: 'Pending', collected: 'Collected', verified: 'Verified', paid: 'Paid', refunded: 'Refunded' }
  return m[status] || status || '—'
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [applied, setApplied] = useState({ search: '', status: '', dateFrom: '', dateTo: '' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [selected, setSelected] = useState(null)
  const [verifyTarget, setVerifyTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/payments/offline', {
        ...adminHeaders(),
        params: {
          page,
          limit: 15,
          search: applied.search.trim() || undefined,
          status: applied.status || undefined,
          dateFrom: applied.dateFrom || undefined,
          dateTo: applied.dateTo || undefined,
        },
      })
      setPayload(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payments')
      setPayload(null)
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    load()
  }, [load])

  const rows = payload?.data || []
  const totalPages = payload?.totalPages || 1
  const pendingVerification = payload?.pendingVerification ?? 0
  const counts = payload?.counts || {}

  function applyFilters() {
    setApplied({
      search: search.trim(),
      status,
      dateFrom,
      dateTo,
    })
    setPage(1)
  }

  async function confirmVerify() {
    if (!verifyTarget) return
    const id = verifyTarget._id
    setBusy(`v-${id}`)
    try {
      await api.patch(`/bookings/${id}/verify-payment`, {}, adminHeaders())
      toast.success('Payment verified')
      setVerifyTarget(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Verification failed')
    } finally {
      setBusy(null)
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return
    const r = rejectReason.trim()
    if (!r) {
      toast.error('Enter a reason')
      return
    }
    const id = rejectTarget._id
    setBusy(`r-${id}`)
    try {
      await api.patch(`/bookings/${id}/reject-payment`, { reason: r }, adminHeaders())
      toast.success('Payment returned to pending')
      setRejectTarget(null)
      setRejectReason('')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Offline payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Verify cash collections from physiotherapists.{' '}
            <span className="font-medium text-amber-800">{pendingVerification} awaiting verification</span>
          </p>
        </div>
        <Link
          to="/admin/settlements"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Settlements →
        </Link>
      </div>

      <Card hover={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px] flex-1">
            <label className="text-xs font-medium text-gray-500">Search</label>
            <Input
              className="mt-1"
              placeholder="Physio, patient, or booking ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div className="w-full min-w-[140px] sm:w-40">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="collected">Collected</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div className="w-full min-w-[120px] sm:w-36">
            <label className="text-xs font-medium text-gray-500">From</label>
            <Input className="mt-1" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-full min-w-[120px] sm:w-36">
            <label className="text-xs font-medium text-gray-500">To</label>
            <Input className="mt-1" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={applyFilters}>
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('')
                setStatus('')
                setDateFrom('')
                setDateTo('')
                setApplied({ search: '', status: '', dateFrom: '', dateTo: '' })
                setPage(1)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">All: {counts.all ?? 0}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">Pending: {counts.pending ?? 0}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">Collected: {counts.collected ?? 0}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-900">Verified: {counts.verified ?? 0}</span>
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-gray-900">No payments match your filters</p>
            <p className="mt-1 text-xs text-gray-500">Try clearing search or date range, or check status “Collected”.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Physio</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row._id}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{row.physioName || '—'}</td>
                    <td className="px-4 py-3 text-gray-800">{row.patientName || '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{formatInr(row.totalAmount)}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">Offline</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(row.payment?.status)}`}
                      >
                        {statusLabel(row.payment?.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(row.updatedAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap justify-end gap-2">
                        {row.payment?.status === 'collected' && (
                          <>
                            <button
                              type="button"
                              disabled={busy === `v-${row._id}`}
                              onClick={() => setVerifyTarget(row)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              disabled={busy === `r-${row._id}`}
                              onClick={() => {
                                setRejectTarget(row)
                                setRejectReason('')
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          to={`/admin/bookings/${row._id}`}
                          className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/30"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white shadow-xl"
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Booking details</h2>
                <button
                  type="button"
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 font-mono text-xs text-gray-500">{selected._id}</p>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Physio</p>
                <p className="font-medium text-gray-900">{selected.physioName || '—'}</p>
                <p className="text-gray-600">{selected.physioPhone || ''}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Patient</p>
                <p className="font-medium text-gray-900">{selected.patientName || '—'}</p>
                <p className="text-gray-600">{selected.patientPhone || ''}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Payment</p>
                <p className="text-gray-900">{formatInr(selected.totalAmount)}</p>
                <p className="mt-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(selected.payment?.status)}`}>
                    {statusLabel(selected.payment?.status)}
                  </span>
                </p>
                {selected.offlinePaymentRejectReason ? (
                  <p className="mt-2 text-xs text-rose-700">Last reject: {selected.offlinePaymentRejectReason}</p>
                ) : null}
              </div>
              <Link
                to={`/admin/bookings/${selected._id}`}
                className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Full booking page →
              </Link>
            </div>
          </div>
        </div>
      )}

      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Verify payment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Confirm that {formatInr(verifyTarget.totalAmount)} has been received and should be recorded?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setVerifyTarget(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmVerify} disabled={busy === `v-${verifyTarget._id}`}>
                {busy === `v-${verifyTarget._id}` ? '…' : 'Confirm verify'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reject collection</h3>
            <p className="mt-1 text-sm text-gray-600">Payment will return to pending for the physio to re-collect.</p>
            <label className="mt-4 block text-xs font-medium text-gray-500">Reason</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Amount mismatch, patient dispute…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="outline" className="text-rose-700" onClick={confirmReject} disabled={busy === `r-${rejectTarget._id}`}>
                {busy === `r-${rejectTarget._id}` ? '…' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
