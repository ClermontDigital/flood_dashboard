import { NextResponse } from 'next/server'
import sharp from 'sharp'
import type { FloodCamera, FloodCamerasResponse, FloodDetection } from '@/lib/types'

export const revalidate = 300 // Cache for 5 minutes

// Camera feed sources (both use the same GeoJSON format from Envault platform)
const CAMERA_SOURCES = [
  {
    url: 'https://dashboard.isaac.qld.gov.au/dashboard/getCameras',
    name: 'Isaac Regional Council',
    prefix: 'isaac',
  },
  {
    url: 'https://beprepared.chrc.qld.gov.au/dashboard/getCameras',
    name: 'Central Highlands Regional Council',
    prefix: 'chrc',
  },
]

interface CameraFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { id: number; description: string; image_url: string; typeName: string }
}

interface CamerasResponse {
  type: 'FeatureCollection'
  features: CameraFeature[]
}

// Camera positions to offset so they don't overlap nearby gauge markers
const POSITION_OFFSETS: Record<string, { lat: number; lng: number }> = {
  'isaac-46': { lat: 0.008, lng: -0.008 },  // Theresa Creek Dam - offset from gauge 130206A
  'chrc-552': { lat: 0.008, lng: -0.008 },  // Theresa Creek Dam (CHRC) - same location
}

// In-memory cache
let cachedCameras: FloodCamera[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Flood detection thresholds (includes brown + grey-warm pixels)
// Note: sky, trees, text overlays dilute percentages — even heavily flooded
// scenes rarely exceed 60% because vegetation/sky fill the upper frame.
const WATER_PERCENT_POSSIBLE = 20 // >= 20% adjusted score = "possible"
const WATER_PERCENT_LIKELY = 40   // >= 40% adjusted score = "likely"

// Per-camera baseline offsets: the "normal" water-like pixel % when dry.
// Subtracted from raw score before applying thresholds.
// Cameras with roads, bridges, dirt, or concrete score high even without water.
// Set these during dry conditions; during floods, use your best estimate.
const CAMERA_BASELINES: Record<string, number> = {
  'isaac-44': 30,   // Thirty Mile Creek — road + red dirt shoulders
  'isaac-47': 8,    // Hughes Creek — some vegetation overlap
  'isaac-665': 8,   // Bee Creek — vegetation
  'isaac-666': 12,  // Peak Gully — vegetation + dirt
  'isaac-667': 12,  // Downs Creek — dirt
  'chrc-293': 8,    // Capella Creek — vegetation
  'chrc-363': 25,   // Nogoa River (Capricorn Hwy) — bridge + road + cars
  'chrc-316': 15,   // American Gully — road surface
}

/**
 * Analyze a camera image for brown/muddy flood water using sharp.
 * Downscales to 80x60 for speed, then counts pixels in the brown/muddy color range.
 * Returns the percentage of pixels that match flood water colors.
 */
async function analyzeImageForFlood(imageUrl: string): Promise<number> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(imageUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) return 0

    const buffer = Buffer.from(await response.arrayBuffer())

    // Downscale to 80x60 for fast analysis
    const { data, info } = await sharp(buffer)
      .resize(80, 60, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const totalPixels = info.width * info.height
    let waterPixels = 0

    // Scan pixels in RGB - look for brown/muddy water tones
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Convert to HSL-ish values for better color detection
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const lightness = (max + min) / 2

      // Skip very dark pixels (shadows, night) and very bright (sky, glare)
      if (lightness < 30 || lightness > 220) continue

      const delta = max - min
      if (delta === 0) continue // Skip grey pixels

      // Calculate hue
      let hue = 0
      if (max === r) hue = ((g - b) / delta) % 6
      else if (max === g) hue = (b - r) / delta + 2
      else hue = (r - g) / delta + 4
      hue = Math.round(hue * 60)
      if (hue < 0) hue += 360

      // Calculate saturation
      const saturation = delta / (255 - Math.abs(2 * lightness - 255))

      // Flood water detection covers three pixel types:
      // 1. Brown/muddy: warm hue (10-55°), any saturation, moderate lightness
      // 2. Red-brown: hue 345-15°, low sat, warm-biased
      // 3. Grey-warm: very low color delta but warm-biased (r >= b) — the
      //    dominant color of silty/turbid flood water in overcast conditions

      // Primary: warm-hued pixels (classic brown muddy water)
      const isBrownWater = hue >= 10 && hue <= 55 &&
                           saturation >= 0.03 && saturation <= 0.85 &&
                           lightness >= 35 && lightness <= 180 &&
                           r > b

      // Secondary: slightly pink/red muddy tones
      const isRedBrown = (hue >= 345 || hue <= 15) &&
                         saturation >= 0.02 && saturation <= 0.3 &&
                         lightness >= 35 && lightness <= 160 &&
                         r > b

      if (isBrownWater || isRedBrown) {
        waterPixels++
        continue
      }

      // Grey-warm: very desaturated but warm-toned pixels
      // Common in turbid/silty water, turbulent spillway foam, overcast floods
      if (delta <= 20 && r >= b && lightness >= 50 && lightness <= 200) {
        waterPixels++
        continue
      }

      // Sky-reflecting flood water: distant water reflects blue/purple sky
      // Distinguish from actual sky by capping lightness (sky is brighter)
      const isReflectiveWater = hue >= 200 && hue <= 270 &&
                                saturation >= 0.1 && saturation <= 0.6 &&
                                lightness >= 100 && lightness <= 190

      if (isReflectiveWater) {
        waterPixels++
      }
    }

    return Math.round((waterPixels / totalPixels) * 100)
  } catch {
    return 0
  }
}

