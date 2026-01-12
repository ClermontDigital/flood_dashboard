import { NextResponse } from 'next/server'
import { fetchRainfall, fetchRegionalRainfall, type RainfallSummary } from '@/lib/data-sources'
import { GAUGE_STATIONS } from '@/lib/constants'

export const runtime = 'nodejs'
export const revalidate = 300 // Cache for 5 minutes

interface RainfallAPIResponse {
  regional: RainfallSummary | null
  gauges: Record<string, RainfallSummary | null>
  timestamp: string
  errors: string[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gaugeId = searchParams.get('gauge')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const errors: string[] = []

  try {
    // If specific location requested
    if (lat && lng) {
      const result = await fetchRainfall(
        parseFloat(lat),
        parseFloat(lng),
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

    // Default: Get regional overview and rainfall for key locations
    const response: RainfallAPIResponse = {
      regional: null,
      gauges: {},
      timestamp: new Date().toISOString(),
      errors: [],
    }

    // Fetch regional rainfall (Clermont center)
    const regionalResult = await fetchRegionalRainfall()
    if (regionalResult.success) {
      response.regional = regionalResult.data
    } else {
      errors.push(`Regional: ${regionalResult.error}`)
    }

    // Fetch rainfall for key gauge locations (one per river system)
    const keyGauges = [
      GAUGE_STATIONS.find(s => s.id === '130207A'), // Clermont
      GAUGE_STATIONS.find(s => s.id === '130401A'), // Isaac
      GAUGE_STATIONS.find(s => s.id === '130209A'), // Nogoa
      GAUGE_STATIONS.find(s => s.id === '130106A'), // Mackenzie
      GAUGE_STATIONS.find(s => s.id === '130504A'), // Comet
      GAUGE_STATIONS.find(s => s.id === '130004A'), // Fitzroy
    ].filter(Boolean)

    // Fetch in parallel
    const results = await Promise.all(
      keyGauges.map(async (station) => {
        if (!station) return null
        const result = await fetchRainfall(station.lat, station.lng, station.name)
        return { id: station.id, result }
      })
    )

    for (const item of results) {
      if (!item) continue
      if (item.result.success && item.result.data) {
        response.gauges[item.id] = item.result.data
      } else {
        errors.push(`${item.id}: ${item.result.error}`)
      }
    }

    response.errors = errors

    return NextResponse.json(response)
  } catch (error) {
    console.error('Rainfall API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
