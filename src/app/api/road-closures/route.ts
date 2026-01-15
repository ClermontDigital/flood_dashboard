import { NextResponse } from 'next/server'
import type { RoadEvent, RoadEventsResponse } from '@/lib/types'
import { getRoadClosures } from '@/lib/firestore'
import { env } from '@/lib/env'

// Queensland state bounding box
// Covers from Cairns to Gold Coast, coast to inland
const QLD_BOUNDS = {
  north: -16.0,  // North of Cairns
  south: -29.0,  // South of Gold Coast
  east: 154.0,   // East coast
  west: 138.0,   // Western QLD
}

interface QLDTrafficEvent {
  event_id: string
  event_type: string
  event_subtype?: string
  description?: string
  road_summary?: {
    road_name?: string
    locality?: string
    direction?: string
  }
  source?: {
    source_organisation?: string
  }
  duration?: {
    start?: string
    end?: string
  }
  geometry?: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
  impact?: {
    impact_type?: string
    impact_subtype?: string
    direction?: string
    lanes_affected?: string
  }
  advice?: string
  information?: string
}

function mapEventType(eventType: string, eventSubtype?: string): RoadEvent['type'] {
  const type = eventType?.toLowerCase() || ''
  const subtype = eventSubtype?.toLowerCase() || ''

  if (type.includes('flood') || subtype.includes('flood')) return 'flooding'
  if (type.includes('closure') || subtype.includes('closure') || type.includes('closed')) return 'road_closure'
  if (type.includes('hazard')) return 'hazard'
  if (type.includes('roadwork') || type.includes('work')) return 'roadworks'
  if (type.includes('crash') || type.includes('accident')) return 'crash'
  if (type.includes('congestion') || type.includes('traffic')) return 'congestion'
  if (type.includes('event') || type.includes('special')) return 'special_event'

  return 'hazard'
}

function mapSeverity(impactType?: string, eventType?: string): RoadEvent['severity'] {
  const impact = impactType?.toLowerCase() || ''
  const type = eventType?.toLowerCase() || ''

  if (impact.includes('major') || type.includes('major') || type.includes('flood')) return 'extreme'
  if (impact.includes('moderate') || type.includes('moderate')) return 'high'
  if (impact.includes('minor') || type.includes('minor')) return 'medium'

  return 'low'
}

function getCoordinates(geometry?: QLDTrafficEvent['geometry']): { lat: number; lng: number } | null {
  if (!geometry || !geometry.coordinates) return null

  try {
    if (geometry.type === 'Point') {
      const coords = geometry.coordinates as number[]
      return { lat: coords[1], lng: coords[0] }
    }

    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates as number[][]
      // Return midpoint of line
      const midIndex = Math.floor(coords.length / 2)
      return { lat: coords[midIndex][1], lng: coords[midIndex][0] }
    }

    if (geometry.type === 'MultiLineString') {
      const coords = geometry.coordinates as number[][][]
      // Return first point of first line
      if (coords.length > 0 && coords[0].length > 0) {
        return { lat: coords[0][0][1], lng: coords[0][0][0] }
      }
    }

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates as number[][][]
      // Return centroid approximation (first point)
      if (coords.length > 0 && coords[0].length > 0) {
        return { lat: coords[0][0][1], lng: coords[0][0][0] }
      }
    }
  } catch {
    return null
  }

  return null
}

function isInRegion(lat: number, lng: number): boolean {
  return (
    lat >= QLD_BOUNDS.south &&
    lat <= QLD_BOUNDS.north &&
    lng >= QLD_BOUNDS.west &&
    lng <= QLD_BOUNDS.east
  )
}

export async function GET() {
  try {
    // First try Firestore cache (populated by cron job)
    const cachedData = await getRoadClosures(10 * 60 * 1000) // 10 min max age

    if (cachedData) {
      const result: RoadEventsResponse = {
        events: cachedData.events,
        lastUpdated: cachedData.timestamp,
        source: 'qldtraffic',
        sourceUrl: env.qldTrafficWebsiteUrl,
      }
      return NextResponse.json(result)
    }

    // Fallback: fetch directly from QLDTraffic (may hit rate limits)
    console.log('[Road Closures API] Cache miss, fetching from QLDTraffic directly')

    // Check if API key is configured
    if (!env.qldTrafficApiKey) {
      console.warn('[Road Closures API] QLDTraffic API key not configured')
      return NextResponse.json({
        events: [],
        lastUpdated: new Date().toISOString(),
        source: 'qldtraffic',
        sourceUrl: env.qldTrafficWebsiteUrl,
        error: 'Road closure data unavailable - API not configured'
      } as RoadEventsResponse & { error: string })
    }

    const response = await fetch(`${env.qldTrafficApiUrl}?apikey=${env.qldTrafficApiKey}`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('QLDTraffic API error:', response.status, response.statusText)
      return NextResponse.json(
        {
          events: [],
          lastUpdated: new Date().toISOString(),
          source: 'qldtraffic',
          sourceUrl: env.qldTrafficWebsiteUrl,
          error: 'Failed to fetch road closure data'
        } as RoadEventsResponse & { error: string },
        { status: 200 }
      )
    }

    const data = await response.json()
    const features = data.features || data.events || data || []
    const events: RoadEvent[] = []

    for (const feature of features) {
      const props = feature.properties || feature
      const geometry = feature.geometry || props.geometry

      const coords = getCoordinates(geometry)
      if (!coords) continue

      if (!isInRegion(coords.lat, coords.lng)) continue

      const eventType = mapEventType(props.event_type, props.event_subtype)
      if (!['flooding', 'road_closure', 'hazard'].includes(eventType)) continue

      events.push({
        id: props.event_id || `evt-${Date.now()}-${Math.random()}`,
        type: eventType,
        title: props.road_summary?.road_name || props.description?.substring(0, 50) || 'Road Event',
        description: props.description || props.advice || props.information || 'No description available',
        road: props.road_summary?.road_name || 'Unknown road',
        suburb: props.road_summary?.locality,
        direction: props.road_summary?.direction || props.impact?.direction,
        lat: coords.lat,
        lng: coords.lng,
        startTime: props.duration?.start,
        endTime: props.duration?.end,
        severity: mapSeverity(props.impact?.impact_type, props.event_type),
        source: 'qldtraffic',
        sourceUrl: env.qldTrafficWebsiteUrl,
        lastUpdated: new Date().toISOString(),
      })
    }

    const result: RoadEventsResponse = {
      events,
      lastUpdated: new Date().toISOString(),
      source: 'qldtraffic',
      sourceUrl: env.qldTrafficWebsiteUrl,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching road closures:', error)
    return NextResponse.json(
      {
        events: [],
        lastUpdated: new Date().toISOString(),
        source: 'qldtraffic',
        sourceUrl: env.qldTrafficWebsiteUrl,
        error: 'Failed to fetch road closure data'
      } as RoadEventsResponse & { error: string },
      { status: 200 }
    )
  }
}
