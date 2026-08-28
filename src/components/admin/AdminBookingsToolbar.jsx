const searchIcon = (
  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M11 18a7 7 0 100-14 7 7 0 000 14z" />
  </svg>
)

const funnelIcon = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h18M7 9.75h10M10 15h4M12 19.5h.01"
    />
  </svg>
)

export default function AdminBookingsToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onFilterClick,
  filtersActive,
  onRefresh,
  refreshing,
  view = 'list',
  onViewChange,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{searchIcon}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patient name or phone…"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-100/80 transition-shadow placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex min-w-0 flex-1 items-center sm:flex-none">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-100/80 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 sm:w-auto sm:min-w-44"
            >
              <option value="latest">Latest created</option>
              <option value="oldest">Oldest created</option>
              <option value="visitSoon">Visit date (soonest)</option>
              <option value="visitLate">Visit date (latest)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onFilterClick}
            className="tap-feedback relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            aria-label={filtersActive ? 'Filters (active)' : 'Filters'}
            title="Filters"
          >
            {funnelIcon}
            {filtersActive && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
            )}
          </button>
          {onViewChange && (
            <div
              className="inline-flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm ring-1 ring-slate-100/80"
              role="tablist"
              aria-label="View"
            >
              <button
                type="button"
                role="tab"
                aria-selected={view === 'list'}
                onClick={() => onViewChange('list')}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                  view === 'list'
                    ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                List
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'calendar'}
                onClick={() => onViewChange('calendar')}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                  view === 'calendar'
                    ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Calendar
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="tap-feedback inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshing ? '…' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
