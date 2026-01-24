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

// Expected reporting interval in minutes (most gauges report every 15 min)
const EXPECTED_INTERVAL_MINUTES = 15

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
 * Note: This uses raw WMIP point data (96 expected readings/day at 15-min intervals).
 * The ongoing tracking in firestore.ts counts each cron run (~720/day at 2-min intervals).
 * This difference is acceptable because:
 * 1. The uptime percentage calculation (actual/expected) normalizes to comparable values
 * 2. Ongoing tracking will eventually replace backfilled data as days roll forward
 */
function calculateDailyStats(traceData: WMIPTracePoint[], daysBack: number = 7): DailyUptimeStat[] {
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

  // Calculate stats for each day
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = toAESTDateString(date)

    // Expected readings per day for raw 15-minute interval data (4 per hour × 24 hours)
    const expectedReports = 96
    const actualReports = readingsByDate.get(dateStr) || 0

    const uptime = expectedReports > 0
      ? Math.min(100, Math.round((actualReports / expectedReports) * 1000) / 10)
      : 0

    dailyStats.push({
      date: dateStr,
      uptime,
      expectedReports,
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
            dailyStats: calculateDailyStats([], 7),
          }
          return
        }

        // Calculate daily stats
        const dailyStats = calculateDailyStats(traceData, 7)
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
        }

        results[gaugeId] = { success: true, uptime: rollingUptime7d }
        console.log(`[Backfill] ${gaugeId}: ${rollingUptime7d}% (${traceData.length} readings)`)

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
