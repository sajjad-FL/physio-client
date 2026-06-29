import { forwardRef } from 'react'

/**
 * Input with decorative prefix/suffix inside one bordered control (e.g. Dr. | name | PT).
 */
const AffixInput = forwardRef(function AffixInput(
  {
    id,
    prefix = 'Dr.',
    suffix = 'PT',
    className = '',
    inputClassName = '',
    error = false,
    ...props
  },
  ref,
) {
  const wrapCls = [
    'flex h-11 w-full items-stretch overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 focus-within:ring-2',
    error
      ? 'border-red-400 ring-1 ring-red-200 focus-within:border-red-500 focus-within:ring-red-500/20'
      : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/20',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapCls}>
      <span className="flex shrink-0 items-center pl-3 pr-1 text-sm text-slate-400">{prefix}</span>
      <input
        ref={ref}
        id={id}
        className={[
          'min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400',
          inputClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      <span className="flex shrink-0 items-center pl-1 pr-3 text-sm font-medium text-slate-400">{suffix}</span>
    </div>
  )
})

export default AffixInput
