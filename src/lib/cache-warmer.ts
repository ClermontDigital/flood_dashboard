/**
 * Cache Warmer
 * Pre-fetches data to warm the cache on server startup
 * This ensures first user requests are fast
 */

import { DataCache } from './cache'
import { GAUGE_STATIONS } from './constants'
import { calculateStatus } from './utils'
import {
  fetchWMIPMultipleGauges,
  fetchBOMMultipleGauges,
  fetchBOMExtendedData,
  fetchAllBOMDamStorage,
} from './data-sources'
import type { WaterLevel, DischargeReading, RainfallReading, DamStorageReading, FloodThresholds } from './types'

// Cached water data structure
interface CachedWaterData {
  waterLevelMap: Map<string, WaterLevel>
  dischargeMap: Map<string, DischargeReading>
  rainfallMap: Map<string, RainfallReading>
  damStorage: DamStorageReading[]
  sources: string[]
}

// Flood thresholds (duplicated here to avoid circular imports)
const FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 },
  '130401A': { minor: 5.0, moderate: 7.0, major: 9.0 },
  '130410A': { minor: 6.0, moderate: 8.0, major: 10.0 },
  '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 },
  '130219A': { minor: 4.5, moderate: 6.5, major: 8.5 },
  '130106A': { minor: 8.0, moderate: 10.0, major: 12.0 },
  '130105B': { minor: 7.0, moderate: 9.0, major: 11.0 },
  '130113A': { minor: 6.0, moderate: 8.0, major: 10.0 },
  '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 },
  '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 },
}

// Create the cache instance (shared with route.ts via cache key)
const waterLevelsCache = new DataCache<CachedWaterData>('water-levels', {
  normalTTL: 3 * 60 * 1000,
  elevatedTTL: 60 * 1000,
  staleThreshold: 2 * 60 * 1000,
})

/**
 * Fetch water level data (same logic as route.ts)
 */
async function fetchWaterLevelData(): Promise<CachedWaterData> {
  const gaugeIds = GAUGE_STATIONS.map((station) => station.id)
  const sources: string[] = []
  const waterLevelMap = new Map<string, WaterLevel>()

  console.log('[CacheWarmer] Fetching water levels for', gaugeIds.length, 'gauges')

  const isDataFresh = (timestamp: string): boolean => {
    const dataTime = new Date(timestamp).getTime()
    const now = Date.now()
    const maxAge = 48 * 60 * 60 * 1000
    return (now - dataTime) < maxAge && dataTime <= now
  }

  try {
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

    console.log(`[CacheWarmer] WMIP returned fresh data for ${wmipSuccessCount}/${gaugeIds.length} gauges`)

    if (wmipSuccessCount > 0) {
      sources.push('wmip')
    }

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
    console.error('[CacheWarmer] Error fetching water levels:', error)
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
    console.error('[CacheWarmer] Error fetching extended data:', error)
  }

  return {
    waterLevelMap,
    dischargeMap,
    rainfallMap,
    damStorage,
    sources,
  }
}

/**
 * Check if any gauge has elevated water levels
 */
function checkElevatedWaterLevels(data: CachedWaterData): boolean {
  for (const [, reading] of data.waterLevelMap) {
    if (reading.status === 'watch' || reading.status === 'warning' || reading.status === 'danger') {
      return true
    }
  }
  return false
}

/**
 * Warm the cache by fetching fresh data
 * Called on server startup
 */
export async function warmCache(): Promise<void> {
  console.log('[CacheWarmer] Starting cache warm-up...')
  const startTime = Date.now()

  try {
    const data = await fetchWaterLevelData()
    const isElevated = checkElevatedWaterLevels(data)
    waterLevelsCache.set(data, isElevated)

    const duration = Date.now() - startTime
    console.log(`[CacheWarmer] Cache warmed in ${duration}ms - ${data.waterLevelMap.size} gauges cached`)
  } catch (error) {
    console.error('[CacheWarmer] Failed to warm cache:', error)
  }
}
