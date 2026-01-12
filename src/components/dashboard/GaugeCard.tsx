'use client'

import { cn, formatLevel, formatTimeSince, getTrendArrow, isDataStale } from '@/lib/utils'
import type { GaugeData, Trend } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

interface GaugeCardProps {
  gaugeData: GaugeData
  onClick?: () => void
  selected?: boolean
  compact?: boolean
}

const trendDescriptions: Record<Trend, string> = {
  rising: 'Water level is rising',
  falling: 'Water level is falling',
  stable: 'Water level is stable',
}

function getTrendColor(trend: Trend): string {
  switch (trend) {
    case 'rising':
      return 'text-red-500'
    case 'falling':
      return 'text-green-500'
    case 'stable':
      return 'text-gray-500'
  }
}

function getPlainDescription(gaugeData: GaugeData): string {
  const { station, reading, thresholds } = gaugeData

  if (!reading) {
    return 'No current water level data available for this gauge.'
  }

  const { level, trend, status } = reading

  let description = `${station.name} on ${station.stream} is currently at ${level.toFixed(2)} metres. `

  switch (status) {
    case 'safe':
      description += 'Water levels are normal and there is no flood risk at this time.'
      break
    case 'watch':
      description += 'Water levels are elevated. Keep an eye on conditions and stay informed.'
      break
    case 'warning':
      description += 'Flooding is expected. Prepare to take action and avoid flood-prone areas.'
      break
    case 'danger':
      description += 'Major flooding is occurring or imminent. Take action immediately to protect life and property.'
      break
  }

  if (trend === 'rising') {
    description += ' The water level is currently rising.'
  } else if (trend === 'falling') {
    description += ' The water level is currently falling.'
  }

  if (thresholds) {
    if (status === 'safe' && thresholds.minor) {
      const headroom = thresholds.minor - level
      if (headroom > 0) {
        description += ` There is ${headroom.toFixed(2)}m headroom before minor flood level.`
      }
    }
  }

  return description
}

export function GaugeCard({ gaugeData, onClick, selected, compact = false }: GaugeCardProps) {
  const { station, reading, thresholds } = gaugeData
  const hasData = reading !== null
  const staleData = hasData && isDataStale(reading.timestamp)

  // Compact mode for sidebar display
  if (compact) {
    return (
      <article
        className={cn(
          'bg-white rounded-lg border border-gray-200 p-3',
          'transition-all duration-150',
          'hover:bg-gray-50 hover:border-gray-300',
          onClick && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
          staleData && 'opacity-75',
          selected && 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick()
          }
        }}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : 'article'}
        aria-label={`Gauge card for ${station.name}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{station.name}</h3>
            <p className="text-xs text-gray-500 truncate">{station.stream}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasData && (
              <>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {reading.level.toFixed(2)}m
                  </span>
                  <span className={cn('ml-1', getTrendColor(reading.trend))}>
                    {getTrendArrow(reading.trend)}
                  </span>
                </div>
                <StatusBadge status={reading.status} size="sm" />
              </>
            )}
          </div>
        </div>
        {staleData && (
          <p className="text-xs text-amber-600 mt-1">Data may be outdated</p>
        )}
      </article>
    )
  }

  // Full mode (original)
  return (
    <article
      className={cn(
        'bg-white rounded-lg shadow-md border border-gray-200 p-4',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-lg hover:border-gray-300',
        onClick && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
        staleData && 'opacity-75',
        selected && 'ring-2 ring-blue-500 border-blue-500'
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : 'article'}
      aria-label={`Gauge card for ${station.name}`}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{station.name}</h3>
          <p className="text-sm text-gray-600">{station.stream}</p>
        </div>
        {hasData && <StatusBadge status={reading.status} size="sm" />}
      </header>

      {/* Water Level Display */}
      {hasData ? (
        <div className="space-y-3">
          {/* Current Level */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatLevel(reading.level, reading.unit)}
            </span>
            <span
              className={cn('text-xl font-medium', getTrendColor(reading.trend))}
              title={trendDescriptions[reading.trend]}
              aria-label={trendDescriptions[reading.trend]}
            >
              {getTrendArrow(reading.trend)}
            </span>
          </div>

          {/* Change Rate */}
          {reading.changeRate !== 0 && (
            <p className="text-sm text-gray-600">
              {reading.changeRate > 0 ? '+' : ''}
              {reading.changeRate.toFixed(2)} m/hr
            </p>
          )}

          {/* Plain English Description */}
          <p className="text-sm text-gray-700 leading-relaxed">
            {getPlainDescription(gaugeData)}
          </p>

          {/* Thresholds (if available) */}
          {thresholds && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Flood levels:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-yellow-600">
                  Minor: {thresholds.minor}m
                </span>
                <span className="text-orange-600">
                  Moderate: {thresholds.moderate}m
                </span>
                <span className="text-red-600">
                  Major: {thresholds.major}m
                </span>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <footer className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className={cn('text-xs', staleData ? 'text-amber-600' : 'text-gray-500')}>
              {staleData && (
                <span className="inline-flex items-center mr-1" aria-hidden="true">
                  <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
              )}
              Updated {formatTimeSince(reading.timestamp)}
              {staleData && ' (data may be outdated)'}
            </p>
            <span className="text-xs text-gray-400 uppercase">
              {reading.source}
            </span>
          </footer>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-gray-500">No data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Data may be temporarily unavailable
          </p>
        </div>
      )}

      {/* Click to expand hint */}
      {onClick && hasData && (
        <p className="mt-3 text-xs text-blue-600 text-center">
          Click for more details
        </p>
      )}
    </article>
  )
}

export default GaugeCard
