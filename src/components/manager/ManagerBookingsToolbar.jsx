const searchIcon = (
  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
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

export default function ManagerBookingsToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onFilterClick,
  filtersActive,
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{searchIcon}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient name, phone, or issue..."
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3.5 text-sm text-gray-900 shadow-sm ring-1 ring-gray-100/80 transition-shadow placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-0 flex-1 items-center sm:flex-none">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full min-w-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-100/80 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 sm:w-auto sm:min-w-40"
            >
              <option value="priority">Priority first</option>
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onFilterClick}
            className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
            aria-label={filtersActive ? 'Filters (active)' : 'Filters'}
            title="Filters"
          >
            {funnelIcon}
            {filtersActive && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
