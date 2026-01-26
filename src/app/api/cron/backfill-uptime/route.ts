/**
 * Backfill Gauge Uptime API Route
 * POST /api/cron/backfill-uptime
 *
 * One-time script to backfill 7 days of uptime data from historical WMIP readings.
 * Analyzes gaps in gauge reporting timestamps to calculate historical uptime.
 */

import { NextResponse, NextRequest } from 'next/server'
import { GAUGE_STATIONS } from '@/lib/constants'
import { getDb } from '@/lib/firestore'
import type { DailyUptimeStat } from '@/lib/types'

// WMIP API configuration
const WMIP_BASE_URL = 'https://water-monitoring.information.qld.gov.au/cgi/webservice.exe'
const API_TIMEOUT = 30000

// Default reporting interval in minutes (most gauges report every 15 min)
const DEFAULT_INTERVAL_MINUTES = 15

/**
 * Detect the reporting interval from trace data timestamps
 * Uses two methods: analyzing gaps between readings AND counting reports per day
 * Returns the detected interval in minutes, or the default if unable to detect
 */
function detectReportingInterval(traceData: WMIPTracePoint[]): number {
  // Filter valid points and sort by timestamp
  const validPoints = traceData
    .filter(p => p.q !== 255)
    .sort((a, b) => a.t - b.t)

  if (validPoints.length < 10) {
    // Not enough data points to reliably detect interval
    return DEFAULT_INTERVAL_MINUTES
  }

  // METHOD 1: Count reports per day, weighted towards recent days
  // Recent reporting pattern is more relevant than historical
  const readingsByDate = new Map<string, number>()
  for (const point of validPoints) {
    const date = parseWMIPTimestamp(point.t)
    if (!date) continue
    const dateStr = toAESTDateString(date)
    readingsByDate.set(dateStr, (readingsByDate.get(dateStr) || 0) + 1)
  }

  // Get daily counts sorted by date (oldest first)
  const sortedDates = Array.from(readingsByDate.keys()).sort()
  const dailyCounts = sortedDates.map(d => readingsByDate.get(d) || 0)

  // Remove first and last day as they may be partial
  const completeDayCounts = dailyCounts.slice(1, -1)

  if (completeDayCounts.length >= 3) {
    // Use the most recent 3 complete days to determine interval
    // This handles gauges that changed their reporting frequency
    const recentCounts = completeDayCounts.slice(-3)
    const recentAvg = recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length

    // Determine interval based on recent average reports per day
    // ~24 reports/day = 60 min interval
    // ~48 reports/day = 30 min interval
    // ~96 reports/day = 15 min interval
    if (recentAvg >= 18 && recentAvg <= 30) {
      console.log(`[Backfill] Detected 60-min interval from recent avg ${recentAvg.toFixed(1)} reports/day`)
      return 60
    }
    if (recentAvg >= 40 && recentAvg <= 56) {
      console.log(`[Backfill] Detected 30-min interval from recent avg ${recentAvg.toFixed(1)} reports/day`)
      return 30
    }
    if (recentAvg >= 80 && recentAvg <= 110) {
      console.log(`[Backfill] Detected 15-min interval from recent avg ${recentAvg.toFixed(1)} reports/day`)
      return 15
    }
  }

  // METHOD 2: Analyze gaps between readings (fallback)
  const intervals: number[] = []
  for (let i = 1; i < validPoints.length; i++) {
    const prevTime = parseWMIPTimestamp(validPoints[i - 1].t)
    const currTime = parseWMIPTimestamp(validPoints[i].t)
    if (!prevTime || !currTime) continue

    const diffMs = currTime.getTime() - prevTime.getTime()
    const diffMinutes = Math.round(diffMs / (1000 * 60))

    // Only consider reasonable intervals (5 min to 2 hours)
    if (diffMinutes >= 5 && diffMinutes <= 120) {
      intervals.push(diffMinutes)
    }
  }

  if (intervals.length < 5) {
    return DEFAULT_INTERVAL_MINUTES
  }

  // Find the most common interval (mode)
  const frequencyMap = new Map<number, number>()
  for (const interval of intervals) {
    // Round to nearest 5 minutes to group similar intervals
    const rounded = Math.round(interval / 5) * 5
    frequencyMap.set(rounded, (frequencyMap.get(rounded) || 0) + 1)
  }

  // Find the interval with highest frequency
  let modeInterval = DEFAULT_INTERVAL_MINUTES
  let maxCount = 0
  for (const [interval, count] of frequencyMap) {
    if (count > maxCount) {
      maxCount = count
      modeInterval = interval
    }
  }

  // Validate and normalize to standard intervals
  if (modeInterval >= 50 && modeInterval <= 70) return 60
  if (modeInterval >= 25 && modeInterval <= 35) return 30
  if (modeInterval >= 10 && modeInterval <= 20) return 15

  return DEFAULT_INTERVAL_MINUTES
}

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

interface WMIPTracePoint {
  v: string  // value
  t: number  // timestamp (format: YYYYMMDDHHmmss)
  q: number  // quality code (255 = no data)
}

interface WMIPVariable {
  variable: string
  name: string
  units: string
  period_start: string
  period_end: string
}

