import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import { api } from '../config/api'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'

const ROUTE_SOURCE_ID = 'directions-route'
const ROUTE_LAYER_ID = 'directions-route-line'

function removeRouteLayer(map) {
  if (!map) return
  if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID)
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
}

function addRouteLayer(map, coordinates) {
  removeRouteLayer(map)
  if (!coordinates?.length) return
  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    },
  })
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: 'line',
    source: ROUTE_SOURCE_ID,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#2563eb',
      'line-width': 4,
    },
  })
}

async function fetchDrivingRoute(userLng, userLat, destLng, destLat, accessToken) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${destLng},${destLat}`
  const { data } = await axios.get(url, {
    params: {
      geometries: 'geojson',
      access_token: accessToken,
    },
  })
  const route = data?.routes?.[0]
  if (!route) {
    throw new Error('No route returned')
  }
  return {
    coordinates: route.geometry?.coordinates || [],
    distanceM: route.distance,
    durationS: route.duration,
  }
}

export default function MapView() {
  const navigate = useNavigate()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [routeError, setRouteError] = useState('')
  const [notice, setNotice] = useState('')
  const [physios, setPhysios] = useState([])
  const [coords, setCoords] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedPhysio, setSelectedPhysio] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  const token = import.meta.env.VITE_MAPBOX_TOKEN || ''

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude)
        const lng = Number(pos.coords.longitude)
        setCoords({ lat, lng })
        try {
          const res = await api.get('/physios/nearby', { params: { lat, lng, limit: 30 } })
          setPhysios(res.data?.physios || [])
          if (res.data?.fallbackUsed) {
            setNotice('No nearby physios, showing closest available')
          }
        } catch (e) {
          setError(e.response?.data?.message || 'Could not load nearby physiotherapists')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Unable to fetch your location.')
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

  const clearPhysioMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }, [])

  const buildPopupHtml = useCallback((p) => {
    return `
      <div style="min-width:180px;font-size:13px;line-height:1.35">
        <p style="font-weight:600;margin:0 0 4px">${p.name || 'Physiotherapist'}</p>
        <p style="margin:0 0 2px;color:#4b5563">${p.experience || 0} years experience</p>
        <p style="margin:0 0 8px;color:#111827">INR ${p.pricePerSession || 0}/session</p>
        <button data-action="select" data-physio-id="${p._id}" style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:12px;font-weight:600">
          Select Physio
        </button>
      </div>
    `
  }, [])

  useEffect(() => {
    if (!coords || !mapContainerRef.current || !token) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coords.lng, coords.lat],
      zoom: 13,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const userEl = document.createElement('div')
    userEl.style.width = '14px'
    userEl.style.height = '14px'
    userEl.style.borderRadius = '9999px'
    userEl.style.background = '#2563eb'
    userEl.style.border = '2px solid #fff'
    userEl.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.35)'
    userMarkerRef.current = new mapboxgl.Marker({ element: userEl })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map)

    map.on('load', () => {
      setMapReady(true)
    })

    return () => {
      clearPhysioMarkers()
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      removeRouteLayer(map)
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [coords, token, loading, clearPhysioMarkers])

  const handleSelectPhysio = useCallback((physio) => {
    setSelectedPhysio(physio)
    setRouteError('')
    setRouteInfo(null)
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !coords) return

    clearPhysioMarkers()

    physios.forEach((p) => {
      const lat = p.coordinates?.lat
      const lng = p.coordinates?.lng
      if (lat == null || lng == null) return

      const isSelected = selectedPhysio?._id === p._id
      const el = document.createElement('div')
      el.style.width = isSelected ? '22px' : '18px'
      el.style.height = isSelected ? '22px' : '18px'
      el.style.borderRadius = '9999px'
      el.style.background = isSelected ? '#059669' : '#ef4444'
      el.style.border = '3px solid #fff'
      el.style.boxShadow = isSelected
        ? '0 0 0 3px rgba(5,150,105,0.45)'
        : '0 2px 6px rgba(0,0,0,0.25)'

      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(buildPopupHtml(p))
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map)
      markersRef.current.push(marker)

      popup.on('open', () => {
        const root = popup.getElement()
        const btn = root?.querySelector(`[data-physio-id="${p._id}"][data-action="select"]`)
        if (btn) {
          btn.addEventListener(
            'click',
            () => {
              handleSelectPhysio(p)
            },
            { once: true }
          )
        }
      })
    })
  }, [mapReady, physios, coords, selectedPhysio, hoveredPhysioId, buildPopupHtml, clearPhysioMarkers, handleSelectPhysio])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !coords || !selectedPhysio || !token) return

    const plat = selectedPhysio.coordinates?.lat
    const plng = selectedPhysio.coordinates?.lng
    if (plat == null || plng == null) {
      setRouteError('This physiotherapist has no map coordinates yet.')
      removeRouteLayer(map)
      setRouteInfo(null)
      return
    }

    let cancelled = false
    removeRouteLayer(map)
    setRouteInfo(null)
    setRouteLoading(true)
    setRouteError('')

    fetchDrivingRoute(coords.lng, coords.lat, plng, plat, token)
      .then(({ coordinates, distanceM, durationS }) => {
        if (cancelled || !mapRef.current) return
        if (!coordinates.length) {
          setRouteError('Could not build route geometry.')
          return
        }
        addRouteLayer(map, coordinates)
        setRouteInfo({
          distanceKm: distanceM / 1000,
          durationMin: durationS / 60,
        })
        const bounds = coordinates.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        )
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 })
      })
      .catch(() => {
        if (!cancelled) {
          setRouteError('Could not load driving directions. Try again or pick another physio.')
          removeRouteLayer(map)
          setRouteInfo(null)
        }
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mapReady, coords, selectedPhysio, token])

  function openExternalNavigation() {
    if (!coords || !selectedPhysio?.coordinates) return
    const { lat: dLat, lng: dLng } = selectedPhysio.coordinates
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dLat},${dLng}&origin=${coords.lat},${coords.lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function continueToBooking() {
    if (!coords) return
    navigate('/book', { state: { userCoords: coords } })
  }

  const distanceLabel =
    routeInfo != null ? `${routeInfo.distanceKm.toFixed(1)} km` : '—'
  const etaLabel = routeInfo != null ? `${Math.round(routeInfo.durationMin)} mins` : '—'

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Map &amp; nearby physios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Explore nearby therapists on the map (optional). Booking does not require a selection — our team assigns a
              physiotherapist after you submit.
            </p>
          </div>
          <Link
            to="/book"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
          >
            Back to booking
          </Link>
        </div>

        {loading && (
          <div className="mb-6 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Skeleton className="h-[min(70vh,560px)] w-full rounded-2xl" />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-4">
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
        )}
        {notice && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{notice}</div>
        )}

        {!token && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            Missing <code className="rounded bg-white px-1">VITE_MAPBOX_TOKEN</code> in your client env.
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="relative min-h-[min(70vh,560px)] flex-[7] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
              {selectedPhysio && coords && token && (
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center px-3 pt-3">
                  <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <p className="text-center text-sm font-semibold text-gray-900">
                      {routeLoading ? (
                        'Calculating route…'
                      ) : routeError ? (
                        <span className="text-red-700">{routeError}</span>
                      ) : (
                        <>
                          Distance: {distanceLabel} <span className="text-gray-400">|</span> ETA: {etaLabel}
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-center text-xs text-gray-500">{selectedPhysio.name}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <Button
                        variant="primary"
                        className="text-xs"
                        disabled={!routeInfo || !!routeError}
                        onClick={openExternalNavigation}
                      >
                        Start Navigation
                      </Button>
                      <Button variant="outline" className="text-xs" onClick={continueToBooking}>
                        Continue to booking
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div ref={mapContainerRef} className="absolute inset-0 min-h-[380px]" />
            </div>

            <aside className="flex min-h-0 flex-[1_1_30%] flex-col gap-4 lg:max-w-md">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Physiotherapists</h2>
                <p className="mt-1 text-sm text-gray-500">Hover a card to highlight the marker on the map.</p>
              </div>
              <div className="flex max-h-[min(70vh,560px)] flex-col gap-4 overflow-y-auto pr-1">
                {!loading && !error && physios.length === 0 && (
                  <EmptyState
                    title="No physiotherapists nearby"
                    description="Try again later or book from the list view with your location enabled."
                    icon={
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 20.25H15M12 3v4.5m0 0L9 6.75m3 1.5l3-1.5M5.25 18.75h13.5a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v9a1.5 1.5 0 001.5 1.5z"
                        />
                      </svg>
                    }
                  />
                )}
                {physios.map((p) => {
                  const lat = p.coordinates?.lat
                  const lng = p.coordinates?.lng
                  if (lat == null || lng == null) return null
                  const isSel = selectedPhysio?._id === p._id
                  const isHover = hoveredPhysioId === p._id
                  return (
                    <article
                      key={p._id}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredPhysioId(p._id)}
                      onMouseLeave={() => setHoveredPhysioId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectPhysio(p)
                        }
                      }}
                      onClick={() => handleSelectPhysio(p)}
                      className={[
                        'cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200',
                        'hover:-translate-y-0.5 hover:shadow-md',
                        isSel
                          ? 'border-blue-200 ring-2 ring-blue-100'
                          : isHover
                            ? 'border-orange-200 shadow-md'
                            : 'border-gray-100',
                      ].join(' ')}
                    >
                      <h3 className="text-base font-semibold text-gray-900">{p.name || 'Physiotherapist'}</h3>
                      <p className="mt-1 text-sm text-gray-500">{p.experience || 0} years experience</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">₹{p.pricePerSession || 0}/session</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {p.distanceKm == null ? 'Distance unavailable' : `${p.distanceKm.toFixed(1)} km away`}
                      </p>
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant={isSel ? 'success' : 'primary'}
                          className="w-full text-sm"
                          onClick={() => handleSelectPhysio(p)}
                        >
                          {isSel ? 'Selected' : 'Select & show route'}
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
              {coords && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/90 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Ready to book?</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    You don&apos;t need to pick someone on this map. Continue with your location — a physiotherapist will be
                    assigned by our team.
                  </p>
                  <Button type="button" variant="primary" className="mt-3 w-full rounded-xl text-sm" onClick={continueToBooking}>
                    Continue to book
                  </Button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
