import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { invalidatePricingSettingsCache } from '../../hooks/usePricingSettings'

const inputCls =
  'mt-1 h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

function expandTechniquePrice(raw, fallbackTotal = 800, defaultPlatform = 70) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw.withManager || raw.withoutManager)) {
    const totalAmount = Math.max(0, Number(raw.totalAmount) || 0) || fallbackTotal
    const withManager = {
      platform: Math.max(0, Number(raw.withManager?.platform) || 0),
      physio: Math.max(0, Number(raw.withManager?.physio) || 0),
      manager: Math.max(0, Number(raw.withManager?.manager) || 0),
    }
    const withoutManager = {
      platform: Math.max(0, Number(raw.withoutManager?.platform) || 0),
      physio: Math.max(0, Number(raw.withoutManager?.physio) || 0),
      manager: 0,
    }
    return { totalAmount, withManager, withoutManager }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const platform = Math.max(0, Number(raw.platform) || 0)
    const physio = Math.max(0, Number(raw.physio) || 0)
    const manager = Math.max(0, Number(raw.manager) || 0)
    const totalAmount = Math.max(0, Number(raw.totalAmount) || 0) || platform + physio + manager || fallbackTotal
    const withManager = { platform, physio, manager }
    return {
      totalAmount,
      withManager,
      withoutManager: { platform: platform + manager, physio, manager: 0 },
    }
  }
  const total = Number(raw)
  const totalAmount = Number.isFinite(total) && total > 0 ? total : fallbackTotal
  const platform = Math.min(totalAmount, Math.max(0, Number(defaultPlatform) || 0))
  const withManager = { platform, physio: Math.max(0, totalAmount - platform), manager: 0 }
  return { totalAmount, withManager, withoutManager: { ...withManager } }
}

function splitSum(parts) {
  return (
    Math.max(0, Number(parts?.platform) || 0) +
    Math.max(0, Number(parts?.physio) || 0) +
    Math.max(0, Number(parts?.manager) || 0)
  )
}

const TECHNIQUE_ISSUES = ['Cupping Therapy', 'Dry Needling', 'Kinesio Taping', 'IASTM']
const DEFAULT_TECHNIQUE_TOTALS = {
  'Cupping Therapy': 800,
  'Dry Needling': 1000,
  'Kinesio Taping': 700,
  IASTM: 900,
}

const TABS = [
  { id: 'defaults', label: 'Defaults' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'travel', label: 'Travel' },
  { id: 'plans', label: 'Plans' },
]

function pctDisplay(n) {
  return `${Math.round(Number(n) * 1000) / 10}%`
}

