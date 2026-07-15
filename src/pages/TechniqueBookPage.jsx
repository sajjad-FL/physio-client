import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
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
import FieldLabel, { RequiredMark } from '../components/ui/FieldLabel'
import Skeleton from '../components/ui/Skeleton'
import { todayISO, defaultBookableDate, filterSelectableSlots } from '../constants/slots'
import { formatBookingTimeSlot } from '../utils/date'
import { getCurrentCoords } from '../utils/geolocation'
import { mapboxReverseGeocode } from '../utils/mapboxGeocode'

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
  const [editingLocation, setEditingLocation] = useState(false)
  const [geoBusy, setGeoBusy] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [date, setDate] = useState(defaultBookableDate)
  const [timeSlot, setTimeSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const price = Number(settings?.techniquePrices?.[tech?.bookingIssue])
  const priceLabel = Number.isFinite(price) && price > 0 ? `₹${price.toLocaleString('en-IN')}` : '—'
  const hasLocation = Boolean(location.trim())
  const showLocationEditor = editingLocation || !hasLocation

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [slug])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/profile')
        if (cancelled) return
        setProfileName(res.data?.name || '')
        const addr = res.data?.address
        const text = String(addr?.text || '').trim()
        if (text) {
          setLocation(text)
          setEditingLocation(false)
          if (Number.isFinite(addr?.lat) && Number.isFinite(addr?.lng)) {
            setLat(addr.lat)
            setLng(addr.lng)
          }
        } else {
          setEditingLocation(true)
        }
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

  const selectableSlots = useMemo(() => filterSelectableSlots(slots, date), [slots, date])

  const canSubmit = useMemo(
    () =>
      Boolean(profileName?.trim() && location.trim() && date && timeSlot && consentAccepted && tech && !profileLoading),
    [profileName, location, date, timeSlot, consentAccepted, tech, profileLoading],
  )

  async function useMyLocation() {
    setGeoBusy(true)
    try {
      const coords = await getCurrentCoords()
      setLat(coords.lat)
      setLng(coords.lng)
      const place = await mapboxReverseGeocode(coords.lat, coords.lng)
      if (place) {
        setLocation(place)
        setEditingLocation(false)
      }
    } catch (e) {
      toast.error(e.message || 'Could not get location')
    } finally {
      setGeoBusy(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit || !tech) return
    if (!profileName.trim()) {
      toast.error('Add your name in Profile before booking')
      return
    }
    if (!location.trim()) {
      toast.error('Add a home address to continue')
      setEditingLocation(true)
      return
    }
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
          className="mb-2 inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← {tech.label}
        </Link>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Book {tech.label}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Home visit · {priceLabel} · physio assigned after booking
          </p>
          {profileLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
          ) : profileName.trim() ? (
            <p className="mt-3 text-sm text-slate-700">
              Booking as <span className="font-semibold text-slate-900">{profileName.trim()}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-amber-800">
              Name missing.{' '}
              <Link to="/profile" className="font-semibold text-teal-700 underline underline-offset-2">
                Complete your profile
              </Link>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <FieldLabel required={true} className={labelCls}>
              Home address
            </FieldLabel>
            {hasLocation && !editingLocation ? (
              <button
                type="button"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                onClick={() => setEditingLocation(true)}
              >
                Change
              </button>
            ) : null}
            {hasLocation && editingLocation ? (
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => setEditingLocation(false)}
              >
                Done
              </button>
            ) : null}
          </div>

          {!showLocationEditor ? (
            <p className="text-sm leading-relaxed text-slate-800">{location}</p>
          ) : (
            <>
              {!hasLocation ? (
                <p className="mb-2 text-xs text-amber-800">Add your home address to continue booking.</p>
              ) : null}
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                onPlaceResolved={(place) => {
                  if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
                    setLat(place.lat)
                    setLng(place.lng)
                    if (place.label || place.text) {
                      setLocation(String(place.label || place.text))
                    }
                    setEditingLocation(false)
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
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <FieldLabel required={true} className={labelCls}>
            Date
          </FieldLabel>
          <Input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} required />
          <FieldLabel required={true} className={`${labelCls} mt-4`}>
            Time slot
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {selectableSlots.map((s) => (
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
          {selectableSlots.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              {date === todayISO()
                ? 'No slots left today — visits need at least 2 hours’ notice. Pick tomorrow or a later date.'
                : 'No slots for this date — try another day.'}
            </p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
          />
          <span>
            I consent to a physiotherapist visiting my home for this treatment session.
            <RequiredMark />
          </span>
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
          setEditingLocation(false)
          setLocationModalOpen(false)
        }}
        showSaveDefault={false}
      />
    </div>
  )
}
