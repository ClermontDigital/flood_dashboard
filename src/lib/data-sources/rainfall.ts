/**
 * Open-Meteo Rainfall Data Client
 *
 * Fetches rainfall data (historical and forecast) from the free Open-Meteo API.
 * No API key required.
 *
 * @see https://open-meteo.com/
 */

import type { GaugeStation } from '@/lib/types'

/**
 * Rainfall data point
 */
export interface RainfallPoint {
  timestamp: string
  precipitation: number  // mm
  precipitationProbability?: number  // 0-100%
}

/**
 * Rainfall summary for a location
 */
export interface RainfallSummary {
  location: {
    lat: number
    lng: number
    name?: string
  }
  current: {
    precipitation: number  // mm/hr
    isRaining: boolean
  }
  last24Hours: number  // total mm
  last7Days: number  // total mm
  next24Hours: number  // forecast total mm
  next7Days: number  // forecast total mm
  hourlyHistory: RainfallPoint[]  // last 24 hours
  hourlyForecast: RainfallPoint[]  // next 24 hours
  dailyForecast: Array<{
    date: string
    precipitationSum: number
    precipitationProbabilityMax: number
  }>
  fetchedAt: string
}

/**
 * Response wrapper
 */
export interface RainfallResponse {
  success: boolean
  data: RainfallSummary | null
  error?: string
}

const API_BASE = 'https://api.open-meteo.com/v1'
const API_TIMEOUT = 10000

/**
 * Fetches rainfall data for a specific location
 */
export async function fetchRainfall(
  lat: number,
  lng: number,
  locationName?: string
): Promise<RainfallResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    // Fetch both historical and forecast data
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      hourly: 'precipitation,precipitation_probability',
      daily: 'precipitation_sum,precipitation_probability_max',
      current: 'precipitation,is_day',
      past_days: '7',
      forecast_days: '7',
      timezone: 'Australia/Brisbane',
    })

    const response = await fetch(`${API_BASE}/forecast?${params}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`)
    }

    const data = await response.json()

    // Process the response
    const now = new Date()
    const nowHour = now.toISOString().slice(0, 13) + ':00'

    // Find current hour index
    const hourlyTimes: string[] = data.hourly?.time || []
    const hourlyPrecip: number[] = data.hourly?.precipitation || []
    const hourlyProbability: number[] = data.hourly?.precipitation_probability || []

    const currentIndex = hourlyTimes.findIndex(t => t >= nowHour)

    // Calculate totals
    let last24Hours = 0
    let next24Hours = 0

    // Last 24 hours (indices before current)
    const historyStart = Math.max(0, currentIndex - 24)
    for (let i = historyStart; i < currentIndex; i++) {
      last24Hours += hourlyPrecip[i] || 0
    }

    // Next 24 hours
    for (let i = currentIndex; i < Math.min(currentIndex + 24, hourlyPrecip.length); i++) {
      next24Hours += hourlyPrecip[i] || 0
    }

    // Last 7 days total
    const last7Days = (data.daily?.precipitation_sum || [])
      .slice(0, 7)
      .reduce((sum: number, val: number) => sum + (val || 0), 0)

    // Next 7 days total
    const next7Days = (data.daily?.precipitation_sum || [])
      .slice(7)
      .reduce((sum: number, val: number) => sum + (val || 0), 0)

    // Build hourly history (last 24 hours)
    const hourlyHistory: RainfallPoint[] = []
    for (let i = historyStart; i < currentIndex; i++) {
      hourlyHistory.push({
        timestamp: hourlyTimes[i],
        precipitation: hourlyPrecip[i] || 0,
        precipitationProbability: hourlyProbability[i],
      })
    }

    // Build hourly forecast (next 24 hours)
    const hourlyForecast: RainfallPoint[] = []
    for (let i = currentIndex; i < Math.min(currentIndex + 24, hourlyTimes.length); i++) {
      hourlyForecast.push({
        timestamp: hourlyTimes[i],
        precipitation: hourlyPrecip[i] || 0,
        precipitationProbability: hourlyProbability[i],
      })
    }

    // Build daily forecast
    const dailyTimes: string[] = data.daily?.time || []
    const dailyPrecip: number[] = data.daily?.precipitation_sum || []
    const dailyProb: number[] = data.daily?.precipitation_probability_max || []

    const dailyForecast = dailyTimes.slice(7).map((date, i) => ({
      date,
      precipitationSum: dailyPrecip[i + 7] || 0,
      precipitationProbabilityMax: dailyProb[i + 7] || 0,
    }))

    const summary: RainfallSummary = {
      location: {
        lat,
        lng,
        name: locationName,
      },
      current: {
        precipitation: data.current?.precipitation || 0,
        isRaining: (data.current?.precipitation || 0) > 0,
      },
      last24Hours,
      last7Days,
      next24Hours,
      next7Days,
      hourlyHistory,
      hourlyForecast,
      dailyForecast,
      fetchedAt: new Date().toISOString(),
    }

    return { success: true, data: summary }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Open-Meteo rainfall fetch error:', error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Fetches rainfall data for multiple gauge locations
 */
