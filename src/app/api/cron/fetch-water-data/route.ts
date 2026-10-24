/**
 * Cron Data Fetcher API Route
 * POST /api/cron/fetch-water-data
 *
 * Called by Cloud Scheduler every 1-2 minutes to fetch fresh water level data
 * from WMIP/BOM and store it in Firestore.
 *
 * Secured via Cloud Scheduler's OIDC authentication.
 */

import { NextResponse, NextRequest } from 'next/server'
import { OFFICIAL_FLOOD_THRESHOLDS } from '@/lib/flood-thresholds'
import { isCronAuthorized } from '@/lib/cron-auth'
import type { WaterLevel, DischargeReading, RainfallReading, DamStorageReading, FloodThresholds, RoadEvent } from '@/lib/types'
import { GAUGE_STATIONS } from '@/lib/constants'
import { env } from '@/lib/env'
import { calculateStatus, geometryPoint } from '@/lib/utils'
import {
  fetchWMIPMultipleGauges,
  fetchBOMMultipleGauges,
  fetchBOMExtendedData,
  fetchAllBOMDamStorage,
  fetchStateRainfall,
} from '@/lib/data-sources'
import { BOM_MAX_READING_AGE_MS } from '@/lib/data-sources/bom'
import {
  getWaterLevelData,
  storeWaterLevelData,
  recordFetchError,
  recordFetchSuccess,
  recordPartialFailures,
  storeStatewideRainfall,
  storeRoadClosures,
  updateGaugeUptimeTracking,
} from '@/lib/firestore'

/**
 * WMIP readings are requested over a 24h window, so a WMIP reading is never
 * older than this. A previous reading is carried forward (with its original
 * timestamp) while it is still within this age, so a transient WMIP failure
 * doesn't blank a gauge for a cron cycle.
 */
const WMIP_MAX_READING_AGE_MS = 24 * 60 * 60 * 1000

/**
 * BOM discharge/rainfall/dam storage is a delayed daily archive, so refresh it
 * at most every 30 minutes (one cron run per 30-minute block) instead of
 * sending ~230 BOM requests on every 2-minute run. In between, the previous
 * values from Firestore are reused.
 */
const EXTENDED_REFRESH_BLOCK_MINUTES = 30

// Queensland state bounding box
const QLD_BOUNDS = {
  north: -16.0,
  south: -29.0,
  east: 154.0,
  west: 138.0,
}

// Known flood thresholds for gauges
// Official BOM flood levels, shared across routes (src/lib/flood-thresholds.ts)
const FLOOD_THRESHOLDS = OFFICIAL_FLOOD_THRESHOLDS


/**
 * Verify the request is from Cloud Scheduler or has a valid cron secret
 */
function isAuthorized(request: NextRequest): boolean {
  return isCronAuthorized(request)
}

/**
 * Helper to check if a reading is recent enough to present as current.
 * Allows 1 minute of clock skew for future timestamps.
 */
function isWithinAge(timestamp: string, maxAgeMs: number): boolean {
  const dataTime = new Date(timestamp).getTime()
  const now = Date.now()
  return !isNaN(dataTime) && (now - dataTime) < maxAgeMs && dataTime <= now + 60 * 1000
}

function isReadingFresh(reading: WaterLevel): boolean {
  return isWithinAge(
    reading.timestamp,
    reading.source === 'bom' ? BOM_MAX_READING_AGE_MS : WMIP_MAX_READING_AGE_MS
  )
}

/**
 * Check if any gauge has elevated water levels
 */
function hasElevatedLevels(waterLevels: Map<string, WaterLevel>): boolean {
  for (const [, reading] of waterLevels) {
    if (reading.status === 'watch' || reading.status === 'warning' || reading.status === 'danger') {
      return true
    }
  }
  return false
}

/**
 * Fetch road closures from QLDTraffic API
 */
