/**
 * Queensland Water Monitoring Information Portal (WMIP) API Client
 *
 * Fetches water level data from the Queensland Government's WMIP system,
 * using the JSON POST webservice API format (version 2).
 *
 * @see https://water-monitoring.information.qld.gov.au/
 */

import type { WaterLevel, HistoryPoint, Trend, FloodThresholds, DischargeReading } from '@/lib/types'
import { WMIP_BASE_URL } from '@/lib/constants'
import { generateMockWaterLevel, calculateTrend } from '@/lib/utils'

/**
 * Gauge IDs for the Clermont Flood Dashboard monitoring network
 * Updated to use active stations with verified data availability
 */
export const MONITORED_GAUGE_IDS = [
  '130207A', // Sandy Creek @ Clermont
  '130210A', // Theresa Creek @ Valeria
  '130206A', // Theresa Creek @ Gregory Highway
  '130401A', // Isaac River @ Yatton
  '130410A', // Isaac River @ Deverill
  '130408A', // Connors River @ Pink Lagoon
  '130209A', // Nogoa River @ Craigmore
  '130219A', // Nogoa River @ Duck Ponds
  '130230A', // Nogoa River @ Bridge Flats
  '130106A', // Mackenzie River @ Bingegang
  '130105B', // Mackenzie River @ Coolmaringa
  '130113A', // Mackenzie River @ Rileys Crossing
  '130504A', // Comet River @ Comet Weir
  '130005A', // Fitzroy River @ The Gap
  '130003A', // Fitzroy River @ Yaamba
  '1300073', // Fitzroy River @ Barrage (Rockhampton)
  '130010A', // Fitzroy River @ Hanrahan's Crossing
] as const

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
 * WMIP trace data point
 */
interface WMIPTracePoint {
  v: string  // value
  t: number  // timestamp (format: YYYYMMDDHHmmss)
  q: number  // quality code
}

/**
 * WMIP trace response
 */
interface WMIPTraceResponse {
  error_num: number
  error_msg?: string
  site: string
  trace: WMIPTracePoint[]
  site_details?: {
    name: string
    short_name: string
    latitude: string
    longitude: string
    timezone: string
  }
}

/**
 * WMIP variable info
 */
interface WMIPVariable {
  variable: string
  name: string
  units: string
  period_start: string
  period_end: string
}

const API_TIMEOUT = 15000

/**
 * Parses WMIP timestamp format (YYYYMMDDHHmmss) to ISO string
 * Queensland uses AEST (UTC+10), no daylight saving
 */
function parseWMIPTimestamp(wmipTime: number): string {
  const str = wmipTime.toString()

  // Handle different formats
  if (str.length !== 14) {
    console.warn(`[WMIP] Unexpected timestamp format: ${str} (length: ${str.length})`)
    return new Date().toISOString()
  }

  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10) - 1 // JS months are 0-indexed
  const day = parseInt(str.slice(6, 8), 10)
  const hour = parseInt(str.slice(8, 10), 10)
  const minute = parseInt(str.slice(10, 12), 10)
  const second = parseInt(str.slice(12, 14), 10)

  // Create date in UTC, then adjust for AEST (UTC+10)
  // WMIP timestamps are in local Queensland time (AEST = UTC+10)
  const utcMs = Date.UTC(year, month, day, hour - 10, minute, second)
  const date = new Date(utcMs)

  // Validate the date is reasonable (within last 30 days)
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  if (date.getTime() < thirtyDaysAgo || date.getTime() > now + 60000) {
    console.warn(`[WMIP] Timestamp out of range: ${str} -> ${date.toISOString()}`)
  }

  return date.toISOString()
}

/**
 * Formats date to WMIP timestamp format
 */
function toWMIPTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * Makes a POST request to the WMIP API
 * Note: Different WMIP functions require different API versions:
 * - get_site_list: version 1
 * - get_variable_list: version 1
 * - get_ts_traces: version 2
 */
