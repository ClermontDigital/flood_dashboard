/**
 * Firestore Service for Water Level Data
 *
 * Provides centralized data storage that works across all Cloud Run instances.
 * Data is updated by Cloud Scheduler every 1-2 minutes.
 */

import { Firestore, FieldValue } from '@google-cloud/firestore'
import type { WaterLevel, DischargeReading, RainfallReading, DamStorageReading, RoadEvent } from './types'
import type { StateRainfallSummary } from './data-sources/rainfall'

// Check if we have credentials (Cloud Run provides these automatically)
const hasCredentials = !!(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.K_SERVICE // Cloud Run sets this
)

// Initialize Firestore client lazily to avoid errors in local dev
let db: Firestore | null = null

function getDb(): Firestore | null {
  if (db) return db

  // Skip Firestore in local dev without credentials
  if (process.env.NODE_ENV === 'development' && !hasCredentials) {
    return null
  }

  try {
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'clermontdigital-1741262269603',
    })
    return db
  } catch (error) {
    console.warn('[Firestore] Failed to initialize:', error)
    return null
  }
}

// Collection names
const COLLECTIONS = {
  READINGS: 'readings',
  METADATA: 'metadata',
  STATEWIDE_RAINFALL: 'statewideRainfall',
  ROAD_CLOSURES: 'roadClosures',
  GAUGE_UPTIME: 'gaugeUptime',
} as const

// Document structure for water level readings
export interface StoredWaterLevelData {
  waterLevels: Record<string, WaterLevel>
  discharge: Record<string, DischargeReading>
  rainfall: Record<string, RainfallReading>
  damStorage: DamStorageReading[]
  sources: string[]
  timestamp: string
  fetchedAt: number // Unix timestamp for TTL checks
}

// Metadata document structure
export interface FetchMetadata {
  lastSuccessfulFetch: number
  lastAttempt: number
  successCount: number
  errorCount: number
  lastError?: string
  isElevated: boolean // True if any gauge has elevated water levels
}

/**
 * Get the latest water level data from Firestore
 * Returns null if no data exists or data is too stale
 */
export async function getWaterLevelData(maxAgeMs: number = 10 * 60 * 1000): Promise<StoredWaterLevelData | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.READINGS).doc('latest').get()

    if (!doc.exists) {
      console.log('[Firestore] No data found in readings/latest')
      return null
    }

    const data = doc.data() as StoredWaterLevelData

    // Check if data is too stale
    const age = Date.now() - data.fetchedAt
    if (age > maxAgeMs) {
      console.log(`[Firestore] Data too stale: ${Math.round(age / 1000)}s old (max: ${maxAgeMs / 1000}s)`)
      return null
    }

    console.log(`[Firestore] Retrieved data, age: ${Math.round(age / 1000)}s, ${Object.keys(data.waterLevels).length} gauges`)
    return data
  } catch (error) {
    console.error('[Firestore] Error getting water level data:', error)
    return null
  }
}

/**
 * Store water level data to Firestore
 * Called by the data fetcher job
 */
export async function storeWaterLevelData(
  waterLevels: Map<string, WaterLevel>,
  discharge: Map<string, DischargeReading>,
  rainfall: Map<string, RainfallReading>,
  damStorage: DamStorageReading[],
  sources: string[],
  isElevated: boolean
): Promise<boolean> {
  const firestore = getDb()
  if (!firestore) return false

  try {
    const now = Date.now()

    // Convert Maps to objects for Firestore storage
    const data: StoredWaterLevelData = {
      waterLevels: Object.fromEntries(waterLevels),
      discharge: Object.fromEntries(discharge),
      rainfall: Object.fromEntries(rainfall),
      damStorage,
      sources,
      timestamp: new Date().toISOString(),
      fetchedAt: now,
    }

    // Store the latest readings
    await firestore.collection(COLLECTIONS.READINGS).doc('latest').set(data)

    // Update metadata
    const metadataRef = firestore.collection(COLLECTIONS.METADATA).doc('fetchStatus')
    await metadataRef.set({
      lastSuccessfulFetch: now,
      lastAttempt: now,
      isElevated,
    }, { merge: true })

    console.log(`[Firestore] Stored data for ${waterLevels.size} gauges, elevated: ${isElevated}`)
    return true
  } catch (error) {
    console.error('[Firestore] Error storing water level data:', error)

    // Record the error in metadata
    try {
      const fs = getDb()
      if (fs) {
        await fs.collection(COLLECTIONS.METADATA).doc('fetchStatus').set({
          lastAttempt: Date.now(),
          lastError: error instanceof Error ? error.message : 'Unknown error',
        }, { merge: true })
      }
    } catch {
      // Ignore metadata update errors
    }

    return false
  }
}

