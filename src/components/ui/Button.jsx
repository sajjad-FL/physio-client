const variants = {
  primary:
    'bg-teal-600 text-white shadow-sm shadow-teal-600/15 hover:bg-teal-700 focus-visible:ring-teal-500/40',
  danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500/40',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500/40',
  outline:
    'border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:shadow-md focus-visible:ring-slate-300/50',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300/40',
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default function Button({
  variant = 'primary',
  className = '',
  disabled,
  loading = false,
  type = 'button',
  children,
  ...rest
}) {
  const busy = loading || disabled
  return (
    <button
      type={type}
      disabled={busy}
      className={[
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55',
        'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]',
        variants[variant] || variants.primary,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
