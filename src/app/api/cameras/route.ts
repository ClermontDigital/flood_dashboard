import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/http'
import type { FloodCamera, FloodCamerasResponse } from '@/lib/types'
import { createCouncilFeedCache, representativePoint, text, type QitCouncil, type QitFeature } from '@/lib/data-sources/qitplus'

// Dynamic so responses can be compressed per request; the in-memory cache below does the caching
export const dynamic = 'force-dynamic'

// Flood cameras from council disaster dashboards on the QIT Plus ("Guardian IMS") platform.
// Every council's camera feed uses the same GeoJSON format; the images themselves are hosted
// by a mix of providers (Envault, Disaster Watch, QLDTraffic's camera server, council buckets…).
// The council list lives in src/lib/data-sources/qitplus.ts.

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Camera positions to offset so they don't overlap nearby gauge markers.
// Keys are `${council.id}-${camera id}`.
const POSITION_OFFSETS: Record<string, { lat: number; lng: number }> = {
  'isaac-46': { lat: 0.008, lng: -0.008 },  // Theresa Creek Dam - offset from gauge 130206A
  'chrc-552': { lat: 0.008, lng: -0.008 },  // Theresa Creek Dam (CHRC) - same location
}

const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|bmp)$/i
const PAGE_EXTENSION = /\.(html?|php|aspx?|jsp)$/i
// Extension-less image endpoints, e.g. envault.com.au/api?contentUrl=…, usee.com/apiV3/latestimage/…
const IMAGE_ENDPOINT_HINT = /image|img|photo|snapshot|latest|camera|cam|content|api|media|upload/i

/** Returns the URL if it plausibly points at an image, or null for web pages, junk and blanks. */
function cleanImageUrl(raw: string): string | null {
  const candidate = raw.trim().replace(/&amp;/gi, '&')
  if (!candidate) return null

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  // QLDTraffic web pages (camera images live on cameras.qldtraffic.qld.gov.au)
  const host = url.hostname.toLowerCase()
  if (/(^|\.)qldtraffic\.qld\.gov\.au$/.test(host) && !host.startsWith('cameras.')) return null

  const path = url.pathname
  if (PAGE_EXTENSION.test(path)) return null
  if (IMAGE_EXTENSION.test(path)) return candidate
  if (IMAGE_ENDPOINT_HINT.test(path + url.search)) return candidate
  return null
}

function parseCameras(features: QitFeature[], council: QitCouncil): FloodCamera[] {
  const cameras: FloodCamera[] = []
  for (const f of features) {
    const props = f.properties ?? {}
    if (!text(props.typeName).toLowerCase().includes('flood camera')) continue

    const id = Number(props.id ?? f.id)
    if (!Number.isFinite(id)) continue

    const imageUrls = String(props.image_url ?? '')
      .split(',')
      .map(cleanImageUrl)
      .filter((u): u is string => u !== null)
    if (imageUrls.length === 0) continue

    const point = representativePoint(f.geometry)
    if (!point) continue

    const offset = POSITION_OFFSETS[`${council.id}-${id}`]
    cameras.push({
      id,
      description: text(props.description) || 'Flood camera',
      lat: point.lat + (offset?.lat || 0),
      lng: point.lng + (offset?.lng || 0),
      imageUrls,
      source: council.name,
    })
  }
  return cameras
}

const cameraFeed = createCouncilFeedCache('cameras', parseCameras, { ttlMs: CACHE_TTL })

// Last deduplicated list, keyed by the snapshot it was built from
let cachedCameras: FloodCamera[] | null = null
let cacheTimestamp = 0

/**
 * Simplify a camera name for fuzzy matching.
 * Strips punctuation, common suffixes, and normalizes whitespace.
 */
function simplifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[–—\-,()]/g, ' ')  // Replace dashes, commas, parens with spaces
    .replace(/\b(hwy|highway|rd|road|ck|creek|st|street)\b/g, '')  // Remove common abbreviations
    .replace(/\b(clermont|emerald)\b/g, '')  // Remove town names that vary
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Deduplicate cameras from multiple sources by location proximity.
 * Uses fuzzy name matching to catch slight description differences.
 */
function deduplicateCameras(cameras: FloodCamera[]): FloodCamera[] {
  const result: FloodCamera[] = []
  const seenImageUrls = new Set<string>()
  const PROXIMITY_THRESHOLD = 0.01 // ~1km in degrees

  for (const camera of cameras) {
    // Exact dedup: skip cameras sharing the same image feed URL
    const primaryUrl = camera.imageUrls[0]
    if (primaryUrl && seenImageUrls.has(primaryUrl)) continue
    if (primaryUrl) seenImageUrls.add(primaryUrl)

    // Fuzzy dedup: skip cameras near each other with similar names
    const simplified = simplifyName(camera.description)
    const duplicate = result.find(existing => {
      if (Math.abs(existing.lat - camera.lat) >= PROXIMITY_THRESHOLD ||
          Math.abs(existing.lng - camera.lng) >= PROXIMITY_THRESHOLD) {
        return false
      }
      const existingSimplified = simplifyName(existing.description)
      // A name that simplifies to nothing would "match" everything nearby
      if (!simplified || !existingSimplified) return existing.description.toLowerCase() === camera.description.toLowerCase()
      return existingSimplified.includes(simplified) ||
             simplified.includes(existingSimplified) ||
             existingSimplified === simplified
    })
    if (!duplicate) {
      result.push(camera)
    }
  }

  return result
}

export async function GET(request: Request) {
  try {
    const snapshot = await cameraFeed.get()

    // Same snapshot as last time: serve the already-deduplicated list
    if (cachedCameras && snapshot.fetchedAt === cacheTimestamp) {
      return jsonResponse(request, {
        cameras: cachedCameras,
        lastUpdated: new Date(cacheTimestamp).toISOString(),
      } satisfies FloodCamerasResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      })
    }

    const allCameras = snapshot.results.flatMap(r => r.items)

    // Every source failed — keep serving the last good list rather than caching nothing
    if (allCameras.length === 0 && cachedCameras) {
      console.error('[Cameras] No cameras from any source, serving previous cache')
      return jsonResponse(request, {
        cameras: cachedCameras,
        lastUpdated: new Date(cacheTimestamp).toISOString(),
      } satisfies FloodCamerasResponse)
    }

    // Deduplicate cameras from overlapping council areas
    const cameras = deduplicateCameras(allCameras)
    const okCount = snapshot.councils.filter(c => c.ok).length

    console.log(`[Cameras] ${cameras.length} flood cameras from ${okCount}/${snapshot.councils.length} councils (${allCameras.length} before dedup)`)

    // Update cache
    cachedCameras = cameras
    cacheTimestamp = snapshot.fetchedAt

    return jsonResponse(request, {
      cameras,
      lastUpdated: new Date(snapshot.fetchedAt).toISOString(),
    } satisfies FloodCamerasResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[Cameras] Error fetching cameras:', error)
    if (cachedCameras) {
      return jsonResponse(request, {
        cameras: cachedCameras,
        lastUpdated: new Date(cacheTimestamp).toISOString(),
      } satisfies FloodCamerasResponse)
    }
    return jsonResponse(request, { cameras: [], lastUpdated: new Date().toISOString() } satisfies FloodCamerasResponse)
  }
}
