/**
 * Council IoT water-level sensors (creeks, floodways, urban drains).
 *
 * Cassowary Coast and Hinchinbrook publish their sensor sites as ArcGIS feature layers (hosted by
 * QIT Plus, the vendor behind their disaster dashboards). Sites whose BOM_Id starts with "IOT" are
 * council-run devices; their readings are CSVs on S3 at IOT_Devices/H{BOM_Id}.csv. The other sites
 * are BoM gauges (BOM_data/CSV/...), which are skipped because GAUGE tracks gauges itself.
 *
 * CSV format: `DateTime,StationValue` with DateTime in epoch milliseconds (UTC; the newest row
 * matches the S3 Last-Modified time), oldest row first, about one row every 20 minutes. Files hold
 * months of history (270-410 KB), so only the tail is requested with an HTTP Range header.
 *
 * The councils' own dashboards only show sites where `Display IS NULL` ("No" hides a site; the
 * hidden IoT sites are ones with no CSV or uncalibrated readings), so the same filter applies here.
 */

import type {
  CouncilFeedStatus,
  CouncilSensor,
  CouncilSensorStatus,
  CouncilSensorsResponse,
  FloodThresholds,
} from '@/lib/types'

interface SensorCouncil {
  key: string
  name: string
  layerUrl: string
  dashboardUrl: string
}

const ARCGIS_BASE = 'https://services7.arcgis.com/si70weKpzPSa0BGV/arcgis/rest/services'

const SENSOR_COUNCILS: SensorCouncil[] = [
  {
    key: 'ccrc',
    name: 'Cassowary Coast Regional Council',
    layerUrl: `${ARCGIS_BASE}/CCRC_WaterLevels/FeatureServer/0`,
    dashboardUrl: 'https://disaster.cassowarycoast.qld.gov.au/',
  },
  {
    key: 'hsc',
    name: 'Hinchinbrook Shire Council',
    layerUrl: `${ARCGIS_BASE}/HSC_WaterLevels/FeatureServer/0`,
    dashboardUrl: 'https://disaster.hinchinbrook.qld.gov.au/',
  },
]

const IOT_CSV_BASE = 'https://fmeims.s3.ap-southeast-2.amazonaws.com/IOT_Devices/H'

const FETCH_TIMEOUT_MS = 10_000
const CACHE_TTL_MS = 5 * 60 * 1000
const RETRY_TTL_MS = 60 * 1000
const STALE_AFTER_MS = 6 * 60 * 60 * 1000
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_HISTORY_POINTS = 96
const CSV_CONCURRENCY = 6
const MAX_PAGES = 20
// Tail sizes to try before falling back to the whole file. A row is ~21 bytes, so 8 KB covers
// ~5 days at the normal 20-minute interval; 64 KB covers ~2 days even at 1-minute reporting.
const CSV_TAIL_BYTES = [8_192, 65_536]

// ---- ArcGIS ----

interface ArcGisFeature {
  attributes: Record<string, unknown>
  geometry?: { x?: number; y?: number } | null
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[]
  exceededTransferLimit?: boolean
  error?: { code?: number; message?: string }
}

async function queryAllFeatures(layerUrl: string): Promise<ArcGisFeature[]> {
  const features: ArcGisFeature[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: '*',
      outSR: '4326',
      resultOffset: String(features.length),
    })
    const res = await fetch(`${layerUrl}/query?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`)
    const body = (await res.json()) as ArcGisQueryResponse
    if (body.error) throw new Error(`ArcGIS error ${body.error.code ?? ''}: ${body.error.message ?? 'unknown'}`.trim())
    const batch = body.features ?? []
    features.push(...batch)
    if (!body.exceededTransferLimit || batch.length === 0) return features
  }
  return features
}

// ---- Attribute parsing ----

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

interface NamedLevel {
  name: string
  value: number
}

