import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/Pagination'

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

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-800 ring-gray-200',
  paid: 'bg-sky-50 text-sky-900 ring-sky-200',
  collected: 'bg-amber-50 text-amber-900 ring-amber-200',
  verified: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-900 ring-rose-200',
  refunded: 'bg-violet-50 text-violet-900 ring-violet-200',
}

const STATUS_LABEL = {
  pending: 'Pending',
  paid: 'Paid',
  collected: 'Collected',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
}

function StatusBadge({ status }) {
  const key = status || 'pending'
  const klass = STATUS_STYLES[key] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${klass}`}>
      {STATUS_LABEL[key] || key}
    </span>
  )
}

const MODE_TABS = [
  { id: '', label: 'All' },
  { id: 'offline', label: 'Offline' },
  { id: 'online', label: 'Online' },
]

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [applied, setApplied] = useState({ search: '', mode: '', status: '', dateFrom: '', dateTo: '' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [verifyTarget, setVerifyTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/payments', {
        params: {
          page,
          limit: 20,
          search: applied.search || undefined,
          mode: applied.mode || undefined,
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
  const counts = payload?.counts || {}
  const pendingVerification = payload?.pendingVerification ?? 0

  function applyFilters(override = {}) {
    setApplied((prev) => ({
      search: override.search !== undefined ? override.search : search.trim(),
      mode: override.mode !== undefined ? override.mode : prev.mode,
      status: override.status !== undefined ? override.status : status,
      dateFrom: override.dateFrom !== undefined ? override.dateFrom : dateFrom,
      dateTo: override.dateTo !== undefined ? override.dateTo : dateTo,
    }))
    setPage(1)
  }

  function setModeTab(next) {
    setMode(next)
    applyFilters({ mode: next })
  }

  function resetFilters() {
    setSearch('')
    setMode('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setApplied({ search: '', mode: '', status: '', dateFrom: '', dateTo: '' })
    setPage(1)
  }

  async function confirmVerify() {
    if (!verifyTarget) return
    setBusy(`v-${verifyTarget._id}`)
    try {
      await api.post(`/admin/payments/${verifyTarget._id}/verify`)
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
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error('Enter a reason')
      return
    }
    setBusy(`r-${rejectTarget._id}`)
    try {
      await api.post(`/admin/payments/${rejectTarget._id}/reject`, { reason })
      toast.success('Payment rejected')
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
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            One row per installment. Verify cash collections from physios — online installments auto-verify via Razorpay.
            {pendingVerification > 0 && (
              <span className="ml-1 font-medium text-amber-800">
                {pendingVerification} awaiting verification
              </span>
            )}
          </p>
        </div>
        <Link
          to="/admin/finance"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Finance &amp; payouts →
        </Link>
      </div>

      <Card hover={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {MODE_TABS.map((t) => {
            const active = mode === t.id
            return (
              <button
                key={t.id || 'all'}
                type="button"
                onClick={() => setModeTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="text-xs font-medium text-gray-500">Search</label>
            <Input
              className="mt-1"
              placeholder="Physio, patient, booking id, payment id"
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
              <option value="paid">Paid</option>
              <option value="collected">Collected</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="refunded">Refunded</option>
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
            <Button type="button" variant="outline" onClick={() => applyFilters()}>
              Apply
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">Total: {counts.all ?? 0}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">Collected: {counts.collected ?? 0}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-900">Verified: {counts.verified ?? 0}</span>
          {counts.pending ? <span className="rounded-full bg-gray-100 px-2 py-0.5">Pending: {counts.pending}</span> : null}
          {counts.paid ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-900">Paid: {counts.paid}</span> : null}
          {counts.rejected ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-900">Rejected: {counts.rejected}</span> : null}
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-gray-900">No payments match your filters</p>
            <p className="mt-1 text-xs text-gray-500">Adjust the filters or try a different search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
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
                {rows.map((row) => {
                  const canVerify = row.mode === 'offline' && row.status === 'collected'
                  return (
                    <tr key={row._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.physioName || '—'}</div>
                        {row.physioPhone && <div className="text-xs text-gray-500">{row.physioPhone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800">{row.patientName || '—'}</div>
                        {row.patientPhone && <div className="text-xs text-gray-500">{row.patientPhone}</div>}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{formatInr(row.amount)}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{row.mode}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                        {row.status === 'rejected' && row.rejectReason && (
                          <div className="mt-1 max-w-[200px] truncate text-xs text-rose-700" title={row.rejectReason}>
                            {row.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canVerify && (
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
                            to={`/admin/bookings/${row.bookingId}`}
                            className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Verify payment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Confirm <span className="font-semibold text-gray-900">{formatInr(verifyTarget.amount)}</span> collected by{' '}
              <span className="font-semibold text-gray-900">{verifyTarget.physioName}</span>? This posts the ledger
              entries for this installment.
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
            <p className="mt-1 text-sm text-gray-600">The physio can record a fresh collection after this.</p>
            <label className="mt-4 block text-xs font-medium text-gray-500">Reason</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. amount mismatch, patient dispute…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-rose-700"
                onClick={confirmReject}
                disabled={busy === `r-${rejectTarget._id}`}
              >
                {busy === `r-${rejectTarget._id}` ? '…' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
