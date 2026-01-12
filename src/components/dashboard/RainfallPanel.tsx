'use client'

import { cn } from '@/lib/utils'
import type { RainfallSummary } from '@/lib/data-sources/rainfall'
import { getRainfallIntensity, getRainfallRisk } from '@/lib/data-sources/rainfall'

interface RainfallPanelProps {
  rainfall: RainfallSummary | null
  isLoading?: boolean
  compact?: boolean
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

export function RainfallPanel({ rainfall, isLoading, compact = false }: RainfallPanelProps) {
  if (isLoading) {
    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 p-4",
        compact ? "p-3" : "p-4"
      )}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!rainfall) {
    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200",
        compact ? "p-3" : "p-4"
      )}>
        <h3 className={cn("font-semibold text-gray-700", compact ? "text-sm" : "text-base")}>
          Rainfall Data
        </h3>
        <p className="text-gray-500 text-sm mt-2">Unable to load rainfall data</p>
      </div>
    )
  }

  const risk = getRainfallRisk(rainfall.next24Hours, rainfall.next7Days)
  const intensity = getRainfallIntensity(rainfall.current.precipitation)

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Rainfall</h3>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full border",
            riskColors[risk]
          )}>
            {riskLabels[risk]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Last 24h:</span>
            <span className="ml-1 font-medium">{rainfall.last24Hours.toFixed(1)}mm</span>
          </div>
          <div>
            <span className="text-gray-500">Next 24h:</span>
            <span className="ml-1 font-medium">{rainfall.next24Hours.toFixed(1)}mm</span>
          </div>
        </div>
        {rainfall.current.isRaining && (
          <p className="text-xs text-blue-600 mt-2">
            Currently raining: {intensity}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Rainfall Overview
        </h3>
        <span className={cn(
          "px-3 py-1 text-sm font-medium rounded-full border",
          riskColors[risk]
        )}>
          {riskLabels[risk]}
        </span>
      </div>

      {/* Current Status */}
      <div className={cn(
        "rounded-lg p-3 mb-4",
        rainfall.current.isRaining ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
      )}>
        <div className="flex items-center gap-2">
          <svg
            className={cn(
              "w-5 h-5",
              rainfall.current.isRaining ? "text-blue-500" : "text-gray-400"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <div>
            <p className="font-medium text-gray-900">{intensity}</p>
            {rainfall.current.isRaining && (
              <p className="text-sm text-gray-600">
                {rainfall.current.precipitation.toFixed(1)} mm/hr
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Historical and Forecast */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recent</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last 24h</span>
              <span className="text-sm font-semibold">{rainfall.last24Hours.toFixed(1)}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last 7d</span>
              <span className="text-sm font-semibold">{rainfall.last7Days.toFixed(1)}mm</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Forecast</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Next 24h</span>
              <span className="text-sm font-semibold text-blue-700">{rainfall.next24Hours.toFixed(1)}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Next 7d</span>
              <span className="text-sm font-semibold text-blue-700">{rainfall.next7Days.toFixed(1)}mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Forecast */}
      {rainfall.dailyForecast.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">7-Day Forecast</p>
          <div className="flex gap-1 overflow-x-auto">
            {rainfall.dailyForecast.map((day, index) => {
              const dayName = new Date(day.date).toLocaleDateString('en-AU', { weekday: 'short' })
              const hasRain = day.precipitationSum > 0
              return (
                <div
                  key={day.date}
                  className={cn(
                    "flex-1 min-w-[48px] text-center p-2 rounded",
                    hasRain ? "bg-blue-50" : "bg-gray-50"
                  )}
                >
                  <p className="text-xs text-gray-500">{dayName}</p>
                  <p className={cn(
                    "text-sm font-medium",
                    hasRain ? "text-blue-700" : "text-gray-400"
                  )}>
                    {day.precipitationSum.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {day.precipitationProbabilityMax}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Location and Source */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        {rainfall.location.name && (
          <p className="text-xs text-gray-400">
            {rainfall.location.name}
          </p>
        )}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
        >
          Source: Open-Meteo
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default RainfallPanel