/**
 * Run flood detection on all cameras in parallel (limited concurrency).
 * Analyzes only the first image URL for each camera.
 */
async function detectFloodForCameras(cameras: FloodCamera[]): Promise<FloodCamera[]> {
  const CONCURRENCY = 5
  const results = [...cameras]
  const analyzedAt = new Date().toISOString()

  for (let i = 0; i < results.length; i += CONCURRENCY) {
    const batch = results.slice(i, i + CONCURRENCY)
    const detections = await Promise.allSettled(
      batch.map(camera => {
        const url = camera.imageUrls[0]
        if (!url) return Promise.resolve(0)
        return analyzeImageForFlood(url)
      })
    )

    detections.forEach((result, j) => {
      const rawPercent = result.status === 'fulfilled' ? result.value : 0
      const camera = results[i + j]
      // Look up per-camera baseline using source prefix + id
      const prefix = camera.source.includes('Isaac') ? 'isaac' : 'chrc'
      const cameraKey = `${prefix}-${camera.id}`
      const baseline = CAMERA_BASELINES[cameraKey] || 0
      const adjustedPercent = Math.max(0, rawPercent - baseline)

      let status: FloodDetection['status'] = 'dry'
      if (adjustedPercent >= WATER_PERCENT_LIKELY) status = 'likely'
      else if (adjustedPercent >= WATER_PERCENT_POSSIBLE) status = 'possible'

      results[i + j] = {
        ...camera,
        floodDetection: { status, waterPercent: adjustedPercent, analyzedAt },
      }
    })
  }

  return results
}

function parseFeatures(features: CameraFeature[], sourceName: string, prefix: string): FloodCamera[] {
  return features
    .filter(f => f.properties.typeName === 'Flood Camera' && f.properties.image_url)
    .map(f => {
      const key = `${prefix}-${f.properties.id}`
      const offset = POSITION_OFFSETS[key]
      return {
        id: f.properties.id,
        description: f.properties.description.trim(),
        lat: f.geometry.coordinates[1] + (offset?.lat || 0),
        lng: f.geometry.coordinates[0] + (offset?.lng || 0),
        imageUrls: f.properties.image_url.split(',').map(u => u.trim()),
        source: sourceName,
      }
    })
}

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

export async function GET() {
  try {
    const now = Date.now()

    // Return cached data if fresh
    if (cachedCameras && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        cameras: cachedCameras,
        lastUpdated: new Date(cacheTimestamp).toISOString(),
      } satisfies FloodCamerasResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      })
    }

    // Fetch all sources in parallel
    const results = await Promise.allSettled(
      CAMERA_SOURCES.map(async (source) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${source.url}?t=${now}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(`[Cameras] HTTP ${response.status} from ${source.name}`)
          return []
        }

        const data: CamerasResponse = await response.json()
        return parseFeatures(data.features || [], source.name, source.prefix)
      })
    )

    // Collect cameras from all successful fetches
    const allCameras: FloodCamera[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allCameras.push(...result.value)
      } else {
        console.error('[Cameras] Source fetch failed:', result.reason)
      }
    }

    // Deduplicate cameras from overlapping council areas
    const dedupedCameras = deduplicateCameras(allCameras)

    // Run flood detection analysis on all camera images
    const cameras = await detectFloodForCameras(dedupedCameras)

    const floodDetected = cameras.filter(c => c.floodDetection?.status !== 'dry')
    console.log(`[Cameras] Fetched ${cameras.length} flood cameras from ${CAMERA_SOURCES.length} sources (${allCameras.length} before dedup), ${floodDetected.length} with water detected`)

    // Update cache
    cachedCameras = cameras
    cacheTimestamp = now

    return NextResponse.json({
      cameras,
      lastUpdated: new Date().toISOString(),
    } satisfies FloodCamerasResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[Cameras] Error fetching cameras:', error)
    if (cachedCameras) {
      return NextResponse.json({
        cameras: cachedCameras,
        lastUpdated: new Date(cacheTimestamp).toISOString(),
      } satisfies FloodCamerasResponse)
    }
    return NextResponse.json({ cameras: [], lastUpdated: new Date().toISOString() } satisfies FloodCamerasResponse)
  }
}
