import type { GaugeStation, RiverSystem, CameraStation, DamStation } from './types'
import { env } from './env'

// Clermont coordinates
export const CLERMONT_CENTER: [number, number] = [-22.8245, 147.6392]
export const DEFAULT_ZOOM = 9
export const BASIN_ZOOM = 7

// Data refresh intervals (ms) - from environment
export const REFRESH_INTERVAL = env.refreshInterval
export const STALE_DATA_THRESHOLD = env.staleThreshold

// API endpoints - from environment
export const WMIP_BASE_URL = env.wmipBaseUrl
export const BOM_WATERDATA_URL = env.bomWaterdataUrl
export const BOM_WARNINGS_URL = env.bomWarningsUrl

// BOM Water Data parameters for SOS2 API
export const BOM_PARAMS = {
  WATER_COURSE_LEVEL: 'Water Course Level',
  WATER_COURSE_DISCHARGE: 'Water Course Discharge',
  STORAGE_LEVEL: 'Storage Level',
  STORAGE_VOLUME: 'Storage Volume',
  RAINFALL: 'Rainfall',
} as const

// Dam stations in the Fitzroy Basin
export const DAM_STATIONS: DamStation[] = [
  {
    id: '130216A',
    name: 'Fairbairn Dam',
    river: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.4600,
    lng: 148.0800,
    capacity: 1301000, // 1,301,000 ML total capacity
  },
]

// Application name
export const APP_NAME = 'GAUGE'
export const APP_TAGLINE = 'Real-time water levels for the Fitzroy Basin'

// Map tile layers
export const MAP_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Street',
    hasLabels: false,
    labelsUrl: '',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite',
    hasLabels: false,
    labelsUrl: '',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri | Labels &copy; CartoDB',
    name: 'Hybrid',
    hasLabels: true,
    labelsUrl: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
  },
} as const

export type MapLayerType = keyof typeof MAP_LAYERS

// Data source links for attribution
export const DATA_SOURCES = [
  {
    name: 'Queensland WMIP',
    url: 'https://water-monitoring.information.qld.gov.au/',
    description: 'Water Monitoring Information Portal',
  },
  {
    name: 'Bureau of Meteorology',
    url: 'https://www.bom.gov.au/waterdata/',
    description: 'Water Data Online',
  },
  {
    name: 'BOM Flood Warnings',
    url: 'https://www.bom.gov.au/qld/flood/',
    description: 'Queensland Flood Warnings',
  },
  {
    name: 'QLD Traffic',
    url: 'https://qldtraffic.qld.gov.au/',
    description: 'Traffic & Flood Cameras',
  },
]

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  safe: '#22c55e',
  watch: '#eab308',
  warning: '#f97316',
  danger: '#ef4444',
  offline: '#6b7280', // gray-500
}

// Status labels for non-tech users
export const STATUS_LABELS = {
  safe: {
    label: 'SAFE',
    message: 'Water level is normal',
    action: 'None required',
  },
  watch: {
    label: 'WATCH',
    message: 'Water level is elevated. Monitor situation.',
    action: 'Check back regularly',
  },
  warning: {
    label: 'WARNING',
    message: 'Flooding possible. Prepare to act.',
    action: 'Review evacuation routes, secure property',
  },
  danger: {
    label: 'DANGER',
    message: 'Flooding occurring. Take action now.',
    action: 'Follow emergency services advice, evacuate if directed',
  },
  offline: {
    label: 'OFFLINE',
    message: 'This gauge is no longer reporting data.',
    action: 'Contact Queensland Government for information',
  },
}

// River system display names
export const RIVER_SYSTEM_NAMES: Record<RiverSystem, string> = {
  clermont: 'Clermont Area',
  isaac: 'Isaac River',
  nogoa: 'Nogoa River',
  mackenzie: 'Mackenzie River',
  comet: 'Comet River',
  fitzroy: 'Fitzroy River',
}

