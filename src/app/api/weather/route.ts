/**
 * BOM Weather API Route
 * GET /api/weather?lat=-22.8&lng=147.6&name=Clermont
 *
 * Returns current weather observations for any QLD location.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchBOMWeather, type BOMObservation } from '@/lib/data-sources'

export const revalidate = 300 // Cache for 5 minutes

interface WeatherResponse {
  success: boolean
  data: BOMObservation | null
  timestamp: string
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<WeatherResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '-22.5')
    const lng = parseFloat(searchParams.get('lng') || '148.5')
    const name = searchParams.get('name') || 'Queensland'

    const result = await fetchBOMWeather(lat, lng, name)

    if (!result.success || !result.data) {
      return NextResponse.json({
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: result.error || 'Failed to fetch weather data',
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json({
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
    }, { status: 500 })
  }
}
