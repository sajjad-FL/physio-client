import { Link } from 'react-router-dom'
import { assetUrl } from '../../../utils/assetUrl'
import { openWhatsApp, callPhone } from '../../../utils/physioContact'
import { StarRatingDisplay } from '../../reviews/StarRating'

export default function PatientPhysioCard({ physio }) {
  if (!physio || typeof physio !== 'object') return null

  const avatar = assetUrl(physio.avatar)
  const avg = Number(physio.avgRating) || 0
  const total = Number(physio.totalReviews) || 0
  const experience = Number.isFinite(Number(physio.experience)) ? `${Number(physio.experience)}+ yrs experience` : null
  const distance = Number.isFinite(Number(physio.distanceKm)) ? `${Number(physio.distanceKm).toFixed(1)} km away` : null

  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-slate-500 sm:text-lg">
              {(physio.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="type-page-title truncate text-slate-900">{physio.name || 'Physiotherapist'}</h3>
          {physio.specialization ? <p className="truncate text-sm text-slate-500">{physio.specialization}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRatingDisplay value={avg} size="sm" />
            <span className="text-sm text-slate-600">
              {total > 0 ? `${avg.toFixed(1)} · ${total} review${total === 1 ? '' : 's'}` : 'New on platform'}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
            {experience ? <span>{experience}</span> : null}
            {distance ? <span>{distance}</span> : null}
          </div>
          {physio.phone ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => callPhone(physio.phone)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
              >
                Call
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp(physio.phone)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                WhatsApp
              </button>
            </div>
          ) : null}
          <div className="mt-2.5">
            <Link
              to={`/physician/${String(physio._id)}`}
              className="text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              View profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
