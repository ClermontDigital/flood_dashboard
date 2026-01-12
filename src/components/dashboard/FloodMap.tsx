'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GaugeData, FloodStatus } from '@/lib/types'
import { CLERMONT_CENTER, STATUS_COLORS, STATUS_LABELS, DEFAULT_ZOOM } from '@/lib/constants'
import { cn, formatLevel, getTrendArrow } from '@/lib/utils'

// Fix Leaflet default icon issue with Next.js
import 'leaflet/dist/leaflet.css'

interface FloodMapProps {
  gauges: GaugeData[]
  selectedGaugeId?: string
  onSelectGauge: (id: string) => void
  center?: [number, number]
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

// Component to handle map view changes
function MapController({ center, selectedGaugeId, gauges }: {
  center?: [number, number]
  selectedGaugeId?: string
  gauges: GaugeData[]
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedGaugeId) {
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
  }, [center, selectedGaugeId, gauges, map])

  return null
}

function FloodMapInner({ gauges, selectedGaugeId, onSelectGauge, center }: FloodMapProps) {
  const mapCenter = center || CLERMONT_CENTER

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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController
        center={center}
        selectedGaugeId={selectedGaugeId}
        gauges={gauges}
      />

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

                <button
                  onClick={() => onSelectGauge(gauge.station.id)}
                  className={cn(
                    'mt-3 w-full py-2 px-3 text-sm font-medium',
                    'bg-blue-500 hover:bg-blue-600 text-white',
                    'rounded-lg transition-colors duration-150'
                  )}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default FloodMapInner
