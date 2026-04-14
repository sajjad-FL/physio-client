import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import { ISSUE_OPTIONS, ISSUE_OTHER_VALUE } from '../constants/issues'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import RazorpayPayButton from '../components/RazorpayPayButton'
import BookingSummaryBar from '../components/booking/BookingSummaryBar'
import LocationAutocomplete from '../components/booking/LocationAutocomplete'
import LocationPickerModal from '../components/location/LocationPickerModal'
import { formatBookingDateAndSlot, formatBookingTimeSlot } from '../utils/date'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const label = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500'

function StepShell({ step, title, subtitle, children, locked }) {
  return (
    <section
      className={[
        'rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 sm:p-6',
        locked ? 'border-gray-100 opacity-55' : 'border-gray-200/80',
      ].join(' ')}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            locked ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white',
          ].join(' ')}
        >
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className={locked ? 'pointer-events-none' : ''}>{children}</div>
    </section>
  )
}

export default function PhysioListPage() {
  const navigate = useNavigate()
  const routerLocation = useLocation()

  const [profileName, setProfileName] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)

  const [location, setLocation] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)

  const [date, setDate] = useState(todayISO())
  const [timeSlot, setTimeSlot] = useState('')
  const [serviceType, setServiceType] = useState('home')

  /** Dropdown value (may be `ISSUE_OTHER_VALUE`). */
  const [issue, setIssue] = useState('')
  /** Free text when “Other” is selected; combined into `issue` sent to API. */
  const [issueOther, setIssueOther] = useState('')

  const resolvedIssue = useMemo(() => {
    if (!issue) return ''
    if (issue === ISSUE_OTHER_VALUE) return issueOther.trim()
    return issue.trim()
  }, [issue, issueOther])

  const [slots, setSlots] = useState([])
  /** Set after successful online booking (home bookings redirect away). */
  const [booking, setBooking] = useState(null)

  const [loadingBooking, setLoadingBooking] = useState(false)

  useEffect(() => {
    let c = false
    setProfileLoading(true)
    api
      .get('/profile')
      .then((res) => {
        if (c) return
        const d = res.data
        setProfileName((d?.name || '').trim())
        const addr = d?.address
        if (addr?.text?.trim() && Number.isFinite(addr.lat) && Number.isFinite(addr.lng)) {
          setLocation(addr.text.trim())
          setLat(addr.lat)
          setLng(addr.lng)
        }
      })
      .catch(() => {
        if (!c) setProfileName('')
      })
      .finally(() => {
        if (!c) setProfileLoading(false)
      })
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadSlots() {
      try {
        const res = await api.get('/slots', { params: { date } })
        if (!cancelled) {
          setSlots(res.data?.slots || [])
          setTimeSlot('')
        }
      } catch {
        if (!cancelled) setSlots([])
      }
    }
    loadSlots()
    return () => {
      cancelled = true
    }
  }, [date])

  useEffect(() => {
    const userCoords = routerLocation.state?.userCoords
    if (userCoords?.lat != null && userCoords?.lng != null) {
      setLat(Number(userCoords.lat))
      setLng(Number(userCoords.lng))
      setLocation((prev) => prev || 'Location from map')
    }
  }, [routerLocation.state])

  const locOk = lat != null && lng != null && location.trim().length > 0
  const dateSlotOk = locOk && Boolean(date && timeSlot)
  const issueOk = Boolean(
    resolvedIssue &&
      (issue !== ISSUE_OTHER_VALUE || issueOther.trim().length >= 2),
  )

  function handlePlaceResolved(place) {
    if (place && place.lat != null && place.lng != null) {
      setLat(place.lat)
      setLng(place.lng)
    } else {
      setLat(null)
      setLng(null)
    }
  }

  async function requestLocation() {
    setGeoBusy(true)
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser.')
      setGeoBusy(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude
        const ln = pos.coords.longitude
        setLat(la)
        setLng(ln)
        const rev = await mapboxReverseGeocode(la, ln)
        setLocation(rev || 'Current location')
        setGeoBusy(false)
        toast.success('Location captured')
      },
      () => {
        toast.error('Could not read your location.')
        setGeoBusy(false)
      },
      { enableHighAccuracy: false, timeout: 12000 }
    )
  }

  const canSubmit = useMemo(
    () => Boolean(profileName && location.trim() && resolvedIssue && date && timeSlot && issueOk),
    [profileName, location, resolvedIssue, date, timeSlot, issueOk],
  )

  async function createBooking() {
    if (!canSubmit) return
    setLoadingBooking(true)
    try {
      const body = {
        name: profileName,
        location: location.trim(),
        issue: resolvedIssue,
        date,
        timeSlot,
        consentAccepted: true,
      }
      if (lat != null && lng != null) {
        body.lat = lat
        body.lng = lng
      }
      const res = await (serviceType === 'home'
        ? api.post('/bookings/request-home', body)
        : api.post('/bookings', { ...body, serviceType: 'online' }))

      if (serviceType === 'home') {
        toast.success('Home request received. Our team will assign a physiotherapist and your physio will propose a plan.')
        navigate('/dashboard', { replace: true })
      } else {
        setBooking(res.data)
        toast.success('Booking created. Complete payment to confirm — we will assign your physiotherapist.')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not create booking')
    } finally {
      setLoadingBooking(false)
    }
  }

  async function refreshBooking() {
    if (!booking?._id) return
    const res = await api.get(`/bookings/${booking._id}`)
    setBooking(res.data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 pb-44">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Book a session</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose when and where — a physiotherapist is assigned by our team after you book.
            </p>
          </div>
          <Link
            to="/dashboard/bookings"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
          >
            My bookings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        {!profileLoading && !profileName && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Add your name in{' '}
            <Link to="/dashboard/profile" className="font-semibold text-amber-900 underline">
              Profile
            </Link>{' '}
            before confirming a booking.
          </div>
        )}

        <StepShell
          step={1}
          title="Where are you?"
          subtitle="We use your saved address when available — change anytime for this booking only."
          locked={false}
        >
          {locOk ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{location}</p>
                <p className="mt-1 text-xs text-gray-500 tabular-nums">
                  {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 rounded-xl"
                  onClick={() => setLocationModalOpen(true)}
                >
                  Change location
                </Button>
              </div>
              <p className="text-xs font-medium text-emerald-700">Location set ✓</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className={label}>Search</span>
                <LocationAutocomplete
                  value={location}
                  onChange={(v) => setLocation(v)}
                  onPlaceResolved={handlePlaceResolved}
                  disabled={geoBusy}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Button type="button" variant="outline" className="rounded-xl" disabled={geoBusy} onClick={requestLocation}>
                  {geoBusy ? 'Locating…' : 'Use my location'}
                </Button>
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-blue-600 hover:text-blue-800"
                  onClick={() => setLocationModalOpen(true)}
                >
                  Search on map or pick manually
                </button>
              </div>
            </div>
          )}
        </StepShell>

        <StepShell
          step={2}
          title="When works for you?"
          subtitle="Pick a date and an available slot."
          locked={!locOk}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-date" className={label}>
                Date
              </label>
              <Input
                id="bk-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div>
              <label htmlFor="bk-slot" className={label}>
                Slot
              </label>
              <select
                id="bk-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
            </div>
          </div>
          <div className="mt-4">
            <span className={label}>Service</span>
            <div className="mt-1 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  serviceType === 'home' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
                }`}
                onClick={() => setServiceType('home')}
              >
                Home visit
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  serviceType === 'online' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'
                }`}
                onClick={() => setServiceType('online')}
              >
                Online
              </button>
            </div>
          </div>
        </StepShell>

        <StepShell step={3} title="What do you need help with?" locked={!dateSlotOk}>
          <div>
            <label htmlFor="bk-issue" className={label}>
              Issue
            </label>
            <select
              id="bk-issue"
              value={issue}
              onChange={(e) => {
                const v = e.target.value
                setIssue(v)
                if (v !== ISSUE_OTHER_VALUE) setIssueOther('')
              }}
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select your concern</option>
              {ISSUE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value={ISSUE_OTHER_VALUE}>Other</option>
            </select>
            {issue === ISSUE_OTHER_VALUE && (
              <div className="mt-3">
                <label htmlFor="bk-issue-other" className={label}>
                  Describe your condition
                </label>
                <Input
                  id="bk-issue-other"
                  value={issueOther}
                  onChange={(e) => setIssueOther(e.target.value)}
                  placeholder="e.g. Sports injury, shoulder stiffness…"
                  className="mt-1"
                />
                {issue === ISSUE_OTHER_VALUE && issueOther.trim().length === 1 ? (
                  <p className="mt-1 text-xs text-amber-700">Enter at least 2 characters.</p>
                ) : null}
              </div>
            )}
          </div>
        </StepShell>

        <StepShell
          step={4}
          title="Assignment"
          subtitle="You do not pick a physiotherapist here — our team assigns the best match."
          locked={!issueOk}
        >
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-5 text-sm text-gray-800">
            <p className="font-medium text-gray-900">How it works</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>Confirm your booking below (and pay for online sessions).</li>
              <li>An administrator assigns a verified physiotherapist for your slot.</li>
              <li>You&apos;ll see their name and contact in your booking once assigned.</li>
            </ul>
          </div>
        </StepShell>

        {booking && booking.serviceType === 'online' && (
          <Card hover={false} className="border-blue-100 bg-blue-50/50">
            <h3 className="font-semibold text-gray-900">Booking created</h3>
            <p className="mt-2 text-sm text-gray-600">
              Online consultation · {formatBookingDateAndSlot(booking.date, booking.timeSlot)}
            </p>
            <p className="mt-1 text-sm text-gray-600">Payment: {booking.paymentStatus}</p>
            {booking.paymentStatus === 'pending' && (
              <div className="mt-4">
                <RazorpayPayButton bookingId={booking._id} onPaid={refreshBooking} />
              </div>
            )}
          </Card>
        )}
      </div>

      <BookingSummaryBar
        selectedPhysio={null}
        date={date}
        timeSlot={timeSlot}
        serviceType={serviceType}
        canSubmit={canSubmit && !profileLoading}
        loading={loadingBooking}
        onConfirm={createBooking}
      />

      <LocationPickerModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        initial={{ text: location, lat, lng }}
        onConfirm={({ text, lat: nextLat, lng: nextLng }) => {
          setLocation(text)
          setLat(nextLat)
          setLng(nextLng)
        }}
      />
    </div>
  )
}
