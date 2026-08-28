import { SHOP_ORDER_STATUSES, shopOrderStatusLabel } from '../../utils/shopDisplay'

export default function ShopOrderStatusTimeline({ status, statusHistory = [] }) {
  const activeIdx = SHOP_ORDER_STATUSES.indexOf(status)
  const steps = ['placed', 'confirmed', 'shipped', 'delivered']

  if (status === 'cancelled') {
    const last = statusHistory[statusHistory.length - 1]
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Order cancelled</p>
        {last?.note ? <p className="mt-1 text-xs text-red-700">{last.note}</p> : null}
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {steps.map((step, idx) => {
        const done = activeIdx >= SHOP_ORDER_STATUSES.indexOf(step)
        const current = status === step
        return (
          <li key={step} className="flex flex-1 items-center gap-2 sm:flex-col sm:text-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
              } ${current ? 'ring-2 ring-teal-300' : ''}`}
            >
              {idx + 1}
            </span>
            <span className={`text-xs font-semibold ${done ? 'text-ink' : 'text-ink-muted'}`}>
              {shopOrderStatusLabel(step)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
