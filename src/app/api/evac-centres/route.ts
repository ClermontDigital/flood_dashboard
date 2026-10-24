import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/http'
import type { ActiveCentre, ActiveCentresResponse } from '@/lib/types'
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

// "Active centres" (evacuation centres, sandbag points, places of refuge…) published on council
// QIT Plus disaster dashboards. Every listed centre is returned, open or not; the UI decides
// what to show. The platform publishes no capacity figure.

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }

function isOpenStatus(status: string): boolean {
  if (/\b(not|closed|inactive|unavailable)\b/i.test(status)) return false
  return /\b(open|available|active)\b/i.test(status)
}

function parseCentres(features: QitFeature[], council: QitCouncil): ActiveCentre[] {
  const centres: ActiveCentre[] = []
  for (const f of features) {
    const props = f.properties ?? {}
    const point = representativePoint(f.geometry)
    if (!point) continue

    const name = text(props.buildingname)
    const organisation = text(props.organisation)
    const address = text(props.buildingaddress)
    const note = text(props.note)
    const status = text(props.status) || 'Unknown'
    const rawId = f.id ?? props.id
    const id = rawId !== undefined && rawId !== null ? String(rawId) : `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`

    // Credit the organisation's council when it's another registry council
    const owner = findCouncil(organisation) ?? council

    centres.push({
      id: `${owner.id}-${id}`,
      council: owner.name,
      name: name || address || 'Unnamed centre',
      type: text(props.buildingtype) || 'Centre',
      status,
      isOpen: isOpenStatus(status),
      ...(address ? { address } : {}),
      ...(note ? { note } : {}),
      ...(organisation ? { organisation } : {}),
      lat: point.lat,
      lng: point.lng,
      lastUpdated: parseQitDate(f.temporal?.lastupdated ?? props.last_updated),
      sourceUrl: owner.dashboardUrl,
    })
  }
  return centres
}

const centresFeed = createCouncilFeedCache('centres', parseCentres, { ttlMs: CACHE_TTL })

// Last response, keyed by the snapshot it was built from
let cachedResponse: ActiveCentresResponse | null = null
let cacheTimestamp = 0

export async function GET(request: Request) {
  try {
    const snapshot = await centresFeed.get()
    if (cachedResponse && snapshot.fetchedAt === cacheTimestamp) {
      return jsonResponse(request, cachedResponse, { headers: CACHE_HEADERS })
    }

    // A neighbour's feed may list the same centre; keep the first copy
    const seen = new Set<string>()
    const centres: ActiveCentre[] = []
    for (const result of snapshot.results) {
      for (const centre of result.items) {
        if (seen.has(centre.id)) continue
        seen.add(centre.id)
        centres.push(centre)
      }
    }

    const response: ActiveCentresResponse = {
      centres,
      councils: snapshot.councils,
      lastUpdated: new Date(snapshot.fetchedAt).toISOString(),
    }

    cachedResponse = response
    cacheTimestamp = snapshot.fetchedAt
    return jsonResponse(request, response, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('[Evac Centres API] Error building active centres:', error)
    if (cachedResponse) return jsonResponse(request, cachedResponse)
    return jsonResponse(request, {
      centres: [],
      councils: [],
      lastUpdated: new Date().toISOString(),
    } satisfies ActiveCentresResponse)
  }
}
