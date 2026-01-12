/**
 * In-memory cache with stale-while-revalidate pattern
 *
 * Strategy:
 * - Returns cached data immediately for fast page loads
 * - Refreshes in background when cache is stale
 * - Shorter TTL during elevated water conditions (flood events)
 * - Cache persists in Cloud Run instance memory between requests
 *
 * Uses globalThis to ensure cache is shared across all module bundles
 * (Next.js can create separate module instances for different entry points)
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  isElevated: boolean // True if any gauge has elevated water levels
}

interface CacheConfig {
  normalTTL: number      // Normal cache duration (ms)
  elevatedTTL: number    // Cache duration during flood conditions (ms)
  staleThreshold: number // When to trigger background refresh (ms)
}

const DEFAULT_CONFIG: CacheConfig = {
  normalTTL: 3 * 60 * 1000,      // 3 minutes normally
  elevatedTTL: 60 * 1000,        // 1 minute during elevated conditions
  staleThreshold: 2 * 60 * 1000, // Start background refresh after 2 minutes
}

// Use globalThis for singleton pattern to survive module re-instantiation
// This ensures cache-warmer and route.ts share the same cache
const globalKey = '__FLOOD_DASHBOARD_CACHE__'
const globalRefreshKey = '__FLOOD_DASHBOARD_REFRESH_PROMISES__'

const globalObj = globalThis as Record<string, unknown>

// Initialize global cache store if not exists
if (!globalObj[globalKey]) {
  globalObj[globalKey] = new Map<string, CacheEntry<unknown>>()
  console.log('[Cache] Initialized global cache store')
}
if (!globalObj[globalRefreshKey]) {
  globalObj[globalRefreshKey] = new Map<string, Promise<unknown>>()
}

// Global cache storage (persists in Cloud Run instance memory)
const cacheStore = globalObj[globalKey] as Map<string, CacheEntry<unknown>>

// Track ongoing refresh promises to prevent duplicate fetches
const refreshPromises = globalObj[globalRefreshKey] as Map<string, Promise<unknown>>

export class DataCache<T> {
  private key: string
  private config: CacheConfig

  constructor(key: string, config: Partial<CacheConfig> = {}) {
    this.key = key
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get cached data if available and not expired
   */
  get(): CacheEntry<T> | null {
    const entry = cacheStore.get(this.key) as CacheEntry<T> | undefined
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    const ttl = entry.isElevated ? this.config.elevatedTTL : this.config.normalTTL

    // Return null if cache is completely expired
    if (age > ttl) {
      return null
    }

    return entry
  }

  /**
   * Check if cache needs background refresh (stale but not expired)
   */
  needsRefresh(): boolean {
    const entry = cacheStore.get(this.key) as CacheEntry<T> | undefined
    if (!entry) return true

    const age = Date.now() - entry.timestamp
    return age > this.config.staleThreshold
  }

  /**
   * Check if a refresh is already in progress
   */
  isRefreshing(): boolean {
    return refreshPromises.has(this.key)
  }

  /**
   * Set cache data
   */
  set(data: T, isElevated: boolean = false): void {
    cacheStore.set(this.key, {
      data,
      timestamp: Date.now(),
      isElevated,
    })
  }

  /**
   * Trigger background refresh without blocking
   */
  triggerBackgroundRefresh(fetchFn: () => Promise<T>, checkElevated: (data: T) => boolean): void {
    // Don't start another refresh if one is in progress
    if (this.isRefreshing()) {
      console.log(`[Cache] Background refresh already in progress for ${this.key}`)
      return
    }

    console.log(`[Cache] Starting background refresh for ${this.key}`)

    const promise = fetchFn()
      .then((data) => {
        const isElevated = checkElevated(data)
        this.set(data, isElevated)
        console.log(`[Cache] Background refresh complete for ${this.key}, elevated: ${isElevated}`)
        return data
      })
      .catch((error) => {
        console.error(`[Cache] Background refresh failed for ${this.key}:`, error)
        throw error
      })
      .finally(() => {
        refreshPromises.delete(this.key)
      })

    refreshPromises.set(this.key, promise)
  }

  /**
   * Get with stale-while-revalidate pattern
   * Returns cached data immediately, triggers refresh if stale
   */
  async getOrFetch(
    fetchFn: () => Promise<T>,
    checkElevated: (data: T) => boolean
  ): Promise<{ data: T; fromCache: boolean; age: number }> {
    const cached = this.get()

    if (cached) {
      const age = Date.now() - cached.timestamp

      // If cache is stale, trigger background refresh
      if (this.needsRefresh() && !this.isRefreshing()) {
        this.triggerBackgroundRefresh(fetchFn, checkElevated)
      }

      return {
        data: cached.data,
        fromCache: true,
        age,
      }
    }

    // No cache, must fetch
    console.log(`[Cache] No cache for ${this.key}, fetching fresh data`)
    const data = await fetchFn()
    const isElevated = checkElevated(data)
    this.set(data, isElevated)

    return {
      data,
      fromCache: false,
      age: 0,
    }
  }

  /**
   * Clear cache entry
   */
  clear(): void {
    cacheStore.delete(this.key)
  }

  /**
   * Get cache statistics
   */
  getStats(): { age: number; isElevated: boolean; ttl: number } | null {
    const entry = cacheStore.get(this.key) as CacheEntry<T> | undefined
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    const ttl = entry.isElevated ? this.config.elevatedTTL : this.config.normalTTL

    return {
      age,
      isElevated: entry.isElevated,
      ttl,
    }
  }
}

// Pre-configured caches for different data types
// Using generic type as the actual data structure is defined in the API routes
export const waterLevelsCache = new DataCache<Record<string, unknown>>('water-levels', {
  normalTTL: 3 * 60 * 1000,      // 3 minutes normally
  elevatedTTL: 60 * 1000,        // 1 minute during flood conditions
  staleThreshold: 2 * 60 * 1000, // Refresh after 2 minutes
})

export const roadClosuresCache = new DataCache<unknown>('road-closures', {
  normalTTL: 5 * 60 * 1000,      // 5 minutes (road data changes less frequently)
  elevatedTTL: 2 * 60 * 1000,    // 2 minutes during incidents
  staleThreshold: 3 * 60 * 1000,
})

export const weatherCache = new DataCache<unknown>('weather', {
  normalTTL: 10 * 60 * 1000,     // 10 minutes
  elevatedTTL: 5 * 60 * 1000,    // 5 minutes during severe weather
  staleThreshold: 5 * 60 * 1000,
})
