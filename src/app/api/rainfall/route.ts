import { NextResponse } from 'next/server'
import { fetchRainfall, fetchStateRainfall, type RainfallSummary, type StateRainfallSummary } from '@/lib/data-sources'
import { GAUGE_STATIONS } from '@/lib/constants'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/rate-limit'
import { getStatewideRainfall } from '@/lib/firestore'

export const runtime = 'nodejs'
export const revalidate = 300 // Cache for 5 minutes

interface RainfallAPIResponse {
  statewide: StateRainfallSummary | null
  timestamp: string
  isStatewide: true
}

interface LocationRainfallAPIResponse {
  success: boolean
  data: RainfallSummary | null
  timestamp: string
  isStatewide: false
}

/**
 * Validate and parse coordinate parameters
 */
function validateCoordinates(latStr: string | null, lngStr: string | null): {
  valid: boolean
  lat?: number
  lng?: number
  error?: string
} {
  if (!latStr || !lngStr) {
    return { valid: false, error: 'Missing latitude or longitude parameter' }
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Invalid coordinate format - must be numeric' }
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' }
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' }
  }

  return { valid: true, lat, lng }
}

export async function GET(request: Request) {
  // Apply rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp)
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { searchParams } = new URL(request.url)
  const gaugeId = searchParams.get('gauge')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  try {
    // If specific location requested
    if (lat || lng) {
      const coordResult = validateCoordinates(lat, lng)
      if (!coordResult.valid) {
        return NextResponse.json(
          { success: false, error: coordResult.error },
          { status: 400 }
        )
      }

      const result = await fetchRainfall(
        coordResult.lat!,
        coordResult.lng!,
        searchParams.get('name') || undefined
      )

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      })
    }

    // If specific gauge requested
    if (gaugeId) {
      const station = GAUGE_STATIONS.find(s => s.id === gaugeId)
      if (!station) {
        return NextResponse.json(
          { success: false, error: 'Gauge not found' },
          { status: 404 }
        )
      }

      const result = await fetchRainfall(station.lat, station.lng, station.name)

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      })
    }

    // Default: Get statewide aggregated rainfall
    // First try Firestore cache (populated by cron job)
    const cachedRainfall = await getStatewideRainfall(10 * 60 * 1000) // 10 min max age

    if (cachedRainfall) {
      const response: RainfallAPIResponse = {
        statewide: cachedRainfall.data,
        timestamp: cachedRainfall.timestamp,
        isStatewide: true,
      }
      return NextResponse.json(response)
    }

    // Fallback: fetch directly from Open-Meteo (may hit rate limits)
    console.log('[Rainfall API] Cache miss, fetching from Open-Meteo directly')
    const statewideResult = await fetchStateRainfall()

    if (!statewideResult.success) {
      return NextResponse.json(
        { success: false, error: statewideResult.error || 'Failed to fetch statewide rainfall' },
        { status: 500 }
      )
    }

    const response: RainfallAPIResponse = {
      statewide: statewideResult.data,
      timestamp: new Date().toISOString(),
      isStatewide: true,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Rainfall API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
