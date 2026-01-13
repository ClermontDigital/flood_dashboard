import type { GaugeStation, RiverSystem, CameraStation, DamStation } from './types'
import { env } from './env'

// Queensland state center (for statewide view)
export const QLD_CENTER: [number, number] = [-22.5, 148.5]
export const CLERMONT_CENTER: [number, number] = [-22.8245, 147.6392]
export const DEFAULT_ZOOM = 6 // State-wide view
export const BASIN_ZOOM = 8
export const DETAIL_ZOOM = 10

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

// Dam stations across Queensland
export const DAM_STATIONS: DamStation[] = [
  // ============================================
  // CENTRAL QUEENSLAND - FITZROY BASIN
  // ============================================
  {
    id: '130216A',
    name: 'Fairbairn Dam',
    river: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.4600,
    lng: 148.0800,
    capacity: 1301000, // 1,301,000 ML total capacity
  },
  {
    id: 'theresa-dam',
    name: 'Theresa Creek Dam',
    river: 'Theresa Creek',
    riverSystem: 'theresa',
    lat: -22.9500,
    lng: 147.5000,
    capacity: 10000, // 10,000 ML total capacity
    isOffline: true,
    offlineReason: 'Isaac Regional Council does not provide public monitoring data for this dam',
  },

  // ============================================
  // SOUTHEAST QUEENSLAND
  // ============================================
  {
    id: '143006B',
    name: 'Wivenhoe Dam',
    river: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.3900,
    lng: 152.6100,
    capacity: 2606000, // 2,606,000 ML total capacity (includes flood storage)
  },
  {
    id: '143001A',
    name: 'Somerset Dam',
    river: 'Stanley River',
    riverSystem: 'brisbane',
    lat: -27.1200,
    lng: 152.5500,
    capacity: 380000, // 380,000 ML
  },
  {
    id: '145001A',
    name: 'Hinze Dam',
    river: 'Nerang River',
    riverSystem: 'nerang',
    lat: -28.0500,
    lng: 153.2800,
    capacity: 310730, // 310,730 ML
  },

  // ============================================
  // NORTH QUEENSLAND
  // ============================================
  {
    id: '120004A',
    name: 'Burdekin Falls Dam',
    river: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -20.6300,
    lng: 147.0200,
    capacity: 1860000, // 1,860,000 ML - largest dam by capacity in QLD
  },
  {
    id: '119001A',
    name: 'Ross River Dam',
    river: 'Ross River',
    riverSystem: 'ross',
    lat: -19.4200,
    lng: 146.7300,
    capacity: 239000, // 239,000 ML
  },

  // ============================================
  // MACKAY-WHITSUNDAY
  // ============================================
  {
    id: '124003A',
    name: 'Peter Faust Dam',
    river: 'Proserpine River',
    riverSystem: 'proserpine',
    lat: -20.5100,
    lng: 148.5000,
    capacity: 491000, // 491,000 ML
  },
  {
    id: '125003A',
    name: 'Kinchant Dam',
    river: 'Sandy Creek',
    riverSystem: 'pioneer',
    lat: -21.2200,
    lng: 148.8700,
    capacity: 62800, // 62,800 ML
  },

  // ============================================
  // FAR NORTH QUEENSLAND
  // ============================================
  {
    id: '110002A',
    name: 'Tinaroo Falls Dam',
    river: 'Barron River',
    riverSystem: 'barron',
    lat: -17.1800,
    lng: 145.5500,
    capacity: 407000, // 407,000 ML
  },
  {
    id: '111001A',
    name: 'Copperlode Dam',
    river: 'Freshwater Creek',
    riverSystem: 'barron',
    lat: -16.9700,
    lng: 145.6900,
    capacity: 47800, // 47,800 ML (Cairns water supply)
  },

  // ============================================
  // BURNETT BASIN
  // ============================================
  {
    id: '136001C',
    name: 'Paradise Dam',
    river: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.0500,
    lng: 151.8000,
    capacity: 300000, // 300,000 ML (reduced from original due to safety works)
  },
  {
    id: '136010A',
    name: 'Boondooma Dam',
    river: 'Boyne River',
    riverSystem: 'burnett',
    lat: -26.0500,
    lng: 151.2500,
    capacity: 204200, // 204,200 ML
  },
  {
    id: '136003A',
    name: 'Fred Haigh Dam',
    river: 'Kolan River',
    riverSystem: 'kolan',
    lat: -24.7700,
    lng: 151.7900,
    capacity: 562000, // 562,000 ML
  },

  // ============================================
  // SOUTHEAST QUEENSLAND - ADDITIONAL
  // ============================================
  {
    id: '143010A',
    name: 'North Pine Dam',
    river: 'North Pine River',
    riverSystem: 'northpine',
    lat: -27.2600,
    lng: 152.9300,
    capacity: 214300, // 214,300 ML
  },
  {
    id: '142001A',
    name: 'Leslie Harrison Dam',
    river: 'Tingalpa Creek',
    riverSystem: 'brisbane',
    lat: -27.5300,
    lng: 153.1800,
    capacity: 24800, // 24,800 ML
  },
  {
    id: '143015A',
    name: 'Lake Manchester',
    river: 'Cabbage Tree Creek',
    riverSystem: 'brisbane',
    lat: -27.4800,
    lng: 152.7600,
    capacity: 26200, // 26,200 ML
  },
  {
    id: '145012A',
    name: 'Moogerah Dam',
    river: 'Reynolds Creek',
    riverSystem: 'logan',
    lat: -28.0333,
    lng: 152.5500,
    capacity: 83700, // 83,700 ML
  },
  {
    id: '145013A',
    name: 'Lake Maroon',
    river: 'Burnett Creek',
    riverSystem: 'logan',
    lat: -28.1500,
    lng: 152.6000,
    capacity: 44300, // 44,300 ML
  },

  // ============================================
  // LOCKYER VALLEY
  // ============================================
  {
    id: '143205A',
    name: 'Lake Clarendon',
    river: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.4700,
    lng: 152.3500,
    capacity: 24400, // 24,400 ML
  },
  {
    id: '143206A',
    name: 'Atkinson Dam',
    river: 'Buaraba Creek',
    riverSystem: 'lockyer',
    lat: -27.3200,
    lng: 152.2500,
    capacity: 30400, // 30,400 ML
  },

  // ============================================
  // SUNSHINE COAST
  // ============================================
  {
    id: '141001A',
    name: 'Ewen Maddock Dam',
    river: 'Mooloolah River',
    riverSystem: 'mooloolah',
    lat: -26.7800,
    lng: 153.0200,
    capacity: 16600, // 16,600 ML
  },
  {
    id: '141003A',
    name: 'Baroon Pocket Dam',
    river: 'Obi Obi Creek',
    riverSystem: 'mary',
    lat: -26.7000,
    lng: 152.8800,
    capacity: 61000, // 61,000 ML
  },

  // ============================================
  // MACKAY-WHITSUNDAY - ADDITIONAL
  // ============================================
  {
    id: '125008A',
    name: 'Eungella Dam',
    river: 'Broken River',
    riverSystem: 'broken',
    lat: -21.1700,
    lng: 148.4800,
    capacity: 112000, // 112,000 ML
  },
  {
    id: '125007A',
    name: 'Teemburra Dam',
    river: 'Teemburra Creek',
    riverSystem: 'pioneer',
    lat: -21.2300,
    lng: 148.7200,
    capacity: 147500, // 147,500 ML
  },

  // ============================================
  // WESTERN QUEENSLAND
  // ============================================
  {
    id: '912201A',
    name: 'Julius Dam',
    river: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.1500,
    lng: 139.7300,
    capacity: 107500, // 107,500 ML
  },
  {
    id: '915001A',
    name: 'Lake Moondarra',
    river: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.5800,
    lng: 139.5500,
    capacity: 106800, // 106,800 ML (Mt Isa water supply)
  },
  {
    id: '914001A',
    name: 'Lake Fred Tritton',
    river: 'Cloncurry River',
    riverSystem: 'cloncurry',
    lat: -20.7200,
    lng: 140.5000,
    capacity: 15800, // 15,800 ML
  },

  // ============================================
  // CONDAMINE-BALONNE (DARLING DOWNS)
  // ============================================
  {
    id: '422308A',
    name: 'Leslie Dam',
    river: 'Sandy Creek',
    riverSystem: 'condamine',
    lat: -28.2600,
    lng: 151.9400,
    capacity: 106200, // 106,200 ML
  },
  {
    id: '422312A',
    name: 'Storm King Dam',
    river: 'Sandy Creek',
    riverSystem: 'condamine',
    lat: -28.1800,
    lng: 152.0100,
    capacity: 9770, // 9,770 ML (Warwick water supply)
  },
  {
    id: '422104A',
    name: 'Coolmunda Dam',
    river: 'Macintyre Brook',
    riverSystem: 'condamine',
    lat: -28.4500,
    lng: 150.9800,
    capacity: 69000, // 69,000 ML
  },
  {
    id: '416301A',
    name: 'Glenlyon Dam',
    river: 'Pike Creek',
    riverSystem: 'condamine',
    lat: -28.8500,
    lng: 151.5500,
    capacity: 254000, // 254,000 ML
  },
  {
    id: '136015A',
    name: 'Wuruma Dam',
    river: 'Nogo River',
    riverSystem: 'burnett',
    lat: -25.1500,
    lng: 150.7000,
    capacity: 165400, // 165,400 ML
  },
]

