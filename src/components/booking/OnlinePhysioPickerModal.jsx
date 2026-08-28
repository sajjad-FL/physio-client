import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import VerificationBadge from '../physio/VerificationBadge'
import { StarRatingDisplay } from '../reviews/StarRating'
import { assetUrl } from '../../utils/assetUrl'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'
import { PHYSIO_LANGUAGE_VALUES } from '../../constants/physioLanguages.js'

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
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experience' },
  { value: 'price_asc', label: 'Lowest fee' },
  { value: 'price_desc', label: 'Highest fee' },
  { value: 'distance', label: 'Nearest first' },
  { value: 'name', label: 'Name A–Z' },
]

const selectClass =
  'min-w-0 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

function languagesOf(p) {
  if (Array.isArray(p?.languages)) return p.languages.map((l) => String(l).trim()).filter(Boolean)
  if (typeof p?.languages === 'string' && p.languages.trim()) {
    return p.languages.split(/[,·|]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

/**
 * Patient-facing list picker for online consultation.
 */
export default function OnlinePhysioPickerModal({
  open,
  onClose,
  physios,
  loading,
  selectedId,
  onSelect,
}) {
  const [draftId, setDraftId] = useState(selectedId || '')
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [minRating, setMinRating] = useState('0')
  const [minExperience, setMinExperience] = useState('0')
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    if (!open) return
    setDraftId(selectedId || '')
    setSearch('')
    setLanguage('')
    setSpecialty('')
    setMinRating('0')
    setMinExperience('0')
    setSortBy('rating')
  }, [open, selectedId])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const list = useMemo(() => (Array.isArray(physios) ? physios : []), [physios])

  const languageOptions = useMemo(() => {
    const present = new Set()
    for (const p of list) {
      for (const lang of languagesOf(p)) present.add(lang)
    }
    const ordered = PHYSIO_LANGUAGE_VALUES.filter((l) => present.has(l))
    const extras = [...present].filter((l) => !PHYSIO_LANGUAGE_VALUES.includes(l)).sort()
    return [...ordered, ...extras]
  }, [list])

  const specialtyOptions = useMemo(() => {
    const set = new Set()
    for (const p of list) {
      const s = (p.specialization || '').trim()
      if (s) set.add(s)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [list])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rMin = Number(minRating) || 0
    const eMin = Number(minExperience) || 0
    const lang = language.trim().toLowerCase()
    const spec = specialty.trim().toLowerCase()

    let rows = list.filter((p) => {
      if (q) {
        const langs = languagesOf(p).join(' ')
        const blob = [p.name, p.specialization, p.location, langs].filter(Boolean).join(' ').toLowerCase()
        if (!blob.includes(q)) return false
      }
      if (lang) {
        const langs = languagesOf(p).map((l) => l.toLowerCase())
        if (!langs.some((l) => l === lang || l.includes(lang))) return false
      }
      if (spec && String(p.specialization || '').trim().toLowerCase() !== spec) return false
      if (rMin > 0) {
        const ar = Number(p.avgRating)
        if (!Number.isFinite(ar) || ar < rMin) return false
      }
      if (eMin > 0) {
        const exp = Number(p.experience) || 0
        if (exp < eMin) return false
      }
      return true
    })

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''))
      if (sortBy === 'experience') return (Number(b.experience) || 0) - (Number(a.experience) || 0)
      if (sortBy === 'price_asc') return (Number(a.pricePerSession) || 0) - (Number(b.pricePerSession) || 0)
      if (sortBy === 'price_desc') return (Number(b.pricePerSession) || 0) - (Number(a.pricePerSession) || 0)
      if (sortBy === 'distance') {
        const da = a.distanceKm == null ? Number.POSITIVE_INFINITY : Number(a.distanceKm)
        const db = b.distanceKm == null ? Number.POSITIVE_INFINITY : Number(b.distanceKm)
        return da - db
      }
      // rating default
      const ra = Number(a.avgRating) || 0
      const rb = Number(b.avgRating) || 0
      if (rb !== ra) return rb - ra
      return (Number(b.totalReviews) || 0) - (Number(a.totalReviews) || 0)
    })

    return rows
  }, [list, search, language, specialty, minRating, minExperience, sortBy])

  if (!open) return null

  function confirm() {
    if (!draftId) return
    onSelect?.(draftId)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-gray-200 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Select physiotherapist</h3>
              <p className="mt-1 text-sm text-gray-500">
                Filter by language and expertise for your online consultation.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, specialty, language…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Language
                </span>
                <select className={selectClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="">Any language</option>
                  {languageOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Specialty
                </span>
                <select className={selectClass} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  <option value="">Any specialty</option>
                  {specialtyOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Experience
                </span>
                <select
                  className={selectClass}
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                >
                  {EXP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Rating
                </span>
                <select className={selectClass} value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                  {RATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 block min-w-0 sm:col-span-1">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Sort by
                </span>
                <select className={selectClass} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              {loading ? 'Loading…' : `${filteredSorted.length} of ${list.length} physiotherapist${list.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No registered physiotherapists found for your location. Try changing location.
            </p>
          ) : filteredSorted.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              No matches for these filters. Try clearing language or specialty.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredSorted.map((p) => {
                const id = String(p._id)
                const active = String(draftId) === id
                const langs = languagesOf(p)
                const avg = Number(p.avgRating) || 0
                const total = Number(p.totalReviews) || 0
                const avatarSrc = assetUrl(p.avatar)
                const dist =
                  p.distanceKm == null ? null : `${Number(p.distanceKm).toFixed(1)} km`

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
                        'flex gap-3 px-4 py-3 text-left transition sm:px-5',
                        active ? 'bg-teal-50/80' : 'bg-white hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                            {(p.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">{p.name || '—'}</p>
                              {p.verificationBadgeLevel ? (
                                <VerificationBadge level={p.verificationBadgeLevel} className="!text-[10px]" />
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {p.specialization || 'Physiotherapy'}
                              {p.experience != null ? ` · ${p.experience} yrs` : ''}
                              {dist ? ` · ${dist}` : ''}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                            {formatPhysioSessionFeeLabel(p)}
                          </p>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <StarRatingDisplay value={avg} size="sm" />
                          <span className="text-[11px] tabular-nums text-slate-500">
                            {total > 0 ? `${avg.toFixed(1)} (${total})` : 'No reviews'}
                          </span>
                          {langs.length ? (
                            <span className="truncate text-[11px] text-slate-600" title={langs.join(', ')}>
                              Speaks {langs.slice(0, 3).join(', ')}
                              {langs.length > 3 ? ` +${langs.length - 3}` : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Languages not listed</span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Link
                            to={`/physician/${p._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDraftId(id)
                            }}
                            className={[
                              'rounded-lg px-2.5 py-1 text-xs font-semibold',
                              active
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                            ].join(' ')}
                          >
                            {active ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" disabled={!draftId} onClick={confirm} className="rounded-xl">
              Use selected physiotherapist
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
