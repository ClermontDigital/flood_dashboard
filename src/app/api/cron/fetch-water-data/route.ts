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
import type { WaterLevel, DischargeReading, RainfallReading, DamStorageReading, FloodThresholds, RoadEvent } from '@/lib/types'
import { GAUGE_STATIONS } from '@/lib/constants'
import { env } from '@/lib/env'
import { calculateStatus } from '@/lib/utils'
import {
  fetchWMIPMultipleGauges,
  fetchBOMMultipleGauges,
  fetchBOMExtendedData,
  fetchAllBOMDamStorage,
  fetchStateRainfall,
} from '@/lib/data-sources'
import {
  storeWaterLevelData,
  recordFetchError,
  recordFetchSuccess,
  recordPartialFailures,
  storeStatewideRainfall,
  storeRoadClosures,
} from '@/lib/firestore'

// Queensland state bounding box
const QLD_BOUNDS = {
  north: -16.0,
  south: -29.0,
  east: 154.0,
  west: 138.0,
}

// Known flood thresholds for gauges
const FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 }, // Sandy Creek @ Clermont
  '130401A': { minor: 5.0, moderate: 7.0, major: 9.0 }, // Isaac River @ Yatton
  '130410A': { minor: 6.0, moderate: 8.0, major: 10.0 }, // Isaac River @ Deverill
  '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 }, // Nogoa @ Craigmore
  '130219A': { minor: 4.5, moderate: 6.5, major: 8.5 }, // Nogoa @ Duck Ponds
  '130106A': { minor: 8.0, moderate: 10.0, major: 12.0 }, // Mackenzie @ Bingegang
  '130105B': { minor: 7.0, moderate: 9.0, major: 11.0 }, // Mackenzie @ Coolmaringa
  '130113A': { minor: 6.0, moderate: 8.0, major: 10.0 }, // Mackenzie @ Rileys
  '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 }, // Fitzroy @ The Gap
  '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 }, // Fitzroy @ Rockhampton
}

// Cron secret for basic authentication (in addition to Cloud Scheduler's OIDC)
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Verify the request is from Cloud Scheduler or has a valid cron secret
 */
function isAuthorized(request: NextRequest): boolean {
  // Check for cron secret header
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && CRON_SECRET && cronSecret === CRON_SECRET) {
    return true
  }

  // Check for Cloud Scheduler OIDC token (handled by Cloud Run's IAM)
  // When configured correctly, Cloud Run validates the OIDC token automatically
  // and allows the request through if the service account is authorized

  // For local development, allow if no secret is configured
  if (!CRON_SECRET && process.env.NODE_ENV === 'development') {
    return true
  }

  // Check for Google Cloud Scheduler user agent
  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.includes('Google-Cloud-Scheduler')) {
    return true
  }

  return false
}

/**
 * Helper to check if data is fresh (within last 48 hours)
 */
function isDataFresh(timestamp: string): boolean {
  const dataTime = new Date(timestamp).getTime()
  const now = Date.now()
  const maxAge = 48 * 60 * 60 * 1000 // 48 hours
  return (now - dataTime) < maxAge && dataTime <= now
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

      // Get coordinates
      let coords: { lat: number; lng: number } | null = null
      if (geometry?.coordinates) {
        if (geometry.type === 'Point') {
          coords = { lat: geometry.coordinates[1], lng: geometry.coordinates[0] }
        } else if (geometry.type === 'LineString' && geometry.coordinates.length > 0) {
          const mid = Math.floor(geometry.coordinates.length / 2)
          coords = { lat: geometry.coordinates[mid][1], lng: geometry.coordinates[mid][0] }
        } else if (geometry.type === 'MultiLineString' && geometry.coordinates[0]?.length > 0) {
          coords = { lat: geometry.coordinates[0][0][1], lng: geometry.coordinates[0][0][0] }
        }
      }

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
  const sources: string[] = []
  const waterLevelMap = new Map<string, WaterLevel>()

  try {
    // Fetch from WMIP (primary source - real-time telemetry)
    console.log('[Cron] Fetching from WMIP...')
    const wmipResults = await fetchWMIPMultipleGauges(gaugeIds)

    let wmipSuccessCount = 0
    for (const [gaugeId, result] of wmipResults) {
      if (result.success && result.data && isDataFresh(result.data.timestamp)) {
        const thresholds = FLOOD_THRESHOLDS[gaugeId] || null
        const enrichedData: WaterLevel = {
          ...result.data,
          status: calculateStatus(result.data.level, thresholds),
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

    // Fetch from BOM for missing gauges
    const missingGaugeIds = gaugeIds.filter((id) => !waterLevelMap.has(id))
    if (missingGaugeIds.length > 0) {
      console.log(`[Cron] Fetching ${missingGaugeIds.length} missing gauges from BOM...`)
      const bomResults = await fetchBOMMultipleGauges(missingGaugeIds)

      let bomSuccessCount = 0
      for (const [gaugeId, result] of bomResults) {
        if (result.success && result.data && isDataFresh(result.data.timestamp)) {
          const thresholds = FLOOD_THRESHOLDS[gaugeId] || null
          const enrichedData: WaterLevel = {
            ...result.data,
            status: calculateStatus(result.data.level, thresholds),
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

    // Fetch extended data (discharge, rainfall) and dam storage
    console.log('[Cron] Fetching extended data...')
    let dischargeMap = new Map<string, DischargeReading>()
    let rainfallMap = new Map<string, RainfallReading>()
    let damStorage: DamStorageReading[] = []

    try {
      const [extendedData, damStorageData] = await Promise.all([
        fetchBOMExtendedData(gaugeIds),
        fetchAllBOMDamStorage(),
      ])

      dischargeMap = extendedData.discharge
      rainfallMap = extendedData.rainfall
      damStorage = damStorageData

      console.log(`[Cron] Extended data: ${dischargeMap.size} discharge, ${rainfallMap.size} rainfall, ${damStorage.length} dam storage`)
    } catch (error) {
      console.error('[Cron] Error fetching extended data:', error)
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
