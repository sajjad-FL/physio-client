import { useState } from 'react'
import { api } from '../config/api'
import { ISSUE_OPTIONS } from '../constants/issues'

export function BookingForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [issue, setIssue] = useState(ISSUE_OPTIONS[0] || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const trimmed = {
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      issue: issue.trim(),
    }
    if (!trimmed.name || !trimmed.phone || !trimmed.location || !trimmed.issue) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await api.post('/bookings', trimmed)
      setSuccess(true)
      setName('')
      setPhone('')
      setLocation('')
      setIssue(ISSUE_OPTIONS[0] || '')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-md shadow-gray-200/80 ring-1 ring-gray-100"
      noValidate
    >
      <h2 className="text-xl font-semibold text-gray-900">Request a home visit</h2>
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
      {error && (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="book-name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="book-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-blue-500/20 transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2"
            placeholder="Your name"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="book-phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="book-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-blue-500/20 transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2"
            placeholder="10-digit mobile number"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="book-issue" className="mb-1 block text-sm font-medium text-gray-700">
            Problem
          </label>
          <select
            id="book-issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-blue-500/20 focus:border-blue-500 focus:ring-2"
            required
            disabled={loading}
          >
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="book-location" className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="book-location"
            type="text"
            autoComplete="street-address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none ring-blue-500/20 transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2"
            placeholder="Area, city"
            required
            disabled={loading}
          />
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
