import { Calendar, Activity, ShieldCheck } from 'lucide-react'

const STYLE_BY_SESSIONS = {
  7: {
    icon: Calendar,
    bg: 'bg-white',
    border: 'border-slate-200',
    color: 'text-teal-700',
    titleColor: 'text-slate-900',
  },
  15: {
    icon: Activity,
    bg: 'bg-[#f4fbf7]',
    border: 'border-emerald-200',
    color: 'text-emerald-700',
    titleColor: 'text-emerald-950',
  },
  30: {
    icon: ShieldCheck,
    bg: 'bg-[#f0f9ff]',
    border: 'border-sky-200',
    color: 'text-sky-700',
    titleColor: 'text-sky-950',
  },
}

/** Merge API plan tiers with static marketing styling for home page cards. */
export function buildPlanTierCards(planTiers) {
  if (!Array.isArray(planTiers) || planTiers.length === 0) return []
  return planTiers.map((tier) => {
    const style = STYLE_BY_SESSIONS[tier.sessions] || STYLE_BY_SESSIONS[7]
    const d = Number(tier.defaultDiscountPercent) || 0
    return {
      sessions: tier.sessions,
      label: tier.label,
      badge: tier.badge,
      discountPercent: d,
      desc: tier.description,
      saveCallout: d > 0 ? `SAVE ${d % 1 === 0 ? d : d.toFixed(2)}%` : null,
      icon: style.icon,
      bg: style.bg,
      border: style.border,
      color: style.color,
      titleColor: style.titleColor,
    }
  })
}

export const MOBILE_PLAN_TIER_STYLE = {
  7: {
    icon: 'calendar-outline',
    bg: '#ffffff',
    border: '#e2e8f0',
    color: '#0d6b6b',
    titleColor: '#0f172a',
  },
  15: {
    icon: 'pulse-outline',
    bg: '#f4fbf7',
    border: '#a7f3d0',
    color: '#059669',
    titleColor: '#064e3b',
  },
  30: {
    icon: 'shield-checkmark-outline',
    bg: '#f0f9ff',
    border: '#bae6fd',
    color: '#0284c7',
    titleColor: '#0c4a6e',
  },
}

export function buildMobilePlanTierCards(planTiers) {
  if (!Array.isArray(planTiers) || planTiers.length === 0) return []
  return planTiers.map((tier) => {
    const style = MOBILE_PLAN_TIER_STYLE[tier.sessions] || MOBILE_PLAN_TIER_STYLE[7]
    const d = Number(tier.defaultDiscountPercent) || 0
    return {
      sessions: tier.sessions,
      label: tier.label,
      badge: tier.badge,
      discountPercent: d,
      desc: tier.description,
      saveCallout: d > 0 ? `SAVE ${d % 1 === 0 ? d : d.toFixed(2)}%` : null,
      ...style,
    }
  })
}
