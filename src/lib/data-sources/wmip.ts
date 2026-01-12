/**
 * Queensland Water Monitoring Information Portal (WMIP) API Client
 *
 * Fetches water level data from the Queensland Government's WMIP system,
 * which uses the Kisters WISKI web services format.
 *
 * @see https://water-monitoring.information.qld.gov.au/
 */

import type { WaterLevel, HistoryPoint, Trend, FloodThresholds } from '@/lib/types'
import { WMIP_BASE_URL } from '@/lib/constants'
import { generateMockWaterLevel, calculateTrend } from '@/lib/utils'

/**
 * Gauge IDs for the Clermont Flood Dashboard monitoring network
 */
export const MONITORED_GAUGE_IDS = [
  '130212A', // Theresa Creek @ Gregory Hwy
  '130207A', // Sandy Creek @ Clermont
  '120311A', // Clermont Alpha Rd
  '130401A', // Isaac River @ Yatton
  '130410A', // Isaac River @ Deverill
  '130408A', // Connors River @ Pink Lagoon
  '130209A', // Nogoa River @ Craigmore
  '130219A', // Nogoa River @ Duck Ponds
  '130204A', // Retreat Creek @ Dunrobin
  '130106A', // Mackenzie River @ Bingegang
  '130105B', // Mackenzie River @ Coolmaringa
  '130113A', // Mackenzie River @ Rileys Crossing
  '130504A', // Comet River @ Comet Weir
  '130502A', // Comet River @ The Lake
  '130004A', // Fitzroy River @ The Gap
  '130003A', // Fitzroy River @ Yaamba
  '130005A', // Fitzroy River @ Rockhampton
] as const

/**
 * WMIP API response types for Kisters WISKI web services
 */
interface WMIPTimeSeriesValue {
  Timestamp: string
  Value: number
  Quality: number
}

interface WMIPTimeSeries {
  ts_id: string
  ts_name: string
  station_id: string
  station_name: string
  parametertype_name: string
  ts_unitname: string
  data: WMIPTimeSeriesValue[]
}

interface WMIPGetTimeSeriesValuesResponse {
  type: string
  version: string
  rows: number
  cols: number
  data: WMIPTimeSeries[]
}

interface WMIPStationInfo {
  station_id: string
  station_name: string
  station_latitude: number
  station_longitude: number
  ts_id: string
  ts_name: string
  parametertype_name: string
}

interface WMIPGetStationListResponse {
  type: string
  version: string
  rows: number
  data: WMIPStationInfo[]
}

/**
 * Response wrapper for WMIP API calls
 */
export interface WMIPResponse {
  success: boolean
  data: WaterLevel | null
  error?: string
}

/**
 * Response wrapper for WMIP history API calls
 */
export interface WMIPHistoryResponse {
  success: boolean
  data: HistoryPoint[]
  error?: string
}

/**
 * API request timeout in milliseconds
 */
const API_TIMEOUT = 10000

/**
 * Creates an AbortController with timeout
 *
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns AbortController instance
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller
}

/**
 * Builds a WMIP API URL with the specified parameters using Kisters WISKI format
 *
 * @param action - The API action (e.g., 'getTimeseriesValues', 'getStationList')
 * @param params - Additional query parameters
 * @returns The complete API URL
 */
function buildWMIPUrl(action: string, params: Record<string, string>): string {
  const url = new URL(WMIP_BASE_URL)
  url.searchParams.set('service', 'kisters')
  url.searchParams.set('type', 'queryServices')
  url.searchParams.set('request', action)
  url.searchParams.set('format', 'json')

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}

/**
 * Determines the trend from a series of readings
 *
 * @param readings - Array of readings with timestamp and value
 * @returns The calculated trend and change rate
 */
