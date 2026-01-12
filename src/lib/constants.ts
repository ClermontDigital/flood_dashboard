import type { GaugeStation, RiverSystem } from './types'

// Clermont coordinates
export const CLERMONT_CENTER: [number, number] = [-22.8245, 147.6392]
export const DEFAULT_ZOOM = 9
export const BASIN_ZOOM = 7

// Data refresh intervals (ms)
export const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
export const STALE_DATA_THRESHOLD = 2 * 60 * 60 * 1000 // 2 hours

// API endpoints
export const WMIP_BASE_URL = 'https://water-monitoring.information.qld.gov.au/cgi/webservice.exe'
export const BOM_WATERDATA_URL = 'http://www.bom.gov.au/waterdata/services'
export const BOM_WARNINGS_URL = 'http://www.bom.gov.au/fwo/IDQ60000.warnings_qld.xml'

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  safe: '#22c55e',
  watch: '#eab308',
  warning: '#f97316',
  danger: '#ef4444',
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
  // Clermont Area (3 gauges)
  {
    id: '130212A',
    name: 'Theresa Creek @ Gregory Hwy',
    stream: 'Theresa Creek',
    riverSystem: 'clermont',
    lat: -22.7833,
    lng: 147.5667,
    role: 'Upstream early warning',
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
  },

  // Isaac River System (3 gauges)
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
  },

  // Nogoa River System (3 gauges)
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
  },

  // Mackenzie River System (3 gauges)
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

  // Comet River System (2 gauges)
  {
    id: '130504A',
    name: 'Comet River @ Comet Weir',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -23.6000,
    lng: 148.5500,
    role: 'Near Comet',
  },
  {
    id: '130502A',
    name: 'Comet River @ The Lake',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -23.8000,
    lng: 148.3000,
    role: 'Upper Comet',
  },

  // Fitzroy River (3 gauges)
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
    role: 'Above Rockhampton',
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

// Emergency resources
export const EMERGENCY_RESOURCES = [
  { name: 'BOM Flood Warnings', url: 'https://www.bom.gov.au/qld/flood/', description: 'Official warnings' },
  { name: 'QFES', url: 'https://www.qfes.qld.gov.au/', description: 'Emergency services' },
  { name: 'Isaac Regional Council', url: 'https://www.isaac.qld.gov.au/disaster', description: 'Local emergency info' },
  { name: 'SES', url: 'https://www.ses.qld.gov.au/', description: 'Request assistance' },
]
