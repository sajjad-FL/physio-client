import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { distanceKm, parseLatLng } from '../../utils/geoDistance'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

const RADIUS_OPTIONS = [
  { value: 'any', label: 'Any distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
]

const RATING_OPTIONS = [
  { value: '0', label: 'Any rating' },
  { value: '3', label: '3+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '4.5', label: '4.5+ stars' },
]

const EXP_OPTIONS = [
  { value: '0', label: 'Any experience' },
  { value: '2', label: '2+ years' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
]

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
]

const selectClass =
  'min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

function StarRow({ rating, count, compact }) {
  const r = Number(rating)
  const safe = Number.isFinite(r) ? Math.min(5, Math.max(0, r)) : 0
  const full = Math.round(safe)
  const empty = Math.max(0, 5 - full)
  const textSm = compact ? 'text-[11px]' : 'text-sm'
  const textXs = compact ? 'text-[10px]' : 'text-xs'
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className={`${textSm} leading-none text-amber-400`} aria-hidden>
        {'★'.repeat(full)}
        <span className="text-slate-200">{'★'.repeat(empty)}</span>
      </span>
      <span className={`${textXs} font-medium tabular-nums text-slate-600`}>
        {safe > 0 ? safe.toFixed(1) : 'No rating'}
        {count > 0 && <span className="font-normal text-slate-400"> ({count})</span>}
      </span>
    </div>
  )
}

export default function AdminAssignPhysioModal({
  open,
  onClose,
  physios,
  patientCoords: patientCoordsRaw,
  selectedId,
  onConfirmSelect,
  profileTo,
}) {
  const [search, setSearch] = useState('')
  const [draftId, setDraftId] = useState(selectedId || '')
  const [radiusKm, setRadiusKm] = useState('any')
  const [minRating, setMinRating] = useState('0')
  const [minExperience, setMinExperience] = useState('0')
  const [specialty, setSpecialty] = useState('')
  const [sortBy, setSortBy] = useState(() => (parseLatLng(patientCoordsRaw) ? 'distance' : 'rating'))

  const patientPoint = useMemo(() => parseLatLng(patientCoordsRaw), [patientCoordsRaw])
  const canUseDistance = Boolean(patientPoint)
  const effectiveSortBy = sortBy === 'distance' && !canUseDistance ? 'rating' : sortBy

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const assignable = useMemo(
    () =>
      (physios || []).filter(
        (p) =>
          p.isVerified &&
          p.verificationStatus === 'approved' &&
          p.availability !== false &&
          p.isAvailable !== false,
      ),
    [physios],
  )

  const specialtyOptions = useMemo(() => {
    const set = new Set()
    for (const p of assignable) {
      const s = (p.specialization || '').trim()
      if (s) set.add(s)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [assignable])

  const withMeta = useMemo(() => {
    return assignable.map((p) => {
      const pc = parseLatLng(p.coordinates)
      let distKm = null
      if (patientPoint && pc) {
        distKm = distanceKm(patientPoint.lat, patientPoint.lng, pc.lat, pc.lng)
      }
      return { p, distKm }
    })
  }, [assignable, patientPoint])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rMax = radiusKm === 'any' ? null : Number(radiusKm)
    const rMin = Number(minRating) || 0
    const eMin = Number(minExperience) || 0
    const spec = specialty.trim().toLowerCase()

    let rows = withMeta.filter(({ p, distKm }) => {
      if (q) {
        const blob = [p.name, p.specialization, p.location, p.phone, p.clinicName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!blob.includes(q)) return false
      }
      if (rMax != null && canUseDistance) {
        if (distKm == null || distKm > rMax) return false
      }
      if (rMin > 0) {
        const ar = Number(p.avgRating)
        if (!Number.isFinite(ar) || ar < rMin) return false
      }
      if (eMin > 0 && (Number(p.experience) || 0) < eMin) return false
      if (spec && (p.specialization || '').trim().toLowerCase() !== spec) return false
      return true
    })

    const sorted = [...rows]
    sorted.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'distance': {
          const da = a.distKm
          const db = b.distKm
          if (da == null && db == null) return 0
          if (da == null) return 1
          if (db == null) return -1
          return da - db
        }
        case 'rating': {
          const ra = Number(a.p.avgRating) || 0
          const rb = Number(b.p.avgRating) || 0
          if (rb !== ra) return rb - ra
          return (a.p.name || '').localeCompare(b.p.name || '')
        }
        case 'name':
          return (a.p.name || '').localeCompare(b.p.name || '')
        case 'price_asc': {
          const pa = Number(a.p.pricePerSession)
          const pb = Number(b.p.pricePerSession)
          const na = Number.isFinite(pa) ? pa : Infinity
          const nb = Number.isFinite(pb) ? pb : Infinity
          if (na !== nb) return na - nb
          return (a.p.name || '').localeCompare(b.p.name || '')
        }
        case 'price_desc': {
          const pa = Number(a.p.pricePerSession)
          const pb = Number(b.p.pricePerSession)
          const na = Number.isFinite(pa) ? pa : -Infinity
          const nb = Number.isFinite(pb) ? pb : -Infinity
          if (nb !== na) return nb - na
          return (a.p.name || '').localeCompare(b.p.name || '')
        }
        default:
          return 0
      }
    })

    return sorted
  }, [withMeta, search, radiusKm, minRating, minExperience, specialty, effectiveSortBy, canUseDistance])

  const selectionId = useMemo(() => {
    if (!draftId) return ''
    const still = filteredSorted.some(({ p }) => String(p._id) === String(draftId))
    return still ? draftId : ''
  }, [draftId, filteredSorted])

  const filtersActive =
    radiusKm !== 'any' || minRating !== '0' || minExperience !== '0' || Boolean(specialty.trim())

  const excludedByRadius =
    canUseDistance && radiusKm !== 'any'
      ? withMeta.filter(({ distKm }) => distKm == null).length
      : 0

  if (!open) return null

  function handleUseSelection() {
    if (!selectionId) return
    onConfirmSelect(selectionId)
    onClose()
  }

  function clearFilters() {
    setRadiusKm('any')
    setMinRating('0')
    setMinExperience('0')
    setSpecialty('')
  }

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-physio-title"
    >
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="assign-physio-title" className="type-page-title text-slate-900">
                Assign physiotherapist
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Verified, available therapists only. Use filters to match distance and fit.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-feedback rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {!canUseDistance && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
              Patient location is not on file. Distance and radius filters are unavailable until the patient profile has map coordinates.
            </p>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty, area, phone…"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            autoComplete="off"
          />
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={selectClass}
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                disabled={!canUseDistance}
                title={!canUseDistance ? 'Needs patient coordinates' : 'Max distance from patient'}
              >
                {RADIUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                {RATING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={minExperience} onChange={(e) => setMinExperience(e.target.value)}>
                {EXP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">All specialties</option>
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={effectiveSortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.filter((o) => o.value !== 'distance' || canUseDistance).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg px-2 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                >
                  Clear filters
                </button>
              )}
            </div>
            {excludedByRadius > 0 && radiusKm !== 'any' && canUseDistance && (
              <p className="text-[11px] text-slate-500">
                {excludedByRadius} therapist{excludedByRadius === 1 ? '' : 's'} hidden — no map coordinates on file.
              </p>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {assignable.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No approved, verified physiotherapists found. Add or approve profiles in{' '}
              <Link to="/admin/physios" className="font-semibold text-teal-700 underline-offset-2 hover:underline" onClick={onClose}>
                Physiotherapists
              </Link>
              .
            </p>
          ) : filteredSorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {search.trim()
                ? `No matches for "${search.trim()}".`
                : 'No therapists match these filters. Try a wider radius or clear filters.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredSorted.map(({ p, distKm }) => {
                const id = p._id
                const active = selectionId === id
                const avatarSrc = resolveFileUrl(p.avatar)
                return (
                  <li key={id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDraftId(id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDraftId(id)
                        }
                      }}
                      className={[
                        'flex gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all sm:items-center',
                        active
                          ? 'border-teal-500 ring-2 ring-teal-500/30'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
                      ].join(' ')}
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80 sm:h-10 sm:w-10">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                            {(p.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-900">{p.name || '—'}</p>
                            {p.clinicName ? (
                              <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-200">
                                {p.clinicName}
                              </span>
                            ) : null}
                          </div>
                          {distKm != null && (
                            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                              {distKm < 10 ? distKm.toFixed(1) : Math.round(distKm)} km
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-slate-500">{p.specialization || '—'}</p>
                        <div className="mt-0.5">
                          <StarRow rating={p.avgRating} count={Number(p.totalReviews) || 0} compact />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">{p.experience ?? 0}</span> yrs
                          {p.pricePerSession != null && (
                            <>
                              <span className="text-slate-300"> · </span>
                              <span className="tabular-nums">{formatPhysioSessionFeeLabel(p)}/session</span>
                            </>
                          )}
                          {p.location ? (
                            <>
                              <span className="text-slate-300"> · </span>
                              <span className="text-slate-500">{p.location}</span>
                            </>
                          ) : null}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-1.5">
                          <Link
                            to={profileTo ? profileTo(id) : `/admin/physios/${id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[11px] font-semibold text-teal-700 underline-offset-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Full profile
                            <svg className="ml-0.5 h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col justify-center self-center sm:self-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDraftId(id)
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          {active ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tap-feedback min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:min-h-10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectionId}
              onClick={handleUseSelection}
              className="tap-feedback min-h-11 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10"
            >
              Use this physiotherapist
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
