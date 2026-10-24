import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/http'
import type { CouncilRoadsResponse, RoadEvent } from '@/lib/types'
import {
  createCouncilFeedCache,
  findCouncil,
  parseQitDate,
  representativePoint,
  text,
  type QitCouncil,
  type QitFeature,
} from '@/lib/data-sources/qitplus'

// Fetched on demand and cached in memory; don't prerender (that would poll every council at build time)
export const dynamic = 'force-dynamic'

// Road closures entered by council staff on QIT Plus ("Guardian Roads") disaster dashboards.
// Each council's feed also carries some neighbouring councils' items, so items are deduplicated
// by their Guardian source_id and attributed to the council that entered them.

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }

interface CouncilRoadItem {
  key: string           // Guardian source_id (or item id) for cross-council dedup
  ownerId?: string      // registry id of the council that entered it, when known
  event: RoadEvent
}

const FLOOD_PATTERN = /flood|water (over|across|on) (the )?road|inundat/i
const ROADWORKS_PATTERN = /road ?works?/i
const HIGH_PATTERN = /one lane|single lane|lanes? (reduced|closed)|lane or lanes|caution|restricted|high clearance|4wd/i
const CLEARED_PATTERN = /re-?opened|cleared|resolved/i

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

/**
 * Items that originated from TMR/QLDTraffic rather than council staff. Council-entered items are
 * marked source.source_name "Guardian"; TMR's own events carry "EPS" (provided by the Department
 * of Transport and Main Roads). QLDTraffic is already on the map, so these are dropped.
 */
function isTmrSourced(source: Record<string, unknown>, props: Record<string, unknown>): boolean {
  const sourceName = text(source.source_name).toLowerCase()
  if (sourceName && sourceName !== 'guardian') return true
  if (/transport and main roads|\btmr\b|qldtraffic/i.test(text(source.provided_by))) return true
  return /qldtraffic\.qld\.gov\.au/i.test(`${text(props.url)} ${text(props.web_link)}`)
}

function hasEnded(value: unknown, now: number): boolean {
  const iso = parseQitDate(value)
  return iso !== undefined && Date.parse(iso) < now
}

/** "Golden Mile Rd, Golden Mile Rd" -> "Golden Mile Rd"; "Dysart,May Downs" -> "Dysart, May Downs" */
function tidyList(value: unknown): string {
  const parts = text(value).split(',').map(s => s.trim()).filter(Boolean)
  return [...new Set(parts)].join(', ')
}

function joinSentences(parts: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    const clean = part.replace(/[.\s]+$/, '')
    if (!clean || seen.has(clean.toLowerCase())) continue
    seen.add(clean.toLowerCase())
    out.push(clean)
  }
  return out.length ? `${out.join('. ')}.` : ''
}

