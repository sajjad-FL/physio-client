import { useEffect, useState } from 'react'
import AdminFilterSheet, {
  FilterOptionPill,
  FilterSection,
  FILTER_FIELD,
} from './AdminFilterSheet'

/**
 * Mobile bottom sheet for Payment history filters.
 */
export default function AdminPaymentFiltersDrawer({
  draft: initial,
  modeTabs,
  channelOptions,
  collectorOptions,
  statusOptions,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState(() => ({ ...initial }))

  useEffect(() => {
    setDraft({ ...initial })
  }, [initial])

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  function setMode(next) {
    setDraft((d) => {
      let channel = d.channel
      let status = d.status
      if (next === 'online') {
        channel = 'online'
        status = ''
      } else if (channel === 'online') {
        channel = ''
      }
      return { ...d, mode: next, channel, status }
    })
  }

  function setChannel(next) {
    setDraft((d) => {
      let mode = d.mode
      if (next === 'online') mode = 'online'
      else if (next === 'cash' || next === 'phonepe_qr') mode = 'offline'
      return { ...d, channel: next, mode }
    })
  }

  return (
    <AdminFilterSheet
      title="Filters"
      onClose={onClose}
      onApply={() => onApply({ ...draft })}
      onReset={onReset}
    >
      <FilterSection title="Mode">
        {modeTabs.map((t) => (
          <FilterOptionPill key={t.id || 'all-mode'} active={draft.mode === t.id} onClick={() => setMode(t.id)}>
            {t.label}
          </FilterOptionPill>
        ))}
      </FilterSection>

      <FilterSection title="Status">
        {statusOptions.map((s) => (
          <FilterOptionPill
            key={s.id || 'all-status'}
            active={
              s.id === 'needs'
                ? draft.mode === 'offline' && draft.status === 'collected'
                : s.id === ''
                  ? !draft.status
                  : draft.status === s.id
            }
            onClick={() => {
              if (s.id === 'needs') {
                setDraft((d) => ({
                  ...d,
                  mode: 'offline',
                  status: 'collected',
                  channel: d.channel === 'online' ? '' : d.channel,
                }))
              } else {
                setDraft((d) => ({ ...d, status: s.id }))
              }
            }}
          >
            {s.label}
            {s.count != null ? ` · ${s.count}` : ''}
          </FilterOptionPill>
        ))}
      </FilterSection>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Channel
        </label>
        <select className={FILTER_FIELD} value={draft.channel} onChange={(e) => setChannel(e.target.value)}>
          {channelOptions.map((o) => (
            <option key={o.id || 'all-ch'} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Collected by
        </label>
        <select className={FILTER_FIELD} value={draft.collector} onChange={(e) => set('collector', e.target.value)}>
          {collectorOptions.map((o) => (
            <option key={o.id || 'all-col'} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Min ₹
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            className={FILTER_FIELD}
            value={draft.amountMin}
            onChange={(e) => set('amountMin', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Max ₹
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            className={FILTER_FIELD}
            value={draft.amountMax}
            onChange={(e) => set('amountMax', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </label>
          <input
            type="date"
            className={FILTER_FIELD}
            value={draft.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </label>
          <input
            type="date"
            className={FILTER_FIELD}
            value={draft.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
          />
        </div>
      </div>
    </AdminFilterSheet>
  )
}
