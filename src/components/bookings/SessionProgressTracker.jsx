import { useEffect, useState } from 'react'
import {
  getSessionProgress,
  getSessionMilestoneMessage,
  getProgressTierStyles,
} from '../../utils/sessionProgress'

/**
 * @param {{ booking: object, variant?: 'full' | 'mini', className?: string }} props
 */
export default function SessionProgressTracker({ booking, variant = 'full', className = '' }) {
  const { completed, total, percent, tier, isComplete } = getSessionProgress(booking)
  const message = getSessionMilestoneMessage(percent, isComplete)
  const styles = getProgressTierStyles(tier)

  const [barPct, setBarPct] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setBarPct(percent)
    })
    return () => cancelAnimationFrame(id)
  }, [percent])

  const label = `${completed} of ${total} session${total === 1 ? '' : 's'} completed`

  if (variant === 'mini') {
    return (
      <div className={`pointer-events-none mt-3 ${className}`} role="presentation">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-gray-600">
          <span className="font-medium text-gray-700">Progress</span>
          <span className="tabular-nums font-semibold text-gray-900">
            {completed}/{total}
          </span>
        </div>
        <div
          className={`h-2 overflow-hidden rounded-full ${styles.track}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={label}
        >
          <div
            className={`h-full rounded-full ${styles.fill} transition-[width] duration-700 ease-out`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-5 shadow-sm ring-1 ring-gray-100/80 sm:p-6 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Session progress</h3>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-3xl">
            {label}
          </p>
          <p className="mt-1 text-sm text-gray-500">{Math.round(percent)}% of your plan</p>
        </div>
        {isComplete && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200/80">
            Complete
          </span>
        )}
      </div>

      <div
        className={`mt-5 h-3 overflow-hidden rounded-full ${styles.track}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full ${styles.fill} shadow-sm transition-[width] duration-700 ease-out`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-600">{message}</p>
      <p className="mt-3 text-xs text-gray-400">
        Progress reflects scheduled visits through today until your plan is marked complete.
      </p>
    </div>
  )
}
