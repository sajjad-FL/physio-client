import { Link } from 'react-router-dom'
import Pagination from '../Pagination'
import AdminCaseContext from './AdminCaseContext'

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

export function PaymentStatusBadge({ status }) {
  const key = status || 'pending'
  const klass = STATUS_STYLES[key] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${klass}`}>
      {STATUS_LABEL[key] || key}
    </span>
  )
}

export function PaymentQueueVerifySummary({ row }) {
  if (!row) return null
  return (
    <div className="mt-3 space-y-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{row.patientName || 'Patient'}</p>
      <AdminCaseContext source={row} compact showPatient={false} showLink={false} />
      {row.sessionOrdinal ? (
        <p className="text-xs text-gray-500">Session #{row.sessionOrdinal}</p>
      ) : null}
    </div>
  )
}

/**
 * Shared admin payment queue table (used on AdminPaymentsPage and AdminFinancePage).
 */
export default function AdminPaymentQueueTable({
  rows,
  loading,
  page,
  totalPages,
  onPageChange,
  busy,
  onVerify,
  onReject,
  openBookingLabel = 'Open',
  emptyTitle = 'No payments match your filters',
  emptyHint = 'Adjust the filters or try a different search.',
}) {
  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
  }

  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-medium text-gray-900">{emptyTitle}</p>
        <p className="mt-1 text-xs text-gray-500">{emptyHint}</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3">Physiotherapist</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Case</th>
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
                  <td className="px-4 py-3">
                    <AdminCaseContext source={row} compact showPatient={false} showLink={false} />
                    {row.sessionOrdinal ? (
                      <div className="mt-0.5 text-[10px] text-gray-400">Session #{row.sessionOrdinal}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">{formatInr(row.amount)}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{row.mode}</td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={row.status} />
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
                            disabled={busy === `v-${row._id}` || busy === `qv-${row._id}`}
                            onClick={() => onVerify(row)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            disabled={busy === `r-${row._id}` || busy === `qr-${row._id}`}
                            onClick={() => onReject(row)}
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
                        {openBookingLabel}
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 0 ? (
        <div className="border-t border-gray-100 px-4 py-3">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      ) : null}
    </>
  )
}
