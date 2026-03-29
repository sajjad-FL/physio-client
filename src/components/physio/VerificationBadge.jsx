const LEVELS = {
  basic: { emoji: '🟡', label: 'Basic', className: 'bg-amber-50 text-amber-900 ring-amber-200/80' },
  verified: { emoji: '🟢', label: 'Verified', className: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80' },
  premium: { emoji: '🔵', label: 'Premium', className: 'bg-sky-50 text-sky-900 ring-sky-200/80' },
}

export default function VerificationBadge({ level, className = '' }) {
  const key = LEVELS[level] ? level : 'basic'
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
