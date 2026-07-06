import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { distanceKm, parseLatLng } from '../../utils/geoDistance'

const RADIUS_OPTIONS = [
  { value: 'any', label: 'Any distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
]

const SORT_OPTIONS = [
  { value: 'zone_match', label: 'Zone match first' },
  { value: 'distance', label: 'Nearest first' },
  { value: 'name', label: 'Name A–Z' },
]

const selectClass =
  'min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20'

function managerCoversPincode(manager, bookingPincode) {
  if (!bookingPincode) return false
  const pin = String(bookingPincode).trim()
  if (!pin) return false
  return (manager.zones || []).some((z) => (z.pincodes || []).includes(pin))
}

function zoneSummary(manager) {
  const zones = manager.zones || []
  if (zones.length === 0) return 'No zone assigned'
  if (zones.length === 1) return zones[0].name
  return `${zones.length} zones · ${zones[0].name}${zones.length > 1 ? '…' : ''}`
}

export default function AdminAssignManagerModal({
  open,
  onClose,
  managers,
  patientCoords: patientCoordsRaw,
  bookingPincode,
  selectedId,
  onConfirmSelect,
}) {
  const [search, setSearch] = useState('')
  const [draftId, setDraftId] = useState(selectedId || '')
  const [radiusKm, setRadiusKm] = useState('any')
  const [zoneFilter, setZoneFilter] = useState(() => (bookingPincode ? 'match' : 'any'))
  const [sortBy, setSortBy] = useState(() => (bookingPincode ? 'zone_match' : 'name'))

  const patientPoint = useMemo(() => parseLatLng(patientCoordsRaw), [patientCoordsRaw])
  const canUseDistance = Boolean(patientPoint)
  const effectiveSortBy = sortBy === 'distance' && !canUseDistance ? 'name' : sortBy

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) setDraftId(selectedId || '')
  }, [open, selectedId])

  const zoneOptions = useMemo(() => {
    const set = new Map()
    for (const m of managers || []) {
      for (const z of m.zones || []) {
        if (z._id && z.name) set.set(String(z._id), z.name)
      }
    }
    return [...set.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [managers])

  const withMeta = useMemo(() => {
    return (managers || []).map((m) => {
      const mc = parseLatLng(m.coordinates)
      let distKm = null
      if (patientPoint && mc) {
        distKm = distanceKm(patientPoint.lat, patientPoint.lng, mc.lat, mc.lng)
      }
      const coversPincode = managerCoversPincode(m, bookingPincode)
      return { m, distKm, coversPincode }
    })
  }, [managers, patientPoint, bookingPincode])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rMax = radiusKm === 'any' ? null : Number(radiusKm)
    const pin = String(bookingPincode || '').trim()

    let rows = withMeta.filter(({ m, distKm, coversPincode }) => {
      if (q) {
        const blob = [
          m.name,
          m.phone,
          m.location,
          m.pincode,
          ...(m.zones || []).map((z) => z.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!blob.includes(q)) return false
      }
      if (zoneFilter === 'match' && pin) {
        if (!coversPincode) return false
      } else if (zoneFilter !== 'any') {
        const inZone = (m.zones || []).some((z) => String(z._id) === String(zoneFilter))
        if (!inZone) return false
      }
      if (rMax != null && canUseDistance) {
        if (distKm == null || distKm > rMax) return false
      }
      return true
    })

    const sorted = [...rows]
    sorted.sort((a, b) => {
      switch (effectiveSortBy) {
        case 'zone_match': {
          if (a.coversPincode !== b.coversPincode) return a.coversPincode ? -1 : 1
          if (a.distKm != null && b.distKm != null && a.distKm !== b.distKm) return a.distKm - b.distKm
          return (a.m.name || '').localeCompare(b.m.name || '')
        }
        case 'distance': {
          const da = a.distKm
          const db = b.distKm
          if (da == null && db == null) return (a.m.name || '').localeCompare(b.m.name || '')
          if (da == null) return 1
          if (db == null) return -1
          return da - db
        }
        case 'name':
        default:
          return (a.m.name || '').localeCompare(b.m.name || '')
      }
    })

    return sorted
  }, [withMeta, search, radiusKm, zoneFilter, bookingPincode, effectiveSortBy, canUseDistance])

  const selectionId = useMemo(() => {
    if (!draftId) return ''
    const still = filteredSorted.some(({ m }) => String(m._id) === String(draftId))
    return still ? draftId : ''
  }, [draftId, filteredSorted])

  const filtersActive =
    radiusKm !== 'any' || (bookingPincode ? zoneFilter !== 'match' : zoneFilter !== 'any')

  if (!open) return null

  function handleUseSelection() {
    if (!selectionId) return
    onConfirmSelect(selectionId)
    onClose()
  }

  function clearFilters() {
    setRadiusKm('any')
    setZoneFilter(bookingPincode ? 'match' : 'any')
    setSortBy(bookingPincode ? 'zone_match' : 'name')
  }

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-manager-title"
    >
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="assign-manager-title" className="type-page-title text-slate-900">
                Assign care manager
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Active care managers only. Filter by zone coverage and distance to the patient.
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
          {bookingPincode ? (
            <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900 ring-1 ring-teal-100">
              Patient pincode: <span className="font-semibold tabular-nums">{bookingPincode}</span>
              {' · '}
              Managers covering this pincode are prioritized.
            </p>
          ) : null}
          {!canUseDistance && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
              Patient location is not on file. Distance filters are unavailable until the patient profile has map coordinates.
            </p>
          )}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, area, zone…"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            autoComplete="off"
          />
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <select className={selectClass} value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
                <option value="any">All zones</option>
                {bookingPincode ? <option value="match">Covers patient pincode</option> : null}
                {zoneOptions.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
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
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {(managers || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No care managers found. Promote a user in{' '}
              <Link to="/admin/directory" className="font-semibold text-teal-700 underline-offset-2 hover:underline" onClick={onClose}>
                Users
              </Link>
              .
            </p>
          ) : filteredSorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {search.trim()
                ? `No matches for "${search.trim()}".`
                : 'No managers match these filters. Try a wider radius or clear filters.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredSorted.map(({ m, distKm, coversPincode }) => {
                const id = m._id
                const active = selectionId === id
                const avatarSrc = resolveFileUrl(m.avatarUrl)
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
                            {(m.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">{m.name || '—'}</p>
                          <div className="flex shrink-0 flex-wrap items-center gap-1">
                            {coversPincode ? (
                              <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">
                                Covers pincode
                              </span>
                            ) : null}
                            {distKm != null && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700">
                                {distKm < 10 ? distKm.toFixed(1) : Math.round(distKm)} km
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="truncate text-[11px] text-slate-500">{zoneSummary(m)}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-600">
                          {m.phone ? (
                            <span className="font-medium text-slate-700">{m.phone}</span>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                          {m.pincode ? (
                            <>
                              <span className="text-slate-300"> · </span>
                              <span className="tabular-nums">PIN {m.pincode}</span>
                            </>
                          ) : null}
                          {m.location ? (
                            <>
                              <span className="text-slate-300"> · </span>
                              <span className="text-slate-500">{m.location}</span>
                            </>
                          ) : null}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-1.5">
                          <Link
                            to="/admin/directory"
                            className="inline-flex items-center text-[11px] font-semibold text-teal-700 underline-offset-2 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            User directory
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
              Use this care manager
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
