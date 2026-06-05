import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import AdminFlowGuide from '../../components/admin/AdminFlowGuide'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/Pagination'

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

function DueBadge({ due }) {
  const d = Number(due) || 0
  if (d <= 0.009) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        Clear
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
      Due
    </span>
  )
}

const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'due', label: 'Commission due' },
  { id: 'payout', label: 'Pending payouts' },
  { id: 'all', label: 'All' },
]

export default function AdminFinancePage() {
  const [summary, setSummary] = useState(null)
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleNote, setSettleNote] = useState('')
  const [busy, setBusy] = useState(null)

  const [payoutAction, setPayoutAction] = useState(null)
  const [payoutNote, setPayoutNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        api.get('/admin/finance/summary'),
        api.get('/admin/finance/physios', {
          params: { page, limit: 20, search: applied || undefined, filter },
        }),
      ])
      setSummary(s.data)
      setRows(p.data?.data || [])
      setTotalPages(p.data?.totalPages || 1)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }, [page, applied, filter])

  useEffect(() => {
    load()
  }, [load])

  function applySearch() {
    setApplied(search.trim())
    setPage(1)
  }

  async function openDetail(row) {
    setSelected(row)
    setDetail(null)
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/admin/finance/physios/${row._id}`)
      setDetail(data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load details')
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetail() {
    setSelected(null)
    setDetail(null)
  }

  function openSettle(row) {
    setSelected(row)
    const due = Number(row.wallet?.commissionDue || 0)
    setSettleAmount(due > 0 ? String(due.toFixed(2)) : '')
    setSettleNote('')
    setSettleOpen(true)
  }

  async function submitSettle(e) {
    e?.preventDefault?.()
    if (!selected?._id) return
    const amt = Number(settleAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setBusy(`s-${selected._id}`)
    try {
      await api.post('/admin/finance/settle-commission', {
        physioId: selected._id,
        amount: amt,
        note: settleNote.trim() || undefined,
      })
      toast.success('Settlement recorded')
      setSettleOpen(false)
      setSettleAmount('')
      setSettleNote('')
      await load()
      if (selected) await openDetail(selected)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed')
    } finally {
      setBusy(null)
    }
  }

  async function submitPayoutAction() {
    if (!payoutAction) return
    const { requestId, action } = payoutAction
    setBusy(`w-${requestId}`)
    try {
      await api.patch(`/withdraw/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        note: payoutNote.trim() || undefined,
      })
      toast.success(action === 'approve' ? 'Payout approved' : 'Payout rejected')
      setPayoutAction(null)
      setPayoutNote('')
      await load()
      if (selected) await openDetail(selected)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  const tiles = useMemo(
    () => [
      { label: 'Total revenue', value: summary?.totalRevenue, sub: 'Gross from paid bookings' },
      { label: 'Commission earned', value: summary?.totalCommission, sub: 'Platform share' },
      { label: 'Commission due', value: summary?.pendingSettlements, sub: 'Owed by physios' },
      {
        label: 'Pending payouts',
        value: summary?.pendingPayoutsAmount,
        sub: `${summary?.pendingPayoutsCount ?? 0} request${summary?.pendingPayoutsCount === 1 ? '' : 's'}`,
      },
    ],
    [summary],
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Wallets & payouts"
        subtitle="Track physio earnings, record commission settlements, and approve withdrawal requests."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Wallets & payouts' }]}
        actions={
          <>
            <AdminLink to="/admin/payments">Payment queue →</AdminLink>
            <AdminLink to="/admin/physios">Physiotherapists →</AdminLink>
          </>
        }
      />

      <AdminFlowGuide
        title="Finance flow"
        steps={[
          'Verified payments (from Payment queue) credit physio wallets and accrue platform commission.',
          'Use Commission due filter to find physios who owe the platform — record settlement when they pay back.',
          'Approve pending payout requests to debit withdrawable balance after you transfer funds externally.',
          'Open a physio row for full wallet history, settlements, and recent ledger activity.',
        ]}
      />

      {loading && !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Card key={t.label} hover={false}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">{formatInr(t.value)}</p>
              <p className="mt-2 text-xs text-gray-500">{t.sub}</p>
            </Card>
          ))}
        </div>
      )}

      <Card hover={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id)
                  setPage(1)
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="text-xs font-medium text-gray-500">Search physio</label>
            <Input
              className="mt-1"
              placeholder="Name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={applySearch}>
              Apply
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('')
                setApplied('')
                setFilter('active')
                setPage(1)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-gray-900">No physios match these filters</p>
            <p className="mt-1 text-xs text-gray-500">Try a different filter or clear search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Physio</th>
                  <th className="px-4 py-3">Total earned</th>
                  <th className="px-4 py-3">Withdrawable</th>
                  <th className="px-4 py-3">Commission due</th>
                  <th className="px-4 py-3">Pending payout</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const due = Number(row.wallet?.commissionDue || 0)
                  const pending = row.pendingWithdrawal
                  return (
                    <tr
                      key={row._id}
                      className="cursor-pointer hover:bg-gray-50/80"
                      onClick={() => openDetail(row)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.name}</div>
                        {row.phone && <div className="text-xs text-gray-500">{row.phone}</div>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-800">{formatInr(row.wallet?.totalEarned)}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-800">{formatInr(row.wallet?.availableBalance)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums font-medium text-amber-900">{formatInr(due)}</span>
                          <DueBadge due={due} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {pending ? (
                          <div>
                            <div className="tabular-nums font-medium text-gray-900">{formatInr(pending.amount)}</div>
                            <div className="text-xs text-gray-500">{formatDateTime(pending.requestedAt)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap justify-end gap-2">
                          {due > 0.009 && (
                            <button
                              type="button"
                              onClick={() => openSettle(row)}
                              disabled={busy === `s-${row._id}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                            >
                              Settle
                            </button>
                          )}
                          {pending && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setPayoutAction({
                                    requestId: pending._id,
                                    action: 'approve',
                                    physio: row,
                                    amount: pending.amount,
                                  })
                                }
                                disabled={busy === `w-${pending._id}`}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Approve payout
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPayoutAction({
                                    requestId: pending._id,
                                    action: 'reject',
                                    physio: row,
                                    amount: pending.amount,
                                  })
                                }
                                disabled={busy === `w-${pending._id}`}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openDetail(row)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Details
                          </button>
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

      {selected && !settleOpen && !payoutAction && (
        <DetailDrawer
          physio={selected}
          detail={detail}
          loading={detailLoading}
          onClose={closeDetail}
          onSettle={() => openSettle(selected)}
          onPayoutAction={(action, pending) =>
            setPayoutAction({ requestId: pending._id, action, physio: selected, amount: pending.amount })
          }
        />
      )}

      {settleOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Record settlement</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selected.name} — commission due{' '}
              <span className="font-semibold text-amber-900">{formatInr(selected.wallet?.commissionDue)}</span>
            </p>
            <form className="mt-6 space-y-4" onSubmit={submitSettle}>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Amount (INR)</label>
                <Input
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Note (optional)</label>
                <Input
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="Reference / UTR"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSettleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy === `s-${selected._id}`}>
                  {busy === `s-${selected._id}` ? 'Saving…' : 'Confirm'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {payoutAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <Card hover={false} className="w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {payoutAction.action === 'approve' ? 'Approve payout' : 'Reject payout'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {payoutAction.action === 'approve' ? (
                <>
                  Debit <span className="font-semibold text-gray-900">{formatInr(payoutAction.amount)}</span> from{' '}
                  <span className="font-semibold text-gray-900">{payoutAction.physio?.name}</span>&apos;s balance
                  and record a withdrawal transaction.
                </>
              ) : (
                <>This leaves the physio&apos;s balance unchanged. They can submit a new request later.</>
              )}
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-600">
              {payoutAction.action === 'approve' ? 'Payout reference / UTR (optional)' : 'Reason (optional)'}
            </label>
            <Input
              className="mt-1"
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              placeholder={payoutAction.action === 'approve' ? 'Bank ref / UPI txn id' : 'Why rejected'}
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPayoutAction(null)}>
                Cancel
              </Button>
              <button
                type="button"
                disabled={busy === `w-${payoutAction.requestId}`}
                onClick={submitPayoutAction}
                className={
                  payoutAction.action === 'approve'
                    ? 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50'
                    : 'rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50'
                }
              >
                {busy === `w-${payoutAction.requestId}`
                  ? 'Working…'
                  : payoutAction.action === 'approve'
                  ? 'Confirm approve'
                  : 'Confirm reject'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function DetailDrawer({ physio, detail, loading, onClose, onSettle, onPayoutAction }) {
  const wallet = detail?.wallet || physio.wallet || {}
  const pending = detail?.pendingWithdrawal
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{physio.name}</h2>
              {physio.phone && <p className="text-xs text-gray-500">{physio.phone}</p>}
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <WalletStat label="Total earned" value={wallet.totalEarned} />
            <WalletStat label="Withdrawable" value={wallet.availableBalance} tone="emerald" />
            <WalletStat label="Online earnings" value={wallet.onlineEarning} />
            <WalletStat label="Offline collected" value={wallet.offlineCollected} />
            <WalletStat label="Commission due" value={wallet.commissionDue} tone="amber" />
          </div>

          {pending && (
            <Card hover={false} className="border border-amber-100 bg-amber-50/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Pending payout</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{formatInr(pending.amount)}</p>
                  <p className="text-xs text-gray-500">Requested {formatDateTime(pending.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onPayoutAction('approve', pending)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onPayoutAction('reject', pending)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </Card>
          )}

          {Number(wallet.commissionDue || 0) > 0.009 && (
            <Card hover={false} className="border border-amber-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Commission due</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-amber-900">
                    {formatInr(wallet.commissionDue)}
                  </p>
                  <p className="text-xs text-gray-500">Record once the physio has paid this back.</p>
                </div>
                <Button type="button" onClick={onSettle}>
                  Settle now
                </Button>
              </div>
            </Card>
          )}

          <Section title="Withdrawal history" empty={!loading && !(detail?.withdrawals?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.withdrawals?.map((w) => (
                <div
                  key={w._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium tabular-nums text-gray-900">{formatInr(w.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(w.requestedAt)}
                      {w.processedAt ? ` · processed ${formatDateTime(w.processedAt)}` : ''}
                    </p>
                  </div>
                  <WithdrawStatusBadge status={w.status} />
                </div>
              ))
            )}
          </Section>

          <Section title="Settlement history" empty={!loading && !(detail?.settlementHistory?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.settlementHistory?.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium tabular-nums text-gray-900">{formatInr(t.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.createdAt)}</p>
                    {t.meta?.note && <p className="mt-0.5 text-xs text-gray-600">{t.meta.note}</p>}
                  </div>
                  <span className="text-xs font-medium text-emerald-800">Settled</span>
                </div>
              ))
            )}
          </Section>

          <Section title="Recent activity" empty={!loading && !(detail?.recentTransactions?.length)}>
            {loading ? (
              <SkeletonRows />
            ) : (
              detail?.recentTransactions?.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {t.type} · {t.direction}
                      {t.meta?.leg ? ` · ${t.meta.leg}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <span
                    className={`tabular-nums font-medium ${
                      t.direction === 'credit' ? 'text-emerald-800' : 'text-gray-800'
                    }`}
                  >
                    {t.direction === 'credit' ? '+' : '-'}
                    {formatInr(t.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function WalletStat({ label, value, tone }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-800' : tone === 'amber' ? 'text-amber-900' : 'text-gray-900'
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${toneClass}`}>{formatInr(value)}</p>
    </div>
  )
}

function Section({ title, empty, children }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {empty ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-500">No entries yet.</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  )
}

function WithdrawStatusBadge({ status }) {
  const klass =
    status === 'approved'
      ? 'bg-emerald-50 text-emerald-900 ring-emerald-200'
      : status === 'rejected'
      ? 'bg-rose-50 text-rose-900 ring-rose-200'
      : 'bg-amber-50 text-amber-900 ring-amber-200'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${klass}`}>
      {status}
    </span>
  )
}
