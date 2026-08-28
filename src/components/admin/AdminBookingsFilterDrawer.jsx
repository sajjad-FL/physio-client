import { useEffect, useMemo, useState } from 'react'
import { useSheetEnter } from './AdminFilterSheet'

export const DEFAULT_ADMIN_BOOKING_FILTERS = {
  status: 'all',
  paymentStatus: 'all',
  assignment: 'all',
  serviceType: 'all',
  sessionStatus: 'all',
}

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
]

const PAYMENT_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'held', label: 'Held' },
  { id: 'released', label: 'Released' },
  { id: 'refunded', label: 'Refunded' },
]

const ASSIGNMENT_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'assigned', label: 'Assigned' },
]

const SERVICE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'home', label: 'Home' },
  { id: 'online', label: 'Online' },
  { id: 'clinic', label: 'Clinic' },
]

const SESSION_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'not_set', label: 'Not set' },
]

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2L4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
        active
          ? 'bg-slate-900 text-white'
          : 'bg-transparent text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
      ].join(' ')}
    >
      {active ? <CheckIcon /> : null}
      {children}
    </button>
  )
}

function Segmented({ value, options, onChange }) {
  const cols =
    options.length <= 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
  return (
    <div className={`grid gap-1 rounded-xl bg-slate-100/90 p-1 ${cols}`}>
      {options.map((o) => {
        const on = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={on}
            className={[
              'min-h-9 rounded-lg px-2 text-[13px] font-semibold transition-all duration-150',
              on
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Block({ label, children }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[13px] font-medium text-slate-900">{label}</p>
      {children}
    </div>
  )
}

export default function AdminBookingsFilterDrawer({ appliedFilters, onClose, onApply, onReset }) {
  const [draft, setDraft] = useState(() => ({ ...appliedFilters }))
  const entered = useSheetEnter()

  useEffect(() => {
    setDraft({ ...appliedFilters })
  }, [appliedFilters])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const activeCount = useMemo(
    () => Object.values(draft).filter((v) => v !== 'all').length,
    [draft],
  )

  function handleApply() {
    onApply({ ...draft })
    onClose()
  }

  function handleReset() {
    setDraft({ ...DEFAULT_ADMIN_BOOKING_FILTERS })
    onReset()
    onClose()
  }

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-booking-filters-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-200 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close filters"
        onClick={onClose}
      />

      <div
        className={[
          'relative flex max-h-[min(88dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transition-all duration-200 ease-out',
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="admin-booking-filters-title" className="text-[17px] font-semibold tracking-tight text-slate-900">
              Filters
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {activeCount === 0 ? 'No filters applied' : `${activeCount} active`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
          <Block label="Visit type">
            <Segmented
              value={draft.serviceType}
              options={SERVICE_OPTIONS}
              onChange={(id) => set('serviceType', id)}
            />
          </Block>

          <Block label="Booking status">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => (
                <Chip key={o.id} active={draft.status === o.id} onClick={() => set('status', o.id)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </Block>

          <Block label="Payment">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  active={draft.paymentStatus === o.id}
                  onClick={() => set('paymentStatus', o.id)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Block>

          <Block label="Physiotherapist">
            <Segmented
              value={draft.assignment}
              options={ASSIGNMENT_OPTIONS}
              onChange={(id) => set('assignment', id)}
            />
          </Block>

          <Block label="Session">
            <div className="flex flex-wrap gap-2">
              {SESSION_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  active={draft.sessionStatus === o.id}
                  onClick={() => set('sessionStatus', o.id)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Block>
        </div>

        <footer className="shrink-0 border-t border-slate-100 px-5 py-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={activeCount === 0}
              className="min-h-11 flex-1 rounded-xl text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="min-h-11 flex-[2] rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
            >
              Show results
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
