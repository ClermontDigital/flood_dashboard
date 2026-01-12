'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { CLERMONT_CENTER, STATUS_LABELS, EMERGENCY_RESOURCES, REFRESH_INTERVAL, DATA_SOURCES, APP_NAME, APP_TAGLINE } from '@/lib/constants'
import type { GaugeData, WaterLevelsResponse, FloodWarning, RiverSystem, HistoryPoint, FloodThresholds, GaugeStation } from '@/lib/types'
import { formatTimeSince, isDataStale, formatLevel, getTrendArrow, cn, calculateDistance, sortByDistance } from '@/lib/utils'

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
import { GaugeListSidebar } from '@/components/dashboard/GaugeListSidebar'
import { WarningBanner } from '@/components/dashboard/WarningBanner'
import LocationSearch from '@/components/dashboard/LocationSearch'
import QuickLinks from '@/components/dashboard/QuickLinks'
import RainfallPanel from '@/components/dashboard/RainfallPanel'
import type { RainfallSummary } from '@/lib/data-sources/rainfall'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Type for gauge detail response
interface GaugeDetailResponse {
  station: GaugeStation
  reading: GaugeData['reading']
  thresholds: FloodThresholds | null
  history: HistoryPoint[]
  source: string
  timestamp: string
}

// Type for rainfall API response
interface RainfallAPIResponse {
  regional: RainfallSummary | null
  gauges: Record<string, RainfallSummary | null>
  timestamp: string
  errors: string[]
}

