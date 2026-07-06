import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import {
  managerWorkflowMeta,
  managerNeedsAction,
  managerMatchesFilter,
  managerOutstanding,
  MANAGER_WAITING_STATUSES,
  MANAGER_ACTIVE_STATUSES,
} from '../../utils/managerWorkflow'
import Card from '../../components/ui/Card'

const FILTER_TABS = [
  { id: 'all', label: 'All cases' },
  { id: 'action', label: 'Needs action' },
  { id: 'waiting', label: 'Waiting on patient' },
  { id: 'active', label: 'In treatment' },
]

function badgeClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'action':
      return 'bg-teal-50 text-teal-900 ring-teal-200/80'
    case 'waiting':
      return 'bg-blue-50 text-blue-900 ring-blue-200/80'
    case 'progress':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-200/80'
  }
}

function accentClass(tone) {
  switch (tone) {
    case 'urgent':
      return 'border-l-amber-500'
    case 'action':
      return 'border-l-teal-500'
    case 'waiting':
      return 'border-l-blue-500'
    case 'progress':
      return 'border-l-emerald-500'
    default:
      return 'border-l-slate-300'
  }
}

function patientInitial(name) {
  const s = (name || '?').trim()
  return s ? s.slice(0, 1).toUpperCase() : '?'
}

function matchesFilter(b, filterId) {
  return managerMatchesFilter(b, filterId)
}

function isActiveCase(b) {
  const ws = b.workflowStatus
  if (MANAGER_ACTIVE_STATUSES.has(ws)) return true
  return managerOutstanding(b) <= 0.009 && Number(b.paymentSummary?.totalPaid || b.totalPaid || 0) > 0
}

export default function ManagerBookingsPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const deferredSearch = useDeferredValue(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/manager/bookings', { params: { limit: 50 } })
      setItems(res.data?.items || [])
      setTotal(Number(res.data?.total) || 0)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const needsAction = items.filter((b) => managerNeedsAction(b)).length
    const waiting = items.filter((b) => MANAGER_WAITING_STATUSES.has(b.workflowStatus)).length
    const active = items.filter((b) => isActiveCase(b)).length
    return { needsAction, waiting, active }
  }, [items])

  const displayItems = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    return items.filter((b) => {
      if (!matchesFilter(b, filter)) return false
      if (!q) return true
      const blob = [
        b.userId?.name,
        b.userId?.phone,
        b.issue,
        b.pincode,
        b.userId?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [items, filter, deferredSearch])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card hover={false} className="border-amber-100 bg-amber-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">Needs your action</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-950">{stats.needsAction}</p>
          <p className="mt-0.5 text-xs text-amber-900/70">Visit, plan, assign, or collect</p>
        </Card>
        <Card hover={false} className="border-blue-100 bg-blue-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800/80">Awaiting patient</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-blue-950">{stats.waiting}</p>
          <p className="mt-0.5 text-xs text-blue-900/70">Consent pending in app</p>
        </Card>
        <Card hover={false} className="border-emerald-100 bg-emerald-50/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">In treatment</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">{stats.active}</p>
          <p className="mt-0.5 text-xs text-emerald-900/70">Active recovery plans</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? items.length
                : items.filter((b) => matchesFilter(b, tab.id)).length
            const active = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 tabular-nums ${active ? 'text-teal-100' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient, phone, issue…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:max-w-xs"
        />
      </div>

      {/* Case list */}
      {!items.length ? (
        <Card hover={false} className="border-dashed p-10 text-center">
          <p className="text-base font-semibold text-slate-800">No assigned cases yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Home bookings in your service zones will appear here once admin assigns them — or when a patient&apos;s
            pincode auto-matches your zone.
          </p>
        </Card>
      ) : !displayItems.length ? (
        <Card hover={false} className="p-8 text-center">
          <p className="text-sm text-slate-600">
            {search.trim() ? `No cases match "${search.trim()}".` : 'No cases in this filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500">
            Showing {displayItems.length} of {total || items.length} case{(total || items.length) === 1 ? '' : 's'}
          </p>
          {displayItems.map((b) => {
            const meta = managerWorkflowMeta(b)
            const due = managerOutstanding(b)
            const physioName =
              b.physioId && typeof b.physioId === 'object' ? b.physioId.name : null
            return (
              <Link key={b._id} to={`/manager/bookings/${b._id}`} className="block">
                <Card
                  className={`overflow-hidden border-l-4 p-0 transition hover:border-teal-200 hover:shadow-md ${accentClass(meta.tone)}`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-800">
                      {patientInitial(b.userId?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{b.userId?.name || 'Patient'}</p>
                          <p className="mt-0.5 text-sm text-slate-600">{b.issue || 'Home visit'}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass(meta.tone)}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatBookingDateAndSlot(b.date, b.timeSlot) || 'Date TBD'}
                        {b.pincode ? ` · PIN ${b.pincode}` : ''}
                        {b.userId?.phone ? ` · ${b.userId.phone}` : ''}
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-teal-800">{meta.hint}</p>
                      {due > 0.009 ? (
                        <p className="mt-1 text-xs font-semibold text-rose-700">₹{due.toFixed(0)} pending</p>
                      ) : null}
                      {physioName ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Physio: <span className="font-medium text-slate-700">{physioName}</span>
                        </p>
                      ) : null}
                    </div>
                    <div className="hidden shrink-0 self-center sm:flex">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        Open →
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
