/**
 * QIT Plus ("Guardian IMS") council disaster dashboard client.
 *
 * Many Queensland councils run their public disaster dashboard on the QIT Plus platform. Every
 * dashboard serves JSON feeds under `${origin}/dashboard/<endpoint>`, but the endpoint names
 * depend on which front-end build the council is on:
 *   - new build (CHRC, Barcaldine, Winton): `cameras`, `ims-road`, `evac-centres`
 *   - legacy build (Isaac and most others):  `getCameras`, `imsRoad`, `imsEvac`
 * Isaac answers both camera names. Some legacy feeds JSON-encode their GeoJSON twice (the body
 * is a JSON string that contains the JSON), so responses are unwrapped before use.
 *
 * The registry comes from a probe of the flood-country dashboards (Oct 2026). A council is
 * listed for a feed kind when that endpoint answered with JSON. Whitsunday and Charters Towers
 * are listed for `roads` even though `imsRoad` currently returns HTTP 500, so the failure is
 * reported rather than silently missing. Cameras are only polled for councils that publish them.
 */

import type { CouncilFeedStatus } from '@/lib/types'

export type QitBuild = 'new' | 'legacy'
export type CouncilFeedKind = 'cameras' | 'roads' | 'centres'

export interface QitCouncil {
  id: string                    // short slug, also used as a key prefix (e.g. 'isaac', 'chrc')
  name: string                  // full council name, used for attribution
  origin: string                // base URL incl. any subfolder, no trailing slash
  build: QitBuild
  dashboardUrl: string          // public dashboard page, for "view on council dashboard" links
  feeds: readonly CouncilFeedKind[]
}

export const QIT_ENDPOINTS: Record<QitBuild, Record<CouncilFeedKind, string>> = {
  new: { cameras: 'cameras', roads: 'ims-road', centres: 'evac-centres' },
  legacy: { cameras: 'getCameras', roads: 'imsRoad', centres: 'imsEvac' },
}

const ALL_FEEDS: readonly CouncilFeedKind[] = ['cameras', 'roads', 'centres']
const NO_CAMERAS: readonly CouncilFeedKind[] = ['roads', 'centres']

function qit(
  id: string,
  name: string,
  origin: string,
  build: QitBuild,
  feeds: readonly CouncilFeedKind[],
  dashboardUrl = `${origin}/`,
): QitCouncil {
  return { id, name, origin, build, dashboardUrl, feeds }
}

