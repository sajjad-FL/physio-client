import { useEffect, useState } from 'react'

function useSlideInOnMount() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20)
    return () => clearTimeout(t)
  }, [])
  return entered
}

export const DEFAULT_PHYSIO_FILTERS = { workflow: 'all', status: 'all', service: 'all', date: 'all' }

function OptionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
        active
          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
          : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-200/80'
      }`}
    >
      {children}
    </button>
  )
}

export default function PhysioBookingsFilterDrawer({ onClose, appliedFilters, onApply, onReset }) {
  const [draft, setDraft] = useState(() => ({ ...appliedFilters }))
  const entered = useSlideInOnMount()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleApply() {
    onApply(draft)
    onClose()
  }

  function handleReset() {
    onReset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close filters"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full w-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-md sm:rounded-l-2xl ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <h2 id="filter-drawer-title" className="type-page-title text-gray-900">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Workflow</p>
              <div className="flex flex-wrap gap-2">
                <OptionPill
                  active={draft.workflow === 'all'}
                  onClick={() => setDraft((d) => ({ ...d, workflow: 'all' }))}
                >
                  All bookings
                </OptionPill>
                <OptionPill
                  active={draft.workflow === 'action'}
                  onClick={() => setDraft((d) => ({ ...d, workflow: 'action' }))}
                >
                  Needs action
                </OptionPill>
                <OptionPill
                  active={draft.workflow === 'waiting'}
                  onClick={() => setDraft((d) => ({ ...d, workflow: 'waiting' }))}
                >
                  Waiting on patient
                </OptionPill>
                <OptionPill
                  active={draft.workflow === 'active'}
                  onClick={() => setDraft((d) => ({ ...d, workflow: 'active' }))}
                >
                  In treatment
                </OptionPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <div className="flex flex-wrap gap-2">
                <OptionPill active={draft.status === 'all'} onClick={() => setDraft((d) => ({ ...d, status: 'all' }))}>
                  All
                </OptionPill>
                <OptionPill
                  active={draft.status === 'scheduled'}
                  onClick={() => setDraft((d) => ({ ...d, status: 'scheduled' }))}
                >
                  Scheduled
                </OptionPill>
                <OptionPill
                  active={draft.status === 'completed'}
                  onClick={() => setDraft((d) => ({ ...d, status: 'completed' }))}
                >
                  Completed
                </OptionPill>
                <OptionPill
                  active={draft.status === 'rescheduled'}
                  onClick={() => setDraft((d) => ({ ...d, status: 'rescheduled' }))}
                >
                  Rescheduled
                </OptionPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Service</p>
              <div className="flex flex-wrap gap-2">
                <OptionPill
                  active={draft.service === 'all'}
                  onClick={() => setDraft((d) => ({ ...d, service: 'all' }))}
                >
                  All
                </OptionPill>
                <OptionPill
                  active={draft.service === 'online'}
                  onClick={() => setDraft((d) => ({ ...d, service: 'online' }))}
                >
                  Online
                </OptionPill>
                <OptionPill
                  active={draft.service === 'home'}
                  onClick={() => setDraft((d) => ({ ...d, service: 'home' }))}
                >
                  Home
                </OptionPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Date</p>
              <div className="flex flex-wrap gap-2">
                <OptionPill active={draft.date === 'all'} onClick={() => setDraft((d) => ({ ...d, date: 'all' }))}>
                  All
                </OptionPill>
                <OptionPill active={draft.date === 'today'} onClick={() => setDraft((d) => ({ ...d, date: 'today' }))}>
                  Today
                </OptionPill>
                <OptionPill
                  active={draft.date === 'upcoming'}
                  onClick={() => setDraft((d) => ({ ...d, date: 'upcoming' }))}
                >
                  Upcoming
                </OptionPill>
                <OptionPill active={draft.date === 'past'} onClick={() => setDraft((d) => ({ ...d, date: 'past' }))}>
                  Past
                </OptionPill>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