export default function AdminPricingSettingsPage() {
  const [tab, setTab] = useState('defaults')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [distanceSurchargeBaseKm, setDistanceSurchargeBaseKm] = useState(5)
  const [distanceSurchargePerKmRupees, setDistanceSurchargePerKmRupees] = useState(5)
  const [homePlanMaxDiscountPercent, setHomePlanMaxDiscountPercent] = useState(15)
  const [defaultSessionPricing, setDefaultSessionPricing] = useState(() =>
    expandTechniquePrice(600, 600, 70),
  )
  const [defaultsMode, setDefaultsMode] = useState('with') // 'with' | 'without'
  const [techniquePrices, setTechniquePrices] = useState(() =>
    Object.fromEntries(
      TECHNIQUE_ISSUES.map((issue) => [
        issue,
        expandTechniquePrice(DEFAULT_TECHNIQUE_TOTALS[issue], DEFAULT_TECHNIQUE_TOTALS[issue], 70),
      ]),
    ),
  )
  const [techniqueMode, setTechniqueMode] = useState('with') // 'with' | 'without'
  const [planTiers, setPlanTiers] = useState([])
  const [planMilestones, setPlanMilestones] = useState({})
  const [updatedAt, setUpdatedAt] = useState(null)

  const applyPayload = useCallback((data) => {
    setDistanceSurchargeBaseKm(data.distanceSurchargeBaseKm)
    setDistanceSurchargePerKmRupees(data.distanceSurchargePerKmRupees)
    setHomePlanMaxDiscountPercent(data.homePlanMaxDiscountPercent)
    setDefaultSessionPricing(
      expandTechniquePrice(
        data.defaultSessionPricing || {
          totalAmount: data.defaultBookingAmountRupees,
          withManager: {
            platform: data.platformCommissionPerSessionRupees,
            physio: data.defaultPhysioPricePerSession,
            manager: data.managerCommissionPerSessionRupees,
          },
        },
        data.defaultBookingAmountRupees || 600,
        data.platformCommissionPerSessionRupees ?? 70,
      ),
    )
    setTechniquePrices(
      Object.fromEntries(
        TECHNIQUE_ISSUES.map((issue) => [
          issue,
          expandTechniquePrice(
            data.techniquePrices?.[issue],
            DEFAULT_TECHNIQUE_TOTALS[issue],
            data.platformCommissionPerSessionRupees ?? 70,
          ),
        ]),
      ),
    )
    setPlanTiers(Array.isArray(data.planTiers) ? data.planTiers : [])
    setPlanMilestones(data.planMilestones && typeof data.planMilestones === 'object' ? data.planMilestones : {})
    setUpdatedAt(data.pricingUpdatedAt || null)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/pricing/settings')
      applyPayload(data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load pricing settings')
    } finally {
      setLoading(false)
    }
  }, [applyPayload])

  useEffect(() => {
    load()
  }, [load])

  function updateTier(sessions, patch) {
    setPlanTiers((prev) => prev.map((t) => (t.sessions === sessions ? { ...t, ...patch } : t)))
  }

  function updateMilestoneRow(sessionsKey, rowIdx, patch) {
    setPlanMilestones((prev) => {
      const rows = [...(prev[sessionsKey] || [])]
      rows[rowIdx] = { ...rows[rowIdx], ...patch }
      return { ...prev, [sessionsKey]: rows }
    })
  }

  function addMilestoneRow(sessionsKey) {
    setPlanMilestones((prev) => ({
      ...prev,
      [sessionsKey]: [...(prev[sessionsKey] || []), { bySession: 1, minCumPct: 0 }],
    }))
  }

  function removeMilestoneRow(sessionsKey, rowIdx) {
    setPlanMilestones((prev) => ({
      ...prev,
      [sessionsKey]: (prev[sessionsKey] || []).filter((_, i) => i !== rowIdx),
    }))
  }

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    const maxDisc = Number(homePlanMaxDiscountPercent) || 0
    const tiersForSave = planTiers.map((t) => ({
      ...t,
      defaultDiscountPercent: Math.min(maxDisc, Math.max(0, Number(t.defaultDiscountPercent) || 0)),
    }))
    const defaultsTotal = Number(defaultSessionPricing?.totalAmount) || 0
    if (Math.abs(splitSum(defaultSessionPricing?.withManager) - defaultsTotal) > 0.01) {
      toast.error(`Defaults: with-manager split must equal patient total ₹${defaultsTotal}`)
      setSaving(false)
      setTab('defaults')
      setDefaultsMode('with')
      return
    }
    if (Math.abs(splitSum({ ...defaultSessionPricing?.withoutManager, manager: 0 }) - defaultsTotal) > 0.01) {
      toast.error(`Defaults: without-manager split must equal patient total ₹${defaultsTotal}`)
      setSaving(false)
      setTab('defaults')
      setDefaultsMode('without')
      return
    }
    for (const issue of TECHNIQUE_ISSUES) {
      const row = techniquePrices[issue]
      const total = Number(row?.totalAmount) || 0
      if (Math.abs(splitSum(row?.withManager) - total) > 0.01) {
        toast.error(`${issue}: with-manager split must equal patient total ₹${total}`)
        setSaving(false)
        setTab('techniques')
        setTechniqueMode('with')
        return
      }
      if (Math.abs(splitSum({ ...row?.withoutManager, manager: 0 }) - total) > 0.01) {
        toast.error(`${issue}: without-manager split must equal patient total ₹${total}`)
        setSaving(false)
        setTab('techniques')
        setTechniqueMode('without')
        return
      }
    }
    try {
      const wm = defaultSessionPricing.withManager || { platform: 0, physio: 0, manager: 0 }
      const wom = defaultSessionPricing.withoutManager || { platform: 0, physio: 0, manager: 0 }
      const { data } = await api.patch('/admin/pricing/settings', {
        defaultSessionPricing: {
          totalAmount: defaultsTotal,
          withManager: {
            platform: Number(wm.platform) || 0,
            physio: Number(wm.physio) || 0,
            manager: Number(wm.manager) || 0,
          },
          withoutManager: {
            platform: Number(wom.platform) || 0,
            physio: Number(wom.physio) || 0,
            manager: 0,
          },
        },
        distanceSurchargeBaseKm: Number(distanceSurchargeBaseKm),
        distanceSurchargePerKmRupees: Number(distanceSurchargePerKmRupees),
        homePlanMaxDiscountPercent: maxDisc,
        techniquePrices: Object.fromEntries(
          TECHNIQUE_ISSUES.map((issue) => {
            const row = techniquePrices[issue] || expandTechniquePrice(DEFAULT_TECHNIQUE_TOTALS[issue])
            return [
              issue,
              {
                totalAmount: Number(row.totalAmount) || 0,
                withManager: {
                  platform: Number(row.withManager?.platform) || 0,
                  physio: Number(row.withManager?.physio) || 0,
                  manager: Number(row.withManager?.manager) || 0,
                },
                withoutManager: {
                  platform: Number(row.withoutManager?.platform) || 0,
                  physio: Number(row.withoutManager?.physio) || 0,
                  manager: 0,
                },
              },
            ]
          }),
        ),
        planTiers: tiersForSave,
        planMilestones,
      })
      applyPayload(data)
      invalidatePricingSettingsCache()
      toast.success('Pricing settings saved')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save pricing settings')
    } finally {
      setSaving(false)
    }
  }

  async function onReset() {
    if (!window.confirm('Reset all pricing fields to built-in defaults?')) return
    setResetting(true)
    try {
      const { data } = await api.post('/admin/pricing/settings/reset', {})
      applyPayload(data)
      invalidatePricingSettingsCache()
      toast.success('Pricing reset to defaults')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Loading pricing settings…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="type-page-title text-slate-900">Pricing &amp; rates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform-wide pricing for web and mobile. Referrals are on{' '}
          <Link to="/admin/platform" className="font-medium text-teal-700 hover:underline">
            Platform settings
          </Link>
          .
        </p>
        {updatedAt ? (
          <p className="mt-2 text-xs text-slate-500">Last saved: {new Date(updatedAt).toLocaleString()}</p>
        ) : null}
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {tab === 'defaults' && (() => {
          const row =
            defaultSessionPricing || expandTechniquePrice(600, 600, 70)
          const totalAmount = Math.max(0, Number(row.totalAmount) || 0)
          const splitKey = defaultsMode === 'with' ? 'withManager' : 'withoutManager'
          const split = row[splitKey] || { platform: 0, physio: 0, manager: 0 }
          const platform = Math.max(0, Number(split.platform) || 0)
          const physio = Math.max(0, Number(split.physio) || 0)
          const manager = defaultsMode === 'with' ? Math.max(0, Number(split.manager) || 0) : 0
          const sum = platform + physio + manager
          const balanced = Math.abs(sum - totalAmount) < 0.01

          function patchDefaults(next) {
            setDefaultSessionPricing((prev) => ({ ...prev, ...next }))
          }

          function setTotal(value) {
            const nextTotal = Math.max(0, Number(value) || 0)
            const wm = { ...(row.withManager || {}) }
            const wom = { ...(row.withoutManager || {}) }
            const wmPlatform = Math.min(Math.max(0, Number(wm.platform) || 0), nextTotal)
            const wmManager = Math.min(Math.max(0, Number(wm.manager) || 0), nextTotal - wmPlatform)
            wm.platform = wmPlatform
            wm.manager = wmManager
            wm.physio = Math.max(0, nextTotal - wmPlatform - wmManager)
            const womPlatform = Math.min(Math.max(0, Number(wom.platform) || 0), nextTotal)
            wom.platform = womPlatform
            wom.manager = 0
            wom.physio = Math.max(0, nextTotal - womPlatform)
            patchDefaults({ totalAmount: nextTotal, withManager: wm, withoutManager: wom })
          }

          function setSplitPart(field, value) {
            const n = Math.max(0, Number(value) || 0)
            const p = field === 'platform' ? n : Math.max(0, Number(split.platform) || 0)
            const m =
              defaultsMode === 'with'
                ? field === 'manager'
                  ? n
                  : Math.max(0, Number(split.manager) || 0)
                : 0
            const ph = field === 'physio' ? n : Math.max(0, totalAmount - p - m)
            patchDefaults({
              [splitKey]: { platform: p, physio: ph, manager: m },
            })
          }

          return (
            <Card>
              <h2 className="type-page-title text-slate-900">Defaults &amp; commission</h2>
              <p className="mt-1 text-sm text-slate-600">
                Default home-session price. Patient always pays the same total. Use the toggle to set who
                earns what with or without a care manager.
              </p>

              <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setDefaultsMode('with')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    defaultsMode === 'with'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  With manager
                </button>
                <button
                  type="button"
                  onClick={() => setDefaultsMode('without')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    defaultsMode === 'without'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Without manager
                </button>
              </div>

              <p className="mt-4 rounded-xl bg-teal-50 px-3 py-2.5 text-sm text-teal-900">
                Patient pays (totalAmount):{' '}
                <span className="font-semibold">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-teal-700/80"> / session</span>
                <span className="mt-1.5 block text-xs font-normal text-teal-800/90">
                  Platform ₹{platform.toLocaleString('en-IN')}
                  <span className="mx-1.5 text-teal-600/50">·</span>
                  Physio ₹{physio.toLocaleString('en-IN')}
                  {defaultsMode === 'with' ? (
                    <>
                      <span className="mx-1.5 text-teal-600/50">·</span>
                      Care manager ₹{manager.toLocaleString('en-IN')}
                    </>
                  ) : null}
                </span>
              </p>

              <label className="mt-4 block text-xs font-medium text-slate-600">
                Patient pays (totalAmount) ₹
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={inputCls}
                  value={totalAmount}
                  onChange={(e) => setTotal(e.target.value)}
                />
                <span className="mt-1 block text-[11px] font-normal text-slate-500">
                  Same amount with or without a manager
                </span>
              </label>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {defaultsMode === 'with' ? 'With manager' : 'Without manager'} split
              </p>
              <div
                className={`mt-2 grid gap-3 ${
                  defaultsMode === 'with' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                }`}
              >
                <label className="block text-xs font-medium text-slate-600">
                  Platform (₹)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={inputCls}
                    value={split.platform}
                    onChange={(e) => setSplitPart('platform', e.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Physio (₹)
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={inputCls}
                    value={split.physio}
                    onChange={(e) => setSplitPart('physio', e.target.value)}
                  />
                </label>
                {defaultsMode === 'with' ? (
                  <label className="block text-xs font-medium text-slate-600">
                    Care manager (₹)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className={inputCls}
                      value={split.manager}
                      onChange={(e) => setSplitPart('manager', e.target.value)}
                    />
                  </label>
                ) : null}
              </div>

              <p
                className={`mt-2.5 rounded-lg px-3 py-2 text-xs ${
                  balanced
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-900'
                }`}
              >
                {balanced
                  ? `Split totals ₹${sum.toLocaleString('en-IN')} — matches patient total`
                  : `Split totals ₹${sum.toLocaleString('en-IN')} — must equal ₹${totalAmount.toLocaleString('en-IN')}`}
              </p>

              <label className="mt-4 block text-xs font-medium text-slate-600">
                Max home-plan discount (%)
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  className={inputCls}
                  value={homePlanMaxDiscountPercent}
                  onChange={(e) => setHomePlanMaxDiscountPercent(e.target.value)}
                />
              </label>
            </Card>
          )
        })()}

        {tab === 'techniques' && (
          <Card>
            <h2 className="type-page-title text-slate-900">Technique prices</h2>
            <p className="mt-1 text-sm text-slate-600">
              Patient always pays the same total. Use the toggle to set who earns what with or without a
              care manager.
            </p>

            <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTechniqueMode('with')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  techniqueMode === 'with'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                With manager
              </button>
              <button
                type="button"
                onClick={() => setTechniqueMode('without')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  techniqueMode === 'without'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Without manager
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {TECHNIQUE_ISSUES.map((issue) => {
                const row =
                  techniquePrices[issue] ||
                  expandTechniquePrice(DEFAULT_TECHNIQUE_TOTALS[issue], DEFAULT_TECHNIQUE_TOTALS[issue], 70)
                const totalAmount = Math.max(0, Number(row.totalAmount) || 0)
                const splitKey = techniqueMode === 'with' ? 'withManager' : 'withoutManager'
                const split = row[splitKey] || { platform: 0, physio: 0, manager: 0 }
                const platform = Math.max(0, Number(split.platform) || 0)
                const physio = Math.max(0, Number(split.physio) || 0)
                const manager = techniqueMode === 'with' ? Math.max(0, Number(split.manager) || 0) : 0
                const sum = platform + physio + manager
                const balanced = Math.abs(sum - totalAmount) < 0.01

                function patchRow(next) {
                  setTechniquePrices((prev) => ({
                    ...prev,
                    [issue]: { ...prev[issue], ...next },
                  }))
                }

                function setTotal(value) {
                  const nextTotal = Math.max(0, Number(value) || 0)
                  const wm = { ...(row.withManager || {}) }
                  const wom = { ...(row.withoutManager || {}) }
                  // Scale physio to absorb delta on both splits; keep platform/manager where possible
                  const wmPlatform = Math.min(Math.max(0, Number(wm.platform) || 0), nextTotal)
                  const wmManager = Math.min(Math.max(0, Number(wm.manager) || 0), nextTotal - wmPlatform)
                  wm.platform = wmPlatform
                  wm.manager = wmManager
                  wm.physio = Math.max(0, nextTotal - wmPlatform - wmManager)
                  const womPlatform = Math.min(Math.max(0, Number(wom.platform) || 0), nextTotal)
                  wom.platform = womPlatform
                  wom.manager = 0
                  wom.physio = Math.max(0, nextTotal - womPlatform)
                  patchRow({ totalAmount: nextTotal, withManager: wm, withoutManager: wom })
                }

                function setSplitPart(field, value) {
                  const n = Math.max(0, Number(value) || 0)
                  const p = field === 'platform' ? n : Math.max(0, Number(split.platform) || 0)
                  const m =
                    techniqueMode === 'with'
                      ? field === 'manager'
                        ? n
                        : Math.max(0, Number(split.manager) || 0)
                      : 0
                  const ph =
                    field === 'physio' ? n : Math.max(0, totalAmount - p - m)
                  patchRow({
                    [splitKey]: { platform: p, physio: ph, manager: m },
                  })
                }

                return (
                  <div key={issue} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{issue}</p>

                    <label className="mt-3 block text-xs font-medium text-slate-600">
                      Patient pays (totalAmount) ₹
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className={inputCls}
                        value={totalAmount}
                        onChange={(e) => setTotal(e.target.value)}
                      />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        Same amount with or without a manager
                      </span>
                    </label>

                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {techniqueMode === 'with' ? 'With manager' : 'Without manager'} split
                    </p>
                    <div
                      className={`mt-2 grid gap-3 ${
                        techniqueMode === 'with' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      }`}
                    >
                      <label className="block text-xs font-medium text-slate-600">
                        Platform (₹)
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className={inputCls}
                          value={split.platform}
                          onChange={(e) => setSplitPart('platform', e.target.value)}
                        />
                      </label>
                      <label className="block text-xs font-medium text-slate-600">
                        Physio (₹)
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className={inputCls}
                          value={split.physio}
                          onChange={(e) => setSplitPart('physio', e.target.value)}
                        />
                      </label>
                      {techniqueMode === 'with' ? (
                        <label className="block text-xs font-medium text-slate-600">
                          Care manager (₹)
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className={inputCls}
                            value={split.manager}
                            onChange={(e) => setSplitPart('manager', e.target.value)}
                          />
                        </label>
                      ) : null}
                    </div>

                    <p
                      className={`mt-2.5 rounded-lg px-3 py-2 text-xs ${
                        balanced
                          ? 'bg-teal-50 text-teal-900'
                          : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                      }`}
                    >
                      Split ₹{sum.toLocaleString('en-IN')}
                      {balanced ? ' matches ' : ' must equal '}
                      patient ₹{totalAmount.toLocaleString('en-IN')}
                      <span className="mx-1.5 opacity-50">·</span>
                      Platform ₹{platform.toLocaleString('en-IN')}
                      <span className="mx-1.5 opacity-50">·</span>
                      Physio ₹{physio.toLocaleString('en-IN')}
                      {techniqueMode === 'with' ? (
                        <>
                          <span className="mx-1.5 opacity-50">·</span>
                          Care manager ₹{manager.toLocaleString('en-IN')}
                        </>
                      ) : (
                        <>
                          <span className="mx-1.5 opacity-50">·</span>
                          Care manager ₹0
                        </>
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {tab === 'travel' && (
          <Card>
            <h2 className="type-page-title text-slate-900">Travel surcharge</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                Free km
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputCls}
                  value={distanceSurchargeBaseKm}
                  onChange={(e) => setDistanceSurchargeBaseKm(e.target.value)}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                ₹ per extra km
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={inputCls}
                  value={distanceSurchargePerKmRupees}
                  onChange={(e) => setDistanceSurchargePerKmRupees(e.target.value)}
                />
              </label>
            </div>
          </Card>
        )}

        {tab === 'plans' && (
          <>
            <Card>
              <h2 className="type-page-title text-slate-900">Home plan tiers</h2>
              <div className="mt-4 space-y-4">
                {planTiers.map((tier) => (
                  <div key={tier.sessions} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">{tier.sessions}-session plan</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs text-slate-600">
                        Label
                        <input
                          className={inputCls}
                          value={tier.label || ''}
                          onChange={(e) => updateTier(tier.sessions, { label: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs text-slate-600">
                        Badge
                        <input
                          className={inputCls}
                          value={tier.badge || ''}
                          onChange={(e) => updateTier(tier.sessions, { badge: e.target.value })}
                        />
                      </label>
                      <label className="block text-xs text-slate-600">
                        Full payment discount (%)
                        <input
                          type="number"
                          min={0}
                          max={homePlanMaxDiscountPercent}
                          step={0.01}
                          className={inputCls}
                          value={tier.defaultDiscountPercent}
                          onChange={(e) =>
                            updateTier(tier.sessions, {
                              defaultDiscountPercent: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label className="block text-xs text-slate-600 sm:col-span-2">
                        Description
                        <textarea
                          rows={2}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          value={tier.description || ''}
                          onChange={(e) => updateTier(tier.sessions, { description: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="type-page-title text-slate-900">Payment milestones</h2>
              {[7, 15, 30].map((sessions) => {
                const key = String(sessions)
                const rows = planMilestones[key] || planMilestones[sessions] || []
                return (
                  <div key={sessions} className="mt-4 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{sessions}-session</p>
                      <button
                        type="button"
                        className="text-xs font-medium text-teal-700 hover:underline"
                        onClick={() => addMilestoneRow(key)}
                      >
                        Add row
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {rows.map((row, idx) => (
                        <div key={`${key}-${idx}`} className="flex flex-wrap items-end gap-2">
                          <label className="text-xs text-slate-600">
                            By session
                            <input
                              type="number"
                              min={1}
                              max={sessions}
                              className="mt-1 h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm"
                              value={row.bySession}
                              onChange={(e) =>
                                updateMilestoneRow(key, idx, { bySession: Number(e.target.value) || 1 })
                              }
                            />
                          </label>
                          <label className="text-xs text-slate-600">
                            Min %
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              className="mt-1 h-9 w-24 rounded-lg border border-slate-200 px-2 text-sm"
                              value={Math.round(Number(row.minCumPct) * 1000) / 10}
                              onChange={(e) =>
                                updateMilestoneRow(key, idx, {
                                  minCumPct: (Number(e.target.value) || 0) / 100,
                                })
                              }
                            />
                          </label>
                          <span className="pb-1 text-xs text-slate-500">{pctDisplay(row.minCumPct)}</span>
                          <button
                            type="button"
                            className="pb-1 text-xs text-red-600 hover:underline"
                            onClick={() => removeMilestoneRow(key, idx)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </Card>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} disabled={saving || resetting}>
            Save pricing settings
          </Button>
          <Button type="button" variant="outline" loading={resetting} disabled={saving || resetting} onClick={onReset}>
            Reset to defaults
          </Button>
        </div>
      </form>
    </div>
  )
}
