import { GeocodeResult } from '../types'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const CACHE = new Map<string, GeocodeResult>()

// Throttle Nominatim requests (max 1 per second per API terms)
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // ms

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function geocodeLocation(
  location: string,
  limit = 1
): Promise<GeocodeResult | null> {
  if (!location) return null

  // Check cache first
  if (CACHE.has(location)) {
    return CACHE.get(location)!
  }

  // Respect Nominatim rate limiting
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
  }

  try {
    const params = new URLSearchParams({
      q: location,
      format: 'json',
      limit: limit.toString(),
      // Focus on Eugene/Springfield area
      viewbox: '-123.5,43.5,-123.0,44.2',
      bounded: '1',
    })

    lastRequestTime = Date.now()
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'DispatchRoutePlanner/1.0',
      },
    })

    if (!response.ok) {
      console.error('Nominatim error:', response.statusText)
      return null
    }

    const data = await response.json()
    if (!data || data.length === 0) {
      console.warn(`No results for: ${location}`)
      return null
    }

    const result: GeocodeResult = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }

    // Cache the result
    CACHE.set(location, result)
    return result
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export async function geocodeBatch(
  locations: string[]
): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>()

  for (const location of locations) {
    const result = await geocodeLocation(location)
    if (result) {
      results.set(location, result)
    }
  }

  return results
}
