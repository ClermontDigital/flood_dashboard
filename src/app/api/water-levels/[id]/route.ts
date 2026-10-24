/**
 * Single Gauge Water Level API Route
 * GET /api/water-levels/[id]
 *
 * Returns the current water level for a single gauge with 24-hour history,
 * fetched live from WMIP in a single request (BOM Water Data Online as a
 * fallback). There is no mock data: when no real data is available the
 * response has `available: false`, `reading: null`, `history: []` and an
 * `error` explaining why, so the UI can show "History unavailable".
 *
 * Response shape (GaugeDetailResponse):
 *   station           GaugeStation
 *   reading           WaterLevel | null   current reading, null when unavailable
 *   thresholds        FloodThresholds | null
 *   history           HistoryPoint[]      ascending by time, [] when unavailable
 *   source            'wmip' | 'bom' | null
 *   available         boolean             reading !== null
 *   historyAvailable  boolean             history.length > 0
 *   stale             boolean             reading older than 3h (UI "outdated")
 *   error             string | undefined  why data is unavailable
 *   timestamp         string              response time (ISO)
 */

import { NextRequest, NextResponse } from 'next/server'
import { OFFICIAL_FLOOD_THRESHOLDS } from '@/lib/flood-thresholds'
import type { GaugeStation, WaterLevel, HistoryPoint, FloodThresholds } from '@/lib/types'
import { GAUGE_STATIONS, GAUGE_ID_ALIASES } from '@/lib/constants'
import { calculateStatus } from '@/lib/utils'
import { fetchWMIPGaugeDetail } from '@/lib/data-sources/wmip'
import { fetchBOMGaugeDetail } from '@/lib/data-sources/bom'

// Live data - never statically cached
export const dynamic = 'force-dynamic'

// Response type for single gauge with history
interface GaugeDetailResponse {
  station: GaugeStation
  reading: WaterLevel | null
  thresholds: FloodThresholds | null
  history: HistoryPoint[]
  source: 'wmip' | 'bom' | null
  available: boolean
  historyAvailable: boolean
  stale: boolean
  error?: string
  timestamp: string
}

// Known flood thresholds for gauges
// Official BOM flood levels, shared across routes (src/lib/flood-thresholds.ts)
const FLOOD_THRESHOLDS = OFFICIAL_FLOOD_THRESHOLDS

const HISTORY_HOURS = 24
const STALE_AFTER_MS = 3 * 60 * 60 * 1000

/**
 * Small per-instance cache so re-selecting a gauge (and SWR refreshes from
 * many viewers) doesn't hit WMIP every time. WMIP telemetry updates at most
 * every 5-15 minutes, so 2 minutes is safe.
 */
const CACHE_TTL_MS = 2 * 60 * 1000
const CACHE_MAX_ENTRIES = 200
const detailCache = new Map<string, { expires: number; body: Omit<GaugeDetailResponse, 'timestamp' | 'stale'> }>()

function isStale(reading: WaterLevel | null): boolean {
  if (!reading) return false
  return Date.now() - new Date(reading.timestamp).getTime() > STALE_AFTER_MS
}

async function loadGaugeDetail(station: GaugeStation): Promise<Omit<GaugeDetailResponse, 'timestamp' | 'stale'>> {
  const gaugeId = station.id
  const thresholds = FLOOD_THRESHOLDS[gaugeId] || null

  // WMIP: current reading + 24h history from one request
  const wmip = await fetchWMIPGaugeDetail(gaugeId, HISTORY_HOURS)
  if (wmip.reading) {
    return {
      station,
      reading: { ...wmip.reading, status: calculateStatus(wmip.reading.level, thresholds, wmip.reading.changeRate) },
      thresholds,
      history: wmip.history,
      source: 'wmip',
      available: true,
      historyAvailable: wmip.history.length > 0,
    }
  }

  // BOM fallback (skipped for gauges flagged offline). BOM lags real time by
  // ~14-24h, so its reading is only used when recent; history is not shown
  // without a current reading to avoid presenting old data as live.
  let error = wmip.error || 'No WMIP data'
  if (!station.isOffline) {
    const bom = await fetchBOMGaugeDetail(gaugeId, HISTORY_HOURS, { timeoutMs: 6000 })
    if (bom.reading) {
      return {
        station,
        reading: { ...bom.reading, status: calculateStatus(bom.reading.level, thresholds, bom.reading.changeRate) },
        thresholds,
        history: bom.history,
        source: 'bom',
        available: true,
        historyAvailable: bom.history.length > 0,
      }
    }
    if (bom.latestTimestamp) {
      error += `; BOM latest reading ${bom.latestTimestamp} is too old to show as current`
    }
  } else {
    error = 'Gauge is marked offline (no public real-time source)'
  }

  return {
    station,
    reading: null,
    thresholds,
    history: [],
    source: null,
    available: false,
    historyAvailable: false,
    error,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GaugeDetailResponse | { error: string }>> {
  const { id: requestedId } = await params

  // Find the station (old IDs replaced during the Oct 2026 station-ID
  // correction resolve to their replacement; response.station.id is the new ID)
  const gaugeId = GAUGE_STATIONS.some((s) => s.id === requestedId)
    ? requestedId
    : GAUGE_ID_ALIASES[requestedId] || requestedId
  const station = GAUGE_STATIONS.find((s) => s.id === gaugeId)

  if (!station) {
    return NextResponse.json(
      { error: `Gauge not found: ${requestedId}` },
      { status: 404 }
    )
  }

  let body: Omit<GaugeDetailResponse, 'timestamp' | 'stale'>
  const cached = detailCache.get(gaugeId)
  if (cached && cached.expires > Date.now()) {
    body = cached.body
  } else {
    try {
      body = await loadGaugeDetail(station)
    } catch (error) {
      console.error(`Error fetching data for gauge ${gaugeId}:`, error)
      body = {
        station,
        reading: null,
        thresholds: FLOOD_THRESHOLDS[gaugeId] || null,
        history: [],
        source: null,
        available: false,
        historyAvailable: false,
        error: 'Upstream request failed',
      }
    }
    // Cache successes for the full TTL, failures briefly
    if (detailCache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = detailCache.keys().next().value
      if (oldestKey !== undefined) detailCache.delete(oldestKey)
    }
    detailCache.set(gaugeId, {
      expires: Date.now() + (body.available ? CACHE_TTL_MS : 30 * 1000),
      body,
    })
  }

  const response: GaugeDetailResponse = {
    ...body,
    stale: isStale(body.reading),
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    },
  })
}
