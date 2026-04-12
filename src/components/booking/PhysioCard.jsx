import { memo } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'
import VerificationBadge from '../physio/VerificationBadge'
import { StarRatingDisplay } from '../reviews/StarRating'
import { assetUrl } from '../../utils/assetUrl'

function PhysioCard({ physio: p, selected, onSelect }) {
  const dist =
    p.distanceKm == null ? '—' : `${Number(p.distanceKm).toFixed(1)} km`
  const avg = Number(p.avgRating) || 0
  const total = Number(p.totalReviews) || 0
  const avatarSrc = assetUrl(p.avatar)

  return (
    <Card
      hover={!selected}
      role="button"
      tabIndex={0}
      onClick={() => onSelect()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={[
        'group border transition-all duration-300 ease-out motion-safe:hover:scale-[1.01]',
        selected
          ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/25 shadow-md'
          : 'border-slate-100 bg-white hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg',
      ].join(' ')}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-2 ring-slate-100 transition-transform duration-200 motion-safe:group-hover:scale-105">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-400">
                {(p.name || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-slate-900">{p.name}</h3>
                {p.specialization ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{p.specialization}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StarRatingDisplay value={avg} size="sm" />
                  <span className="text-xs font-medium tabular-nums text-gray-600">
                    {total > 0 ? `${avg.toFixed(1)} · ${total} review${total === 1 ? '' : 's'}` : 'No reviews yet'}
                  </span>
                </div>
                {p.verificationBadgeLevel ? (
                  <div className="mt-1.5">
                    <VerificationBadge level={p.verificationBadgeLevel} className="!text-[10px]" />
                  </div>
                ) : null}
              </div>
              <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">₹{p.pricePerSession ?? 0}</p>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Experience</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{p.experience ?? 0} yrs</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Distance</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{dist}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            to={`/physician/${p._id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-center text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
          >
            View profile & reviews
          </Link>
          <Button
            type="button"
            variant={selected ? 'success' : 'primary'}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-transform duration-200 active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default memo(PhysioCard)
