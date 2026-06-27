import toast from 'react-hot-toast'

/**
 * Normalizes axios / fetch errors from the API.
 * @param {unknown} err
 */
export function parseApiError(err) {
  if (!err) {
    return { message: 'Unknown error', errors: null, status: undefined }
  }
  const data = err.response?.data
  const message =
    (typeof data?.message === 'string' && data.message.trim()) ||
    (typeof err.message === 'string' && err.message) ||
    'Something went wrong'
  const errors =
    data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors) ? data.errors : null
  const status = err.response?.status
  return { message, errors, status }
}

/**
 * Shows a single error toast and returns parsed details for form state.
 * Prefers server `message`, then first field error in `errors`.
 * @param {unknown} err
 * @param {string} [fallbackMessage]
 * @returns {{ message: string, errors: Record<string, string> | null, status?: number }}
 */
export function toastApiError(err, fallbackMessage = 'Request failed') {
  const parsed = parseApiError(err)
  const firstField = parsed.errors ? Object.values(parsed.errors).find((m) => m && String(m).trim()) : null
  const text = parsed.message || firstField || fallbackMessage
  toast.error(text)
  return { message: text, errors: parsed.errors, status: parsed.status }
}

/**
 * First human-readable validation message for banners and toasts.
 * @param {Record<string, string>} [errors]
 * @param {string} [fallback]
 */
export function firstValidationMessage(errors = {}, fallback = 'Please check the highlighted fields below.') {
  const msgs = Object.values(errors).filter((m) => m && String(m).trim())
  if (msgs.length === 0) return fallback
  if (msgs.length === 1) return msgs[0]
  return `${msgs[0]} (${msgs.length - 1} more to fix)`
}

/**
 * Client-side validation: show the clearest single message users can act on.
 * @param {Record<string, string>} [errors]
 * @param {string} [headline] Fallback when there are no field messages
 */
export function toastValidationErrors(errors = {}, headline) {
  const msgs = Object.values(errors).filter((m) => m && String(m).trim())
  if (msgs.length === 1) {
    toast.error(msgs[0])
    return
  }
  if (msgs.length > 1) {
    toast.error(`${msgs[0]} (${msgs.length - 1} more to fix)`, { duration: 5000 })
    return
  }
  toast.error(headline || 'Please complete the required fields')
}

/**
 * Success toast for saved forms (short, consistent copy).
 */
export function toastSaved(what = 'Saved') {
  toast.success(what)
}
