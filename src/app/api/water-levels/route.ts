/**
 * Water Levels API Route
 * GET /api/water-levels
 *
 * Returns current water levels for all 17 gauges.
 * Primary: Reads from Firestore (updated every 1-2 min by Cloud Scheduler)
 * Fallback: Direct fetch from WMIP/BOM if Firestore is unavailable
 */

import { NextResponse, NextRequest } from 'next/server'
import type { WaterLevelsResponse, GaugeData, WaterLevel, FloodThresholds, DischargeReading, RainfallReading, DamStorageReading } from '@/lib/types'
import { GAUGE_STATIONS } from '@/lib/constants'
import { calculateStatus } from '@/lib/utils'
import {
  fetchWMIPMultipleGauges,
  fetchBOMMultipleGauges,
  fetchBOMExtendedData,
  fetchAllBOMDamStorage,
} from '@/lib/data-sources'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/rate-limit'
import { getWaterLevelData } from '@/lib/firestore'

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

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

/**
 * Fallback: Fetch water level data directly from WMIP/BOM
 * Only used if Firestore is unavailable or data is too stale
 */
async function fetchWaterLevelDataDirect(): Promise<{
  waterLevelMap: Map<string, WaterLevel>
  dischargeMap: Map<string, DischargeReading>
  rainfallMap: Map<string, RainfallReading>
  damStorage: DamStorageReading[]
  sources: string[]
}> {
  const gaugeIds = GAUGE_STATIONS.map((station) => station.id)
  const sources: string[] = []
  const waterLevelMap = new Map<string, WaterLevel>()

  console.log('[API] Fallback: Direct fetch from WMIP/BOM for', gaugeIds.length, 'gauges')

  // Helper to check if data is fresh (within last 48 hours)
  const isDataFresh = (timestamp: string): boolean => {
    const dataTime = new Date(timestamp).getTime()
    const now = Date.now()
    const maxAge = 48 * 60 * 60 * 1000 // 48 hours
    return (now - dataTime) < maxAge && dataTime <= now
  }

  try {
    // Try WMIP first (real-time telemetry data)
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
      }
    }

    if (wmipSuccessCount > 0) {
      sources.push('wmip')
    }

    // For gauges without WMIP data, try BOM fallback
    const missingGaugeIds = gaugeIds.filter((id) => !waterLevelMap.has(id))

    if (missingGaugeIds.length > 0) {
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

      if (bomSuccessCount > 0) {
        sources.push('bom')
      }
    }

    if (waterLevelMap.size === 0) {
      sources.push('unavailable')
    }
  } catch (error) {
    console.error('[API] Error in direct fetch:', error)
    sources.push('error')
  }

  // Fetch extended data
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
  } catch (error) {
    console.error('[API] Error fetching extended data:', error)
  }

  return {
    waterLevelMap,
    dischargeMap,
    rainfallMap,
    damStorage,
    sources,
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<WaterLevelsResponse>> {
  // Apply rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult) as NextResponse<WaterLevelsResponse>
  }

  let waterLevelMap: Map<string, WaterLevel>
  let dischargeMap: Map<string, DischargeReading>
  let rainfallMap: Map<string, RainfallReading>
  let damStorage: DamStorageReading[]
  let sources: string[]
  let dataAge = 0
  let fromFirestore = false

  // Try Firestore first (data updated every 1-2 min by Cloud Scheduler)
  // Max age: 10 minutes - if data is older, fall back to direct fetch
  const firestoreData = await getWaterLevelData(10 * 60 * 1000)

  if (firestoreData) {
    // Use Firestore data (fast path)
    waterLevelMap = new Map(Object.entries(firestoreData.waterLevels))
    dischargeMap = new Map(Object.entries(firestoreData.discharge))
    rainfallMap = new Map(Object.entries(firestoreData.rainfall))
    damStorage = firestoreData.damStorage
    sources = [...firestoreData.sources, 'firestore']
    dataAge = Date.now() - firestoreData.fetchedAt
    fromFirestore = true

    console.log(`[API] Serving from Firestore (age: ${Math.round(dataAge / 1000)}s, ${waterLevelMap.size} gauges)`)
  } else {
    // Fallback to direct fetch (slow path - only if Firestore is unavailable)
    console.log('[API] Firestore unavailable, using direct fetch fallback')
    const directData = await fetchWaterLevelDataDirect()
    waterLevelMap = directData.waterLevelMap
    dischargeMap = directData.dischargeMap
    rainfallMap = directData.rainfallMap
    damStorage = directData.damStorage
    sources = [...directData.sources, 'direct-fallback']
    dataAge = 0

    console.log(`[API] Direct fetch complete: ${waterLevelMap.size} gauges`)
  }

  // Build response
  const gauges: GaugeData[] = GAUGE_STATIONS.map((station) => ({
    station,
    reading: waterLevelMap.get(station.id) || null,
    thresholds: FLOOD_THRESHOLDS[station.id] || null,
    discharge: dischargeMap.get(station.id) || null,
    rainfall: rainfallMap.get(station.id) || null,
  }))

  const response: WaterLevelsResponse = {
    timestamp: new Date().toISOString(),
    gauges,
    sources,
    damStorage: damStorage.length > 0 ? damStorage : undefined,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'X-Data-Age': String(Math.round(dataAge / 1000)),
      'X-Data-Source': fromFirestore ? 'firestore' : 'direct',
    },
  })
}
