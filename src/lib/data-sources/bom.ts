/**
 * Bureau of Meteorology (BOM) Water Data Online API Client
 *
 * This module provides access to BOM's SOS2 (Sensor Observation Service)
 * water data as a backup/validation source for the primary WMIP data.
 *
 * Endpoint: https://www.bom.gov.au/waterdata/services (WaterML 2.0 XML only)
 * Documentation: http://www.bom.gov.au/waterdata/
 *
 * Important behaviour (verified against the live service, Oct 2026):
 * - Without a temporalFilter, GetObservation returns only the latest value of
 *   each series, and the continuous ("AsStored") series come back nil. What
 *   remains are aggregates (DailyMax/DailyMin/MonthlyMean/YearlyMean...), so
 *   the old code reported the previous day's DailyMax as the "current" level.
 * - Water Data Online is a delayed archive: Queensland continuous data arrives
 *   in batches and is typically 14-24h behind real time. It is therefore not a
 *   real-time fallback, and readings older than BOM_MAX_READING_AGE_MS are
 *   rejected so stale values are never presented as current.
 * - Every parameter has a quality-controlled continuous series
 *   "DMQaQc.Merged.AsStored.1" whose procedure id is
 *   tstypes/Pat{n}_C_B_1 (rainfall n=2, level n=3, discharge n=4,
 *   storage volume n=6, storage level n=7). Requesting that procedure cuts the
 *   response from ~100-170KB to ~15KB.
 * - Parameter names contain spaces and must be URL-encoded exactly once
 *   (URLSearchParams does this). The previous encodeURIComponent() + URLSearchParams
 *   produced "Water%2520Course%2520Discharge", which matched nothing.
 */

import type { WaterLevel, Trend, FloodStatus, HistoryPoint, DischargeReading, DamStorageReading, RainfallReading } from '../types'
import { BOM_WATERDATA_URL, GAUGE_STATIONS, DAM_STATIONS, BOM_PARAMS } from '../constants'

// Response types for API consumers
export interface BOMWaterResponse {
  success: boolean
  data: WaterLevel | null
  error?: string
}

export interface BOMHistoryResponse {
  success: boolean
  data: HistoryPoint[]
  error?: string
}

/**
 * Maximum age of a BOM reading that may be presented as the current level.
 * BOM Water Data Online lags real time by ~14-24h for Queensland gauges, so in
 * practice this rejects BOM fallback readings unless BOM catches up.
 */
export const BOM_MAX_READING_AGE_MS = 3 * 60 * 60 * 1000

// BOM SOS2 request parameters
interface SOS2Request {
  service: 'SOS'
  version: '2.0'
  request: 'GetObservation' | 'GetCapabilities' | 'DescribeSensor'
  featureOfInterest?: string
  observedProperty?: string
  procedure?: string
  temporalFilter?: string
  responseFormat?: string
}

// Parsed observation from BOM response
interface BOMObservation {
  gaugeId: string
  timestamp: string
  value: number
  unit: string
}

const STATION_URL_PREFIX = 'http://bom.gov.au/waterdata/services/stations/'
const PARAMETER_URL_PREFIX = 'http://bom.gov.au/waterdata/services/parameters/'
const PROCEDURE_URL_PREFIX = 'http://bom.gov.au/waterdata/services/tstypes/'

/** Title of the quality-controlled continuous series for every parameter */
const CONTINUOUS_SERIES_TITLE = 'DMQaQc.Merged.AsStored.1'

/** Procedure (timeseries type) ids of the continuous series, per parameter */
const CONTINUOUS_PROCEDURE: Record<string, string> = {
  [BOM_PARAMS.RAINFALL]: 'Pat2_C_B_1',
  [BOM_PARAMS.WATER_COURSE_LEVEL]: 'Pat3_C_B_1',
  [BOM_PARAMS.WATER_COURSE_DISCHARGE]: 'Pat4_C_B_1',
  [BOM_PARAMS.STORAGE_VOLUME]: 'Pat6_C_B_1',
  [BOM_PARAMS.STORAGE_LEVEL]: 'Pat7_C_B_1',
}

/** Aggregate series that must never be read as an instantaneous value */
const AGGREGATE_SERIES_PATTERN = /(Daily|Hourly|Monthly|Yearly)/i

