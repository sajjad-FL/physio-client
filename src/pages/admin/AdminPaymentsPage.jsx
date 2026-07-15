import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import AdminFlowGuide from '../../components/admin/AdminFlowGuide'
import AdminPaymentQueueTable, { PaymentQueueVerifySummary, isManagerPhonePe } from '../../components/admin/AdminPaymentQueueTable'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import FieldLabel from '../../components/ui/FieldLabel'
import usePagination from '../../hooks/usePagination'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
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
  const { page, pageSize, applyMeta, clearMeta, resetPage, paginationProps } = usePagination()
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
          limit: pageSize,
          search: applied.search || undefined,
          mode: applied.mode || undefined,
          status: applied.status || undefined,
          dateFrom: applied.dateFrom || undefined,
          dateTo: applied.dateTo || undefined,
        },
      })
      setPayload(res.data)
      applyMeta(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load payments')
      setPayload(null)
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, applied, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  const rows = payload?.data || []
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
    resetPage()
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
    resetPage()
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Payment queue"
        subtitle="Verify offline cash collections reported by physiotherapists. Online payments via Razorpay are verified automatically."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Payment queue' }]}
        actions={
          <>
            <AdminLink to="/admin/finance">Wallets &amp; payouts →</AdminLink>
            <AdminLink to="/admin">Bookings →</AdminLink>
          </>
        }
      />

      <AdminFlowGuide
        title="Payment flow"
        steps={[
          'Physio cash/UPI or manager PhonePe QR collections land here as Collected until you verify.',
          'Verify a row to credit wallets / unlock manager commission; reject if the screenshot or amount is wrong.',
          'Verified amounts update physiotherapist wallets — commission due appears under Finance.',
          'After sessions complete, release escrow from the booking detail page when appropriate.',
        ]}
      />

      {pendingVerification > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">{pendingVerification} installment{pendingVerification === 1 ? '' : 's'}</span>{' '}
          awaiting verification — filter by status &quot;Collected&quot; or use the Offline tab.
        </div>
      )}

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
              placeholder="Physiotherapist, patient, issue, booking id"
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
        <AdminPaymentQueueTable
          rows={rows}
          loading={loading}
          {...paginationProps}
          busy={busy}
          onVerify={setVerifyTarget}
          onReject={(row) => {
            setRejectTarget(row)
            setRejectReason('')
          }}
        />
      </Card>

      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="max-w-md shadow-xl">
            <h3 className="type-page-title text-gray-900">Verify payment</h3>
            <p className="mt-2 text-sm text-gray-600">
              Confirm <span className="font-semibold text-gray-900">{formatInr(verifyTarget.amount)}</span>
              {isManagerPhonePe(verifyTarget) ? (
                <>
                  {' '}
                  PhonePe QR collection by manager{' '}
                  <span className="font-semibold text-gray-900">{verifyTarget.managerName || 'Manager'}</span>
                </>
              ) : (
                <>
                  {' '}
                  collected by{' '}
                  <span className="font-semibold text-gray-900">{verifyTarget.physioName || 'physiotherapist'}</span>
                </>
              )}
              ? This posts the ledger entries for this installment.
            </p>
            <PaymentQueueVerifySummary row={verifyTarget} />
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
            <h3 className="type-page-title text-gray-900">Reject collection</h3>
            <p className="mt-1 text-sm text-gray-600">
              {isManagerPhonePe(rejectTarget)
                ? 'The manager can upload a new PhonePe screenshot after this.'
                : 'The physiotherapist can record a fresh collection after this.'}
            </p>
            <PaymentQueueVerifySummary row={rejectTarget} />
            <FieldLabel required className="mt-4 block text-xs font-medium text-gray-500">
              Reason
            </FieldLabel>
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
