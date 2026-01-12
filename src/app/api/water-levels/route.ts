/**
 * Water Levels API Route
 * GET /api/water-levels
 *
 * Returns current water levels for all 17 gauges.
 * Aggregates data from WMIP (primary) with BOM fallback.
 * Responses are cached for 5 minutes.
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

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

// Known flood thresholds for gauges
const FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 }, // Sandy Creek @ Clermont
  '130212A': { minor: 3.0, moderate: 4.5, major: 6.0 }, // Theresa Creek
  '120311A': { minor: 2.5, moderate: 4.0, major: 5.5 }, // Clermont Alpha Rd
  '130401A': { minor: 5.0, moderate: 7.0, major: 9.0 }, // Isaac River @ Yatton
  '130410A': { minor: 6.0, moderate: 8.0, major: 10.0 }, // Isaac River @ Deverill
  '130408A': { minor: 4.0, moderate: 6.0, major: 8.0 }, // Connors River
  '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 }, // Nogoa @ Craigmore
  '130219A': { minor: 4.5, moderate: 6.5, major: 8.5 }, // Nogoa @ Duck Ponds
  '130204A': { minor: 3.0, moderate: 4.5, major: 6.0 }, // Retreat Creek
  '130106A': { minor: 8.0, moderate: 10.0, major: 12.0 }, // Mackenzie @ Bingegang
  '130105B': { minor: 7.0, moderate: 9.0, major: 11.0 }, // Mackenzie @ Coolmaringa
  '130113A': { minor: 6.0, moderate: 8.0, major: 10.0 }, // Mackenzie @ Rileys
  '130504A': { minor: 5.0, moderate: 7.0, major: 9.0 }, // Comet River @ Weir
  '130502A': { minor: 4.0, moderate: 6.0, major: 8.0 }, // Comet River @ The Lake
  '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 }, // Fitzroy @ The Gap
  '130003A': { minor: 6.5, moderate: 8.0, major: 9.5 }, // Fitzroy @ Yaamba
  '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 }, // Fitzroy @ Rockhampton
}

export async function GET(request: NextRequest): Promise<NextResponse<WaterLevelsResponse>> {
  // Apply rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult) as NextResponse<WaterLevelsResponse>
  }

  const gaugeIds = GAUGE_STATIONS.map((station) => station.id)
  const sources: string[] = []

  let waterLevelMap = new Map<string, WaterLevel>()
  let useMockData = false

  console.log('[API] Fetching water levels for', gaugeIds.length, 'gauges')

  // Helper to check if data is fresh (within last 48 hours)
  // 48h allows for data updates that may be delayed during weekends/holidays
  const isDataFresh = (timestamp: string): boolean => {
    const dataTime = new Date(timestamp).getTime()
    const now = Date.now()
    const maxAge = 48 * 60 * 60 * 1000 // 48 hours
    return (now - dataTime) < maxAge && dataTime <= now
  }

  try {
    // Try BOM first (more reliable for current data)
    console.log('[API] Trying BOM as primary source...')
    const bomResults = await fetchBOMMultipleGauges(gaugeIds)

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

        // Log high water levels
        if (result.data.level > 3) {
          console.log(`[API] BOM high level at ${gaugeId}: ${result.data.level}m (status: ${enrichedData.status})`)
        }
      } else if (result.data && !isDataFresh(result.data.timestamp)) {
        console.log(`[API] BOM data stale for ${gaugeId}: ${result.data.timestamp}`)
      }
    }

    console.log(`[API] BOM returned fresh data for ${bomSuccessCount}/${gaugeIds.length} gauges`)

    if (bomSuccessCount > 0) {
      sources.push('bom')
    }

    // For gauges without BOM data, try WMIP fallback
    const missingGaugeIds = gaugeIds.filter((id) => !waterLevelMap.has(id))

    if (missingGaugeIds.length > 0) {
      console.log(`[API] Trying WMIP for ${missingGaugeIds.length} missing gauges...`)
      const wmipResults = await fetchWMIPMultipleGauges(missingGaugeIds)

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
            console.log(`[API] WMIP high level at ${gaugeId}: ${result.data.level}m (status: ${enrichedData.status})`)
          }
        } else if (result.data && !isDataFresh(result.data.timestamp)) {
          console.log(`[API] WMIP data stale for ${gaugeId}: ${result.data.timestamp}`)
        } else if (result.error) {
          console.log(`[API] WMIP error for ${gaugeId}: ${result.error}`)
        }
      }

      console.log(`[API] WMIP returned fresh data for ${wmipSuccessCount}/${missingGaugeIds.length} gauges`)

      if (wmipSuccessCount > 0) {
        sources.push('wmip')
      }
    }

    // Log missing gauges (gauges with no fresh data from any source)
    const stillMissingGaugeIds = gaugeIds.filter((id) => !waterLevelMap.has(id))
    if (stillMissingGaugeIds.length > 0) {
      console.log(`[API] No fresh data for ${stillMissingGaugeIds.length} gauges:`, stillMissingGaugeIds.join(', '))
    }

    // Log if no data available
    if (waterLevelMap.size === 0) {
      console.warn('[API] No data available from any source')
      sources.push('unavailable')
    }
  } catch (error) {
    console.error('Error fetching water levels:', error)
    sources.push('error')
  }

  // Fetch extended data (discharge, rainfall) and dam storage in parallel
  let dischargeMap = new Map<string, DischargeReading>()
  let rainfallMap = new Map<string, RainfallReading>()
  let damStorage: DamStorageReading[] = []

  try {
    console.log('[API] Fetching extended data (discharge, rainfall, dam storage)...')

    const [extendedData, damStorageData] = await Promise.all([
      fetchBOMExtendedData(gaugeIds),
      fetchAllBOMDamStorage(),
    ])

    dischargeMap = extendedData.discharge
    rainfallMap = extendedData.rainfall
    damStorage = damStorageData

    console.log(`[API] Extended data: ${dischargeMap.size} discharge, ${rainfallMap.size} rainfall, ${damStorage.length} dam storage readings`)
  } catch (error) {
    console.error('[API] Error fetching extended data:', error)
  }

  console.log(`[API] Response: ${waterLevelMap.size} gauges, sources: ${sources.join(', ')}`)

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
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
