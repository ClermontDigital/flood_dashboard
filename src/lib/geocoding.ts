/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Free and open source - no API key required
 */

export interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
  type: string
}

export interface GeocodingResponse {
  success: boolean
  results: GeocodingResult[]
  error?: string
}

// Rate limiting - Nominatim requires max 1 request per second
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds to be safe

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

/**
 * Search for addresses using OpenStreetMap Nominatim
 * Biased towards Queensland, Australia for better local results
 */
export async function searchAddress(query: string): Promise<GeocodingResponse> {
  if (!query || query.trim().length < 3) {
    return { success: false, results: [], error: 'Query too short' }
  }

  try {
    await waitForRateLimit()

    // Bias search towards Queensland, Australia
    const searchQuery = query.includes('QLD') || query.includes('Queensland')
      ? query
      : `${query}, Queensland, Australia`

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'au',
      // Bounding box for Queensland region
      viewbox: '138,-30,154,-10',
      bounded: '0', // Prefer but don't limit to viewbox
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'ClermontFloodDashboard/1.0',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    const results: GeocodingResult[] = data.map((item: {
      lat: string
      lon: string
      display_name: string
      type: string
    }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
    }))

    return { success: true, results }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Geocoding failed',
    }
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResponse> {
  try {
    await waitForRateLimit()

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          'User-Agent': 'ClermontFloodDashboard/1.0',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return { success: false, results: [], error: data.error }
    }

    const result: GeocodingResult = {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      displayName: data.display_name,
      type: data.type || 'location',
    }

    return { success: true, results: [result] }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Reverse geocoding failed',
    }
  }
}
