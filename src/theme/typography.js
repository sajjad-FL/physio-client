/**
 * Typography tokens aligned with mobile/src/theme/typography.js (compact Inter scale).
 * Use semantic class strings for mobile-first responsive text across the web client.
 */

/** Font size scale (px) — matches mobile app. */
export const type = {
  xs: 10,
  sm: 11,
  base: 13,
  md: 14,
  lg: 15,
  xl: 17,
  '2xl': 19,
  '3xl': 22,
}

/** Line-height scale (px) — matches mobile app. */
export const leading = {
  xs: 14,
  sm: 16,
  base: 19,
  md: 21,
  lg: 23,
  xl: 25,
  '2xl': 27,
  '3xl': 29,
}

/** Semantic Tailwind class strings (mobile-first, scale up at sm/md). */
export const textHero =
  'text-[19px] leading-[27px] font-bold tracking-tight sm:text-2xl sm:leading-tight md:text-3xl'

export const textPageTitle =
  'text-[17px] leading-[25px] font-bold tracking-tight sm:text-xl sm:leading-snug md:text-2xl'

export const textSectionTitle =
  'text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs sm:normal-case sm:tracking-tight sm:text-slate-900 sm:text-base sm:font-bold'

export const textBody = 'text-[13px] leading-[19px] sm:text-sm sm:leading-normal md:text-base'

export const textLabel = 'text-[13px] font-medium sm:text-sm'

export const textCaption = 'text-[11px] leading-[16px] text-slate-500 sm:text-xs sm:leading-normal'

export const textStat = 'text-[19px] font-bold tabular-nums sm:text-2xl md:text-3xl'

export const textButton = 'text-[14px] font-semibold sm:text-sm'
