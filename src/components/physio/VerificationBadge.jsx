const LEVELS = {
  not_verified: {
    emoji: '⚪',
    label: 'Not verified',
    className: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  },
  verified: {
    emoji: '🟢',
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  },
}

/** @param {{ level: string, className?: string }} props */
export default function VerificationBadge({ level, className = '' }) {
  const key = LEVELS[level] ? level : 'not_verified'
  const cfg = LEVELS[key]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className} ${className}`}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {cfg.label}
    </span>
  )
}
