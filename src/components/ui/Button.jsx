const variants = {
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500/40',
  danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500/40',
  success: 'bg-green-500 text-white shadow-sm hover:bg-green-600 focus-visible:ring-green-500/40',
  outline:
    'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 hover:shadow-md focus-visible:ring-gray-300/50',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300/40',
}

export default function Button({
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]',
        variants[variant] || variants.primary,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
