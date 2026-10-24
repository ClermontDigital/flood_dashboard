/**
 * Queensland Water Monitoring Information Portal (WMIP) API Client
 *
 * Fetches stream water level (variable 100.00) from the Queensland Government's
 * WMIP (Hydstra) webservice using the JSON POST API (get_ts_traces, version 2).
 *
 * Notes (verified against the live API, Oct 2026):
 * - Only the telemetry datasource 'AT' carries near-real-time data. Closed or
 *   decommissioned sites only have the archive datasource 'A', whose data ends
 *   years ago (e.g. 143030A ends 1999, 120006A ends 1976).
 * - `data_type: 'point'` returns the actual recorded readings with their real
 *   timestamps. (`'mean'` + `interval: 'hour'` returns synthetic hourly buckets
 *   whose last 1-2 buckets are padded with quality 255, so the "current" level
 *   was a 1-2h old hourly mean.)
 * - Multi-site requests DO work: `site_list` accepts a comma separated list and
 *   returns one trace per site that has data. Sites with no data in the window
 *   are simply omitted. One request for ~40 sites takes ~3-6s, versus one
 *   request per site (111 requests per cron run), which was triggering
 *   intermittent failures.
 *
 * @see https://water-monitoring.information.qld.gov.au/
 */

import type { WaterLevel, HistoryPoint, Trend, FloodThresholds } from '@/lib/types'
import { WMIP_BASE_URL } from '@/lib/constants'

/**
 * Gauge IDs for the Clermont Flood Dashboard monitoring network
 * (legacy default for fetchWMIPMultipleGauges; callers pass GAUGE_STATIONS ids)
 */
