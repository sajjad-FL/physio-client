import { useMemo } from 'react'

function formatRupees(n) {
  const v = Number(n || 0)
  return `₹${v.toFixed(2)}`
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CHIP = {
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  collected: 'bg-amber-50 text-amber-900 ring-amber-200',
  verified: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-900 ring-rose-200',
  refunded: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const STATUS_LABEL = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  collected: 'Collected — pending verification',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
}

/**
 * Installments card shared across patient / physio / admin views.
 *
 * - Renders the running header (paid, outstanding, sessions covered).
 * - Renders the installments table.
 * - Accepts `renderRowActions(payment)` so role-specific buttons (verify/reject,
 *   etc.) can be injected per row.
 * - Accepts `children` as a slot for role-specific header actions
 *   (e.g. "Pay next installment", "Record collection").
 */
export default function InstallmentsCard({
  title = 'Installments',
  subtitle,
  summary,
  payments,
  renderRowActions,
  children,
  emptyMessage = 'No installments recorded yet.',
}) {
  const rows = useMemo(() => {
    if (!Array.isArray(payments)) return []
    return [...payments].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime()
      const tb = new Date(b?.createdAt || 0).getTime()
      return tb - ta
    })
  }, [payments])

  const s = summary || {}
  const totalAmount = Number(s.totalAmount || 0)
  const totalPaid = Number(s.totalPaid || 0)
  const outstanding = Number(s.outstanding || Math.max(0, totalAmount - totalPaid))
  const totalPending = Number(s.totalPending || 0)
  const coveredSessions = Number(s.coveredSessions || 0)
  const sessionsCount = Number(s.sessionsCount || 0)

  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm ring-1 ring-border-subtle/80 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-ink-muted">{subtitle}</p> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle/80 bg-slate-50/60 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Paid</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-ink">
            {formatRupees(totalPaid)}{' '}
            <span className="text-xs font-normal text-ink-muted">of {formatRupees(totalAmount)}</span>
          </dd>
          {totalPending > 0 ? (
            <p className="mt-1 text-[11px] text-amber-800">
              {formatRupees(totalPending)} pending verification
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border-subtle/80 bg-slate-50/60 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Outstanding</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-ink">{formatRupees(outstanding)}</dd>
        </div>
        <div className="rounded-xl border border-border-subtle/80 bg-slate-50/60 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Sessions covered</dt>
          <dd className="mt-1 text-base font-semibold text-ink">
            {coveredSessions}{' '}
            <span className="text-xs font-normal text-ink-muted">of {sessionsCount || '—'}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-5 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-subtle bg-slate-50/60 px-4 py-6 text-center text-xs text-ink-muted">
            {emptyMessage}
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                <th className="pb-2 pr-3">When</th>
                <th className="pb-2 pr-3">Mode</th>
                <th className="pb-2 pr-3 text-right">Amount</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Note</th>
                {renderRowActions ? <th className="pb-2 pl-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/70">
              {rows.map((p) => {
                const chip = STATUS_CHIP[p.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                const label = STATUS_LABEL[p.status] || p.status
                return (
                  <tr key={p._id}>
                    <td className="py-2 pr-3 align-top text-ink">
                      {formatDate(p.verifiedAt || p.collectedAt || p.createdAt)}
                    </td>
                    <td className="py-2 pr-3 align-top capitalize text-ink">{p.mode}</td>
                    <td className="py-2 pr-3 align-top text-right font-medium tabular-nums text-ink">
                      {formatRupees(p.amount)}
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${chip}`}>
                        {label}
                      </span>
                      {p.status === 'rejected' && p.rejectReason ? (
                        <p className="mt-1 max-w-[200px] text-[11px] text-rose-700">{p.rejectReason}</p>
                      ) : null}
                    </td>
                    <td className="py-2 align-top text-xs text-ink-muted">
                      {p.note ? p.note : <span className="text-ink-muted/70">—</span>}
                    </td>
                    {renderRowActions ? (
                      <td className="py-2 pl-3 align-top text-right">{renderRowActions(p)}</td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
