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
 * Client-side validation: one clear toast. Use `headline` for a summary, or first field message.
 * @param {Record<string, string>} [errors]
 * @param {string} [headline] If set, shown as the toast (summary). Field errors should still be in UI state.
 */
export function toastValidationErrors(errors = {}, headline) {
  if (headline) {
    toast.error(headline)
    return
  }
  const msgs = Object.values(errors).filter((m) => m && String(m).trim())
  if (msgs.length === 0) {
    toast.error('Please complete the required fields')
    return
  }
  if (msgs.length === 1) {
    toast.error(msgs[0])
    return
  }
  toast.error(`${msgs.length} fields need attention — ${msgs[0]}`, { duration: 4500 })
}

/**
 * Success toast for saved forms (short, consistent copy).
 */
export function toastSaved(what = 'Saved') {
  toast.success(what)
}
