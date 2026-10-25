'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { GaugeData, RiverSystem } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

interface BasinOverviewProps {
  gauges: GaugeData[]
  selectedGaugeId: string | null
  onSelectGauge: (id: string) => void
  isLoading: boolean
}

// Group gauges by river system for the basin view
// Ordered by region: SEQ → Wide Bay → Central → Mackay → North → Far North → Darling Downs → Western
const RIVER_ORDER: RiverSystem[] = [
  // Southeast QLD
  'brisbane', 'bremer', 'lockyer', 'northpine', 'logan', 'albert', 'nerang', 'coomera',
  // Sunshine Coast
  'mooloolah',
  // Wide Bay-Burnett
  'mary', 'burnett', 'kolan',
  // Central QLD (Fitzroy Basin)
  'clermont', 'theresa', 'wolfang', 'douglas', 'isaac', 'nogoa', 'mackenzie', 'comet', 'fitzroy',
  // Mackay-Whitsunday
  'pioneer', 'proserpine', 'broken',
  // Bowen area
  'don',
  // North QLD
  'burdekin', 'ross', 'herbert',
  // Far North QLD
  'barron', 'mulgrave', 'johnstone', 'tully', 'daintree',
  // Cape York
  'mitchell', 'normanby',
  // Gulf Country
  'norman',
  // Darling Downs
  'condamine',
  // Western Queensland
  'flinders', 'leichhardt', 'cloncurry',
  // Channel Country / Outback
  'cooper', 'diamantina', 'warrego', 'paroo',
]

type BasinFilter = 'danger' | 'warning' | 'watch' | 'rising'

// Summary pills, which double as filters for the gauge cards
const BASIN_PILLS: { filter: BasinFilter; label: string; className: string }[] = [
  { filter: 'danger', label: 'Danger', className: 'bg-red-100 text-red-800' },
  { filter: 'warning', label: 'Warning', className: 'bg-orange-100 text-orange-800' },
  { filter: 'watch', label: 'Watch', className: 'bg-yellow-100 text-yellow-800' },
  { filter: 'rising', label: 'Rising', className: 'bg-blue-100 text-blue-800' },
]

function matchesFilter(gauge: GaugeData, filter: BasinFilter | null): boolean {
  const reading = gauge.reading
  if (!reading) return false
  // "Rising" counts only rising gauges that are still safe (elevated ones have their own pill)
  if (filter === 'rising') return reading.trend === 'rising' && reading.status === 'safe'
  if (filter) return reading.status === filter
  // No filter: gauges with an elevated status or a rising trend
  return ['watch', 'warning', 'danger'].includes(reading.status) || reading.trend === 'rising'
}

const RIVER_LABELS: Record<RiverSystem, string> = {
  // Fitzroy Basin
  clermont: 'Sandy Creek',
  theresa: 'Theresa Creek',
  wolfang: 'Wolfang Creek',
  douglas: 'Douglas Creek',
  isaac: 'Isaac River',
  nogoa: 'Nogoa River',
  mackenzie: 'Mackenzie River',
  comet: 'Comet River',
  fitzroy: 'Fitzroy River',
  // Burnett Basin
  burnett: 'Burnett River',
  kolan: 'Kolan River',
  // Brisbane Basin
  brisbane: 'Brisbane River',
  bremer: 'Bremer River',
  lockyer: 'Lockyer Creek',
  northpine: 'North Pine River',
  mooloolah: 'Mooloolah River',
  // Logan-Albert Basin
  logan: 'Logan River',
  albert: 'Albert River',
  // Gold Coast
  nerang: 'Nerang River',
  coomera: 'Coomera River',
  // Mary River Basin
  mary: 'Mary River',
  // Burdekin Basin
  burdekin: 'Burdekin River',
  ross: 'Ross River',
  // Herbert Basin
  herbert: 'Herbert River',
  // Cairns/Far North
  barron: 'Barron River',
  mulgrave: 'Mulgrave River',
  johnstone: 'Johnstone River',
  tully: 'Tully River',
  daintree: 'Daintree River',
  // Mackay/Pioneer
  pioneer: 'Pioneer River',
  proserpine: 'Proserpine River',
  broken: 'Broken River',
  // Condamine-Balonne
  condamine: 'Condamine River',
  // Western Queensland
  flinders: 'Flinders River',
  leichhardt: 'Leichhardt River',
  cloncurry: 'Cloncurry River',
  // Channel Country / Outback
  cooper: 'Cooper Creek',
  diamantina: 'Diamantina River',
  warrego: 'Warrego River',
  paroo: 'Paroo River',
  // Cape York
  mitchell: 'Mitchell River',
  normanby: 'Normanby River',
  // Gulf Country
  norman: 'Norman River',
  // Bowen area
  don: 'Don River',
}

