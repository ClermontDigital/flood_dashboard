'use client'

import { useEffect, useMemo, useState } from 'react'
import { Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { ActiveCentre, CouncilSensor, CouncilSensorStatus, FloodExtentLevel, FloodExtentSet, FuelSite, FuelSiteStatus } from '@/lib/types'
import { formatTimeSince } from '@/lib/utils'
import { FLOOD_EXTENT_TILE_OPTIONS } from '@/lib/flood-extents'

// Map layers sourced from council disaster dashboards and the statewide fuel layer.
// Rendered inside FloodMap's <MapContainer>.

const SENSOR_COLORS: Record<CouncilSensorStatus, string> = {
  normal: '#0ea5e9',    // sky-500
  over_road: '#ef4444', // water over the road/floodway
  minor: '#eab308',
  moderate: '#f97316',
  major: '#ef4444',
  nodata: '#9ca3af',
}

// Darker chip backgrounds so white text stays readable (markers keep the brighter colours)
const SENSOR_CHIP_COLORS: Record<CouncilSensorStatus, string> = {
  normal: '#0369a1',
  over_road: '#b91c1c',
  minor: '#a16207',
  moderate: '#c2410c',
  major: '#b91c1c',
  nodata: '#4b5563',
}

const SENSOR_LABELS: Record<CouncilSensorStatus, string> = {
  normal: 'Normal',
  over_road: 'Water over road',
  minor: 'Minor flood',
  moderate: 'Moderate flood',
  major: 'Major flood',
  nodata: 'No recent reading',
}

const FUEL_COLORS: Record<FuelSiteStatus, string> = {
  available: '#15803d',
  partial: '#d97706',
  unavailable: '#b91c1c',
  unknown: '#9ca3af',
}

const FUEL_CHIP_COLORS: Record<FuelSiteStatus, string> = {
  available: '#15803d',
  partial: '#b45309',
  unavailable: '#b91c1c',
  unknown: '#4b5563',
}

const FUEL_LABELS: Record<FuelSiteStatus, string> = {
  available: 'Fuel available',
  partial: 'Some fuel unavailable',
  unavailable: 'No fuel available',
  unknown: 'Availability unknown',
}

function createSensorIcon(status: CouncilSensorStatus): L.DivIcon {
  const color = SENSOR_COLORS[status]
  return L.divIcon({
    className: 'sensor-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width: 14px; height: 14px;">
          <path d="M2 9c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>
          <path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

function createCentreIcon(isOpen: boolean): L.DivIcon {
  const color = isOpen ? '#16a34a' : '#6b7280'
  return L.divIcon({
    className: 'centre-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" fill="white" style="width: 16px; height: 16px;">
          <path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

function createFuelIcon(status: FuelSiteStatus): L.DivIcon {
  const color = FUEL_COLORS[status]
  return L.divIcon({
    className: 'fuel-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" fill="white" style="width: 13px; height: 13px;">
          <path d="M4 3h10v18H4V3zm2 2v5h6V5H6zm10 2l3 3v8a2 2 0 01-4 0v-4h-1V9h1a1 1 0 011 1v8h1v-7.2L15 8l1-1z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

function formatReadingTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Brisbane',
  })
}

// Small inline chart of the last 24 hours, with the road level marked when it's in range
function Sparkline({ history, roadLevel }: { history: CouncilSensor['history']; roadLevel: number | null }) {
  if (history.length < 2) return null
  const W = 220
  const H = 48
  const levels = history.map((p) => p.level)
  let min = Math.min(...levels)
  let max = Math.max(...levels)
  if (roadLevel !== null && roadLevel <= max + (max - min) * 0.5 + 0.2) {
    min = Math.min(min, roadLevel)
    max = Math.max(max, roadLevel)
  }
  const span = max - min || 0.1
  const t0 = new Date(history[0].timestamp).getTime()
  const t1 = new Date(history[history.length - 1].timestamp).getTime()
  const x = (t: string) => ((new Date(t).getTime() - t0) / (t1 - t0 || 1)) * W
  const y = (v: number) => H - 4 - ((v - min) / span) * (H - 8)
  const points = history.map((p) => `${x(p.timestamp).toFixed(1)},${y(p.level).toFixed(1)}`).join(' ')
  const showRoad = roadLevel !== null && roadLevel >= min && roadLevel <= max

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Water level over the last 24 hours">
      <rect x="0" y="0" width={W} height={H} fill="#f9fafb" rx="4" />
      {showRoad && (
        <line x1="0" x2={W} y1={y(roadLevel!)} y2={y(roadLevel!)} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" />
      )}
      <polyline points={points} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

function SourceFooter({ label, href, caveat = true }: { label: string; href: string; caveat?: boolean }) {
  return (
    <div className="pt-2 mt-2 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-1">Source: {label}</p>
      {caveat && <p className="text-xs text-gray-400 mb-1">Council information may be out of date.</p>}
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
        View on council dashboard
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

export function CouncilSensorMarkers({ sensors }: { sensors: CouncilSensor[] }) {
  const icons = useMemo(() => {
    const statuses = Object.keys(SENSOR_COLORS) as CouncilSensorStatus[]
    return Object.fromEntries(statuses.map((s) => [s, createSensorIcon(s)])) as Record<CouncilSensorStatus, L.DivIcon>
  }, [])

  return (
    <>
      {sensors.map((sensor) => (
        <Marker
          key={sensor.id}
          position={[sensor.lat, sensor.lng]}
          icon={icons[sensor.status]}
          title={`Water sensor: ${sensor.name}, ${SENSOR_LABELS[sensor.status]}`}
          zIndexOffset={sensor.status === 'normal' || sensor.status === 'nodata' ? 0 : 400}
        >
          <Popup>
            <div className="min-w-[230px] p-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{sensor.name}</h3>
              <p className="text-xs text-gray-500 mb-2">Council water level sensor</p>

              {sensor.level !== null && (
                <div className="text-lg font-bold text-gray-900">{sensor.level.toFixed(2)} m</div>
              )}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white mt-1"
                style={{ backgroundColor: SENSOR_CHIP_COLORS[sensor.status] }}
              >
                {SENSOR_LABELS[sensor.status]}
              </span>

              {sensor.roadLevel !== null && sensor.level !== null && (
                <p className="mt-2 text-xs text-gray-700">
                  {sensor.level >= sensor.roadLevel
                    ? `${(sensor.level - sensor.roadLevel).toFixed(2)} m over the road level (${sensor.roadLevel.toFixed(2)} m)`
                    : `${(sensor.roadLevel - sensor.level).toFixed(2)} m below the road level (${sensor.roadLevel.toFixed(2)} m)`}
                </p>
              )}
              {sensor.thresholds && (
                <p className="mt-1 text-xs text-gray-500">
                  Flood levels: minor {sensor.thresholds.minor} m, moderate {sensor.thresholds.moderate} m, major {sensor.thresholds.major} m
                </p>
              )}

              <Sparkline history={sensor.history} roadLevel={sensor.roadLevel} />

              {sensor.timestamp && (
                <p className="mt-1 text-xs text-gray-400">
                  {formatReadingTime(sensor.timestamp)} AEST ({formatTimeSince(sensor.timestamp)})
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">Council sensor trial, readings are not verified.</p>
              <SourceFooter label={`${sensor.council} disaster dashboard`} href={sensor.sourceUrl} />
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export function ActiveCentreMarkers({ centres }: { centres: ActiveCentre[] }) {
  const icons = useMemo(() => ({ open: createCentreIcon(true), closed: createCentreIcon(false) }), [])

  return (
    <>
      {centres.map((centre) => (
        <Marker
          key={centre.id}
          position={[centre.lat, centre.lng]}
          icon={centre.isOpen ? icons.open : icons.closed}
          title={`${centre.type}: ${centre.name}, ${centre.status}`}
          zIndexOffset={centre.isOpen ? 450 : 0}
        >
          <Popup>
            <div className="min-w-[220px] p-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${centre.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
              >
                {centre.type}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm mt-2">{centre.name}</h3>
              <p className="text-xs font-medium text-gray-700 mt-0.5">Status: {centre.status}</p>
              {centre.address && <p className="text-xs text-gray-500 mt-1">{centre.address}</p>}
              {centre.organisation && <p className="text-xs text-gray-500 mt-1">Run by {centre.organisation}</p>}
              {centre.note && <p className="text-xs text-gray-700 mt-2">{centre.note}</p>}
              {centre.lastUpdated && <p className="text-xs text-gray-400 mt-2">Updated {formatTimeSince(centre.lastUpdated)}</p>}
              <SourceFooter label={`${centre.council} disaster dashboard`} href={centre.sourceUrl} />
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// ~1,800 sites statewide: always show sites with a problem, show the rest only when zoomed in
const FUEL_ALL_SITES_MIN_ZOOM = 10

export function FuelLayer({ sites }: { sites: FuelSite[] }) {
  const map = useMap()
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), bounds: map.getBounds() }))
  useMapEvents({
    moveend: () => setView({ zoom: map.getZoom(), bounds: map.getBounds() }),
  })

  const icons = useMemo(() => {
    const statuses = Object.keys(FUEL_COLORS) as FuelSiteStatus[]
    return Object.fromEntries(statuses.map((s) => [s, createFuelIcon(s)])) as Record<FuelSiteStatus, L.DivIcon>
  }, [])

  const visible = useMemo(() => {
    const showAll = view.zoom >= FUEL_ALL_SITES_MIN_ZOOM
    return sites.filter((s) => {
      if (!view.bounds.contains([s.lat, s.lng])) return false
      return showAll || s.status === 'partial' || s.status === 'unavailable'
    })
  }, [sites, view])

  return (
    <>
      {visible.map((site) => (
        <Marker key={site.id} position={[site.lat, site.lng]} icon={icons[site.status]} title={`${site.name}: ${FUEL_LABELS[site.status]}`}>
          <Popup>
            <div className="min-w-[210px] p-1">
              <h3 className="font-semibold text-gray-900 text-sm">{site.name}</h3>
              {site.address && <p className="text-xs text-gray-500 mb-2">{site.address}</p>}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: FUEL_CHIP_COLORS[site.status] }}>
                {FUEL_LABELS[site.status]}
              </span>
              {site.fuels.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {site.fuels.map((f) => (
                    <li key={f.type} className="flex justify-between gap-3">
                      <span className={f.available === false ? 'text-red-700 line-through' : 'text-gray-700'}>{f.type}</span>
                      <span className="text-gray-500">
                        {f.available === false ? 'Out' : f.price !== null ? `${(f.price * 100).toFixed(1)}c/L` : f.available ? 'Available' : '–'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {site.lastUpdated && <p className="mt-2 text-xs text-gray-400">Updated {formatTimeSince(site.lastUpdated)}</p>}
              <p className="mt-1 text-xs text-gray-400">Source: Queensland Government (Fuel Prices API), CC BY 4.0. Trial data.</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Council planning map of the area expected to flood at the chosen gauge height
export function FloodExtentLayer({ set, level }: { set: FloodExtentSet; level: FloodExtentLevel }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(set.center, set.zoom, { duration: 1 })
  }, [map, set])

  // Cached zoom range and extent per council service; outside these the tile server 404s
  const options = FLOOD_EXTENT_TILE_OPTIONS[set.id]
  return (
    <TileLayer
      key={level.tileUrl}
      url={level.tileUrl}
      opacity={0.6}
      zIndex={150}
      minNativeZoom={options?.minNativeZoom}
      maxNativeZoom={options?.maxNativeZoom}
      maxZoom={19}
      bounds={options?.bounds}
      attribution={options?.attribution ?? `Flood extents: ${set.council}`}
    />
  )
}
