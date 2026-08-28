import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingTimeSlot } from '../../utils/date'
import toast from 'react-hot-toast'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'
import FieldLabel from '../../components/ui/FieldLabel'
import { bookingCodeBadge } from '../../utils/bookingDisplay'
import TableSkeleton from '../../components/ui/skeletons/TableSkeleton'

export default function DisputesAdmin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [resolveRow, setResolveRow] = useState(null)
  const [resolution, setResolution] = useState('')
  const [action, setAction] = useState('reject')
  const [submitting, setSubmitting] = useState(false)
  const { page, pageSize, applyMeta, clearMeta, paginationProps } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/disputes', { params: { page, limit: pageSize } })
      setList(res.data?.data || [])
      applyMeta(res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load')
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  function openResolve(row) {
    setResolveRow(row)
    setResolution('')
    setAction('reject')
  }

  async function submitResolve(e) {
    e.preventDefault()
    if (!resolution.trim()) {
      toast.error('Resolution text is required')
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`/admin/disputes/${resolveRow._id}`, {
        resolution: resolution.trim(),
        action,
      })
      toast.success('Dispute updated')
      setResolveRow(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <TableSkeleton rows={6} />
  }

  return (
    <div>
      <AdminPageHeader
        title="Disputes"
        subtitle="Review cases raised by patients or physiotherapists. Open the related booking for full payment and session context."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Disputes' }]}
        actions={<AdminLink to="/admin">Bookings →</AdminLink>}
      />

      <div className="surface-card mt-6 overflow-x-auto rounded-2xl shadow-sm ring-1 ring-border-subtle/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-canvas/80 text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Raised by</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No disputes.
                </td>
              </tr>
            ) : (
              list.map((d) => {
                const bid = d.bookingId?._id
                const open = d.status === 'open' || d.status === 'under_review'
                return (
                  <tr key={d._id} className="bg-white/60 transition duration-200 ease-in-out hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {bid ? (
                        <Link
                          to={`/admin/bookings/${bid}`}
                          className="font-mono text-xs font-semibold text-teal-700 hover:underline"
                          title={String(bid)}
                        >
                          {bookingCodeBadge(d.bookingId) || '—'}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-ink">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.raisedBy === 'physio' ? 'Physiotherapist' : 'Patient'}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="line-clamp-2">{d.reason}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium ring-1 ring-border-subtle">
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {bid && (
                          <Link
                            to={`/admin/bookings/${bid}`}
                            className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                          >
                            Open booking
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetail(d)}
                          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-brand transition duration-200 ease-in-out hover:bg-gray-50 hover:underline"
                        >
                          View details
                        </button>
                        {open && (
                          <button
                            type="button"
                            onClick={() => openResolve(d)}
                            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 transition duration-200 ease-in-out hover:bg-gray-50 hover:underline"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination {...paginationProps} />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-border-subtle">
            <h2 className="type-page-title text-ink">Dispute details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ink-muted">Booking</dt>
                <dd className="font-mono text-xs">
                  {detail.bookingId?._id ? (
                    <Link
                      to={`/admin/bookings/${detail.bookingId._id}`}
                      className="font-semibold text-teal-700 hover:underline"
                    >
                      Open booking {bookingCodeBadge(detail.bookingId) || '—'}
                    </Link>
                  ) : (
                    '—'
                  )}
                  <span className="mt-1 block text-slate-600">
                    {detail.bookingId?.date}{' '}
                    {detail.bookingId?.timeSlot ? formatBookingTimeSlot(detail.bookingId.timeSlot) : '—'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Parties</dt>
                <dd>
                  Patient: {detail.bookingId?.userId?.name || '—'}
                  <br />
                  Physiotherapist: {detail.bookingId?.physioId?.name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Raised by</dt>
                <dd>{detail.raisedBy === 'physio' ? 'Physiotherapist' : 'Patient'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Payment</dt>
                <dd>{detail.bookingId?.paymentStatus || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Reason</dt>
                <dd>{detail.reason || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Description</dt>
                <dd className="whitespace-pre-wrap leading-relaxed">{detail.description || '—'}</dd>
              </div>
              {detail.resolution ? (
                <div>
                  <dt className="text-ink-muted">Resolution</dt>
                  <dd className="whitespace-pre-wrap">{detail.resolution}</dd>
                </div>
              ) : null}
            </dl>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-6 w-full cursor-pointer rounded-xl border border-border-subtle py-2.5 text-sm font-medium shadow-sm transition duration-200 ease-in-out hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {resolveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitResolve}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-border-subtle"
          >
            <h2 className="type-page-title text-ink">Resolve dispute</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Choose how payment should be handled. Reject closes the case without changing payment.
            </p>
            <FieldLabel required className="mt-4 block text-sm font-medium text-ink">
              Resolution message
            </FieldLabel>
            <textarea
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Visible to internal records / future audit."
            />
            <FieldLabel required className="mt-4 block text-sm font-medium text-ink">
              Action
            </FieldLabel>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm"
            >
              <option value="reject">Reject dispute — no payment change</option>
              <option value="refund">Refund — mark payment refunded</option>
              <option value="release">Release — pay out secured payment</option>
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolveRow(null)}
                className="cursor-pointer rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium shadow-sm transition duration-200 ease-in-out hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
