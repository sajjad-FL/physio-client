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

export default function PatientBookingsToolbar({
  search,
  onSearchChange,
  onFilterClick,
  filtersActive,
}) {
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{searchIcon}</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search session, physio, condition..."
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-100/80 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
        aria-label={filtersActive ? 'Filters (active)' : 'Filters'}
        title="Filters"
      >
        {funnelIcon}
        {filtersActive ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white" />
        ) : null}
      </button>
    </div>
  )
}
