import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { formatBookingDateAndSlot } from '../../utils/date'
import { paymentBadge } from './dashboardUtils'
import { isProfileIncompleteError } from '../../utils/apiErrors'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export default function DashboardWallet() {
  const [summary, setSummary] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/profile/wallet-summary')
      setSummary(res.data || { walletBalance: 0, totalSpend: 0, heldTotal: 0, releasedTotal: 0, recentPayments: [] })
    } catch (err) {
      setSummary({ walletBalance: 0, totalSpend: 0, heldTotal: 0, releasedTotal: 0, recentPayments: [] })
      if (!isProfileIncompleteError(err)) {
        toast.error('Could not load wallet summary')
      }
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = summary === null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-page-title">Wallet</h1>
        <p className="mt-1 type-caption text-slate-500">Your referral credits and booking payment history.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Wallet Credits (Referral) Card */}
          <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Wallet Credits (Referral)</p>
            <p className="type-stat mt-2 text-teal-900">
              {formatInr(summary.walletBalance)}
            </p>
            <p className="mt-2 text-sm text-slate-600">Available balance to use at checkout for discounts on booking.</p>
          </section>

          {/* Total Care Spend Card */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total care spend</p>
            <p className="type-stat mt-2 text-slate-900">
              {formatInr(summary.totalSpend)}
            </p>
            <div className="mt-4 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Secured:</span> {formatInr(summary.heldTotal)}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Completed:</span> {formatInr(summary.releasedTotal)}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Sum of session amounts where payment is held or released.</p>
            <Link
              to="/book"
              className="tap-feedback mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 sm:w-auto sm:px-6"
            >
              Book an appointment
            </Link>
          </section>
        </>
      )}

      {!loading && summary.recentPayments && summary.recentPayments.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent paid sessions</h2>
          <ul className="space-y-2">
            {summary.recentPayments.map((b) => {
              const pay = paymentBadge(b.paymentStatus)
              return (
                <li key={b._id}>
                  <Link
                    to={`/dashboard/bookings/${b._id}/payment`}
                    className="tap-feedback flex min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 ring-1 ring-slate-100/60 transition active:bg-slate-50 sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                      <p className="truncate text-xs text-slate-500">{b.physioId?.name ?? 'Physiotherapist'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-bold tabular-nums text-slate-900">{formatInr(b.totalAmount)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pay.cls}`}>{pay.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!loading && (!summary.recentPayments || summary.recentPayments.length === 0) && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          No completed payments yet. After you pay for a session, it will show here.
        </p>
      )}
    </div>
  )
}