// Application name
export const APP_NAME = 'GAUGE'
export const APP_TAGLINE = 'Real-time water levels across Queensland'

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

// All gauge stations
export const GAUGE_STATIONS: GaugeStation[] = [
  // Sandy Creek (Clermont) - Primary monitoring
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

  // Theresa Creek - Upstream of Clermont
  {
    id: '130210A',
    name: 'Theresa Creek @ Valeria',
    stream: 'Theresa Creek',
    riverSystem: 'theresa',
    lat: -23.0833,
    lng: 147.4167,
    role: 'Far upstream early warning',
  },
  {
    id: '130206A',
    name: 'Theresa Creek @ Gregory Hwy',
    stream: 'Theresa Creek',
    riverSystem: 'theresa',
    lat: -22.9740,
    lng: 147.5577,
    role: 'Upstream early warning',
  },
  {
    id: '130212A',
    name: 'Theresa Creek @ Gregory Hwy (Old)',
    stream: 'Theresa Creek',
    riverSystem: 'theresa',
    lat: -22.7833,
    lng: 147.5667,
    role: 'Decommissioned gauge',
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
    id: '130403A',
    name: 'Connors River @ Mount Bridget',
    stream: 'Connors River',
    riverSystem: 'isaac',
    lat: -21.8500,
    lng: 149.0000,
    role: 'Isaac tributary - dam site',
  },
  {
    id: '130404A',
    name: 'Connors River @ Pink Lagoon',
    stream: 'Connors River',
    riverSystem: 'isaac',
    lat: -21.9500,
    lng: 148.7833,
    role: 'Tributary confluence',
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

  // Burnett River System (Bundaberg region) - 10 stations
  {
    id: '136101C',
    name: 'Three Moon Creek @ Abercorn',
    stream: 'Three Moon Creek',
    riverSystem: 'burnett',
    lat: -24.7500,
    lng: 150.9500,
    role: 'Upper tributary',
  },
  {
    id: '136103B',
    name: 'Burnett River @ Ceratodus',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.0833,
    lng: 151.0333,
    role: 'Upper Burnett',
  },
  {
    id: '136106A',
    name: 'Burnett River @ Eidsvold',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.3700,
    lng: 151.1200,
    role: 'Above Mundubbera',
  },
  {
    id: '136315A',
    name: 'Boyne River @ Carters',
    stream: 'Boyne River',
    riverSystem: 'burnett',
    lat: -25.8500,
    lng: 151.4500,
    role: 'Southern tributary',
  },
  {
    id: '136017B',
    name: 'Burnett River @ Gayndah',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.6300,
    lng: 151.6200,
    role: 'Mid Burnett',
  },
  {
    id: '136207A',
    name: 'Barambah Creek @ Ban Ban',
    stream: 'Barambah Creek',
    riverSystem: 'burnett',
    lat: -25.5000,
    lng: 151.7833,
    role: 'Eastern tributary',
  },
  {
    id: '136004A',
    name: 'Burnett River @ Jones Weir',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.4500,
    lng: 151.8500,
    role: 'Below Gayndah',
  },
  {
    id: '136002D',
    name: 'Burnett River @ Mount Lawless',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.1500,
    lng: 152.0500,
    role: 'Above Bundaberg',
  },
  {
    id: '136007A',
    name: 'Burnett River @ Figtree Creek',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -24.9500,
    lng: 152.2500,
    role: 'Bundaberg upstream',
  },
  {
    id: '136001A',
    name: 'Burnett River @ Bundaberg',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -24.8500,
    lng: 152.3500,
    role: 'Bundaberg city - key flood gauge',
  },

  // ============================================
  // BRISBANE RIVER BASIN
  // ============================================
  {
    id: '143001C',
    name: 'Brisbane River @ Savages Crossing',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.4400,
    lng: 152.7900,
    role: 'Key flood gauge - upstream Brisbane',
  },
  {
    id: '143210A',
    name: 'Brisbane River @ Mt Crosby Weir',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.5400,
    lng: 152.7700,
    role: 'Below Wivenhoe Dam',
  },
  {
    id: '143009A',
    name: 'Brisbane River @ Moggill',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.5700,
    lng: 152.8700,
    role: 'Western suburbs',
  },
  {
    id: '143007A',
    name: 'Brisbane River @ Jindalee',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.5300,
    lng: 152.9400,
    role: 'Mid Brisbane',
  },
  {
    id: '143030A',
    name: 'Brisbane River @ City Gauge',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.4700,
    lng: 153.0300,
    role: 'Brisbane CBD',
  },

  // Lockyer Creek (Brisbane tributary - flood prone)
  {
    id: '143203A',
    name: 'Lockyer Creek @ Helidon',
    stream: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.5500,
    lng: 152.1200,
    role: 'Upper Lockyer',
  },
  {
    id: '143212A',
    name: 'Lockyer Creek @ Gatton',
    stream: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.5600,
    lng: 152.2800,
    role: 'Gatton township',
  },
  {
    id: '143207A',
    name: 'Lockyer Creek @ Lyons Bridge',
    stream: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.5200,
    lng: 152.5100,
    role: 'Lower Lockyer',
  },

  // Bremer River (Ipswich area)
  {
    id: '143107A',
    name: 'Bremer River @ Ipswich',
    stream: 'Bremer River',
    riverSystem: 'bremer',
    lat: -27.6100,
    lng: 152.7600,
    role: 'Ipswich CBD - key flood gauge',
  },
  {
    id: '143113A',
    name: 'Bremer River @ Rosewood',
    stream: 'Bremer River',
    riverSystem: 'bremer',
    lat: -27.6400,
    lng: 152.5900,
    role: 'Upper Bremer',
  },
  {
    id: '143110A',
    name: 'Warrill Creek @ Amberley',
    stream: 'Warrill Creek',
    riverSystem: 'bremer',
    lat: -27.6500,
    lng: 152.7200,
    role: 'Bremer tributary',
  },

  // ============================================
  // LOGAN-ALBERT BASIN
  // ============================================
  {
    id: '145008A',
    name: 'Logan River @ Beaudesert',
    stream: 'Logan River',
    riverSystem: 'logan',
    lat: -27.9900,
    lng: 152.9900,
    role: 'Upper Logan',
  },
  {
    id: '145010A',
    name: 'Logan River @ Waterford',
    stream: 'Logan River',
    riverSystem: 'logan',
    lat: -27.6900,
    lng: 153.1400,
    role: 'Lower Logan - near mouth',
  },
  {
    id: '145011A',
    name: 'Logan River @ Maclean Bridge',
    stream: 'Logan River',
    riverSystem: 'logan',
    lat: -27.7700,
    lng: 153.0800,
    role: 'Mid Logan',
  },

  {
    id: '145102A',
    name: 'Albert River @ Wolffdene',
    stream: 'Albert River',
    riverSystem: 'albert',
    lat: -27.8100,
    lng: 153.1700,
    role: 'Lower Albert',
  },
  {
    id: '145107A',
    name: 'Albert River @ Beaudesert',
    stream: 'Albert River',
    riverSystem: 'albert',
    lat: -27.9700,
    lng: 153.0000,
    role: 'Upper Albert',
  },

  // ============================================
  // GOLD COAST
  // ============================================
  {
    id: '146002A',
    name: 'Nerang River @ Glenhurst',
    stream: 'Nerang River',
    riverSystem: 'nerang',
    lat: -28.0100,
    lng: 153.2900,
    role: 'Main Nerang gauge',
  },
  {
    id: '146010A',
    name: 'Nerang River @ Nerang',
    stream: 'Nerang River',
    riverSystem: 'nerang',
    lat: -27.9900,
    lng: 153.3200,
    role: 'Nerang township',
  },
  {
    id: '146014A',
    name: 'Coomera River @ Army Camp',
    stream: 'Coomera River',
    riverSystem: 'coomera',
    lat: -27.9300,
    lng: 153.2300,
    role: 'Upper Coomera',
  },
  {
    id: '146015A',
    name: 'Coomera River @ Oxenford',
    stream: 'Coomera River',
    riverSystem: 'coomera',
    lat: -27.8900,
    lng: 153.3100,
    role: 'Lower Coomera',
  },

  // ============================================
  // MARY RIVER BASIN
  // ============================================
  {
    id: '138001A',
    name: 'Mary River @ Gympie',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -26.1900,
    lng: 152.6700,
    role: 'Gympie township - key flood gauge',
  },
  {
    id: '138014A',
    name: 'Mary River @ Miva',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -25.8500,
    lng: 152.5800,
    role: 'Lower Mary',
  },
  {
    id: '138110A',
    name: 'Six Mile Creek @ Cooran',
    stream: 'Six Mile Creek',
    riverSystem: 'mary',
    lat: -26.3400,
    lng: 152.8100,
    role: 'Mary tributary',
  },
  {
    id: '138007A',
    name: 'Mary River @ Bellbird',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -26.4100,
    lng: 152.5300,
    role: 'Upper Mary',
  },

  // ============================================
  // BURDEKIN BASIN (TOWNSVILLE REGION)
  // ============================================
  {
    id: '120006A',
    name: 'Burdekin River @ Clare',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -19.7500,
    lng: 147.2300,
    role: 'Key Burdekin gauge',
  },
  {
    id: '120014B',
    name: 'Burdekin River @ Sellheim',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -20.0100,
    lng: 146.4800,
    role: 'Above dam',
  },
  {
    id: '120001A',
    name: 'Burdekin River @ Home Hill',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -19.6600,
    lng: 147.4100,
    role: 'Near mouth',
  },
  {
    id: '120302A',
    name: 'Haughton River @ Powerline',
    stream: 'Haughton River',
    riverSystem: 'burdekin',
    lat: -19.6000,
    lng: 146.9500,
    role: 'Haughton tributary',
  },

  // Ross River (Townsville city)
  {
    id: '119003A',
    name: 'Ross River @ Aplin Weir',
    stream: 'Ross River',
    riverSystem: 'ross',
    lat: -19.3000,
    lng: 146.7900,
    role: 'Townsville city - key flood gauge',
  },
  {
    id: '119001A',
    name: 'Ross River @ Ross River Dam',
    stream: 'Ross River',
    riverSystem: 'ross',
    lat: -19.4200,
    lng: 146.7300,
    role: 'Dam spillway',
  },

  // ============================================
  // HERBERT BASIN
  // ============================================
  {
    id: '116001F',
    name: 'Herbert River @ Ingham',
    stream: 'Herbert River',
    riverSystem: 'herbert',
    lat: -18.6500,
    lng: 146.1700,
    role: 'Ingham township - key flood gauge',
  },
  {
    id: '116006B',
    name: 'Herbert River @ Halifax',
    stream: 'Herbert River',
    riverSystem: 'herbert',
    lat: -18.6200,
    lng: 146.2900,
    role: 'Lower Herbert',
  },
  {
    id: '116015A',
    name: 'Stone River @ Allingham',
    stream: 'Stone River',
    riverSystem: 'herbert',
    lat: -18.4500,
    lng: 145.9000,
    role: 'Herbert tributary',
  },

  // ============================================
  // CAIRNS / FAR NORTH QUEENSLAND
  // ============================================
  // Barron River (Cairns)
  {
    id: '110001D',
    name: 'Barron River @ Myola',
    stream: 'Barron River',
    riverSystem: 'barron',
    lat: -16.8800,
    lng: 145.6700,
    role: 'Above Cairns',
  },
  {
    id: '110003A',
    name: 'Barron River @ Picnic Crossing',
    stream: 'Barron River',
    riverSystem: 'barron',
    lat: -16.9200,
    lng: 145.7000,
    role: 'Cairns upstream',
  },

  // Mulgrave River
  {
    id: '111007A',
    name: 'Mulgrave River @ Gordonvale',
    stream: 'Mulgrave River',
    riverSystem: 'mulgrave',
    lat: -17.1000,
    lng: 145.7800,
    role: 'Gordonvale - key gauge',
  },
  {
    id: '111101A',
    name: 'Mulgrave River @ The Fisheries',
    stream: 'Mulgrave River',
    riverSystem: 'mulgrave',
    lat: -17.0800,
    lng: 145.7200,
    role: 'Upper Mulgrave',
  },

  // Johnstone River (Innisfail)
  {
    id: '112003A',
    name: 'Johnstone River @ Innisfail',
    stream: 'Johnstone River',
    riverSystem: 'johnstone',
    lat: -17.5200,
    lng: 146.0300,
    role: 'Innisfail township - key flood gauge',
  },
  {
    id: '112004A',
    name: 'North Johnstone @ Tung Oil',
    stream: 'North Johnstone River',
    riverSystem: 'johnstone',
    lat: -17.4800,
    lng: 145.8900,
    role: 'North branch',
  },

  // ============================================
  // MACKAY / PIONEER BASIN
  // ============================================
  {
    id: '125001A',
    name: 'Pioneer River @ Dumbleton Weir',
    stream: 'Pioneer River',
    riverSystem: 'pioneer',
    lat: -21.1200,
    lng: 149.1100,
    role: 'Mackay city - key flood gauge',
  },
  {
    id: '125013A',
    name: 'Pioneer River @ Mirani',
    stream: 'Pioneer River',
    riverSystem: 'pioneer',
    lat: -21.1600,
    lng: 148.8500,
    role: 'Upper Pioneer',
  },
  {
    id: '125006A',
    name: 'Sandy Creek @ Homebush',
    stream: 'Sandy Creek',
    riverSystem: 'pioneer',
    lat: -21.2700,
    lng: 149.0500,
    role: 'Pioneer tributary',
  },

  // Proserpine River
  {
    id: '124001B',
    name: 'Proserpine River @ Glen Isla',
    stream: 'Proserpine River',
    riverSystem: 'proserpine',
    lat: -20.4500,
    lng: 148.5800,
    role: 'Proserpine area',
  },
  {
    id: '124002A',
    name: 'Proserpine River @ Proserpine',
    stream: 'Proserpine River',
    riverSystem: 'proserpine',
    lat: -20.4000,
    lng: 148.5300,
    role: 'Proserpine township',
  },

  // ============================================
  // CONDAMINE-BALONNE (DARLING DOWNS)
  // ============================================
  {
    id: '422316A',
    name: 'Condamine River @ Warwick',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -28.2100,
    lng: 152.0300,
    role: 'Warwick township',
  },
  {
    id: '422308B',
    name: 'Condamine River @ Dalby',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -27.1800,
    lng: 151.2600,
    role: 'Dalby township',
  },
  {
    id: '422401B',
    name: 'Myall Creek @ Dalby',
    stream: 'Myall Creek',
    riverSystem: 'condamine',
    lat: -27.2000,
    lng: 151.2400,
    role: 'Condamine tributary',
  },
  {
    id: '422310A',
    name: 'Condamine River @ Chinchilla',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -26.7400,
    lng: 150.6300,
    role: 'Chinchilla area',
  },

  // ============================================
  // FAR NORTH - TULLY & DAINTREE
  // ============================================
  {
    id: '113006A',
    name: 'Tully River @ Tully',
    stream: 'Tully River',
    riverSystem: 'tully',
    lat: -17.9400,
    lng: 145.9200,
    role: 'Tully township - key flood gauge',
  },
  {
    id: '113004A',
    name: 'Tully River @ Euramo',
    stream: 'Tully River',
    riverSystem: 'tully',
    lat: -17.9800,
    lng: 145.9700,
    role: 'Lower Tully',
  },
  {
    id: '108002A',
    name: 'Daintree River @ Bairds',
    stream: 'Daintree River',
    riverSystem: 'daintree',
    lat: -16.4000,
    lng: 145.4200,
    role: 'Mid Daintree',
  },
  {
    id: '108003A',
    name: 'Daintree River @ Upper Daintree',
    stream: 'Daintree River',
    riverSystem: 'daintree',
    lat: -16.5000,
    lng: 145.3500,
    role: 'Upper Daintree',
  },

  // ============================================
  // WESTERN QUEENSLAND
  // ============================================
  {
    id: '915010A',
    name: 'Leichhardt River @ Julius Dam',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.1500,
    lng: 139.7300,
    role: 'Dam spillway',
  },
  {
    id: '915001A',
    name: 'Leichhardt River @ Moondarra',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.5800,
    lng: 139.5500,
    role: 'Lake Moondarra',
  },
  {
    id: '915101A',
    name: 'Leichhardt River @ Floraville',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -18.2800,
    lng: 139.0500,
    role: 'Lower Leichhardt',
  },
  {
    id: '914101A',
    name: 'Cloncurry River @ Cloncurry',
    stream: 'Cloncurry River',
    riverSystem: 'cloncurry',
    lat: -20.7000,
    lng: 140.5000,
    role: 'Cloncurry township',
  },
  {
    id: '912101A',
    name: 'Flinders River @ Richmond',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -20.7200,
    lng: 143.1400,
    role: 'Richmond township',
  },
  {
    id: '912105A',
    name: 'Flinders River @ Hughenden',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -20.8500,
    lng: 144.2000,
    role: 'Hughenden township',
  },
  {
    id: '912001A',
    name: 'Flinders River @ Walkers Bend',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -18.1000,
    lng: 141.1000,
    role: 'Lower Flinders',
  },

  // ============================================
  // MACKAY - BROKEN RIVER
  // ============================================
  {
    id: '125101A',
    name: 'Broken River @ Eungella',
    stream: 'Broken River',
    riverSystem: 'broken',
    lat: -21.1700,
    lng: 148.4800,
    role: 'Eungella Dam spillway',
  },
  {
    id: '125102A',
    name: 'Broken River @ Crediton',
    stream: 'Broken River',
    riverSystem: 'broken',
    lat: -21.2000,
    lng: 148.5500,
    role: 'Below Eungella Dam',
  },

  // ============================================
  // SUNSHINE COAST - MOOLOOLAH
  // ============================================
  {
    id: '141009A',
    name: 'Mooloolah River @ Mooloolah',
    stream: 'Mooloolah River',
    riverSystem: 'mooloolah',
    lat: -26.7600,
    lng: 152.9800,
    role: 'Mooloolah township',
  },

  // ============================================
  // NORTH PINE
  // ============================================
  {
    id: '142012A',
    name: 'North Pine River @ Young Crossing',
    stream: 'North Pine River',
    riverSystem: 'northpine',
    lat: -27.3000,
    lng: 152.8800,
    role: 'Above North Pine Dam',
  },

  // ============================================
  // CHANNEL COUNTRY / OUTBACK
  // ============================================
  // Cooper Creek (Lake Eyre Basin)
  {
    id: '003103A',
    name: 'Cooper Creek @ Windorah',
    stream: 'Cooper Creek',
    riverSystem: 'cooper',
    lat: -25.4200,
    lng: 142.6500,
    role: 'Key Cooper Creek gauge',
  },
  {
    id: '003202A',
    name: 'Thomson River @ Longreach',
    stream: 'Thomson River',
    riverSystem: 'cooper',
    lat: -23.4400,
    lng: 144.2500,
    role: 'Thomson tributary',
  },
  {
    id: '003301A',
    name: 'Barcoo River @ Blackall',
    stream: 'Barcoo River',
    riverSystem: 'cooper',
    lat: -24.4200,
    lng: 145.4700,
    role: 'Barcoo tributary',
  },

  // Diamantina River
  {
    id: '002101A',
    name: 'Diamantina River @ Birdsville',
    stream: 'Diamantina River',
    riverSystem: 'diamantina',
    lat: -25.9000,
    lng: 139.3500,
    role: 'Birdsville township',
  },
  {
    id: '002103A',
    name: 'Diamantina River @ Monkira',
    stream: 'Diamantina River',
    riverSystem: 'diamantina',
    lat: -24.8500,
    lng: 140.5500,
    role: 'Mid Diamantina',
  },

  // Warrego River
  {
    id: '423001A',
    name: 'Warrego River @ Charleville',
    stream: 'Warrego River',
    riverSystem: 'warrego',
    lat: -26.4000,
    lng: 146.2500,
    role: 'Charleville township - key flood gauge',
  },
  {
    id: '423203A',
    name: 'Warrego River @ Cunnamulla',
    stream: 'Warrego River',
    riverSystem: 'warrego',
    lat: -28.0700,
    lng: 145.6800,
    role: 'Cunnamulla township',
  },

  // Paroo River
  {
    id: '424201A',
    name: 'Paroo River @ Caiwarro',
    stream: 'Paroo River',
    riverSystem: 'paroo',
    lat: -28.4000,
    lng: 144.4500,
    role: 'Mid Paroo',
    isOffline: true,
    lastDataYear: 2023,
  },
  {
    id: '424101A',
    name: 'Paroo River @ Hungerford',
    stream: 'Paroo River',
    riverSystem: 'paroo',
    lat: -29.0000,
    lng: 144.4000,
    role: 'Lower Paroo',
    isOffline: true,
    lastDataYear: 2023,
  },

  // ============================================
  // CAPE YORK
  // ============================================
  // Mitchell River
  {
    id: '919009A',
    name: 'Mitchell River @ Kowanyama',
    stream: 'Mitchell River',
    riverSystem: 'mitchell',
    lat: -15.4800,
    lng: 141.7500,
    role: 'Lower Mitchell - near mouth',
  },
  {
    id: '919201A',
    name: 'Mitchell River @ Koolatah',
    stream: 'Mitchell River',
    riverSystem: 'mitchell',
    lat: -15.9500,
    lng: 142.3500,
    role: 'Mid Mitchell',
  },
  {
    id: '919301A',
    name: 'Walsh River @ Nullinga',
    stream: 'Walsh River',
    riverSystem: 'mitchell',
    lat: -17.1500,
    lng: 145.2000,
    role: 'Mitchell tributary',
  },

  // Normanby River
  {
    id: '106001A',
    name: 'Normanby River @ Kalpowar',
    stream: 'Normanby River',
    riverSystem: 'normanby',
    lat: -15.2500,
    lng: 144.5500,
    role: 'Lower Normanby',
  },
  {
    id: '106002A',
    name: 'Normanby River @ Battle Camp',
    stream: 'Normanby River',
    riverSystem: 'normanby',
    lat: -15.6500,
    lng: 144.8500,
    role: 'Mid Normanby',
  },

  // ============================================
  // GULF COUNTRY
  // ============================================
  // Norman River
  {
    id: '917101A',
    name: 'Norman River @ Normanton',
    stream: 'Norman River',
    riverSystem: 'norman',
    lat: -17.6700,
    lng: 141.0700,
    role: 'Normanton township',
  },
  {
    id: '917201A',
    name: 'Norman River @ Glenore',
    stream: 'Norman River',
    riverSystem: 'norman',
    lat: -18.0000,
    lng: 141.5000,
    role: 'Upper Norman',
    isOffline: true,
    lastDataYear: 2022,
  },

  // ============================================
  // BOWEN AREA
  // ============================================
  // Don River
  {
    id: '121001A',
    name: 'Don River @ Bowen',
    stream: 'Don River',
    riverSystem: 'don',
    lat: -20.0100,
    lng: 148.2400,
    role: 'Bowen township',
  },
  {
    id: '121002A',
    name: 'Don River @ Euri Creek',
    stream: 'Don River',
    riverSystem: 'don',
    lat: -20.1500,
    lng: 148.1000,
    role: 'Upper Don',
  },
]

// Quick link locations - major Queensland cities
export const QUICK_LINKS = [
  // SEQ
  { name: 'Brisbane', lat: -27.4700, lng: 153.0300 },
  { name: 'Ipswich', lat: -27.6100, lng: 152.7600 },
  { name: 'Gold Coast', lat: -28.0100, lng: 153.3200 },
  { name: 'Logan', lat: -27.6900, lng: 153.1400 },
  // Wide Bay-Burnett
  { name: 'Bundaberg', lat: -24.8500, lng: 152.3500 },
  { name: 'Gympie', lat: -26.1900, lng: 152.6700 },
  // Central QLD
  { name: 'Rockhampton', lat: -23.3791, lng: 150.5100 },
  { name: 'Emerald', lat: -23.5275, lng: 148.1592 },
  { name: 'Clermont', lat: -22.8245, lng: 147.6392 },
  // Mackay-Whitsunday
  { name: 'Mackay', lat: -21.1200, lng: 149.1100 },
  { name: 'Proserpine', lat: -20.4000, lng: 148.5300 },
  // North QLD
  { name: 'Townsville', lat: -19.3000, lng: 146.7900 },
  { name: 'Ingham', lat: -18.6500, lng: 146.1700 },
  // Far North QLD
  { name: 'Cairns', lat: -16.9200, lng: 145.7700 },
  { name: 'Innisfail', lat: -17.5200, lng: 146.0300 },
  // Darling Downs
  { name: 'Toowoomba', lat: -27.5600, lng: 151.9500 },
  { name: 'Warwick', lat: -28.2100, lng: 152.0300 },
  { name: 'Dalby', lat: -27.1800, lng: 151.2600 },
]

// Extended river paths for map overlay (with additional waypoints for better visibility)
// Reference: Theresa Creek flows into Nogoa River (Wikipedia), Isaac/Connors flow into Mackenzie
export const RIVER_PATHS: Record<RiverSystem, [number, number][]> = {
  // Sandy Creek - through Clermont, flows SOUTH toward Theresa Creek/Nogoa system
  clermont: [
    [-22.8245, 147.6392], // Sandy Creek @ Clermont
    [-22.87, 147.60], // Junction with Theresa Creek
    [-22.92, 147.58], // Continues to Theresa Creek system
  ],
  // Theresa Creek - flows into Nogoa River (confirmed via Wikipedia)
  theresa: [
    [-23.0833, 147.4167], // Theresa Creek @ Valeria (far upstream)
    [-23.02, 147.48],
    [-22.9740, 147.5577], // Theresa Creek @ Gregory Hwy
    [-22.92, 147.58], // Sandy Creek joins here
    [-23.10, 147.70], // Flows southeast toward Nogoa
    [-23.25, 147.80],
    [-23.40, 147.88],
    [-23.5167, 147.9333], // Joins Nogoa @ Craigmore
  ],
  // Wolfang Creek - from the west into Sandy Creek
  wolfang: [
    [-22.95, 147.35], // Upper Wolfang Creek (west)
    [-22.90, 147.42],
    [-22.87, 147.50],
    [-22.85, 147.56],
    [-22.8245, 147.6392], // Joins Sandy Creek @ Clermont
  ],
  // Douglas Creek - from the south into Sandy Creek
  douglas: [
    [-22.95, 147.60], // Upper Douglas Creek (south)
    [-22.90, 147.62],
    [-22.8245, 147.6392], // Joins Sandy Creek @ Clermont
  ],
  isaac: [
    // Isaac River - independent northern tributary, flows SOUTH into Mackenzie
    // Connors River joins Isaac before reaching Mackenzie (Wikipedia confirmed)
    [-21.75, 148.50], // Upper Isaac (headwaters)
    [-21.95, 148.55],
    [-22.1833, 148.6167], // Isaac River @ Deverill
    [-22.30, 148.50],
    [-22.4167, 148.3333], // Isaac River @ Yatton
    [-22.60, 148.50], // Flows south
    [-22.80, 148.70],
    [-23.00, 148.90],
    [-23.1833, 149.3500], // Joins Mackenzie @ Bingegang
  ],
  nogoa: [
    // Nogoa River - receives Theresa Creek, flows to Mackenzie
    [-23.75, 147.65], // Upper Nogoa (headwaters)
    [-23.68, 147.72],
    [-23.56, 147.87],
    [-23.5167, 147.9333], // Nogoa River @ Craigmore (Theresa Creek joins here)
    [-23.48, 148.02],
    [-23.4500, 148.1000], // Nogoa River @ Duck Ponds (below Fairbairn Dam)
    [-23.42, 148.18],
    [-23.40, 148.28],
    [-23.45, 148.40],
    [-23.4500, 148.5000], // Joins Mackenzie @ Rileys Crossing
  ],
  mackenzie: [
    // Mackenzie River (Nogoa to Fitzroy)
    [-23.4500, 148.5000], // Mackenzie River @ Rileys Crossing (Nogoa joins)
    [-23.40, 148.65],
    [-23.3333, 148.8333], // Mackenzie River @ Coolmaringa
    [-23.25, 149.10],
    [-23.1833, 149.3500], // Mackenzie River @ Bingegang (Isaac joins)
    [-23.20, 149.55],
    [-23.25, 149.70], // Flows to Fitzroy
  ],
  comet: [
    // Comet River (joins Mackenzie)
    [-23.92, 148.15],
    [-23.8000, 148.3000],
    [-23.70, 148.42],
    [-23.6000, 148.5500],
    [-23.50, 148.62],
    [-23.40, 148.65], // Joins Mackenzie
  ],
  fitzroy: [
    // Fitzroy River (Mackenzie confluence to coast)
    [-23.25, 149.70], // Junction with Mackenzie
    [-23.3833, 149.9167], // Fitzroy River @ The Gap
    [-23.28, 150.12],
    [-23.25, 150.42],
    [-23.3833, 150.5000], // Fitzroy River @ Rockhampton
    [-23.42, 150.58],
    [-23.50, 150.68],
  ],
  burnett: [
    // Burnett River (Monto area to Bundaberg/coast)
    [-24.7500, 150.9500], // Three Moon Creek @ Abercorn (upper tributary)
    [-24.90, 151.00], // Upper Burnett
    [-25.0833, 151.0333], // Burnett River @ Ceratodus
    [-25.3700, 151.1200], // Burnett River @ Eidsvold
    [-25.5900, 151.3000], // Mundubbera area
    [-25.6300, 151.6200], // Burnett River @ Gayndah
    [-25.5000, 151.7833], // Barambah Creek junction
    [-25.4500, 151.8500], // Burnett River @ Jones Weir
    [-25.1500, 152.0500], // Burnett River @ Mount Lawless
    [-24.9500, 152.2500], // Burnett River @ Figtree Creek
    [-24.8500, 152.3500], // Burnett River @ Bundaberg
    [-24.7700, 152.4200], // Burnett Heads (mouth)
  ],

  // ============================================
  // BRISBANE BASIN
  // ============================================
  brisbane: [
    // Brisbane River - from Wivenhoe Dam to Moreton Bay
    [-27.3900, 152.6100], // Above Wivenhoe Dam
    [-27.4400, 152.7900], // Savages Crossing
    [-27.5400, 152.7700], // Mt Crosby Weir
    [-27.5700, 152.8700], // Moggill
    [-27.5300, 152.9400], // Jindalee
    [-27.4800, 152.9800], // Indooroopilly
    [-27.4700, 153.0300], // Brisbane City
    [-27.4500, 153.1200], // Mouth at Moreton Bay
  ],
  bremer: [
    // Bremer River - joins Brisbane near Ipswich
    [-27.7500, 152.4500], // Upper Bremer
    [-27.6400, 152.5900], // Rosewood
    [-27.6500, 152.7200], // Amberley (Warrill Creek junction)
    [-27.6100, 152.7600], // Ipswich
    [-27.5800, 152.7800], // Joins Brisbane River
  ],
  lockyer: [
    // Lockyer Creek - major Brisbane tributary (flood prone)
    [-27.5000, 152.0500], // Upper Lockyer
    [-27.5500, 152.1200], // Helidon
    [-27.5600, 152.2800], // Gatton
    [-27.5400, 152.4000], // Laidley area
    [-27.5200, 152.5100], // Lyons Bridge
    [-27.5100, 152.6500], // Joins Brisbane River
  ],

  // ============================================
  // LOGAN-ALBERT BASIN
  // ============================================
  logan: [
    // Logan River - flows to Moreton Bay
    [-28.1000, 152.8500], // Upper Logan
    [-27.9900, 152.9900], // Beaudesert
    [-27.8500, 153.0500], // Jimboomba area
    [-27.7700, 153.0800], // Maclean Bridge
    [-27.6900, 153.1400], // Waterford
    [-27.6500, 153.2000], // Mouth near Beenleigh
  ],
  albert: [
    // Albert River - joins Logan near Beenleigh
    [-28.0500, 152.9500], // Upper Albert
    [-27.9700, 153.0000], // Beaudesert area
    [-27.8800, 153.1000], // Mid Albert
    [-27.8100, 153.1700], // Wolffdene
    [-27.7000, 153.1800], // Joins Logan River
  ],

  // ============================================
  // GOLD COAST
  // ============================================
  nerang: [
    // Nerang River - Gold Coast hinterland to coast
    [-28.1000, 153.2200], // Upper Nerang (hinterland)
    [-28.0500, 153.2600],
    [-28.0100, 153.2900], // Glenhurst
    [-27.9900, 153.3200], // Nerang
    [-27.9700, 153.3800], // Broadbeach Waters
  ],
  coomera: [
    // Coomera River
    [-28.0000, 153.1500], // Upper Coomera
    [-27.9300, 153.2300], // Army Camp
    [-27.8900, 153.3100], // Oxenford
    [-27.8700, 153.3600], // Mouth at Broadwater
  ],

  // ============================================
  // MARY RIVER BASIN
  // ============================================
  mary: [
    // Mary River - Sunshine Coast hinterland to mouth
    [-26.6000, 152.4500], // Upper Mary (near Maleny)
    [-26.4100, 152.5300], // Bellbird
    [-26.1900, 152.6700], // Gympie
    [-25.9500, 152.6200], // Tiaro area
    [-25.8500, 152.5800], // Miva
    [-25.5500, 152.7000], // Mouth near Maryborough
  ],

  // ============================================
  // BURDEKIN BASIN
  // ============================================
  burdekin: [
    // Burdekin River - largest river by discharge in QLD
    [-20.5000, 145.5000], // Upper Burdekin
    [-20.0100, 146.4800], // Sellheim
    [-19.8000, 147.0000], // Below dam
    [-19.7500, 147.2300], // Clare
    [-19.6600, 147.4100], // Home Hill
    [-19.6500, 147.5800], // Mouth at Upstart Bay
  ],
  ross: [
    // Ross River - Townsville city
    [-19.4500, 146.6800], // Upper Ross
    [-19.4200, 146.7300], // Ross River Dam
    [-19.3500, 146.7600], // Mid Ross
    [-19.3000, 146.7900], // Aplin Weir
    [-19.2600, 146.8200], // Townsville
  ],

  // ============================================
  // HERBERT BASIN
  // ============================================
  herbert: [
    // Herbert River - Ingham area
    [-18.2500, 145.5000], // Upper Herbert
    [-18.4500, 145.9000], // Allingham (Stone River junction)
    [-18.5500, 146.0500], // Mid Herbert
    [-18.6500, 146.1700], // Ingham
    [-18.6200, 146.2900], // Halifax
    [-18.5500, 146.4000], // Mouth
  ],

  // ============================================
  // CAIRNS / FAR NORTH
  // ============================================
  barron: [
    // Barron River - Cairns
    [-17.2500, 145.5000], // Upper Barron (Atherton Tablelands)
    [-17.0000, 145.6000], // Mid Barron
    [-16.8800, 145.6700], // Myola
    [-16.9200, 145.7000], // Picnic Crossing
    [-16.9200, 145.7700], // Cairns area mouth
  ],
  mulgrave: [
    // Mulgrave River - south of Cairns
    [-17.2000, 145.6500], // Upper Mulgrave
    [-17.0800, 145.7200], // The Fisheries
    [-17.1000, 145.7800], // Gordonvale
    [-17.1500, 145.8500], // Mouth
  ],
  johnstone: [
    // Johnstone River - Innisfail
    [-17.6000, 145.7500], // Upper Johnstone
    [-17.4800, 145.8900], // Tung Oil (North branch)
    [-17.5200, 146.0300], // Innisfail
    [-17.5000, 146.1500], // Mouth
  ],

  // ============================================
  // MACKAY / PIONEER
  // ============================================
  pioneer: [
    // Pioneer River - Mackay
    [-21.2500, 148.6000], // Upper Pioneer
    [-21.1600, 148.8500], // Mirani
    [-21.1500, 149.0000], // Mid Pioneer
    [-21.1200, 149.1100], // Dumbleton Weir (Mackay)
    [-21.1000, 149.2000], // Mouth
  ],
  proserpine: [
    // Proserpine River - Whitsundays
    [-20.5500, 148.4500], // Upper Proserpine
    [-20.4500, 148.5800], // Glen Isla
    [-20.4000, 148.5300], // Proserpine
    [-20.3500, 148.6500], // Mouth
  ],

  // ============================================
  // CONDAMINE-BALONNE (Darling Downs - inland)
  // ============================================
  condamine: [
    // Condamine River - flows west (Murray-Darling Basin)
    [-28.2100, 152.0300], // Warwick
    [-27.8000, 151.8000], // Clifton area
    [-27.5600, 151.5500], // Pittsworth area
    [-27.1800, 151.2600], // Dalby
    [-26.7400, 150.6300], // Chinchilla
    [-26.5000, 150.1000], // Miles area (continues west)
  ],

  // ============================================
  // ADDITIONAL RIVER SYSTEMS
  // ============================================
  kolan: [
    // Kolan River - north of Bundaberg
    [-24.9500, 151.5500], // Upper Kolan
    [-24.8500, 151.6500], // Mid Kolan
    [-24.7700, 151.7900], // Fred Haigh Dam
    [-24.6500, 151.9000], // Lower Kolan
    [-24.5500, 152.0500], // Mouth near Burnett Heads
  ],
  northpine: [
    // North Pine River - Brisbane north
    [-27.3000, 152.8500], // Upper North Pine
    [-27.2600, 152.9300], // North Pine Dam
    [-27.2200, 152.9800], // Below dam
    [-27.2000, 153.0500], // Mouth at Moreton Bay
  ],
  mooloolah: [
    // Mooloolah River - Sunshine Coast
    [-26.8000, 152.9500], // Upper Mooloolah
    [-26.7800, 153.0200], // Ewen Maddock Dam area
    [-26.7200, 153.0800], // Mid Mooloolah
    [-26.6800, 153.1200], // Mouth at Mooloolaba
  ],
  tully: [
    // Tully River - Far North Queensland (significant flood-prone river)
    [-17.9000, 145.6000], // Upper Tully
    [-17.8000, 145.7000], // Mid Tully
    [-17.9400, 145.9200], // Tully township
    [-17.9200, 146.0500], // Lower Tully
    [-18.0000, 146.1500], // Mouth
  ],
  daintree: [
    // Daintree River - World Heritage area
    [-16.5000, 145.3500], // Upper Daintree
    [-16.4500, 145.4200], // Mid Daintree
    [-16.3000, 145.4500], // Near crossing
    [-16.2500, 145.4800], // Daintree Village
    [-16.2800, 145.5500], // Mouth
  ],
  broken: [
    // Broken River - Mackay hinterland
    [-21.3000, 148.3500], // Upper Broken River (Eungella area)
    [-21.1700, 148.4800], // Eungella Dam
    [-21.0500, 148.5500], // Below dam
    [-21.0000, 148.7000], // Joins Pioneer system
  ],
  flinders: [
    // Flinders River - Gulf Country (longest river in QLD)
    [-20.5000, 144.0000], // Hughenden area
    [-19.8000, 143.5000], // Mid Flinders
    [-18.2000, 141.5000], // Lower Flinders
    [-17.7500, 140.8500], // Mouth at Gulf of Carpentaria
  ],
  leichhardt: [
    // Leichhardt River - Mt Isa region
    [-20.1500, 139.7300], // Julius Dam
    [-20.5800, 139.5500], // Lake Moondarra
    [-20.7300, 139.4800], // Mt Isa area
    [-19.8000, 139.0000], // Lower Leichhardt
    [-18.8000, 138.5000], // Mouth at Gulf
  ],
  cloncurry: [
    // Cloncurry River - joins Flinders
    [-21.0000, 140.2000], // Upper Cloncurry
    [-20.7200, 140.5000], // Lake Fred Tritton
    [-20.5000, 140.7000], // Cloncurry township
    [-20.0000, 141.0000], // Joins Flinders
  ],

  // ============================================
  // CHANNEL COUNTRY / OUTBACK
  // ============================================
  cooper: [
    // Cooper Creek - Lake Eyre Basin (Thomson + Barcoo join to form Cooper)
    [-24.4200, 145.4700], // Barcoo River @ Blackall
    [-24.8000, 144.5000], // Mid Barcoo
    [-25.2000, 143.5000], // Lower Barcoo
    [-25.4200, 142.6500], // Cooper Creek @ Windorah (junction)
    [-26.0000, 141.5000], // Lower Cooper
    [-27.5000, 140.0000], // Toward Lake Eyre (SA border)
  ],
  diamantina: [
    // Diamantina River - flows to Lake Eyre
    [-22.5000, 141.5000], // Upper Diamantina
    [-23.5000, 141.0000], // Mid Diamantina
    [-24.8500, 140.5500], // Diamantina @ Monkira
    [-25.9000, 139.3500], // Diamantina @ Birdsville
    [-26.5000, 138.5000], // Lower Diamantina (SA border)
  ],
  warrego: [
    // Warrego River - flows to Darling (NSW)
    [-25.5000, 147.0000], // Upper Warrego
    [-26.4000, 146.2500], // Warrego @ Charleville
    [-27.2000, 146.0000], // Mid Warrego
    [-28.0700, 145.6800], // Warrego @ Cunnamulla
    [-29.0000, 145.0000], // Lower Warrego (NSW border)
  ],
  paroo: [
    // Paroo River - ephemeral, flows to NSW
    [-27.0000, 145.5000], // Upper Paroo
    [-28.0000, 145.0000], // Mid Paroo
    [-28.4000, 144.4500], // Paroo @ Caiwarro
    [-29.0000, 144.4000], // Paroo @ Hungerford (NSW border)
  ],

  // ============================================
  // CAPE YORK
  // ============================================
  mitchell: [
    // Mitchell River - one of largest rivers draining to Gulf
    [-17.1500, 145.2000], // Walsh River @ Nullinga (tributary)
    [-16.5000, 144.5000], // Upper Mitchell
    [-15.9500, 142.3500], // Mitchell @ Koolatah
    [-15.4800, 141.7500], // Mitchell @ Kowanyama
    [-15.2000, 141.5000], // Mouth at Gulf of Carpentaria
  ],
  normanby: [
    // Normanby River - Cape York to Princess Charlotte Bay
    [-16.0000, 145.0000], // Upper Normanby
    [-15.6500, 144.8500], // Normanby @ Battle Camp
    [-15.2500, 144.5500], // Normanby @ Kalpowar
    [-14.8000, 144.3000], // Mouth at Princess Charlotte Bay
  ],

  // ============================================
  // GULF COUNTRY
  // ============================================
  norman: [
    // Norman River - flows to Gulf of Carpentaria
    [-18.5000, 142.0000], // Upper Norman
    [-18.0000, 141.5000], // Norman @ Glenore
    [-17.6700, 141.0700], // Norman @ Normanton
    [-17.5000, 140.8000], // Mouth at Gulf
  ],

  // ============================================
  // BOWEN AREA
  // ============================================
  don: [
    // Don River - north of Bowen
    [-20.3000, 147.8000], // Upper Don
    [-20.1500, 148.1000], // Don @ Euri Creek
    [-20.0100, 148.2400], // Don @ Bowen
    [-19.9500, 148.3500], // Mouth at Coral Sea
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

// RainViewer radar overlay configuration
// API docs: https://www.rainviewer.com/api.html
export const RAINVIEWER_CONFIG = {
  apiUrl: 'https://api.rainviewer.com/public/weather-maps.json',
  // Tile URL pattern: {host}{path}/256/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
  tileSize: 256,
  colorScheme: 2, // 0-8, color scheme for radar (2 is good for precipitation)
  smooth: 1, // 0 or 1, smoothing
  snow: 1, // 0 or 1, show snow
  opacity: 0.6,
  attribution: 'Rain radar data &copy; <a href="https://www.rainviewer.com">RainViewer</a>',
}

// Emergency resources
export const EMERGENCY_RESOURCES = [
  { name: 'BOM Flood Warnings', url: 'https://www.bom.gov.au/qld/flood/', description: 'Official warnings' },
  { name: 'QFES', url: 'https://www.qfes.qld.gov.au/', description: 'Emergency services' },
  { name: 'Isaac Regional Council', url: 'https://www.isaac.qld.gov.au/disaster', description: 'Local emergency info' },
  { name: 'SES', url: 'https://www.ses.qld.gov.au/', description: 'Request assistance' },
]
