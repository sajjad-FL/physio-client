import { useEffect, useState } from 'react'

export function useSheetEnter() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 20)
    return () => window.clearTimeout(t)
  }, [])
  return entered
}

export function FilterOptionPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/30'
          : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-200/80'
      }`}
    >
      {children}
    </button>
  )
}

export function FilterSection({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export const FILTER_FIELD =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

/** Shared mobile bottom sheet chrome for admin finance filters. */
export default function AdminFilterSheet({ title, onClose, onApply, onReset, children }) {
  const entered = useSheetEnter()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-filter-sheet-title"
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
          'relative flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 transition-transform duration-300 ease-out',
          entered ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3 pt-1">
          <h2 id="admin-filter-sheet-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>

        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onReset()
                onClose()
              }}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onApply()
                onClose()
              }}
              className="min-h-11 flex-[1.4] rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileFilterIconButton({ count = 0, onClick, label = 'Open filters' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
      aria-label={label}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6.75 9.75h10.5M10.5 15h3" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </button>
  )
}
