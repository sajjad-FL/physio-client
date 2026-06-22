import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { assetUrl } from '../../utils/assetUrl'
import Skeleton from '../ui/Skeleton'
import { StarRatingDisplay } from '../reviews/StarRating'
import { SERVICE_CITIES, findCityBySlug } from '../../constants/serviceCities'
import { getCurrentCoords, getGeolocationUnavailableReason } from '../../utils/geolocation'

/**
 * Default anchor when the visitor has not shared location — we use our primary
 * service city (Guwahati) so the "featured nearby" list actually matches the
 * region the homepage markets. Coords are sourced from the shared
 * SERVICE_CITIES config so there is a single source of truth.
 */
const DEFAULT_ANCHOR_CITY = findCityBySlug('guwahati') || SERVICE_CITIES[0]
const DEFAULT_LAT = DEFAULT_ANCHOR_CITY?.lat ?? 26.1445
const DEFAULT_LNG = DEFAULT_ANCHOR_CITY?.lng ?? 91.7362
const DEFAULT_LABEL = DEFAULT_ANCHOR_CITY?.name || 'Guwahati'

function FeaturedCard({ p }) {
  const avg = Number(p.avgRating) || 0
  const total = Number(p.totalReviews) || 0
  const avatarSrc = assetUrl(p.avatar)
  const dist = p.distanceKm == null ? null : `${Number(p.distanceKm).toFixed(1)} km away`

  return (
    <Link
      to={`/physician/${p._id}`}
      className="group interactive-lift surface-card block overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-slate-100 transition-transform duration-200 group-hover:ring-teal-100">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-slate-400 sm:text-lg">
              {(p.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{p.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{p.specialization || 'Physiotherapist'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRatingDisplay value={avg} size="sm" />
            <span className="text-xs font-medium tabular-nums text-slate-500">
              {total > 0 ? `${avg.toFixed(1)} · ${total} review${total === 1 ? '' : 's'}` : 'New on platform'}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{p.experience ?? 0}+ yrs experience</span>
            {dist && <span>{dist}</span>}
          </div>
          <p className="mt-3 text-sm font-semibold text-teal-700 transition-colors group-hover:text-teal-800">
            View profile →
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedPhysiosSection() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [anchorLabel, setAnchorLabel] = useState(DEFAULT_LABEL)

  useEffect(() => {
    let cancelled = false

    async function fetchNearby(lat, lng) {
      try {
        const res = await api.get('/physios/nearby', { params: { lat, lng, limit: 3 } })
        if (cancelled) return
        setList(Array.isArray(res.data?.physios) ? res.data.physios : [])
        setFailed(false)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    /**
     * Upgrade the anchor to the visitor's real coordinates only when the
     * browser has already granted geolocation — we must not spam the homepage
     * with a permission prompt. Silently fall back to the default city anchor
     * otherwise.
     */
    async function maybeUseVisitorCoords() {
      if (getGeolocationUnavailableReason()) return null
      try {
        const perm = await navigator.permissions?.query?.({ name: 'geolocation' })
        if (!perm || perm.state !== 'granted') return null
      } catch {
        return null
      }
      try {
        const coords = await getCurrentCoords()
        if (!Number.isFinite(coords?.lat) || !Number.isFinite(coords?.lng)) return null
        return coords
      } catch {
        return null
      }
    }

    ;(async () => {
      await fetchNearby(DEFAULT_LAT, DEFAULT_LNG)
      if (!cancelled) setLoading(false)

      const visitor = await maybeUseVisitorCoords()
      if (cancelled || !visitor) return
      setAnchorLabel('your location')
      await fetchNearby(visitor.lat, visitor.lng)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="featured-physios" className="border-b border-slate-200 bg-slate-50 py-12 md:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="type-section-title text-teal-600 sm:normal-case sm:tracking-wider sm:uppercase">Featured professionals</p>
          <h2 className="type-hero mt-3 sm:font-semibold">Meet nearby physiotherapists</h2>
          <p className="type-body mt-4 text-slate-500 sm:text-lg sm:leading-relaxed">
            Verified clinicians in your area — ratings, experience, and transparent pricing. Sign in to book with your exact
            location.
          </p>
        </div>

        <div className="mt-8 md:mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {loading &&
            [1, 2, 3].map((k) => (
              <div key={k} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[60%]" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}

          {!loading && !failed && list.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <p className="text-base font-medium text-slate-800">Professionals will appear here as they join your region.</p>
              <p className="mt-2 text-sm text-slate-500">Create an account and search from the booking flow for live availability.</p>
              <Link
                to="/book"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
              >
                Start booking
              </Link>
            </div>
          )}

          {!loading && failed && (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
              We couldn&apos;t load featured profiles right now.{' '}
              <Link to="/book" className="font-semibold text-teal-700 hover:underline">
                Try the booking page
              </Link>{' '}
              after signing in.
            </div>
          )}

          {!loading &&
            list.map((p) => (
              <FeaturedCard key={p._id} p={p} />
            ))}
        </div>

        {!loading && list.length > 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">
            Showing physiotherapists near {anchorLabel}.{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">
              Sign in
            </Link>{' '}
            to see physios matched to your exact address.
          </p>
        )}
      </div>
    </section>
  )
}
