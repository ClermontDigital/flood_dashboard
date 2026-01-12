/**
 * Flood Forecast API Route
 * GET /api/flood
 *
 * Returns river discharge forecasts for all gauge stations.
 * Data sourced from Open-Meteo Flood API (GloFAS).
 *
 * @see https://open-meteo.com/en/docs/flood-api
 */

import { NextResponse } from 'next/server'
import { GAUGE_STATIONS } from '@/lib/constants'
import {
  fetchMultipleGaugeFloodData,
  FLOOD_API_ATTRIBUTION,
  type GaugeFloodData,
} from '@/lib/data-sources'

export const revalidate = 600 // Cache for 10 minutes

interface FloodAPIResponse {
  success: boolean
  data: Record<string, GaugeFloodData>
  attribution: typeof FLOOD_API_ATTRIBUTION
  timestamp: string
  error?: string
}

export async function GET(): Promise<NextResponse<FloodAPIResponse>> {
  try {
    // Build gauge list with coordinates
    const gauges = GAUGE_STATIONS.map((station) => ({
      id: station.id,
      lat: station.lat,
      lng: station.lng,
    }))

    // Fetch flood data for all gauges
    const floodDataMap = await fetchMultipleGaugeFloodData(gauges)

    // Convert Map to Record for JSON response
    const data: Record<string, GaugeFloodData> = {}
    floodDataMap.forEach((value, key) => {
      data[key] = value
    })

    return NextResponse.json(
      {
        success: true,
        data,
        attribution: FLOOD_API_ATTRIBUTION,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
        },
      }
    )
  } catch (error) {
    console.error('Flood API error:', error)
    return NextResponse.json(
      {
        success: false,
        data: {},
        attribution: FLOOD_API_ATTRIBUTION,
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch flood data',
      },
      { status: 500 }
    )
  }
}
