import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Skeleton from '../../components/ui/Skeleton'
import { formatBookingDateAndSlot } from '../../utils/date'
import { paymentBadge } from './dashboardUtils'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export default function DashboardWallet() {
  const [bookings, setBookings] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my', { params: { page: 1, limit: 100 } })
      setBookings(res.data?.data || [])
    } catch {
      toast.error('Could not load bookings')
      setBookings([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loading = bookings === null

  const { totalSpend, lines } = useMemo(() => {
    const list = bookings || []
    let sum = 0
    const rows = []
    for (const b of list) {
      const amt = Number(b.totalAmount) || 0
      const paid =
        b.paymentStatus === 'released' || b.paymentStatus === 'held' || b.paymentStatus === 'paid'
      if (paid && amt) {
        sum += amt
        rows.push({ b, amt })
      }
    }
    rows.sort((a, b) => String(b.b.createdAt || '').localeCompare(String(a.b.createdAt || '')))
    return { totalSpend: sum, lines: rows.slice(0, 12) }
  }, [bookings])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Wallet</h1>
        <p className="mt-1 text-sm text-slate-500">Care spend from bookings with payment in escrow or released.</p>
      </div>

      {loading ? (
        <Skeleton className="h-36 w-full rounded-2xl" />
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total care spend</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
            {formatInr(totalSpend)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Sum of session amounts where payment is held or released.</p>
          <Link
            to="/book"
            className="tap-feedback mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 sm:w-auto sm:px-6"
          >
            Book a session
          </Link>
        </section>
      )}

      {!loading && lines.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent paid sessions</h2>
          <ul className="space-y-2">
            {lines.map(({ b, amt }) => {
              const pay = paymentBadge(b.paymentStatus)
              return (
                <li key={b._id}>
                  <Link
                    to={`/dashboard/bookings/${b._id}`}
                    className="tap-feedback flex min-h-[3.25rem] items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 ring-1 ring-slate-100/60 transition active:bg-slate-50 sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{formatBookingDateAndSlot(b.date, b.timeSlot)}</p>
                      <p className="truncate text-xs text-slate-500">{b.physioId?.name ?? 'Physio'}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-bold tabular-nums text-slate-900">{formatInr(amt)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${pay.cls}`}>{pay.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!loading && lines.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          No completed payments yet. After you pay for a session, it will show here.
        </p>
      )}
    </div>
  )
}
