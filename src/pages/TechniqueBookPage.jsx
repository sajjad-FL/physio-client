import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../config/api'
import { getTechniqueBySlug } from '../constants/techniques'
import { usePricingSettings } from '../hooks/usePricingSettings'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LocationAutocomplete from '../components/booking/LocationAutocomplete'
import LocationPickerModal from '../components/location/LocationPickerModal'
import SeoNoIndex from '../components/seo/SeoNoIndex'
import { formatBookingTimeSlot } from '../utils/date'
import { getCurrentCoords } from '../utils/geolocation'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const labelCls = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500'

export default function TechniqueBookPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const tech = getTechniqueBySlug(slug)
  const { settings } = usePricingSettings()

  const [profileName, setProfileName] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [location, setLocation] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [timeSlot, setTimeSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const price = Number(settings?.techniquePrices?.[tech?.bookingIssue])
  const priceLabel = Number.isFinite(price) && price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/auth/me')
        if (cancelled) return
        setProfileName(res.data?.name || '')
        if (res.data?.location) setLocation(res.data.location)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/slots', { params: { date } })
        if (!cancelled) {
          setSlots(res.data?.slots || [])
          setTimeSlot('')
        }
      } catch {
        if (!cancelled) setSlots([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [date])

  const canSubmit = useMemo(
    () =>
      Boolean(profileName?.trim() && location.trim() && date && timeSlot && consentAccepted && tech),
    [profileName, location, date, timeSlot, consentAccepted, tech],
  )

  async function useMyLocation() {
    setGeoBusy(true)
    try {
      const coords = await getCurrentCoords()
      setLat(coords.lat)
      setLng(coords.lng)
      const place = await mapboxReverseGeocode(coords.lat, coords.lng)
      if (place) setLocation(place)
    } catch (e) {
      toast.error(e.message || 'Could not get location')
    } finally {
      setGeoBusy(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit || !tech) return
    setSubmitting(true)
    try {
      const body = {
        name: profileName.trim(),
        location: location.trim(),
        issue: tech.bookingIssue,
        date,
        timeSlot,
        consentAccepted: true,
      }
      if (lat != null && lng != null) {
        body.lat = lat
        body.lng = lng
      }
      const res = await api.post('/bookings/request-technique', body)
      const managed = res.data?.carePath === 'technique_managed'
      toast.success(
        managed
          ? 'Booking received. Your care manager will assign a physiotherapist.'
          : 'Booking received. We will assign a physiotherapist for your home visit.',
      )
      const id = res.data?._id
      if (id) navigate(`/dashboard/bookings/${id}`, { replace: true })
      else navigate('/dashboard/bookings', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (!tech) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <SeoNoIndex />
        <p className="text-sm text-slate-600">Technique not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-teal-700">
          ← Back
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeoNoIndex />
      <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-28">
        <Link
          to={`/techniques/${tech.slug}`}
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← {tech.label}
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Book {tech.label}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Home visit · {priceLabel} · physio assigned after booking
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className={labelCls}>Your name</label>
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            disabled={profileLoading}
            required
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className={labelCls}>Home address</label>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            onPlaceResolved={(place) => {
              if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
                setLat(place.lat)
                setLng(place.lng)
              } else {
                setLat(null)
                setLng(null)
              }
            }}
            disabled={geoBusy}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={geoBusy} onClick={useMyLocation}>
              {geoBusy ? 'Locating…' : 'Use my location'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocationModalOpen(true)}>
              Pick on map
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className={labelCls}>Date</label>
          <Input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} required />
          <label className={`${labelCls} mt-4`}>Time slot</label>
          <div className="flex flex-wrap gap-2">
            {(slots || [])
              .filter((s) => s.available !== false)
              .map((s) => (
                <button
                  key={s.timeSlot}
                  type="button"
                  onClick={() => setTimeSlot(s.timeSlot)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                    timeSlot === s.timeSlot
                      ? 'bg-teal-600 text-white ring-teal-600'
                      : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {formatBookingTimeSlot(s.timeSlot)}
                </button>
              ))}
          </div>
          {slots.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No slots for this date — try another day.</p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
          />
          <span>I consent to a physiotherapist visiting my home for this treatment session.</span>
        </label>

        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-lg">
            <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
              {submitting ? 'Booking…' : `Confirm · ${priceLabel}`}
            </Button>
          </div>
        </div>
      </form>

      <LocationPickerModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        initial={{ text: location, lat, lng }}
        onConfirm={({ text, lat: nextLat, lng: nextLng }) => {
          setLocation(text)
          setLat(nextLat)
          setLng(nextLng)
          setLocationModalOpen(false)
        }}
        showSaveDefault={false}
      />
    </div>
  )
}