// All gauge stations
export const GAUGE_STATIONS: GaugeStation[] = [
  // Clermont Area (1 active + 2 offline)
  {
    id: '130212A',
    name: 'Theresa Creek @ Gregory Hwy',
    stream: 'Theresa Creek',
    riverSystem: 'clermont',
    lat: -22.7833,
    lng: 147.5667,
    role: 'Upstream early warning',
    isOffline: true,
    lastDataYear: 2024,
  },
  {
    id: '130207A',
    name: 'Sandy Creek @ Clermont',
    stream: 'Sandy Creek',
    riverSystem: 'clermont',
    lat: -22.8245,
    lng: 147.6392,
    role: 'Primary monitoring',
  },
  {
    id: '120311A',
    name: 'Clermont Alpha Rd',
    stream: 'Eastern Creek',
    riverSystem: 'clermont',
    lat: -22.9000,
    lng: 147.7000,
    role: 'Secondary monitoring',
    isOffline: true,
    lastDataYear: 2024,
  },

  // Isaac River System (2 active + 1 offline)
  {
    id: '130401A',
    name: 'Isaac River @ Yatton',
    stream: 'Isaac River',
    riverSystem: 'isaac',
    lat: -22.4167,
    lng: 148.3333,
    role: 'Upper Isaac',
  },
  {
    id: '130410A',
    name: 'Isaac River @ Deverill',
    stream: 'Isaac River',
    riverSystem: 'isaac',
    lat: -22.1833,
    lng: 148.6167,
    role: 'Mid Isaac',
  },
  {
    id: '130408A',
    name: 'Connors River @ Pink Lagoon',
    stream: 'Connors River',
    riverSystem: 'isaac',
    lat: -21.9500,
    lng: 148.7833,
    role: 'Tributary input',
    isOffline: true,
    lastDataYear: 2024,
  },

  // Nogoa River System (2 active + 1 offline)
  {
    id: '130209A',
    name: 'Nogoa River @ Craigmore',
    stream: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.5167,
    lng: 147.9333,
    role: 'Above Emerald',
  },
  {
    id: '130219A',
    name: 'Nogoa River @ Duck Ponds',
    stream: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.4500,
    lng: 148.1000,
    role: 'Below Fairbairn Dam',
  },
  {
    id: '130204A',
    name: 'Retreat Creek @ Dunrobin',
    stream: 'Retreat Creek',
    riverSystem: 'nogoa',
    lat: -23.6000,
    lng: 147.8000,
    role: 'Tributary',
    isOffline: true,
    lastDataYear: 2024,
  },

  // Mackenzie River System (3 active)
  {
    id: '130106A',
    name: 'Mackenzie River @ Bingegang',
    stream: 'Mackenzie River',
    riverSystem: 'mackenzie',
    lat: -23.1833,
    lng: 149.3500,
    role: 'Lower Mackenzie',
  },
  {
    id: '130105B',
    name: 'Mackenzie River @ Coolmaringa',
    stream: 'Mackenzie River',
    riverSystem: 'mackenzie',
    lat: -23.3333,
    lng: 148.8333,
    role: 'Mid Mackenzie',
  },
  {
    id: '130113A',
    name: 'Mackenzie River @ Rileys Crossing',
    stream: 'Mackenzie River',
    riverSystem: 'mackenzie',
    lat: -23.4500,
    lng: 148.5000,
    role: 'Upper Mackenzie',
  },

  // Comet River System (2 offline - no active gauges)
  {
    id: '130504A',
    name: 'Comet River @ Comet Weir',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -23.6000,
    lng: 148.5500,
    role: 'Lower Comet',
    isOffline: true,
    lastDataYear: 2024,
  },
  {
    id: '130502A',
    name: 'Comet River @ The Lake',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -23.8000,
    lng: 148.3000,
    role: 'Upper Comet',
    isOffline: true,
    lastDataYear: 2024,
  },

  // Fitzroy River (2 active + 1 offline)
  {
    id: '130004A',
    name: 'Fitzroy River @ The Gap',
    stream: 'Fitzroy River',
    riverSystem: 'fitzroy',
    lat: -23.3833,
    lng: 149.9167,
    role: 'Upper Fitzroy',
  },
  {
    id: '130003A',
    name: 'Fitzroy River @ Yaamba',
    stream: 'Fitzroy River',
    riverSystem: 'fitzroy',
    lat: -23.1333,
    lng: 150.3667,
    role: 'Mid Fitzroy',
    isOffline: true,
    lastDataYear: 2024,
  },
  {
    id: '130005A',
    name: 'Fitzroy River @ Rockhampton',
    stream: 'Fitzroy River',
    riverSystem: 'fitzroy',
    lat: -23.3833,
    lng: 150.5000,
    role: 'Final downstream',
  },
]