export async function fetchRainfallForGauges(
  gauges: Array<{ id: string; lat: number; lng: number; name: string }>
): Promise<Map<string, RainfallResponse>> {
  const results = new Map<string, RainfallResponse>()

  // Fetch in parallel with rate limiting (Open-Meteo allows many requests)
  const batchSize = 10
  for (let i = 0; i < gauges.length; i += batchSize) {
    const batch = gauges.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (gauge) => {
        const result = await fetchRainfall(gauge.lat, gauge.lng, gauge.name)
        return { id: gauge.id, result }
      })
    )

    for (const { id, result } of batchResults) {
      results.set(id, result)
    }
  }

  return results
}

/**
 * Fetches regional rainfall overview for the Clermont/Fitzroy Basin area
 */
export async function fetchRegionalRainfall(): Promise<RainfallResponse> {
  // Center point for Clermont region
  return fetchRainfall(-22.8245, 147.6392, 'Clermont Region')
}

/**
 * Key sampling locations across Queensland for aggregated rainfall
 */
const QLD_SAMPLE_LOCATIONS = [
  // Southeast QLD
  { lat: -27.47, lng: 153.03, name: 'Brisbane' },
  { lat: -27.61, lng: 152.76, name: 'Ipswich' },
  { lat: -28.01, lng: 153.32, name: 'Gold Coast' },
  // Wide Bay-Burnett
  { lat: -24.85, lng: 152.35, name: 'Bundaberg' },
  { lat: -26.19, lng: 152.67, name: 'Gympie' },
  // Central QLD
  { lat: -23.38, lng: 150.51, name: 'Rockhampton' },
  { lat: -22.82, lng: 147.64, name: 'Clermont' },
  // Mackay-Whitsunday
  { lat: -21.12, lng: 149.11, name: 'Mackay' },
  // North QLD
  { lat: -19.30, lng: 146.79, name: 'Townsville' },
  { lat: -18.65, lng: 146.17, name: 'Ingham' },
  // Far North QLD
  { lat: -16.92, lng: 145.77, name: 'Cairns' },
  { lat: -17.52, lng: 146.03, name: 'Innisfail' },
  // Darling Downs
  { lat: -27.56, lng: 151.95, name: 'Toowoomba' },
  { lat: -27.18, lng: 151.26, name: 'Dalby' },
]

/**
 * Aggregated statewide rainfall summary
 */
export interface StateRainfallSummary {
  // Aggregated totals (averages across all sample locations)
  current: {
    precipitation: number  // average mm/hr
    isRaining: boolean     // true if raining anywhere
    rainingLocations: number  // count of locations with rain
  }
  last24Hours: {
    min: number
    max: number
    avg: number
  }
  next24Hours: {
    min: number
    max: number
    avg: number
  }
  next7Days: {
    min: number
    max: number
    avg: number
  }
  // Regional breakdown
  regions: Array<{
    name: string
    lat: number
    lng: number
    last24Hours: number
    next24Hours: number
    isRaining: boolean
  }>
  // For backward compatibility - use averages
  last7Days: number
  fetchedAt: string
  sampleCount: number
}

export interface StateRainfallResponse {
  success: boolean
  data: StateRainfallSummary | null
  error?: string
}

/**
 * Fetches and aggregates rainfall data from multiple Queensland locations
 * Provides statewide overview with min/max/avg values
 */