/** Look-back windows. BOM lags real time, so the window must cover the lag. */
const LEVEL_LOOKBACK_HOURS = 48
const DISCHARGE_LOOKBACK_HOURS = 48
const STORAGE_LOOKBACK_HOURS = 7 * 24

function stationUrl(stationId: string): string {
  return `${STATION_URL_PREFIX}${stationId}`
}

/**
 * Build a SOS2 GetObservation request URL
 * BOM only supports WaterML 2.0 format (not JSON).
 * Values are passed raw: URLSearchParams encodes each one exactly once.
 */
function buildSOS2Url(params: Partial<SOS2Request>): string {
  const baseParams: SOS2Request = {
    service: 'SOS',
    version: '2.0',
    request: 'GetObservation',
    responseFormat: 'http://www.opengis.net/waterml/2.0',
    ...params,
  }

  const searchParams = new URLSearchParams()
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value)
    }
  })

  return `${BOM_WATERDATA_URL}?${searchParams.toString()}`
}

/**
 * Build a GetObservation URL for one station/parameter, optionally restricted
 * to the continuous series and a look-back window.
 */
function buildObservationUrl(
  stationId: string,
  parameterName: string,
  options: { hoursBack?: number; continuousOnly?: boolean } = {}
): string {
  const params: Partial<SOS2Request> = {
    featureOfInterest: stationUrl(stationId),
    observedProperty: `${PARAMETER_URL_PREFIX}${parameterName}`,
  }

  if (options.continuousOnly && CONTINUOUS_PROCEDURE[parameterName]) {
    params.procedure = `${PROCEDURE_URL_PREFIX}${CONTINUOUS_PROCEDURE[parameterName]}`
  }

  if (options.hoursBack) {
    const now = new Date()
    const start = new Date(now.getTime() - options.hoursBack * 60 * 60 * 1000)
    params.temporalFilter = `om:phenomenonTime,${start.toISOString()}/${now.toISOString()}`
  }

  return buildSOS2Url(params)
}

async function fetchXml(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/xml' },
      cache: 'no-store',
    })
    if (!response.ok) {
      console.warn(`[BOM] HTTP ${response.status} for ${url.substring(0, 160)}`)
      return null
    }
    return await response.text()
  } finally {
    clearTimeout(timeoutId)
  }
}

interface ParsedSeries {
  property: string
  procedure: string
  unit: string
  points: Array<{ time: string; value: number }>
}

/**
 * Parse every OM_Observation block of a WaterML 2.0 response
 */
function parseWaterML2Series(xml: string): ParsedSeries[] {
  const series: ParsedSeries[] = []

  try {
    const obsPattern = /<om:OM_Observation[^>]*>[\s\S]*?<\/om:OM_Observation>/gi
    const obsBlocks = xml.match(obsPattern) || []

    for (const block of obsBlocks) {
      const property = block.match(/<om:observedProperty[^>]*xlink:title="([^"]*)"/i)?.[1] || ''
      const procedure = block.match(/<om:procedure[^>]*xlink:title="([^"]*)"/i)?.[1] || ''
      const unit = block.match(/uom\s+code="([^"]+)"/i)?.[1] || ''

      const points: ParsedSeries['points'] = []
      const tvpPattern = /<wml2:MeasurementTVP>([\s\S]*?)<\/wml2:MeasurementTVP>/gi
      let tvpMatch
      while ((tvpMatch = tvpPattern.exec(block)) !== null) {
        const tvpContent = tvpMatch[1]
        const timeMatch = tvpContent.match(/<wml2:time>([^<]+)<\/wml2:time>/i)
        // Nil values look like <wml2:value xsi:nil="true"/> and are skipped
        const valueMatch = tvpContent.match(/<wml2:value>([^<]+)<\/wml2:value>/i)
        if (!timeMatch || !valueMatch) continue
        const value = parseFloat(valueMatch[1])
        const time = new Date(timeMatch[1])
        if (!isNaN(value) && !isNaN(time.getTime())) {
          points.push({ time: time.toISOString(), value })
        }
      }

      series.push({ property, procedure, unit, points })
    }
  } catch (error) {
    console.error('[BOM] Error parsing WaterML2 response:', error)
  }

  return series
}

