import { useState } from 'react'

/**
 * Collapsible workflow hint — helps admins understand how sections connect.
 */
export default function AdminFlowGuide({ title = 'How this works', steps = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!steps.length) return null

  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-teal-900">{title}</span>
        <span className="text-xs font-medium text-teal-700">{open ? 'Hide' : 'Show guide'}</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-2 border-t border-teal-100 px-4 py-3 pl-8 text-sm text-teal-950/90">
          {steps.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
