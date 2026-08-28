import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import Pagination from '../../components/Pagination'
import usePagination from '../../hooks/usePagination'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function ClinicFinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'cash'
  const { page, pageSize, applyMeta, clearMeta, paginationProps, resetPage } = usePagination()
  const [ledger, setLedger] = useState([])
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [pending, setPending] = useState(null)
  const [upi, setUpi] = useState('')
  const [upiName, setUpiName] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const setTab = (next) => {
    const sp = new URLSearchParams(searchParams)
    sp.set('tab', next)
    setSearchParams(sp)
    resetPage()
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: pageSize }
      if (tab === 'cash') {
        const res = await api.get('/clinic/ledger', { params })
        setLedger(res.data?.entries || [])
        applyMeta(res.data)
      } else if (tab === 'earnings') {
        const [w, t, p] = await Promise.all([
          api.get('/clinic/wallet'),
          api.get('/clinic/wallet/transactions', { params }),
          api.get('/clinic/withdraw/pending'),
        ])
        setWallet(w.data)
        setTxns(t.data?.items || [])
        applyMeta(t.data)
        setPending(p.data?.pending || null)
        setUpi(w.data?.payoutUpiId || '')
        setUpiName(w.data?.payoutDisplayName || '')
      } else {
        clearMeta()
        const w = await api.get('/clinic/wallet')
        setWallet(w.data)
        setUpi(w.data?.payoutUpiId || '')
        setUpiName(w.data?.payoutDisplayName || '')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load finance')
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [tab, page, pageSize, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  const tabs = useMemo(
    () => [
      { id: 'cash', label: 'Cash' },
      { id: 'earnings', label: 'Earnings' },
      { id: 'payout', label: 'Payout UPI' },
    ],
    [],
  )

  async function savePayout() {
    setBusy(true)
    try {
      await api.patch('/clinic/payout', { payoutUpiId: upi, payoutDisplayName: upiName })
      toast.success('Payout details saved')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function requestWithdraw() {
    const n = Number(withdrawAmount)
    if (!Number.isFinite(n) || n < 1) {
      toast.error('Enter a valid amount')
      return
    }
    setBusy(true)
    try {
      await api.post('/clinic/withdraw', { amount: n })
      toast.success('Withdrawal requested')
      setWithdrawAmount('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdraw failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : tab === 'cash' ? (
        <>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {ledger.length ? (
              ledger.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{formatInr(e.amount)}</p>
                    <p className="text-xs text-slate-500">
                      {e.bookingId?.issue || 'Visit'} · {e.status}
                      {e.clinicCommissionAmount != null
                        ? ` · Clinic cut ${formatInr(e.clinicCommissionAmount)}`
                        : ''}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-slate-500">{e.status}</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-10 text-center text-sm text-slate-500">No cash ledger entries</li>
            )}
          </ul>
          <Pagination {...paginationProps} />
        </>
      ) : tab === 'earnings' ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Settled commission</p>
              <p className="mt-1 text-lg font-bold">{formatInr(wallet?.settledCommission)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Withdrawn</p>
              <p className="mt-1 text-lg font-bold">{formatInr(wallet?.withdrawn)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Available</p>
              <p className="mt-1 text-lg font-bold text-teal-800">{formatInr(wallet?.availableBalance)}</p>
            </div>
          </div>
          {pending ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pending withdrawal {formatInr(pending.amount)}
            </p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="number"
                min="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Withdraw amount"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={requestWithdraw}
                className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Request withdraw
              </button>
            </div>
          )}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {txns.map((t) => (
              <li key={t._id} className="flex justify-between px-4 py-3 text-sm">
                <span className="capitalize text-slate-700">{String(t.type).replace('_', ' ')}</span>
                <span className="font-medium">{formatInr(t.totalAmount)}</span>
              </li>
            ))}
            {!txns.length ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">No wallet transactions yet</li>
            ) : null}
          </ul>
          <Pagination {...paginationProps} />
        </div>
      ) : (
        <div className="max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-xs font-medium text-slate-600">
            UPI ID
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="clinic@upi"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Display name
            <input
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={savePayout}
            className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
