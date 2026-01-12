/**
 * Bureau of Meteorology (BOM) Water Data Online API Client
 *
 * This module provides access to BOM's SOS2 (Sensor Observation Service)
 * water level data as a backup/validation source for the primary WMIP data.
 *
 * Endpoint: http://www.bom.gov.au/waterdata/services
 * Documentation: http://www.bom.gov.au/waterdata/
 */

import type { WaterLevel, Trend, FloodStatus, HistoryPoint } from '../types'
import { BOM_WATERDATA_URL, GAUGE_STATIONS } from '../constants'

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

// BOM SOS2 request parameters
interface SOS2Request {
  service: 'SOS'
  version: '2.0'
  request: 'GetObservation' | 'GetCapabilities' | 'DescribeSensor'
  featureOfInterest?: string
  observedProperty?: string
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

// BOM feature of interest mapping (gauge IDs to BOM station identifiers)
// BOM uses different identifiers - these map our gauge IDs to BOM station codes
const GAUGE_TO_BOM_FEATURE: Record<string, string> = {
  '130212A': 'http://bom.gov.au/waterdata/services/stations/130212A',
  '130207A': 'http://bom.gov.au/waterdata/services/stations/130207A',
  '120311A': 'http://bom.gov.au/waterdata/services/stations/120311A',
  '130401A': 'http://bom.gov.au/waterdata/services/stations/130401A',
  '130410A': 'http://bom.gov.au/waterdata/services/stations/130410A',
  '130408A': 'http://bom.gov.au/waterdata/services/stations/130408A',
  '130209A': 'http://bom.gov.au/waterdata/services/stations/130209A',
  '130219A': 'http://bom.gov.au/waterdata/services/stations/130219A',
  '130204A': 'http://bom.gov.au/waterdata/services/stations/130204A',
  '130106A': 'http://bom.gov.au/waterdata/services/stations/130106A',
  '130105B': 'http://bom.gov.au/waterdata/services/stations/130105B',
  '130113A': 'http://bom.gov.au/waterdata/services/stations/130113A',
  '130504A': 'http://bom.gov.au/waterdata/services/stations/130504A',
  '130502A': 'http://bom.gov.au/waterdata/services/stations/130502A',
  '130004A': 'http://bom.gov.au/waterdata/services/stations/130004A',
  '130003A': 'http://bom.gov.au/waterdata/services/stations/130003A',
  '130005A': 'http://bom.gov.au/waterdata/services/stations/130005A',
}

// BOM observed property for water level
const WATER_LEVEL_PROPERTY = 'http://bom.gov.au/waterdata/services/parameters/Water_Course_Level'

/**
 * Build a SOS2 GetObservation request URL
 */
function buildSOS2Url(params: Partial<SOS2Request>): string {
  const baseParams: SOS2Request = {
    service: 'SOS',
    version: '2.0',
    request: 'GetObservation',
    responseFormat: 'application/json',
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
 * Parse BOM SOS2 JSON response into observations
 * BOM returns data in OGC SOS 2.0 format
 */
function parseSOS2Response(data: unknown, gaugeId: string): BOMObservation[] {
  const observations: BOMObservation[] = []

  try {
    // SOS2 response structure varies - handle common formats
    const response = data as Record<string, unknown>

    // Check for observations array in various locations
    const obsCollection = response.observations ||
                          response.ObservationCollection ||
                          (response.value as unknown[]) ||
                          []

    if (!Array.isArray(obsCollection)) {
      return observations
    }

    for (const obs of obsCollection) {
      const obsData = obs as Record<string, unknown>

      // Extract result value - may be nested
      let resultValue: number | undefined
      let resultTime: string | undefined
      let resultUnit = 'm'

      // Try different result structures
      if (obsData.result !== undefined) {
        const result = obsData.result as Record<string, unknown>
        if (typeof result === 'number') {
          resultValue = result
        } else if (typeof result.value === 'number') {
          resultValue = result.value
        } else if (typeof result.value === 'string') {
          resultValue = parseFloat(result.value)
        }
        if (result && typeof result === 'object' && result.uom) {
          resultUnit = result.uom as string
        }
      }

      // Extract phenomenon time
      if (obsData.phenomenonTime) {
        const phenTime = obsData.phenomenonTime as Record<string, unknown>
        if (typeof phenTime === 'string') {
          resultTime = phenTime
        } else {
          resultTime = (phenTime.timePosition || phenTime.instant || phenTime) as string
        }
      } else if (obsData.resultTime) {
        resultTime = obsData.resultTime as string
      }

      if (resultValue !== undefined && !isNaN(resultValue) && resultTime) {
        observations.push({
          gaugeId,
          timestamp: new Date(resultTime).toISOString(),
          value: resultValue,
          unit: resultUnit,
        })
      }
    }
  } catch (error) {
    console.error('[BOM] Error parsing SOS2 response:', error)
  }

  return observations
}

/**
 * Calculate trend from multiple observations
 */
function calculateTrend(observations: BOMObservation[]): { trend: Trend; changeRate: number } {
  if (observations.length < 2) {
    return { trend: 'stable', changeRate: 0 }
  }

  // Sort by timestamp descending (most recent first)
  const sorted = [...observations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const latest = sorted[0]
  const previous = sorted[1]

  const timeDiffHours =
    (new Date(latest.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
    (1000 * 60 * 60)

  if (timeDiffHours <= 0) {
    return { trend: 'stable', changeRate: 0 }
  }

  const levelDiff = latest.value - previous.value
  const changeRate = levelDiff / timeDiffHours

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
 * Fetch water level data for a specific gauge from BOM
 * Returns null if unavailable (graceful degradation)
 */
export async function fetchBOMWaterLevel(gaugeId: string): Promise<WaterLevel | null> {
  const featureOfInterest = GAUGE_TO_BOM_FEATURE[gaugeId] || gaugeId

  try {
    // Request last 2 hours of data for trend calculation
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    const temporalFilter = `om:phenomenonTime,${twoHoursAgo.toISOString()}/${now.toISOString()}`

    const url = buildSOS2Url({
      featureOfInterest,
      observedProperty: WATER_LEVEL_PROPERTY,
      temporalFilter,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[BOM] HTTP ${response.status} for gauge ${gaugeId}`)
      return null
    }

    const data = await response.json()
    const observations = parseSOS2Response(data, gaugeId)

    if (observations.length === 0) {
      console.warn(`[BOM] No observations found for gauge ${gaugeId}`)
      return null
    }

    // Use the most recent observation
    const sorted = observations.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const latest = sorted[0]
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
 * Fetch water level with response wrapper (for API compatibility)
 */
export async function fetchBOMWaterLevelResponse(gaugeId: string): Promise<BOMWaterResponse> {
  try {
    const data = await fetchBOMWaterLevel(gaugeId)
    if (data) {
      return { success: true, data }
    }
    return { success: false, data: null, error: 'No data returned' }
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
 */
export async function fetchBOMMultipleGauges(gaugeIds: string[]): Promise<Map<string, BOMWaterResponse>> {
  const results = new Map<string, BOMWaterResponse>()

  // Use Promise.allSettled to handle partial failures gracefully
  const promises = gaugeIds.map(async (gaugeId) => {
    const result = await fetchBOMWaterLevelResponse(gaugeId)
    return { gaugeId, result }
  })

  const settled = await Promise.allSettled(promises)

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i]
    const gaugeId = gaugeIds[i]

    if (outcome.status === 'fulfilled') {
      results.set(gaugeId, outcome.value.result)
    } else {
      results.set(gaugeId, {
        success: false,
        data: null,
        error: 'Request failed',
      })
    }
  }

  return results
}

/**
 * Fetch all Fitzroy Basin gauge levels from BOM
 */
export async function fetchAllBOMWaterLevels(): Promise<WaterLevel[]> {
  const allGaugeIds = GAUGE_STATIONS.map(s => s.id)
  const resultsMap = await fetchBOMWaterLevels(allGaugeIds)
  return Array.from(resultsMap.values())
}

/**
 * Fetch historical water level data for a gauge
 */
export async function fetchBOMHistory(
  gaugeId: string,
  hoursBack: number = 24
): Promise<HistoryPoint[]> {
  const featureOfInterest = GAUGE_TO_BOM_FEATURE[gaugeId] || gaugeId

  try {
    const now = new Date()
    const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

    const temporalFilter = `om:phenomenonTime,${startTime.toISOString()}/${now.toISOString()}`

    const url = buildSOS2Url({
      featureOfInterest,
      observedProperty: WATER_LEVEL_PROPERTY,
      temporalFilter,
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const observations = parseSOS2Response(data, gaugeId)

    // Convert to HistoryPoint format and sort by timestamp
    return observations
      .map(obs => ({
        timestamp: obs.timestamp,
        level: obs.value,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
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

export default {
  fetchBOMWaterLevel,
  fetchBOMWaterLevelResponse,
  fetchBOMWaterLevels,
  fetchBOMMultipleGauges,
  fetchAllBOMWaterLevels,
  fetchBOMHistory,
  fetchBOMHistoryResponse,
  checkBOMServiceStatus,
}
