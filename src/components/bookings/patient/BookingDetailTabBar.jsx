const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'payments', label: 'Payments' },
]

export default function BookingDetailTabBar({ activeTab, onChange, badges = {} }) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1" role="tablist">
      {TABS.map((tab) => {
        const active = activeTab === tab.key
        const hasBadge = badges[tab.key]
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={[
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition',
              active ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            ].join(' ')}
          >
            {tab.label}
            {hasBadge && !active ? (
              <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