export default function DashboardPage() {
  const [selectedGaugeId, setSelectedGaugeId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(CLERMONT_CENTER)
  const [filterRiver, setFilterRiver] = useState<RiverSystem | 'all'>('all')
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([])
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)

  // Fetch water levels with SWR (auto-refresh every 5 minutes)
  const { data: waterLevels, error: levelsError, isLoading: levelsLoading } = useSWR<WaterLevelsResponse>(
    '/api/water-levels',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // Fetch gauge detail with history when a gauge is selected
  const { data: gaugeDetail, isLoading: detailLoading } = useSWR<GaugeDetailResponse>(
    selectedGaugeId ? `/api/water-levels/${selectedGaugeId}` : null,
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // Fetch warnings
  const { data: warningsData } = useSWR<{ warnings: FloodWarning[] }>(
    '/api/warnings',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // Fetch rainfall data
  const { data: rainfallData, isLoading: rainfallLoading } = useSWR<RainfallAPIResponse>(
    '/api/rainfall',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // Filter gauges by river system
  const filteredGauges = waterLevels?.gauges?.filter(
    (g) => filterRiver === 'all' || g.station.riverSystem === filterRiver
  ) || []

  // Get selected gauge data from main list (for quick access)
  const selectedGaugeBasic = waterLevels?.gauges?.find((g) => g.station.id === selectedGaugeId)

  // Find nearest gauges to searched location
  const nearestGauges = useMemo(() => {
    if (!searchedLocation || !waterLevels?.gauges) return []
    return sortByDistance(
      waterLevels.gauges.map(g => ({ ...g, lat: g.station.lat, lng: g.station.lng })),
      searchedLocation.lat,
      searchedLocation.lng
    ).slice(0, 3)
  }, [searchedLocation, waterLevels?.gauges])

  // Active warnings (not dismissed) - memoized to prevent unnecessary recalculations
  const activeWarnings = useMemo(() =>
    warningsData?.warnings?.filter(
      (w) => !dismissedWarnings.includes(w.id)
    ) || [],
    [warningsData?.warnings, dismissedWarnings]
  )

  // Handle location search selection
  const handleSearchSelect = useCallback((result: { lat: number; lng: number; id?: string }) => {
    setMapCenter([result.lat, result.lng])
    if (result.id && !result.id.startsWith('addr-')) {
      setSelectedGaugeId(result.id)
      setSearchedLocation(null)
    }
  }, [])

  // Handle address search
  const handleAddressSelect = useCallback((location: { lat: number; lng: number; name: string }) => {
    setSearchedLocation(location)
    setMapCenter([location.lat, location.lng])
    setSelectedGaugeId(null) // Clear gauge selection to show nearby gauges
  }, [])

  // Handle quick link selection
  const handleQuickLinkSelect = useCallback((location: { lat: number; lng: number }) => {
    setMapCenter([location.lat, location.lng])
    setSearchedLocation(null)
  }, [])

  // Handle gauge selection from map
  const handleGaugeSelect = useCallback((id: string) => {
    setSelectedGaugeId(id)
    setSearchedLocation(null)
  }, [])

  // Dismiss warning - uses functional update to avoid stale closure
  const handleDismissWarning = useCallback(() => {
    setDismissedWarnings((prev) => {
      const currentWarnings = warningsData?.warnings || []
      const activeIds = currentWarnings
        .filter((w) => !prev.includes(w.id))
        .map((w) => w.id)
      return [...prev, ...activeIds]
    })
  }, [warningsData?.warnings])

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Warning Banner */}
      {activeWarnings.length > 0 && (
        <WarningBanner warnings={activeWarnings} onDismiss={handleDismissWarning} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {APP_NAME}
              </h1>
              <p className="text-gray-600 mt-1">
                {APP_TAGLINE}
              </p>
            </div>
            {/* Data source indicator */}
            {waterLevels?.sources && (
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                waterLevels.sources.includes('mock')
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-green-100 text-green-800 border border-green-300'
              )}>
                {waterLevels.sources.includes('mock') ? (
                  <span>DEMO DATA - API unavailable</span>
                ) : (
                  <span>LIVE: {waterLevels.sources.map(s => s.toUpperCase()).join(' + ')}</span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Search and Quick Links */}
        <div className="mb-6 space-y-4">
          <LocationSearch
            onSelect={handleSearchSelect}
            onAddressSelect={handleAddressSelect}
          />
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
              <div className="h-80 md:h-[500px] lg:h-[600px]">
                <FloodMap
                  gauges={filteredGauges}
                  selectedGaugeId={selectedGaugeId || undefined}
                  onSelectGauge={handleGaugeSelect}
                  center={mapCenter}
                  searchedLocation={searchedLocation}
                />
              </div>
            </div>

            {/* Nearby Gauges for Address Search */}
            {searchedLocation && nearestGauges.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Nearest Gauges to {searchedLocation.name.split(',')[0]}
                </h2>
                <div className="space-y-2">
                  {nearestGauges.map((gauge) => {
                    const distance = calculateDistance(
                      searchedLocation.lat,
                      searchedLocation.lng,
                      gauge.station.lat,
                      gauge.station.lng
                    )
                    return (
                      <button
                        key={gauge.station.id}
                        onClick={() => handleGaugeSelect(gauge.station.id)}
                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{gauge.station.name}</p>
                          <p className="text-sm text-gray-500">{gauge.station.stream}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">{distance.toFixed(1)} km</p>
                          {gauge.reading && (
                            <StatusBadge status={gauge.reading.status} size="sm" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Selected Gauge Details */}
            {selectedGaugeId && selectedGaugeBasic && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedGaugeBasic.station.name}
                    </h2>
                    <p className="text-gray-600 text-sm">{selectedGaugeBasic.station.stream}</p>
                  </div>
                  {selectedGaugeBasic.reading && (
                    <StatusBadge status={selectedGaugeBasic.reading.status} size="lg" />
                  )}
                </div>

                {selectedGaugeBasic.reading ? (
                  <>
                    {/* Current Level */}
                    <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatLevel(selectedGaugeBasic.reading.level)}
                      </div>
                      <div className="text-lg text-gray-600 mt-1">
                        {getTrendArrow(selectedGaugeBasic.reading.trend)}{' '}
                        {selectedGaugeBasic.reading.trend.charAt(0).toUpperCase() + selectedGaugeBasic.reading.trend.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {STATUS_LABELS[selectedGaugeBasic.reading.status].message}
                      </div>
                    </div>

                    {/* Data Source Info */}
                    <div className={cn(
                      "text-sm p-2 rounded mb-4",
                      isDataStale(selectedGaugeBasic.reading.timestamp) ? "bg-yellow-50 text-yellow-800" : "text-gray-500"
                    )}>
                      {isDataStale(selectedGaugeBasic.reading.timestamp) && (
                        <span className="font-medium">Data may be outdated. </span>
                      )}
                      Source: {selectedGaugeBasic.reading.source.toUpperCase()} |
                      Updated {formatTimeSince(selectedGaugeBasic.reading.timestamp)}
                    </div>

                    {/* Historical Chart */}
                    <div className="mt-4">
                      {detailLoading ? (
                        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Loading history...</span>
                        </div>
                      ) : gaugeDetail?.history && gaugeDetail.history.length > 0 ? (
                        <WaterLevelChart
                          history={gaugeDetail.history}
                          thresholds={gaugeDetail.thresholds || undefined}
                          gaugeId={selectedGaugeId}
                        />
                      ) : (
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                          <p className="text-gray-500">No historical data available</p>
                        </div>
                      )}
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
            <GaugeListSidebar
              gauges={filteredGauges}
              selectedGaugeId={selectedGaugeId}
              onSelectGauge={handleGaugeSelect}
              isLoading={levelsLoading}
              error={!!levelsError}
            />

            {/* Rainfall Overview */}
            <div className="mt-4">
              <RainfallPanel
                rainfall={rainfallData?.regional || null}
                isLoading={rainfallLoading}
              />
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
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500 mb-4">
            {waterLevels?.timestamp && (
              <p>Data last fetched: {formatTimeSince(waterLevels.timestamp)}</p>
            )}
          </div>

          {/* Data Source Links */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
              Official Data Sources
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {DATA_SOURCES.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm"
                >
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900">{source.name}</span>
                    <span className="text-gray-500 hidden sm:inline"> - {source.description}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-4 text-xs text-gray-400 text-center max-w-2xl mx-auto">
            <p>
              This dashboard displays water level data for informational purposes only.
              Always follow official warnings from BOM and emergency services.
              Data may be delayed up to 1 hour.
            </p>
          </div>

          {/* Open Source Attribution */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              An open source project by{' '}
              <a
                href="https://clermontdigital.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                Clermont Digital
              </a>
            </p>
            <a
              href="https://github.com/ClermontDigital/flood_dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  )
}
