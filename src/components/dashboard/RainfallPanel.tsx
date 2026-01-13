'use client'

import { cn } from '@/lib/utils'
import type { RainfallSummary, StateRainfallSummary } from '@/lib/data-sources/rainfall'
import type { BOMObservation } from '@/lib/data-sources/bom-weather'
import { getRainfallIntensity, getRainfallRisk } from '@/lib/data-sources/rainfall'

interface RainfallPanelProps {
  rainfall: RainfallSummary | null
  statewideRainfall?: StateRainfallSummary | null
  weather?: BOMObservation | null
  isLoading?: boolean
  compact?: boolean
  locationName?: string
  lat?: number
  lng?: number
}

const riskColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  extreme: 'bg-red-100 text-red-800 border-red-200',
}

const riskLabels = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  extreme: 'Extreme Risk',
}

// Map coordinates to nearest BOM radar
function getBOMRadarUrl(lat?: number, lng?: number): string {
  if (!lat || !lng) return 'http://www.bom.gov.au/products/IDR663.loop.shtml' // Default to Emerald

  // Queensland BOM radar stations with coverage
  const radars = [
    { name: 'Brisbane', lat: -27.7, lng: 153.2, id: 'IDR663' }, // Marburg
    { name: 'Gold Coast', lat: -28.0, lng: 153.4, id: 'IDR503' }, // Mt Stapylton
    { name: 'Cairns', lat: -16.8, lng: 145.7, id: 'IDR193' },
    { name: 'Townsville', lat: -19.4, lng: 146.5, id: 'IDR733' }, // Greenvale
    { name: 'Mackay', lat: -21.1, lng: 149.2, id: 'IDR223' },
    { name: 'Gladstone', lat: -23.9, lng: 151.3, id: 'IDR233' },
    { name: 'Emerald', lat: -23.5, lng: 148.2, id: 'IDR723' },
    { name: 'Mt Isa', lat: -20.7, lng: 139.5, id: 'IDR753' },
    { name: 'Gympie', lat: -26.0, lng: 152.6, id: 'IDR083' },
    { name: 'Longreach', lat: -23.4, lng: 144.3, id: 'IDR563' },
  ]

  // Find nearest radar
  let nearest = radars[0]
  let minDist = Number.MAX_VALUE

  for (const radar of radars) {
    const dist = Math.sqrt(Math.pow(lat - radar.lat, 2) + Math.pow(lng - radar.lng, 2))
    if (dist < minDist) {
      minDist = dist
      nearest = radar
    }
  }

  return `http://www.bom.gov.au/products/${nearest.id}.loop.shtml`
}