// Quick link locations
export const QUICK_LINKS = [
  { name: 'Clermont', lat: -22.8245, lng: 147.6392 },
  { name: 'Emerald', lat: -23.5275, lng: 148.1592 },
  { name: 'Rockhampton', lat: -23.3791, lng: 150.5100 },
  { name: 'Moranbah', lat: -22.0016, lng: 148.0461 },
]

// Extended river paths for map overlay (with additional waypoints for better visibility)
export const RIVER_PATHS: Record<RiverSystem, [number, number][]> = {
  clermont: [
    // Sandy Creek area
    [-22.65, 147.45],
    [-22.72, 147.52],
    [-22.80, 147.60],
    [-22.8245, 147.6392], // Sandy Creek @ Clermont
    [-22.86, 147.68],
    [-22.95, 147.75],
    [-23.00, 147.82],
  ],
  isaac: [
    // Isaac River
    [-22.55, 148.15],
    [-22.48, 148.25],
    [-22.4167, 148.3333], // Isaac River @ Yatton
    [-22.30, 148.45],
    [-22.1833, 148.6167], // Isaac River @ Deverill
    [-22.05, 148.70],
    [-21.85, 148.85],
    [-21.75, 148.95],
  ],
  nogoa: [
    // Nogoa River (towards Emerald)
    [-23.75, 147.65],
    [-23.68, 147.72],
    [-23.56, 147.87],
    [-23.5167, 147.9333], // Nogoa River @ Craigmore
    [-23.48, 148.02],
    [-23.4500, 148.1000], // Nogoa River @ Duck Ponds
    [-23.42, 148.18],
    [-23.40, 148.28],
  ],
  mackenzie: [
    // Mackenzie River (Nogoa to Fitzroy)
    [-23.50, 148.35],
    [-23.4500, 148.5000], // Mackenzie River @ Rileys Crossing
    [-23.40, 148.65],
    [-23.3333, 148.8333], // Mackenzie River @ Coolmaringa
    [-23.25, 149.10],
    [-23.1833, 149.3500], // Mackenzie River @ Bingegang
    [-23.20, 149.55],
    [-23.25, 149.75],
  ],
  comet: [
    // Comet River (no active gauges)
    [-23.92, 148.15],
    [-23.8000, 148.3000],
    [-23.70, 148.42],
    [-23.6000, 148.5500],
    [-23.50, 148.62],
    [-23.42, 148.70],
  ],
  fitzroy: [
    // Fitzroy River (to coast)
    [-23.30, 149.70],
    [-23.3833, 149.9167], // Fitzroy River @ The Gap
    [-23.28, 150.12],
    [-23.25, 150.42],
    [-23.3833, 150.5000], // Fitzroy River @ Rockhampton
    [-23.42, 150.58],
    [-23.50, 150.68],
  ],
}