/**
 * Get fetch metadata (for monitoring)
 */
export async function getFetchMetadata(): Promise<FetchMetadata | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.METADATA).doc('fetchStatus').get()

    if (!doc.exists) {
      return null
    }

    return doc.data() as FetchMetadata
  } catch (error) {
    console.error('[Firestore] Error getting metadata:', error)
    return null
  }
}

/**
 * Record a fetch error in metadata
 */
export async function recordFetchError(error: string): Promise<void> {
  const firestore = getDb()
  if (!firestore) return

  try {
    await firestore.collection(COLLECTIONS.METADATA).doc('fetchStatus').set({
      lastAttempt: Date.now(),
      lastError: error,
      errorCount: FieldValue.increment(1),
    }, { merge: true })
  } catch (e) {
    console.error('[Firestore] Error recording fetch error:', e)
  }
}

/**
 * Record a successful fetch in metadata
 */
export async function recordFetchSuccess(clearPartialErrors?: {
  rainfall?: boolean
  roadClosures?: boolean
}): Promise<void> {
  const firestore = getDb()
  if (!firestore) return

  try {
    const updates: Record<string, unknown> = {
      lastSuccessfulFetch: Date.now(),
      lastAttempt: Date.now(),
      successCount: FieldValue.increment(1),
      lastError: FieldValue.delete(),
    }

    // Clear partial errors if their respective fetches succeeded
    if (clearPartialErrors?.rainfall) {
      updates.lastRainfallError = FieldValue.delete()
      updates.lastRainfallErrorAt = FieldValue.delete()
    }
    if (clearPartialErrors?.roadClosures) {
      updates.lastRoadClosuresError = FieldValue.delete()
      updates.lastRoadClosuresErrorAt = FieldValue.delete()
    }

    await firestore.collection(COLLECTIONS.METADATA).doc('fetchStatus').set(updates, { merge: true })
  } catch (e) {
    console.error('[Firestore] Error recording fetch success:', e)
  }
}

/**
 * Record partial failures (e.g., rainfall or road closures failed but water levels succeeded)
 */
export async function recordPartialFailures(failures: {
  rainfall?: string
  roadClosures?: string
}): Promise<void> {
  const firestore = getDb()
  if (!firestore) return

  try {
    const updates: Record<string, unknown> = {
      lastAttempt: Date.now(),
    }

    if (failures.rainfall) {
      updates.lastRainfallError = failures.rainfall
      updates.lastRainfallErrorAt = Date.now()
    }

    if (failures.roadClosures) {
      updates.lastRoadClosuresError = failures.roadClosures
      updates.lastRoadClosuresErrorAt = Date.now()
    }

    await firestore.collection(COLLECTIONS.METADATA).doc('fetchStatus').set(updates, { merge: true })
  } catch (e) {
    console.error('[Firestore] Error recording partial failures:', e)
  }
}

// ============================================
// Statewide Rainfall Storage
// ============================================

export interface StoredStatewideRainfall {
  data: StateRainfallSummary
  timestamp: string
  fetchedAt: number
}

/**
 * Store statewide rainfall data to Firestore
 */
export async function storeStatewideRainfall(data: StateRainfallSummary): Promise<boolean> {
  const firestore = getDb()
  if (!firestore) return false

  try {
    const now = Date.now()
    const stored: StoredStatewideRainfall = {
      data,
      timestamp: new Date().toISOString(),
      fetchedAt: now,
    }

    await firestore.collection(COLLECTIONS.STATEWIDE_RAINFALL).doc('latest').set(stored)
    console.log(`[Firestore] Stored statewide rainfall: ${data.sampleCount} locations`)
    return true
  } catch (error) {
    console.error('[Firestore] Error storing statewide rainfall:', error)
    return false
  }
}

/**
 * Get statewide rainfall data from Firestore
 */
