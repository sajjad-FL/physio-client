import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import { ISSUE_OPTIONS, ISSUE_OTHER_SENTINEL, ISSUE_OTHER_VALUE } from '../constants/issues'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import BookingSummaryBar from '../components/booking/BookingSummaryBar'
import LocationAutocomplete from '../components/booking/LocationAutocomplete'
import PhysioCard from '../components/booking/PhysioCard'
import LocationPickerModal from '../components/location/LocationPickerModal'
import { formatBookingTimeSlot } from '../utils/date'
import { loadRazorpayCheckout } from '../utils/loadRazorpayCheckout'
import { buildRazorpayPrefill } from '../utils/razorpayPrefill'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'
import { getCurrentCoords } from '../utils/geolocation'
import SeoNoIndex from '../components/seo/SeoNoIndex'
import WhatsAppSupportFab from '../components/support/WhatsAppSupportFab'
import FieldLabel, { RequiredMark } from '../components/ui/FieldLabel'
import ListSkeleton from '../components/ui/skeletons/ListSkeleton'
import { useReferralMyCode } from '../hooks/useReferral'
import { todayISO, defaultBookableDate, filterSelectableSlots } from '../constants/slots'

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
  const [profilePhone, setProfilePhone] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)

  const [location, setLocation] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)

  const [date, setDate] = useState(defaultBookableDate)
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
  const [availablePhysios, setAvailablePhysios] = useState([])
  const [selectedPhysioId, setSelectedPhysioId] = useState('')
  const [physioPickerOpen, setPhysioPickerOpen] = useState(false)
  const [physioLoading, setPhysioLoading] = useState(false)

  const [loadingBooking, setLoadingBooking] = useState(false)
  const [useWalletCredit, setUseWalletCredit] = useState(false)
  const { walletBalance } = useReferralMyCode()

  useEffect(() => {
    let c = false
    setProfileLoading(true)
    api
      .get('/profile')
      .then((res) => {
        if (c) return
        const d = res.data
        setProfileName((d?.name || '').trim())
        setProfilePhone(String(d?.phone ?? '').trim())
        setProfileEmail(String(d?.email ?? '').trim())
        const addr = d?.address
        if (addr?.text?.trim() && Number.isFinite(addr.lat) && Number.isFinite(addr.lng)) {
          setLocation(addr.text.trim())
          setLat(addr.lat)
          setLng(addr.lng)
        }
      })
      .catch(() => {
        if (!c) {
          setProfileName('')
          setProfilePhone('')
          setProfileEmail('')
        }
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
    const selectedIssue = routerLocation.state?.selectedIssue
    if (selectedIssue) {
      if (ISSUE_OPTIONS.includes(selectedIssue)) {
        setIssue(selectedIssue)
      } else if (selectedIssue === ISSUE_OTHER_SENTINEL) {
        setIssue(ISSUE_OTHER_VALUE)
      } else {
        setIssue(ISSUE_OTHER_VALUE)
        setIssueOther(selectedIssue)
      }
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
    try {
      const { lat: la, lng: ln } = await getCurrentCoords()
      setLat(la)
      setLng(ln)
      const rev = await mapboxReverseGeocode(la, ln)
      setLocation(rev || 'Current location')
      toast.success('Location captured')
    } catch (err) {
      toast.error(err?.userMessage || 'Could not read your location.')
    } finally {
      setGeoBusy(false)
    }
  }

  const canSubmit = useMemo(
    () =>
      Boolean(
        profileName &&
          location.trim() &&
          resolvedIssue &&
          date &&
          timeSlot &&
          issueOk &&
          (serviceType === 'home' || selectedPhysioId),
      ),
    [profileName, location, resolvedIssue, date, timeSlot, issueOk, serviceType, selectedPhysioId],
  )

  const selectedPhysio = useMemo(
    () => availablePhysios.find((p) => String(p._id) === String(selectedPhysioId)) || null,
    [availablePhysios, selectedPhysioId],
  )

  useEffect(() => {
    if (serviceType !== 'online') return
    if (lat == null || lng == null) return
    let cancelled = false
    async function loadNearby() {
      setPhysioLoading(true)
      try {
        const res = await api.get('/physios/nearby', {
          params: { lat, lng, limit: 12 },
        })
        if (cancelled) return
        const list = res.data?.physios || []
        setAvailablePhysios(list)
        if (list.length === 0) {
          setSelectedPhysioId('')
          return
        }
        // Require explicit user choice — do not auto-pick the first physio.
        if (!list.some((p) => String(p._id) === String(selectedPhysioId))) {
          setSelectedPhysioId('')
        }
      } catch {
        if (cancelled) return
        setAvailablePhysios([])
        setSelectedPhysioId('')
      } finally {
        if (!cancelled) setPhysioLoading(false)
      }
    }
    loadNearby()
    return () => {
      cancelled = true
    }
  }, [serviceType, lat, lng])

  useEffect(() => {
    if (serviceType !== 'home') return
    setSelectedPhysioId('')
  }, [serviceType])

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

      if (serviceType === 'home') {
        const homeRes = await api.post('/bookings/request-home', body)
        toast.success('Home request received. Our team will assign a physiotherapist and your physiotherapist will propose a plan.')
        const homeId = homeRes.data?._id
        if (homeId) {
          navigate(`/dashboard/bookings/${homeId}`, { replace: true })
        } else {
          navigate('/dashboard/bookings', { replace: true })
        }
        return
      }

      const startRes = await api.post('/bookings/online-checkout/start', {
        ...body,
        physioId: selectedPhysioId,
        ...(useWalletCredit && walletBalance > 0 ? { useWalletCredit: true } : {}),
      })
      const { checkoutSessionId, orderId, amount, currency, keyId, prefill: prefillFromServer } =
        startRes.data || {}
      if (!checkoutSessionId || !orderId || !keyId) {
        toast.error('Could not start payment. Please try again.')
        return
      }

      await loadRazorpayCheckout()

      const orderIdStr = String(orderId)
      const amountPaise = Number(amount)
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        toast.error('Invalid payment amount from server. Check admin pricing settings or Razorpay config.')
        return
      }

      await new Promise((resolve) => {
        const options = {
          key: String(keyId),
          amount: amountPaise,
          currency: currency || 'INR',
          name: 'PhysiOkhom',
          description: 'Online consultation',
          order_id: orderIdStr,
          modal: {
            ondismiss: () => {
              setLoadingBooking(false)
              resolve()
            },
          },
          handler: async function (response) {
            try {
              const oid = response?.razorpay_order_id
              const pid = response?.razorpay_payment_id
              const sig = response?.razorpay_signature
              if (!oid || !pid || !sig) {
                toast.error(
                  'Checkout did not return payment details. Use Razorpay test mode success (e.g. card 4111 1111 1111 1111) and ensure Key ID is rzp_test_ with matching test secret.',
                )
                setLoadingBooking(false)
                resolve()
                return
              }
              const done = await api.post('/bookings/online-checkout/complete', {
                checkoutSessionId: String(checkoutSessionId),
                razorpay_order_id: oid,
                razorpay_payment_id: pid,
                razorpay_signature: sig,
              })
              const id = done.data?._id
              toast.success('Payment successful. Your consultation is confirmed.')
              setLoadingBooking(false)
              if (id) navigate(`/dashboard/bookings/${id}`, { replace: true })
              resolve()
            } catch (e) {
              setLoadingBooking(false)
              toast.error(e.response?.data?.message || e.message || 'Could not confirm payment')
              resolve()
            }
          },
          theme: { color: '#635bff' },
          prefill: buildRazorpayPrefill(
            prefillFromServer && (prefillFromServer.phone || prefillFromServer.name || prefillFromServer.email)
              ? prefillFromServer
              : { name: profileName, phone: profilePhone, email: profileEmail },
          ),
        }
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', () => {
          setLoadingBooking(false)
          toast.error('Payment was not completed')
          resolve()
        })
        rzp.open()
      })
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Could not create booking')
    } finally {
      setLoadingBooking(false)
    }
  }

  return (
    <>
      <SeoNoIndex />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 pb-44">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <h1 className="type-page-title text-gray-900">Book an appointment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose when and where — our team will pick a physiotherapist for you after booking.
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
            Add your name
            <RequiredMark /> in{' '}
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
                <FieldLabel required={true} className={label}>
                  Location
                </FieldLabel>
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
              <FieldLabel htmlFor="bk-date" required={true} className={label}>
                Date
              </FieldLabel>
              <Input
                id="bk-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div>
              <FieldLabel htmlFor="bk-slot" required={true} className={label}>
                Slot
              </FieldLabel>
              <select
                id="bk-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a time</option>
                {filterSelectableSlots(slots, date).map((s) => (
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
                Online Consultation
              </button>
            </div>
          </div>
        </StepShell>

        <StepShell step={3} title="What do you need help with?" locked={!dateSlotOk}>
          <div>
            <FieldLabel htmlFor="bk-issue" required={true} className={label}>
              Issue
            </FieldLabel>
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
                <FieldLabel htmlFor="bk-issue-other" required={true} className={label}>
                  Describe your condition
                </FieldLabel>
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
          title={serviceType === 'online' ? 'Choose your physiotherapist' : 'How matching works'}
          subtitle={
            serviceType === 'online'
              ? 'For online consultation, pick a registered physiotherapist before confirming.'
              : 'You do not need to choose a physiotherapist — our team picks the best match.'
          }
          locked={!issueOk}
        >
          {serviceType === 'online' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPhysioPickerOpen(true)}
                className="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-left transition hover:border-blue-400 hover:bg-blue-100/50"
              >
                <p className="text-sm font-semibold text-blue-900">
                  {selectedPhysio ? selectedPhysio.name : 'Select registered physiotherapist'}
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  {selectedPhysio
                    ? `${selectedPhysio.specialization || 'Physiotherapy'}${selectedPhysio.location ? ` · ${selectedPhysio.location}` : ''}`
                    : 'Open list and choose who you want to consult with.'}
                </p>
              </button>
              {!selectedPhysio && (
                <p className="text-xs font-medium text-amber-700">
                  Please select a physiotherapist for online consultation.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-5 text-sm text-gray-800">
              <p className="font-medium text-gray-900">How it works</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
                <li>Confirm your booking below (and pay for online sessions).</li>
                <li>Our admin team picks a verified physiotherapist for your slot.</li>
                <li>You&apos;ll see their name and contact in your booking once matched.</li>
              </ul>
            </div>
          )}
        </StepShell>

      </div>

      {walletBalance > 0 && serviceType === 'online' ? (
        <div className="mx-auto mb-24 max-w-4xl rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={useWalletCredit}
              onChange={(e) => setUseWalletCredit(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              Use ₹{walletBalance.toFixed(0)} wallet credit at checkout
            </span>
          </label>
        </div>
      ) : null}

      <BookingSummaryBar
        selectedPhysio={serviceType === 'online' ? selectedPhysio : null}
        date={date}
        timeSlot={timeSlot}
        serviceType={serviceType}
        canSubmit={canSubmit && !profileLoading}
        loading={loadingBooking}
        onConfirm={createBooking}
        onlinePaymentHint={
          serviceType === 'online' && import.meta.env.DEV
            ? 'Razorpay test mode: open Cards and use 4111 1111 1111 1111 (any CVV, future expiry). UPI QR needs Razorpay’s test UPI steps — see their Standard Checkout test integration guide.'
            : undefined
        }
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

      {physioPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setPhysioPickerOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Select physiotherapist</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose a registered physiotherapist for online consultation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPhysioPickerOpen(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-4 py-4 sm:px-6">
              {physioLoading ? (
                <ListSkeleton count={4} />
              ) : availablePhysios.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No registered physiotherapists found for your location. Try changing location.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availablePhysios.map((p) => (
                    <PhysioCard
                      key={p._id}
                      physio={p}
                      selected={String(selectedPhysioId) === String(p._id)}
                      onSelect={() => setSelectedPhysioId(String(p._id))}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setPhysioPickerOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!selectedPhysioId}
                  onClick={() => setPhysioPickerOpen(false)}
                  className="rounded-xl"
                >
                  Use selected physiotherapist
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <WhatsAppSupportFab />
    </div>
    </>
  )
}
