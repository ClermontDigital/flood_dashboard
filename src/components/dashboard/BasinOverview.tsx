'use client'

import { useMemo } from 'react'
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
    const falling = withReadings.filter(g => g.reading?.trend === 'falling').length

    return { total: gauges.length, active: withReadings.length, statusCounts, rising, falling }
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
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{basinStats.active}/{basinStats.total} gauges active</span>
          {basinStats.rising > 0 && (
            <span className="text-orange-600">↑ {basinStats.rising} rising</span>
          )}
          {basinStats.falling > 0 && (
            <span className="text-green-600">↓ {basinStats.falling} falling</span>
          )}
        </div>
      </div>

      {/* Status Summary Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {basinStats.statusCounts.danger > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            {basinStats.statusCounts.danger} Danger
          </span>
        )}
        {basinStats.statusCounts.warning > 0 && (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            {basinStats.statusCounts.warning} Warning
          </span>
        )}
        {basinStats.statusCounts.watch > 0 && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            {basinStats.statusCounts.watch} Watch
          </span>
        )}
        {basinStats.statusCounts.safe > 0 && (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            {basinStats.statusCounts.safe} Safe
          </span>
        )}
      </div>

      {/* Horizontal scrolling gauge cards by river system - only show gauges with readings */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
        {RIVER_ORDER.map(river => {
          const riverGauges = groupedGauges.get(river) || []
          // Only show gauges that have active readings
          const activeGauges = riverGauges.filter(g => g.reading)
          if (activeGauges.length === 0) return null

          return (
            <div key={river} className="flex-shrink-0">
              <div className="text-xs font-medium text-gray-500 mb-1.5">{RIVER_LABELS[river]}</div>
              <div className="flex gap-1.5">
                {activeGauges.map(gauge => (
                  <button
                    key={gauge.station.id}
                    onClick={() => onSelectGauge(gauge.station.id)}
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
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

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