export function RainfallPanel({ rainfall, statewideRainfall, weather, isLoading, compact = false, locationName, lat, lng }: RainfallPanelProps) {
  // Build dynamic BOM URLs based on location
  const isStatewide = !rainfall && !!statewideRainfall
  const displayName = locationName || weather?.stationName || 'Queensland'
  const bomForecastUrl = lat && lng
    ? `https://www.bom.gov.au/places/qld/?lat=${lat.toFixed(2)}&lon=${lng.toFixed(2)}`
    : 'https://www.bom.gov.au/qld/'
  const bomRadarUrl = getBOMRadarUrl(lat, lng)

  // Hide widget when showing statewide data - only show when a specific location is selected
  if (isStatewide && !isLoading) {
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-700">Loading BOM Weather...</span>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-100 rounded" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Use BOM rainfall if available, otherwise fall back to Open-Meteo
  const rainfallSince9am = weather?.rainfall ?? null

  // Calculate risk based on available data
  const risk = rainfall
    ? getRainfallRisk(rainfall.next24Hours, rainfall.next7Days)
    : statewideRainfall
    ? getRainfallRisk(statewideRainfall.next24Hours.max, statewideRainfall.next7Days.max)
    : 'low'

  const intensity = rainfall
    ? getRainfallIntensity(rainfall.current.precipitation)
    : statewideRainfall
    ? getRainfallIntensity(statewideRainfall.current.precipitation)
    : 'No rain'

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">{displayName} Weather</h2>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full border",
            riskColors[risk]
          )}>
            {riskLabels[risk]}
          </span>
        </div>

        {/* Current Temperature */}
        {weather && (
          <div className="flex items-center gap-3 mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {weather.temperature !== null ? `${weather.temperature}°` : '--°'}
              </div>
              {weather.apparentTemp !== null && (
                <div className="text-[10px] text-gray-500">
                  Feels {weather.apparentTemp}°
                </div>
              )}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-medium text-gray-800">
                {weather.description || displayName}
              </div>
              {weather.humidity !== null && (
                <div className="text-gray-600">Humidity: {weather.humidity}%</div>
              )}
              {weather.windSpeed !== null && (
                <div className="text-gray-600">
                  Wind: {weather.windDirection || ''} {weather.windSpeed}km/h
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rainfall Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-[10px] text-blue-600 font-medium">Last 12h</div>
            <div className="text-base font-bold text-blue-800">
              {rainfallSince9am !== null ? `${rainfallSince9am}mm` : '--'}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-[10px] text-gray-600 font-medium">Last 24h</div>
            <div className="text-base font-bold text-gray-800">
              {rainfall
                ? `${rainfall.last24Hours.toFixed(0)}mm`
                : statewideRainfall
                ? `${statewideRainfall.last24Hours.min.toFixed(0)}-${statewideRainfall.last24Hours.max.toFixed(0)}mm`
                : '--'}
            </div>
          </div>
          <div className="text-center p-2 bg-cyan-50 rounded">
            <div className="text-[10px] text-cyan-600 font-medium">Next 24h</div>
            <div className="text-base font-bold text-cyan-800">
              {rainfall
                ? `${rainfall.next24Hours.toFixed(0)}mm`
                : statewideRainfall
                ? `${statewideRainfall.next24Hours.min.toFixed(0)}-${statewideRainfall.next24Hours.max.toFixed(0)}mm`
                : '--'}
            </div>
          </div>
        </div>

        {/* Rain status */}
        {(rainfall?.current.isRaining || statewideRainfall?.current.isRaining) && (
          <div className="mb-3 px-2.5 py-1.5 bg-blue-100 rounded text-xs text-blue-800 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
            </svg>
            {statewideRainfall
              ? `Raining in ${statewideRainfall.current.rainingLocations} of ${statewideRainfall.sampleCount} locations`
              : `Currently raining: ${intensity}`}
          </div>
        )}

        {/* Spacer to push links to bottom */}
        <div className="flex-1" />

        {/* BOM Quick Links */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 text-xs">
            <a href={bomForecastUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">BOM Forecast</a>
            <span className="text-gray-300">|</span>
            <a href={bomRadarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Radar</a>
            <span className="text-gray-300">|</span>
            <a href="http://www.bom.gov.au/qld/warnings/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Warnings</a>
          </div>
        </div>
      </div>
    )
  }

  // Full version (non-compact)
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {displayName} Weather
        </h3>
        <span className={cn(
          "px-3 py-1 text-sm font-medium rounded-full border",
          riskColors[risk]
        )}>
          {riskLabels[risk]}
        </span>
      </div>

      {/* Current Weather */}
      {weather && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {weather.temperature !== null ? `${weather.temperature}°C` : '--'}
              </div>
              {weather.apparentTemp !== null && (
                <div className="text-sm text-gray-600">
                  Feels like {weather.apparentTemp}°C
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900">
                {weather.description || weather.stationName}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                {weather.humidity !== null && (
                  <div>Humidity: {weather.humidity}%</div>
                )}
                {weather.windSpeed !== null && (
                  <div>Wind: {weather.windDirection} {weather.windSpeed}km/h</div>
                )}
                {weather.pressure !== null && (
                  <div>Pressure: {weather.pressure}hPa</div>
                )}
                {weather.windGust !== null && weather.windGust > 0 && (
                  <div>Gusts: {weather.windGust}km/h</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rainfall Section */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Recent Rainfall</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last 12h</span>
              <span className="text-sm font-semibold text-blue-700">
                {rainfallSince9am !== null ? `${rainfallSince9am}mm` : '--'}
              </span>
            </div>
            {rainfall && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last 24h</span>
                <span className="text-sm font-semibold">{rainfall.last24Hours.toFixed(1)}mm</span>
              </div>
            )}
          </div>
        </div>
        {rainfall && (
          <div className="bg-cyan-50 rounded-lg p-3">
            <p className="text-xs text-cyan-600 uppercase tracking-wide mb-1">Forecast</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next 24h</span>
                <span className="text-sm font-semibold text-cyan-700">{rainfall.next24Hours.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next 7d</span>
                <span className="text-sm font-semibold text-cyan-700">{rainfall.next7Days.toFixed(1)}mm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOM Weather Links */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">BOM Resources</p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={bomForecastUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            {displayName} Forecast
          </a>
          <a
            href={bomRadarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Weather Radar
          </a>
          <a
            href="http://www.bom.gov.au/qld/warnings/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg text-sm text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            QLD Warnings
          </a>
          <a
            href="http://www.bom.gov.au/qld/flood/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            QLD Flood Warnings
          </a>
        </div>
      </div>

    </div>
  )
}

export default RainfallPanel
