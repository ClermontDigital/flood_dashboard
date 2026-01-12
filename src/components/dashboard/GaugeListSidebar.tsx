'use client'

import { useState, useMemo } from 'react'
import type { GaugeData, FloodStatus, RiverSystem } from '@/lib/types'
import { RIVER_SYSTEM_NAMES, STATUS_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { GaugeCard } from './GaugeCard'
import { StatusBadge } from './StatusBadge'

interface GaugeListSidebarProps {
  gauges: GaugeData[]
  selectedGaugeId: string | null
  onSelectGauge: (id: string) => void
  isLoading: boolean
  error: boolean
}

// Priority order for sorting by status
const STATUS_PRIORITY: Record<FloodStatus, number> = {
  danger: 0,
  warning: 1,
  watch: 2,
  safe: 3,
}

export function GaugeListSidebar({
  gauges,
  selectedGaugeId,
  onSelectGauge,
  isLoading,
  error,
}: GaugeListSidebarProps) {
  const [viewMode, setViewMode] = useState<'status' | 'region'>('status')
  const [expandedRegions, setExpandedRegions] = useState<Set<RiverSystem>>(new Set())

  // Calculate status summary
  const statusSummary = useMemo(() => {
    const summary: Record<FloodStatus, number> = {
      danger: 0,
      warning: 0,
      watch: 0,
      safe: 0,
    }
    gauges.forEach((gauge) => {
      const status = gauge.reading?.status || 'safe'
      summary[status]++
    })
    return summary
  }, [gauges])

  // Sort gauges by status priority
  const sortedByStatus = useMemo(() => {
    return [...gauges].sort((a, b) => {
      const statusA = a.reading?.status || 'safe'
      const statusB = b.reading?.status || 'safe'
      return STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB]
    })
  }, [gauges])

  // Group gauges by river system
  const groupedByRegion = useMemo(() => {
    const groups = new Map<RiverSystem, GaugeData[]>()
    gauges.forEach((gauge) => {
      const region = gauge.station.riverSystem
      if (!groups.has(region)) {
        groups.set(region, [])
      }
      groups.get(region)!.push(gauge)
    })
    // Sort each group by status
    groups.forEach((regionGauges) => {
      regionGauges.sort((a, b) => {
        const statusA = a.reading?.status || 'safe'
        const statusB = b.reading?.status || 'safe'
        return STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB]
      })
    })
    return groups
  }, [gauges])

  // Get worst status for a region
  const getRegionStatus = (regionGauges: GaugeData[]): FloodStatus => {
    let worstStatus: FloodStatus = 'safe'
    let worstPriority = STATUS_PRIORITY['safe']
    regionGauges.forEach((gauge) => {
      const status = gauge.reading?.status || 'safe'
      if (STATUS_PRIORITY[status] < worstPriority) {
        worstStatus = status
        worstPriority = STATUS_PRIORITY[status]
      }
    })
    return worstStatus
  }

  const toggleRegion = (region: RiverSystem) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) {
        next.delete(region)
      } else {
        next.add(region)
      }
      return next
    })
  }

  // Expand all regions that have warnings
  const expandWarningRegions = () => {
    const warningRegions = new Set<RiverSystem>()
    gauges.forEach((gauge) => {
      const status = gauge.reading?.status
      if (status === 'danger' || status === 'warning' || status === 'watch') {
        warningRegions.add(gauge.station.riverSystem)
      }
    })
    setExpandedRegions(warningRegions)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-700">Loading Gauges...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-xs text-gray-400">Loading gauge {i}...</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-center py-8 text-red-600">
          <p className="font-medium">Unable to load data</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Status Summary Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Gauges ({gauges.length})
          </h2>
        </div>

        {/* Status Summary Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {statusSummary.danger > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {statusSummary.danger} Danger
            </span>
          )}
          {statusSummary.warning > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
              {statusSummary.warning} Warning
            </span>
          )}
          {statusSummary.watch > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
              {statusSummary.watch} Watch
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {statusSummary.safe} Safe
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setViewMode('status')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'status'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            By Priority
          </button>
          <button
            onClick={() => {
              setViewMode('region')
              expandWarningRegions()
            }}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'region'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            By Region
          </button>
        </div>
      </div>

      {/* Gauge List */}
      <div className="max-h-[500px] overflow-y-auto">
        {viewMode === 'status' ? (
          <div className="p-3 space-y-2">
            {sortedByStatus.map((gauge) => (
              <GaugeCard
                key={gauge.station.id}
                gaugeData={gauge}
                onClick={() => onSelectGauge(gauge.station.id)}
                selected={gauge.station.id === selectedGaugeId}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Array.from(groupedByRegion.entries()).map(([region, regionGauges]) => {
              const isExpanded = expandedRegions.has(region)
              const regionStatus = getRegionStatus(regionGauges)
              const hasWarning = regionStatus !== 'safe'

              return (
                <div key={region}>
                  <button
                    onClick={() => toggleRegion(region)}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between text-left',
                      'hover:bg-gray-50 transition-colors',
                      hasWarning && 'bg-amber-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[regionStatus] }}
                      />
                      <span className="font-medium text-gray-900">
                        {RIVER_SYSTEM_NAMES[region]}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({regionGauges.length})
                      </span>
                    </div>
                    <svg
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 bg-gray-50">
                      {regionGauges.map((gauge) => (
                        <GaugeCard
                          key={gauge.station.id}
                          gaugeData={gauge}
                          onClick={() => onSelectGauge(gauge.station.id)}
                          selected={gauge.station.id === selectedGaugeId}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GaugeListSidebar