async function wmipPost<T>(functionName: string, params: Record<string, unknown>, version: string = '2'): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(WMIP_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: functionName,
        version,
        params,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`WMIP HTTP ${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Gets available variables and their date ranges for a gauge
 */
async function getVariableInfo(gaugeId: string): Promise<WMIPVariable | null> {
  try {
    const response = await wmipPost<{
      error_num: number
      return?: { sites?: Array<{ variables?: WMIPVariable[] }> }
    }>('get_variable_list', {
      site_list: gaugeId,
      datasource: 'AT',
    }, '1')  // get_variable_list requires version 1

    if (response.error_num !== 0) return null

    const variables = response.return?.sites?.[0]?.variables || []
    // Find Stream Water Level (variable 100.00)
    return variables.find(v => v.variable === '100.00') || null
  } catch {
    return null
  }
}

/**
 * Gets all available variables for a gauge
 */
async function getAllVariables(gaugeId: string): Promise<WMIPVariable[]> {
  try {
    const response = await wmipPost<{
      error_num: number
      return?: { sites?: Array<{ variables?: WMIPVariable[] }> }
    }>('get_variable_list', {
      site_list: gaugeId,
      datasource: 'AT',
    }, '1')

    if (response.error_num !== 0) return []
    return response.return?.sites?.[0]?.variables || []
  } catch {
    return []
  }
}

/**
 * WMIP discharge variable codes
 * 141.00 = Discharge (cumecs)
 * 140.00 = Discharge (ML/d)
 */
const DISCHARGE_VAR_CUMECS = '141.00'
const DISCHARGE_VAR_MLD = '140.00'

/**
 * Fetches water level data for a specific date range
 */
async function fetchWaterLevelData(
  gaugeId: string,
  startTime: string,
  endTime: string
): Promise<WMIPTraceResponse | null> {
  try {
    const response = await wmipPost<{
      error_num: number
      error_msg?: string
      return?: { traces?: WMIPTraceResponse[] }
    }>('get_ts_traces', {
      site_list: gaugeId,
      datasource: 'AT',
      start_time: startTime,
      end_time: endTime,
      varfrom: '100.00',
      varto: '100.00',
      data_type: 'mean',
      interval: 'hour',
      multiplier: '1',
    })

    if (response.error_num !== 0) {
      console.log(`WMIP error for ${gaugeId}: ${response.error_msg}`)
      return null
    }

    const trace = response.return?.traces?.[0]
    if (!trace || trace.error_num !== 0 || !trace.trace?.length) {
      return null
    }

    return trace
  } catch (error) {
    console.error(`WMIP fetch error for ${gaugeId}:`, error)
    return null
  }
}

/**
 * Calculates trend and rate of change from trace data
 * Uses same approach as BOM: (level_diff / time_diff_hours) to get m/hr
 * @see src/lib/data-sources/bom.ts calculateTrend() for reference implementation
 */
function calculateTrendFromTrace(trace: WMIPTracePoint[]): { trend: Trend; changeRate: number } {
  // Filter for valid points (quality code 255 = no data)
  const validPoints = trace.filter(p => p.q !== 255)

  if (validPoints.length < 2) {
    return { trend: 'stable', changeRate: 0 }
  }

  // Get latest and a previous point (~1 hour ago, or closest available)
  const latestPoint = validPoints[validPoints.length - 1]
  // Try to get a point from ~4 readings ago (typically ~1 hour with 15-min intervals)
  const previousIndex = Math.max(0, validPoints.length - 4)
  const previousPoint = validPoints[previousIndex]

  const latestLevel = parseFloat(latestPoint.v)
  const previousLevel = parseFloat(previousPoint.v)

  // Parse timestamps and calculate actual time difference
  const latestTime = new Date(parseWMIPTimestamp(latestPoint.t)).getTime()
  const previousTime = new Date(parseWMIPTimestamp(previousPoint.t)).getTime()
  const timeDiffHours = (latestTime - previousTime) / (1000 * 60 * 60)

  // Avoid division by zero or very small time differences
  if (timeDiffHours <= 0.1) {
    return { trend: 'stable', changeRate: 0 }
  }

  const levelDiff = latestLevel - previousLevel
  const changeRate = levelDiff / timeDiffHours

  // Consider stable if change is less than 0.01m/hr (same threshold as BOM)
  if (Math.abs(changeRate) < 0.01) {
    return { trend: 'stable', changeRate: 0 }
  }

  return {
    trend: changeRate > 0 ? 'rising' : 'falling',
    changeRate: Math.round(changeRate * 100) / 100,  // Round to 2 decimal places
  }
}

/**
 * Known flood thresholds for specific gauges (from BOM flood class levels)
 */
const FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 },   // Sandy Creek @ Clermont
  '130210A': { minor: 3.5, moderate: 5.0, major: 7.0 },   // Theresa Creek @ Valeria
  '130206A': { minor: 3.0, moderate: 4.5, major: 6.0 },   // Theresa Creek @ Gregory Hwy
  '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 },  // Fitzroy @ The Gap
  '130003A': { minor: 6.5, moderate: 8.0, major: 9.5 },   // Fitzroy @ Yaamba
  '1300073': { minor: 6.0, moderate: 7.5, major: 9.0 },   // Fitzroy @ Barrage
  '130106A': { minor: 7.0, moderate: 9.0, major: 11.0 },  // Mackenzie @ Bingegang
  '130105B': { minor: 6.5, moderate: 8.5, major: 10.5 },  // Mackenzie @ Coolmaringa
  '130410A': { minor: 5.5, moderate: 7.0, major: 9.0 },   // Isaac @ Deverill
  '130401A': { minor: 5.0, moderate: 6.5, major: 8.5 },   // Isaac @ Yatton
  '130219A': { minor: 4.5, moderate: 6.0, major: 8.0 },   // Nogoa @ Duck Ponds
  '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Nogoa @ Craigmore
  '130504A': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Comet @ Comet Weir
}

/**
 * Determines flood status based on water level
 */
function determineStatus(level: number, gaugeId: string): WaterLevel['status'] {
  const thresholds = FLOOD_THRESHOLDS[gaugeId] || { minor: 4.0, moderate: 6.0, major: 8.0 }

  if (level >= thresholds.major) return 'danger'
  if (level >= thresholds.moderate) return 'warning'
  if (level >= thresholds.minor) return 'watch'
  return 'safe'
}

/**
 * Fetches current water level for a single gauge
 */
export async function fetchWMIPWaterLevel(gaugeId: string): Promise<WMIPResponse> {
  try {
    // First get the available date range
    const varInfo = await getVariableInfo(gaugeId)

    if (!varInfo) {
      console.log(`No variable info available for gauge ${gaugeId}`)
      return { success: false, data: null, error: 'No data available' }
    }

    // Parse the period end date (format: YYYYMMDDHHmmss)
    const periodEnd = varInfo.period_end
    if (!periodEnd) {
      return { success: false, data: null, error: 'No period end date' }
    }

    // Calculate start time (24 hours before period end)
    const endYear = parseInt(periodEnd.slice(0, 4))
    const endMonth = parseInt(periodEnd.slice(4, 6)) - 1
    const endDay = parseInt(periodEnd.slice(6, 8))
    const endHour = parseInt(periodEnd.slice(8, 10))
    const endMinute = parseInt(periodEnd.slice(10, 12))
    const endSecond = parseInt(periodEnd.slice(12, 14))

    const endDate = new Date(endYear, endMonth, endDay, endHour, endMinute, endSecond)
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

    const startTime = toWMIPTimestamp(startDate)
    const endTime = periodEnd

    // Fetch the trace data
    const trace = await fetchWaterLevelData(gaugeId, startTime, endTime)

    if (!trace || !trace.trace?.length) {
      return { success: false, data: null, error: 'No trace data' }
    }

    // Filter for valid data points (quality code 255 = no data, skip those)
    // Also filter out zero values with quality 255
    const validPoints = trace.trace.filter(p => p.q !== 255 && !(p.q === 255 && parseFloat(p.v) === 0))

    if (validPoints.length === 0) {
      return { success: false, data: null, error: 'No valid data points' }
    }

    const latestPoint = validPoints[validPoints.length - 1]
    const level = parseFloat(latestPoint.v)
    const timestamp = parseWMIPTimestamp(latestPoint.t)
    const { trend, changeRate } = calculateTrendFromTrace(trace.trace)

    const waterLevel: WaterLevel = {
      gaugeId,
      level,
      unit: 'm',
      timestamp,
      trend,
      changeRate,
      status: determineStatus(level, gaugeId),
      source: 'wmip',
    }

    return { success: true, data: waterLevel }
  } catch (error) {
    console.error(`WMIP error for gauge ${gaugeId}:`, error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Fetches historical water level data for a gauge
 */
export async function fetchWMIPHistory(
  gaugeId: string,
  hoursBack: number = 24
): Promise<WMIPHistoryResponse> {
  try {
    const varInfo = await getVariableInfo(gaugeId)

    if (!varInfo || !varInfo.period_end) {
      return { success: false, data: [], error: 'No data available' }
    }

    // Parse period end and calculate start
    const periodEnd = varInfo.period_end
    const endYear = parseInt(periodEnd.slice(0, 4))
    const endMonth = parseInt(periodEnd.slice(4, 6)) - 1
    const endDay = parseInt(periodEnd.slice(6, 8))
    const endHour = parseInt(periodEnd.slice(8, 10))
    const endMinute = parseInt(periodEnd.slice(10, 12))
    const endSecond = parseInt(periodEnd.slice(12, 14))

    const endDate = new Date(endYear, endMonth, endDay, endHour, endMinute, endSecond)
    const startDate = new Date(endDate.getTime() - hoursBack * 60 * 60 * 1000)

    const startTime = toWMIPTimestamp(startDate)
    const endTime = periodEnd

    const trace = await fetchWaterLevelData(gaugeId, startTime, endTime)

    if (!trace || !trace.trace?.length) {
      return { success: false, data: [], error: 'No trace data' }
    }

    // Filter out invalid data points (quality code 255 = no data)
    const validPoints = trace.trace.filter(p => p.q !== 255)

    if (validPoints.length === 0) {
      return { success: false, data: [], error: 'No valid data points' }
    }

    const history: HistoryPoint[] = validPoints.map(point => ({
      timestamp: parseWMIPTimestamp(point.t),
      level: parseFloat(point.v),
    }))

    return { success: true, data: history }
  } catch (error) {
    return { success: false, data: [], error: String(error) }
  }
}

/**
 * Fetches water levels for multiple gauges
 */
export async function fetchWMIPMultipleGauges(
  gaugeIds: string[] = [...MONITORED_GAUGE_IDS]
): Promise<Map<string, WMIPResponse>> {
  const results = new Map<string, WMIPResponse>()

  // Fetch in parallel with concurrency limit
  const batchSize = 5
  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (gaugeId) => {
        const result = await fetchWMIPWaterLevel(gaugeId)
        return { gaugeId, result }
      })
    )

    for (const { gaugeId, result } of batchResults) {
      results.set(gaugeId, result)
    }
  }

  return results
}

/**
 * Fetches flood thresholds for a gauge
 */
export function fetchWMIPThresholds(gaugeId: string): FloodThresholds | null {
  return FLOOD_THRESHOLDS[gaugeId] || null
}

/**
 * Gets datasources available for a gauge
 */
export async function getGaugeDatasources(gaugeId: string): Promise<string[]> {
  try {
    const response = await wmipPost<{
      error_num: number
      return?: { sites?: Array<{ datasources?: string[] }> }
    }>('get_datasources_by_site', {
      site_list: gaugeId,
    }, '1')  // get_datasources_by_site requires version 1

    if (response.error_num !== 0) return []
    return response.return?.sites?.[0]?.datasources || []
  } catch {
    return []
  }
}

const wmipClient = {
  fetchWMIPWaterLevel,
  fetchWMIPHistory,
  fetchWMIPMultipleGauges,
  fetchWMIPThresholds,
  getGaugeDatasources,
  MONITORED_GAUGE_IDS,
}

export default wmipClient