/**
 * Extract observations for one parameter, from the continuous series only.
 * Prefers the quality-controlled DMQaQc.Merged.AsStored.1 series and never
 * uses Daily/Hourly/Monthly/Yearly aggregates.
 */
function extractContinuousObservations(xml: string, gaugeId: string, parameterName: string): BOMObservation[] {
  const candidates = parseWaterML2Series(xml).filter(s =>
    s.property.includes(parameterName) &&
    s.points.length > 0 &&
    !AGGREGATE_SERIES_PATTERN.test(s.procedure)
  )
  if (candidates.length === 0) return []

  const preferred = candidates.find(s => s.procedure === CONTINUOUS_SERIES_TITLE) ||
    // Otherwise the series with the most recent point
    [...candidates].sort((a, b) =>
      new Date(b.points[b.points.length - 1].time).getTime() - new Date(a.points[a.points.length - 1].time).getTime()
    )[0]

  return preferred.points
    .map(p => ({ gaugeId, timestamp: p.time, value: p.value, unit: preferred.unit || 'm' }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

/**
 * Calculate trend from observations (sorted ascending), comparing the latest
 * reading with the one closest to an hour earlier.
 */
function calculateTrend(observations: BOMObservation[]): { trend: Trend; changeRate: number } {
  if (observations.length < 2) {
    return { trend: 'stable', changeRate: 0 }
  }

  const latest = observations[observations.length - 1]
  const latestTime = new Date(latest.timestamp).getTime()
  const target = latestTime - 60 * 60 * 1000
  let previous = observations[observations.length - 2]
  for (let i = observations.length - 2; i >= 0; i--) {
    const t = new Date(observations[i].timestamp).getTime()
    if (Math.abs(t - target) < Math.abs(new Date(previous.timestamp).getTime() - target)) {
      previous = observations[i]
    }
    if (t < target) break
  }

  const timeDiffHours = (latestTime - new Date(previous.timestamp).getTime()) / (1000 * 60 * 60)

  if (timeDiffHours < 0.25 || timeDiffHours > 6) {
    return { trend: 'stable', changeRate: 0 }
  }

  const changeRate = (latest.value - previous.value) / timeDiffHours

  // Consider stable if change is less than 0.01m/hr
  if (Math.abs(changeRate) < 0.01) {
    return { trend: 'stable', changeRate: 0 }
  }

  return {
    trend: changeRate > 0 ? 'rising' : 'falling',
    changeRate: Math.round(changeRate * 100) / 100,
  }
}

/**
 * Determine flood status based on level (simplified - real thresholds should come from config)
 * This is a fallback when we don't have gauge-specific thresholds
 */
function determineStatus(level: number): FloodStatus {
  // Generic thresholds - in production, use gauge-specific values
  if (level >= 8) return 'danger'
  if (level >= 6) return 'warning'
  if (level >= 4) return 'watch'
  return 'safe'
}

/**
 * Fetch the continuous water level series for a gauge (ascending by time)
 */
async function fetchBOMLevelObservations(gaugeId: string, hoursBack: number, timeoutMs: number): Promise<BOMObservation[]> {
  const url = buildObservationUrl(gaugeId, BOM_PARAMS.WATER_COURSE_LEVEL, { hoursBack, continuousOnly: true })
  const xml = await fetchXml(url, timeoutMs)
  if (!xml) return []
  return extractContinuousObservations(xml, gaugeId, BOM_PARAMS.WATER_COURSE_LEVEL)
}

function buildWaterLevel(gaugeId: string, observations: BOMObservation[]): WaterLevel {
  const latest = observations[observations.length - 1]
  const { trend, changeRate } = calculateTrend(observations)
  return {
    gaugeId,
    level: latest.value,
    unit: latest.unit,
    trend,
    changeRate,
    status: determineStatus(latest.value),
    timestamp: latest.timestamp,
    source: 'bom',
  }
}

function isWithinAge(timestamp: string, maxAgeMs: number): boolean {
  const t = new Date(timestamp).getTime()
  const now = Date.now()
  return !isNaN(t) && now - t <= maxAgeMs && t <= now + 60 * 1000
}

/**
 * Fetch water level data for a specific gauge from BOM
 * Returns null if unavailable, or if the latest continuous reading is older
 * than maxAgeMs (default BOM_MAX_READING_AGE_MS) - graceful degradation.
 */
export async function fetchBOMWaterLevel(
  gaugeId: string,
  options: { maxAgeMs?: number; timeoutMs?: number } = {}
): Promise<WaterLevel | null> {
  const maxAgeMs = options.maxAgeMs ?? BOM_MAX_READING_AGE_MS

  try {
    const observations = await fetchBOMLevelObservations(gaugeId, LEVEL_LOOKBACK_HOURS, options.timeoutMs ?? 15000)

    if (observations.length === 0) {
      console.warn(`[BOM] No continuous level observations for gauge ${gaugeId}`)
      return null
    }

    const reading = buildWaterLevel(gaugeId, observations)
    if (!isWithinAge(reading.timestamp, maxAgeMs)) {
      console.warn(`[BOM] Latest level for ${gaugeId} is too old to use (${reading.timestamp})`)
      return null
    }
    return reading
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`[BOM] Request timeout for gauge ${gaugeId}`)
      } else {
        console.error(`[BOM] Error fetching gauge ${gaugeId}:`, error.message)
      }
    }
    return null
  }
}

