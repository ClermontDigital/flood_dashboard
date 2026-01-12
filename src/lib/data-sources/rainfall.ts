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
