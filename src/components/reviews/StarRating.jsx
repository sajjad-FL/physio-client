const starPath =
  'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z'

function Star({ filled, sizeClass }) {
  return (
    <svg
      className={sizeClass}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d={starPath} />
    </svg>
  )
}

/**
 * @param {{ value: number, size?: 'sm' | 'md', className?: string }} props
 */
export function StarRatingDisplay({ value, size = 'sm', className = '' }) {
  const n = Math.min(5, Math.max(0, Math.round(Number(value) || 0)))
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  const color = 'text-amber-400'
  const empty = 'text-gray-200'
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= n} sizeClass={i <= n ? `${sizeClass} ${color}` : `${sizeClass} ${empty}`} />
      ))}
    </div>
  )
}

/**
 * @param {{ value: number, onChange: (n: number) => void, disabled?: boolean }} props
 */
export function StarRatingInput({ value, onChange, disabled }) {
  const n = Math.min(5, Math.max(1, Math.round(Number(value) || 1)))
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
          aria-label={`Rate ${i} out of 5`}
        >
          <Star filled={i <= n} sizeClass="h-8 w-8" />
        </button>
      ))}
    </div>
  )
}
