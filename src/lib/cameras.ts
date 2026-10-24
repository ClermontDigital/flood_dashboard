import type { FloodCamera } from './types'
import { createCouncilFeedCache, representativePoint, text, type QitCouncil, type QitFeature } from './data-sources/qitplus'
import { COMMUNITY_CAMERAS, getCommunityCameraConfig, type CommunityCameraConfig } from './community-cameras'
import { getCameraImageMeta, type CameraImageMeta } from './camera-store'

// Flood cameras from council disaster dashboards on the QIT Plus ("Guardian IMS") platform,
// plus hand-curated community cameras. Every council's camera feed uses the same GeoJSON
// format; the images themselves are hosted by a mix of providers (Envault, Disaster Watch,
// QLDTraffic's camera server, council buckets…). The council list lives in data-sources/qitplus.ts.

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

    const key = `${council.id}-${id}`
    const offset = POSITION_OFFSETS[key]
    cameras.push({
      id,
      key,
      kind: 'council',
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
function deduplicateCameras(cameras: FloodCamera[], aliases: Map<string, string>): FloodCamera[] {
  const result: FloodCamera[] = []
  const keptByImageUrl = new Map<string, FloodCamera>()
  const PROXIMITY_THRESHOLD = 0.01 // ~1km in degrees

  for (const camera of cameras) {
    // Exact dedup: skip cameras sharing the same image feed URL
    const primaryUrl = camera.imageUrls[0]
    const sameFeed = primaryUrl ? keptByImageUrl.get(primaryUrl) : undefined
    if (sameFeed) {
      aliases.set(camera.key, sameFeed.key)
      continue
    }

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
    if (duplicate) {
      aliases.set(camera.key, duplicate.key)
    } else {
      result.push(camera)
      if (primaryUrl) keptByImageUrl.set(primaryUrl, camera)
    }
  }

  return result
}

// Council cameras, deduplicated, rebuilt only when the council snapshot changes
let councilCache: { fetchedAt: number; cameras: FloodCamera[]; aliases: Map<string, string> } | null = null

async function getCouncilCameras(): Promise<{ cameras: FloodCamera[]; aliases: Map<string, string>; fetchedAt: number }> {
  const snapshot = await cameraFeed.get()
  if (councilCache && councilCache.fetchedAt === snapshot.fetchedAt) return councilCache

  const allCameras = snapshot.results.flatMap(r => r.items)
  // Every source failed: keep the last good list rather than caching nothing
  if (allCameras.length === 0 && councilCache) {
    console.error('[Cameras] No cameras from any source, serving previous list')
    return councilCache
  }

  const aliases = new Map<string, string>()
  const cameras = deduplicateCameras(allCameras, aliases)
  const okCount = snapshot.councils.filter(c => c.ok).length
  console.log(`[Cameras] ${cameras.length} flood cameras from ${okCount}/${snapshot.councils.length} councils (${allCameras.length} before dedup)`)

  councilCache = { fetchedAt: snapshot.fetchedAt, cameras, aliases }
  return councilCache
}

// A picture counts as stale once it's older than two capture intervals, or the last capture failed
function isStale(config: CommunityCameraConfig, meta: CameraImageMeta): boolean {
  const ageMs = Date.now() - new Date(meta.takenAt).getTime()
  return meta.status === 'unreachable' || ageMs > config.intervalMin * 2 * 60 * 1000
}

function toFloodCamera(config: CommunityCameraConfig, meta: CameraImageMeta): FloodCamera {
  return {
    id: config.id,
    key: config.id,
    kind: 'community',
    description: config.name,
    lat: config.lat,
    lng: config.lng,
    // Cache-bust on the capture time so a new picture shows as soon as it lands
    imageUrls: [`/api/cameras/${config.id}/image?t=${encodeURIComponent(meta.takenAt)}`],
    source: 'Community camera',
    takenAt: meta.takenAt,
    donor: config.donor,
    intervalMin: config.intervalMin,
    stale: isStale(config, meta),
  }
}

async function getCommunityCamera(config: CommunityCameraConfig): Promise<FloodCamera | null> {
  try {
    const meta = await getCameraImageMeta(config.id)
    return meta ? toFloodCamera(config, meta) : null // Nothing to show until the first picture arrives
  } catch (error) {
    console.error(`[Cameras] Community camera ${config.id} unavailable:`, error)
    return null
  }
}

/** Cameras for the public map: deduplicated council cameras plus public community cameras. */
export async function getPublicCameras(): Promise<{ cameras: FloodCamera[]; lastUpdated: string }> {
  const council = await getCouncilCameras()
  // Community cameras are curated, so they're never dropped as "duplicates" of a council camera nearby
  const community = (
    await Promise.all(COMMUNITY_CAMERAS.filter(c => c.visibility === 'public').map(getCommunityCamera))
  ).filter((c): c is FloodCamera => c !== null)
  return {
    cameras: [...council.cameras, ...community],
    lastUpdated: new Date(council.fetchedAt || Date.now()).toISOString(),
  }
}

/**
 * Camera for a share link. Includes unlisted community cameras (link-only previews) but never
 * hidden ones. A council camera dropped as a duplicate resolves to the one that was kept.
 */
export async function findCamera(key: string): Promise<FloodCamera | null> {
  const config = getCommunityCameraConfig(key)
  if (config) {
    return config.visibility === 'hidden' ? null : getCommunityCamera(config)
  }
  const council = await getCouncilCameras()
  const resolved = council.aliases.get(key) ?? key
  return council.cameras.find(c => c.key === resolved) ?? null
}