export async function getStatewideRainfall(maxAgeMs: number = 10 * 60 * 1000): Promise<StoredStatewideRainfall | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.STATEWIDE_RAINFALL).doc('latest').get()

    if (!doc.exists) {
      console.log('[Firestore] No statewide rainfall data found')
      return null
    }

    const data = doc.data() as StoredStatewideRainfall

    const age = Date.now() - data.fetchedAt
    if (age > maxAgeMs) {
      console.log(`[Firestore] Statewide rainfall data too stale: ${Math.round(age / 1000)}s old`)
      return null
    }

    console.log(`[Firestore] Retrieved statewide rainfall, age: ${Math.round(age / 1000)}s`)
    return data
  } catch (error) {
    console.error('[Firestore] Error getting statewide rainfall:', error)
    return null
  }
}

// ============================================
// Road Closures Storage
// ============================================

export interface StoredRoadClosures {
  events: RoadEvent[]
  timestamp: string
  fetchedAt: number
  source: string
  sourceUrl: string
}

/**
 * Store road closures data to Firestore
 */
export async function storeRoadClosures(
  events: RoadEvent[],
  source: string = 'qldtraffic',
  sourceUrl: string = 'https://qldtraffic.qld.gov.au/'
): Promise<boolean> {
  const firestore = getDb()
  if (!firestore) return false

  try {
    const now = Date.now()
    const stored: StoredRoadClosures = {
      events,
      timestamp: new Date().toISOString(),
      fetchedAt: now,
      source,
      sourceUrl,
    }

    await firestore.collection(COLLECTIONS.ROAD_CLOSURES).doc('latest').set(stored)
    console.log(`[Firestore] Stored ${events.length} road closures`)
    return true
  } catch (error) {
    console.error('[Firestore] Error storing road closures:', error)
    return false
  }
}

/**
 * Get road closures data from Firestore
 */
export async function getRoadClosures(maxAgeMs: number = 10 * 60 * 1000): Promise<StoredRoadClosures | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.ROAD_CLOSURES).doc('latest').get()

    if (!doc.exists) {
      console.log('[Firestore] No road closures data found')
      return null
    }

    const data = doc.data() as StoredRoadClosures

    const age = Date.now() - data.fetchedAt
    if (age > maxAgeMs) {
      console.log(`[Firestore] Road closures data too stale: ${Math.round(age / 1000)}s old`)
      return null
    }

    console.log(`[Firestore] Retrieved road closures, age: ${Math.round(age / 1000)}s, ${data.events.length} events`)
    return data
  } catch (error) {
    console.error('[Firestore] Error getting road closures:', error)
    return null
  }
}

// ============================================
// Gauge Uptime Tracking
// ============================================

import type { DailyUptimeStat, GaugeUptimeData, GaugeUptimeSummary } from './types'

export interface StoredGaugeUptime {
  gauges: {
    [gaugeId: string]: {
      rollingUptime7d: number
      lastReportTimestamp: string | null
      dailyStats: DailyUptimeStat[]
    }
  }
  lastUpdated: string
}

/**
 * Convert a date to AEST date string (YYYY-MM-DD)
 */
function toAESTDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Australia/Brisbane',
  }) // en-CA gives YYYY-MM-DD format
}

/**
 * Calculate rolling 7-day uptime from daily stats
 */
function calculateRollingUptime7d(dailyStats: DailyUptimeStat[]): number {
  const last7Days = dailyStats.slice(-7)
  if (last7Days.length === 0) return 100

  const totalExpected = last7Days.reduce((sum, d) => sum + d.expectedReports, 0)
  const totalActual = last7Days.reduce((sum, d) => sum + d.actualReports, 0)

  if (totalExpected === 0) return 100

  // Cap at 100% to handle edge cases where actual exceeds expected
  return Math.min(100, Math.round((totalActual / totalExpected) * 1000) / 10) // 1 decimal place
}

/**
 * Update gauge uptime tracking data
 * Called by the cron job after each fetch cycle
 */
