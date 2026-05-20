import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../config/api'
import { logout } from '../auth/session'
import { ISSUE_OPTIONS } from '../constants/issues'
import RazorpayPayButton from '../components/RazorpayPayButton'
import ConsentModal from '../components/ConsentModal'
import { formatBookingTimeSlot } from '../utils/date'
import { getCurrentCoords } from '../utils/geolocation'
import SeoNoIndex from '../components/seo/SeoNoIndex'
import { useReferralMyCode } from '../hooks/useReferral'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return yyyy + '-' + mm + '-' + dd
}

export default function BookingPage() {
  const navigate = useNavigate()

  const [date, setDate] = useState(todayISO())
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slots, setSlots] = useState([])
  const [timeSlot, setTimeSlot] = useState('')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [issue, setIssue] = useState(ISSUE_OPTIONS[0] || '')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoStatus, setGeoStatus] = useState('')

  const [bookingLoading, setBookingLoading] = useState(false)
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [useWalletCredit, setUseWalletCredit] = useState(false)
  const { walletBalance, refresh: refreshWallet } = useReferralMyCode()

  const [consentOpen, setConsentOpen] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  async function refreshSlots(dateStr) {
    setSlotsLoading(true)
    setError('')
    try {
      const res = await api.get('/slots', { params: { date: dateStr } })
      setSlots(res.data?.slots || [])
      setTimeSlot('')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load slots')
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    refreshSlots(date)
  }, [date])

  async function refreshBookingById(bookingId) {
    const res = await api.get(`/bookings/${bookingId}`)
    setBooking(res.data)
  }

  async function requestLocation() {
    setGeoStatus('Locating…')
    try {
      const { lat: la, lng: ln } = await getCurrentCoords()
      setLat(la)
      setLng(ln)
      setGeoStatus('Location saved for matching.')
    } catch (err) {
      setGeoStatus(err?.userMessage || 'Could not read location. You can still book using area text.')
    }
  }

  async function createBookingRequest() {
    setError('')
    setToast('')

    if (!timeSlot) {
      setError('Please select an available time slot.')
      return
    }

    if (!name.trim() || !location.trim() || !issue.trim()) {
      setError('Name, location and issue are required.')
      return
    }

    setBookingLoading(true)
    try {
      const body = {
        name: name.trim(),
        location: location.trim(),
        issue: issue.trim(),
        date,
        timeSlot,
        consentAccepted: true,
      }
      if (lat != null && lng != null) {
        body.lat = lat
        body.lng = lng
      }

      const res = await api.post('/bookings', body)

      setBooking(res.data)
      setToast('Booking created. Complete payment to secure your booking amount.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  function handleBook(e) {
    e.preventDefault()
    if (!consentChecked) {
      setConsentOpen(true)
      return
    }
    createBookingRequest()
  }

  function handleConsentAccept() {
    setConsentChecked(true)
    setConsentOpen(false)
    createBookingRequest()
  }

  const physioName = booking?.physioId?.name

  const inputClass =
    'h-11 w-full rounded-lg border border-border-subtle bg-white px-4 text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-ink-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20'

  return (
    <>
      <SeoNoIndex />
      <div className="min-h-screen bg-canvas">
      <ConsentModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onAccept={handleConsentAccept}
        accepted={consentChecked}
        onToggle={setConsentChecked}
      />

      <header className="sticky top-0 z-40 border-b border-border-subtle/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Booking</p>
            <h1 className="truncate text-lg font-semibold text-ink sm:text-xl">Home visit physiotherapy</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/dashboard"
              className="interactive-press hidden h-10 items-center rounded-lg border border-border-subtle bg-white px-4 text-sm font-medium text-ink shadow-sm transition-colors duration-200 hover:bg-canvas sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              to="/"
              className="interactive-press inline-flex h-10 items-center rounded-lg border border-border-subtle bg-white px-4 text-sm font-medium text-ink shadow-sm transition-colors duration-200 hover:bg-canvas"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => logout(navigate)}
              className="interactive-press inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink/90"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="motion-safe:animate-enter-up mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {error && (
          <div
            className="motion-safe:animate-enter mb-8 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <section className="space-y-10 lg:col-span-2">
            <div className="surface-card rounded-2xl p-7 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Date & time</h2>
                  <p className="mt-1 text-sm text-ink-muted">Choose an available slot for your visit.</p>
                </div>
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="mb-2 block text-sm font-medium text-ink">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="time-slot" className="mb-2 block text-sm font-medium text-ink">
                    Time slot
                  </label>
                  {slotsLoading ? (
                    <div className="h-11 animate-pulse rounded-lg bg-canvas" aria-hidden />
                  ) : slots.filter((s) => s.available).length === 0 ? (
                    <p className="flex min-h-11 items-center rounded-lg border border-dashed border-border-subtle bg-canvas/80 px-4 text-sm text-ink-muted">
                      No slots available for this date
                    </p>
                  ) : (
                    <select
                      id="time-slot"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className={inputClass}
                      disabled={bookingLoading}
                    >
                      <option value="">Select a time</option>
                      {slots
                        .filter((s) => s.available)
                        .map((s) => (
                          <option key={s.timeSlot} value={s.timeSlot}>
                            {formatBookingTimeSlot(s.timeSlot)}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-7 sm:p-8 lg:p-10">
              <h2 className="text-lg font-semibold text-ink">Your details</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Location helps us plan your visit. A physiotherapist is assigned by our team after you book (and pay when
                required).
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-canvas"
                >
                  Use my location
                </button>
                {geoStatus && <span className="text-xs text-ink-muted">{geoStatus}</span>}
                {lat != null && lng != null && (
                  <span className="text-xs tabular-nums text-ink-muted">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                )}
              </div>

              <form onSubmit={handleBook} className="mt-8 flex flex-col gap-6">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Your name"
                    required
                    disabled={bookingLoading}
                  />
                </div>

                <div>
                  <label htmlFor="location" className="mb-2 block text-sm font-medium text-ink">
                    Location / area
                  </label>
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                    placeholder="Area, city"
                    required
                    disabled={bookingLoading}
                  />
                </div>

                <div>
                  <label htmlFor="issue" className="mb-2 block text-sm font-medium text-ink">
                    Focus area
                  </label>
                  <select
                    id="issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className={inputClass}
                    required
                    disabled={bookingLoading}
                  >
                    {ISSUE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border-subtle text-brand"
                  />
                  <span className="text-sm text-ink-muted">
                    I agree to the consent terms (tap &quot;Create booking&quot; to review full text if unchecked).
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={bookingLoading || !timeSlot}
                  className="interactive-press mt-1 flex h-11 items-center justify-center rounded-lg bg-brand text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(10,37,64,0.08)] transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLoading ? 'Creating booking…' : 'Create booking'}
                </button>
              </form>

              {toast && (
                <div className="motion-safe:animate-enter mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {toast}
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-8 lg:col-span-1">
            {booking && (
              <div className="surface-card rounded-2xl p-6 sm:p-7">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                    <dt className="text-ink-muted">Date</dt>
                    <dd className="font-medium text-ink tabular-nums">{booking.date}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                    <dt className="text-ink-muted">Time</dt>
                    <dd className="font-medium text-ink">{formatBookingTimeSlot(booking.timeSlot)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                    <dt className="text-ink-muted">Payment</dt>
                    <dd className="font-medium capitalize text-ink">{booking.paymentStatus}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-border-subtle pb-3">
                    <dt className="text-ink-muted">Session</dt>
                    <dd className="font-medium capitalize text-ink">{booking.sessionStatus || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">Booking</dt>
                    <dd className="font-medium capitalize text-ink">{booking.status}</dd>
                  </div>
                  {booking.status === 'assigned' && physioName && (
                    <div className="rounded-lg bg-canvas px-3 py-2">
                      <dt className="text-xs text-ink-muted">Assigned physio</dt>
                      <dd className="mt-0.5 font-medium text-ink">{physioName}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {booking && booking.paymentStatus === 'pending' && (
              <>
                {walletBalance > 0 ? (
                  <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-600"
                      checked={useWalletCredit}
                      onChange={(e) => setUseWalletCredit(e.target.checked)}
                    />
                    Use ₹{walletBalance.toFixed(0)} wallet credit
                  </label>
                ) : null}
                <RazorpayPayButton
                  bookingId={booking._id}
                  useWalletCredit={useWalletCredit}
                  walletBalance={walletBalance}
                  onPaid={async () => {
                    await refreshBookingById(booking._id)
                    refreshWallet()
                    setToast('Payment secured. Our team will assign a physiotherapist shortly.')
                  }}
                />
              </>
            )}

            {booking && booking.paymentStatus === 'held' && (
              <div className="surface-card rounded-2xl p-6 sm:p-7">
                <h3 className="text-sm font-semibold text-ink">Payment secured</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {booking.status === 'assigned' && physioName
                    ? 'Your payment is safely kept until your session is completed.'
                    : 'Your payment is safely kept while our team picks your physiotherapist. You will see their name here soon.'}
                </p>
                <button
                  type="button"
                  onClick={() => refreshBookingById(booking._id)}
                  className="interactive-press mt-5 flex h-10 w-full items-center justify-center rounded-lg border border-border-subtle bg-white text-sm font-medium text-ink shadow-sm transition-colors duration-200 hover:bg-canvas"
                >
                  Refresh status
                </button>
              </div>
            )}

            {booking && booking.paymentStatus === 'released' && (
              <div className="surface-card rounded-2xl p-6 sm:p-7">
                <h3 className="text-sm font-semibold text-ink">Payment released</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Platform fee and payout have been recorded (simulated).
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
    </>
  )
}
