/**
 * Shared form label with optional red asterisk for mandatory fields.
 */
export default function FieldLabel({
  htmlFor,
  children,
  required = false,
  className = 'mb-1 block text-xs font-medium text-slate-600',
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
      {required ? (
        <span className="text-red-500" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  )
}

/** Inline red asterisk for labels that are not wrapping a control. */
export function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      {' '}
      *
    </span>
  )
}