export function BasinOverview({ gauges, selectedGaugeId, onSelectGauge, isLoading }: BasinOverviewProps) {
  const [filter, setFilter] = useState<BasinFilter | null>(null)

  // Group gauges by river system
  const groupedGauges = useMemo(() => {
    const groups = new Map<RiverSystem, GaugeData[]>()

    for (const river of RIVER_ORDER) {
      groups.set(river, [])
    }

    for (const gauge of gauges) {
      const riverSystem = gauge.station.riverSystem
      const existing = groups.get(riverSystem) || []
      existing.push(gauge)
      groups.set(riverSystem, existing)
    }

    return groups
  }, [gauges])

  // Calculate basin-wide statistics
  const basinStats = useMemo(() => {
    const withReadings = gauges.filter(g => g.reading)
    const statusCounts = {
      safe: withReadings.filter(g => g.reading?.status === 'safe').length,
      watch: withReadings.filter(g => g.reading?.status === 'watch').length,
      warning: withReadings.filter(g => g.reading?.status === 'warning').length,
      danger: withReadings.filter(g => g.reading?.status === 'danger').length,
    }
    const rising = withReadings.filter(g => g.reading?.trend === 'rising').length
    const risingSafe = withReadings.filter(g => g.reading?.trend === 'rising' && g.reading?.status === 'safe').length
    const falling = withReadings.filter(g => g.reading?.trend === 'falling').length

    return { total: gauges.length, active: withReadings.length, statusCounts, rising, risingSafe, falling }
  }, [gauges])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-gray-700">Loading from QLD WMIP...</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Basin Summary */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Queensland Rivers Overview</h2>
      </div>

      {/* Status Summary Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {BASIN_PILLS.map((pill) => {
          const count = pill.filter === 'rising' ? basinStats.risingSafe : basinStats.statusCounts[pill.filter]
          const active = filter === pill.filter
          // Keep the active pill visible even if its count drops to zero, so it can be cleared
          if (count === 0 && !active) return null
          return (
            <button
              key={pill.filter}
              type="button"
              onClick={() => setFilter(active ? null : pill.filter)}
              aria-pressed={active}
              title={active ? 'Show all alerts' : `Show only ${pill.label.toLowerCase()} gauges`}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition',
                pill.className,
                active ? 'ring-2 ring-current' : 'hover:ring-1 hover:ring-current',
                filter && !active && 'opacity-50'
              )}
            >
              {count} {pill.label}
            </button>
          )
        })}
      </div>

      {/* Horizontal scrolling gauge cards by river system - show alerts and rising gauges */}
      {gauges.some((g) => matchesFilter(g, filter)) ? (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {RIVER_ORDER.map(river => {
            const riverGauges = groupedGauges.get(river) || []
            // Show gauges with elevated status OR rising trend (or just those matching the pill)
            const alertGauges = riverGauges.filter(g => matchesFilter(g, filter)).sort((a, b) => {
              const priority: Record<string, number> = { danger: 0, warning: 1, watch: 2, safe: 3 }
              return (priority[a.reading?.status || 'safe'] ?? 3) - (priority[b.reading?.status || 'safe'] ?? 3)
            })
            if (alertGauges.length === 0) return null

            return (
              <div key={river} className="flex-shrink-0">
                <div className="text-xs font-medium text-gray-500 mb-1.5">{RIVER_LABELS[river]}</div>
                <div className="flex gap-1.5">
                  {alertGauges.map(gauge => (
                    // A real link to the gauge's page (search engines follow it; Ctrl/Cmd-click opens a
                    // new tab); a plain click selects the gauge in place
                    <Link
                      key={gauge.station.id}
                      href={`/gauge/${gauge.station.id}`}
                      prefetch={false}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                        e.preventDefault()
                        onSelectGauge(gauge.station.id)
                      }}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-lg transition-all min-w-[70px]',
                        'hover:ring-2 hover:ring-blue-300',
                        selectedGaugeId === gauge.station.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'bg-gray-50'
                      )}
                      title={`${gauge.station.name} - ${gauge.station.stream}`}
                    >
                      <div className="text-sm font-bold text-gray-900">
                        {gauge.reading!.level.toFixed(1)}m
                      </div>
                      <StatusBadge status={gauge.reading!.status} size="xs" />
                      <div
                        className="text-[10px] text-gray-500 mt-0.5"
                        aria-label={`Trend: ${gauge.reading!.trend}`}
                      >
                        {gauge.reading!.trend === 'rising' ? '↑' : gauge.reading!.trend === 'falling' ? '↓' : '—'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-3 text-center text-sm text-gray-500">
          {filter ? 'No gauges with this status' : 'All monitored gauges are at safe levels'}
        </div>
      )}

      {/* WMIP Source Link */}
      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
        <span>Data from BOM & Queensland WMIP</span>
        <a
          href="https://water-monitoring.information.qld.gov.au/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View all data
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default BasinOverview