async function fetchRoadClosuresData(): Promise<RoadEvent[]> {
  try {
    // Skip if API key is not configured
    if (!env.qldTrafficApiKey) {
      console.warn('[Cron] QLDTraffic API key not configured, skipping road closures fetch')
      return []
    }

    const response = await fetch(`${env.qldTrafficApiUrl}?apikey=${env.qldTrafficApiKey}`, {
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      console.error(`[Cron] QLDTraffic API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const features = data.features || data.events || data || []
    const events: RoadEvent[] = []

    for (const feature of features) {
      const props = feature.properties || feature
      const geometry = feature.geometry || props.geometry

      // Get coordinates (QLDTraffic sends GeometryCollections as well as plain geometries)
      const coords = geometryPoint(geometry)

      if (!coords) continue

      // Filter to Queensland region
      if (coords.lat < QLD_BOUNDS.south || coords.lat > QLD_BOUNDS.north ||
          coords.lng < QLD_BOUNDS.west || coords.lng > QLD_BOUNDS.east) continue

      // Map event type
      const type = props.event_type?.toLowerCase() || ''
      const subtype = props.event_subtype?.toLowerCase() || ''
      let eventType: RoadEvent['type'] = 'hazard'
      if (type.includes('flood') || subtype.includes('flood')) eventType = 'flooding'
      else if (type.includes('closure') || subtype.includes('closure')) eventType = 'road_closure'

      // Only include flooding, road closures, and hazards
      if (!['flooding', 'road_closure', 'hazard'].includes(eventType)) continue

      // Map severity
      const impact = props.impact?.impact_type?.toLowerCase() || ''
      let severity: RoadEvent['severity'] = 'low'
      if (impact.includes('major') || type.includes('flood')) severity = 'extreme'
      else if (impact.includes('moderate')) severity = 'high'
      else if (impact.includes('minor')) severity = 'medium'

      events.push({
        id: props.event_id || `evt-${Date.now()}-${Math.random()}`,
        type: eventType,
        title: props.road_summary?.road_name || props.description?.substring(0, 50) || 'Road Event',
        description: props.description || props.advice || props.information || 'No description available',
        road: props.road_summary?.road_name || 'Unknown road',
        suburb: props.road_summary?.locality,
        direction: props.road_summary?.direction || props.impact?.direction,
        lat: coords.lat,
        lng: coords.lng,
        startTime: props.duration?.start,
        endTime: props.duration?.end,
        severity,
        source: 'qldtraffic',
        sourceUrl: env.qldTrafficWebsiteUrl,
        lastUpdated: new Date().toISOString(),
      })
    }

    return events
  } catch (error) {
    console.error('[Cron] Error fetching road closures:', error)
    return []
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify authorization
  if (!isAuthorized(request)) {
    console.warn('[Cron] Unauthorized request attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const startTime = Date.now()
  console.log('[Cron] Starting water data fetch...')

  const gaugeIds = GAUGE_STATIONS.map((station) => station.id)
  const offlineIds = new Set(GAUGE_STATIONS.filter((s) => s.isOffline).map((s) => s.id))
  const sources: string[] = []
  const waterLevelMap = new Map<string, WaterLevel>()

  try {
    // Previous stored run (up to 24h old) - used to carry forward readings on
    // transient upstream failures and to reuse slow-changing BOM extended data
    const previous = await getWaterLevelData(WMIP_MAX_READING_AGE_MS)

    // Fetch from WMIP (primary source - real-time telemetry).
    // All gauges, including those flagged offline, so a gauge that comes back
    // online shows up automatically. Batched into a few multi-site requests.
    console.log('[Cron] Fetching from WMIP...')
    const wmipResults = await fetchWMIPMultipleGauges(gaugeIds)

    let wmipSuccessCount = 0
    for (const [gaugeId, result] of wmipResults) {
      if (result.success && result.data && isReadingFresh(result.data)) {
        const thresholds = FLOOD_THRESHOLDS[gaugeId] || null
        const enrichedData: WaterLevel = {
          ...result.data,
          status: calculateStatus(result.data.level, thresholds, result.data.changeRate),
        }
        waterLevelMap.set(gaugeId, enrichedData)
        wmipSuccessCount++

        if (result.data.level > 3) {
          console.log(`[Cron] WMIP high level at ${gaugeId}: ${result.data.level}m`)
        }
      }
    }

    console.log(`[Cron] WMIP: ${wmipSuccessCount}/${gaugeIds.length} gauges`)
    if (wmipSuccessCount > 0) {
      sources.push('wmip')
    }

    // Fetch from BOM for missing gauges (not for gauges flagged offline, nor
    // ones whose previous reading is still within BOM_MAX_READING_AGE_MS, which
    // BOM can't beat). BOM Water Data Online lags real time by ~14-24h, so its
    // readings are only used when within BOM_MAX_READING_AGE_MS
    // (fetchBOMWaterLevel enforces it); in practice this rarely succeeds.
    const hasRecentPrevious = (id: string): boolean => {
      const prevReading = previous?.waterLevels?.[id]
      return !!prevReading && isWithinAge(prevReading.timestamp, BOM_MAX_READING_AGE_MS)
    }
    const missingGaugeIds = gaugeIds.filter(
      (id) => !waterLevelMap.has(id) && !offlineIds.has(id) && !hasRecentPrevious(id)
    )
    if (missingGaugeIds.length > 0) {
      console.log(`[Cron] Fetching ${missingGaugeIds.length} missing gauges from BOM...`)
      const bomResults = await fetchBOMMultipleGauges(missingGaugeIds)

      let bomSuccessCount = 0
      for (const [gaugeId, result] of bomResults) {
        if (result.success && result.data && isReadingFresh(result.data)) {
          const thresholds = FLOOD_THRESHOLDS[gaugeId] || null
          const enrichedData: WaterLevel = {
            ...result.data,
            status: calculateStatus(result.data.level, thresholds, result.data.changeRate),
          }
          waterLevelMap.set(gaugeId, enrichedData)
          bomSuccessCount++
        }
      }

      console.log(`[Cron] BOM: ${bomSuccessCount}/${missingGaugeIds.length} gauges`)
      if (bomSuccessCount > 0) {
        sources.push('bom')
      }
    }

    // Carry forward previous readings that are still fresh (original timestamp
    // kept, so the UI's "outdated" warning still applies)
    let carriedForward = 0
    if (previous) {
      for (const gaugeId of gaugeIds) {
        if (waterLevelMap.has(gaugeId)) continue
        const prevReading = previous.waterLevels?.[gaugeId]
        if (prevReading && isReadingFresh(prevReading)) {
          waterLevelMap.set(gaugeId, prevReading)
          carriedForward++
        }
      }
      if (carriedForward > 0) {
        console.log(`[Cron] Carried forward ${carriedForward} previous readings`)
      }
    }

    // Extended data (discharge, rainfall) and dam storage from BOM.
    // Refreshed once per EXTENDED_REFRESH_BLOCK_MINUTES block, otherwise reused.
    let dischargeMap = new Map<string, DischargeReading>(Object.entries(previous?.discharge || {}))
    let rainfallMap = new Map<string, RainfallReading>(Object.entries(previous?.rainfall || {}))
    let damStorage: DamStorageReading[] = previous?.damStorage || []

    const minuteOfEpoch = Math.floor(Date.now() / 60000)
    const refreshExtended =
      !previous ||
      minuteOfEpoch % EXTENDED_REFRESH_BLOCK_MINUTES < 2 ||
      (dischargeMap.size === 0 && rainfallMap.size === 0 && damStorage.length === 0)

    if (refreshExtended) {
      console.log('[Cron] Fetching extended data...')
      try {
        const activeGaugeIds = gaugeIds.filter((id) => !offlineIds.has(id))
        const [extendedData, damStorageData] = await Promise.all([
          fetchBOMExtendedData(activeGaugeIds),
          fetchAllBOMDamStorage(),
        ])

        dischargeMap = extendedData.discharge
        rainfallMap = extendedData.rainfall
        damStorage = damStorageData

        console.log(`[Cron] Extended data: ${dischargeMap.size} discharge, ${rainfallMap.size} rainfall, ${damStorage.length} dam storage`)
      } catch (error) {
        console.error('[Cron] Error fetching extended data:', error)
      }
    } else {
      // Drop entries for gauges no longer in GAUGE_STATIONS (e.g. re-mapped IDs)
      const known = new Set(gaugeIds)
      for (const id of Array.from(dischargeMap.keys())) if (!known.has(id)) dischargeMap.delete(id)
      for (const id of Array.from(rainfallMap.keys())) if (!known.has(id)) rainfallMap.delete(id)
    }

    // Check for elevated levels (shorter refresh during floods)
    const isElevated = hasElevatedLevels(waterLevelMap)

    // Store to Firestore
    console.log('[Cron] Storing to Firestore...')
    const stored = await storeWaterLevelData(
      waterLevelMap,
      dischargeMap,
      rainfallMap,
      damStorage,
      sources,
      isElevated
    )

    if (!stored) {
      throw new Error('Failed to store data in Firestore')
    }

    // Track per-gauge uptime (which gauges reported FRESH data)
    // Only count as "reporting" if data timestamp is within 2 hours
    console.log('[Cron] Updating gauge uptime tracking...')
    const STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000 // 3 hours (accounts for hourly gauges and timezone differences)
    const now = Date.now()
    const reportingGaugeIds = new Set<string>()
    for (const [gaugeId, reading] of waterLevelMap) {
      const readingTime = new Date(reading.timestamp).getTime()
      if (now - readingTime < STALE_THRESHOLD_MS) {
        reportingGaugeIds.add(gaugeId)
      }
    }
    console.log(`[Cron] ${reportingGaugeIds.size}/${waterLevelMap.size} gauges have fresh data`)
    await updateGaugeUptimeTracking(gaugeIds, reportingGaugeIds)

    // Track partial failures for auxiliary data sources
    const partialFailures: { rainfall?: string; roadClosures?: string } = {}

    // Fetch and store statewide rainfall (from Open-Meteo)
    console.log('[Cron] Fetching statewide rainfall...')
    let rainfallStored = false
    try {
      const rainfallResult = await fetchStateRainfall()
      if (rainfallResult.success && rainfallResult.data) {
        rainfallStored = await storeStatewideRainfall(rainfallResult.data)
        console.log(`[Cron] Statewide rainfall: ${rainfallResult.data.sampleCount} locations, stored: ${rainfallStored}`)
      } else {
        partialFailures.rainfall = rainfallResult.error || 'Unknown error'
        console.warn('[Cron] Failed to fetch statewide rainfall:', rainfallResult.error)
      }
    } catch (error) {
      partialFailures.rainfall = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Cron] Error fetching statewide rainfall:', error)
    }

    // Fetch and store road closures (from QLDTraffic)
    console.log('[Cron] Fetching road closures...')
    let roadClosuresStored = false
    try {
      const roadEvents = await fetchRoadClosuresData()
      if (roadEvents.length >= 0) { // Even empty array is valid (no current closures)
        roadClosuresStored = await storeRoadClosures(roadEvents)
        console.log(`[Cron] Road closures: ${roadEvents.length} events, stored: ${roadClosuresStored}`)
      }
    } catch (error) {
      partialFailures.roadClosures = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Cron] Error fetching road closures:', error)
    }

    // Record partial failures if any occurred
    if (partialFailures.rainfall || partialFailures.roadClosures) {
      await recordPartialFailures(partialFailures)
    }

    // Record success and clear any partial errors that succeeded this time
    await recordFetchSuccess({
      rainfall: rainfallStored,
      roadClosures: roadClosuresStored,
    })

    const duration = Date.now() - startTime
    console.log(`[Cron] Fetch complete in ${duration}ms: ${waterLevelMap.size} gauges, elevated: ${isElevated}`)

    return NextResponse.json({
      success: true,
      gaugesUpdated: waterLevelMap.size,
      gaugesFresh: reportingGaugeIds.size,
      carriedForward,
      extendedRefreshed: refreshExtended,
      sources,
      isElevated,
      rainfallStored,
      roadClosuresStored,
      durationMs: duration,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Cron] Fetch failed:', errorMessage)

    await recordFetchError(errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request)
}
