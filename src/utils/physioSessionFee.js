/**
 * Display physio fee: single ₹min or range ₹min–max when max > min.
 * @param {{ pricePerSession?: unknown, pricePerSessionMax?: unknown } | null | undefined} p
 */
export function formatPhysioSessionFeeLabel(p) {
  if (!p) return '—'
  const lo = Number(p.pricePerSession)
  if (!Number.isFinite(lo) || lo < 0) return '—'
  const hiRaw = p.pricePerSessionMax
  const hi = hiRaw != null && hiRaw !== '' ? Number(hiRaw) : NaN
  if (Number.isFinite(hi) && hi > lo) return `₹${lo}–${hi}`
  return `₹${lo}`
}
