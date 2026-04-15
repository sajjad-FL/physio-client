import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import { getCurrentCoords } from '../../utils/geolocation'

/**
 * Map pin picker — same UX as profile. Nested modals should set a higher z-index on the overlay.
 * @param {{ open: boolean, initialLat?: number|null, initialLng?: number|null, onClose: () => void, onConfirm: (coords: { lat: number, lng: number }) => void, overlayClassName?: string }} props
 */
export default function MapPickerModal({
  open,
  initialLat,
  initialLng,
  onClose,
  onConfirm,
  overlayClassName = 'z-[60]',
}) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN || ''
  const mapHostRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const placeMarkerRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (Number.isFinite(initialLat) && Number.isFinite(initialLng)) {
      setSelected({ lat: initialLat, lng: initialLng })
    } else {
      setSelected(null)
    }
  }, [open, initialLat, initialLng])

  useEffect(() => {
    if (!open) return undefined
    if (!token || !mapHostRef.current) return undefined

    let cancelled = false
    setMapReady(false)

    const hasInitial = Number.isFinite(initialLat) && Number.isFinite(initialLng)
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapHostRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: hasInitial ? [initialLng, initialLat] : [77.1025, 28.7041],
      zoom: hasInitial ? 14 : 10,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    function placeMarker(lat, lng) {
      if (cancelled || !mapRef.current) return
      markerRef.current?.remove()
      markerRef.current = null
      const marker = new mapboxgl.Marker({ color: '#ef4444', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map)
      marker.on('dragend', () => {
        const ll = marker.getLngLat()
        setSelected({ lat: ll.lat, lng: ll.lng })
      })
      markerRef.current = marker
      setSelected({ lat, lng })
    }

    placeMarkerRef.current = placeMarker

    map.on('click', (e) => {
      placeMarker(e.lngLat.lat, e.lngLat.lng)
    })

    function afterLoad() {
      if (cancelled) return
      if (hasInitial) {
        placeMarker(initialLat, initialLng)
      }
      if (!cancelled) setMapReady(true)
    }

    if (map.loaded()) {
      afterLoad()
    } else {
      map.once('load', afterLoad)
    }

    return () => {
      cancelled = true
      placeMarkerRef.current = null
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [open, token, initialLat, initialLng])

  async function useMyLocation() {
    if (!token || !mapRef.current || !placeMarkerRef.current) {
      toast.error('Map is still loading — try again in a moment.')
      return
    }
    setGeoLoading(true)
    try {
      const { lat, lng } = await getCurrentCoords()
      placeMarkerRef.current?.(lat, lng)
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 })
      toast.success('Pin placed at your location — drag it to fine-tune')
    } catch (err) {
      toast.error(err?.userMessage || 'Could not read your location.')
    } finally {
      setGeoLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm ${overlayClassName}`}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Pick location on map</h2>
        <p className="mt-1 text-sm text-gray-500">
          Use your location, click the map, or drag the red pin to adjust exactly where you are.
        </p>
        {!token ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add <code className="rounded bg-white px-1">VITE_MAPBOX_TOKEN</code> to use the map picker.
          </div>
        ) : (
          <div ref={mapHostRef} className="mt-4 h-[380px] w-full overflow-hidden rounded-xl border border-gray-200" />
        )}
        <p className="mt-2 text-xs text-gray-500">
          {selected ? `Selected: ${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}` : 'No pin selected yet.'}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 sm:px-4"
          >
            Cancel
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!token || !mapReady || geoLoading}
              className="h-11 sm:min-w-38"
              onClick={useMyLocation}
            >
              {geoLoading ? 'Locating…' : 'Use my location'}
            </Button>
            <Button type="button" disabled={!selected || !token} className="h-11" onClick={() => selected && onConfirm(selected)}>
              Use this location
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
