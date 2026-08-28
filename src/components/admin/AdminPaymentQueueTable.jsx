import { Link } from 'react-router-dom'
import Pagination from '../Pagination'
import TableSkeleton from '../ui/skeletons/TableSkeleton'
import AdminCaseContext from './AdminCaseContext'
import { assetUrl } from '../../utils/assetUrl'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v)
}

function formatDateTime(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function isManagerPhonePe(row) {
  return row?.meta?.collectionChannel === 'phonepe_qr' && Boolean(row?.meta?.managerId)
}

export { isManagerPhonePe }

function channelLabel(row) {
  const channel = String(row?.meta?.collectionChannel || row?.collectionChannel || '').toLowerCase()
  if (channel === 'phonepe_qr') return 'PhonePe QR'
  if (channel === 'cash') return 'Cash'
  if (row?.mode === 'online') return 'Online'
  if (row?.mode === 'offline') return 'Cash / UPI'
  return row?.mode || '—'
}

function channelBadgeClass(row) {
  const channel = String(row?.meta?.collectionChannel || row?.collectionChannel || '').toLowerCase()
  if (channel === 'phonepe_qr') return 'bg-violet-50 text-violet-900 ring-violet-200'
  if (channel === 'cash' || (row?.mode === 'offline' && !channel)) return 'bg-amber-50 text-amber-950 ring-amber-200'
  if (row?.mode === 'online') return 'bg-sky-50 text-sky-900 ring-sky-200'
  return 'bg-gray-50 text-gray-700 ring-gray-200'
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
  const proofSrc = assetUrl(row.proofUrl)
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
      <p className="font-medium text-gray-900">{row.patientName || 'Patient'}</p>
      <AdminCaseContext source={row} compact showPatient={false} showLink={false} />
      {row.sessionOrdinal ? (
        <p className="text-xs text-gray-500">Session #{row.sessionOrdinal}</p>
      ) : null}
      <p className="text-xs text-gray-600">{channelLabel(row)}</p>
      {isManagerPhonePe(row) && row.managerName ? (
        <p className="text-xs text-gray-600">Manager: {row.managerName}</p>
      ) : null}
      {proofSrc ? (
        <a href={proofSrc} target="_blank" rel="noreferrer" className="block">
          <img
            src={proofSrc}
            alt="Payment screenshot"
            className="mt-1 max-h-40 rounded-lg border border-gray-200 object-contain"
          />
          <span className="mt-1 inline-block text-xs font-medium text-teal-700">Open screenshot</span>
        </a>
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
  total,
  pageSize,
  onPageSizeChange,
  busy,
  onVerify,
  onReject,
  openBookingLabel = 'Open',
  emptyTitle = 'No payments match your filters',
  emptyHint = 'Adjust the filters or try a different search.',
}) {
  if (loading) {
    return <TableSkeleton rows={6} className="p-4" />
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
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-[11px] font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
            <tr>
              <th className="px-3 py-2.5">Collected by</th>
              <th className="px-3 py-2.5">Patient</th>
              <th className="px-3 py-2.5">Case</th>
              <th className="px-3 py-2.5">Amount</th>
              <th className="px-3 py-2.5">Channel</th>
              <th className="px-3 py-2.5">Proof</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">When</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const canVerify = row.mode === 'offline' && row.status === 'collected'
              const proofSrc = assetUrl(row.proofUrl)
              return (
                <tr key={row._id} className="hover:bg-gray-50/80">
                  <td className="px-3 py-2.5">
                    {isManagerPhonePe(row) ? (
                      <>
                        <div className="font-medium text-gray-900">{row.managerName || 'Manager'}</div>
                        {row.managerPhone ? <div className="text-xs text-gray-500">{row.managerPhone}</div> : null}
                        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700/80">
                          Care manager
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-gray-900">{row.physioName || '—'}</div>
                        {row.physioPhone && <div className="text-xs text-gray-500">{row.physioPhone}</div>}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-gray-800">{row.patientName || '—'}</div>
                    {row.patientPhone && <div className="text-xs text-gray-500">{row.patientPhone}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <AdminCaseContext source={row} compact showPatient={false} showLink={false} />
                    {row.sessionOrdinal ? (
                      <div className="mt-0.5 text-[10px] text-gray-400">Session #{row.sessionOrdinal}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold text-gray-900">{formatInr(row.amount)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${channelBadgeClass(row)}`}
                    >
                      {channelLabel(row)}
                    </span>
                    {row.note ? (
                      <div className="mt-1 max-w-[140px] truncate text-[11px] text-gray-400" title={row.note}>
                        {row.note}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    {proofSrc ? (
                      <a
                        href={proofSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block overflow-hidden rounded-md border border-gray-200"
                      >
                        <img src={proofSrc} alt="Proof" className="h-10 w-10 object-cover" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <PaymentStatusBadge status={row.status} />
                    {row.status === 'rejected' && row.rejectReason && (
                      <div className="mt-1 max-w-[180px] truncate text-xs text-rose-700" title={row.rejectReason}>
                        {row.rejectReason}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-600">
                    <div>{formatDateTime(row.verifiedAt || row.collectedAt || row.createdAt)}</div>
                    {row.verifiedAt && row.collectedAt ? (
                      <div className="text-[10px] text-gray-400">Collected {formatDateTime(row.collectedAt)}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {canVerify && (
                        <>
                          <button
                            type="button"
                            disabled={busy === `v-${row._id}` || busy === `qv-${row._id}`}
                            onClick={() => onVerify(row)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Verify
                          </button>
                          <button
                            type="button"
                            disabled={busy === `r-${row._id}` || busy === `qr-${row._id}`}
                            onClick={() => onReject(row)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <Link
                        to={`/admin/bookings/${row.bookingId}`}
                        className="inline-flex rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            total={total}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      ) : null}
    </>
  )
}
