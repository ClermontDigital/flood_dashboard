/**
 * Flood Predictions API Route
 * GET /api/predictions?gaugeId=<id>
 *
 * Returns flood predictions for a specific gauge.
 * Implements simple trend projection: Stage(t+lead) = Stage(t) + (Stage(t) - Stage(t-1)) * lead_hours
 * Calculates predictions for 2h, 4h, 6h ahead with confidence levels.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { PredictionsResponse, Prediction, UpstreamTrigger, HistoryPoint } from '@/lib/types'
import { GAUGE_STATIONS } from '@/lib/constants'
import { generateMockWaterLevel } from '@/lib/utils'
import { fetchWMIPWaterLevel, fetchWMIPHistory, fetchBOMWaterLevel, fetchBOMHistory } from '@/lib/data-sources'

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

// Upstream relationships for trigger warnings
const UPSTREAM_RELATIONSHIPS: Record<string, { upstreamId: string; etaHours: string }> = {
  // Clermont area
  '130207A': { upstreamId: '130212A', etaHours: '2-4 hours' }, // Sandy Creek from Theresa Creek
  // Isaac River
  '130410A': { upstreamId: '130401A', etaHours: '6-8 hours' }, // Deverill from Yatton
  // Nogoa River
  '130219A': { upstreamId: '130209A', etaHours: '8-12 hours' }, // Duck Ponds from Craigmore
  // Mackenzie River
  '130105B': { upstreamId: '130113A', etaHours: '10-14 hours' }, // Coolmaringa from Rileys
  '130106A': { upstreamId: '130105B', etaHours: '12-18 hours' }, // Bingegang from Coolmaringa
  // Fitzroy River
  '130003A': { upstreamId: '130004A', etaHours: '12-18 hours' }, // Yaamba from The Gap
  '130005A': { upstreamId: '130003A', etaHours: '6-10 hours' }, // Rockhampton from Yaamba
}

// Minor flood thresholds for trigger detection
const MINOR_THRESHOLDS: Record<string, number> = {
  '130207A': 4.5,
  '130212A': 3.0,
  '130401A': 5.0,
  '130410A': 6.0,
  '130209A': 5.0,
  '130219A': 4.5,
  '130105B': 7.0,
  '130106A': 8.0,
  '130113A': 6.0,
  '130004A': 7.0,
  '130003A': 6.5,
  '130005A': 7.0,
}

/**
 * Generate mock history for predictions
 */
function generateMockHistory(currentLevel: number): HistoryPoint[] {
  const points: HistoryPoint[] = []
  const now = new Date()

  // Generate 6 hours of hourly data
  for (let i = 6; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    // Slight rising trend
    const variation = (6 - i) * 0.05 + (Math.random() - 0.5) * 0.1
    points.push({
      timestamp: timestamp.toISOString(),
      level: Math.max(0, currentLevel - 0.3 + variation),
    })
  }

  return points
}

/**
 * Calculate predictions using linear trend projection
 * Stage(t+lead) = Stage(t) + (Stage(t) - Stage(t-1)) * lead_hours
 */
function calculatePredictions(
  currentLevel: number,
  history: HistoryPoint[]
): Prediction[] {
  const predictions: Prediction[] = []
  const leadTimes = [2, 4, 6] // hours ahead

  // Calculate hourly change rate from last two data points
  let hourlyChange = 0
  if (history.length >= 2) {
    const latest = history[history.length - 1]
    const previous = history[history.length - 2]

    // Calculate time difference in hours
    const timeDiffMs =
      new Date(latest.timestamp).getTime() -
      new Date(previous.timestamp).getTime()
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60)

    if (timeDiffHours > 0) {
      hourlyChange = (latest.level - previous.level) / timeDiffHours
    }
  }

  for (const leadHours of leadTimes) {
    // Simple linear projection
    const predictedLevel = currentLevel + hourlyChange * leadHours

    // Confidence decreases with lead time
    // Also affected by change rate magnitude (more volatile = less confident)
    const baseConfidence = 1 - leadHours * 0.1 // Decreases 10% per hour
    const volatilityPenalty = Math.min(0.3, Math.abs(hourlyChange) * 0.3)
    const confidence = Math.max(0.3, baseConfidence - volatilityPenalty)

    predictions.push({
      time: `+${leadHours}h`,
      level: Math.max(0, parseFloat(predictedLevel.toFixed(2))),
      confidence: parseFloat(confidence.toFixed(2)),
    })
  }

  return predictions
}