function parseRoads(features: QitFeature[], council: QitCouncil, now: number): CouncilRoadItem[] {
  const items: CouncilRoadItem[] = []

  for (const f of features) {
    const props = record(f.properties)
    const source = record(props.source)
    const impact = record(props.impact)
    const duration = record(props.duration)
    const publication = record(props.publication)

    if (isTmrSourced(source, props)) continue
    if (hasEnded(duration.end, now) || hasEnded(publication.end, now)) continue
    if (CLEARED_PATTERN.test(text(props.status))) continue

    const point = representativePoint(f.geometry)
    if (!point) continue

    const eventType = text(props.event_type)
    const eventSubtype = text(props.event_subtype)
    const dueTo = text(props.event_due_to)
    const impactType = text(impact.impact_type)
    const impactSubtype = text(impact.impact_subtype)
    const description = text(props.description)
    const information = text(props.information)
    const advice = text(props.advice)
    const status = text(props.status)
    const impactText = `${impactType} ${impactSubtype}`

    const isFlooding = FLOOD_PATTERN.test(
      [eventType, eventSubtype, dueTo, impactText, description, information, status].join(' '),
    )
    const isClosed =
      (/clos/i.test(impactText) && !/lane/i.test(impactText)) ||
      /closure/i.test(eventType) ||
      /\bclosed\b/i.test(`${description} ${information}`)

    let type: RoadEvent['type'] = 'hazard'
    if (isFlooding) type = 'flooding'
    else if (isClosed) type = 'road_closure'
    else if (ROADWORKS_PATTERN.test(`${eventType} ${eventSubtype}`)) type = 'roadworks'

    // Closed or flooded is extreme, except flooding the council explicitly marks as passable
    // ("Road OPEN with Caution", "Lane or lanes reduced"), which is high like other caution items
    const caution = HIGH_PATTERN.test(`${impactText} ${advice}`)
    let severity: RoadEvent['severity'] = 'low'
    if (isClosed) severity = 'extreme'
    else if (isFlooding) severity = caution || /\bopen\b/i.test(description) ? 'high' : 'extreme'
    else if (caution) severity = 'high'
    else if (type === 'hazard') severity = 'medium'

    // Attribute to the council that entered it (feeds include neighbours' items)
    const owner = findCouncil(text(source.provided_by), text(source.provided_by_url))
    const councilName = owner?.name ?? (text(source.provided_by) || council.name)
    const sourceId = text(source.source_id)
    const key = sourceId || `${council.id}-${String(props.id ?? f.id ?? `${point.lat},${point.lng}`)}`

    const road = tidyList(props.road)
    const suburb = tidyList(props.suburb)
    const direction = text(impact.direction)

    items.push({
      key,
      ownerId: owner?.id,
      event: {
        id: `council-${key}`,
        type,
        title: road || description.slice(0, 60) || eventSubtype || eventType || 'Council road event',
        description:
          joinSentences([description, information, impactSubtype, advice]) ||
          joinSentences([eventType, eventSubtype]) ||
          'No description available',
        road: road || 'Unknown road',
        ...(suburb ? { suburb } : {}),
        ...(direction ? { direction } : {}),
        lat: point.lat,
        lng: point.lng,
        startTime: parseQitDate(duration.start),
        endTime: parseQitDate(duration.end),
        severity,
        source: 'council',
        council: councilName,
        sourceUrl: owner?.dashboardUrl ?? council.dashboardUrl,
        lastUpdated: parseQitDate(props.last_updated) ?? new Date(now).toISOString(),
      },
    })
  }

  return items
}

const roadsFeed = createCouncilFeedCache('roads', parseRoads, { ttlMs: CACHE_TTL })

// Last response, keyed by the snapshot it was built from
let cachedResponse: CouncilRoadsResponse | null = null
let cacheTimestamp = 0

const SEVERITY_RANK: Record<RoadEvent['severity'], number> = { extreme: 0, high: 1, medium: 2, low: 3 }

export async function GET(request: Request) {
  try {
    const snapshot = await roadsFeed.get()
    if (cachedResponse && snapshot.fetchedAt === cacheTimestamp) {
      return jsonResponse(request, cachedResponse, { headers: CACHE_HEADERS })
    }

    // Cross-council dedup by source_id. Prefer the copy from the owning council's own feed,
    // otherwise the most recently updated copy.
    const byKey = new Map<string, { item: CouncilRoadItem; fromOwner: boolean }>()
    for (const result of snapshot.results) {
      for (const item of result.items) {
        const fromOwner = item.ownerId === result.council.id
        const existing = byKey.get(item.key)
        if (
          !existing ||
          (fromOwner && !existing.fromOwner) ||
          (fromOwner === existing.fromOwner && item.event.lastUpdated > existing.item.event.lastUpdated)
        ) {
          byKey.set(item.key, { item, fromOwner })
        }
      }
    }

    const events = [...byKey.values()]
      .map(v => v.item.event)
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.lastUpdated.localeCompare(a.lastUpdated))

    const response: CouncilRoadsResponse = {
      events,
      councils: snapshot.councils,
      lastUpdated: new Date(snapshot.fetchedAt).toISOString(),
    }

    cachedResponse = response
    cacheTimestamp = snapshot.fetchedAt
    return jsonResponse(request, response, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('[Council Roads API] Error building council road events:', error)
    if (cachedResponse) return jsonResponse(request, cachedResponse)
    return jsonResponse(request, {
      events: [],
      councils: [],
      lastUpdated: new Date().toISOString(),
    } satisfies CouncilRoadsResponse)
  }
}