export async function updateGaugeUptimeTracking(
  allGaugeIds: string[],
  reportingGaugeIds: Set<string>
): Promise<boolean> {
  const firestore = getDb()
  if (!firestore) return false

  try {
    const now = new Date()
    const todayStr = toAESTDateString(now)
    const docRef = firestore.collection(COLLECTIONS.GAUGE_UPTIME).doc('summary')

    // Get existing data or create new
    const doc = await docRef.get()
    const existingData = doc.exists ? (doc.data() as StoredGaugeUptime) : { gauges: {}, lastUpdated: '' }

    // Update each gauge
    for (const gaugeId of allGaugeIds) {
      const isReporting = reportingGaugeIds.has(gaugeId)
      const gaugeData = existingData.gauges[gaugeId] || {
        rollingUptime7d: 100,
        lastReportTimestamp: null,
        dailyStats: [],
      }

      // Find or create today's stats
      let todayStats = gaugeData.dailyStats.find(s => s.date === todayStr)
      if (!todayStats) {
        todayStats = {
          date: todayStr,
          uptime: 100,
          expectedReports: 0,
          actualReports: 0,
          dataSource: 'ongoing',
        }
        gaugeData.dailyStats.push(todayStats)
      } else if (todayStats.dataSource === 'backfill') {
        // Handle backfill-to-ongoing transition: reset day's stats if it was from backfill
        // Backfill data uses raw 15-min intervals (~96 reports/day)
        // Ongoing tracking uses cron intervals (~720 reports/day at 2-min intervals)
        // When ongoing tracking starts for a day that was backfilled, reset to track from scratch
        todayStats.expectedReports = 0
        todayStats.actualReports = 0
        todayStats.dataSource = 'ongoing'
      }

      // Increment counters
      todayStats.expectedReports++
      if (isReporting) {
        todayStats.actualReports++
        gaugeData.lastReportTimestamp = now.toISOString()
      }

      // Recalculate today's uptime (cap at 100%)
      todayStats.uptime = todayStats.expectedReports > 0
        ? Math.min(100, Math.round((todayStats.actualReports / todayStats.expectedReports) * 1000) / 10)
        : 100

      // Keep only last 7 days of stats
      gaugeData.dailyStats = gaugeData.dailyStats
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)

      // Recalculate rolling 7-day uptime
      gaugeData.rollingUptime7d = calculateRollingUptime7d(gaugeData.dailyStats)

      existingData.gauges[gaugeId] = gaugeData
    }

    existingData.lastUpdated = now.toISOString()

    // Store updated data
    await docRef.set(existingData)
    console.log(`[Firestore] Updated uptime tracking for ${allGaugeIds.length} gauges`)
    return true
  } catch (error) {
    console.error('[Firestore] Error updating gauge uptime:', error)
    return false
  }
}

/**
 * Get uptime summary for all gauges (for list view)
 */
export async function getGaugeUptimeSummary(): Promise<GaugeUptimeSummary | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.GAUGE_UPTIME).doc('summary').get()

    if (!doc.exists) {
      console.log('[Firestore] No gauge uptime data found')
      return null
    }

    const data = doc.data() as StoredGaugeUptime

    // Convert to summary format (without dailyStats for efficiency)
    const summary: GaugeUptimeSummary = {}
    for (const [gaugeId, gaugeData] of Object.entries(data.gauges)) {
      summary[gaugeId] = {
        rollingUptime7d: gaugeData.rollingUptime7d,
        lastReportTimestamp: gaugeData.lastReportTimestamp,
      }
    }

    console.log(`[Firestore] Retrieved uptime summary for ${Object.keys(summary).length} gauges`)
    return summary
  } catch (error) {
    console.error('[Firestore] Error getting gauge uptime summary:', error)
    return null
  }
}

/**
 * Get detailed uptime data for a single gauge (for detail view with bar chart)
 */
export async function getGaugeUptimeDetail(gaugeId: string): Promise<GaugeUptimeData | null> {
  const firestore = getDb()
  if (!firestore) return null

  try {
    const doc = await firestore.collection(COLLECTIONS.GAUGE_UPTIME).doc('summary').get()

    if (!doc.exists) {
      console.log('[Firestore] No gauge uptime data found')
      return null
    }

    const data = doc.data() as StoredGaugeUptime
    const gaugeData = data.gauges[gaugeId]

    if (!gaugeData) {
      console.log(`[Firestore] No uptime data for gauge ${gaugeId}`)
      return null
    }

    return {
      rollingUptime7d: gaugeData.rollingUptime7d,
      lastReportTimestamp: gaugeData.lastReportTimestamp,
      dailyStats: gaugeData.dailyStats,
    }
  } catch (error) {
    console.error('[Firestore] Error getting gauge uptime detail:', error)
    return null
  }
}

export { getDb }