/**
 * Current reading (subject to maxAgeMs) plus history from a single BOM request
 */
export async function fetchBOMGaugeDetail(
  gaugeId: string,
  hoursBack: number = 24,
  options: { maxAgeMs?: number; timeoutMs?: number } = {}
): Promise<{ reading: WaterLevel | null; history: HistoryPoint[]; latestTimestamp: string | null }> {
  try {
    const observations = await fetchBOMLevelObservations(
      gaugeId,
      Math.max(hoursBack, LEVEL_LOOKBACK_HOURS),
      options.timeoutMs ?? 10000
    )
    if (observations.length === 0) {
      return { reading: null, history: [], latestTimestamp: null }
    }
    const latest = buildWaterLevel(gaugeId, observations)
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000
    const history = observations
      .filter(o => new Date(o.timestamp).getTime() >= cutoff)
      .map(o => ({ timestamp: o.timestamp, level: o.value }))
    const reading = isWithinAge(latest.timestamp, options.maxAgeMs ?? BOM_MAX_READING_AGE_MS) ? latest : null
    return { reading, history, latestTimestamp: latest.timestamp }
  } catch {
    return { reading: null, history: [], latestTimestamp: null }
  }
}

/**
 * Fetch water level with response wrapper (for API compatibility)
 */
export async function fetchBOMWaterLevelResponse(gaugeId: string): Promise<BOMWaterResponse> {
  try {
    const data = await fetchBOMWaterLevel(gaugeId)
    if (data) {
      return { success: true, data }
    }
    return { success: false, data: null, error: 'No recent data returned' }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch water levels for multiple gauges from BOM
 */
export async function fetchBOMWaterLevels(gaugeIds: string[]): Promise<Map<string, WaterLevel>> {
  const results = new Map<string, WaterLevel>()

  // Fetch in parallel with concurrency limit to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)
    const promises = batch.map(async (gaugeId) => {
      const level = await fetchBOMWaterLevel(gaugeId)
      if (level) {
        results.set(gaugeId, level)
      }
    })
    await Promise.all(promises)
  }

  return results
}

/**
 * Fetch water levels for multiple gauges (returns Map with response wrappers)
 * Concurrency-limited to 5 requests at a time.
 */
export async function fetchBOMMultipleGauges(gaugeIds: string[]): Promise<Map<string, BOMWaterResponse>> {
  const results = new Map<string, BOMWaterResponse>()

  const batchSize = 5
  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map(gaugeId => fetchBOMWaterLevelResponse(gaugeId)))
    settled.forEach((outcome, index) => {
      const gaugeId = batch[index]
      if (outcome.status === 'fulfilled') {
        results.set(gaugeId, outcome.value)
      } else {
        results.set(gaugeId, { success: false, data: null, error: 'Request failed' })
      }
    })
  }

  return results
}

/**
 * Fetch all gauge levels from BOM
 */
