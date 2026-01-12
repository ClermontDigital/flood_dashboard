'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { GaugeData, FloodStatus, RiverSystem, RoadEvent } from '@/lib/types'
import { CLERMONT_CENTER, STATUS_COLORS, STATUS_LABELS, DEFAULT_ZOOM, MAP_LAYERS, MapLayerType, RIVER_PATHS, RIVER_SYSTEM_NAMES } from '@/lib/constants'
import { cn, formatLevel, getTrendArrow, getLocalStorage, setLocalStorage } from '@/lib/utils'

// Fix Leaflet default icon issue with Next.js
import 'leaflet/dist/leaflet.css'

interface FloodMapProps {
  gauges: GaugeData[]
  selectedGaugeId?: string
  onSelectGauge: (id: string) => void
  center?: [number, number]
  searchedLocation?: { lat: number; lng: number; name: string } | null
  roadEvents?: RoadEvent[]
  showRoadClosures?: boolean
}

// Create custom colored markers for different status levels
function createStatusIcon(status: FloodStatus): L.DivIcon {
  const color = STATUS_COLORS[status] || STATUS_COLORS.safe

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

// Create selected marker (larger with pulse effect)
function createSelectedIcon(status: FloodStatus): L.DivIcon {
  const color = STATUS_COLORS[status] || STATUS_COLORS.safe

  return L.divIcon({
    className: 'custom-marker-selected',
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          background-color: ${color}40;
          border-radius: 50%;
          top: -8px;
          left: -8px;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          width: 28px;
          height: 28px;
          background-color: ${color};
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 6px rgba(0,0,0,0.4);
          position: relative;
          z-index: 1;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

// Create location pin marker for searched addresses
function createLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'location-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="1.5" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Create road closure/event icon
function createRoadEventIcon(type: RoadEvent['type'], severity: RoadEvent['severity']): L.DivIcon {
  const colors = {
    flooding: '#dc2626', // red-600
    road_closure: '#ea580c', // orange-600
    hazard: '#ca8a04', // yellow-600
    roadworks: '#2563eb', // blue-600
    crash: '#7c3aed', // violet-600
    congestion: '#0891b2', // cyan-600
    special_event: '#059669', // emerald-600
  }

  const icons = {
    flooding: `<path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/>`, // water/flood warning
    road_closure: `<circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>`, // X in circle
    hazard: `<path d="M12 2L2 22h20L12 2z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/>`, // warning triangle
    roadworks: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8m-4-4h8"/>`, // construction
    crash: `<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>`, // alert circle
    congestion: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="7" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="17" cy="12" r="2"/>`, // traffic light
    special_event: `<path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z"/>`, // star
  }

  const color = colors[type] || colors.hazard
  const iconPath = icons[type] || icons.hazard
  const size = severity === 'extreme' || severity === 'high' ? 28 : 24
  const pulseAnimation = (severity === 'extreme' || severity === 'high') ? `
    <style>
      @keyframes roadPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  ` : ''

  return L.divIcon({
    className: 'road-event-marker',
    html: `
      ${pulseAnimation}
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${(severity === 'extreme' || severity === 'high') ? 'animation: roadPulse 2s infinite;' : ''}
      ">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="width: ${size - 8}px; height: ${size - 8}px;"
        >
          ${iconPath}
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// Component to handle map view changes
function MapController({ center, selectedGaugeId, gauges, searchedLocation }: {
  center?: [number, number]
  selectedGaugeId?: string
  gauges: GaugeData[]
  searchedLocation?: { lat: number; lng: number; name: string } | null
}) {
  const map = useMap()

  useEffect(() => {
    if (searchedLocation) {
      map.flyTo([searchedLocation.lat, searchedLocation.lng], 14, {
        duration: 0.5
      })
    } else if (selectedGaugeId) {
      const gauge = gauges.find(g => g.station.id === selectedGaugeId)
      if (gauge) {
        map.flyTo([gauge.station.lat, gauge.station.lng], 12, {
          duration: 0.5
        })
      }
    } else if (center) {
      map.flyTo(center, DEFAULT_ZOOM, {
        duration: 0.5
      })
    }
  }, [center, selectedGaugeId, gauges, map, searchedLocation])

  return null
}

// Map layer toggle component
function MapLayerToggle({
  currentLayer,
  onLayerChange
}: {
  currentLayer: MapLayerType
  onLayerChange: (layer: MapLayerType) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex">
        {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((layer) => (
          <button
            key={layer}
            onClick={() => onLayerChange(layer)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors',
              currentLayer === layer
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            )}
            aria-pressed={currentLayer === layer}
          >
            {MAP_LAYERS[layer].name}
          </button>
        ))}
      </div>
    </div>
  )
}

function FloodMapInner({ gauges, selectedGaugeId, onSelectGauge, center, searchedLocation, roadEvents = [], showRoadClosures = true }: FloodMapProps) {
  const mapCenter = center || CLERMONT_CENTER
  const [mapLayer, setMapLayer] = useState<MapLayerType>(() =>
    getLocalStorage<MapLayerType>('mapLayer', 'satellite')
  )

  const handleLayerChange = (layer: MapLayerType) => {
    setMapLayer(layer)
    setLocalStorage('mapLayer', layer)
  }

  const currentLayerConfig = MAP_LAYERS[mapLayer]
  const locationIcon = useMemo(() => createLocationIcon(), [])

  // Memoize road event icons
  const roadEventIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {}
    roadEvents.forEach(event => {
      const key = `${event.type}-${event.severity}`
      if (!icons[key]) {
        icons[key] = createRoadEventIcon(event.type, event.severity)
      }
    })
    return icons
  }, [roadEvents])

  // Memoize icons to prevent recreation on each render
  const icons = useMemo(() => {
    const statusTypes: FloodStatus[] = ['safe', 'watch', 'warning', 'danger', 'offline']
    const normalIcons: Record<FloodStatus, L.DivIcon> = {} as Record<FloodStatus, L.DivIcon>
    const selectedIcons: Record<FloodStatus, L.DivIcon> = {} as Record<FloodStatus, L.DivIcon>

    statusTypes.forEach(status => {
      normalIcons[status] = createStatusIcon(status)
      selectedIcons[status] = createSelectedIcon(status)
    })

    return { normal: normalIcons, selected: selectedIcons }
  }, [])

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full rounded-lg"
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          key={mapLayer}
          attribution={currentLayerConfig.attribution}
          url={currentLayerConfig.url}
        />

        {/* Add labels overlay for hybrid mode */}
        {mapLayer === 'hybrid' && currentLayerConfig.hasLabels && (
          <TileLayer
            key="hybrid-labels"
            url={currentLayerConfig.labelsUrl}
            attribution=""
            pane="overlayPane"
          />
        )}

        <MapController
          center={center}
          selectedGaugeId={selectedGaugeId}
          gauges={gauges}
          searchedLocation={searchedLocation}
        />

        {/* River overlays with status-based colors */}
        {(Object.entries(RIVER_PATHS) as [RiverSystem, [number, number][]][]).map(([riverSystem, path]) => {
          // Find the worst status for this river system
          const riverGauges = gauges.filter(g => g.station.riverSystem === riverSystem)
          const statusPriority: Record<FloodStatus, number> = { danger: 0, warning: 1, watch: 2, safe: 3, offline: 4 }

          const worstStatus = riverGauges.reduce<FloodStatus>((worst, gauge) => {
            const status = gauge.reading?.status || 'safe'
            return statusPriority[status] < statusPriority[worst] ? status : worst
          }, 'safe')

          const color = STATUS_COLORS[worstStatus]
          // Enhanced river visibility - thicker lines that are easier to see
          const weight = worstStatus === 'safe' ? 5 : worstStatus === 'watch' ? 6 : 7
          const opacity = worstStatus === 'safe' ? 0.7 : 0.9

          return (
            <Polyline
              key={riverSystem}
              positions={path}
              pathOptions={{
                color,
                weight,
                opacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {RIVER_SYSTEM_NAMES[riverSystem]}
                  </h3>
                  <div
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                      worstStatus === 'safe' && 'bg-green-100 text-green-800',
                      worstStatus === 'watch' && 'bg-yellow-100 text-yellow-800',
                      worstStatus === 'warning' && 'bg-orange-100 text-orange-800',
                      worstStatus === 'danger' && 'bg-red-100 text-red-800'
                    )}
                  >
                    {STATUS_LABELS[worstStatus].label}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    {riverGauges.length} gauge{riverGauges.length !== 1 ? 's' : ''} monitored
                  </p>
                  <a
                    href="https://water-monitoring.information.qld.gov.au/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View on WMIP
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </Popup>
            </Polyline>
          )
        })}

        {/* Searched location marker */}
        {searchedLocation && (
          <Marker
            position={[searchedLocation.lat, searchedLocation.lng]}
            icon={locationIcon}
          >
            <Popup>
              <div className="min-w-[180px] p-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {searchedLocation.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Searched location
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {gauges.map((gauge) => {
          const isOffline = gauge.station.isOffline === true
          const status: FloodStatus = isOffline ? 'offline' : (gauge.reading?.status || 'safe')
          const isSelected = gauge.station.id === selectedGaugeId
          const icon = isSelected ? icons.selected[status] : icons.normal[status]

          return (
            <Marker
              key={gauge.station.id}
              position={[gauge.station.lat, gauge.station.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectGauge(gauge.station.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-1">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {gauge.station.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {gauge.station.stream}
                  </p>

                  {isOffline ? (
                    <>
                      <div
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700"
                      >
                        OFFLINE
                      </div>
                      <p className="mt-2 text-xs text-gray-600">
                        This gauge is no longer reporting data.
                      </p>
                      {gauge.station.lastDataYear && (
                        <p className="mt-1 text-xs text-gray-500">
                          Last data: {gauge.station.lastDataYear}
                        </p>
                      )}
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        This monitoring station has been taken offline. Community members have raised concerns about the lack of flood monitoring in this area.
                      </div>
                    </>
                  ) : gauge.reading ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatLevel(gauge.reading.level, gauge.reading.unit)}
                        </span>
                        <span className="text-lg" title={gauge.reading.trend}>
                          {getTrendArrow(gauge.reading.trend)}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                          status === 'safe' && 'bg-green-100 text-green-800',
                          status === 'watch' && 'bg-yellow-100 text-yellow-800',
                          status === 'warning' && 'bg-orange-100 text-orange-800',
                          status === 'danger' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {STATUS_LABELS[status].label}
                      </div>

                      <p className="mt-2 text-xs text-gray-600">
                        {STATUS_LABELS[status].message}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No current reading available
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onSelectGauge(gauge.station.id)}
                      className={cn(
                        'flex-1 py-2 px-3 text-sm font-medium',
                        'bg-blue-500 hover:bg-blue-600 text-white',
                        'rounded-lg transition-colors duration-150'
                      )}
                    >
                      View Details
                    </button>
                    <a
                      href="https://water-monitoring.information.qld.gov.au/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'py-2 px-3 text-sm font-medium',
                        'bg-gray-100 hover:bg-gray-200 text-gray-700',
                        'rounded-lg transition-colors duration-150',
                        'flex items-center gap-1'
                      )}
                      title="View on WMIP"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Road closure/event markers */}
        {showRoadClosures && roadEvents.map((event) => {
          const iconKey = `${event.type}-${event.severity}`
          const icon = roadEventIcons[iconKey] || createRoadEventIcon(event.type, event.severity)

          const eventTypeLabels: Record<RoadEvent['type'], string> = {
            flooding: 'Flooding',
            road_closure: 'Road Closed',
            hazard: 'Hazard',
            roadworks: 'Roadworks',
            crash: 'Crash',
            congestion: 'Congestion',
            special_event: 'Special Event',
          }

          const severityColors: Record<RoadEvent['severity'], string> = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            extreme: 'bg-red-100 text-red-800',
          }

          return (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={icon}
            >
              <Popup>
                <div className="min-w-[220px] p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                      severityColors[event.severity]
                    )}>
                      {eventTypeLabels[event.type]}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {event.severity} severity
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {event.road}
                  </h3>

                  {event.suburb && (
                    <p className="text-xs text-gray-500 mb-2">
                      {event.suburb}
                    </p>
                  )}

                  <p className="text-xs text-gray-700 mb-3">
                    {event.description}
                  </p>

                  {event.direction && (
                    <p className="text-xs text-gray-600 mb-2">
                      Direction: {event.direction}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">
                      Source: QLDTraffic
                    </p>
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Verify on QLDTraffic
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

      </MapContainer>
    </div>
  )
}

export default FloodMapInner
