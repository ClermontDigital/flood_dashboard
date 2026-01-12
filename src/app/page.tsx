'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { CLERMONT_CENTER, STATUS_LABELS, REFRESH_INTERVAL } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import type { GaugeData, WaterLevelsResponse, FloodWarning, RiverSystem, HistoryPoint, FloodThresholds, GaugeStation, DamStorageReading, RoadEventsResponse } from '@/lib/types'
import { formatTimeSince, isDataStale, formatLevel, getTrendArrow, cn, calculateDistance, sortByDistance } from '@/lib/utils'

// Loading placeholder component
function LoadingPlaceholder({ height, label }: { height: string; label: string }) {
  return (
    <div className={`${height} bg-gray-100 animate-pulse rounded-lg flex items-center justify-center`}>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
        <span className="text-gray-500 text-sm">{label}</span>
      </div>
    </div>
  )
}

// Dynamic imports for client-side only components
const FloodMap = dynamic(() => import('@/components/dashboard/FloodMap'), {
  ssr: false,
  loading: () => <LoadingPlaceholder height="h-80 md:h-[500px] lg:h-[600px]" label="Loading map..." />,
})

const WaterLevelChart = dynamic(() => import('@/components/dashboard/WaterLevelChart'), {
  ssr: false,
  loading: () => <LoadingPlaceholder height="h-48" label="Loading chart..." />,
})

