import { useCallback, useEffect, useState } from 'react'
import { api } from '../config/api'

/** Fallback when API unavailable (matches server pricingDefaults). */
export const FALLBACK_PRICING_SETTINGS = {
  defaultBookingAmountRupees: 500,
  platformCommissionPercent: 20,
  distanceSurchargeBaseKm: 5,
  distanceSurchargePerKmRupees: 5,
  homePlanMaxDiscountPercent: 15,
  defaultPhysioPricePerSession: 500,
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
}

let sharedCache = null
let sharedPromise = null

async function fetchPricingSettings() {
  if (sharedCache) return sharedCache
  if (!sharedPromise) {
    sharedPromise = api
      .get('/platform/pricing-settings')
      .then((res) => {
        sharedCache = res.data
        return sharedCache
      })
      .catch(() => {
        sharedPromise = null
        return FALLBACK_PRICING_SETTINGS
      })
  }
  return sharedPromise
}

export function invalidatePricingSettingsCache() {
  sharedCache = null
  sharedPromise = null
}

/**
 * Load platform pricing settings (public API). Cached for the session.
 */
export function usePricingSettings() {
  const [settings, setSettings] = useState(sharedCache || FALLBACK_PRICING_SETTINGS)
  const [loading, setLoading] = useState(!sharedCache)

  const reload = useCallback(async () => {
    invalidatePricingSettingsCache()
    setLoading(true)
    try {
      const data = await fetchPricingSettings()
      setSettings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (sharedCache) {
      setSettings(sharedCache)
      setLoading(false)
      return undefined
    }
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