// Camera stations for flood/traffic monitoring
export const CAMERA_STATIONS: CameraStation[] = [
  // Clermont Area Cameras
  {
    id: 'cam-clermont-crossing',
    name: 'Clermont Flood Crossing',
    description: 'Sandy Creek crossing near town center',
    lat: -22.8220,
    lng: 147.6350,
    riverSystem: 'clermont',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/clermont_crossing.jpg',
    videoUrl: 'https://qldtraffic.qld.gov.au/video/clermont_crossing.m3u8',
    source: 'tmr',
  },
  {
    id: 'cam-theresa-bridge',
    name: 'Theresa Creek Bridge',
    description: 'Gregory Highway bridge over Theresa Creek',
    lat: -22.7850,
    lng: 147.5700,
    riverSystem: 'clermont',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/theresa_bridge.jpg',
    source: 'tmr',
  },
  // Emerald/Nogoa Cameras
  {
    id: 'cam-emerald-weir',
    name: 'Emerald Weir',
    description: 'Nogoa River at Emerald Weir',
    lat: -23.5200,
    lng: 148.1550,
    riverSystem: 'nogoa',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/emerald_weir.jpg',
    videoUrl: 'https://qldtraffic.qld.gov.au/video/emerald_weir.m3u8',
    source: 'council',
  },
  {
    id: 'cam-fairbairn-dam',
    name: 'Fairbairn Dam Spillway',
    description: 'Fairbairn Dam spillway and downstream',
    lat: -23.4600,
    lng: 148.0800,
    riverSystem: 'nogoa',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/fairbairn_dam.jpg',
    videoUrl: 'https://qldtraffic.qld.gov.au/video/fairbairn_dam.m3u8',
    source: 'council',
  },
  // Mackenzie Cameras
  {
    id: 'cam-bingegang-crossing',
    name: 'Bingegang Crossing',
    description: 'Mackenzie River at Bingegang',
    lat: -23.1800,
    lng: 149.3450,
    riverSystem: 'mackenzie',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/bingegang.jpg',
    source: 'tmr',
  },
  // Fitzroy/Rockhampton Cameras
  {
    id: 'cam-fitzroy-barrage',
    name: 'Fitzroy River Barrage',
    description: 'Fitzroy Barrage at Rockhampton',
    lat: -23.3900,
    lng: 150.5050,
    riverSystem: 'fitzroy',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/fitzroy_barrage.jpg',
    videoUrl: 'https://qldtraffic.qld.gov.au/video/fitzroy_barrage.m3u8',
    source: 'council',
  },
  {
    id: 'cam-yaamba-bridge',
    name: 'Yaamba Road Bridge',
    description: 'Bruce Highway crossing at Yaamba',
    lat: -23.1350,
    lng: 150.3700,
    riverSystem: 'fitzroy',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/yaamba_bridge.jpg',
    source: 'tmr',
  },
  {
    id: 'cam-rockhampton-quay',
    name: 'Rockhampton Quay Street',
    description: 'Quay Street riverside view',
    lat: -23.3780,
    lng: 150.5100,
    riverSystem: 'fitzroy',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/rocky_quay.jpg',
    videoUrl: 'https://qldtraffic.qld.gov.au/video/rocky_quay.m3u8',
    source: 'council',
  },
  // Isaac River Cameras
  {
    id: 'cam-moranbah-crossing',
    name: 'Moranbah Flood Crossing',
    description: 'Isaac River at Moranbah',
    lat: -22.0050,
    lng: 148.0500,
    riverSystem: 'isaac',
    imageUrl: 'https://qldtraffic.qld.gov.au/images/cameras/moranbah.jpg',
    source: 'tmr',
  },
]

// Water overlay layer for enhanced river visibility
export const WATER_OVERLAY = {
  url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  attribution: 'Map data: &copy; OpenSeaMap contributors',
}

// Emergency resources
export const EMERGENCY_RESOURCES = [
  { name: 'BOM Flood Warnings', url: 'https://www.bom.gov.au/qld/flood/', description: 'Official warnings' },
  { name: 'QFES', url: 'https://www.qfes.qld.gov.au/', description: 'Emergency services' },
  { name: 'Isaac Regional Council', url: 'https://www.isaac.qld.gov.au/disaster', description: 'Local emergency info' },
  { name: 'SES', url: 'https://www.ses.qld.gov.au/', description: 'Request assistance' },
]
