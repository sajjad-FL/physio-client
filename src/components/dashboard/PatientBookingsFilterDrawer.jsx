import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function useSheetEnter() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20)
    return () => window.clearTimeout(t)
  }, [])
  return entered
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'range', label: 'Date range' },
]

function OptionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/25'
          : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-200/80'
      }`}
    >
      {children}
    </button>
  )
}

export default function PatientBookingsFilterDrawer({ onClose, filter, onFilterChange, dateRange }) {
  const [draftFilter, setDraftFilter] = useState(filter)
  const [draftRange, setDraftRange] = useState(dateRange)
  const entered = useSheetEnter()

  useEffect(() => {
    setDraftFilter(filter)
    setDraftRange(dateRange)
  }, [filter, dateRange])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleRangeChange(dates) {
    if (!dates) {
      setDraftRange(null)
      setDraftFilter('all')
      return
    }
    const [start, end] = dates
    if (start && end) {
      setDraftRange([start, end])
    } else {
      setDraftRange(start ? [start, null] : null)
    }
    setDraftFilter('range')
  }

  function apply() {
    onFilterChange(draftFilter, draftFilter === 'range' ? draftRange : null)
    onClose()
  }

  function reset() {
    onFilterChange('all', null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-end sm:justify-center sm:p-4 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-filter-title"
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
          'relative flex max-h-[min(88dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transition-transform duration-300 ease-out sm:rounded-2xl',
          entered ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-1 sm:px-5">
          <h2 id="patient-filter-title" className="text-lg font-semibold text-slate-900">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="tap-feedback rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</p>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(({ id, label }) => (
              <OptionPill key={id} active={draftFilter === id} onClick={() => setDraftFilter(id)}>
                {label}
              </OptionPill>
            ))}
          </div>

          {draftFilter === 'range' && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Choose dates</p>
              <div className="patient-booking-datepicker [&_.react-datepicker-wrapper]:w-full [&_.react-datepicker__input-container]:w-full [&_input]:w-full [&_input]:cursor-pointer [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-3 [&_input]:text-sm [&_input]:font-medium [&_input]:text-slate-900 [&_input]:shadow-sm [&_input]:outline-none [&_input]:focus:border-teal-500 [&_input]:focus:ring-2 [&_input]:focus:ring-teal-500/20">
                <DatePicker
                  selectsRange
                  startDate={draftRange?.[0] ?? undefined}
                  endDate={draftRange?.[1] ?? undefined}
                  onChange={handleRangeChange}
                  isClearable
                  placeholderText="Start and end date"
                  dateFormat="dd MMM yyyy"
                  monthsShown={1}
                  popperClassName="z-[60]"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-5"
          style={{ paddingBottom: 'max(1rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={apply}
              className="tap-feedback min-h-11 w-full cursor-pointer rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={reset}
              className="tap-feedback min-h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
