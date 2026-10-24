/**
 * BOM Weather API Route
 * GET /api/weather?lat=-22.8&lng=147.6&name=Clermont
 *
 * Returns current weather observations for any QLD location.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchBOMWeather, type BOMObservation } from '@/lib/data-sources'

export const dynamic = 'force-dynamic'

// Reads the query string, so Next can't cache it; keep a short in-memory cache per ~1 km area
// so repeat visits don't each wait on Open-Meteo
const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 500
const weatherCache = new Map<string, { at: number; data: BOMObservation }>()

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

    const key = `${lat.toFixed(2)},${lng.toFixed(2)},${name}`
    const cached = weatherCache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        timestamp: new Date(cached.at).toISOString(),
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      })
    }

    const result = await fetchBOMWeather(lat, lng, name)
    if (result.success && result.data) {
      if (weatherCache.size >= MAX_CACHE_ENTRIES) weatherCache.clear()
      weatherCache.set(key, { at: Date.now(), data: result.data })
    }

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
