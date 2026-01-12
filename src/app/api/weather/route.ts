/**
 * BOM Weather API Route
 * GET /api/weather
 *
 * Returns current weather observations from BOM for Clermont.
 */

import { NextResponse } from 'next/server'
import { fetchBOMWeather, type BOMObservation } from '@/lib/data-sources'

export const revalidate = 600 // Cache for 10 minutes

interface WeatherResponse {
  success: boolean
  data: BOMObservation | null
  timestamp: string
  error?: string
}

export async function GET(): Promise<NextResponse<WeatherResponse>> {
  try {
    const result = await fetchBOMWeather()

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
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
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