export const MONITORED_GAUGE_IDS = [
  '130207A', // Sandy Creek @ Clermont
  '130210A', // Theresa Creek @ Valeria
  '130206A', // Theresa Creek @ Gregory Highway
  '130401A', // Isaac River @ Yatton
  '130410A', // Isaac River @ Deverill
  '130404A', // Connors River @ Pink Lagoon
  '130209A', // Nogoa River @ Craigmore
  '130219A', // Nogoa River @ Duck Ponds
  '130106A', // Mackenzie River @ Bingegang
  '130105B', // Mackenzie River @ Coolmaringa
  '130113A', // Mackenzie River @ Rileys Crossing
  '130504B', // Comet River @ Comet Weir
  '130005A', // Fitzroy River @ The Gap
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
 * Current reading plus history from a single WMIP request
 */
export interface WMIPGaugeDetail {
  reading: WaterLevel | null
  history: HistoryPoint[]
  error?: string
}

/**
 * WMIP trace data point
 */
interface WMIPTracePoint {
  v: string  // value
  t: number  // timestamp (format: YYYYMMDDHHmmss, AEST)
  q: number  // quality code (255 = no data)
}

/**
 * WMIP trace response (one per site)
 */
interface WMIPTraceResponse {
  error_num: number
  error_msg?: string
  site: string
  trace?: WMIPTracePoint[]
}

interface WMIPTracesEnvelope {
  error_num: number
  error_msg?: string
  return?: { traces?: WMIPTraceResponse[] }
}

/** Per-request timeout. A 40-site, 24h request normally completes in 3-6s. */
const API_TIMEOUT = 20000
/** Sites per get_ts_traces request */
const SITES_PER_REQUEST = 40
/**
 * Concurrent multi-site requests. WMIP answers HTTP 408 when several large
 * requests arrive together, so batches are sent one at a time (3 batches for
 * ~110 gauges take ~5-15s in total).
 */
const MAX_CONCURRENT_REQUESTS = 1
/** Pause before retrying a failed batch (WMIP 408s are load related) */
const RETRY_DELAY_MS = 2000
/** Window used for the "current" reading: older readings are not returned */
const CURRENT_WINDOW_HOURS = 24
/** WMIP error 126 = "No data within specified period" (not a failure) */
const WMIP_NO_DATA = 126
const STREAM_LEVEL_VARIABLE = '100.00'
const QUALITY_NO_DATA = 255
const AEST_OFFSET_MS = 10 * 60 * 60 * 1000 // Queensland: UTC+10, no daylight saving

/**
 * Parses WMIP timestamp format (YYYYMMDDHHmmss, Queensland local time) to epoch ms
 */
function parseWMIPTime(wmipTime: number | string): number | null {
  const str = String(wmipTime)
  if (str.length !== 14) return null

  const year = parseInt(str.slice(0, 4), 10)
  const month = parseInt(str.slice(4, 6), 10) - 1
  const day = parseInt(str.slice(6, 8), 10)
  const hour = parseInt(str.slice(8, 10), 10)
  const minute = parseInt(str.slice(10, 12), 10)
  const second = parseInt(str.slice(12, 14), 10)

  const ms = Date.UTC(year, month, day, hour, minute, second) - AEST_OFFSET_MS
  return Number.isFinite(ms) ? ms : null
}

/**
 * Formats an instant as a WMIP timestamp in Queensland local time (AEST)
 */
function toWMIPTimestamp(epochMs: number): string {
  const d = new Date(epochMs + AEST_OFFSET_MS)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
}

/**
 * Makes a POST request to the WMIP API
 * Note: Different WMIP functions require different API versions:
 * - get_site_list / get_variable_list / get_datasources_by_site: version 1
 * - get_ts_traces: version 2
 */
async function wmipPost<T>(
  functionName: string,
  params: Record<string, unknown>,
  version: string = '2',
  timeoutMs: number = API_TIMEOUT
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`WMIP HTTP ${response.status}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

/** A valid, parsed reading */
interface ParsedPoint {
  time: number  // epoch ms
  level: number
}

function toParsedPoints(trace: WMIPTracePoint[] | undefined): ParsedPoint[] {
  if (!trace?.length) return []
  const points: ParsedPoint[] = []
  for (const p of trace) {
    if (p.q === QUALITY_NO_DATA) continue
    const level = parseFloat(p.v)
    const time = parseWMIPTime(p.t)
    if (!Number.isFinite(level) || time === null) continue
    points.push({ time, level })
  }
  return points.sort((a, b) => a.time - b.time)
}

/**
 * Fetches raw stream-level points for one batch of sites (one request).
 * Throws on transport/API failure so the caller can retry.
 */
async function fetchTraceBatch(
  siteIds: string[],
  startMs: number,
  endMs: number,
  timeoutMs: number
): Promise<Map<string, ParsedPoint[]>> {
  const response = await wmipPost<WMIPTracesEnvelope>('get_ts_traces', {
    site_list: siteIds.join(','),
    datasource: 'AT',
    start_time: toWMIPTimestamp(startMs),
    end_time: toWMIPTimestamp(endMs),
    varfrom: STREAM_LEVEL_VARIABLE,
    varto: STREAM_LEVEL_VARIABLE,
    data_type: 'point',
    // interval/multiplier are required by the API but ignored for point data
    interval: 'minute',
    multiplier: '15',
  }, '2', timeoutMs)

  const result = new Map<string, ParsedPoint[]>()

  if (response.error_num === WMIP_NO_DATA) {
    return result // none of the sites have data in this window
  }
  if (response.error_num !== 0) {
    throw new Error(`WMIP error ${response.error_num}: ${response.error_msg || 'unknown'}`)
  }

  for (const trace of response.return?.traces || []) {
    if (!trace?.site || trace.error_num !== 0) continue
    const points = toParsedPoints(trace.trace)
    if (points.length > 0) {
      result.set(trace.site.trim(), points)
    }
  }
  return result
}

/**
 * Runs fn(); if it hasn't settled after hedgeAfterMs, starts a second attempt
 * and resolves with whichever succeeds first. WMIP usually answers in 1-5s but
 * occasionally stalls for >12s, so hedging cuts the tail for interactive calls.
 */
function hedged<T>(fn: () => Promise<T>, hedgeAfterMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    let pending = 0
    let lastError: unknown
    const attempt = () => {
      pending++
      fn().then(
        (value) => {
          if (!settled) {
            settled = true
            clearTimeout(timer)
            resolve(value)
          }
        },
        (error) => {
          lastError = error
          pending--
          if (settled) return
          if (!hedgeStarted) {
            // First attempt failed fast: start the second attempt now
            clearTimeout(timer)
            hedgeStarted = true
            attempt()
          } else if (pending === 0) {
            settled = true
            reject(lastError)
          }
        }
      )
    }
    let hedgeStarted = false
    const timer = setTimeout(() => {
      if (!settled && !hedgeStarted) {
        hedgeStarted = true
        attempt()
      }
    }, hedgeAfterMs)
    attempt()
  })
}

/**
 * Fetches stream-level points for any number of sites, batching sites into
 * multi-site requests. A failed batch gets one more attempt: immediately after
 * the failure, or (with hedgeAfterMs) in parallel once the first attempt has
 * taken longer than hedgeAfterMs.
 *
 * Returns points for sites that have data, plus the set of site ids whose
 * request failed (as opposed to "no data available").
 */
async function fetchTraces(
  siteIds: string[],
  hoursBack: number,
  timeoutMs: number = API_TIMEOUT,
  hedgeAfterMs?: number
): Promise<{ points: Map<string, ParsedPoint[]>; failed: Map<string, string> }> {
  const endMs = Date.now()
  const startMs = endMs - hoursBack * 60 * 60 * 1000
  const uniqueIds = Array.from(new Set(siteIds))

  const batches: string[][] = []
  for (let i = 0; i < uniqueIds.length; i += SITES_PER_REQUEST) {
    batches.push(uniqueIds.slice(i, i + SITES_PER_REQUEST))
  }

  const points = new Map<string, ParsedPoint[]>()
  const failed = new Map<string, string>()

  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_REQUESTS) {
    const group = batches.slice(i, i + MAX_CONCURRENT_REQUESTS)
    await Promise.all(group.map(async (batch) => {
      const run = () => fetchTraceBatch(batch, startMs, endMs, timeoutMs)
      try {
        const batchResult = hedgeAfterMs
          ? await hedged(run, hedgeAfterMs)
          : await run().catch(async () => {
            // one retry after a short pause
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
            return run()
          })
        for (const [site, sitePoints] of batchResult) {
          points.set(site, sitePoints)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[WMIP] Batch of ${batch.length} sites failed after retry: ${message}`)
        for (const site of batch) failed.set(site, message)
      }
    }))
  }

  return { points, failed }
}

