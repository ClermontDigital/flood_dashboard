/**
 * Single Gauge Water Level API Route
 * GET /api/water-levels/[id]
 *
 * Returns current water level for a single gauge with 24-hour history.
 * Includes historical data points for charting.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { GaugeStation, WaterLevel, HistoryPoint, FloodThresholds } from '@/lib/types'
import { GAUGE_STATIONS } from '@/lib/constants'
import { generateMockWaterLevel, calculateStatus, calculateTrend } from '@/lib/utils'
import {
  fetchWMIPWaterLevel,
  fetchWMIPHistory,
  fetchBOMWaterLevel,
  fetchBOMHistory,
} from '@/lib/data-sources'

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

// Response type for single gauge with history
interface GaugeDetailResponse {
  station: GaugeStation
  reading: WaterLevel | null
  thresholds: FloodThresholds | null
  history: HistoryPoint[]
  source: string
  timestamp: string
}

// Known flood thresholds for gauges
const FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '130207A': { minor: 4.5, moderate: 6.0, major: 8.0 },
  '130212A': { minor: 3.0, moderate: 4.5, major: 6.0 },
  '120311A': { minor: 2.5, moderate: 4.0, major: 5.5 },
  '130401A': { minor: 5.0, moderate: 7.0, major: 9.0 },
  '130410A': { minor: 6.0, moderate: 8.0, major: 10.0 },
  '130408A': { minor: 4.0, moderate: 6.0, major: 8.0 },
  '130209A': { minor: 5.0, moderate: 7.0, major: 9.0 },
  '130219A': { minor: 4.5, moderate: 6.5, major: 8.5 },
  '130204A': { minor: 3.0, moderate: 4.5, major: 6.0 },
  '130106A': { minor: 8.0, moderate: 10.0, major: 12.0 },
  '130105B': { minor: 7.0, moderate: 9.0, major: 11.0 },
  '130113A': { minor: 6.0, moderate: 8.0, major: 10.0 },
  '130504A': { minor: 5.0, moderate: 7.0, major: 9.0 },
  '130502A': { minor: 4.0, moderate: 6.0, major: 8.0 },
  '130004A': { minor: 7.0, moderate: 8.5, major: 10.0 },
  '130003A': { minor: 6.5, moderate: 8.0, major: 9.5 },
  '130005A': { minor: 7.0, moderate: 8.5, major: 10.5 },
}

/**
 * Generate mock historical data for a gauge
 */
function generateMockHistory(gaugeId: string, hoursBack: number = 24): HistoryPoint[] {
  const points: HistoryPoint[] = []
  const now = new Date()
  const baseLevel = 2 + Math.random() * 3

  // Generate hourly data points
  for (let i = hoursBack; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    // Add some variation to simulate water level changes
    const variation = Math.sin(i / 6) * 0.5 + (Math.random() - 0.5) * 0.2
    points.push({
      timestamp: timestamp.toISOString(),
      level: Math.max(0, baseLevel + variation),
    })
  }

  return points
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<GaugeDetailResponse | { error: string }>> {
  const { id: gaugeId } = await params

  // Find the station
  const station = GAUGE_STATIONS.find((s) => s.id === gaugeId)

  if (!station) {
    return NextResponse.json(
      { error: `Gauge not found: ${gaugeId}` },
      { status: 404 }
    )
  }

  const thresholds = FLOOD_THRESHOLDS[gaugeId] || null
  let reading: WaterLevel | null = null
  let history: HistoryPoint[] = []
  let source = 'mock'

  try {
    // Try WMIP first
    const wmipResult = await fetchWMIPWaterLevel(gaugeId)
    const wmipHistory = await fetchWMIPHistory(gaugeId, 24)

    if (wmipResult.success && wmipResult.data) {
      reading = {
        ...wmipResult.data,
        status: calculateStatus(wmipResult.data.level, thresholds),
      }

      // Calculate trend from history if available
      if (wmipHistory.success && wmipHistory.data.length >= 2) {
        history = wmipHistory.data
        const lastIndex = history.length - 1
        const prevIndex = Math.max(0, lastIndex - 1)
        reading.trend = calculateTrend(
          history[lastIndex].level,
          history[prevIndex].level,
          1
        )
        reading.changeRate =
          (history[lastIndex].level - history[prevIndex].level) / 1
      }

      source = 'wmip'
    } else {
      // Try BOM fallback
      const bomResult = await fetchBOMWaterLevel(gaugeId)
      const bomHistory = await fetchBOMHistory(gaugeId, 24)

      if (bomResult) {
        reading = {
          ...bomResult,
          status: calculateStatus(bomResult.level, thresholds),
        }

        if (bomHistory.length >= 2) {
          history = bomHistory
          const lastIndex = history.length - 1
          const prevIndex = Math.max(0, lastIndex - 1)
          reading.trend = calculateTrend(
            history[lastIndex].level,
            history[prevIndex].level,
            1
          )
          reading.changeRate =
            (history[lastIndex].level - history[prevIndex].level) / 1
        }

        source = 'bom'
      }
    }
  } catch (error) {
    console.error(`Error fetching data for gauge ${gaugeId}:`, error)
  }

  // Use mock data if no real data available
  if (!reading) {
    reading = generateMockWaterLevel(gaugeId)
    reading.status = calculateStatus(reading.level, thresholds)
    history = generateMockHistory(gaugeId, 24)
    source = 'mock'

    // Calculate trend from mock history
    if (history.length >= 2) {
      const lastIndex = history.length - 1
      reading.trend = calculateTrend(
        history[lastIndex].level,
        history[lastIndex - 1].level,
        1
      )
    }
  }

  const response: GaugeDetailResponse = {
    station,
    reading,
    thresholds,
    history,
    source,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
