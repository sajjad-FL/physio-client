import { cloneElement, forwardRef, isValidElement, useId } from 'react'
import FieldLabel from './FieldLabel'

const base =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[16px] md:text-sm text-slate-900 shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70'

const Input = forwardRef(function Input({ className = '', error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={[base, error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/25' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  )
})

export default Input

/**
 * Label + control + inline error. Clones a single child to set `id` when omitted.
 */
export function FormField({ label, error, id: idProp, className = '', required = false, children }) {
  const gen = useId()
  const id = idProp || gen
  const control =
    isValidElement(children) && !children.props?.id
      ? cloneElement(children, {
          id,
          'aria-required': required || children.props?.['aria-required'] ? true : undefined,
        })
      : children
  return (
    <div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
      {label ? (
        <FieldLabel htmlFor={id} required={required} className="block text-sm font-medium text-slate-700">
          {label}
        </FieldLabel>
      ) : null}
      {control}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
