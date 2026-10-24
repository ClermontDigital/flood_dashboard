import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/http'
import { getCouncilSensors } from '@/lib/data-sources/council-sensors'
import type { CouncilSensorsResponse } from '@/lib/types'

// Fetched on demand and cached in memory; don't prerender (that would poll the councils at build time)
export const dynamic = 'force-dynamic'

// Council-run IoT water-level sensors (Cassowary Coast, Hinchinbrook). See lib/data-sources/council-sensors.ts.

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' }

export async function GET(request: Request) {
  try {
    const data = await getCouncilSensors()
    return jsonResponse(request, data, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error('[Council Sensors API] Error building council sensors:', error)
    return jsonResponse(request, 
      { sensors: [], councils: [], lastUpdated: new Date().toISOString() } satisfies CouncilSensorsResponse,
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