export async function fetchAllBOMWaterLevels(): Promise<WaterLevel[]> {
  const allGaugeIds = GAUGE_STATIONS.filter(s => !s.isOffline).map(s => s.id)
  const resultsMap = await fetchBOMWaterLevels(allGaugeIds)
  return Array.from(resultsMap.values())
}

/**
 * Fetch historical water level data for a gauge (continuous series, ascending).
 * Note BOM lags real time, so the most recent hours are usually missing.
 */
export async function fetchBOMHistory(
  gaugeId: string,
  hoursBack: number = 24
): Promise<HistoryPoint[]> {
  try {
    const observations = await fetchBOMLevelObservations(gaugeId, hoursBack, 20000)
    return observations.map(obs => ({
      timestamp: obs.timestamp,
      level: obs.value,
    }))
  } catch {
    return []
  }
}

/**
 * Fetch history with response wrapper (for API compatibility)
 */
export async function fetchBOMHistoryResponse(
  gaugeId: string,
  hoursBack: number = 24
): Promise<BOMHistoryResponse> {
  try {
    const data = await fetchBOMHistory(gaugeId, hoursBack)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check BOM service availability
 */
export async function checkBOMServiceStatus(): Promise<boolean> {
  try {
    const url = buildSOS2Url({
      request: 'GetCapabilities',
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'HEAD',
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Generic function to parse a specific parameter from WaterML2 XML response
 * (any series, including aggregates - used for daily rainfall totals)
 */
function parseWaterML2Parameter(xml: string, gaugeId: string, parameterName: string): BOMObservation[] {
  const observations: BOMObservation[] = []
  for (const series of parseWaterML2Series(xml)) {
    if (!series.property.includes(parameterName)) continue
    for (const point of series.points) {
      observations.push({ gaugeId, timestamp: point.time, value: point.value, unit: series.unit })
    }
  }
  return observations
}

/**
 * Fetch discharge (flow) data for a gauge from BOM (continuous series).
 * The timestamp reflects BOM's lag (typically 14-24h behind real time).
 */
export async function fetchBOMDischarge(gaugeId: string): Promise<DischargeReading | null> {
  try {
    const url = buildObservationUrl(gaugeId, BOM_PARAMS.WATER_COURSE_DISCHARGE, {
      hoursBack: DISCHARGE_LOOKBACK_HOURS,
      continuousOnly: true,
    })
    const xml = await fetchXml(url, 15000)
    if (!xml) return null

    const observations = extractContinuousObservations(xml, gaugeId, BOM_PARAMS.WATER_COURSE_DISCHARGE)
    if (observations.length === 0) {
      return null
    }

    const latest = observations[observations.length - 1]

    // Determine unit - BOM returns 'cumec' or 'Ml/d'
    const unit: 'ML/d' | 'cumec' = latest.unit === 'cumec' ? 'cumec' : 'ML/d'

    return {
      gaugeId,
      value: latest.value,
      unit,
      timestamp: latest.timestamp,
      source: 'bom',
    }
  } catch (error) {
    console.error(`[BOM] Error fetching discharge for ${gaugeId}:`, error)
    return null
  }
}

/**
 * Fetch dam storage data from BOM
 */
export async function fetchBOMDamStorage(stationId: string): Promise<DamStorageReading | null> {
  const damStation = DAM_STATIONS.find(d => d.id === stationId)

  if (!damStation) {
    console.warn(`[BOM] Unknown dam station: ${stationId}`)
    return null
  }

  try {
    const volumeUrl = buildObservationUrl(stationId, BOM_PARAMS.STORAGE_VOLUME, {
      hoursBack: STORAGE_LOOKBACK_HOURS,
      continuousOnly: true,
    })
    const levelUrl = buildObservationUrl(stationId, BOM_PARAMS.STORAGE_LEVEL, {
      hoursBack: STORAGE_LOOKBACK_HOURS,
      continuousOnly: true,
    })

    const [volumeXml, levelXml] = await Promise.all([
      fetchXml(volumeUrl, 15000),
      fetchXml(levelUrl, 15000).catch(() => null),
    ])

    if (!volumeXml) {
      return null
    }

    const volumeObs = extractContinuousObservations(volumeXml, stationId, BOM_PARAMS.STORAGE_VOLUME)
    const levelObs = levelXml ? extractContinuousObservations(levelXml, stationId, BOM_PARAMS.STORAGE_LEVEL) : []

    const latestVolume = volumeObs.length > 0 ? volumeObs[volumeObs.length - 1] : null
    const latestLevel = levelObs.length > 0 ? levelObs[levelObs.length - 1] : null

    if (!latestVolume) {
      return null
    }

    // Calculate percent full if capacity is known
    const percentFull = damStation.capacity
      ? Math.round((latestVolume.value / damStation.capacity) * 100 * 10) / 10
      : undefined

    return {
      stationId,
      name: damStation.name,
      volume: latestVolume.value,
      volumeUnit: 'ML',
      level: latestLevel?.value ?? 0,
      levelUnit: 'm',
      percentFull,
      timestamp: latestVolume.timestamp,
      source: 'bom',
    }
  } catch (error) {
    console.error(`[BOM] Error fetching dam storage for ${stationId}:`, error)
    return null
  }
}

/**
 * Fetch all dam storage readings
 */
export async function fetchAllBOMDamStorage(): Promise<DamStorageReading[]> {
  const results: DamStorageReading[] = []

  for (const dam of DAM_STATIONS) {
    if (dam.isOffline) continue
    const reading = await fetchBOMDamStorage(dam.id)
    if (reading) {
      results.push(reading)
    }
  }

  return results
}

/**
 * Fetch rainfall data for a gauge from BOM
 * (no temporal filter: BOM returns the latest value of each series, which for
 * rainfall is the daily total to 9am)
 */
export async function fetchBOMRainfall(gaugeId: string): Promise<RainfallReading | null> {
  try {
    const url = buildObservationUrl(gaugeId, BOM_PARAMS.RAINFALL)
    const xml = await fetchXml(url, 15000)
    if (!xml) {
      return null
    }

    const observations = parseWaterML2Parameter(xml, gaugeId, BOM_PARAMS.RAINFALL)

    if (observations.length === 0) {
      return null
    }

    // Get most recent observation
    const sorted = observations.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const latest = sorted[0]

    // Check if this is daily or hourly data based on procedure type in response
    // Daily total is typically indicated by 'DailyTotal' in the procedure name
    const period: 'daily' | 'hourly' = xml.includes('DailyTotal') ? 'daily' : 'hourly'

    return {
      gaugeId,
      value: latest.value,
      unit: 'mm',
      period,
      timestamp: latest.timestamp,
      source: 'bom',
    }
  } catch (error) {
    console.error(`[BOM] Error fetching rainfall for ${gaugeId}:`, error)
    return null
  }
}

/**
 * Fetch discharge and rainfall for multiple gauges
 */
export async function fetchBOMExtendedData(gaugeIds: string[]): Promise<{
  discharge: Map<string, DischargeReading>
  rainfall: Map<string, RainfallReading>
}> {
  const discharge = new Map<string, DischargeReading>()
  const rainfall = new Map<string, RainfallReading>()

  // Fetch in parallel with concurrency limit
  const batchSize = 5
  for (let i = 0; i < gaugeIds.length; i += batchSize) {
    const batch = gaugeIds.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (gaugeId) => {
        const [dischargeData, rainfallData] = await Promise.all([
          fetchBOMDischarge(gaugeId),
          fetchBOMRainfall(gaugeId),
        ])

        if (dischargeData) {
          discharge.set(gaugeId, dischargeData)
        }
        if (rainfallData) {
          rainfall.set(gaugeId, rainfallData)
        }
      })
    )
  }

  return { discharge, rainfall }
}

const bomClient = {
  fetchBOMWaterLevel,
  fetchBOMWaterLevelResponse,
  fetchBOMWaterLevels,
  fetchBOMMultipleGauges,
  fetchAllBOMWaterLevels,
  fetchBOMHistory,
  fetchBOMHistoryResponse,
  fetchBOMGaugeDetail,
  checkBOMServiceStatus,
  fetchBOMDischarge,
  fetchBOMDamStorage,
  fetchAllBOMDamStorage,
  fetchBOMRainfall,
  fetchBOMExtendedData,
}

export default bomClient