/**
 * Verify the request is authorized
 */
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && CRON_SECRET && cronSecret === CRON_SECRET) {
    return true
  }

  if (!CRON_SECRET && process.env.NODE_ENV === 'development') {
    return true
  }

  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.includes('Google-Cloud-Scheduler')) {
    return true
  }

  return false
}

/**
 * Makes a POST request to the WMIP API
 */
async function wmipPost<T>(functionName: string, params: Record<string, unknown>, version: string = '2'): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(WMIP_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 * Convert date to AEST date string (YYYY-MM-DD)
 */
function toAESTDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Australia/Brisbane',
  })
}

/**
 * Format date to WMIP timestamp format (YYYYMMDDHHmmss)
 */
function toWMIPTimestamp(date: Date): string {
  // Convert to AEST for WMIP
  const aestDate = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Brisbane' }))
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${aestDate.getFullYear()}${pad(aestDate.getMonth() + 1)}${pad(aestDate.getDate())}${pad(aestDate.getHours())}${pad(aestDate.getMinutes())}${pad(aestDate.getSeconds())}`
}

/**
 * Parse WMIP timestamp to Date object
 * Returns null for invalid timestamps instead of silently returning current time
 */
function parseWMIPTimestamp(wmipTime: number): Date | null {
  const str = wmipTime.toString()
  if (str.length !== 14) {
    console.warn(`[Backfill] Invalid WMIP timestamp format: ${str}`)
    return null
  }

  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10) - 1
  const day = parseInt(str.slice(6, 8), 10)
  const hour = parseInt(str.slice(8, 10), 10)
  const minute = parseInt(str.slice(10, 12), 10)
  const second = parseInt(str.slice(12, 14), 10)

  // WMIP timestamps are in AEST (UTC+10, no daylight saving in Queensland)
  const utcMs = Date.UTC(year, month, day, hour - 10, minute, second)
  return new Date(utcMs)
}

/**
 * Get available variables for a gauge (to find data range)
 */
async function getVariableInfo(gaugeId: string): Promise<WMIPVariable | null> {
  try {
    const response = await wmipPost<{
      error_num: number
      return?: { sites?: Array<{ variables?: WMIPVariable[] }> }
    }>('get_variable_list', {
      site_list: gaugeId,
      datasource: 'AT',
    }, '1')

    if (response.error_num !== 0) return null

    const variables = response.return?.sites?.[0]?.variables || []
    return variables.find(v => v.variable === '100.00') || null
  } catch {
    return null
  }
}

/**
 * Fetch historical trace data for a gauge
 */
async function fetchHistoricalTrace(
  gaugeId: string,
  startTime: string,
  endTime: string
): Promise<WMIPTracePoint[]> {
  try {
    // Fetch RAW data (no aggregation) to detect actual gaps
    // Most gauges report every 15 minutes
    const response = await wmipPost<{
      error_num: number
      return?: { traces?: Array<{ error_num: number; trace?: WMIPTracePoint[] }> }
    }>('get_ts_traces', {
      site_list: gaugeId,
      datasource: 'AT',
      start_time: startTime,
      end_time: endTime,
      varfrom: '100.00',
      varto: '100.00',
      data_type: 'point',  // Raw point data instead of aggregated
      interval: 'default', // Use default interval (raw readings)
      multiplier: '1',
    })

    if (response.error_num !== 0) return []

    const trace = response.return?.traces?.[0]
    if (!trace || trace.error_num !== 0) return []

    return trace.trace || []
  } catch {
    return []
  }
}

/**
 * Calculate daily uptime stats from trace data
 *
 * Note: This uses raw WMIP point data with auto-detected reporting intervals.
 * The ongoing tracking in firestore.ts counts each cron run (~720/day at 2-min intervals).
 * This difference is acceptable because:
 * 1. The uptime percentage calculation (actual/expected) normalizes to comparable values
 * 2. Ongoing tracking will eventually replace backfilled data as days roll forward
 *
 * @param traceData - Raw trace data from WMIP
 * @param daysBack - Number of days to calculate stats for
 * @param intervalMinutes - Detected or configured reporting interval in minutes
 */
function calculateDailyStats(
  traceData: WMIPTracePoint[],
  daysBack: number = 7,
  intervalMinutes: number = DEFAULT_INTERVAL_MINUTES
): DailyUptimeStat[] {
  const now = new Date()
  const dailyStats: DailyUptimeStat[] = []

  // Filter valid data points (quality code 255 = no data)
  const validPoints = traceData.filter(p => p.q !== 255)

  // Group readings by AEST date
  const readingsByDate = new Map<string, number>()

  for (const point of validPoints) {
    const date = parseWMIPTimestamp(point.t)
    if (!date) continue // Skip invalid timestamps
    const dateStr = toAESTDateString(date)
    readingsByDate.set(dateStr, (readingsByDate.get(dateStr) || 0) + 1)
  }

  // Calculate expected reports based on detected interval
  // 15 min = 96/day, 30 min = 48/day, 60 min = 24/day
  const expectedReportsPerDay = Math.floor((24 * 60) / intervalMinutes)

  // Calculate stats for each day
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = toAESTDateString(date)

    const actualReports = readingsByDate.get(dateStr) || 0

    const uptime = expectedReportsPerDay > 0
      ? Math.min(100, Math.round((actualReports / expectedReportsPerDay) * 1000) / 10)
      : 0

    dailyStats.push({
      date: dateStr,
      uptime,
      expectedReports: expectedReportsPerDay,
      actualReports,
      dataSource: 'backfill',
    })
  }

  return dailyStats
}

/**
 * Calculate rolling 7-day uptime from daily stats
 */
function calculateRollingUptime7d(dailyStats: DailyUptimeStat[]): number {
  if (dailyStats.length === 0) return 100

  const totalExpected = dailyStats.reduce((sum, d) => sum + d.expectedReports, 0)
  const totalActual = dailyStats.reduce((sum, d) => sum + d.actualReports, 0)

  if (totalExpected === 0) return 100

  // Cap at 100% to handle edge cases where actual exceeds expected
  return Math.min(100, Math.round((totalActual / totalExpected) * 1000) / 10)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  console.log('[Backfill] Starting uptime backfill...')

  const firestore = getDb()
  if (!firestore) {
    return NextResponse.json({ error: 'Firestore not available' }, { status: 500 })
  }

  const gaugeIds = GAUGE_STATIONS.map(s => s.id)
  const results: Record<string, { success: boolean; uptime?: number; error?: string }> = {}

  // Calculate date range (7 days back)
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 7)

  const wmipStartTime = toWMIPTimestamp(startDate)
  const wmipEndTime = toWMIPTimestamp(now)

  console.log(`[Backfill] Fetching data from ${wmipStartTime} to ${wmipEndTime}`)

  // Process gauges in batches to avoid overwhelming the API
  const batchSize = 3
  const uptimeData: Record<string, {
    rollingUptime7d: number
    lastReportTimestamp: string | null
    dailyStats: DailyUptimeStat[]
    detectedIntervalMinutes: number
  }> = {}

  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)

    await Promise.all(batch.map(async (gaugeId) => {
      try {
        // Fetch historical trace data directly (empty result means no data available)
        const traceData = await fetchHistoricalTrace(gaugeId, wmipStartTime, wmipEndTime)

        if (traceData.length === 0) {
          results[gaugeId] = { success: false, error: 'No trace data' }
          // Still create entry with 0% uptime
          uptimeData[gaugeId] = {
            rollingUptime7d: 0,
            lastReportTimestamp: null,
            dailyStats: calculateDailyStats([], 7, DEFAULT_INTERVAL_MINUTES),
            detectedIntervalMinutes: DEFAULT_INTERVAL_MINUTES,
          }
          return
        }

        // Detect the reporting interval for this gauge
        // Check if gauge has a configured interval, otherwise auto-detect
        const gaugeConfig = GAUGE_STATIONS.find(g => g.id === gaugeId)
        const intervalMinutes = gaugeConfig?.reportingIntervalMinutes || detectReportingInterval(traceData)

        // Calculate daily stats using the detected/configured interval
        const dailyStats = calculateDailyStats(traceData, 7, intervalMinutes)
        const rollingUptime7d = calculateRollingUptime7d(dailyStats)

        // Find last valid reading timestamp (sort by timestamp to ensure correct ordering)
        const validPoints = traceData
          .filter(p => p.q !== 255)
          .sort((a, b) => a.t - b.t)
        const lastPoint = validPoints[validPoints.length - 1]
        const lastParsedTime = lastPoint ? parseWMIPTimestamp(lastPoint.t) : null
        const lastReportTimestamp = lastParsedTime ? lastParsedTime.toISOString() : null

        uptimeData[gaugeId] = {
          rollingUptime7d,
          lastReportTimestamp,
          dailyStats,
          detectedIntervalMinutes: intervalMinutes,
        }

        results[gaugeId] = { success: true, uptime: rollingUptime7d }
        console.log(`[Backfill] ${gaugeId}: ${rollingUptime7d}% (${traceData.length} readings, ${intervalMinutes}min interval)`)

      } catch (error) {
        results[gaugeId] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }))

    // Small delay between batches
    if (i + batchSize < gaugeIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Store to Firestore
  try {
    const docRef = firestore.collection('gaugeUptime').doc('summary')
    await docRef.set({
      gauges: uptimeData,
      lastUpdated: now.toISOString(),
      backfilledAt: now.toISOString(),
    })
    console.log(`[Backfill] Stored uptime data for ${Object.keys(uptimeData).length} gauges`)
  } catch (error) {
    console.error('[Backfill] Failed to store data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to store data',
      results,
    }, { status: 500 })
  }

  const duration = Date.now() - startTime
  const successCount = Object.values(results).filter(r => r.success).length

  console.log(`[Backfill] Complete in ${duration}ms: ${successCount}/${gaugeIds.length} gauges`)

  return NextResponse.json({
    success: true,
    gaugesProcessed: gaugeIds.length,
    gaugesWithData: successCount,
    durationMs: duration,
    results,
  })
}

// Support GET for manual testing
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
