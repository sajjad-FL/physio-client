import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { invalidatePricingSettingsCache } from '../../hooks/usePricingSettings'

const inputCls =
  'h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

function pctDisplay(n) {
  return `${Math.round(Number(n) * 1000) / 10}%`
}

export default function AdminPricingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [defaultBookingAmountRupees, setDefaultBookingAmountRupees] = useState(500)
  const [platformCommissionPerSessionRupees, setPlatformCommissionPerSessionRupees] = useState(100)
  const [distanceSurchargeBaseKm, setDistanceSurchargeBaseKm] = useState(5)
  const [distanceSurchargePerKmRupees, setDistanceSurchargePerKmRupees] = useState(5)
  const [homePlanMaxDiscountPercent, setHomePlanMaxDiscountPercent] = useState(15)
  const [defaultPhysioPricePerSession, setDefaultPhysioPricePerSession] = useState(500)
  const [managerCommissionPerSessionRupees, setManagerCommissionPerSessionRupees] = useState(0)
  const [planTiers, setPlanTiers] = useState([])
  const [planMilestones, setPlanMilestones] = useState({})
  const [updatedAt, setUpdatedAt] = useState(null)

  const travelExample = useMemo(() => {
    const extra = Math.max(0, 8 - Number(distanceSurchargeBaseKm || 0))
    return extra * Number(distanceSurchargePerKmRupees || 0)
  }, [distanceSurchargeBaseKm, distanceSurchargePerKmRupees])

  const applyPayload = useCallback((data) => {
    setDefaultBookingAmountRupees(data.defaultBookingAmountRupees)
    setPlatformCommissionPerSessionRupees(data.platformCommissionPerSessionRupees ?? 100)
    setDistanceSurchargeBaseKm(data.distanceSurchargeBaseKm)
    setDistanceSurchargePerKmRupees(data.distanceSurchargePerKmRupees)
    setHomePlanMaxDiscountPercent(data.homePlanMaxDiscountPercent)
    setDefaultPhysioPricePerSession(data.defaultPhysioPricePerSession)
    setManagerCommissionPerSessionRupees(data.managerCommissionPerSessionRupees ?? 0)
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
    setPlanTiers((prev) =>
      prev.map((t) => (t.sessions === sessions ? { ...t, ...patch } : t)),
    )
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
    try {
      const { data } = await api.patch(
        '/admin/pricing/settings',
        {
          defaultBookingAmountRupees: Number(defaultBookingAmountRupees),
          platformCommissionPerSessionRupees: Number(platformCommissionPerSessionRupees),
          distanceSurchargeBaseKm: Number(distanceSurchargeBaseKm),
          distanceSurchargePerKmRupees: Number(distanceSurchargePerKmRupees),
          homePlanMaxDiscountPercent: Number(homePlanMaxDiscountPercent),
          defaultPhysioPricePerSession: Number(defaultPhysioPricePerSession),
          managerCommissionPerSessionRupees: Number(managerCommissionPerSessionRupees),
          planTiers,
          planMilestones,
        },      )
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
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="type-page-title text-slate-900">Pricing &amp; rates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform-wide pricing used on web and mobile. Referral amounts are on{' '}
          <Link to="/admin/platform" className="font-medium text-teal-700 hover:underline">
            Platform settings
          </Link>
          .
        </p>
        {updatedAt ? (
          <p className="mt-2 text-xs text-slate-500">Last saved: {new Date(updatedAt).toLocaleString()}</p>
        ) : null}
      </div>

      <form onSubmit={onSave} className="space-y-6">
        <Card>
          <h2 className="type-page-title text-slate-900">Defaults &amp; commission</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Default session price (₹)
              <input
                type="number"
                min={1}
                step={1}
                className={`${inputCls} mt-1 max-w-none`}
                value={defaultBookingAmountRupees}
                onChange={(e) => setDefaultBookingAmountRupees(e.target.value)}
              />
              <span className="mt-1 block text-[11px] text-slate-500">Home bookings before physiotherapist assign; online fallback</span>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Platform commission (₹ per session)
              <input
                type="number"
                min={0}
                step={1}
                className={`${inputCls} mt-1 max-w-none`}
                value={platformCommissionPerSessionRupees}
                onChange={(e) => setPlatformCommissionPerSessionRupees(e.target.value)}
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Flat platform fee per session on verified payments. 0 disables it.
              </span>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Suggested physiotherapist rate (₹)
              <input
                type="number"
                min={0}
                step={1}
                className={`${inputCls} mt-1 max-w-none`}
                value={defaultPhysioPricePerSession}
                onChange={(e) => setDefaultPhysioPricePerSession(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Max home-plan discount (%)
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                className={`${inputCls} mt-1 max-w-none`}
                value={homePlanMaxDiscountPercent}
                onChange={(e) => setHomePlanMaxDiscountPercent(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Care-manager commission (₹ per session)
              <input
                type="number"
                min={0}
                step={1}
                className={`${inputCls} mt-1 max-w-none`}
                value={managerCommissionPerSessionRupees}
                onChange={(e) => setManagerCommissionPerSessionRupees(e.target.value)}
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Earned per session on manager-collected plans; paid out when the cash hand-off is settled. 0 disables it.
              </span>
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="type-page-title text-slate-900">Travel surcharge</h2>
          <p className="mt-1 text-sm text-slate-600">Applied per home visit when admin assigns a physiotherapist.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">
              Free km included
              <input
                type="number"
                min={0}
                step={1}
                className={`${inputCls} mt-1 max-w-none`}
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
                className={`${inputCls} mt-1 max-w-none`}
                value={distanceSurchargePerKmRupees}
                onChange={(e) => setDistanceSurchargePerKmRupees(e.target.value)}
              />
            </label>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Example: 8 km trip → ₹{travelExample.toFixed(0)} surcharge per visit (
            {distanceSurchargeBaseKm} km free, then ₹{distanceSurchargePerKmRupees}/km)
          </p>
        </Card>

        <Card>
          <h2 className="type-page-title text-slate-900">Home plan tiers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Marketing copy and per-tier full-payment discounts for 7 / 15 / 30 session plans.
          </p>
          <div className="mt-4 space-y-4">
            {planTiers.map((tier) => (
              <div key={tier.sessions} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{tier.sessions}-session plan</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-slate-600">
                    Label
                    <input
                      className={`${inputCls} mt-1 max-w-none`}
                      value={tier.label || ''}
                      onChange={(e) => updateTier(tier.sessions, { label: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-slate-600">
                    Badge
                    <input
                      className={`${inputCls} mt-1 max-w-none`}
                      value={tier.badge || ''}
                      onChange={(e) => updateTier(tier.sessions, { badge: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-slate-600 sm:col-span-2">
                    Full payment discount (%)
                    <input
                      type="number"
                      min={0}
                      max={homePlanMaxDiscountPercent}
                      step={0.01}
                      className={`${inputCls} mt-1 max-w-none`}
                      value={tier.defaultDiscountPercent}
                      onChange={(e) =>
                        updateTier(tier.sessions, { defaultDiscountPercent: Number(e.target.value) || 0 })
                      }
                    />
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Applied only when the care manager selects Full payment. Installment plans get no discount.
                    </span>
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
          <p className="mt-1 text-sm text-slate-600">
            Minimum cumulative % paid before a session can be marked complete.
          </p>
          {[7, 15, 30].map((sessions) => {
            const key = String(sessions)
            const rows = planMilestones[key] || planMilestones[sessions] || []
            return (
              <div key={sessions} className="mt-4 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{sessions}-session plan</p>
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
                        Min cumulative % (0–100)
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
