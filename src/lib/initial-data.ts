/**
 * Water levels for the server-rendered first paint, so visitors and search engines get real
 * gauge content instead of loading placeholders. Firestore only (never the slow live fetch),
 * cached briefly per instance; null when Firestore is slow or unavailable, in which case the
 * dashboard loads the data in the browser as before.
 */

import { getWaterLevelData, getGaugeUptimeSummary } from './firestore'
import { buildWaterLevelsResponse } from './water-levels'
import type { WaterLevelsResponse } from './types'

const CACHE_MS = 60 * 1000
const FAILURE_CACHE_MS = 10 * 1000
const TIMEOUT_MS = 3000
// Same limit as /api/water-levels, so the page and the API agree on what's current
const MAX_DATA_AGE_MS = 10 * 60 * 1000

let cached: { at: number; ttl: number; value: WaterLevelsResponse | null } | null = null
let pending: Promise<WaterLevelsResponse | null> | null = null

async function load(): Promise<WaterLevelsResponse | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))
  const read = Promise.all([getWaterLevelData(MAX_DATA_AGE_MS), getGaugeUptimeSummary()])
  const result = await Promise.race([read, timeout]).catch(() => null)
  if (!result || !result[0]) return null
  const [stored, uptimeSummary] = result
  return buildWaterLevelsResponse({
    waterLevelMap: new Map(Object.entries(stored.waterLevels)),
    dischargeMap: new Map(Object.entries(stored.discharge)),
    rainfallMap: new Map(Object.entries(stored.rainfall)),
    damStorage: stored.damStorage,
    sources: [...stored.sources, 'firestore'],
    uptimeSummary,
  })
}

export async function getInitialWaterLevels(): Promise<WaterLevelsResponse | null> {
  if (cached && Date.now() - cached.at < cached.ttl) return cached.value
  pending ??= load()
    .then((value) => {
      cached = { at: Date.now(), ttl: value ? CACHE_MS : FAILURE_CACHE_MS, value }
      return value
    })
    .finally(() => { pending = null })
  return pending
}
