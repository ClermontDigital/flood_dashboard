/**
 * Open-Meteo Flood API Client
 *
 * Fetches river discharge forecasts from Open-Meteo's GloFAS-based Flood API.
 * Provides 7-day forecasts and historical data for flood prediction.
 *
 * @see https://open-meteo.com/en/docs/flood-api
 * @license Data is available under CC BY 4.0
 */

export interface FloodForecast {
  latitude: number
  longitude: number
  elevation: number
  daily: {
    time: string[]
    river_discharge: number[]
    river_discharge_mean: number[]
    river_discharge_max: number[]
  }
}

export interface GaugeFloodData {
  gaugeId: string
  current: number // Current discharge m³/s
  forecast: {
    date: string
    discharge: number
    dischargeMean: number
    dischargeMax: number
  }[]
  trend: 'rising' | 'falling' | 'stable'
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
  timestamp: string
}

export interface FloodDataResponse {
  success: boolean
  data: GaugeFloodData | null
  error?: string
}

const API_BASE = 'https://flood-api.open-meteo.com/v1/flood'
const API_TIMEOUT = 15000

/**
 * Determine flood risk level based on discharge values
 * These thresholds are approximate - real thresholds vary by river
 */
function calculateRiskLevel(
  current: number,
  max: number
): 'low' | 'moderate' | 'high' | 'extreme' {
  // Use the max forecast value to determine risk
  const peakValue = Math.max(current, max)

  // These are general thresholds - rivers have different characteristics
  if (peakValue > 1000) return 'extreme'
  if (peakValue > 500) return 'high'
  if (peakValue > 100) return 'moderate'
  return 'low'
}

/**
 * Calculate trend from discharge forecast
 */
function calculateTrend(
  values: number[]
): 'rising' | 'falling' | 'stable' {
  if (values.length < 2) return 'stable'

  const current = values[0]
  const next = values[1]
  const diff = next - current
  const threshold = current * 0.1 // 10% change threshold

  if (diff > threshold) return 'rising'
  if (diff < -threshold) return 'falling'
  return 'stable'
}

/**
 * Fetch flood/discharge forecast for a single location
 */
export async function fetchFloodForecast(
  lat: number,
  lng: number,
  forecastDays: number = 7,
  pastDays: number = 1
): Promise<FloodForecast | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      daily: 'river_discharge,river_discharge_mean,river_discharge_max',
      forecast_days: forecastDays.toString(),
      past_days: pastDays.toString(),
      timezone: 'Australia/Brisbane',
    })

    const response = await fetch(`${API_BASE}?${params}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[Flood API] HTTP ${response.status}`)
      return null
    }

    const data = await response.json()
    return data as FloodForecast
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Flood API] Request timeout')
    } else {
      console.error('[Flood API] Error:', error)
    }
    return null
  }
}

/**
 * Fetch flood data for a gauge station
 */
export async function fetchGaugeFloodData(
  gaugeId: string,
  lat: number,
  lng: number
): Promise<FloodDataResponse> {
  try {
    const forecast = await fetchFloodForecast(lat, lng)

    if (!forecast || !forecast.daily?.river_discharge) {
      return {
        success: false,
        data: null,
        error: 'No flood data available for this location',
      }
    }

    const { daily } = forecast
    const current = daily.river_discharge[0] || 0
    const maxForecast = Math.max(...daily.river_discharge_max)

    const gaugeData: GaugeFloodData = {
      gaugeId,
      current,
      forecast: daily.time.map((date, i) => ({
        date,
        discharge: daily.river_discharge[i],
        dischargeMean: daily.river_discharge_mean[i],
        dischargeMax: daily.river_discharge_max[i],
      })),
      trend: calculateTrend(daily.river_discharge),
      riskLevel: calculateRiskLevel(current, maxForecast),
      timestamp: new Date().toISOString(),
    }

    return { success: true, data: gaugeData }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch flood data for multiple gauge stations
 */
export async function fetchMultipleGaugeFloodData(
  gauges: { id: string; lat: number; lng: number }[]
): Promise<Map<string, GaugeFloodData>> {
  const results = new Map<string, GaugeFloodData>()

  // Batch request - Open-Meteo supports multiple coordinates
  if (gauges.length === 0) return results

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const lats = gauges.map((g) => g.lat).join(',')
    const lngs = gauges.map((g) => g.lng).join(',')

    const params = new URLSearchParams({
      latitude: lats,
      longitude: lngs,
      daily: 'river_discharge,river_discharge_mean,river_discharge_max',
      forecast_days: '7',
      past_days: '1',
      timezone: 'Australia/Brisbane',
    })

    const response = await fetch(`${API_BASE}?${params}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[Flood API] Batch request HTTP ${response.status}`)
      return results
    }

    const data = await response.json()

    // Response is array when multiple locations
    const forecasts: FloodForecast[] = Array.isArray(data) ? data : [data]

    forecasts.forEach((forecast, index) => {
      if (index < gauges.length && forecast.daily?.river_discharge) {
        const gauge = gauges[index]
        const { daily } = forecast
        const current = daily.river_discharge[0] || 0
        const maxForecast = Math.max(...daily.river_discharge_max)

        results.set(gauge.id, {
          gaugeId: gauge.id,
          current,
          forecast: daily.time.map((date, i) => ({
            date,
            discharge: daily.river_discharge[i],
            dischargeMean: daily.river_discharge_mean[i],
            dischargeMax: daily.river_discharge_max[i],
          })),
          trend: calculateTrend(daily.river_discharge),
          riskLevel: calculateRiskLevel(current, maxForecast),
          timestamp: new Date().toISOString(),
        })
      }
    })

    console.log(`[Flood API] Retrieved data for ${results.size}/${gauges.length} gauges`)
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[Flood API] Batch request error:', error)
  }

  return results
}

/**
 * Data source attribution
 */
export const FLOOD_API_ATTRIBUTION = {
  name: 'Open-Meteo Flood API',
  url: 'https://open-meteo.com/en/docs/flood-api',
  dataSource: 'GloFAS (Global Flood Awareness System)',
  dataSourceUrl: 'https://www.globalfloods.eu/',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
}

const openMeteoFloodClient = {
  fetchFloodForecast,
  fetchGaugeFloodData,
  fetchMultipleGaugeFloodData,
  FLOOD_API_ATTRIBUTION,
}

export default openMeteoFloodClient
