import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { assetUrl } from '../../utils/assetUrl'
import Skeleton from '../ui/Skeleton'
import { StarRatingDisplay } from '../reviews/StarRating'

/** Demo anchor for “featured” list when user has not shared location (bookable physios near a major hub). */
const DEMO_LAT = 12.9716
const DEMO_LNG = 77.5946

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
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
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

  useEffect(() => {
    let cancelled = false
    api
      .get('/physios/nearby', { params: { lat: DEMO_LAT, lng: DEMO_LNG, limit: 3 } })
      .then((res) => {
        if (!cancelled) setList(Array.isArray(res.data?.physios) ? res.data.physios : [])
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="featured-physios" className="border-b border-slate-200 bg-slate-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Featured professionals</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Meet nearby physiotherapists</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Verified clinicians in your area — ratings, experience, and transparent pricing. Sign in to book with your exact
            location.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
            Showing sample listings near a demo hub.{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:underline">
              Sign in
            </Link>{' '}
            to see physios matched to your address.
          </p>
        )}
      </div>
    </section>
  )
}
