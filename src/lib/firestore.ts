/**
 * Firestore Service for Water Level Data
 *
 * Provides centralized data storage that works across all Cloud Run instances.
 * Data is updated by Cloud Scheduler every 1-2 minutes.
 */

import { Firestore, FieldValue } from '@google-cloud/firestore'
import type { WaterLevel, DischargeReading, RainfallReading, DamStorageReading } from './types'

// Initialize Firestore client
// In Cloud Run, credentials are automatically provided via the service account
const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'clermontdigital-1741262269603',
})

// Collection names
const COLLECTIONS = {
  READINGS: 'readings',
  METADATA: 'metadata',
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
  try {
    const doc = await db.collection(COLLECTIONS.READINGS).doc('latest').get()

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
    await db.collection(COLLECTIONS.READINGS).doc('latest').set(data)

    // Update metadata
    const metadataRef = db.collection(COLLECTIONS.METADATA).doc('fetchStatus')
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
      await db.collection(COLLECTIONS.METADATA).doc('fetchStatus').set({
        lastAttempt: Date.now(),
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }, { merge: true })
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
  try {
    const doc = await db.collection(COLLECTIONS.METADATA).doc('fetchStatus').get()

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
  try {
    await db.collection(COLLECTIONS.METADATA).doc('fetchStatus').set({
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
export async function recordFetchSuccess(): Promise<void> {
  try {
    await db.collection(COLLECTIONS.METADATA).doc('fetchStatus').set({
      lastSuccessfulFetch: Date.now(),
      lastAttempt: Date.now(),
      successCount: FieldValue.increment(1),
      lastError: FieldValue.delete(),
    }, { merge: true })
  } catch (e) {
    console.error('[Firestore] Error recording fetch success:', e)
  }
}

export { db }