/** Level1Name/Level1Value ... Level9Name/Level9Value (values are strings in the layer) */
function namedLevels(attrs: Record<string, unknown>): NamedLevel[] {
  const levels: NamedLevel[] = []
  for (let i = 1; i <= 9; i++) {
    const name = decodeEntities(str(attrs[`Level${i}Name`]))
    const raw = str(attrs[`Level${i}Value`])
    const value = raw === '' ? NaN : Number(raw)
    if (name && Number.isFinite(value)) levels.push({ name, value })
  }
  return levels
}

function thresholdsFrom(levels: NamedLevel[]): FloodThresholds | null {
  const find = (pattern: RegExp) => levels.find(l => pattern.test(l.name))?.value
  const minor = find(/^minor\b/i)
  const moderate = find(/^moderate\b/i)
  const major = find(/^major\b/i)
  if (minor === undefined || moderate === undefined || major === undefined) return null
  return { minor, moderate, major }
}

// "Road Level", "Road/Bridge Level", "Bridge Level", "Butler Street Bridge deck level"
const ROAD_LEVEL_NAME = /\b(road|bridge)(\s*\/\s*bridge)?(\s+deck)?\s+level$/i
// "500mm above road level", "Approx height ..." are offsets/estimates, not the road itself
const NOT_ROAD_LEVEL = /\b(above|below|approx)/i
// "Road adjacent 4 Mill Street": the level at which water reaches the road next to that address
const ROAD_ADJACENT_NAME = /^road adjacent\b/i

/**
 * The level at which water is over the road. Uses an explicitly named road/bridge level; otherwise
 * the lowest "Road adjacent ..." level. Intersection/corner/driveway levels are not used: on some
 * urban sensors they sit at or below normal readings (e.g. -0.198 m), which would flag dry roads.
 */
function roadLevelFrom(levels: NamedLevel[]): number | null {
  const explicit = levels.find(l => ROAD_LEVEL_NAME.test(l.name) && !NOT_ROAD_LEVEL.test(l.name))
  if (explicit) return explicit.value
  const adjacent = levels.filter(l => ROAD_ADJACENT_NAME.test(l.name)).map(l => l.value)
  return adjacent.length ? Math.min(...adjacent) : null
}

// ---- CSV readings ----

interface Reading {
  t: number // epoch ms (UTC)
  v: number // metres
}

/** Parse `DateTime,StationValue` rows. When the text is a byte-range tail, the first line is partial. */
function parseCsv(text: string, dropFirstLine: boolean): Reading[] {
  const lines = text.split(/\r?\n/)
  if (dropFirstLine) lines.shift()
  const byTime = new Map<number, number>()
  for (const line of lines) {
    const comma = line.indexOf(',')
    if (comma < 0) continue
    const t = Number(line.slice(0, comma))
    const v = Number(line.slice(comma + 1))
    // Header row and blanks fail here; 1e12 ms = Sep 2001 guards against seconds-based stamps
    if (!Number.isFinite(t) || t < 1e12 || !Number.isFinite(v)) continue
    byTime.set(t, v) // some files repeat rows; the last copy wins
  }
  return [...byTime.entries()].map(([t, v]) => ({ t, v })).sort((a, b) => a.t - b.t)
}

/**
 * Readings from the tail of a device CSV, covering at least `since` when the file goes back that far.
 * Returns null when the device has no CSV (S3 answers 403 for a missing key).
 */