/**
 * Check for upstream triggers
 */
async function checkUpstreamTrigger(
  gaugeId: string
): Promise<UpstreamTrigger | null> {
  const relationship = UPSTREAM_RELATIONSHIPS[gaugeId]
  if (!relationship) return null

  const upstreamStation = GAUGE_STATIONS.find(
    (s) => s.id === relationship.upstreamId
  )
  if (!upstreamStation) return null

  try {
    // Try to get upstream level
    let upstreamLevel: number | null = null

    const wmipResult = await fetchWMIPWaterLevel(relationship.upstreamId)
    if (wmipResult.success && wmipResult.data) {
      upstreamLevel = wmipResult.data.level
    } else {
      const bomResult = await fetchBOMWaterLevel(relationship.upstreamId)
      if (bomResult) {
        upstreamLevel = bomResult.level
      }
    }

    // If no real data, generate mock
    if (upstreamLevel === null) {
      const mockLevel = generateMockWaterLevel(relationship.upstreamId)
      upstreamLevel = mockLevel.level
    }

    // Check if upstream is above minor threshold
    const threshold = MINOR_THRESHOLDS[relationship.upstreamId]
    if (threshold && upstreamLevel >= threshold) {
      return {
        station: upstreamStation.name,
        level: upstreamLevel,
        eta: relationship.etaHours,
      }
    }
  } catch (error) {
    console.error('Error checking upstream trigger:', error)
  }

  return null
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<PredictionsResponse | { error: string }>> {
  const searchParams = request.nextUrl.searchParams
  const gaugeId = searchParams.get('gaugeId')

  if (!gaugeId) {
    return NextResponse.json(
      { error: 'gaugeId parameter is required' },
      { status: 400 }
    )
  }

  // Validate gauge exists
  const station = GAUGE_STATIONS.find((s) => s.id === gaugeId)
  if (!station) {
    return NextResponse.json(
      { error: `Gauge not found: ${gaugeId}` },
      { status: 404 }
    )
  }

  let currentLevel: number
  let history: HistoryPoint[] = []

  try {
    // Try to get real data from WMIP
    const wmipResult = await fetchWMIPWaterLevel(gaugeId)
    const wmipHistory = await fetchWMIPHistory(gaugeId, 6)

    if (wmipResult.success && wmipResult.data) {
      currentLevel = wmipResult.data.level
      if (wmipHistory.success && wmipHistory.data.length > 0) {
        history = wmipHistory.data
      }
    } else {
      // Try BOM fallback
      const bomResult = await fetchBOMWaterLevel(gaugeId)
      const bomHistory = await fetchBOMHistory(gaugeId, 6)

      if (bomResult) {
        currentLevel = bomResult.level
        if (bomHistory.length > 0) {
          history = bomHistory
        }
      } else {
        // Use mock data
        const mockLevel = generateMockWaterLevel(gaugeId)
        currentLevel = mockLevel.level
        history = generateMockHistory(currentLevel)
      }
    }
  } catch (error) {
    console.error('Error fetching data for predictions:', error)
    const mockLevel = generateMockWaterLevel(gaugeId)
    currentLevel = mockLevel.level
    history = generateMockHistory(currentLevel)
  }

  // If no history, generate mock history
  if (history.length === 0) {
    history = generateMockHistory(currentLevel)
  }

  // Calculate predictions
  const predicted = calculatePredictions(currentLevel, history)

  // Check for upstream triggers
  const upstreamTrigger = await checkUpstreamTrigger(gaugeId)

  const response: PredictionsResponse = {
    gaugeId,
    current: parseFloat(currentLevel.toFixed(2)),
    predicted,
    upstreamTrigger,
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
