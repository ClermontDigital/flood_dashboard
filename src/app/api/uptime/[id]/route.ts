/**
 * Gauge Uptime Detail API Route
 * GET /api/uptime/[id]
 *
 * Returns detailed 7-day uptime statistics for a specific gauge,
 * including daily stats for the bar chart visualization.
 */

import { NextResponse, NextRequest } from 'next/server'
import type { GaugeUptimeData } from '@/lib/types'
import { getGaugeUptimeDetail } from '@/lib/firestore'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/rate-limit'

// Cache for 5 minutes
export const revalidate = 300

interface UptimeResponse extends GaugeUptimeData {
  gaugeId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UptimeResponse | { error: string }>> {
  // Apply rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult) as NextResponse<{ error: string }>
  }

  const { id: gaugeId } = await params

  if (!gaugeId) {
    return NextResponse.json(
      { error: 'Gauge ID is required' },
      { status: 400 }
    )
  }

  const uptimeData = await getGaugeUptimeDetail(gaugeId)

  if (!uptimeData) {
    // Return default data if no uptime tracking exists yet
    // Use 0% to indicate no tracking data rather than perfect uptime
    return NextResponse.json({
      gaugeId,
      rollingUptime7d: 0,
      lastReportTimestamp: null,
      dailyStats: [],
    })
  }

  return NextResponse.json(
    {
      gaugeId,
      ...uptimeData,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  )
}
