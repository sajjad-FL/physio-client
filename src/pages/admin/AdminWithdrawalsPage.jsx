import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function statusBadgeClass(status) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'approved':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200'
    case 'rejected':
      return 'bg-rose-50 text-rose-900 ring-rose-200'
    default:
      return 'bg-gray-50 text-gray-800 ring-gray-200'
  }
}

export default function AdminWithdrawalsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/withdraw')
      setList(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function applyStatus(status) {
    if (!confirm?.row?._id) return
    setSubmitting(true)
    try {
      await api.patch(`/withdraw/${confirm.row._id}`, { status })
      toast.success(status === 'approved' ? 'Withdrawal approved and payout recorded' : 'Request rejected')
      setConfirm(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-canvas" />
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-border-subtle/80" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Withdrawals</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Review physio payout requests. Approving debits their wallet and posts a withdrawal transaction.
      </p>

      <div className="surface-card mt-8 overflow-x-auto rounded-2xl shadow-sm ring-1 ring-border-subtle/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-canvas/80 text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Physio</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No withdrawal requests yet.
                </td>
              </tr>
            ) : (
              list.map((row) => {
                const name = row.physioId?.name || '—'
                const pending = row.status === 'pending'
                return (
                  <tr key={row._id} className="bg-white/60 transition duration-200 ease-in-out hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-ink">{name}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatInr(row.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                      {row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pending ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirm({ row, action: 'approved' })}
                            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 transition duration-200 ease-in-out hover:bg-emerald-50 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirm({ row, action: 'rejected' })}
                            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 transition duration-200 ease-in-out hover:bg-rose-50 hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {row.processedAt ? `Processed ${new Date(row.processedAt).toLocaleString()}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-border-subtle">
            <h2 className="text-lg font-semibold text-ink">
              {confirm.action === 'approved' ? 'Approve withdrawal' : 'Reject withdrawal'}
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {confirm.action === 'approved' ? (
                <>
                  This will debit <span className="font-semibold text-ink">{formatInr(confirm.row.amount)}</span> from{' '}
                  <span className="font-semibold text-ink">{confirm.row.physioId?.name || 'physio'}</span>
                  &apos;s available balance and record a withdrawal transaction. Confirm payout was sent outside the app
                  if required.
                </>
              ) : (
                <>
                  Rejecting leaves their balance unchanged. They can submit a new request later.
                </>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="cursor-pointer rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium shadow-sm transition duration-200 ease-in-out hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => applyStatus(confirm.action)}
                className={
                  confirm.action === 'approved'
                    ? 'cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50'
                    : 'cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50'
                }
              >
                {submitting ? 'Working…' : confirm.action === 'approved' ? 'Confirm approve' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