function determineTrend(readings: WMIPTimeSeriesValue[]): { trend: Trend; changeRate: number } {
  if (readings.length < 2) {
    return { trend: 'stable', changeRate: 0 }
  }

  // Sort by timestamp descending (most recent first)
  const sorted = [...readings].sort(
    (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
  )

  const current = sorted[0]
  // Use reading from approximately 1 hour ago if available (4 readings at 15-min intervals)
  const previousIndex = Math.min(sorted.length - 1, 4)
  const previous = sorted[previousIndex]

  const currentTime = new Date(current.Timestamp).getTime()
  const previousTime = new Date(previous.Timestamp).getTime()
  const hoursDiff = (currentTime - previousTime) / (1000 * 60 * 60)

  if (hoursDiff === 0) {
    return { trend: 'stable', changeRate: 0 }
  }

  const changeRate = (current.Value - previous.Value) / hoursDiff
  const trend = calculateTrend(current.Value, previous.Value, hoursDiff)

  return { trend, changeRate }
}

/**
 * Determines flood status based on water level
 * Uses station-specific thresholds when available, otherwise defaults
 *
 * @param level - The water level in meters
 * @param gaugeId - The gauge identifier for station-specific thresholds
 * @returns The flood status
 */
function determineStatus(level: number, gaugeId: string): WaterLevel['status'] {
  // Known thresholds for specific gauges (from BOM flood class levels)
  const knownThresholds: Record<string, FloodThresholds> = {
    '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 },   // Sandy Creek @ Clermont
    '130212A': { minor: 3.0, moderate: 4.5, major: 6.0 },   // Theresa Creek @ Gregory Hwy
    '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 },  // Fitzroy @ The Gap
    '130003A': { minor: 6.5, moderate: 8.0, major: 9.5 },   // Fitzroy @ Yaamba
    '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 },  // Fitzroy @ Rockhampton
  }

  const thresholds = knownThresholds[gaugeId] || {
    minor: 4.0,
    moderate: 6.0,
    major: 8.0,
  }

  if (level >= thresholds.major) return 'danger'
  if (level >= thresholds.moderate) return 'warning'
  if (level >= thresholds.minor) return 'watch'
  return 'safe'
}

/**
 * Fetches current water level readings for specified gauges from WMIP
 *
 * @param gaugeIds - Array of gauge station IDs to fetch
 * @returns Array of water level readings, or null values for failed fetches
 *
 * @example
 * ```typescript
 * const readings = await fetchCurrentWaterLevels(['130207A', '130212A'])
 * readings.forEach(reading => {
 *   if (reading) {
 *     console.log(`${reading.gaugeId}: ${reading.level}m`)
 *   }
 * })
 * ```
 */
export async function fetchCurrentWaterLevels(
  gaugeIds: string[] = [...MONITORED_GAUGE_IDS]
): Promise<(WaterLevel | null)[]> {
  const results: (WaterLevel | null)[] = []

  // Fetch data for each gauge
  for (const gaugeId of gaugeIds) {
    try {
      const reading = await fetchGaugeReading(gaugeId)
      results.push(reading)
    } catch (error) {
      console.error(`Failed to fetch water level for gauge ${gaugeId}:`, error)
      // Return mock data in development if API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Using mock data for gauge ${gaugeId}`)
        results.push(generateMockWaterLevel(gaugeId))
      } else {
        results.push(null)
      }
    }
  }

  return results
}

/**
 * Fetches the current reading for a single gauge
 *
 * @param gaugeId - The gauge station ID
 * @returns The water level reading or null if unavailable
 */
export async function fetchGaugeReading(gaugeId: string): Promise<WaterLevel | null> {
  try {
    const controller = createTimeoutController(API_TIMEOUT)

    // Get the last 2 hours of data to calculate trend
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    const url = buildWMIPUrl('getTimeseriesValues', {
      ts_id: `${gaugeId}.Water Level.15min.Master`,
      from: twoHoursAgo.toISOString(),
      to: now.toISOString(),
      returnfields: 'Timestamp,Value,Quality',
    })

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WMIP API returned ${response.status}: ${response.statusText}`)
    }

    const data: WMIPGetTimeSeriesValuesResponse = await response.json()

    if (!data.data || data.data.length === 0 || !data.data[0].data || data.data[0].data.length === 0) {
      console.warn(`No data available for gauge ${gaugeId}`)
      return null
    }

    const timeSeries = data.data[0]
    const readings = timeSeries.data

    // Get the most recent reading
    const sortedReadings = [...readings].sort(
      (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    )
    const latestReading = sortedReadings[0]

    // Calculate trend
    const { trend, changeRate } = determineTrend(readings)

    // Determine status
    const status = determineStatus(latestReading.Value, gaugeId)

    return {
      gaugeId,
      level: latestReading.Value,
      unit: timeSeries.ts_unitname || 'm',
      trend,
      changeRate,
      status,
      timestamp: latestReading.Timestamp,
      source: 'wmip',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for gauge ${gaugeId}`)
    } else {
      console.error(`Error fetching gauge ${gaugeId}:`, error)
    }

    // Return mock data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Using mock data for gauge ${gaugeId}`)
      return generateMockWaterLevel(gaugeId)
    }

    return null
  }
}

/**
 * Fetches 24-hour historical data for a gauge
 *
 * @param gaugeId - The gauge station ID
 * @returns Array of historical data points or null if unavailable
 *
 * @example
 * ```typescript
 * const history = await fetch24HourHistory('130207A')
 * if (history) {
 *   console.log(`Retrieved ${history.length} data points`)
 * }
 * ```
 */
