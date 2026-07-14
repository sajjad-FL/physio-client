import { useEffect, useState } from 'react'
import AdminFilterSheet, {
  FilterOptionPill,
  FilterSection,
  FILTER_FIELD,
} from './AdminFilterSheet'

export function AdminWalletFiltersDrawer({ draft: initial, filterOptions, onClose, onApply, onReset }) {
  const [draft, setDraft] = useState(() => ({ ...initial }))

  useEffect(() => {
    setDraft({ ...initial })
  }, [initial])

  return (
    <AdminFilterSheet
      title="Wallet filters"
      onClose={onClose}
      onApply={() => onApply({ ...draft })}
      onReset={onReset}
    >
      <FilterSection title="Show">
        {filterOptions.map((f) => (
          <FilterOptionPill
            key={f.id}
            active={draft.filter === f.id}
            onClick={() => setDraft((d) => ({ ...d, filter: f.id }))}
          >
            {f.label}
          </FilterOptionPill>
        ))}
      </FilterSection>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <input
          type="search"
          className={FILTER_FIELD}
          placeholder="Name or phone"
          value={draft.search}
          onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
        />
      </div>
    </AdminFilterSheet>
  )
}

export function AdminWithdrawFiltersDrawer({
  draft: initial,
  statusTabs,
  payeeTabs,
  pendingCount = 0,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState(() => ({ ...initial }))

  useEffect(() => {
    setDraft({ ...initial })
  }, [initial])

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  return (
    <AdminFilterSheet
      title="Withdrawal filters"
      onClose={onClose}
      onApply={() => onApply({ ...draft })}
      onReset={onReset}
    >
      <FilterSection title="Status">
        {statusTabs.map((t) => (
          <FilterOptionPill
            key={t.id || 'all-status'}
            active={draft.status === t.id}
            onClick={() => set('status', t.id)}
          >
            {t.label}
            {t.id === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </FilterOptionPill>
        ))}
      </FilterSection>

      <FilterSection title="Payee">
        {payeeTabs.map((t) => (
          <FilterOptionPill
            key={t.id || 'all-payee'}
            active={draft.payee === t.id}
            onClick={() => set('payee', t.id)}
          >
            {t.label}
          </FilterOptionPill>
        ))}
      </FilterSection>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <input
          type="search"
          className={FILTER_FIELD}
          placeholder="Name, phone, or UPI"
          value={draft.search}
          onChange={(e) => set('search', e.target.value)}
        />
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
    </AdminFilterSheet>
  )
}
