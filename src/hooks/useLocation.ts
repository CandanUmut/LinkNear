import { useState, useEffect } from 'react'

interface LocationState {
  latitude: number | null
  longitude: number | null
  locationName: string
  error: string | null
  loading: boolean
}

interface UseLocationReturn extends LocationState {
  refreshLocation: () => void
  setManualLocation: (lat: number, lng: number, name: string) => void
}

// Nominatim's public usage policy limits us to ~1 request/sec. We throttle
// via a module-level timestamp and cache results in localStorage keyed by
// rounded coordinates (so small GPS jitter reuses the same geocode hit).
const GEOCODE_CACHE_KEY = 'linknear:geocode-cache:v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
let lastRequestAt = 0

interface CacheEntry {
  name: string
  ts: number
}

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full or unavailable — swallow.
  }
}

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  const key = cacheKey(lat, lng)
  const cache = readCache()
  const cached = cache[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.name
  }

  // Throttle to 1 request per second to respect Nominatim's usage policy.
  const now = Date.now()
  const wait = Math.max(0, lastRequestAt + 1100 - now)
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait))
  }
  lastRequestAt = Date.now()

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return fallback
    const data = await res.json()
    const addr = data.address
    let name = fallback
    if (addr) {
      const city =
        addr.city || addr.town || addr.village || addr.suburb || addr.municipality || ''
      const state = addr.state || ''
      const country = addr.country_code?.toUpperCase() || ''
      const joined = [city, state, country].filter(Boolean).join(', ')
      if (joined) name = joined
    }

    const updatedCache = readCache()
    updatedCache[key] = { name, ts: Date.now() }
    writeCache(updatedCache)
    return name
  } catch {
    return fallback
  }
}

export function useLocation(): UseLocationReturn {
  const geolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    locationName: '',
    error: geolocationSupported ? null : 'Geolocation is not supported by your browser.',
    loading: geolocationSupported,
  })

  const refreshLocation = () => {
    if (!geolocationSupported) return

    setState(s => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const locationName = await reverseGeocode(latitude, longitude)
        setState({ latitude, longitude, locationName, error: null, loading: false })
      },
      (err) => {
        setState(s => ({
          ...s,
          loading: false,
          error: err.message || 'Unable to retrieve your location.',
        }))
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    if (!geolocationSupported) return

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const locationName = await reverseGeocode(latitude, longitude)
        if (!cancelled) {
          setState({ latitude, longitude, locationName, error: null, loading: false })
        }
      },
      (err) => {
        if (!cancelled) {
          setState(s => ({
            ...s,
            loading: false,
            error: err.message || 'Unable to retrieve your location.',
          }))
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    )

    return () => {
      cancelled = true
    }
  }, [geolocationSupported])

  const setManualLocation = (lat: number, lng: number, name: string) => {
    setState({ latitude: lat, longitude: lng, locationName: name, error: null, loading: false })
  }

  return { ...state, refreshLocation, setManualLocation }
}
