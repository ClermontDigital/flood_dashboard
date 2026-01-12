'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { GAUGE_STATIONS, QUICK_LINKS, CLERMONT_CENTER, STATUS_LABELS, EMERGENCY_RESOURCES } from '@/lib/constants'
import type { GaugeData, WaterLevelsResponse, FloodWarning, RiverSystem } from '@/lib/types'
import { formatTimeSince, isDataStale, formatLevel, getTrendArrow, cn } from '@/lib/utils'

// Dynamic imports for client-side only components
const FloodMap = dynamic(() => import('@/components/dashboard/FloodMap'), {
  ssr: false,
  loading: () => <div className="h-64 md:h-96 bg-gray-200 animate-pulse rounded-lg" />,
})

const WaterLevelChart = dynamic(() => import('@/components/dashboard/WaterLevelChart'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-200 animate-pulse rounded-lg" />,
})

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { GaugeCard } from '@/components/dashboard/GaugeCard'
import { WarningBanner } from '@/components/dashboard/WarningBanner'
import LocationSearch from '@/components/dashboard/LocationSearch'
import QuickLinks from '@/components/dashboard/QuickLinks'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [selectedGaugeId, setSelectedGaugeId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(CLERMONT_CENTER)
  const [filterRiver, setFilterRiver] = useState<RiverSystem | 'all'>('all')
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([])

  // Fetch water levels with SWR (auto-refresh every 5 minutes)
  const { data: waterLevels, error: levelsError, isLoading: levelsLoading } = useSWR<WaterLevelsResponse>(
    '/api/water-levels',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  )

  // Fetch warnings
  const { data: warningsData } = useSWR<{ warnings: FloodWarning[] }>(
    '/api/warnings',
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  )

  // Filter gauges by river system
  const filteredGauges = waterLevels?.gauges?.filter(
    (g) => filterRiver === 'all' || g.station.riverSystem === filterRiver
  ) || []

  // Get selected gauge data
  const selectedGauge = waterLevels?.gauges?.find((g) => g.station.id === selectedGaugeId)

  // Active warnings (not dismissed)
  const activeWarnings = warningsData?.warnings?.filter(
    (w) => !dismissedWarnings.includes(w.id)
  ) || []

  // Handle location search selection
  const handleSearchSelect = useCallback((result: { lat: number; lng: number; id?: string }) => {
    setMapCenter([result.lat, result.lng])
    if (result.id) {
      setSelectedGaugeId(result.id)
    }
  }, [])

  // Handle quick link selection
  const handleQuickLinkSelect = useCallback((location: { lat: number; lng: number }) => {
    setMapCenter([location.lat, location.lng])
  }, [])

  // Handle gauge selection from map
  const handleGaugeSelect = useCallback((id: string) => {
    setSelectedGaugeId(id)
  }, [])

  // Dismiss warning
  const handleDismissWarning = useCallback(() => {
    if (activeWarnings.length > 0) {
      setDismissedWarnings((prev) => [...prev, ...activeWarnings.map((w) => w.id)])
    }
  }, [activeWarnings])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Warning Banner */}
      {activeWarnings.length > 0 && (
        <WarningBanner warnings={activeWarnings} onDismiss={handleDismissWarning} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Clermont Flood Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time water levels for the Fitzroy Basin
          </p>
        </header>

        {/* Search and Quick Links */}
        <div className="mb-6 space-y-4">
          <LocationSearch onSelect={handleSearchSelect} />
          <QuickLinks onSelect={handleQuickLinkSelect} />
        </div>

        {/* River System Filter */}
        <div className="mb-4">
          <label htmlFor="river-filter" className="sr-only">
            Filter by river system
          </label>
          <select
            id="river-filter"
            value={filterRiver}
            onChange={(e) => setFilterRiver(e.target.value as RiverSystem | 'all')}
            className="w-full md:w-auto px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All River Systems</option>
            <option value="clermont">Clermont Area</option>
            <option value="isaac">Isaac River</option>
            <option value="nogoa">Nogoa River</option>
            <option value="mackenzie">Mackenzie River</option>
            <option value="comet">Comet River</option>
            <option value="fitzroy">Fitzroy River</option>
          </select>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 md:h-96">
                <FloodMap
                  gauges={filteredGauges}
                  selectedGaugeId={selectedGaugeId || undefined}
                  onSelectGauge={handleGaugeSelect}
                  center={mapCenter}
                />
              </div>
            </div>

            {/* Selected Gauge Details */}
            {selectedGauge && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedGauge.station.name}
                    </h2>
                    <p className="text-gray-600 text-sm">{selectedGauge.station.stream}</p>
                  </div>
                  {selectedGauge.reading && (
                    <StatusBadge status={selectedGauge.reading.status} size="lg" />
                  )}
                </div>

                {selectedGauge.reading ? (
                  <>
                    {/* Current Level */}
                    <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatLevel(selectedGauge.reading.level)}
                      </div>
                      <div className="text-lg text-gray-600 mt-1">
                        {getTrendArrow(selectedGauge.reading.trend)}{' '}
                        {selectedGauge.reading.trend.charAt(0).toUpperCase() + selectedGauge.reading.trend.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {STATUS_LABELS[selectedGauge.reading.status].message}
                      </div>
                    </div>

                    {/* Data Source Info */}
                    <div className={cn(
                      "text-sm p-2 rounded",
                      isDataStale(selectedGauge.reading.timestamp) ? "bg-yellow-50 text-yellow-800" : "text-gray-500"
                    )}>
                      {isDataStale(selectedGauge.reading.timestamp) && (
                        <span className="font-medium">Data may be outdated. </span>
                      )}
                      Source: {selectedGauge.reading.source.toUpperCase()} |
                      Updated {formatTimeSince(selectedGauge.reading.timestamp)}
                    </div>

                    {/* Chart would go here */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">24-Hour History</h3>
                      <WaterLevelChart
                        history={[]}
                        thresholds={selectedGauge.thresholds || undefined}
                        gaugeId={selectedGauge.station.id}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data available for this gauge
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Gauge List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Gauge Stations ({filteredGauges.length})
              </h2>

              {levelsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : levelsError ? (
                <div className="text-center py-8 text-red-600">
                  <p className="font-medium">Unable to load data</p>
                  <p className="text-sm mt-1">Please try again later</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredGauges.map((gauge) => (
                    <GaugeCard
                      key={gauge.station.id}
                      gaugeData={gauge}
                      onClick={() => handleGaugeSelect(gauge.station.id)}
                      selected={gauge.station.id === selectedGaugeId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Resources */}
            <div className="mt-4 bg-red-50 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3">
                Emergency Resources
              </h3>
              <ul className="space-y-2">
                {EMERGENCY_RESOURCES.map((resource) => (
                  <li key={resource.name}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-700 hover:text-red-900 hover:underline text-sm"
                    >
                      {resource.name} - {resource.description}
                    </a>
                  </li>
                ))}
                <li className="pt-2 border-t border-red-200">
                  <span className="font-bold text-red-900">Emergency: 000</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Last Updated Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          {waterLevels?.timestamp && (
            <p>Data last fetched: {formatTimeSince(waterLevels.timestamp)}</p>
          )}
          <p className="mt-1">
            Data sources: Queensland WMIP, Bureau of Meteorology
          </p>
        </footer>
      </div>
    </main>
  )
}