import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { GaugeListSidebar } from '@/components/dashboard/GaugeListSidebar'
import { WarningBanner } from '@/components/dashboard/WarningBanner'
import LocationSearch from '@/components/dashboard/LocationSearch'
import RainfallPanel from '@/components/dashboard/RainfallPanel'
import BasinOverview from '@/components/dashboard/BasinOverview'
import type { RainfallSummary } from '@/lib/data-sources/rainfall'
import type { BOMObservation } from '@/lib/data-sources/bom-weather'

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
  // Default to Sandy Creek @ Clermont on first load
  const [selectedGaugeId, setSelectedGaugeId] = useState<string | null>('130207A')
  const [mapCenter, setMapCenter] = useState<[number, number]>(CLERMONT_CENTER)
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([])
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [showRoadClosures, setShowRoadClosures] = useState<boolean>(true)

  // Ref for gauge details section to scroll to
  const gaugeDetailsRef = useRef<HTMLDivElement>(null)

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

  // Fetch BOM weather data
  const { data: weatherData, isLoading: weatherLoading } = useSWR<{ success: boolean; data: BOMObservation | null }>(
    '/api/weather',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // Fetch road closures from QLDTraffic
  const { data: roadClosuresData } = useSWR<RoadEventsResponse>(
    '/api/road-closures',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL }
  )

  // All gauges
  const allGauges = waterLevels?.gauges || []

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

  // Scroll to gauge details when a gauge is selected
  useEffect(() => {
    if (selectedGaugeId && gaugeDetailsRef.current) {
      // Small delay to allow the DOM to update
      const timer = setTimeout(() => {
        // Respect user's motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        gaugeDetailsRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        })
      }, 100)
      // Cleanup timeout on unmount or re-render
      return () => clearTimeout(timer)
    }
  }, [selectedGaugeId])

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
        {/* Header with Logo, Search, and Status */}
        <header className="mb-4">
          <div className="flex items-center gap-4">
            {/* Logo - clickable to refresh */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Gauge - Clermont Flood Tracking"
                width={120}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>

            {/* Search - takes remaining space */}
            <div className="flex-1">
              <LocationSearch
                onSelect={handleSearchSelect}
                onAddressSelect={handleAddressSelect}
              />
            </div>

            {/* Data source indicator */}
            {waterLevels?.sources && (
              <div
                role="status"
                aria-live="polite"
                aria-label={
                  waterLevels.sources.includes('unavailable')
                    ? 'Data unavailable - check sources'
                    : waterLevels.sources.includes('error')
                    ? 'API error - refresh to retry'
                    : `Live data from ${waterLevels.sources.filter(s => ['wmip', 'bom'].includes(s)).join(' and ')}`
                }
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium flex-shrink-0',
                  waterLevels.sources.includes('unavailable') || waterLevels.sources.includes('error')
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-green-100 text-green-800 border border-green-300'
                )}
              >
                {waterLevels.sources.includes('unavailable') ? (
                  <span>DATA UNAVAILABLE</span>
                ) : waterLevels.sources.includes('error') ? (
                  <span>API ERROR</span>
                ) : (
                  <span>LIVE: {waterLevels.sources.filter(s => ['wmip', 'bom'].includes(s)).map(s => s.toUpperCase()).join(' + ')}</span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Basin Overview and Rainfall - Side by side on larger screens */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <BasinOverview
              gauges={allGauges}
              selectedGaugeId={selectedGaugeId}
              onSelectGauge={handleGaugeSelect}
              isLoading={levelsLoading}
            />
          </div>
          <div className="lg:col-span-1">
            <RainfallPanel
              rainfall={rainfallData?.regional || null}
              weather={weatherData?.data || null}
              isLoading={rainfallLoading || weatherLoading}
              compact
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-80 md:h-[500px] lg:h-[600px]">
                <FloodMap
                  gauges={allGauges}
                  selectedGaugeId={selectedGaugeId || undefined}
                  onSelectGauge={handleGaugeSelect}
                  center={mapCenter}
                  searchedLocation={searchedLocation}
                  roadEvents={roadClosuresData?.events}
                  showRoadClosures={showRoadClosures}
                />
              </div>

              {/* Road Closures Toggle and Summary */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRoadClosures(!showRoadClosures)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      showRoadClosures ? 'bg-blue-600' : 'bg-gray-200'
                    )}
                    role="switch"
                    aria-checked={showRoadClosures}
                    aria-label="Show road closures on map"
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        showRoadClosures ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Road Closures
                  </span>
                  {roadClosuresData?.events && roadClosuresData.events.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {roadClosuresData.events.length} active
                    </span>
                  )}
                </div>
                {roadClosuresData?.sourceUrl && (
                  <a
                    href={roadClosuresData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Source: QLDTraffic
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
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
              <div ref={gaugeDetailsRef} className="mt-4 bg-white rounded-lg shadow-sm p-4">
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

                    {/* Discharge and Rainfall Data */}
                    {(selectedGaugeBasic.discharge || rainfallData?.gauges[selectedGaugeId]) && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Discharge/Flow Rate */}
                        {selectedGaugeBasic.discharge && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xs text-blue-600 font-medium uppercase">Flow Rate</div>
                            <div className="text-xl font-bold text-blue-900 mt-1">
                              {selectedGaugeBasic.discharge.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              <span className="text-sm font-normal ml-1">{selectedGaugeBasic.discharge.unit}</span>
                            </div>
                          </div>
                        )}
                        {/* Rainfall from Open-Meteo */}
                        {rainfallData?.gauges[selectedGaugeId] && (
                          <div className="p-3 bg-cyan-50 rounded-lg">
                            <div className="text-xs text-cyan-600 font-medium uppercase">
                              Rainfall (Last 24h)
                            </div>
                            <div className="text-xl font-bold text-cyan-900 mt-1">
                              {rainfallData.gauges[selectedGaugeId]!.last24Hours.toFixed(1)}
                              <span className="text-sm font-normal ml-1">mm</span>
                            </div>
                            {rainfallData.gauges[selectedGaugeId]!.current.isRaining && (
                              <div className="text-xs text-cyan-600 mt-1">
                                Currently raining
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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

                    {/* WMIP Link */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={`https://water-monitoring.information.qld.gov.au/host.htm?ppbm=${selectedGaugeId}&rs&1&rslf_org`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View on Queensland WMIP
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
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
              gauges={allGauges}
              selectedGaugeId={selectedGaugeId}
              onSelectGauge={handleGaugeSelect}
              isLoading={levelsLoading}
              error={!!levelsError}
            />

            {/* Dam Storage Panel */}
            {waterLevels?.damStorage && waterLevels.damStorage.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Dam Storage
                </h3>
                <div className="space-y-3">
                  {waterLevels.damStorage.map((dam) => (
                    <div key={dam.stationId} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{dam.name}</h4>
                        {dam.percentFull !== undefined && (
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            dam.percentFull >= 90 ? 'bg-red-100 text-red-800' :
                            dam.percentFull >= 75 ? 'bg-orange-100 text-orange-800' :
                            dam.percentFull >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          )}>
                            {dam.percentFull.toFixed(1)}% Full
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Volume:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {(dam.volume / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} GL
                          </span>
                        </div>
                        {dam.level > 0 && (
                          <div>
                            <span className="text-gray-500">Level:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {dam.level.toFixed(2)}m
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Updated: {formatTimeSince(dam.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  )
}
