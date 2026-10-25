/**
 * Builds the /api/water-levels response from stored or fetched readings. Shared by the API route
 * and the server-rendered pages, so the dashboard gets the same shape either way.
 *
 * Readings are only served while recent enough to present as current: WMIP readings up to 24h
 * old (the WMIP request window; the UI flags anything over 3h as outdated) and BOM readings up to
 * BOM_MAX_READING_AGE_MS, because BOM Water Data Online lags by ~14-24h.
 */

import { OFFICIAL_FLOOD_THRESHOLDS } from './flood-thresholds'
import { GAUGE_STATIONS } from './constants'
import { calculateStatus } from './utils'
import { BOM_MAX_READING_AGE_MS } from './data-sources/bom'
import type { WaterLevelsResponse, GaugeData, WaterLevel, DischargeReading, RainfallReading, DamStorageReading, GaugeUptimeSummary } from './types'

const WMIP_MAX_READING_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Whether a reading is recent enough to present as the current level
 * (allows 1 minute of clock skew for future timestamps)
 */
export function isReadingFresh(reading: WaterLevel | null | undefined): reading is WaterLevel {
  if (!reading) return false
  const dataTime = new Date(reading.timestamp).getTime()
  const maxAge = reading.source === 'bom' ? BOM_MAX_READING_AGE_MS : WMIP_MAX_READING_AGE_MS
  const now = Date.now()
  return !isNaN(dataTime) && now - dataTime < maxAge && dataTime <= now + 60 * 1000
}

export function buildWaterLevelsResponse(data: {
  waterLevelMap: Map<string, WaterLevel>
  dischargeMap: Map<string, DischargeReading>
  rainfallMap: Map<string, RainfallReading>
  damStorage: DamStorageReading[]
  sources: string[]
  uptimeSummary: GaugeUptimeSummary | null
}): WaterLevelsResponse {
  // Never present stale readings as current (e.g. BOM daily aggregates that
  // older cron versions stored, or a reading carried forward too long)
  const gauges: GaugeData[] = GAUGE_STATIONS.map((station) => {
    const reading = data.waterLevelMap.get(station.id)
    const thresholds = OFFICIAL_FLOOD_THRESHOLDS[station.id] || null
    return {
      station,
      // Status is recomputed here so readings stored by any cron version follow the current rules
      reading: reading && isReadingFresh(reading) ? { ...reading, status: calculateStatus(reading.level, thresholds, reading.changeRate) } : null,
      thresholds,
      discharge: data.dischargeMap.get(station.id) || null,
      rainfall: data.rainfallMap.get(station.id) || null,
      uptime: data.uptimeSummary?.[station.id] || undefined,
    }
  })

  return {
    timestamp: new Date().toISOString(),
    gauges,
    sources: data.sources,
    damStorage: data.damStorage.length > 0 ? data.damStorage : undefined,
  }
}