export async function fetch24HourHistory(gaugeId: string): Promise<HistoryPoint[] | null> {
  try {
    const controller = createTimeoutController(API_TIMEOUT)

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const url = buildWMIPUrl('getTimeseriesValues', {
      ts_id: `${gaugeId}.Water Level.15min.Master`,
      from: twentyFourHoursAgo.toISOString(),
      to: now.toISOString(),
      returnfields: 'Timestamp,Value,Quality',
    })

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WMIP API returned ${response.status}: ${response.statusText}`)
    }

    const data: WMIPGetTimeSeriesValuesResponse = await response.json()

    if (!data.data || data.data.length === 0 || !data.data[0].data) {
      console.warn(`No historical data available for gauge ${gaugeId}`)
      return null
    }

    const readings = data.data[0].data

    // Convert to HistoryPoint format and sort chronologically
    const historyPoints: HistoryPoint[] = readings
      .map((reading) => ({
        timestamp: reading.Timestamp,
        level: reading.Value,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return historyPoints
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for historical data for gauge ${gaugeId}`)
    } else {
      console.error(`Error fetching historical data for gauge ${gaugeId}:`, error)
    }

    // Return mock historical data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Using mock historical data for gauge ${gaugeId}`)
      return generateMockHistory(gaugeId)
    }

    return null
  }
}

/**
 * Fetches historical data for a specified time range
 *
 * @param gaugeId - The gauge station ID
 * @param fromDate - Start date for the range
 * @param toDate - End date for the range
 * @returns Array of historical data points or null if unavailable
 */
export async function fetchHistoricalRange(
  gaugeId: string,
  fromDate: Date,
  toDate: Date
): Promise<HistoryPoint[] | null> {
  try {
    const controller = createTimeoutController(API_TIMEOUT)

    const url = buildWMIPUrl('getTimeseriesValues', {
      ts_id: `${gaugeId}.Water Level.15min.Master`,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      returnfields: 'Timestamp,Value,Quality',
    })

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WMIP API returned ${response.status}: ${response.statusText}`)
    }

    const data: WMIPGetTimeSeriesValuesResponse = await response.json()

    if (!data.data || data.data.length === 0 || !data.data[0].data) {
      console.warn(`No historical data available for gauge ${gaugeId} in specified range`)
      return null
    }

    const readings = data.data[0].data

    const historyPoints: HistoryPoint[] = readings
      .map((reading) => ({
        timestamp: reading.Timestamp,
        level: reading.Value,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    return historyPoints
  } catch (error) {
    console.error(`Error fetching historical range for gauge ${gaugeId}:`, error)
    return null
  }
}

/**
 * Fetches water levels for all monitored gauges
 *
 * @returns Map of gauge IDs to their water level readings
 */
export async function fetchAllMonitoredGauges(): Promise<Map<string, WaterLevel | null>> {
  const results = new Map<string, WaterLevel | null>()

  const readings = await fetchCurrentWaterLevels([...MONITORED_GAUGE_IDS])

  MONITORED_GAUGE_IDS.forEach((gaugeId, index) => {
    results.set(gaugeId, readings[index])
  })

  return results
}

/**
 * Batch fetches water levels for multiple gauges efficiently
 * Uses parallel requests with rate limiting
 *
 * @param gaugeIds - Array of gauge station IDs
 * @param batchSize - Number of concurrent requests (default: 5)
 * @returns Map of gauge IDs to their water level readings
 */
export async function batchFetchWaterLevels(
  gaugeIds: string[],
  batchSize: number = 5
): Promise<Map<string, WaterLevel | null>> {
  const results = new Map<string, WaterLevel | null>()

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)
    const batchPromises = batch.map((gaugeId) => fetchGaugeReading(gaugeId))
    const batchResults = await Promise.all(batchPromises)

    batch.forEach((gaugeId, index) => {
      results.set(gaugeId, batchResults[index])
    })

    // Small delay between batches to be respectful to the API
    if (i + batchSize < gaugeIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Checks if the WMIP API is available
 *
 * @returns True if the API is responding, false otherwise
 */
export async function checkWMIPAvailability(): Promise<boolean> {
  try {
    const controller = createTimeoutController(5000)

    const url = buildWMIPUrl('getStationList', {
      station_id: MONITORED_GAUGE_IDS[0],
    })

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Generates mock historical data for development purposes
 *
 * @param gaugeId - The gauge station ID
 * @returns Array of mock historical data points
 */
function generateMockHistory(gaugeId: string): HistoryPoint[] {
  const points: HistoryPoint[] = []
  const now = new Date()
  const baseLevel = 2 + Math.random() * 2

  // Generate 96 points (15-minute intervals over 24 hours)
  for (let i = 96; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000)
    // Add some realistic variation with sine wave pattern
    const variation = Math.sin(i / 10) * 0.5 + (Math.random() - 0.5) * 0.2
    points.push({
      timestamp: timestamp.toISOString(),
      level: Math.max(0, baseLevel + variation),
    })
  }

  return points
}

/**
 * Gets station information from WMIP
 *
 * @param gaugeId - The gauge station ID
 * @returns Station information or null if unavailable
 */
export async function getStationInfo(gaugeId: string): Promise<WMIPStationInfo | null> {
  try {
    const controller = createTimeoutController(API_TIMEOUT)

    const url = buildWMIPUrl('getStationList', {
      station_id: gaugeId,
      returnfields: 'station_id,station_name,station_latitude,station_longitude,ts_id,ts_name,parametertype_name',
    })

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WMIP API returned ${response.status}: ${response.statusText}`)
    }

    const data: WMIPGetStationListResponse = await response.json()

    if (!data.data || data.data.length === 0) {
      return null
    }

    return data.data[0]
  } catch (error) {
    console.error(`Error fetching station info for ${gaugeId}:`, error)
    return null
  }
}

