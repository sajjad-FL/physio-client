import { useCallback, useEffect, useRef, useState } from 'react'
import { mapboxForwardGeocode, hasMapboxGeocode } from '../../utils/mapboxGeocode'
import Input from '../ui/Input'

/**
 * Search with Mapbox Places suggestions; on pick, returns lat/lng.
 * Without VITE_MAPBOX_TOKEN, behaves as a plain text field (coords from GPS only).
 *
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (label: string) => void,
 *   onPlaceResolved: (place: { lat: number, lng: number, label: string } | null) => void,
 *   disabled?: boolean,
 *   placeholder?: string,
 * }} props
 */
export default function LocationAutocomplete({
  id = 'loc-search',
  value,
  onChange,
  onPlaceResolved,
  disabled,
  placeholder = 'Search area, city, or address',
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const runSearch = useCallback(
    async (q) => {
      if (!hasMapboxGeocode() || q.trim().length < 2) {
        setSuggestions([])
        return
      }
      setLoading(true)
      try {
        const list = await mapboxForwardGeocode(q)
        setSuggestions(list)
        setOpen(list.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  function handleInputChange(e) {
    const next = e.target.value
    onChange(next)
    onPlaceResolved(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(next)
    }, 320)
  }

  function pick(s) {
    onChange(s.placeName)
    onPlaceResolved({ lat: s.lat, lng: s.lng, label: s.placeName })
    setOpen(false)
    setSuggestions([])
  }

  const showDropdown = hasMapboxGeocode() && open && suggestions.length > 0

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length) setOpen(true)
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 rounded-xl border-gray-200 pr-10 text-sm"
      />
      {loading && (
        <div className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      )}
      {showDropdown && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-gray-800 transition-colors hover:bg-blue-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s.placeName}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!hasMapboxGeocode() && (
        <p className="mt-1.5 text-[11px] text-amber-700/90">
          Add <code className="rounded bg-amber-50 px-1">VITE_MAPBOX_TOKEN</code> for address search. Use “Use my location”
          to set your position.
        </p>
      )}
    </div>
  )
}
