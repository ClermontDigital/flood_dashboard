import type { GaugeStation, UpstreamTrigger } from '../types'
import { GAUGE_STATIONS } from '../constants'

/**
 * Upstream-downstream relationships for the Fitzroy Basin
 *
 * Maps downstream gauge IDs to their upstream gauges with estimated travel times
 */
const UPSTREAM_RELATIONSHIPS: Record<
  string,
  { upstreamId: string; travelTimeHours: [number, number] }[]
> = {
  // Sandy Creek @ Clermont is downstream of Theresa Creek
  '130207A': [
    { upstreamId: '130212A', travelTimeHours: [4, 6] },
  ],

  // Isaac River @ Deverill is downstream of Yatton
  '130410A': [
    { upstreamId: '130401A', travelTimeHours: [6, 10] },
  ],

  // Connors River feeds into Isaac
  '130410A': [
    { upstreamId: '130408A', travelTimeHours: [4, 8] },
  ],

  // Mackenzie @ Bingegang is downstream of Coolmaringa
  '130106A': [
    { upstreamId: '130105B', travelTimeHours: [8, 12] },
  ],

  // Mackenzie @ Coolmaringa is downstream of Rileys Crossing
  '130105B': [
    { upstreamId: '130113A', travelTimeHours: [6, 10] },
  ],

  // Fitzroy @ Yaamba is downstream of The Gap
  '130003A': [
    { upstreamId: '130004A', travelTimeHours: [12, 18] },
  ],

  // Fitzroy @ Rockhampton is downstream of Yaamba
  '130005A': [
    { upstreamId: '130003A', travelTimeHours: [4, 6] },
  ],
}

/**
 * Get upstream trigger information for a gauge
 */
export function getUpstreamTrigger(
  gaugeId: string,
  upstreamLevels: Map<string, number>
): UpstreamTrigger | null {
  const relationships = UPSTREAM_RELATIONSHIPS[gaugeId]
  if (!relationships || relationships.length === 0) return null

  for (const { upstreamId, travelTimeHours } of relationships) {
    const level = upstreamLevels.get(upstreamId)
    if (level === undefined) continue

    const station = GAUGE_STATIONS.find((s) => s.id === upstreamId)
    if (!station) continue

    // Only trigger if upstream level is elevated (>3m as rough threshold)
    if (level > 3) {
      return {
        station: station.name,
        level,
        eta: `${travelTimeHours[0]}-${travelTimeHours[1]} hours`,
      }
    }
  }

  return null
}

/**
 * Get all upstream gauges for a given gauge
 */
export function getUpstreamGauges(gaugeId: string): GaugeStation[] {
  const relationships = UPSTREAM_RELATIONSHIPS[gaugeId]
  if (!relationships) return []

  return relationships
    .map(({ upstreamId }) => GAUGE_STATIONS.find((s) => s.id === upstreamId))
    .filter((s): s is GaugeStation => s !== undefined)
}

/**
 * Get all downstream gauges that could be affected by a given gauge
 */
export function getDownstreamGauges(gaugeId: string): GaugeStation[] {
  const downstream: GaugeStation[] = []

  for (const [downstreamId, relationships] of Object.entries(UPSTREAM_RELATIONSHIPS)) {
    if (relationships.some((r) => r.upstreamId === gaugeId)) {
      const station = GAUGE_STATIONS.find((s) => s.id === downstreamId)
      if (station) downstream.push(station)
    }
  }

  return downstream
}

/**
 * Calculate estimated arrival time at downstream gauge
 */
export function calculateETA(
  upstreamGaugeId: string,
  downstreamGaugeId: string
): string | null {
  const relationships = UPSTREAM_RELATIONSHIPS[downstreamGaugeId]
  if (!relationships) return null

  const relationship = relationships.find((r) => r.upstreamId === upstreamGaugeId)
  if (!relationship) return null

  const [min, max] = relationship.travelTimeHours
  return `${min}-${max} hours`
}
