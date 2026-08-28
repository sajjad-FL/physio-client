/** @typedef {'done' | 'current' | 'waiting' | 'upcoming'} StepState */

/**
 * @param {{ steps: Array<{ id: string, num: number, label: string, hint: string, state: StepState }>, openStep: string, onSelect: (id: string) => void, columns?: number }} props
 */
export default function BookingWorkflowStepRail({ steps, openStep, onSelect, columns = 4 }) {
  const gridCols =
    columns === 3
      ? 'grid-cols-3'
      : columns === 5
      ? 'grid-cols-5'
      : 'grid-cols-4'

  return (
    <ol className={`grid gap-1 sm:gap-2 ${gridCols}`}>
      {steps.map((step) => {
        const isOpen = openStep === step.id
        const done = step.state === 'done'
        const waiting = step.state === 'waiting'
        const current = step.state === 'current'

        let circleCls =
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition '
        if (done) circleCls += 'bg-emerald-600 text-white'
        else if (waiting) circleCls += 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
        else if (current || isOpen) circleCls += 'bg-teal-600 text-white ring-2 ring-teal-300'
        else circleCls += 'bg-slate-100 text-slate-400'

        return (
          <li key={step.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              className={`tap-feedback flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition sm:px-2 ${
                isOpen ? 'bg-teal-50 ring-1 ring-teal-200/80' : 'hover:bg-slate-50'
              }`}
            >
              <span className={circleCls}>{done ? '✓' : step.num}</span>
              <span
                className={`w-full truncate text-[11px] font-semibold sm:text-xs ${isOpen ? 'text-teal-900' : 'text-slate-700'}`}
              >
                {step.label}
              </span>
              <span className="hidden w-full truncate text-[10px] text-slate-500 sm:block">{step.hint}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
