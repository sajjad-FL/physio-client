import { useEffect } from 'react'

/**
 * Simple accessible dialog shell — pass `open`, `onClose`, and children.
 */
export default function Modal({ open, onClose, title, description, children, className = '' }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        className={[
          'max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/15 motion-safe:animate-enter-scale',
          className,
        ].join(' ')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
        )}
        {description && (
          <p id="modal-desc" className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
        <div className={title || description ? 'mt-5' : ''}>{children}</div>
      </div>
    </div>
  )
}