/**
 * Fetches flood thresholds for a gauge
 * Returns known thresholds from BOM flood class levels
 *
 * @param gaugeId - The gauge station ID
 * @returns Flood thresholds or null if not available
 */
export async function fetchWMIPThresholds(gaugeId: string): Promise<FloodThresholds | null> {
  // Known thresholds for specific gauges (from BOM flood class levels)
  const knownThresholds: Record<string, FloodThresholds> = {
    '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 },   // Sandy Creek @ Clermont
    '130212A': { minor: 3.0, moderate: 4.5, major: 6.0 },   // Theresa Creek @ Gregory Hwy
    '120311A': { minor: 3.5, moderate: 5.0, major: 6.5 },   // Clermont Alpha Rd
    '130401A': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Isaac River @ Yatton
    '130410A': { minor: 6.0, moderate: 8.0, major: 10.0 },  // Isaac River @ Deverill
    '130408A': { minor: 5.5, moderate: 7.5, major: 9.5 },   // Connors River @ Pink Lagoon
    '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Nogoa River @ Craigmore
    '130219A': { minor: 4.5, moderate: 6.5, major: 8.5 },   // Nogoa River @ Duck Ponds
    '130204A': { minor: 3.5, moderate: 5.0, major: 6.5 },   // Retreat Creek @ Dunrobin
    '130106A': { minor: 8.0, moderate: 10.0, major: 12.0 }, // Mackenzie River @ Bingegang
    '130105B': { minor: 7.0, moderate: 9.0, major: 11.0 },  // Mackenzie River @ Coolmaringa
    '130113A': { minor: 6.0, moderate: 8.0, major: 10.0 },  // Mackenzie River @ Rileys Crossing
    '130504A': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Comet River @ Comet Weir
    '130502A': { minor: 4.5, moderate: 6.5, major: 8.5 },   // Comet River @ The Lake
    '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 },  // Fitzroy @ The Gap
    '130003A': { minor: 6.5, moderate: 8.0, major: 9.5 },   // Fitzroy @ Yaamba
    '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 },  // Fitzroy @ Rockhampton
  }

  return knownThresholds[gaugeId] || null
}

/**
 * Legacy function for backwards compatibility
 * Wraps fetchGaugeReading in the WMIPResponse format
 *
 * @param gaugeId - The gauge station ID
 * @returns WMIPResponse with water level data
 */
export async function fetchWMIPWaterLevel(gaugeId: string): Promise<WMIPResponse> {
  try {
    const data = await fetchGaugeReading(gaugeId)
    return {
      success: data !== null,
      data,
      error: data === null ? 'No data available' : undefined,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Legacy function for backwards compatibility
 * Wraps fetch24HourHistory in the WMIPHistoryResponse format
 *
 * @param gaugeId - The gauge station ID
 * @param hoursBack - Number of hours of history to fetch (default: 24)
 * @returns WMIPHistoryResponse with historical data
 */
export async function fetchWMIPHistory(
  gaugeId: string,
  hoursBack: number = 24
): Promise<WMIPHistoryResponse> {
  try {
    const now = new Date()
    const fromDate = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

    const data = await fetchHistoricalRange(gaugeId, fromDate, now)
    return {
      success: data !== null,
      data: data || [],
      error: data === null ? 'No data available' : undefined,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Legacy function for backwards compatibility
 * Wraps batchFetchWaterLevels for multiple gauges
 *
 * @param gaugeIds - Array of gauge station IDs
 * @returns Map of gauge IDs to WMIPResponse
 */
export async function fetchWMIPMultipleGauges(
  gaugeIds: string[]
): Promise<Map<string, WMIPResponse>> {
  const results = new Map<string, WMIPResponse>()
  const waterLevels = await batchFetchWaterLevels(gaugeIds)

  for (const [gaugeId, data] of waterLevels) {
    results.set(gaugeId, {
      success: data !== null,
      data,
      error: data === null ? 'No data available' : undefined,
    })
  }

  return results
}
