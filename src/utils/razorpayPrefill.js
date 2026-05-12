/**
 * Razorpay Standard Checkout expects Indian mobile as 10 digits (no +91) in `prefill.contact`.
 * @param {unknown} rawPhone
 * @returns {string | undefined}
 */
export function toRazorpayContact10(rawPhone) {
  if (rawPhone == null) return undefined
  const s = String(rawPhone).trim()
  if (!s) return undefined
  const digits = s.replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return undefined
}

/**
 * @param {{ name?: unknown; phone?: unknown; email?: unknown }} profile
 * @returns {Record<string, string>}
 */
export function buildRazorpayPrefill(profile) {
  const prefill = {}
  const name = profile?.name != null ? String(profile.name).trim() : ''
  if (name) prefill.name = name
  const contact = toRazorpayContact10(profile?.phone)
  if (contact) prefill.contact = contact
  const email = profile?.email != null ? String(profile.email).trim() : ''
  if (email) prefill.email = email
  return prefill
}
