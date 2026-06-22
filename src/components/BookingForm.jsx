import { useState } from 'react'
import { api } from '../config/api'
import { ISSUE_OPTIONS } from '../constants/issues'
import { validateLiveField } from '../utils/liveFieldValidation'

export function BookingForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    issue: ISSUE_OPTIONS[0] || '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [bannerError, setBannerError] = useState('')
  const [success, setSuccess] = useState(false)

  function patchField(name, value) {
    const key =
      name === 'name'
        ? 'bookingName'
        : name === 'phone'
          ? 'bookingPhone'
          : name === 'location'
            ? 'location'
            : name === 'issue'
              ? 'bookingIssue'
              : name
    const ctx = name === 'location' ? { mode: 'booking' } : {}
    setErrors((prev) => ({
      ...prev,
      [key]: validateLiveField(key, value, ctx),
    }))
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    patchField(name, value)
    setBannerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBannerError('')
    setSuccess(false)

    const nameErr = validateLiveField('bookingName', form.name)
    const phoneErr = validateLiveField('bookingPhone', form.phone)
    const locErr = validateLiveField('location', form.location, { mode: 'booking' })
    const issueErr = validateLiveField('bookingIssue', form.issue)
    setErrors({
      bookingName: nameErr,
      bookingPhone: phoneErr,
      location: locErr,
      bookingIssue: issueErr,
    })
    if (nameErr || phoneErr || locErr || issueErr) {
      setBannerError('Please fix the fields below.')
      return
    }

    const trimmed = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      issue: form.issue.trim(),
    }

    setLoading(true)
    try {
      await api.post('/bookings', trimmed)
      setSuccess(true)
      setForm({ name: '', phone: '', location: '', issue: ISSUE_OPTIONS[0] || '' })
      setErrors({})
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      setBannerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-blue-500/20 transition placeholder:text-gray-400 focus:ring-2'
  const inputOk = 'border-gray-200 focus:border-blue-500'
  const inputBad = 'border-red-400 ring-1 ring-red-200 focus:border-red-500'

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-md shadow-gray-200/80 ring-1 ring-gray-100"
      noValidate
    >
      <h2 className="type-page-title text-gray-900">Request a home visit</h2>
      <p className="mt-1 text-sm text-gray-600">
        We&apos;ll contact you shortly to confirm your appointment.
      </p>

      {success && (
        <div
          className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Thank you! Your booking request was received. Our team will reach out soon.
        </div>
      )}
      {bannerError && (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {bannerError}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="book-name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="book-name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className={[inputBase, errors.bookingName ? inputBad : inputOk].join(' ')}
            placeholder="Your name"
            disabled={loading}
          />
          {errors.bookingName ? <p className="mt-1 text-xs text-red-600">{errors.bookingName}</p> : null}
        </div>
        <div>
          <label htmlFor="book-phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="book-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className={[inputBase, errors.bookingPhone ? inputBad : inputOk].join(' ')}
            placeholder="10-digit mobile (+91 ok)"
            disabled={loading}
          />
          {errors.bookingPhone ? <p className="mt-1 text-xs text-red-600">{errors.bookingPhone}</p> : null}
        </div>
        <div>
          <label htmlFor="book-issue" className="mb-1 block text-sm font-medium text-gray-700">
            Problem
          </label>
          <select
            id="book-issue"
            name="issue"
            value={form.issue}
            onChange={handleChange}
            className={[inputBase, errors.bookingIssue ? inputBad : inputOk].join(' ')}
            disabled={loading}
          >
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.bookingIssue ? <p className="mt-1 text-xs text-red-600">{errors.bookingIssue}</p> : null}
        </div>
        <div>
          <label htmlFor="book-location" className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="book-location"
            name="location"
            type="text"
            autoComplete="street-address"
            value={form.location}
            onChange={handleChange}
            className={[inputBase, errors.location ? inputBad : inputOk].join(' ')}
            placeholder="Area, city"
            disabled={loading}
          />
          {errors.location ? <p className="mt-1 text-xs text-red-600">{errors.location}</p> : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Submitting…' : 'Submit booking'}
      </button>
    </form>
  )
}
