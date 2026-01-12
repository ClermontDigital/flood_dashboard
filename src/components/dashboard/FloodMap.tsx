'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { GaugeData, FloodStatus, RiverSystem, CameraStation } from '@/lib/types'
import { CLERMONT_CENTER, STATUS_COLORS, STATUS_LABELS, DEFAULT_ZOOM, MAP_LAYERS, MapLayerType, RIVER_PATHS, RIVER_SYSTEM_NAMES, CAMERA_STATIONS, WMIP_BASE_URL } from '@/lib/constants'
import { cn, formatLevel, getTrendArrow, getLocalStorage, setLocalStorage } from '@/lib/utils'

// Fix Leaflet default icon issue with Next.js
import 'leaflet/dist/leaflet.css'

interface FloodMapProps {
  gauges: GaugeData[]
  selectedGaugeId?: string
  onSelectGauge: (id: string) => void
  center?: [number, number]
  searchedLocation?: { lat: number; lng: number; name: string } | null
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

// Create camera icon marker
function createCameraIcon(): L.DivIcon {
  return L.divIcon({
    className: 'camera-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: #6366f1;
        border: 2px solid white;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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

function FloodMapInner({ gauges, selectedGaugeId, onSelectGauge, center, searchedLocation }: FloodMapProps) {
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
  const cameraIcon = useMemo(() => createCameraIcon(), [])
  const [showCameras, setShowCameras] = useState(true)

  // Memoize icons to prevent recreation on each render
  const icons = useMemo(() => {
    const statusTypes: FloodStatus[] = ['safe', 'watch', 'warning', 'danger']
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
      {/* Map controls */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
        {/* Camera toggle */}
        <button
          onClick={() => setShowCameras(!showCameras)}
          className={cn(
            'px-3 py-2 text-xs font-medium rounded-lg shadow-md transition-colors flex items-center gap-2',
            showCameras
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          )}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          Cameras
        </button>
      </div>

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
          let worstStatus: FloodStatus = 'safe'
          const statusPriority: Record<FloodStatus, number> = { danger: 0, warning: 1, watch: 2, safe: 3 }

          riverGauges.forEach(gauge => {
            const status = gauge.reading?.status || 'safe'
            if (statusPriority[status] < statusPriority[worstStatus]) {
              worstStatus = status
            }
          })

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
          const status = gauge.reading?.status || 'safe'
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

                  {gauge.reading ? (
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
                      href={`https://water-monitoring.information.qld.gov.au/?ppbm=${gauge.station.id}`}
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

        {/* Camera markers */}
        {showCameras && CAMERA_STATIONS.map((camera) => (
          <Marker
            key={camera.id}
            position={[camera.lat, camera.lng]}
            icon={cameraIcon}
          >
            <Popup>
              <div className="min-w-[250px] p-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="#6366f1" className="w-5 h-5">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {camera.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {camera.description}
                    </p>
                  </div>
                </div>

                {/* Camera location indicator */}
                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Camera location marked</span>
                  </div>
                  {camera.riverSystem && (
                    <p className="text-xs text-indigo-600 mt-1 ml-6">
                      {RIVER_SYSTEM_NAMES[camera.riverSystem]}
                    </p>
                  )}
                </div>

                {/* Link to QLD Traffic */}
                <a
                  href="https://qldtraffic.qld.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 px-3 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-center mb-2"
                >
                  View Cameras on QLD Traffic
                </a>

                {/* Source attribution */}
                <p className="text-xs text-gray-400 text-center">
                  Source: {camera.source === 'tmr' ? 'QLD Transport & Main Roads' : camera.source === 'council' ? 'Local Council' : 'Bureau of Meteorology'}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default FloodMapInner