export async function fetchStateRainfall(): Promise<StateRainfallResponse> {
  try {
    // Fetch rainfall in batches to avoid rate limiting
    const batchSize = 5  // Smaller batch size to be gentle on the API
    const results: Array<{ location: typeof QLD_SAMPLE_LOCATIONS[0]; result: RainfallResponse }> = []

    for (let i = 0; i < QLD_SAMPLE_LOCATIONS.length; i += batchSize) {
      const batch = QLD_SAMPLE_LOCATIONS.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (loc) => {
          const result = await fetchRainfall(loc.lat, loc.lng, loc.name)
          return { location: loc, result }
        })
      )
      results.push(...batchResults)

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < QLD_SAMPLE_LOCATIONS.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Filter successful results
    const successfulResults = results.filter(r => r.result.success && r.result.data)

    if (successfulResults.length === 0) {
      return { success: false, data: null, error: 'Failed to fetch rainfall data from any location' }
    }

    // Calculate aggregates
    const currentPrecip = successfulResults.map(r => r.result.data!.current.precipitation)
    const last24Totals = successfulResults.map(r => r.result.data!.last24Hours)
    const next24Totals = successfulResults.map(r => r.result.data!.next24Hours)
    const next7Totals = successfulResults.map(r => r.result.data!.next7Days)
    const last7Totals = successfulResults.map(r => r.result.data!.last7Days)

    const rainingLocations = successfulResults.filter(r => r.result.data!.current.isRaining).length

    // Build regional breakdown
    const regions = successfulResults.map(r => ({
      name: r.location.name,
      lat: r.location.lat,
      lng: r.location.lng,
      last24Hours: Math.round(r.result.data!.last24Hours * 10) / 10,
      next24Hours: Math.round(r.result.data!.next24Hours * 10) / 10,
      isRaining: r.result.data!.current.isRaining,
    }))

    const summary: StateRainfallSummary = {
      current: {
        precipitation: Math.round((currentPrecip.reduce((a, b) => a + b, 0) / currentPrecip.length) * 10) / 10,
        isRaining: rainingLocations > 0,
        rainingLocations,
      },
      last24Hours: {
        min: Math.round(Math.min(...last24Totals) * 10) / 10,
        max: Math.round(Math.max(...last24Totals) * 10) / 10,
        avg: Math.round((last24Totals.reduce((a, b) => a + b, 0) / last24Totals.length) * 10) / 10,
      },
      next24Hours: {
        min: Math.round(Math.min(...next24Totals) * 10) / 10,
        max: Math.round(Math.max(...next24Totals) * 10) / 10,
        avg: Math.round((next24Totals.reduce((a, b) => a + b, 0) / next24Totals.length) * 10) / 10,
      },
      next7Days: {
        min: Math.round(Math.min(...next7Totals) * 10) / 10,
        max: Math.round(Math.max(...next7Totals) * 10) / 10,
        avg: Math.round((next7Totals.reduce((a, b) => a + b, 0) / next7Totals.length) * 10) / 10,
      },
      // Backward compatibility
      last7Days: Math.round((last7Totals.reduce((a, b) => a + b, 0) / last7Totals.length) * 10) / 10,
      regions,
      fetchedAt: new Date().toISOString(),
      sampleCount: successfulResults.length,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('State rainfall fetch error:', error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Gets rainfall intensity description
 */
export function getRainfallIntensity(mmPerHour: number): string {
  if (mmPerHour === 0) return 'No rain'
  if (mmPerHour < 2.5) return 'Light rain'
  if (mmPerHour < 7.5) return 'Moderate rain'
  if (mmPerHour < 50) return 'Heavy rain'
  return 'Intense rain'
}

/**
 * Gets rainfall risk level based on forecast
 */
export function getRainfallRisk(
  next24Hours: number,
  next7Days: number
): 'low' | 'moderate' | 'high' | 'extreme' {
  // Thresholds based on typical flood-causing rainfall
  if (next24Hours > 100 || next7Days > 300) return 'extreme'
  if (next24Hours > 50 || next7Days > 150) return 'high'
  if (next24Hours > 25 || next7Days > 75) return 'moderate'
  return 'low'
}

const rainfallClient = {
  fetchRainfall,
  fetchRainfallForGauges,
  fetchRegionalRainfall,
  getRainfallIntensity,
  getRainfallRisk,
}

export default rainfallClient
