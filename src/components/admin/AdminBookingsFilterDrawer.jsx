import { useEffect, useState } from 'react'

function useSheetEnter() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20)
    return () => window.clearTimeout(t)
  }, [])
  return entered
}

export const DEFAULT_ADMIN_BOOKING_FILTERS = {
  status: 'all',
  paymentStatus: 'all',
  assignment: 'all',
  serviceType: 'all',
  sessionStatus: 'all',
}

function OptionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
        active
          ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/30'
          : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-200/80'
      }`}
    >
      {children}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
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

  function handleApply() {
    onApply({ ...draft })
    onClose()
  }

  function handleReset() {
    onReset()
    onClose()
  }

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-center sm:p-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-booking-filters-title"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className={[
          'relative flex max-h-[min(88dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transition-transform duration-300 ease-out sm:rounded-2xl',
          entered ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-1 sm:px-5">
          <h2 id="admin-booking-filters-title" className="text-lg font-semibold text-slate-900">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-feedback rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <Section title="Booking status">
            <OptionPill active={draft.status === 'all'} onClick={() => set('status', 'all')}>
              All
            </OptionPill>
            {['pending', 'assigned', 'accepted', 'scheduled', 'completed'].map((s) => (
              <OptionPill key={s} active={draft.status === s} onClick={() => set('status', s)}>
                {s}
              </OptionPill>
            ))}
          </Section>

          <Section title="Payment status">
            <OptionPill active={draft.paymentStatus === 'all'} onClick={() => set('paymentStatus', 'all')}>
              All
            </OptionPill>
            {['pending', 'held', 'released', 'refunded'].map((s) => (
              <OptionPill key={s} active={draft.paymentStatus === s} onClick={() => set('paymentStatus', s)}>
                {s}
              </OptionPill>
            ))}
          </Section>

          <Section title="Physiotherapist">
            <OptionPill active={draft.assignment === 'all'} onClick={() => set('assignment', 'all')}>
              All
            </OptionPill>
            <OptionPill active={draft.assignment === 'unassigned'} onClick={() => set('assignment', 'unassigned')}>
              Unassigned
            </OptionPill>
            <OptionPill active={draft.assignment === 'assigned'} onClick={() => set('assignment', 'assigned')}>
              Assigned
            </OptionPill>
          </Section>

          <Section title="Service">
            <OptionPill active={draft.serviceType === 'all'} onClick={() => set('serviceType', 'all')}>
              All
            </OptionPill>
            <OptionPill active={draft.serviceType === 'home'} onClick={() => set('serviceType', 'home')}>
              Home
            </OptionPill>
            <OptionPill active={draft.serviceType === 'online'} onClick={() => set('serviceType', 'online')}>
              Online
            </OptionPill>
          </Section>

          <Section title="Session">
            <OptionPill active={draft.sessionStatus === 'all'} onClick={() => set('sessionStatus', 'all')}>
              All
            </OptionPill>
            <OptionPill active={draft.sessionStatus === 'scheduled'} onClick={() => set('sessionStatus', 'scheduled')}>
              Scheduled
            </OptionPill>
            <OptionPill active={draft.sessionStatus === 'completed'} onClick={() => set('sessionStatus', 'completed')}>
              Completed
            </OptionPill>
            <OptionPill active={draft.sessionStatus === 'not_set'} onClick={() => set('sessionStatus', 'not_set')}>
              Not set
            </OptionPill>
          </Section>
        </div>

        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5"
          style={{ paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="tap-feedback min-h-11 w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="tap-feedback min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
