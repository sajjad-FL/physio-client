/** Thin wrapper for full-page early-return loading states. */
export default function PageSkeleton({ children, className = '' }) {
  return (
    <div className={['w-full', className].filter(Boolean).join(' ')} role="status" aria-label="Loading">
      {children}
    </div>
  )
}
