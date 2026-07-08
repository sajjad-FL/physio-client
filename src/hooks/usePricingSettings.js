import { useCallback, useEffect, useState } from 'react'
import { api } from '../config/api'

/** Fallback when API unavailable (matches server pricingDefaults). */
export const FALLBACK_PRICING_SETTINGS = {
  defaultBookingAmountRupees: 500,
  platformCommissionPerSessionRupees: 100,
  platformCommissionPercent: 20,
  distanceSurchargeBaseKm: 5,
  distanceSurchargePerKmRupees: 5,
  homePlanMaxDiscountPercent: 15,
  defaultPhysioPricePerSession: 500,
  managerCommissionPerSessionRupees: 0,
  allowedPlanSessionCounts: [7, 15, 30],
  planTiers: [
    {
      sessions: 7,
      defaultDiscountPercent: 0,
      label: '7-Day Plan',
      badge: 'STARTER',
      description: '7 daily home sessions. Pay 1 session upfront, 100% by session 5.',
    },
    {
      sessions: 15,
      defaultDiscountPercent: 3.33,
      label: '15-Day Plan',
      badge: 'MOST POPULAR',
      description: '15 sessions. Pay 50% by session 5, 100% by session 12.',
    },
    {
      sessions: 30,
      defaultDiscountPercent: 4.67,
      label: '30-Day Plan',
      badge: 'BEST VALUE',
      description: '30 sessions. Pay 50% by session 10, 75% by session 20, 100% by session 25.',
    },
  ],
  planMilestones: {},
  pricingUpdatedAt: null,
  planTiersUpdatedAt: null,
}

const CACHE_TTL_MS = 60_000

let sharedCache = null
let sharedPromise = null

function cacheKey(data) {
  if (!data) return ''
  return `${data.planTiersUpdatedAt || data.pricingUpdatedAt || ''}:${JSON.stringify(data.planTiers || [])}`
}

function isCacheFresh(entry) {
  if (!entry?.data) return false
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return false
  return true
}

async function fetchPricingSettings({ force = false } = {}) {
  if (!force && isCacheFresh(sharedCache)) return sharedCache.data
  if (!force && sharedPromise) return sharedPromise

  sharedPromise = api
    .get('/platform/pricing-settings')
    .then((res) => {
      const data = res.data
      const nextKey = cacheKey(data)
      if (!sharedCache || sharedCache.key !== nextKey || !isCacheFresh(sharedCache)) {
        sharedCache = { data, fetchedAt: Date.now(), key: nextKey }
      } else {
        sharedCache.fetchedAt = Date.now()
      }
      return sharedCache.data
    })
    .catch(() => {
      sharedPromise = null
      return FALLBACK_PRICING_SETTINGS
    })
    .finally(() => {
      sharedPromise = null
    })

  return sharedPromise
}

export function invalidatePricingSettingsCache() {
  sharedCache = null
  sharedPromise = null
}

/**
 * Load platform pricing settings (public API). Cached briefly for the session.
 */
export function usePricingSettings() {
  const [settings, setSettings] = useState(sharedCache?.data || FALLBACK_PRICING_SETTINGS)
  const [loading, setLoading] = useState(!sharedCache)

  const reload = useCallback(async () => {
    invalidatePricingSettingsCache()
    setLoading(true)
    try {
      const data = await fetchPricingSettings({ force: true })
      setSettings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchPricingSettings().then((data) => {
      if (!cancelled) {
        setSettings(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { settings, loading, reload }
}

/** Travel surcharge for assign preview (same formula as server). */
export function computeTravelSurchargePreview(distanceKm, settings) {
  const s = settings || FALLBACK_PRICING_SETTINGS
  if (distanceKm == null || !Number.isFinite(distanceKm)) return 0
  const floored = Math.floor(distanceKm)
  const extraKm = Math.max(0, floored - Number(s.distanceSurchargeBaseKm || 0))
  return extraKm * Number(s.distanceSurchargePerKmRupees || 0)
}