/**
 * Calculates trend and rate of change (m/hr) from the latest reading and the
 * reading closest to one hour earlier, using the real reading times.
 */
function calculateTrendFromPoints(points: ParsedPoint[]): { trend: Trend; changeRate: number } {
  if (points.length < 2) {
    return { trend: 'stable', changeRate: 0 }
  }

  const latest = points[points.length - 1]
  const target = latest.time - 60 * 60 * 1000

  let previous: ParsedPoint | null = null
  for (let i = points.length - 2; i >= 0; i--) {
    const candidate = points[i]
    if (!previous || Math.abs(candidate.time - target) < Math.abs(previous.time - target)) {
      previous = candidate
    }
    if (candidate.time < target) break
  }
  if (!previous) return { trend: 'stable', changeRate: 0 }

  const timeDiffHours = (latest.time - previous.time) / (60 * 60 * 1000)
  // Need at least 15 minutes between readings, and don't infer a rate across long gaps
  if (timeDiffHours < 0.25 || timeDiffHours > 6) {
    return { trend: 'stable', changeRate: 0 }
  }

  const changeRate = (latest.level - previous.level) / timeDiffHours

  // Consider stable if change is less than 0.01m/hr (same threshold as BOM)
  if (Math.abs(changeRate) < 0.01) {
    return { trend: 'stable', changeRate: 0 }
  }

  return {
    trend: changeRate > 0 ? 'rising' : 'falling',
    changeRate: Math.round(changeRate * 100) / 100,
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
  '130504B': { minor: 5.0, moderate: 7.0, major: 9.0 },   // Comet @ Comet Weir (replaced closed 130504A)
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

function buildWaterLevel(gaugeId: string, points: ParsedPoint[]): WaterLevel {
  const latest = points[points.length - 1]
  const { trend, changeRate } = calculateTrendFromPoints(points)
  return {
    gaugeId,
    level: latest.level,
    unit: 'm',
    timestamp: new Date(latest.time).toISOString(),
    trend,
    changeRate,
    status: determineStatus(latest.level, gaugeId),
    source: 'wmip',
  }
}

function toHistory(points: ParsedPoint[]): HistoryPoint[] {
  return points.map(p => ({ timestamp: new Date(p.time).toISOString(), level: p.level }))
}

/**
 * Fetches the current reading and history for one gauge in a single request
 */
export async function fetchWMIPGaugeDetail(
  gaugeId: string,
  hoursBack: number = 24,
  timeoutMs: number = 10000
): Promise<WMIPGaugeDetail> {
  try {
    // Hedge after 4s: a second request is sent if WMIP hasn't answered yet
    const { points, failed } = await fetchTraces([gaugeId], Math.max(hoursBack, 1), timeoutMs, 4000)
    const sitePoints = points.get(gaugeId)
    if (!sitePoints?.length) {
      return {
        reading: null,
        history: [],
        error: failed.get(gaugeId) || `No WMIP telemetry (AT) data in the last ${hoursBack}h`,
      }
    }
    return { reading: buildWaterLevel(gaugeId, sitePoints), history: toHistory(sitePoints) }
  } catch (error) {
    return { reading: null, history: [], error: String(error) }
  }
}

/**
 * Fetches current water level for a single gauge
 */
export async function fetchWMIPWaterLevel(gaugeId: string): Promise<WMIPResponse> {
  const detail = await fetchWMIPGaugeDetail(gaugeId, CURRENT_WINDOW_HOURS)
  if (!detail.reading) {
    return { success: false, data: null, error: detail.error || 'No trace data' }
  }
  return { success: true, data: detail.reading }
}

/**
 * Fetches historical water level data for a gauge (actual recorded readings)
 */
export async function fetchWMIPHistory(
  gaugeId: string,
  hoursBack: number = 24
): Promise<WMIPHistoryResponse> {
  const detail = await fetchWMIPGaugeDetail(gaugeId, hoursBack)
  if (detail.history.length === 0) {
    return { success: false, data: [], error: detail.error || 'No trace data' }
  }
  return { success: true, data: detail.history }
}

/**
 * Fetches current water levels for multiple gauges using batched multi-site requests
 */
export async function fetchWMIPMultipleGauges(
  gaugeIds: string[] = [...MONITORED_GAUGE_IDS]
): Promise<Map<string, WMIPResponse>> {
  const results = new Map<string, WMIPResponse>()

  let fetched: Awaited<ReturnType<typeof fetchTraces>>
  try {
    fetched = await fetchTraces(gaugeIds, CURRENT_WINDOW_HOURS)
  } catch (error) {
    for (const gaugeId of gaugeIds) {
      results.set(gaugeId, { success: false, data: null, error: String(error) })
    }
    return results
  }

  for (const gaugeId of gaugeIds) {
    const sitePoints = fetched.points.get(gaugeId)
    if (sitePoints?.length) {
      results.set(gaugeId, { success: true, data: buildWaterLevel(gaugeId, sitePoints) })
    } else {
      results.set(gaugeId, {
        success: false,
        data: null,
        error: fetched.failed.get(gaugeId) || `No WMIP telemetry (AT) data in the last ${CURRENT_WINDOW_HOURS}h`,
      })
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
 * Gets datasources available for a gauge ('AT' = telemetry, 'A' = archive only)
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
  fetchWMIPGaugeDetail,
  fetchWMIPMultipleGauges,
  fetchWMIPThresholds,
  getGaugeDatasources,
  MONITORED_GAUGE_IDS,
}

export default wmipClient