// Order matters for camera dedup: earlier councils win, so Isaac and CHRC stay first
// (they were the original sources and POSITION_OFFSETS is keyed to them).
export const QIT_COUNCILS: readonly QitCouncil[] = [
  qit('isaac', 'Isaac Regional Council', 'https://dashboard.isaac.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('chrc', 'Central Highlands Regional Council', 'https://beprepared.chrc.qld.gov.au', 'new', ALL_FEEDS),
  qit('mackay', 'Mackay Regional Council', 'https://disaster.mackay.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('whitsunday', 'Whitsunday Regional Council', 'https://disaster.whitsundayrc.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('banana', 'Banana Shire Council', 'https://emd.banana.qld.gov.au', 'legacy', NO_CAMERAS),
  qit('rockhampton', 'Rockhampton Regional Council', 'https://emergency.rockhamptonregion.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('livingstone', 'Livingstone Shire Council', 'https://disaster.livingstone.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('gladstone', 'Gladstone Regional Council', 'https://regionwatch.gladstone.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('barcaldine', 'Barcaldine Regional Council', 'https://rapad.qitplus.com/Barcaldine', 'new', NO_CAMERAS, 'https://rapad.qitplus.com/barcaldine/'),
  qit('blackall-tambo', 'Blackall-Tambo Regional Council', 'https://rapad.qitplus.com/blackall-tambo', 'legacy', NO_CAMERAS),
  qit('longreach', 'Longreach Regional Council', 'https://rapad.qitplus.com/Longreach', 'legacy', NO_CAMERAS, 'https://rapad.qitplus.com/longreach/'),
  qit('maranoa', 'Maranoa Regional Council', 'https://dashboard.maranoa.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('burdekin', 'Burdekin Shire Council', 'https://disaster.burdekin.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('townsville', 'Townsville City Council', 'https://disaster.townsville.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('charters-towers', 'Charters Towers Regional Council', 'https://getready.charterstowers.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('hinchinbrook', 'Hinchinbrook Shire Council', 'https://disaster.hinchinbrook.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('cassowary', 'Cassowary Coast Regional Council', 'https://disaster.cassowarycoast.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('cairns', 'Cairns Regional Council', 'https://disaster.cairns.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('douglas', 'Douglas Shire Council', 'https://dashboard.douglas.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('tablelands', 'Tablelands Regional Council', 'https://dashboard.trc.qld.gov.au', 'legacy', NO_CAMERAS),
  qit('mareeba', 'Mareeba Shire Council', 'https://emergency.msc.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('bundaberg', 'Bundaberg Regional Council', 'https://disaster.bundaberg.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('fraser-coast', 'Fraser Coast Regional Council', 'https://disaster.frasercoast.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('gympie', 'Gympie Regional Council', 'https://disaster.gympie.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('north-burnett', 'North Burnett Regional Council', 'https://emergency.northburnett.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('flinders', 'Flinders Shire Council', 'https://flindersdashboard.qitplus.com', 'legacy', ALL_FEEDS),
  qit('richmond', 'Richmond Shire Council', 'https://dashboard.richmond.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('winton', 'Winton Shire Council', 'https://disaster.winton.qld.gov.au', 'new', NO_CAMERAS),
  qit('mount-isa', 'Mount Isa City Council', 'https://dashboard.mountisa.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('cloncurry', 'Cloncurry Shire Council', 'https://dashboard.cloncurry.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('burke', 'Burke Shire Council', 'https://emergency.burke.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('carpentaria', 'Carpentaria Shire Council', 'https://disaster.carpentaria.qld.gov.au', 'legacy', ALL_FEEDS),
  qit('etheridge', 'Etheridge Shire Council', 'https://dashboard.etheridge.qld.gov.au', 'legacy', ALL_FEEDS),
]

export function councilsWithFeed(kind: CouncilFeedKind): QitCouncil[] {
  return QIT_COUNCILS.filter(c => c.feeds.includes(kind))
}

// ---- GeoJSON shapes (loosely typed: council staff enter this data by hand) ----

export interface QitGeometry {
  type?: string
  coordinates?: unknown
  geometries?: QitGeometry[]
}

export interface QitFeature {
  type?: string
  id?: number | string
  geometry?: QitGeometry | null
  properties?: Record<string, unknown> | null
  temporal?: Record<string, unknown> | null
}

export interface CouncilFeedResult {
  council: QitCouncil
  kind: CouncilFeedKind
  ok: boolean
  features: QitFeature[]        // [] when the fetch failed
  status: CouncilFeedStatus     // count = raw features returned
  ms: number
}

// ---- Fetching ----

const FETCH_TIMEOUT_MS = 10_000
const MAX_CONCURRENT_COUNCILS = 6
const USER_AGENT = 'Mozilla/5.0 (compatible; GaugeQLD/1.0; +https://gauge.clermont.digital)'

// The new build's road feed splits items across these arrays (with overlap); other feeds only use `features`
const FEATURE_ARRAY_KEYS = ['features', 'roadworks', 'trafficAlerts'] as const

/** Parse a body that may be JSON, or a JSON string containing JSON. */
export function parseMaybeDoubleEncoded(text: string): unknown {
  let value: unknown = JSON.parse(text.replace(/^﻿/, ''))
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    value = JSON.parse(value)
  }
  return value
}

function featureKey(f: QitFeature): string | null {
  const props = f.properties ?? {}
  const source = props.source as Record<string, unknown> | undefined
  const sourceId = source && typeof source.source_id === 'string' ? source.source_id : null
  const id = props.id ?? f.id
  if (sourceId) return `s:${sourceId}`
  if (typeof id === 'number' || typeof id === 'string') return `i:${id}`
  return null
}

function collectFeatures(data: unknown): QitFeature[] | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const record = data as Record<string, unknown>
  if (!Array.isArray(record.features)) return null

  const seen = new Set<string>()
  const out: QitFeature[] = []
  for (const key of FEATURE_ARRAY_KEYS) {
    const arr = record[key]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue
      const feature = item as QitFeature
      const k = featureKey(feature)
      if (k) {
        if (seen.has(k)) continue
        seen.add(k)
      }
      out.push(feature)
    }
  }
  return out
}

export async function fetchCouncilFeed(council: QitCouncil, kind: CouncilFeedKind): Promise<CouncilFeedResult> {
  const endpoint = QIT_ENDPOINTS[council.build][kind]
  const url = `${council.origin}/dashboard/${endpoint}?t=${Date.now()}`
  const started = Date.now()

  const fail = (error: string): CouncilFeedResult => ({
    council,
    kind,
    ok: false,
    features: [],
    status: { council: council.name, ok: false, count: 0, error },
    ms: Date.now() - started,
  })

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!response.ok) return fail(`HTTP ${response.status}`)

    const text = await response.text()
    let data: unknown
    try {
      data = parseMaybeDoubleEncoded(text)
    } catch {
      return fail('Response was not JSON')
    }

    const features = collectFeatures(data)
    if (!features) return fail('Response was not a GeoJSON FeatureCollection')

    return {
      council,
      kind,
      ok: true,
      features,
      status: { council: council.name, ok: true, count: features.length },
      ms: Date.now() - started,
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') return fail(`Timed out after ${FETCH_TIMEOUT_MS / 1000}s`)
    // undici reports everything as "fetch failed"; the useful part is the cause
    const cause = error instanceof Error ? (error.cause as { code?: string; message?: string } | undefined) : undefined
    const code = cause?.code ?? cause?.message
    if (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      return fail('TLS certificate chain incomplete (server omits its intermediate certificate)')
    }
    const message = error instanceof Error ? error.message : 'Fetch failed'
    return fail(code ? `${message} (${code})` : message)
  }
}

async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** Fetch one feed kind from many councils, ~6 at a time. Never throws; results keep registry order. */
export function fetchCouncilFeeds(kind: CouncilFeedKind, councils: readonly QitCouncil[] = councilsWithFeed(kind)): Promise<CouncilFeedResult[]> {
  return mapWithConcurrency(councils, MAX_CONCURRENT_COUNCILS, c => fetchCouncilFeed(c, kind))
}

// ---- Cached snapshots with per-council last-good fallback ----

export interface CouncilItems<T> {
  council: QitCouncil
  items: T[]
  fresh: boolean                // false when serving this council's last good data (or nothing)
  status: CouncilFeedStatus     // count = parsed items
}

export interface CouncilFeedSnapshot<T> {
  results: CouncilItems<T>[]
  councils: CouncilFeedStatus[]
  fetchedAt: number
}

export interface CouncilFeedCacheOptions {
  ttlMs?: number                // how long a snapshot is served before refetching (default 5 min)
  maxStaleMs?: number           // how long a failed council's last good data is kept (default 6 h)
}

const DEFAULT_TTL_MS = 5 * 60 * 1000
const DEFAULT_MAX_STALE_MS = 6 * 60 * 60 * 1000
const RETRY_AFTER_TOTAL_FAILURE_MS = 60 * 1000

/**
 * In-memory cache for one feed kind across all councils. Concurrent callers share a single
 * refresh. When a council fails, its last good raw features are re-parsed (so time-based filters
 * such as "already ended" still apply) and its status is marked not ok.
 */
export function createCouncilFeedCache<T>(
  kind: CouncilFeedKind,
  parse: (features: QitFeature[], council: QitCouncil, now: number) => T[],
  options: CouncilFeedCacheOptions = {},
) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const maxStaleMs = options.maxStaleMs ?? DEFAULT_MAX_STALE_MS
  const lastGood = new Map<string, { features: QitFeature[]; fetchedAt: number }>()
  let snapshot: CouncilFeedSnapshot<T> | null = null
  let snapshotTtl = ttlMs
  let inflight: Promise<CouncilFeedSnapshot<T>> | null = null

  async function refresh(): Promise<CouncilFeedSnapshot<T>> {
    const started = Date.now()
    const fetched = await fetchCouncilFeeds(kind)
    const now = Date.now()

    const results = fetched.map((r): CouncilItems<T> => {
      let features = r.features
      let error = r.status.error
      if (r.ok) {
        lastGood.set(r.council.id, { features, fetchedAt: now })
      } else {
        const prev = lastGood.get(r.council.id)
        if (prev && now - prev.fetchedAt <= maxStaleMs) {
          features = prev.features
          error = `${error}; showing data from ${Math.round((now - prev.fetchedAt) / 60000)} min ago`
        }
      }

      let items: T[] = []
      let ok = r.ok
      try {
        items = parse(features, r.council, now)
      } catch (e) {
        ok = false
        error = `Could not read feed: ${e instanceof Error ? e.message : String(e)}`
      }

      return {
        council: r.council,
        items,
        fresh: ok,
        status: { council: r.council.name, ok, count: items.length, ...(error ? { error } : {}) },
      }
    })

    const failed = results.filter(r => !r.status.ok)
    console.log(
      `[QIT Plus] ${kind}: ${results.length - failed.length}/${results.length} councils ok in ${((now - started) / 1000).toFixed(1)}s` +
        (failed.length ? `; failed: ${failed.map(r => `${r.council.name} (${r.status.error})`).join(', ')}` : ''),
    )

    // If nothing at all came back, try again sooner than the normal TTL
    snapshotTtl = failed.length === results.length && results.length > 0 ? RETRY_AFTER_TOTAL_FAILURE_MS : ttlMs
    snapshot = { results, councils: results.map(r => r.status), fetchedAt: now }
    return snapshot
  }

  return {
    async get(): Promise<CouncilFeedSnapshot<T>> {
      if (snapshot && Date.now() - snapshot.fetchedAt < snapshotTtl) return snapshot
      if (!inflight) {
        inflight = refresh().finally(() => {
          inflight = null
        })
      }
      return inflight
    },
  }
}

// ---- Parsing helpers shared by the routes ----

export interface LatLng {
  lat: number
  lng: number
}

const QLD_BOUNDS = { north: -9.0, south: -29.5, west: 137.5, east: 154.0 }

function inQld(lat: number, lng: number): boolean {
  return lat <= QLD_BOUNDS.north && lat >= QLD_BOUNDS.south && lng >= QLD_BOUNDS.west && lng <= QLD_BOUNDS.east
}

/** One GeoJSON position (numbers or numeric strings). Accepts [lat, lng] mistakes, which do occur. */
function toLatLng(position: unknown): LatLng | null {
  if (!Array.isArray(position) || position.length < 2) return null
  const a = Number(position[0])
  const b = Number(position[1])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (inQld(b, a)) return { lat: b, lng: a }
  if (inQld(a, b)) return { lat: a, lng: b }
  return null
}

function lineMidpoint(coords: unknown): LatLng | null {
  if (!Array.isArray(coords)) return null
  const points = coords.map(toLatLng).filter((p): p is LatLng => p !== null)
  if (points.length === 0) return null
  if (points.length % 2 === 1) return points[(points.length - 1) / 2]
  const a = points[points.length / 2 - 1]
  const b = points[points.length / 2]
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
}

/**
 * A representative point for a feature: the Point itself, the midpoint of a line, or for a
 * GeometryCollection its first Point (the platform's marker position) falling back to its lines.
 */
export function representativePoint(geometry: QitGeometry | null | undefined): LatLng | null {
  if (!geometry || typeof geometry !== 'object') return null
  const coords = geometry.coordinates
  switch (geometry.type) {
    case 'Point':
      return toLatLng(coords)
    case 'MultiPoint':
      return Array.isArray(coords) ? toLatLng(coords[0]) : null
    case 'LineString':
      return lineMidpoint(coords)
    case 'MultiLineString':
    case 'Polygon':
      return Array.isArray(coords) ? lineMidpoint(coords[0]) : null
    case 'GeometryCollection': {
      const parts = Array.isArray(geometry.geometries) ? geometry.geometries : []
      for (const part of parts) {
        if (part?.type === 'Point') {
          const p = toLatLng(part.coordinates)
          if (p) return p
        }
      }
      for (const part of parts) {
        const p = representativePoint(part)
        if (p) return p
      }
      return null
    }
    default:
      return null
  }
}

/** Parse ISO strings and Microsoft JSON dates ("/Date(1759972086023)/") to an ISO string. */
export function parseQitDate(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString()
  if (typeof value !== 'string' || !value.trim()) return undefined
  const ms = value.match(/\/Date\((-?\d+)(?:[+-]\d{4})?\)\//)
  const time = ms ? Number(ms[1]) : Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined
}

/** Trimmed string, or '' for anything that isn't a non-empty string. */
export function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function normaliseName(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `
}

const stripProtocol = (url: string) => url.toLowerCase().replace(/^https?:\/\//, '')

const COUNCIL_KEYWORDS = QIT_COUNCILS.map(c => ({
  council: c,
  keyword: normaliseName(c.name.replace(/\s+(Regional|Shire|City)?\s*Council$/i, '')),
  origin: stripProtocol(c.origin),
}))

/**
 * Work out which registry council an item belongs to from its provider name or URL. Feeds
 * include neighbouring councils' items (e.g. Mackay's road feed carries Isaac and Whitsunday
 * closures) and providers are named loosely ("Mackay Local Disaster Management Group").
 */
export function findCouncil(providerName?: string, providerUrl?: string): QitCouncil | undefined {
  const url = stripProtocol(providerUrl ?? '')
  if (url) {
    const byUrl = COUNCIL_KEYWORDS.find(k => url.startsWith(k.origin))
    if (byUrl) return byUrl.council
  }
  if (providerName) {
    const name = normaliseName(providerName)
    const byName = COUNCIL_KEYWORDS.find(k => name.includes(k.keyword))
    if (byName) return byName.council
  }
  return undefined
}