async function fetchDeviceReadings(deviceId: string, since: number): Promise<Reading[] | null> {
  const url = `${IOT_CSV_BASE}${encodeURIComponent(deviceId)}.csv`
  for (const tailBytes of [...CSV_TAIL_BYTES, null]) {
    const res = await fetch(url, {
      headers: tailBytes ? { Range: `bytes=-${tailBytes}` } : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (res.status === 403 || res.status === 404) return null
    if (res.status === 416) return [] // empty file
    if (!res.ok) throw new Error(`CSV HTTP ${res.status}`)

    const text = await res.text()
    // 206 with a range that doesn't start at byte 0 means older rows exist before this chunk
    const isTail = res.status === 206 && !/^bytes 0-/.test(res.headers.get('content-range') ?? '')
    const readings = parseCsv(text, isTail)
    if (!isTail || readings.length === 0 || readings[0].t <= since) return readings
  }
  return []
}

type Limiter = <R>(task: () => Promise<R>) => Promise<R>

/** Shared concurrency limit, so both councils' CSV fetches together stay within `max` */
function createLimiter(max: number): Limiter {
  let active = 0
  const queue: (() => void)[] = []
  return async <R>(task: () => Promise<R>): Promise<R> => {
    if (active >= max) await new Promise<void>(resolve => queue.push(resolve)) // a finishing task hands over its slot
    else active++
    try {
      return await task()
    } finally {
      const next = queue.shift()
      if (next) next()
      else active--
    }
  }
}

// ---- Sensor building ----

const round = (value: number, dp: number) => {
  const f = 10 ** dp
  return Math.round(value * f) / f
}

/** Oldest first, at most MAX_HISTORY_POINTS; keeps the peak of each time bucket and the latest reading */
function toHistory(readings: Reading[], since: number, now: number): CouncilSensor['history'] {
  const recent = readings.filter(r => r.t >= since && r.t <= now)
  let picked = recent
  if (recent.length > MAX_HISTORY_POINTS) {
    const latest = recent[recent.length - 1]
    const buckets = MAX_HISTORY_POINTS - 1
    const span = Math.max(1, latest.t - since)
    const peaks = new Map<number, Reading>()
    for (const r of recent.slice(0, -1)) {
      const b = Math.min(buckets - 1, Math.floor(((r.t - since) / span) * buckets))
      const current = peaks.get(b)
      if (!current || r.v > current.v) peaks.set(b, r)
    }
    picked = [...[...peaks.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r), latest]
  }
  return picked.map(r => ({ timestamp: new Date(r.t).toISOString(), level: round(r.v, 3) }))
}

function computeStatus(
  sensor: Pick<CouncilSensor, 'level' | 'timestamp' | 'roadLevel' | 'thresholds'>,
  now: number,
): CouncilSensorStatus {
  const { level, timestamp, roadLevel, thresholds } = sensor
  if (level === null || !timestamp || now - Date.parse(timestamp) > STALE_AFTER_MS) return 'nodata'
  if (thresholds) {
    if (level >= thresholds.major) return 'major'
    if (level >= thresholds.moderate) return 'moderate'
    if (level >= thresholds.minor) return 'minor'
  }
  if (roadLevel !== null && level >= roadLevel) return 'over_road'
  return 'normal'
}

interface SiteInfo {
  id: string
  deviceId: string
  name: string
  lat: number
  lng: number
  roadLevel: number | null
  thresholds: FloodThresholds | null
}

function parseSites(features: ArcGisFeature[], council: SensorCouncil): SiteInfo[] {
  const sites: SiteInfo[] = []
  for (const f of features) {
    const a = f.attributes ?? {}
    const deviceId = str(a.BOM_Id)
    if (!/^IOT/i.test(deviceId)) continue // BoM gauge (or blank row)
    if (a.Display != null) continue // hidden on the council's own dashboard
    const x = f.geometry?.x
    const y = f.geometry?.y
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) continue
    const levels = namedLevels(a)
    sites.push({
      id: `${council.key}-${deviceId}`,
      deviceId,
      name: decodeEntities(str(a.Long_Name) || str(a.Site_Name) || deviceId),
      lat: round(y, 5),
      lng: round(x, 5),
      roadLevel: roadLevelFrom(levels),
      thresholds: thresholdsFrom(levels),
    })
  }
  return sites
}

// ---- Cache ----

// Last good data per council (used when the layer query fails) and per sensor (used when one CSV fails)
const lastGoodByCouncil = new Map<string, { sensors: CouncilSensor[]; fetchedAt: number }>()
const lastGoodSensor = new Map<string, CouncilSensor>()

let cached: { data: CouncilSensorsResponse; fetchedAt: number; ttl: number } | null = null
let inFlight: Promise<CouncilSensorsResponse> | null = null

async function loadCouncil(
  council: SensorCouncil,
  now: number,
  limit: Limiter,
): Promise<{ sensors: CouncilSensor[]; status: CouncilFeedStatus }> {
  try {
    const sites = parseSites(await queryAllFeatures(council.layerUrl), council)
    const since = now - HISTORY_WINDOW_MS
    let failed = 0

    const sensors = await Promise.all(sites.map(site => limit(async (): Promise<CouncilSensor> => {
      const base = {
        id: site.id,
        council: council.name,
        name: site.name,
        lat: site.lat,
        lng: site.lng,
        roadLevel: site.roadLevel,
        thresholds: site.thresholds,
        sourceUrl: council.dashboardUrl,
      }
      let level: number | null = null
      let timestamp: string | null = null
      let history: CouncilSensor['history'] = []
      try {
        const readings = await fetchDeviceReadings(site.deviceId, since)
        const latest = readings?.[readings.length - 1]
        if (latest) {
          level = round(latest.v, 3)
          timestamp = new Date(latest.t).toISOString()
          history = toHistory(readings, since, now)
        }
      } catch (error) {
        failed++
        const previous = lastGoodSensor.get(site.id)
        console.warn(`[Council Sensors] ${council.name} ${site.deviceId}: ${error instanceof Error ? error.message : error}`)
        if (previous) {
          level = previous.level
          timestamp = previous.timestamp
          history = previous.history
        }
      }
      const sensor: CouncilSensor = { ...base, level, timestamp, history, status: 'nodata' }
      sensor.status = computeStatus(sensor, now)
      if (level !== null) lastGoodSensor.set(site.id, sensor)
      return sensor
    })))

    lastGoodByCouncil.set(council.key, { sensors, fetchedAt: now })
    const mostlyFailed = sites.length > 0 && failed > sites.length / 2
    return {
      sensors,
      status: {
        council: council.name,
        ok: !mostlyFailed,
        count: sensors.length,
        ...(failed ? { error: `${failed} of ${sites.length} sensor readings could not be fetched` } : {}),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Council Sensors] ${council.name} layer failed: ${message}`)
    const previous = lastGoodByCouncil.get(council.key)
    // Serve the last good sensors, re-deriving status so old readings age into 'nodata'
    const sensors = (previous?.sensors ?? []).map(s => ({ ...s, status: computeStatus(s, now) }))
    return {
      sensors,
      status: {
        council: council.name,
        ok: false,
        count: sensors.length,
        error: previous ? `${message} (showing data from ${new Date(previous.fetchedAt).toISOString()})` : message,
      },
    }
  }
}

const STATUS_ORDER: Record<CouncilSensorStatus, number> = {
  major: 0,
  moderate: 1,
  minor: 2,
  over_road: 3,
  normal: 4,
  nodata: 5,
}

async function loadAll(): Promise<CouncilSensorsResponse> {
  const now = Date.now()
  const limit = createLimiter(CSV_CONCURRENCY)
  const results = await Promise.all(SENSOR_COUNCILS.map(c => loadCouncil(c, now, limit)))
  const sensors = results
    .flatMap(r => r.sensors)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name))
  return {
    sensors,
    councils: results.map(r => r.status),
    lastUpdated: new Date(now).toISOString(),
  }
}

/**
 * Council IoT sensors, cached in memory for 5 minutes (1 minute when a council feed failed, so it
 * retries sooner). Concurrent callers share one refresh.
 */
export async function getCouncilSensors(): Promise<CouncilSensorsResponse> {
  if (cached && Date.now() - cached.fetchedAt < cached.ttl) return cached.data
  if (!inFlight) {
    inFlight = loadAll()
      .then(data => {
        const allOk = data.councils.every(c => c.ok)
        cached = { data, fetchedAt: Date.now(), ttl: allOk ? CACHE_TTL_MS : RETRY_TTL_MS }
        return data
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}
