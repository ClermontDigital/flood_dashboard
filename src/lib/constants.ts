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
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export const MAP_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Street',
    maxNativeZoom: 19,
  },
  satellite: {
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.maxar.com/">Maxar</a>',
    name: 'Satellite',
    maxNativeZoom: 19,
  },
  hybrid: {
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: 'Hybrid',
    maxNativeZoom: 19,
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
  unknown: '#0284c7', // sky-600 - reading available but no official flood levels
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
  unknown: {
    label: 'LEVEL ONLY',
    message: 'No official flood levels are set for this gauge. Watch the trend and check BOM warnings.',
    action: 'Check BOM flood warnings for this river',
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
    lat: -23.1856,
    lng: 147.8948,
    role: 'Far upstream early warning',
  },
  {
    id: '130206A',
    name: 'Theresa Creek @ Gregory Hwy',
    stream: 'Theresa Creek',
    riverSystem: 'theresa',
    lat: -23.4292,
    lng: 148.1514,
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
    lat: -22.6566,
    lng: 149.1158,
    role: 'Upper Isaac',
  },
  {
    id: '130410A',
    name: 'Isaac River @ Deverill',
    stream: 'Isaac River',
    riverSystem: 'isaac',
    lat: -22.1708,
    lng: 148.3842,
    role: 'Mid Isaac',
  },
  {
    id: '130403A',
    name: 'Connors River @ Mount Bridget',
    stream: 'Connors River',
    riverSystem: 'isaac',
    lat: -22.0357,
    lng: 149.1315,
    role: 'Isaac tributary - dam site',
  },
  {
    id: '130404A',
    name: 'Connors River @ Pink Lagoon',
    stream: 'Connors River',
    riverSystem: 'isaac',
    lat: -22.3359,
    lng: 148.9485,
    role: 'Tributary confluence',
  },

  // Nogoa River System (2 active + 1 offline)
  {
    id: '130209A',
    name: 'Nogoa River @ Craigmore',
    stream: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.8849,
    lng: 147.7572,
    role: 'Above Emerald',
  },
  {
    id: '130219A',
    name: 'Nogoa River @ Duck Ponds',
    stream: 'Nogoa River',
    riverSystem: 'nogoa',
    lat: -23.4816,
    lng: 148.4727,
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
    lat: -23.0762,
    lng: 149.0331,
    role: 'Lower Mackenzie',
  },
  {
    id: '130105B',
    name: 'Mackenzie River @ Coolmaringa',
    stream: 'Mackenzie River',
    riverSystem: 'mackenzie',
    lat: -23.3184,
    lng: 149.5224,
    role: 'Mid Mackenzie',
  },
  {
    id: '130113A',
    name: 'Mackenzie River @ Rileys Crossing',
    stream: 'Mackenzie River',
    riverSystem: 'mackenzie',
    lat: -23.5435,
    lng: 148.6053,
    role: 'Upper Mackenzie',
  },

  // Comet River System (2 active - replacement WMIP sites for the closed 130504A/130502A)
  {
    // WMIP 130504A (weir inflow) closed; 130504B is Comet River at Comet Weir
    id: '130504B',
    name: 'Comet River @ Comet Weir',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -23.6125,
    lng: 148.5514,
    role: 'Lower Comet',
  },
  {
    // WMIP 130502A is a closed Brown River site; 130506A is Comet River at The Lake
    id: '130506A',
    name: 'Comet River @ The Lake',
    stream: 'Comet River',
    riverSystem: 'comet',
    lat: -24.3115,
    lng: 148.6145,
    role: 'Upper Comet',
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
    lat: -25.1289,
    lng: 151.1307,
    role: 'Upper tributary',
  },
  {
    id: '136103B',
    name: 'Burnett River @ Ceratodus',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.2825,
    lng: 151.1468,
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
    lat: -26.2554,
    lng: 151.3083,
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
    lat: -25.7108,
    lng: 151.8083,
    role: 'Eastern tributary',
  },
  {
    id: '136004A',
    name: 'Burnett River @ Jones Weir',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.5948,
    lng: 151.2964,
    role: 'Below Gayndah',
  },
  {
    id: '136002D',
    name: 'Burnett River @ Mount Lawless',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.5447,
    lng: 151.6549,
    role: 'Above Bundaberg',
  },
  {
    id: '136007A',
    name: 'Burnett River @ Figtree Creek',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -25.2851,
    lng: 151.9895,
    role: 'Bundaberg upstream',
  },
  {
    // Offline: no WMIP gauge at Bundaberg (136016A Town Wharf closed). Bundaberg is only on the BOM flood-warning network (bom.gov.au/qld/flood), which has no API; Water Data Online lags ~1 day
    id: '136001A',
    name: 'Burnett River @ Bundaberg',
    stream: 'Burnett River',
    riverSystem: 'burnett',
    lat: -24.8500,
    lng: 152.3500,
    role: 'Bundaberg city - key flood gauge',
    isOffline: true,
  },

  // ============================================
  // BRISBANE RIVER BASIN
  // ============================================
  {
    id: '143001C',
    name: 'Brisbane River @ Savages Crossing',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.4397,
    lng: 152.6689,
    role: 'Key flood gauge - upstream Brisbane',
  },
  {
    // Offline: Mt Crosby Weir is a Seqwater gauge, not in WMIP (143210A is closed Lockyer Ck at Lyons Bridge). only on the BOM flood-warning network (bom.gov.au/qld/flood), which has no API; Water Data Online lags ~1 day
    id: '143210A',
    name: 'Brisbane River @ Mt Crosby Weir',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.5400,
    lng: 152.7700,
    role: 'Below Wivenhoe Dam',
    isOffline: true,
  },
  {
    // Relabelled: WMIP 143009A is Brisbane River at Gregors Creek (was shown as "Brisbane River @ Moggill", which has no WMIP telemetry)
    id: '143009A',
    name: 'Brisbane River @ Gregors Creek',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -26.9895,
    lng: 152.4052,
    role: 'Upper Brisbane',
  },
  {
    // Relabelled: WMIP 143007A is Brisbane River at Linville (was shown as "Brisbane River @ Jindalee", which has no WMIP telemetry)
    id: '143007A',
    name: 'Brisbane River @ Linville',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -26.8042,
    lng: 152.2730,
    role: 'Upper Brisbane - headwaters',
  },
  {
    // Offline: the Brisbane City gauge (BOM 540198) is only on the BOM flood-warning network (bom.gov.au/qld/flood), which has no API; Water Data Online lags ~1 day. WMIP 143030A is Sandy Ck at Indooroopilly, closed 1999
    id: '143030A',
    name: 'Brisbane River @ City Gauge',
    stream: 'Brisbane River',
    riverSystem: 'brisbane',
    lat: -27.4700,
    lng: 153.0300,
    role: 'Brisbane CBD',
    isOffline: true,
  },

  // Lockyer Creek (Brisbane tributary - flood prone)
  {
    // WMIP 143203A closed; 143203C is Lockyer Creek at Helidon Number 3
    id: '143203C',
    name: 'Lockyer Creek @ Helidon',
    stream: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.5423,
    lng: 152.1145,
    role: 'Upper Lockyer',
  },
  {
    // Relabelled: WMIP 143212A is Tenthill Creek at Tenthill (was shown as "Lockyer Creek @ Gatton", which has no WMIP telemetry)
    id: '143212A',
    name: 'Tenthill Creek @ Tenthill',
    stream: 'Tenthill Creek',
    riverSystem: 'lockyer',
    lat: -27.6343,
    lng: 152.2154,
    role: 'Lockyer tributary',
  },
  {
    // WMIP 143207A (O'Reillys Weir) closed; 143210B Rifle Range Road replaced Lyons Bridge (143210A, closed)
    id: '143210B',
    name: 'Lockyer Creek @ Rifle Range Rd',
    stream: 'Lockyer Creek',
    riverSystem: 'lockyer',
    lat: -27.4536,
    lng: 152.5170,
    role: 'Lower Lockyer',
  },

  // Bremer River (Ipswich area)
  {
    // Relabelled: WMIP 143107A is Bremer River at Walloon (was shown as "Bremer River @ Ipswich", which has no WMIP telemetry)
    id: '143107A',
    name: 'Bremer River @ Walloon',
    stream: 'Bremer River',
    riverSystem: 'bremer',
    lat: -27.6019,
    lng: 152.6940,
    role: 'Above Ipswich',
  },
  {
    // Relabelled: WMIP 143113A is Purga Creek at Loamside (was shown as "Bremer River @ Rosewood", which has no WMIP telemetry)
    id: '143113A',
    name: 'Purga Creek @ Loamside',
    stream: 'Purga Creek',
    riverSystem: 'bremer',
    lat: -27.6830,
    lng: 152.7295,
    role: 'Bremer tributary',
  },
  {
    // 143110A is Bremer River at Adams Bridge; 143108A is Warrill Creek at Amberley
    id: '143108A',
    name: 'Warrill Creek @ Amberley',
    stream: 'Warrill Creek',
    riverSystem: 'bremer',
    lat: -27.6638,
    lng: 152.7000,
    role: 'Bremer tributary',
  },

  // ============================================
  // LOGAN-ALBERT BASIN
  // ============================================
  {
    // Relabelled: WMIP 145008A is Logan River at Round Mtn (was shown as "Logan River @ Beaudesert", which has no WMIP telemetry)
    id: '145008A',
    name: 'Logan River @ Round Mountain',
    stream: 'Logan River',
    riverSystem: 'logan',
    lat: -28.0708,
    lng: 152.9273,
    role: 'Upper Logan',
  },
  {
    // Relabelled: WMIP 145010A is Running Ck at Dieckmans Bridge (was shown as "Logan River @ Waterford", which has no WMIP telemetry)
    id: '145010A',
    name: 'Running Creek @ Dieckmans Bridge',
    stream: 'Running Creek',
    riverSystem: 'logan',
    lat: -28.2453,
    lng: 152.8907,
    role: 'Upper Logan tributary',
  },
  {
    // Relabelled: WMIP 145011A is Teviot Brook at Croftby (was shown as "Logan River @ Maclean Bridge", which has no WMIP telemetry)
    id: '145011A',
    name: 'Teviot Brook @ Croftby',
    stream: 'Teviot Brook',
    riverSystem: 'logan',
    lat: -28.1480,
    lng: 152.5701,
    role: 'Logan tributary',
  },

  {
    // WMIP 145102A (Mundoolun) closed; successor 145102B Bromfleet. Wolffdene (145196A) is closed
    id: '145102B',
    name: 'Albert River @ Bromfleet',
    stream: 'Albert River',
    riverSystem: 'albert',
    lat: -27.9092,
    lng: 153.1065,
    role: 'Lower Albert',
  },
  {
    // Relabelled: WMIP 145107A is Canungra Creek at Main Road Bridge (was shown as "Albert River @ Beaudesert", which has no WMIP telemetry)
    id: '145107A',
    name: 'Canungra Creek @ Main Road Bridge',
    stream: 'Canungra Creek',
    riverSystem: 'albert',
    lat: -27.9976,
    lng: 153.1583,
    role: 'Albert tributary',
  },

  // ============================================
  // GOLD COAST
  // ============================================
  {
    // WMIP 146002A closed; 146002B is Nerang River at Glenhurst
    id: '146002B',
    name: 'Nerang River @ Glenhurst',
    stream: 'Nerang River',
    riverSystem: 'nerang',
    lat: -28.0000,
    lng: 153.3100,
    role: 'Main Nerang gauge',
  },
  {
    // Relabelled: WMIP 146010A is Coomera River at Army Camp (was shown as "Nerang River @ Nerang", which has no WMIP telemetry)
    id: '146010A',
    name: 'Coomera River @ Army Camp',
    stream: 'Coomera River',
    riverSystem: 'coomera',
    lat: -28.0258,
    lng: 153.1928,
    role: 'Upper Coomera',
  },
  {
    // Relabelled: WMIP 146014A is Back Creek at Beechmont (was shown as "Coomera River @ Army Camp", which has no WMIP telemetry)
    id: '146014A',
    name: 'Back Creek @ Beechmont',
    stream: 'Back Creek',
    riverSystem: 'coomera',
    lat: -28.1247,
    lng: 153.1887,
    role: 'Gold Coast hinterland',
  },
  {
    // Relabelled: WMIP 146015A is Nerang River at Numinbah (was shown as "Coomera River @ Oxenford", which has no WMIP telemetry)
    id: '146015A',
    name: 'Nerang River @ Numinbah',
    stream: 'Nerang River',
    riverSystem: 'nerang',
    lat: -28.1492,
    lng: 153.2261,
    role: 'Upper Nerang',
  },

  // ============================================
  // MARY RIVER BASIN
  // ============================================
  {
    // Offline: WMIP 138900A Mary River at Gympie FWG has no telemetry data; Gympie is BOM-only. (138001A, previously used here, is Mary River at Miva)
    id: '138900A',
    name: 'Mary River @ Gympie',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -26.1922,
    lng: 152.6558,
    role: 'Gympie township - key flood gauge',
    isOffline: true,
  },
  {
    // 138014A is Mary River at Home Park; 138001A is Mary River at Miva
    id: '138001A',
    name: 'Mary River @ Miva',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -25.9533,
    lng: 152.4957,
    role: 'Lower Mary',
  },
  {
    // 138110A is Mary River at Bellbird Creek; 138107B is Six Mile Creek at Cooran
    id: '138107B',
    name: 'Six Mile Creek @ Cooran',
    stream: 'Six Mile Creek',
    riverSystem: 'mary',
    lat: -26.3306,
    lng: 152.8137,
    role: 'Mary tributary',
  },
  {
    // 138007A is Mary River at Fishermans Pocket; 138110A is Mary River at Bellbird Creek
    id: '138110A',
    name: 'Mary River @ Bellbird Creek',
    stream: 'Mary River',
    riverSystem: 'mary',
    lat: -26.6274,
    lng: 152.7046,
    role: 'Upper Mary',
  },

  // ============================================
  // BURDEKIN BASIN (TOWNSVILLE REGION)
  // ============================================
  {
    // WMIP 120006A closed in 1976; 120006B is Burdekin River at Clare
    id: '120006B',
    name: 'Burdekin River @ Clare',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -19.7586,
    lng: 147.2436,
    role: 'Key Burdekin gauge',
  },
  {
    // 120014B is not a WMIP site; 120002D is Burdekin River at Sellheim
    id: '120002D',
    name: 'Burdekin River @ Sellheim',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -20.0116,
    lng: 146.4347,
    role: 'Above dam',
  },
  {
    // Offline: WMIP 120001A Burdekin River at Home Hill is closed; no active WMIP gauge at Home Hill
    id: '120001A',
    name: 'Burdekin River @ Home Hill',
    stream: 'Burdekin River',
    riverSystem: 'burdekin',
    lat: -19.6600,
    lng: 147.4100,
    role: 'Near mouth',
    isOffline: true,
  },
  {
    // WMIP 120302A is a closed Cape River site; 119003A is Haughton River at Powerline
    id: '119003A',
    name: 'Haughton River @ Powerline',
    stream: 'Haughton River',
    riverSystem: 'burdekin',
    lat: -19.6331,
    lng: 147.1103,
    role: 'Haughton tributary',
  },

  // Ross River (Townsville city)
  {
    // Offline: Ross River at Aplins Weir (WMIP 118103A) is closed; Townsville gauges are BOM/council only. (119003A, previously used here, is Haughton River at Powerline)
    id: '118103A',
    name: 'Ross River @ Aplin Weir',
    stream: 'Ross River',
    riverSystem: 'ross',
    lat: -19.3089,
    lng: 146.7735,
    role: 'Townsville city - key flood gauge',
    isOffline: true,
  },
  {
    // Offline: 119001A is not a WMIP site; Ross River Dam (WMIP 118104A headwater) is closed
    id: '119001A',
    name: 'Ross River @ Ross River Dam',
    stream: 'Ross River',
    riverSystem: 'ross',
    lat: -19.4200,
    lng: 146.7300,
    role: 'Dam spillway',
    isOffline: true,
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
    // Relabelled: WMIP 116006B is Herbert River at Abergowrie (was shown as "Herbert River @ Halifax", which has no WMIP telemetry)
    id: '116006B',
    name: 'Herbert River @ Abergowrie',
    stream: 'Herbert River',
    riverSystem: 'herbert',
    lat: -18.4890,
    lng: 145.9360,
    role: 'Mid Herbert',
  },
  {
    // Relabelled: WMIP 116015A is Blunder Creek at Wooroora (was shown as "Stone River @ Allingham", which has no WMIP telemetry)
    id: '116015A',
    name: 'Blunder Creek @ Wooroora',
    stream: 'Blunder Creek',
    riverSystem: 'herbert',
    lat: -17.7371,
    lng: 145.4363,
    role: 'Upper Herbert tributary',
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
    lat: -16.7998,
    lng: 145.6121,
    role: 'Above Cairns',
  },
  {
    id: '110003A',
    name: 'Barron River @ Picnic Crossing',
    stream: 'Barron River',
    riverSystem: 'barron',
    lat: -17.2591,
    lng: 145.5386,
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
    // WMIP 111101A is a closed Russell River site; 111005A is Mulgrave River at The Fisheries
    id: '111005A',
    name: 'Mulgrave River @ The Fisheries',
    stream: 'Mulgrave River',
    riverSystem: 'mulgrave',
    lat: -17.1832,
    lng: 145.7248,
    role: 'Upper Mulgrave',
  },

  // Johnstone River (Innisfail)
  {
    // Relabelled: WMIP 112003A is North Johnstone River at Glen Allyn (was shown as "Johnstone River @ Innisfail", which has no WMIP telemetry)
    id: '112003A',
    name: 'North Johnstone River @ Glen Allyn',
    stream: 'North Johnstone River',
    riverSystem: 'johnstone',
    lat: -17.3808,
    lng: 145.6509,
    role: 'Upper North Johnstone',
  },
  {
    id: '112004A',
    name: 'North Johnstone @ Tung Oil',
    stream: 'North Johnstone River',
    riverSystem: 'johnstone',
    lat: -17.5456,
    lng: 145.9325,
    role: 'North branch',
  },

  // ============================================
  // MACKAY / PIONEER BASIN
  // ============================================
  {
    // WMIP 125001A (Pleystowe Mill) closed; 125016A is Dumbleton Weir tailwater
    id: '125016A',
    name: 'Pioneer River @ Dumbleton Weir TW',
    stream: 'Pioneer River',
    riverSystem: 'pioneer',
    lat: -21.1419,
    lng: 149.0761,
    role: 'Mackay city - key flood gauge',
  },
  {
    // Relabelled: WMIP 125013A is Pioneer River at Dumbleton Weir Headwater (was shown as "Pioneer River @ Mirani", which has no WMIP telemetry)
    id: '125013A',
    name: 'Pioneer River @ Dumbleton Weir HW',
    stream: 'Pioneer River',
    riverSystem: 'pioneer',
    lat: -21.1419,
    lng: 149.0758,
    role: 'Mackay - weir headwater',
  },
  {
    // 125006A is Finch Hatton Creek at Gorge Road; 126001A is Sandy Creek at Homebush
    id: '126001A',
    name: 'Sandy Creek @ Homebush',
    stream: 'Sandy Creek',
    riverSystem: 'pioneer',
    lat: -21.2833,
    lng: 149.0225,
    role: 'Pioneer tributary',
  },

  // Proserpine River
  {
    // Relabelled: WMIP 124001B is O'Connell River at Stafford's Crossing (was shown as "Proserpine River @ Glen Isla", which has no WMIP telemetry)
    id: '124001B',
    name: 'O\'Connell River @ Stafford\'s Crossing',
    stream: 'O\'Connell River',
    riverSystem: 'proserpine',
    lat: -20.6526,
    lng: 148.5730,
    role: 'Proserpine area',
  },
  {
    // Relabelled: WMIP 124002A is St.Helens Creek at Calen (was shown as "Proserpine River @ Proserpine", which has no WMIP telemetry)
    id: '124002A',
    name: 'St Helens Creek @ Calen',
    stream: 'St Helens Creek',
    riverSystem: 'proserpine',
    lat: -20.9058,
    lng: 148.7597,
    role: 'Proserpine area',
  },

  // ============================================
  // CONDAMINE-BALONNE (DARLING DOWNS)
  // ============================================
  {
    // 422316A is Condamine River at Cecil Weir; 422310C is Condamine River at Warwick
    id: '422310C',
    name: 'Condamine River @ Warwick',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -28.2143,
    lng: 152.0485,
    role: 'Warwick township',
  },
  {
    // Offline: no WMIP gauge at Dalby (422308B was the old Chinchilla site, closed). Nearest active: 422333A Condamine at Loudouns Bridge, ~9 km upstream
    id: '422308B',
    name: 'Condamine River @ Dalby',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -27.1800,
    lng: 151.2600,
    role: 'Dalby township',
    isOffline: true,
  },
  {
    // Offline: no WMIP gauge on Myall Creek at Dalby (422401B is a closed Maranoa River site)
    id: '422401B',
    name: 'Myall Creek @ Dalby',
    stream: 'Myall Creek',
    riverSystem: 'condamine',
    lat: -27.2000,
    lng: 151.2400,
    role: 'Condamine tributary',
    isOffline: true,
  },
  {
    // WMIP 422310A is a closed Mill Hill site; 422308C is Condamine River at Chinchilla
    id: '422308C',
    name: 'Condamine River @ Chinchilla',
    stream: 'Condamine River',
    riverSystem: 'condamine',
    lat: -26.8001,
    lng: 150.5750,
    role: 'Chinchilla area',
  },

  // ============================================
  // FAR NORTH - TULLY & DAINTREE
  // ============================================
  {
    // Relabelled: WMIP 113006A is Tully River at Euramo (was shown as "Tully River @ Tully", which has no WMIP telemetry)
    id: '113006A',
    name: 'Tully River @ Euramo',
    stream: 'Tully River',
    riverSystem: 'tully',
    lat: -17.9921,
    lng: 145.9425,
    role: 'Lower Tully - key flood gauge',
  },
  {
    // Relabelled: WMIP 113004A is Cochable Creek at Powerline (was shown as "Tully River @ Euramo", which has no WMIP telemetry)
    id: '113004A',
    name: 'Cochable Creek @ Powerline',
    stream: 'Cochable Creek',
    riverSystem: 'tully',
    lat: -17.7396,
    lng: 145.6301,
    role: 'Tully tributary',
  },
  {
    id: '108002A',
    name: 'Daintree River @ Bairds',
    stream: 'Daintree River',
    riverSystem: 'daintree',
    lat: -16.1796,
    lng: 145.2819,
    role: 'Mid Daintree',
  },
  {
    // Relabelled: WMIP 108003A is Bloomfield River at China Camp (was shown as "Daintree River @ Upper Daintree", which has no WMIP telemetry)
    id: '108003A',
    name: 'Bloomfield River @ China Camp',
    stream: 'Bloomfield River',
    riverSystem: 'daintree',
    lat: -15.9852,
    lng: 145.2874,
    role: 'North of Daintree',
  },

  // ============================================
  // WESTERN QUEENSLAND
  // ============================================
  {
    // Offline: Julius Dam gauges (WMIP 913015A/B) are closed; 915010A is a closed Dutton River site
    id: '915010A',
    name: 'Leichhardt River @ Julius Dam',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.1500,
    lng: 139.7300,
    role: 'Dam spillway',
    isOffline: true,
  },
  {
    // Offline: Lake Moondarra gauge (WMIP 913002A) is closed; 915001A is an unrelated closed site
    id: '915001A',
    name: 'Leichhardt River @ Moondarra',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -20.5800,
    lng: 139.5500,
    role: 'Lake Moondarra',
    isOffline: true,
  },
  {
    // 915101A is not a WMIP site; 913007B is Leichhardt River at Floraville Homestead
    id: '913007B',
    name: 'Leichhardt River @ Floraville',
    stream: 'Leichhardt River',
    riverSystem: 'leichhardt',
    lat: -18.2330,
    lng: 139.8787,
    role: 'Lower Leichhardt',
  },
  {
    // 914101A is not a WMIP site; 915203C is Cloncurry River at Hensley Drive, Cloncurry
    id: '915203C',
    name: 'Cloncurry River @ Cloncurry',
    stream: 'Cloncurry River',
    riverSystem: 'cloncurry',
    lat: -20.6812,
    lng: 140.4984,
    role: 'Cloncurry township',
  },
  {
    // 912101A is Gregory River at Gregory Downs; 915008A is Flinders River at Richmond
    id: '915008A',
    name: 'Flinders River @ Richmond',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -20.6980,
    lng: 143.1338,
    role: 'Richmond township',
  },
  {
    // Offline: Flinders River at Hughenden (WMIP 915004A) is closed. (912105A, previously used here, is Gregory River at Riversleigh No.2, 600 km away)
    id: '915004A',
    name: 'Flinders River @ Hughenden',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -20.8307,
    lng: 144.1853,
    role: 'Hughenden township',
    isOffline: true,
  },
  {
    // 912001A is not a WMIP site; 915003A is Flinders River at Walkers Bend
    id: '915003A',
    name: 'Flinders River @ Walkers Bend',
    stream: 'Flinders River',
    riverSystem: 'flinders',
    lat: -18.1617,
    lng: 140.8582,
    role: 'Lower Flinders',
  },

  // ============================================
  // MACKAY - BROKEN RIVER
  // ============================================
  {
    // Offline: Eungella Dam gauges (WMIP 120211A/B, 120215A/B) are closed; 125101A is not a WMIP site
    id: '125101A',
    name: 'Broken River @ Eungella',
    stream: 'Broken River',
    riverSystem: 'broken',
    lat: -21.1700,
    lng: 148.4800,
    role: 'Eungella Dam spillway',
    isOffline: true,
  },
  {
    // 125102A is not a WMIP site and Crediton (120204A/B) is closed; 120216A Old Racecourse is the active gauge below Eungella Dam
    id: '120216A',
    name: 'Broken River @ Old Racecourse',
    stream: 'Broken River',
    riverSystem: 'broken',
    lat: -21.1943,
    lng: 148.4478,
    role: 'Below Eungella Dam',
  },

  // ============================================
  // SUNSHINE COAST - MOOLOOLAH
  // ============================================
  {
    // 141009A is North Maroochy River at Eumundi; 141006A is Mooloolah River at Mooloolah
    id: '141006A',
    name: 'Mooloolah River @ Mooloolah',
    stream: 'Mooloolah River',
    riverSystem: 'mooloolah',
    lat: -26.7614,
    lng: 152.9822,
    role: 'Mooloolah township',
  },

  // ============================================
  // NORTH PINE
  // ============================================
  {
    // Offline: North Pine River at Youngs Crossing (WMIP 142101A) is closed; 142012A is not a WMIP site
    id: '142012A',
    name: 'North Pine River @ Young Crossing',
    stream: 'North Pine River',
    riverSystem: 'northpine',
    lat: -27.3000,
    lng: 152.8800,
    role: 'Above North Pine Dam',
    isOffline: true,
  },

  // ============================================
  // CHANNEL COUNTRY / OUTBACK
  // ============================================
  // Cooper Creek (Lake Eyre Basin)
  {
    // Relabelled: WMIP 003103A is Cooper Creek at Nappa Merrie (was shown as "Cooper Creek @ Windorah", which has no WMIP telemetry)
    id: '003103A',
    name: 'Cooper Creek @ Nappa Merrie',
    stream: 'Cooper Creek',
    riverSystem: 'cooper',
    lat: -27.5967,
    lng: 141.1061,
    role: 'Lower Cooper - near SA border',
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
    // WMIP 003301A is the closed Barcoo at Retreat site; 003303A is Barcoo River at Blackall
    id: '003303A',
    name: 'Barcoo River @ Blackall',
    stream: 'Barcoo River',
    riverSystem: 'cooper',
    lat: -24.4267,
    lng: 145.4583,
    role: 'Barcoo tributary',
  },

  // Diamantina River
  {
    // Offline: Diamantina River at Birdsville (WMIP 002101A/B) is closed
    id: '002101A',
    name: 'Diamantina River @ Birdsville',
    stream: 'Diamantina River',
    riverSystem: 'diamantina',
    lat: -25.9000,
    lng: 139.3500,
    role: 'Birdsville township',
    isOffline: true,
  },
  {
    // Offline: Diamantina River at Monkira (WMIP 002103A) is closed
    id: '002103A',
    name: 'Diamantina River @ Monkira',
    stream: 'Diamantina River',
    riverSystem: 'diamantina',
    lat: -24.8500,
    lng: 140.5500,
    role: 'Mid Diamantina',
    isOffline: true,
  },

  // Warrego River
  {
    // Offline: Warrego River at Charleville (WMIP 423201A) is closed; 423001A is not a WMIP site
    id: '423001A',
    name: 'Warrego River @ Charleville',
    stream: 'Warrego River',
    riverSystem: 'warrego',
    lat: -26.4000,
    lng: 146.2500,
    role: 'Charleville township - key flood gauge',
    isOffline: true,
  },
  {
    // 423203A is Warrego River at Wyandra (96 km north); 423202C is Warrego River at Cunnamulla Weir
    id: '423202C',
    name: 'Warrego River @ Cunnamulla',
    stream: 'Warrego River',
    riverSystem: 'warrego',
    lat: -28.1169,
    lng: 145.6866,
    role: 'Cunnamulla township',
  },

  // Paroo River
  {
    id: '424201A',
    name: 'Paroo River @ Caiwarro',
    stream: 'Paroo River',
    riverSystem: 'paroo',
    lat: -28.6895,
    lng: 144.7863,
    role: 'Mid Paroo',
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
    // Offline: no WMIP gauge at Kowanyama (919009A is the closed Koolatah site, replaced by 919009B Dunbar)
    id: '919009A',
    name: 'Mitchell River @ Kowanyama',
    stream: 'Mitchell River',
    riverSystem: 'mitchell',
    lat: -15.4800,
    lng: 141.7500,
    role: 'Lower Mitchell - near mouth',
    isOffline: true,
  },
  {
    // 919201A is Palmer River at Goldfields; 919009B Dunbar replaced the Koolatah gauge (919009A, ~1 km away)
    id: '919009B',
    name: 'Mitchell River @ Dunbar (Koolatah)',
    stream: 'Mitchell River',
    riverSystem: 'mitchell',
    lat: -15.9424,
    lng: 142.3743,
    role: 'Mid Mitchell',
  },
  {
    // WMIP 919301A (Dimbulah) closed; 919305C is Walsh River at Nullinga
    id: '919305C',
    name: 'Walsh River @ Nullinga',
    stream: 'Walsh River',
    riverSystem: 'mitchell',
    lat: -17.1767,
    lng: 145.3026,
    role: 'Mitchell tributary',
  },

  // Normanby River
  {
    // WMIP 106001A is a closed McIvor River site; 105107A is Normanby River at Kalpowar Crossing
    id: '105107A',
    name: 'Normanby River @ Kalpowar',
    stream: 'Normanby River',
    riverSystem: 'normanby',
    lat: -14.9168,
    lng: 144.2113,
    role: 'Lower Normanby',
  },
  {
    // WMIP 106002A is a closed Jeannie River site; 105101A is Normanby River at Battle Camp
    id: '105101A',
    name: 'Normanby River @ Battle Camp',
    stream: 'Normanby River',
    riverSystem: 'normanby',
    lat: -15.2816,
    lng: 144.8387,
    role: 'Mid Normanby',
  },

  // ============================================
  // GULF COUNTRY
  // ============================================
  // Norman River
  {
    // Offline: no WMIP gauge at Normanton (917101A is a closed Etheridge River site)
    id: '917101A',
    name: 'Norman River @ Normanton',
    stream: 'Norman River',
    riverSystem: 'norman',
    lat: -17.6700,
    lng: 141.0700,
    role: 'Normanton township',
    isOffline: true,
  },
  {
    // 917201A is not a WMIP site; 916001B is Norman River at Glenore Weir
    id: '916001B',
    name: 'Norman River @ Glenore',
    stream: 'Norman River',
    riverSystem: 'norman',
    lat: -17.8600,
    lng: 141.1287,
    role: 'Upper Norman',
  },

  // ============================================
  // BOWEN AREA
  // ============================================
  // Don River
  {
    // Relabelled: WMIP 121001A is Don River at Ida Creek (was shown as "Don River @ Bowen", which has no WMIP telemetry)
    id: '121001A',
    name: 'Don River @ Ida Creek',
    stream: 'Don River',
    riverSystem: 'don',
    lat: -20.2888,
    lng: 148.1174,
    role: 'Lower Don',
  },
  {
    // Relabelled: WMIP 121002A is Elliot River at Guthalungra (was shown as "Don River @ Euri Creek", which has no WMIP telemetry)
    id: '121002A',
    name: 'Elliot River @ Guthalungra',
    stream: 'Elliot River',
    riverSystem: 'don',
    lat: -19.9333,
    lng: 147.8407,
    role: 'Bowen area',
  },
]

/**
 * Gauge IDs that were removed from GAUGE_STATIONS when station IDs were corrected
 * against the WMIP site table (Oct 2026), mapped to the entry that replaced them.
 * Lets old shared links (/gauge/{oldId}) and saved selections resolve.
 */
export const GAUGE_ID_ALIASES: Record<string, string> = {
  '130504A': '130504B',
  '130502A': '130506A',
  '143203A': '143203C',
  '143207A': '143210B',
  '143110A': '143108A',
  '145102A': '145102B',
  '146002A': '146002B',
  '138014A': '138001A',
  '138007A': '138110A',
  '120006A': '120006B',
  '120014B': '120002D',
  '120302A': '119003A',
  '111101A': '111005A',
  '125001A': '125016A',
  '125006A': '126001A',
  '422316A': '422310C',
  '422310A': '422308C',
  '915101A': '913007B',
  '914101A': '915203C',
  '912101A': '915008A',
  '912105A': '915004A',
  '912001A': '915003A',
  '125102A': '120216A',
  '141009A': '141006A',
  '003301A': '003303A',
  '423203A': '423202C',
  '919201A': '919009B',
  '919301A': '919305C',
  '106001A': '105107A',
  '106002A': '105101A',
  '917201A': '916001B',
}

// Old gauge IDs (shared links, saved selections) resolve to their replacement station
export function resolveGaugeId(id: string): string {
  return GAUGE_ID_ALIASES[id] ?? id
}

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

// River main-stem polylines for the map overlay: one line per river system, ordered upstream -> downstream.
// Geometry: Queensland Government Watercourse lines (Hydrographic features - Queensland series),
// © State of Queensland (Department of Natural Resources and Mines, Manufacturing and Regional and Rural
// Development), CC BY 4.0. Each line follows the named watercourse's longest flow path, Douglas-Peucker
// simplified (~0.35 km tolerance for short rivers, ~1 km for long inland rivers). A tributary's last point is
// the same vertex as its parent's line at the mapped confluence. Lines stop at the state border.
export const RIVER_PATHS: Record<RiverSystem, [number, number][]> = {
  // Sandy Creek: rises W of Clermont, through Clermont (Wolfang Ck joins in town, Douglas Ck to the SE), then SE to Theresa Ck near Valeria. QLD watercourse lines
  clermont: [
    [-22.7274, 147.4774], [-22.7597, 147.4702], [-22.7785, 147.4816], [-22.7734, 147.5048],
    [-22.7628, 147.5180], [-22.7662, 147.5279], [-22.7787, 147.5355], [-22.7837, 147.5668],
    [-22.7873, 147.5668], [-22.7881, 147.5723], [-22.8136, 147.5866], [-22.8162, 147.5937],
    [-22.8279, 147.5949], [-22.8189, 147.6292], [-22.8115, 147.6329], [-22.8155, 147.6345],
    [-22.8043, 147.6547], [-22.8096, 147.6570], [-22.8061, 147.6652], [-22.8158, 147.6829],
    [-22.8162, 147.6933], [-22.8251, 147.6923], [-22.8340, 147.6974], [-22.8370, 147.7041],
    [-22.8548, 147.7127], [-22.9137, 147.6937], [-22.9325, 147.7034], [-22.9574, 147.7432],
    [-22.9718, 147.7542], [-22.9914, 147.7647], [-23.0380, 147.7741], [-23.0525, 147.7882],
    [-23.1041, 147.8121], [-23.1065, 147.8204], [-23.1141, 147.8268], [-23.1194, 147.8411],
    [-23.1154, 147.8563], [-23.1363, 147.8696], [-23.1453, 147.8825], [-23.1486, 147.8945],
    [-23.1744, 147.8991], [-23.1827, 147.8914],
  ],
  // Theresa Creek: rises SW of Clermont, N then SE past Valeria and the Gregory Hwy to the Nogoa River E of Emerald. QLD watercourse lines
  theresa: [
    [-23.4655, 147.2629], [-23.3916, 147.2714], [-23.3585, 147.3109], [-23.3352, 147.3072],
    [-23.3211, 147.3287], [-23.3021, 147.3223], [-23.2490, 147.3390], [-23.2199, 147.3147],
    [-23.1991, 147.3234], [-23.1869, 147.3382], [-23.1942, 147.3476], [-23.1822, 147.3640],
    [-23.1898, 147.3760], [-23.1838, 147.3904], [-23.1039, 147.4375], [-23.0901, 147.4782],
    [-23.0460, 147.4842], [-23.0207, 147.5223], [-23.0174, 147.5511], [-22.9614, 147.5690],
    [-22.9619, 147.5814], [-22.9793, 147.5873], [-22.9751, 147.5974], [-22.9821, 147.6102],
    [-23.0033, 147.6276], [-23.0203, 147.6177], [-23.0293, 147.6370], [-23.0650, 147.6273],
    [-23.0758, 147.6482], [-23.0959, 147.6464], [-23.1190, 147.6718], [-23.1267, 147.6910],
    [-23.1173, 147.7097], [-23.1370, 147.7339], [-23.1164, 147.7889], [-23.1328, 147.8182],
    [-23.1434, 147.8240], [-23.1456, 147.8390], [-23.1624, 147.8526], [-23.1654, 147.8768],
    [-23.1866, 147.8884], [-23.1827, 147.8914], [-23.1831, 147.8919], [-23.2045, 147.9110],
    [-23.2112, 147.9431], [-23.2319, 147.9537], [-23.2299, 147.9738], [-23.2409, 147.9967],
    [-23.2373, 148.0117], [-23.2468, 148.0179], [-23.2464, 148.0331], [-23.2829, 148.0297],
    [-23.2910, 148.0420], [-23.3195, 148.0512], [-23.3245, 148.0366], [-23.3725, 148.0445],
    [-23.3802, 148.0605], [-23.3921, 148.0620], [-23.3935, 148.0800], [-23.4126, 148.1037],
    [-23.4117, 148.1369], [-23.4294, 148.1506], [-23.4380, 148.1790], [-23.4316, 148.2271],
    [-23.4383, 148.2335], [-23.4418, 148.2574], [-23.4524, 148.2743],
  ],
  // Wolfang Creek: from the NE into Sandy Creek at Clermont. QLD watercourse lines
  wolfang: [
    [-22.5612, 147.8795], [-22.5665, 147.8781], [-22.5669, 147.8750], [-22.5633, 147.8687],
    [-22.5671, 147.8520], [-22.5657, 147.8517], [-22.5651, 147.8464], [-22.5708, 147.8382],
    [-22.5800, 147.8359], [-22.5826, 147.8299], [-22.5899, 147.8307], [-22.5965, 147.8377],
    [-22.6193, 147.8279], [-22.6219, 147.8161], [-22.6270, 147.8135], [-22.6282, 147.7953],
    [-22.6463, 147.7832], [-22.6478, 147.7564], [-22.6541, 147.7359], [-22.6806, 147.7216],
    [-22.6792, 147.7128], [-22.6921, 147.6948], [-22.7176, 147.6763], [-22.7445, 147.6678],
    [-22.7545, 147.6464], [-22.7644, 147.6442], [-22.7696, 147.6345], [-22.8011, 147.6239],
    [-22.8101, 147.6283], [-22.8091, 147.6320], [-22.8115, 147.6329],
  ],
  // Douglas Creek: from the W into Sandy Creek SE of Clermont. QLD watercourse lines
  douglas: [
    [-22.9329, 147.4138], [-22.9287, 147.4298], [-22.9326, 147.4308], [-22.9322, 147.4350],
    [-22.9368, 147.4356], [-22.9348, 147.4406], [-22.9409, 147.4472], [-22.9412, 147.4525],
    [-22.9436, 147.4549], [-22.9416, 147.4574], [-22.9501, 147.4679], [-22.9463, 147.4709],
    [-22.9447, 147.4812], [-22.9469, 147.4806], [-22.9476, 147.4841], [-22.9433, 147.4882],
    [-22.9455, 147.4930], [-22.9402, 147.4996], [-22.9393, 147.5056], [-22.9412, 147.5070],
    [-22.9340, 147.5100], [-22.9323, 147.5192], [-22.9211, 147.5322], [-22.9187, 147.5482],
    [-22.9014, 147.5633], [-22.8860, 147.5928], [-22.8868, 147.5963], [-22.8928, 147.6013],
    [-22.8933, 147.6102], [-22.8961, 147.6122], [-22.8937, 147.6175], [-22.8992, 147.6215],
    [-22.9121, 147.6204], [-22.9112, 147.6246], [-22.9194, 147.6266], [-22.9181, 147.6302],
    [-22.9221, 147.6338], [-22.9219, 147.6396], [-22.9262, 147.6406], [-22.9212, 147.6597],
    [-22.9141, 147.6618], [-22.9123, 147.6687], [-22.9102, 147.6776], [-22.9123, 147.6814],
    [-22.9097, 147.6810], [-22.9146, 147.6859], [-22.9137, 147.6937],
  ],
  // Isaac River: headwaters N of Moranbah, past Deverill and Yatton to the Mackenzie River (Connors River joins near Yatton; not drawn). QLD watercourse lines
  isaac: [
    [-21.4513, 148.1944], [-21.4733, 148.1929], [-21.5453, 148.1408], [-21.6159, 148.1366],
    [-21.6261, 148.1042], [-21.6695, 148.0624], [-21.7002, 148.0652], [-21.6997, 148.0487],
    [-21.7308, 148.0167], [-21.7782, 148.0215], [-21.7967, 147.9971], [-21.8387, 147.9937],
    [-21.8657, 147.9682], [-21.9241, 148.0227], [-21.9567, 148.0249], [-21.9612, 148.0439],
    [-21.9716, 148.0488], [-21.9735, 148.0662], [-22.0057, 148.0999], [-22.0195, 148.0981],
    [-22.0286, 148.1246], [-22.0366, 148.1155], [-22.0505, 148.1314], [-22.0380, 148.1665],
    [-22.0719, 148.1875], [-22.0741, 148.2015], [-22.0885, 148.2185], [-22.0899, 148.2361],
    [-22.1124, 148.2637], [-22.1263, 148.2983], [-22.1479, 148.3034], [-22.1459, 148.3207],
    [-22.1538, 148.3314], [-22.1486, 148.3443], [-22.1656, 148.3522], [-22.1715, 148.3835],
    [-22.1894, 148.3882], [-22.2052, 148.4134], [-22.2337, 148.4109], [-22.2353, 148.4295],
    [-22.2591, 148.4278], [-22.2717, 148.4404], [-22.2750, 148.4689], [-22.3280, 148.4793],
    [-22.3373, 148.4664], [-22.3553, 148.4934], [-22.3562, 148.5089], [-22.3693, 148.5045],
    [-22.3968, 148.5233], [-22.4077, 148.5409], [-22.4503, 148.5567], [-22.4555, 148.6083],
    [-22.4441, 148.6576], [-22.4277, 148.6665], [-22.4243, 148.6941], [-22.4032, 148.7245],
    [-22.4054, 148.7765], [-22.3932, 148.8091], [-22.3999, 148.8249], [-22.3896, 148.8296],
    [-22.4041, 148.8727], [-22.4172, 148.8777], [-22.4187, 148.8953], [-22.4296, 148.9026],
    [-22.4203, 148.9216], [-22.4296, 148.9188], [-22.4335, 148.9321], [-22.4497, 148.9380],
    [-22.5006, 148.9254], [-22.5082, 148.9358], [-22.5170, 148.9321], [-22.5190, 148.9437],
    [-22.5293, 148.9521], [-22.5586, 148.9542], [-22.5920, 148.9755], [-22.6060, 148.9894],
    [-22.6204, 149.0159], [-22.6134, 149.0352], [-22.6346, 149.0425], [-22.6495, 149.0588],
    [-22.6569, 149.0912], [-22.6487, 149.1126], [-22.6559, 149.1143], [-22.6771, 149.1233],
    [-22.6816, 149.1477], [-22.6928, 149.1588], [-22.6985, 149.1812], [-22.7257, 149.1869],
    [-22.7359, 149.2136], [-22.7426, 149.2086], [-22.7498, 149.2223], [-22.7876, 149.2524],
    [-22.7884, 149.2673], [-22.8101, 149.2718], [-22.8282, 149.2977], [-22.8600, 149.3101],
    [-22.8591, 149.3307], [-22.8813, 149.3390],
  ],
  // Nogoa River: headwaters, Craigmore, Fairbairn Dam, Emerald, Duck Ponds; meets the Comet to form the Mackenzie. QLD watercourse lines
  nogoa: [
    [-24.6049, 147.2370], [-24.5347, 147.3261], [-24.5145, 147.3298], [-24.4928, 147.3150],
    [-24.4628, 147.3176], [-24.4211, 147.3021], [-24.4079, 147.3078], [-24.3889, 147.3634],
    [-24.3439, 147.3591], [-24.3482, 147.3762], [-24.3176, 147.3892], [-24.3284, 147.4063],
    [-24.3236, 147.4260], [-24.3317, 147.4428], [-24.3038, 147.4640], [-24.2986, 147.4955],
    [-24.3054, 147.5206], [-24.2456, 147.5683], [-24.2539, 147.5968], [-24.2397, 147.6022],
    [-24.2472, 147.6188], [-24.2462, 147.6419], [-24.2134, 147.6575], [-24.1865, 147.6919],
    [-24.1864, 147.7219], [-24.1648, 147.7214], [-24.1652, 147.7448], [-24.1530, 147.7562],
    [-24.0953, 147.7437], [-24.0675, 147.7638], [-24.0390, 147.7534], [-24.0052, 147.7680],
    [-23.9948, 147.7912], [-23.9729, 147.7804], [-23.9756, 147.7562], [-23.9372, 147.7310],
    [-23.9226, 147.7430], [-23.9084, 147.7278], [-23.8978, 147.7556], [-23.8845, 147.7555],
    [-23.8623, 147.7539], [-23.8531, 147.7683], [-23.8720, 147.7833], [-23.9040, 147.7884],
    [-23.8950, 147.8076], [-23.8670, 147.8196], [-23.8592, 147.8054], [-23.8431, 147.8063],
    [-23.8400, 147.8246], [-23.8165, 147.8215], [-23.8051, 147.8455], [-23.7618, 147.8407],
    [-23.7264, 147.8538], [-23.7269, 147.8765], [-23.6832, 147.8898], [-23.6875, 147.9231],
    [-23.7007, 147.9309], [-23.6662, 148.0042], [-23.7041, 148.0305], [-23.7021, 148.0553],
    [-23.6623, 148.0577], [-23.6176, 148.0982], [-23.5972, 148.0882], [-23.5785, 148.0994],
    [-23.5623, 148.1374], [-23.5053, 148.1797], [-23.5030, 148.1868], [-23.5130, 148.2071],
    [-23.4944, 148.2482], [-23.4524, 148.2743], [-23.4220, 148.3734], [-23.4246, 148.4032],
    [-23.4356, 148.4250], [-23.4330, 148.4482], [-23.4819, 148.4735], [-23.4976, 148.4853],
    [-23.4905, 148.5081], [-23.5031, 148.5216], [-23.5491, 148.5251], [-23.5560, 148.5365],
  ],
  // Mackenzie River: Nogoa-Comet junction, Rileys Crossing, Bingegang, Isaac junction, Coolmaringa, to the Dawson junction (Fitzroy). QLD watercourse lines
  mackenzie: [
    [-23.5560, 148.5365], [-23.5521, 148.5714], [-23.5313, 148.5804], [-23.5432, 148.5925],
    [-23.5408, 148.6045], [-23.5108, 148.6342], [-23.4762, 148.6354], [-23.4761, 148.6545],
    [-23.4372, 148.7045], [-23.4314, 148.7055], [-23.4283, 148.6843], [-23.4198, 148.6724],
    [-23.3871, 148.7127], [-23.3529, 148.7120], [-23.3479, 148.7368], [-23.3815, 148.7542],
    [-23.3751, 148.7745], [-23.3508, 148.7802], [-23.3527, 148.7972], [-23.3624, 148.7993],
    [-23.3800, 148.8261], [-23.3569, 148.8659], [-23.3180, 148.8686], [-23.2869, 148.8449],
    [-23.2653, 148.8562], [-23.2476, 148.8805], [-23.2565, 148.8871], [-23.2653, 148.9167],
    [-23.2451, 148.9268], [-23.2429, 148.9468], [-23.2089, 148.9528], [-23.1952, 148.9853],
    [-23.1655, 149.0069], [-23.1495, 149.0062], [-23.1427, 148.9879], [-23.1288, 148.9912],
    [-23.1253, 148.9734], [-23.0974, 148.9730], [-23.0765, 149.0317], [-23.0579, 149.0459],
    [-23.0558, 149.1122], [-23.0625, 149.1268], [-23.0510, 149.1988], [-22.9755, 149.2400],
    [-22.9620, 149.2759], [-22.8813, 149.3390], [-22.8772, 149.3675], [-22.8954, 149.3815],
    [-22.8975, 149.4036], [-22.9562, 149.4217], [-22.9944, 149.4124], [-23.0038, 149.4285],
    [-23.0296, 149.4378], [-23.0603, 149.4871], [-23.0873, 149.4924], [-23.1076, 149.4782],
    [-23.1218, 149.5022], [-23.2009, 149.4933], [-23.1874, 149.5463], [-23.2062, 149.5687],
    [-23.2508, 149.5421], [-23.2785, 149.5054], [-23.3184, 149.5250], [-23.3387, 149.5242],
    [-23.3528, 149.4976], [-23.3841, 149.5112], [-23.3945, 149.5761], [-23.4158, 149.5697],
    [-23.4373, 149.5807], [-23.4541, 149.6115], [-23.5111, 149.6189], [-23.5049, 149.6533],
    [-23.5328, 149.6573], [-23.5302, 149.6940], [-23.5361, 149.6988], [-23.5344, 149.7057],
    [-23.5409, 149.7071], [-23.5472, 149.7291], [-23.6193, 149.7505], [-23.6280, 149.7583],
    [-23.6270, 149.7678],
  ],
  // Comet River: headwaters S of The Lake, past Comet Weir to the Nogoa-Mackenzie junction. QLD watercourse lines
  comet: [
    [-24.7274, 148.7241], [-24.6757, 148.7390], [-24.6420, 148.7163], [-24.5953, 148.7227],
    [-24.5892, 148.7121], [-24.5922, 148.6879], [-24.5752, 148.6483], [-24.5555, 148.6353],
    [-24.4875, 148.6427], [-24.4634, 148.6159], [-24.4297, 148.6213], [-24.4129, 148.5955],
    [-24.3689, 148.6178], [-24.3118, 148.6143], [-24.2897, 148.6227], [-24.2761, 148.6089],
    [-24.2538, 148.6085], [-24.2539, 148.5982], [-24.2309, 148.5806], [-24.2002, 148.5740],
    [-24.1849, 148.5981], [-24.1649, 148.5899], [-24.1601, 148.5781], [-24.1381, 148.5615],
    [-24.1067, 148.5607], [-24.0946, 148.5337], [-24.0672, 148.5464], [-24.0405, 148.5221],
    [-23.9997, 148.5306], [-23.9883, 148.5066], [-23.9765, 148.5005], [-23.9102, 148.5257],
    [-23.9011, 148.5178], [-23.9027, 148.5081], [-23.8948, 148.4986], [-23.8702, 148.5168],
    [-23.8573, 148.5049], [-23.7653, 148.5222], [-23.7041, 148.5095], [-23.6914, 148.5360],
    [-23.6437, 148.5599], [-23.6128, 148.5523], [-23.6189, 148.5316], [-23.6039, 148.5235],
    [-23.5975, 148.5377], [-23.5560, 148.5365],
  ],
  // Fitzroy River: Mackenzie-Dawson junction, The Gap, Rockhampton, to Keppel Bay. QLD watercourse lines
  fitzroy: [
    [-23.6270, 149.7678], [-23.5903, 149.8199], [-23.5759, 149.8782], [-23.5862, 149.8967],
    [-23.6304, 149.9118], [-23.6454, 149.9324], [-23.5651, 149.9414], [-23.5536, 149.9579],
    [-23.5515, 150.0155], [-23.5225, 150.0001], [-23.5187, 149.9751], [-23.5141, 149.9743],
    [-23.4638, 150.0284], [-23.4437, 149.9615], [-23.4061, 149.9573], [-23.4134, 149.9130],
    [-23.3848, 149.9148], [-23.3564, 149.9278], [-23.3167, 149.8833], [-23.3176, 149.9201],
    [-23.2247, 149.9595], [-23.2106, 149.9155], [-23.1743, 149.9229], [-23.1327, 149.8955],
    [-23.1086, 149.8659], [-23.0928, 149.8708], [-23.0796, 149.8861], [-23.0962, 149.9019],
    [-23.0971, 149.9209], [-23.0595, 149.9405], [-23.0769, 149.9611], [-23.0853, 149.9984],
    [-23.0727, 150.0234], [-23.0441, 150.0323], [-23.0344, 150.0638], [-23.0483, 150.0779],
    [-23.0846, 150.0661], [-23.0953, 150.1319], [-23.1256, 150.1361], [-23.1455, 150.1620],
    [-23.1077, 150.2154], [-23.1119, 150.2484], [-23.1377, 150.2962], [-23.1430, 150.3851],
    [-23.1799, 150.3844], [-23.1913, 150.4031], [-23.2473, 150.3424], [-23.2647, 150.3590],
    [-23.2662, 150.3681], [-23.2406, 150.3981], [-23.2449, 150.4212], [-23.3152, 150.4516],
    [-23.3380, 150.4477], [-23.3174, 150.4802], [-23.3589, 150.4932], [-23.3923, 150.5301],
    [-23.3808, 150.5582], [-23.4447, 150.6033], [-23.4577, 150.6262], [-23.4844, 150.6348],
    [-23.4887, 150.6587], [-23.5036, 150.6686], [-23.5035, 150.7012],
  ],
  // Burnett River: headwaters NE of Monto, Ceratodus, Eidsvold, Jones Weir, Gayndah, Mount Lawless, Figtree Creek, Bundaberg, Burnett Heads. QLD watercourse lines
  burnett: [
    [-24.9314, 151.5716], [-24.9277, 151.5504], [-24.8819, 151.5536], [-24.8690, 151.4689],
    [-24.9658, 151.3784], [-24.9621, 151.3458], [-25.0139, 151.3534], [-25.1271, 151.3094],
    [-25.1234, 151.2820], [-25.1421, 151.2705], [-25.1276, 151.2388], [-25.1629, 151.1990],
    [-25.1860, 151.1880], [-25.2056, 151.2117], [-25.2181, 151.1622], [-25.2815, 151.1458],
    [-25.2813, 151.1290], [-25.2657, 151.1198], [-25.2867, 151.0448], [-25.3147, 151.0749],
    [-25.3617, 151.0706], [-25.3644, 151.0842], [-25.3875, 151.0806], [-25.4042, 151.1036],
    [-25.4457, 151.1215], [-25.4436, 151.1679], [-25.4546, 151.1893], [-25.5267, 151.2165],
    [-25.5480, 151.1837], [-25.6057, 151.1978], [-25.6192, 151.1776], [-25.6322, 151.2223],
    [-25.5940, 151.2957], [-25.6072, 151.3194], [-25.5932, 151.3696], [-25.6109, 151.3853],
    [-25.5973, 151.4012], [-25.6217, 151.4306], [-25.6023, 151.4920], [-25.6265, 151.5145],
    [-25.6115, 151.5628], [-25.6272, 151.6190], [-25.6160, 151.6347], [-25.5873, 151.6141],
    [-25.5860, 151.6555], [-25.5478, 151.6567], [-25.5279, 151.6794], [-25.4599, 151.6630],
    [-25.3956, 151.6881], [-25.3961, 151.7808], [-25.3284, 151.8157], [-25.3515, 151.8560],
    [-25.3405, 151.8793], [-25.3603, 151.8803], [-25.3560, 151.9125], [-25.2935, 151.9496],
    [-25.2849, 151.9886], [-25.2936, 152.0054], [-25.2803, 152.0145], [-25.1363, 151.9819],
    [-25.0785, 151.9982], [-25.0883, 152.0395], [-25.0596, 152.0293], [-25.0368, 152.0661],
    [-25.0561, 152.0869], [-25.0543, 152.0949], [-25.0286, 152.1089], [-24.9730, 152.0911],
    [-24.9667, 152.1439], [-24.9969, 152.1761], [-24.9704, 152.1990], [-24.9402, 152.1836],
    [-24.9402, 152.2559], [-24.9128, 152.2338], [-24.8906, 152.2408], [-24.8976, 152.2818],
    [-24.8644, 152.3016], [-24.8576, 152.3629], [-24.8037, 152.3589], [-24.7557, 152.3997],
  ],

  // ============================================
  // BRISBANE BASIN
  // ============================================
  // Brisbane River: headwaters N of Linville, Gregors Creek, Lake Wivenhoe, Savages Crossing, Ipswich reach, city, Moreton Bay. QLD watercourse lines
  brisbane: [
    [-26.6686, 152.2000], [-26.6680, 152.2055], [-26.6868, 152.2095], [-26.7018, 152.1973],
    [-26.7100, 152.2095], [-26.7226, 152.1987], [-26.7286, 152.2155], [-26.7402, 152.2066],
    [-26.7433, 152.2241], [-26.7621, 152.2273], [-26.7486, 152.2383], [-26.7628, 152.2374],
    [-26.7642, 152.2540], [-26.8046, 152.2744], [-26.8669, 152.2897], [-26.8935, 152.3067],
    [-26.8968, 152.3203], [-26.9253, 152.3328], [-26.9316, 152.3441], [-26.9264, 152.3616],
    [-26.9695, 152.3555], [-26.9736, 152.3728], [-26.9887, 152.3861], [-26.9895, 152.4044],
    [-27.0026, 152.4086], [-27.0093, 152.3794], [-27.0276, 152.4003], [-27.0536, 152.4086],
    [-27.0502, 152.4406], [-27.0880, 152.4507], [-27.0835, 152.4684], [-27.1023, 152.4764],
    [-27.1275, 152.4666], [-27.1194, 152.4864], [-27.1350, 152.4886], [-27.1298, 152.5073],
    [-27.1460, 152.5135], [-27.1588, 152.5369], [-27.1721, 152.5142], [-27.1470, 152.4979],
    [-27.1466, 152.4890], [-27.1777, 152.4707], [-27.1950, 152.4967], [-27.1962, 152.5068],
    [-27.2284, 152.4954], [-27.2296, 152.5163], [-27.2661, 152.5276], [-27.2670, 152.5607],
    [-27.3100, 152.5339], [-27.3198, 152.5469], [-27.3360, 152.5457], [-27.3108, 152.5894],
    [-27.3164, 152.5957], [-27.3548, 152.6047], [-27.3606, 152.5907], [-27.3695, 152.6251],
    [-27.3947, 152.6335], [-27.4031, 152.6310], [-27.3885, 152.6210], [-27.3880, 152.6112],
    [-27.4165, 152.6059], [-27.4689, 152.5905], [-27.4309, 152.6377], [-27.4271, 152.6515],
    [-27.4390, 152.6679], [-27.4498, 152.6749], [-27.4536, 152.6871], [-27.4633, 152.6877],
    [-27.4690, 152.7119], [-27.4947, 152.6816], [-27.5005, 152.6933], [-27.4962, 152.7045],
    [-27.5079, 152.7221], [-27.4906, 152.7279], [-27.5143, 152.7443], [-27.5168, 152.7618],
    [-27.5666, 152.7421], [-27.5305, 152.7654], [-27.5353, 152.7971], [-27.5531, 152.7867],
    [-27.5578, 152.8077], [-27.5323, 152.8464], [-27.5832, 152.8555], [-27.5978, 152.8586],
    [-27.5791, 152.8734], [-27.6019, 152.8969], [-27.6012, 152.9058], [-27.5772, 152.8938],
    [-27.5447, 152.9040], [-27.5271, 152.9375], [-27.5290, 152.9519], [-27.5437, 152.9653],
    [-27.5441, 152.9730], [-27.5060, 152.9702], [-27.5225, 152.9946], [-27.5230, 153.0054],
    [-27.5095, 153.0000], [-27.5010, 153.0217], [-27.4916, 153.0148], [-27.4891, 152.9954],
    [-27.4724, 153.0080], [-27.4686, 153.0165], [-27.4808, 153.0311], [-27.4635, 153.0355],
    [-27.4766, 153.0438], [-27.4739, 153.0524], [-27.4417, 153.0506], [-27.4462, 153.0979],
    [-27.4077, 153.1482],
  ],
  // Bremer River: headwaters S of Rosewood, Walloon, Ipswich, to the Brisbane River. QLD watercourse lines
  bremer: [
    [-27.9510, 152.4480], [-27.9243, 152.4705], [-27.9087, 152.4655], [-27.8969, 152.4787],
    [-27.8764, 152.4762], [-27.8496, 152.4887], [-27.8472, 152.5033], [-27.8213, 152.5148],
    [-27.7148, 152.5404], [-27.6937, 152.5656], [-27.6628, 152.5814], [-27.6554, 152.6287],
    [-27.6310, 152.6513], [-27.6301, 152.6667], [-27.6115, 152.6701], [-27.6023, 152.6941],
    [-27.6163, 152.7131], [-27.6288, 152.7206], [-27.6278, 152.7269], [-27.6349, 152.7295],
    [-27.6357, 152.7369], [-27.6451, 152.7421], [-27.6266, 152.7478], [-27.6052, 152.7372],
    [-27.5957, 152.7526], [-27.6107, 152.7599], [-27.6119, 152.7676], [-27.5967, 152.7698],
    [-27.6034, 152.7817], [-27.6032, 152.7880], [-27.5988, 152.7903], [-27.5976, 152.7801],
    [-27.5945, 152.7795], [-27.5834, 152.7938], [-27.5824, 152.8064], [-27.5866, 152.8136],
    [-27.5745, 152.8252], [-27.5801, 152.8302], [-27.5832, 152.8555],
  ],
  // Lockyer Creek: Helidon, Gatton, Lyons Bridge, to the Brisbane River below Wivenhoe Dam. QLD watercourse lines
  lockyer: [
    [-27.4936, 152.0907], [-27.4932, 152.0791], [-27.5016, 152.0877], [-27.5111, 152.0772],
    [-27.5185, 152.0885], [-27.5233, 152.0889], [-27.5213, 152.0939], [-27.5376, 152.0941],
    [-27.5351, 152.0973], [-27.5399, 152.1147], [-27.5422, 152.1150], [-27.5614, 152.1206],
    [-27.5625, 152.1275], [-27.5735, 152.1353], [-27.5694, 152.1665], [-27.5803, 152.1734],
    [-27.5848, 152.2085], [-27.5708, 152.2161], [-27.5753, 152.2282], [-27.5707, 152.2299],
    [-27.5718, 152.2486], [-27.5593, 152.2464], [-27.5635, 152.2651], [-27.5488, 152.2620],
    [-27.5490, 152.2681], [-27.5554, 152.2706], [-27.5446, 152.2821], [-27.5525, 152.3042],
    [-27.5320, 152.3381], [-27.5408, 152.3430], [-27.5314, 152.3740], [-27.5139, 152.3913],
    [-27.5208, 152.3996], [-27.5182, 152.4075], [-27.5228, 152.4102], [-27.5231, 152.4195],
    [-27.4838, 152.4384], [-27.4859, 152.4495], [-27.4676, 152.4634], [-27.4844, 152.4818],
    [-27.4964, 152.5020], [-27.4724, 152.4992], [-27.4659, 152.5135], [-27.4733, 152.5170],
    [-27.4704, 152.5309], [-27.4580, 152.5150], [-27.4531, 152.5171], [-27.4475, 152.5151],
    [-27.4468, 152.5030], [-27.4408, 152.5157], [-27.4435, 152.5367], [-27.4316, 152.5340],
    [-27.4342, 152.5170], [-27.4156, 152.5370], [-27.4125, 152.5528], [-27.4208, 152.5555],
    [-27.4138, 152.5633], [-27.4332, 152.5633], [-27.4459, 152.5731], [-27.4187, 152.5902],
    [-27.4165, 152.6059],
  ],

  // ============================================
  // LOGAN-ALBERT BASIN
  // ============================================
  // Logan River: Mt Barney area, Round Mountain, Beaudesert, Waterford, to Moreton Bay. QLD watercourse lines
  logan: [
    [-28.3249, 152.6777], [-28.3311, 152.7071], [-28.3214, 152.7268], [-28.2822, 152.7230],
    [-28.1945, 152.7780], [-28.2090, 152.7936], [-28.2054, 152.7996], [-28.2178, 152.8247],
    [-28.2108, 152.8301], [-28.2328, 152.8542], [-28.2092, 152.8818], [-28.1883, 152.8819],
    [-28.1968, 152.8966], [-28.1771, 152.8946], [-28.1300, 152.9399], [-28.1102, 152.9246],
    [-28.0705, 152.9267], [-28.0293, 152.9227], [-27.9693, 152.9869], [-27.8968, 152.9472],
    [-27.8445, 152.9447], [-27.8380, 152.9587], [-27.8515, 152.9848], [-27.8261, 152.9879],
    [-27.8097, 153.0249], [-27.8037, 153.0059], [-27.7784, 152.9995], [-27.7852, 153.0110],
    [-27.7824, 153.0157], [-27.7890, 153.0218], [-27.7621, 153.0332], [-27.7749, 153.0423],
    [-27.7500, 153.0683], [-27.7628, 153.0696], [-27.7713, 153.1001], [-27.6949, 153.1264],
    [-27.7082, 153.1415], [-27.7061, 153.1462], [-27.6764, 153.1403], [-27.6712, 153.1629],
    [-27.6966, 153.1692], [-27.7038, 153.1915], [-27.6785, 153.2237], [-27.6888, 153.2443],
    [-27.6959, 153.2406], [-27.6921, 153.2923], [-27.7143, 153.3035], [-27.7006, 153.3239],
  ],
  // Albert River: Lamington NP, Bromfleet, to the Logan River at Eagleby. QLD watercourse lines
  albert: [
    [-28.2122, 153.0429], [-28.1639, 153.0454], [-28.1563, 153.0394], [-28.1558, 153.0347],
    [-28.1294, 153.0411], [-28.0827, 153.0270], [-28.0864, 153.0322], [-28.0791, 153.0416],
    [-28.0358, 153.0472], [-28.0304, 153.0586], [-28.0059, 153.0553], [-27.9990, 153.0652],
    [-27.9842, 153.0605], [-27.9713, 153.0679], [-27.9729, 153.0761], [-27.9597, 153.0729],
    [-27.9542, 153.0942], [-27.9490, 153.0919], [-27.9484, 153.0863], [-27.9325, 153.0930],
    [-27.9359, 153.0868], [-27.9331, 153.0848], [-27.9097, 153.1060], [-27.8957, 153.0977],
    [-27.8831, 153.1117], [-27.8810, 153.1037], [-27.8723, 153.1009], [-27.8604, 153.1147],
    [-27.8663, 153.1230], [-27.8628, 153.1341], [-27.8524, 153.1379], [-27.8590, 153.1580],
    [-27.8498, 153.1507], [-27.8418, 153.1694], [-27.8197, 153.1834], [-27.8005, 153.1690],
    [-27.7797, 153.1931], [-27.7751, 153.1864], [-27.7634, 153.1983], [-27.7402, 153.2012],
    [-27.7236, 153.2328], [-27.7183, 153.2155], [-27.7144, 153.2129], [-27.7149, 153.2283],
    [-27.6945, 153.2337], [-27.6959, 153.2406],
  ],

  // ============================================
  // GOLD COAST
  // ============================================
  // Nerang River: Numinbah Valley, Hinze Dam, Glenhurst, Nerang, to the Broadwater at Southport. QLD watercourse lines
  nerang: [
    [-28.2569, 153.2173], [-28.2572, 153.2345], [-28.1972, 153.2319], [-28.1719, 153.2272],
    [-28.1638, 153.2187], [-28.1483, 153.2265], [-28.1149, 153.2314], [-28.0851, 153.2643],
    [-28.0530, 153.2839], [-28.0301, 153.2844], [-28.0325, 153.3035], [-28.0264, 153.3016],
    [-28.0270, 153.2928], [-28.0219, 153.2874], [-28.0165, 153.2926], [-28.0223, 153.3027],
    [-28.0213, 153.3088], [-28.0000, 153.3107], [-27.9969, 153.3353], [-27.9858, 153.3495],
    [-28.0000, 153.3666], [-28.0098, 153.3718], [-28.0156, 153.3872], [-28.0276, 153.3911],
    [-28.0244, 153.3989], [-28.0293, 153.4045], [-28.0168, 153.4094], [-28.0133, 153.4283],
    [-28.0038, 153.4186], [-28.0000, 153.4256], [-27.9829, 153.4174], [-27.9742, 153.4230],
  ],
  // Coomera River: Lamington NP, Army Camp, Oxenford, to the North/South Branch split at the Broadwater. QLD watercourse lines
  coomera: [
    [-28.2558, 153.2013], [-28.1702, 153.1677], [-28.1536, 153.1710], [-28.1488, 153.1685],
    [-28.1427, 153.1563], [-28.1228, 153.1404], [-28.0966, 153.1484], [-28.0876, 153.1453],
    [-28.0911, 153.1403], [-28.0872, 153.1401], [-28.0841, 153.1545], [-28.0609, 153.1754],
    [-28.0657, 153.1789], [-28.0254, 153.1922], [-28.0127, 153.2180], [-27.9899, 153.2249],
    [-27.9890, 153.2385], [-27.9934, 153.2418], [-27.9821, 153.2539], [-27.9770, 153.2454],
    [-27.9733, 153.2550], [-27.9672, 153.2468], [-27.9562, 153.2691], [-27.9445, 153.2597],
    [-27.9212, 153.2634], [-27.9092, 153.2884], [-27.9000, 153.2946], [-27.8972, 153.2934],
    [-27.8988, 153.2890], [-27.8942, 153.2876], [-27.8782, 153.3098], [-27.8761, 153.3350],
    [-27.8473, 153.3539], [-27.8488, 153.3639],
  ],

  // ============================================
  // MARY RIVER BASIN
  // ============================================
  // Mary River: headwaters near Maleny, Bellbird Creek, Gympie, Miva, Tiaro, Maryborough, to the Great Sandy Strait. QLD watercourse lines
  mary: [
    [-26.8023, 152.7815], [-26.7916, 152.7274], [-26.7740, 152.7127], [-26.7177, 152.7180],
    [-26.7145, 152.7066], [-26.6996, 152.6995], [-26.6962, 152.6857], [-26.6869, 152.6799],
    [-26.6307, 152.6866], [-26.6217, 152.6947], [-26.6290, 152.7001], [-26.6280, 152.7053],
    [-26.6129, 152.7300], [-26.5634, 152.7412], [-26.5654, 152.7636], [-26.5531, 152.7462],
    [-26.5331, 152.7695], [-26.5253, 152.7626], [-26.5343, 152.7494], [-26.5261, 152.7395],
    [-26.4780, 152.7667], [-26.4743, 152.7567], [-26.4574, 152.7538], [-26.4582, 152.7481],
    [-26.4094, 152.7509], [-26.4090, 152.7202], [-26.3714, 152.7449], [-26.3600, 152.7147],
    [-26.3406, 152.7171], [-26.3298, 152.7000], [-26.3161, 152.7085], [-26.3135, 152.6891],
    [-26.2943, 152.6923], [-26.2859, 152.6797], [-26.2754, 152.7050], [-26.2714, 152.6846],
    [-26.2669, 152.6824], [-26.2494, 152.7044], [-26.2255, 152.6788], [-26.2145, 152.6789],
    [-26.1853, 152.6439], [-26.1901, 152.6062], [-26.1706, 152.6049], [-26.1713, 152.5881],
    [-26.1569, 152.5603], [-26.1238, 152.5714], [-26.1075, 152.5556], [-26.1105, 152.5521],
    [-26.0989, 152.5560], [-26.1005, 152.5460], [-26.0947, 152.5402], [-26.0643, 152.5362],
    [-26.0683, 152.5218], [-26.0595, 152.5182], [-26.0594, 152.5087], [-26.0312, 152.5150],
    [-26.0418, 152.5035], [-26.0271, 152.4955], [-25.9946, 152.4954], [-25.9875, 152.5204],
    [-25.9760, 152.5070], [-25.9570, 152.5127], [-25.9583, 152.4994], [-25.9534, 152.4955],
    [-25.9228, 152.5069], [-25.9136, 152.4932], [-25.9004, 152.5059], [-25.9012, 152.4829],
    [-25.8847, 152.4929], [-25.8870, 152.4796], [-25.8659, 152.4906], [-25.8505, 152.4799],
    [-25.8300, 152.4902], [-25.7724, 152.4796], [-25.7657, 152.5284], [-25.7471, 152.5179],
    [-25.7243, 152.5376], [-25.7238, 152.5756], [-25.6609, 152.5807], [-25.6461, 152.6226],
    [-25.6086, 152.6099], [-25.5117, 152.6481], [-25.5191, 152.6637], [-25.5413, 152.6816],
    [-25.5614, 152.7194], [-25.5537, 152.7270], [-25.5372, 152.7068], [-25.4919, 152.7386],
    [-25.4673, 152.7307], [-25.4679, 152.7408], [-25.5000, 152.7512], [-25.5095, 152.7639],
    [-25.4881, 152.8009], [-25.4919, 152.8139],
  ],

  // ============================================
  // BURDEKIN BASIN
  // ============================================
  // Burdekin River: headwaters W of Ingham, Sellheim, Burdekin Falls Dam, Clare, to the delta at Upstart Bay. QLD watercourse lines
  burdekin: [
    [-18.6667, 145.7087], [-18.6344, 145.7196], [-18.6165, 145.7115], [-18.5942, 145.6776],
    [-18.5701, 145.6801], [-18.5662, 145.6503], [-18.5854, 145.6317], [-18.5656, 145.6172],
    [-18.5762, 145.6060], [-18.5273, 145.5911], [-18.5267, 145.5747], [-18.5069, 145.5536],
    [-18.4267, 145.5643], [-18.4158, 145.5413], [-18.4516, 145.4640], [-18.4224, 145.4218],
    [-18.4253, 145.3691], [-18.4446, 145.3168], [-18.5272, 145.2182], [-18.5270, 145.1988],
    [-18.5121, 145.1786], [-18.5639, 145.1393], [-18.6512, 145.1153], [-18.6997, 145.0502],
    [-18.7510, 145.0339], [-18.7586, 144.9650], [-18.8852, 144.9755], [-18.9097, 145.0004],
    [-18.9084, 145.0101], [-18.9328, 145.0010], [-18.9489, 145.0207], [-18.9499, 145.1030],
    [-18.9606, 145.1229], [-18.9802, 145.1308], [-18.9479, 145.1780], [-18.9862, 145.2002],
    [-19.0087, 145.2451], [-19.0177, 145.3019], [-18.9841, 145.3556], [-19.0025, 145.3622],
    [-19.0087, 145.3783], [-19.1222, 145.3503], [-19.1408, 145.3746], [-19.1402, 145.3941],
    [-19.1625, 145.4071], [-19.1693, 145.4565], [-19.2065, 145.4883], [-19.1887, 145.5573],
    [-19.1259, 145.6078], [-19.1064, 145.6858], [-19.1153, 145.7109], [-19.1493, 145.7153],
    [-19.1706, 145.7700], [-19.2194, 145.7800], [-19.2650, 145.8106], [-19.2952, 145.8063],
    [-19.3088, 145.8372], [-19.3684, 145.8272], [-19.4517, 145.8645], [-19.4851, 145.8532],
    [-19.4968, 145.8864], [-19.5247, 145.9051], [-19.6296, 145.8784], [-19.7040, 145.8927],
    [-19.7368, 145.9485], [-19.7319, 145.9898], [-19.8135, 146.0300], [-19.8035, 146.0929],
    [-19.8484, 146.1197], [-19.8699, 146.1745], [-19.8654, 146.2089], [-19.8903, 146.2437],
    [-19.8939, 146.2822], [-19.9281, 146.2781], [-19.9807, 146.3165], [-19.9855, 146.3662],
    [-20.0018, 146.3977], [-19.9848, 146.4321], [-20.0132, 146.4367], [-20.0686, 146.4614],
    [-20.1181, 146.4411], [-20.1165, 146.4861], [-20.1319, 146.5227], [-20.1028, 146.5402],
    [-20.1439, 146.5693], [-20.1646, 146.6101], [-20.2190, 146.6480], [-20.1876, 146.6850],
    [-20.2430, 146.7456], [-20.2337, 146.7957], [-20.2542, 146.8139], [-20.2618, 146.8603],
    [-20.3561, 146.8382], [-20.3918, 146.8721], [-20.3944, 146.9658], [-20.4182, 146.9744],
    [-20.4422, 146.9519], [-20.5190, 146.9681], [-20.6196, 147.0214], [-20.6459, 147.0778],
    [-20.6374, 147.1150], [-20.6529, 147.1553], [-20.5760, 147.2153], [-20.5839, 147.2417],
    [-20.5552, 147.2782], [-20.5021, 147.3014], [-20.4512, 147.2958], [-20.3994, 147.3478],
    [-20.3641, 147.3146], [-20.3126, 147.2974], [-20.2147, 147.3093], [-20.1200, 147.2726],
    [-20.0654, 147.2950], [-20.0150, 147.2617], [-19.9459, 147.2465], [-19.9387, 147.2273],
    [-19.9147, 147.2146], [-19.7599, 147.2441], [-19.7057, 147.2773], [-19.6980, 147.3330],
    [-19.6239, 147.4120], [-19.6217, 147.4437], [-19.6573, 147.4921], [-19.6669, 147.5217],
    [-19.6521, 147.5905],
  ],
  // Ross River: headwaters, Ross River Dam, Aplins Weir, Townsville. QLD watercourse lines
  ross: [
    [-19.6031, 146.7146], [-19.5836, 146.7229], [-19.5803, 146.7186], [-19.5769, 146.7237],
    [-19.5689, 146.7200], [-19.5581, 146.7213], [-19.5530, 146.7314], [-19.5431, 146.7280],
    [-19.5190, 146.7375], [-19.5127, 146.7332], [-19.5092, 146.7354], [-19.5002, 146.7271],
    [-19.4947, 146.7287], [-19.4922, 146.7254], [-19.4922, 146.7188], [-19.4895, 146.7178],
    [-19.4260, 146.7422], [-19.3933, 146.7301], [-19.3810, 146.7372], [-19.3230, 146.7291],
    [-19.3148, 146.7381], [-19.3144, 146.7409], [-19.3180, 146.7468], [-19.3083, 146.7599],
    [-19.3084, 146.7757], [-19.3002, 146.7890], [-19.3010, 146.7965], [-19.3049, 146.8013],
    [-19.3039, 146.8049], [-19.2994, 146.8104], [-19.2939, 146.8085], [-19.2907, 146.8037],
    [-19.2862, 146.8040], [-19.2842, 146.8169], [-19.2905, 146.8246], [-19.2816, 146.8258],
    [-19.2691, 146.8356],
  ],

  // ============================================
  // HERBERT BASIN
  // ============================================
  // Herbert River: headwaters W of Ravenshoe, W then S and E through the gorge to Abergowrie, Ingham, mouth. QLD watercourse lines
  herbert: [
    [-17.6773, 145.2727], [-17.7286, 145.2661], [-17.7234, 145.2563], [-17.7300, 145.2396],
    [-17.7149, 145.2233], [-17.7346, 145.2075], [-17.7440, 145.2214], [-17.7499, 145.1912],
    [-17.7767, 145.2043], [-17.8159, 145.1962], [-17.8381, 145.2296], [-17.8613, 145.2408],
    [-17.8831, 145.2238], [-17.8955, 145.2349], [-17.9215, 145.2116], [-17.9252, 145.2227],
    [-17.9314, 145.2199], [-17.9287, 145.2375], [-17.9394, 145.2435], [-17.9357, 145.2569],
    [-17.9704, 145.2496], [-18.0016, 145.2589], [-18.0047, 145.2788], [-18.0297, 145.2679],
    [-18.0373, 145.2772], [-18.0196, 145.2900], [-18.0448, 145.2888], [-18.0655, 145.3029],
    [-18.0645, 145.3223], [-18.0857, 145.3287], [-18.1287, 145.3234], [-18.1326, 145.3387],
    [-18.1489, 145.3286], [-18.1658, 145.3470], [-18.2146, 145.3320], [-18.2286, 145.3132],
    [-18.2485, 145.3152], [-18.2399, 145.3434], [-18.2225, 145.3419], [-18.2355, 145.3714],
    [-18.2232, 145.4231], [-18.2354, 145.4395], [-18.2016, 145.4578], [-18.2002, 145.4918],
    [-18.2438, 145.5276], [-18.2448, 145.5658], [-18.2591, 145.5717], [-18.2579, 145.6008],
    [-18.2467, 145.6060], [-18.2517, 145.6183], [-18.2736, 145.6251], [-18.3015, 145.6547],
    [-18.3135, 145.6437], [-18.3184, 145.6571], [-18.3290, 145.6536], [-18.3273, 145.6827],
    [-18.3378, 145.7033], [-18.3650, 145.7212], [-18.3734, 145.7460], [-18.3973, 145.7465],
    [-18.3957, 145.7583], [-18.4107, 145.7707], [-18.4351, 145.7768], [-18.4530, 145.8044],
    [-18.4547, 145.8233], [-18.4726, 145.8293], [-18.4840, 145.8713], [-18.5082, 145.8690],
    [-18.4882, 145.8885], [-18.4944, 145.8978], [-18.4899, 145.9372], [-18.4890, 145.9803],
    [-18.5089, 145.9743], [-18.5136, 145.9891], [-18.5111, 146.0112], [-18.4967, 146.0224],
    [-18.5015, 146.0331], [-18.5170, 146.0318], [-18.5236, 146.0161], [-18.5450, 146.0234],
    [-18.5575, 146.0434], [-18.5882, 146.0425], [-18.5945, 146.0748], [-18.6219, 146.0895],
    [-18.6232, 146.1086], [-18.6326, 146.1194], [-18.6307, 146.1389], [-18.6384, 146.1468],
    [-18.5858, 146.2111], [-18.5971, 146.2810], [-18.5543, 146.2774], [-18.5422, 146.2908],
    [-18.5261, 146.2808],
  ],

  // ============================================
  // CAIRNS / FAR NORTH
  // ============================================
  // Barron River: headwaters S of Atherton, Picnic Crossing, Lake Tinaroo, Mareeba, Myola, Barron Gorge, mouth N of Cairns. QLD watercourse lines
  barron: [
    [-17.4544, 145.4875], [-17.4110, 145.4966], [-17.3916, 145.4894], [-17.3764, 145.5068],
    [-17.3474, 145.4952], [-17.3339, 145.5181], [-17.3080, 145.5192], [-17.2873, 145.5401],
    [-17.2590, 145.5389], [-17.2207, 145.5905], [-17.1646, 145.5550], [-17.1692, 145.5115],
    [-17.1610, 145.4997], [-17.1466, 145.4957], [-17.1431, 145.4829], [-17.1209, 145.4599],
    [-17.1013, 145.4656], [-17.0757, 145.4451], [-17.0447, 145.4383], [-17.0174, 145.4500],
    [-17.0074, 145.4471], [-17.0014, 145.4292], [-16.9847, 145.4256], [-16.9000, 145.4250],
    [-16.8620, 145.4137], [-16.8425, 145.4430], [-16.8482, 145.4644], [-16.8373, 145.4883],
    [-16.7999, 145.5484], [-16.8044, 145.5660], [-16.7977, 145.5752], [-16.8077, 145.5864],
    [-16.8004, 145.6111], [-16.8043, 145.6320], [-16.8520, 145.6480], [-16.8734, 145.6802],
    [-16.8551, 145.7139], [-16.8658, 145.7268], [-16.8747, 145.7263], [-16.8620, 145.7568],
  ],
  // Mulgrave River: Bellenden Ker Range, The Fisheries, Gordonvale, to the Russell River junction. QLD watercourse lines
  mulgrave: [
    [-17.2971, 145.8002], [-17.2806, 145.7904], [-17.2791, 145.7850], [-17.2375, 145.7729],
    [-17.2363, 145.7572], [-17.2047, 145.7455], [-17.1963, 145.7373], [-17.1941, 145.7281],
    [-17.1836, 145.7257], [-17.1595, 145.7168], [-17.1556, 145.7304], [-17.1526, 145.7209],
    [-17.1472, 145.7216], [-17.1394, 145.7371], [-17.1459, 145.7445], [-17.1408, 145.7606],
    [-17.1063, 145.7889], [-17.0952, 145.7905], [-17.0902, 145.7997], [-17.0908, 145.8091],
    [-17.1041, 145.8210], [-17.1054, 145.8319], [-17.0918, 145.8507], [-17.1025, 145.8502],
    [-17.1287, 145.8710], [-17.1377, 145.8674], [-17.1337, 145.8791], [-17.1474, 145.8806],
    [-17.1679, 145.9076], [-17.1796, 145.9108], [-17.1808, 145.9151], [-17.1901, 145.9106],
    [-17.2113, 145.9265], [-17.2162, 145.9197], [-17.2137, 145.9448], [-17.2294, 145.9511],
  ],
  // North Johnstone / Johnstone River: headwaters near Malanda, Glen Allyn, Tung Oil, Innisfail, Flying Fish Point. QLD watercourse lines
  johnstone: [
    [-17.4228, 145.5243], [-17.3683, 145.5649], [-17.3602, 145.5880], [-17.3543, 145.5849],
    [-17.3460, 145.5942], [-17.3520, 145.6056], [-17.3378, 145.6087], [-17.3360, 145.6156],
    [-17.3412, 145.6333], [-17.3552, 145.6317], [-17.3582, 145.6401], [-17.3810, 145.6529],
    [-17.3875, 145.6571], [-17.4061, 145.6375], [-17.4069, 145.6421], [-17.4107, 145.6430],
    [-17.4085, 145.6494], [-17.4142, 145.6518], [-17.4130, 145.6583], [-17.4162, 145.6559],
    [-17.4251, 145.6665], [-17.4414, 145.6599], [-17.4395, 145.6681], [-17.4459, 145.6665],
    [-17.4451, 145.6741], [-17.4493, 145.6799], [-17.4750, 145.6919], [-17.4862, 145.7032],
    [-17.4842, 145.7090], [-17.4902, 145.7134], [-17.4899, 145.7183], [-17.5308, 145.7249],
    [-17.5338, 145.7312], [-17.5401, 145.7328], [-17.5425, 145.7397], [-17.5514, 145.7407],
    [-17.5529, 145.7509], [-17.5596, 145.7523], [-17.5634, 145.7611], [-17.5920, 145.7728],
    [-17.5977, 145.7876], [-17.5959, 145.7931], [-17.6066, 145.7929], [-17.5992, 145.8125],
    [-17.5628, 145.8191], [-17.5572, 145.8318], [-17.5313, 145.8429], [-17.5225, 145.8594],
    [-17.5281, 145.8671], [-17.5281, 145.8824], [-17.5348, 145.8899], [-17.5301, 145.9025],
    [-17.5325, 145.9166], [-17.5429, 145.9152], [-17.5452, 145.9311], [-17.5472, 145.9443],
    [-17.5346, 145.9559], [-17.5296, 145.9725], [-17.5160, 145.9869], [-17.5110, 145.9809],
    [-17.5015, 145.9849], [-17.5074, 146.0015], [-17.4884, 146.0026], [-17.4948, 146.0085],
    [-17.4835, 146.0295], [-17.5028, 146.0376], [-17.5158, 146.0313], [-17.5242, 146.0362],
    [-17.5222, 146.0576], [-17.5087, 146.0645],
  ],

  // ============================================
  // MACKAY / PIONEER
  // ============================================
  // Pioneer River: Mirani, Dumbleton Weir, Mackay. QLD watercourse lines
  pioneer: [
    [-21.3059, 148.8422], [-21.3024, 148.8349], [-21.2942, 148.8349], [-21.2648, 148.8153],
    [-21.2526, 148.8128], [-21.2450, 148.8188], [-21.2326, 148.8131], [-21.2247, 148.8176],
    [-21.2106, 148.8129], [-21.2013, 148.8239], [-21.1879, 148.8208], [-21.1789, 148.8271],
    [-21.1633, 148.8431], [-21.1625, 148.8570], [-21.1460, 148.8620], [-21.1375, 148.8809],
    [-21.1416, 148.8955], [-21.1379, 148.9106], [-21.1400, 148.9382], [-21.1448, 148.9565],
    [-21.1347, 148.9643], [-21.1326, 148.9783], [-21.1371, 148.9909], [-21.1414, 149.0245],
    [-21.1388, 149.0484], [-21.1421, 149.0764], [-21.1486, 149.1008], [-21.1425, 149.1379],
    [-21.1441, 149.1521], [-21.1339, 149.1621], [-21.1313, 149.1758], [-21.1395, 149.1907],
    [-21.1402, 149.1982],
  ],
  // Proserpine River: Peter Faust Dam, Proserpine, Repulse Bay. Note: this system's gauges are on the O'Connell River and St Helens Creek. QLD watercourse lines
  proserpine: [
    [-20.4982, 148.3558], [-20.4711, 148.3520], [-20.4639, 148.3406], [-20.4478, 148.3439],
    [-20.4212, 148.3299], [-20.3818, 148.3442], [-20.3671, 148.3630], [-20.3679, 148.3891],
    [-20.3583, 148.3966], [-20.3560, 148.4466], [-20.3403, 148.4591], [-20.3451, 148.4665],
    [-20.3416, 148.4929], [-20.3491, 148.5159], [-20.3645, 148.5383], [-20.3647, 148.5480],
    [-20.3719, 148.5531], [-20.3762, 148.5644], [-20.3945, 148.5697], [-20.3951, 148.5954],
    [-20.3800, 148.5965], [-20.3913, 148.6158], [-20.3876, 148.6186], [-20.3941, 148.6363],
    [-20.3975, 148.6351], [-20.3992, 148.6424], [-20.4040, 148.6400], [-20.4009, 148.6459],
    [-20.4188, 148.6459], [-20.4184, 148.6577], [-20.4289, 148.6581], [-20.4316, 148.6682],
    [-20.4547, 148.6572], [-20.4528, 148.6739], [-20.4402, 148.6741], [-20.4403, 148.6797],
    [-20.4462, 148.6849], [-20.4439, 148.6941],
  ],

  // ============================================
  // CONDAMINE-BALONNE (Darling Downs - inland)
  // ============================================
  // Condamine River: headwaters near Killarney, Warwick, Dalby district, Chinchilla, Condamine, to the Balonne River. QLD watercourse lines
  condamine: [
    [-28.2387, 152.4786], [-28.2828, 152.4359], [-28.2895, 152.3599], [-28.3316, 152.3292],
    [-28.3812, 152.1574], [-28.3463, 152.1541], [-28.3357, 152.1409], [-28.3371, 152.1264],
    [-28.2924, 152.1159], [-28.2861, 152.0921], [-28.2355, 152.0854], [-28.2272, 152.0464],
    [-28.2140, 152.0475], [-28.2035, 152.0362], [-28.2159, 152.0084], [-28.1918, 152.0096],
    [-28.2064, 152.0020], [-28.1956, 151.9619], [-28.1638, 151.9635], [-28.1688, 151.9138],
    [-28.1503, 151.8947], [-28.1641, 151.8526], [-28.1359, 151.8129], [-28.1057, 151.8256],
    [-28.0633, 151.7861], [-27.9767, 151.7598], [-27.9440, 151.7348], [-27.9352, 151.6925],
    [-27.9217, 151.6870], [-27.9236, 151.6741], [-27.8745, 151.6387], [-27.8752, 151.6049],
    [-27.8528, 151.5847], [-27.8490, 151.5642], [-27.8676, 151.4878], [-27.8333, 151.4550],
    [-27.8477, 151.4198], [-27.8286, 151.3860], [-27.8151, 151.3802], [-27.8125, 151.3633],
    [-27.7704, 151.3390], [-27.7466, 151.2917], [-27.7259, 151.2887], [-27.7222, 151.2642],
    [-27.6940, 151.2482], [-27.6884, 151.2142], [-27.5618, 151.1818], [-27.4912, 151.2057],
    [-27.4548, 151.2500], [-27.3772, 151.2513], [-27.3126, 151.2301], [-27.2815, 151.2020],
    [-27.2833, 151.1912], [-27.2363, 151.1977], [-27.1668, 151.1614], [-27.1497, 151.1363],
    [-27.1418, 151.0992], [-27.1044, 151.0759], [-27.1072, 151.0687], [-27.0620, 151.0603],
    [-27.0404, 151.0244], [-27.0016, 151.0027], [-26.9808, 150.9549], [-26.9946, 150.9402],
    [-26.9864, 150.9066], [-26.9760, 150.8843], [-26.9595, 150.8756], [-26.9617, 150.8639],
    [-26.9458, 150.8653], [-26.9530, 150.8276], [-26.9161, 150.8061], [-26.8978, 150.7695],
    [-26.8647, 150.7755], [-26.8405, 150.7547], [-26.8582, 150.7337], [-26.8480, 150.7326],
    [-26.8496, 150.7087], [-26.7952, 150.6802], [-26.8048, 150.6508], [-26.7922, 150.6444],
    [-26.7881, 150.6224], [-26.8055, 150.6102], [-26.8001, 150.5754], [-26.8069, 150.5350],
    [-26.7944, 150.5172], [-26.8209, 150.5088], [-26.8172, 150.4863], [-26.8087, 150.4815],
    [-26.8563, 150.3926], [-26.8450, 150.3754], [-26.8549, 150.3592], [-26.8408, 150.3453],
    [-26.8471, 150.3275], [-26.8330, 150.3118], [-26.8327, 150.2984], [-26.8223, 150.2949],
    [-26.8238, 150.2568], [-26.8081, 150.2483], [-26.8373, 150.2086], [-26.8247, 150.1929],
    [-26.9832, 150.1003], [-27.0484, 149.9414], [-27.0339, 149.9332], [-27.1157, 149.8496],
    [-27.1092, 149.8042], [-27.1245, 149.7829], [-27.0383, 149.7765], [-27.0752, 149.7510],
    [-27.0623, 149.7230], [-27.0790, 149.7063], [-27.0676, 149.6582], [-27.0753, 149.6428],
    [-27.0560, 149.6258],
  ],

  // ============================================
  // ADDITIONAL RIVER SYSTEMS
  // ============================================
  // Kolan River: headwaters, Fred Haigh Dam, to the coast N of Bundaberg. QLD watercourse lines
  kolan: [
    [-24.5408, 151.4809], [-24.5887, 151.4530], [-24.6224, 151.4709], [-24.6777, 151.4507],
    [-24.6814, 151.4619], [-24.6893, 151.4522], [-24.6949, 151.4667], [-24.7095, 151.4527],
    [-24.7081, 151.4621], [-24.7173, 151.4655], [-24.7204, 151.4793], [-24.7296, 151.4841],
    [-24.7474, 151.4775], [-24.7380, 151.4929], [-24.7594, 151.4978], [-24.7526, 151.5089],
    [-24.7636, 151.5164], [-24.7316, 151.5570], [-24.7443, 151.5536], [-24.7498, 151.5934],
    [-24.7608, 151.5879], [-24.7665, 151.6015], [-24.7519, 151.6022], [-24.7555, 151.6231],
    [-24.7405, 151.6442], [-24.7144, 151.6447], [-24.6952, 151.6781], [-24.7105, 151.6866],
    [-24.7125, 151.6975], [-24.7356, 151.7204], [-24.7543, 151.7267], [-24.7669, 151.7452],
    [-24.7833, 151.7540], [-24.7703, 151.7682], [-24.7714, 151.7901], [-24.8029, 151.7967],
    [-24.8031, 151.8038], [-24.8102, 151.8085], [-24.8095, 151.8202], [-24.8180, 151.8269],
    [-24.8311, 151.8161], [-24.8419, 151.8312], [-24.8699, 151.8337], [-24.8652, 151.8713],
    [-24.8803, 151.8751], [-24.8925, 151.9148], [-24.8798, 151.9194], [-24.8791, 151.9385],
    [-24.9018, 151.9468], [-24.8796, 151.9942], [-24.8994, 151.9985], [-24.8990, 152.0136],
    [-24.9128, 152.0148], [-24.9140, 152.0555], [-24.8922, 152.0740], [-24.8517, 152.0759],
    [-24.8507, 152.0812], [-24.8619, 152.0856], [-24.8585, 152.1018], [-24.8250, 152.1291],
    [-24.8250, 152.1550], [-24.8078, 152.1777], [-24.7876, 152.1897], [-24.7612, 152.1798],
    [-24.7445, 152.1623], [-24.7108, 152.1905], [-24.6978, 152.1819], [-24.7030, 152.1664],
    [-24.6955, 152.1623], [-24.6893, 152.1789],
  ],
  // North Pine River: headwaters near Dayboro, Lake Samsonvale (North Pine Dam), then Pine River to Bramble Bay. QLD watercourse lines
  northpine: [
    [-27.1139, 152.7357], [-27.1450, 152.7561], [-27.1435, 152.7669], [-27.1496, 152.7731],
    [-27.1743, 152.7744], [-27.1766, 152.7902], [-27.1949, 152.7974], [-27.1941, 152.8043],
    [-27.2127, 152.8044], [-27.2102, 152.8139], [-27.2156, 152.8160], [-27.2137, 152.8208],
    [-27.2193, 152.8271], [-27.2154, 152.8364], [-27.2225, 152.8404], [-27.2219, 152.8458],
    [-27.2244, 152.8462], [-27.2170, 152.8521], [-27.2209, 152.8570], [-27.2177, 152.8691],
    [-27.2261, 152.8688], [-27.2246, 152.8810], [-27.2362, 152.8916], [-27.2375, 152.8990],
    [-27.2452, 152.8943], [-27.2661, 152.9049], [-27.2712, 152.9244], [-27.2568, 152.9485],
    [-27.2781, 152.9644], [-27.2709, 152.9665], [-27.2744, 152.9899], [-27.2780, 152.9923],
    [-27.2675, 152.9930], [-27.2711, 153.0017], [-27.2771, 153.0023], [-27.2917, 153.0195],
    [-27.2988, 153.0331], [-27.2796, 153.0382], [-27.2782, 153.0591],
  ],
  // Mooloolah River: Mooloolah Valley to Mooloolaba. QLD watercourse lines
  mooloolah: [
    [-26.7703, 152.9057], [-26.7531, 152.9019], [-26.7445, 152.9112], [-26.7512, 152.9133],
    [-26.7547, 152.9392], [-26.7583, 152.9448], [-26.7560, 152.9494], [-26.7584, 152.9498],
    [-26.7607, 152.9584], [-26.7643, 152.9589], [-26.7544, 152.9705], [-26.7573, 152.9720],
    [-26.7612, 152.9816], [-26.7633, 152.9978], [-26.7663, 152.9979], [-26.7686, 153.0097],
    [-26.7721, 153.0108], [-26.7720, 153.0191], [-26.7761, 153.0216], [-26.7763, 153.0279],
    [-26.7668, 153.0562], [-26.7405, 153.0901], [-26.7416, 153.0973], [-26.7450, 153.1012],
    [-26.7297, 153.1031], [-26.7218, 153.1224], [-26.7164, 153.1201], [-26.7125, 153.1133],
    [-26.7075, 153.1200], [-26.7049, 153.1146], [-26.6967, 153.1144], [-26.6856, 153.1201],
    [-26.6872, 153.1315], [-26.6811, 153.1345],
  ],
  // Tully River: Koombooloomba area, Tully Gorge, Tully, Euramo, mouth near Tully Heads. QLD watercourse lines
  tully: [
    [-17.9835, 145.6255], [-17.9679, 145.6282], [-17.9538, 145.6173], [-17.9449, 145.6179],
    [-17.9237, 145.6296], [-17.9255, 145.6394], [-17.9140, 145.6356], [-17.9177, 145.6409],
    [-17.9098, 145.6457], [-17.8981, 145.6453], [-17.9030, 145.6387], [-17.8976, 145.6373],
    [-17.8712, 145.6471], [-17.8387, 145.6314], [-17.8370, 145.6202], [-17.8289, 145.6135],
    [-17.8306, 145.5925], [-17.8190, 145.5877], [-17.8197, 145.5842], [-17.8134, 145.5799],
    [-17.8173, 145.5698], [-17.8140, 145.5634], [-17.7845, 145.5687], [-17.7753, 145.5655],
    [-17.7774, 145.5608], [-17.7725, 145.5571], [-17.7618, 145.5635], [-17.7660, 145.5876],
    [-17.7513, 145.6031], [-17.7471, 145.6233], [-17.7571, 145.6302], [-17.7577, 145.6372],
    [-17.7643, 145.6370], [-17.7709, 145.6511], [-17.7772, 145.6508], [-17.7810, 145.6718],
    [-17.8094, 145.6885], [-17.8165, 145.6995], [-17.8461, 145.7102], [-17.8456, 145.7180],
    [-17.8609, 145.7301], [-17.8584, 145.7398], [-17.8734, 145.7487], [-17.8704, 145.7559],
    [-17.8963, 145.7656], [-17.8968, 145.7699], [-17.9028, 145.7720], [-17.9055, 145.7827],
    [-17.9170, 145.7936], [-17.9267, 145.7911], [-17.9403, 145.8032], [-17.9409, 145.8078],
    [-17.9441, 145.8053], [-17.9499, 145.8152], [-17.9537, 145.8083], [-17.9583, 145.8197],
    [-17.9722, 145.8320], [-17.9618, 145.8409], [-17.9731, 145.8438], [-17.9762, 145.8671],
    [-17.9999, 145.8736], [-17.9874, 145.8971], [-17.9969, 145.9153], [-18.0029, 145.9181],
    [-17.9924, 145.9221], [-17.9925, 145.9423], [-17.9846, 145.9677], [-17.9989, 145.9803],
    [-17.9999, 145.9863], [-18.0095, 145.9870], [-17.9991, 145.9957], [-18.0050, 146.0010],
    [-18.0071, 146.0131], [-18.0120, 146.0147], [-18.0097, 146.0214], [-18.0142, 146.0222],
    [-18.0170, 146.0292], [-18.0215, 146.0259], [-18.0164, 146.0416], [-18.0283, 146.0532],
  ],
  // Daintree River: headwaters, Bairds, Daintree Village, mouth. QLD watercourse lines
  daintree: [
    [-16.3928, 145.2025], [-16.3817, 145.2055], [-16.3800, 145.1995], [-16.3588, 145.1878],
    [-16.3482, 145.1733], [-16.3450, 145.1594], [-16.3251, 145.1500], [-16.3221, 145.1546],
    [-16.3060, 145.1506], [-16.2963, 145.1596], [-16.2758, 145.1576], [-16.2678, 145.1791],
    [-16.2567, 145.1851], [-16.2472, 145.1795], [-16.2318, 145.1930], [-16.2306, 145.1854],
    [-16.2146, 145.1848], [-16.2077, 145.1773], [-16.2015, 145.1803], [-16.1782, 145.1684],
    [-16.1700, 145.1738], [-16.1698, 145.1680], [-16.1623, 145.1692], [-16.1690, 145.1519],
    [-16.1565, 145.1542], [-16.1531, 145.1482], [-16.1463, 145.1592], [-16.1359, 145.1606],
    [-16.1318, 145.1537], [-16.1263, 145.1539], [-16.1226, 145.1446], [-16.1063, 145.1388],
    [-16.0967, 145.1378], [-16.0782, 145.1538], [-16.0774, 145.1641], [-16.0690, 145.1653],
    [-16.0750, 145.1781], [-16.0743, 145.1883], [-16.0844, 145.1903], [-16.0851, 145.2186],
    [-16.1002, 145.2272], [-16.1083, 145.2199], [-16.1109, 145.2327], [-16.1156, 145.2282],
    [-16.1190, 145.2332], [-16.0945, 145.2454], [-16.1175, 145.2574], [-16.1139, 145.2675],
    [-16.1218, 145.2617], [-16.1310, 145.2669], [-16.1395, 145.2820], [-16.1503, 145.2858],
    [-16.1684, 145.2686], [-16.1810, 145.2832], [-16.1813, 145.2875], [-16.1921, 145.2928],
    [-16.2011, 145.2917], [-16.2074, 145.3016], [-16.2261, 145.2945], [-16.2316, 145.3106],
    [-16.2538, 145.3104], [-16.2532, 145.3172], [-16.2406, 145.3182], [-16.2577, 145.3436],
    [-16.2421, 145.3558], [-16.2598, 145.3674], [-16.2613, 145.4021], [-16.2793, 145.4090],
    [-16.2763, 145.4204], [-16.2819, 145.4301], [-16.2778, 145.4459], [-16.2849, 145.4535],
  ],
  // Broken River: Eungella Dam, Old Racecourse, NW to the Bowen River (Burdekin basin, not the Pioneer). QLD watercourse lines
  broken: [
    [-21.2310, 148.5641], [-21.2360, 148.5520], [-21.2078, 148.5491], [-21.2018, 148.5411],
    [-21.1870, 148.5469], [-21.1806, 148.5440], [-21.1831, 148.5414], [-21.1746, 148.5356],
    [-21.1743, 148.5286], [-21.1704, 148.5271], [-21.1747, 148.5171], [-21.1662, 148.5110],
    [-21.1669, 148.4959], [-21.1791, 148.4756], [-21.1757, 148.4733], [-21.1752, 148.4647],
    [-21.1682, 148.4583], [-21.1782, 148.4479], [-21.1936, 148.4476], [-21.1966, 148.4415],
    [-21.1917, 148.4396], [-21.1920, 148.4318], [-21.1883, 148.4286], [-21.1954, 148.4177],
    [-21.1875, 148.4198], [-21.1670, 148.4027], [-21.1465, 148.4028], [-21.1449, 148.3930],
    [-21.1324, 148.3884], [-21.1314, 148.3822], [-21.1242, 148.3758], [-21.1131, 148.3884],
    [-21.0871, 148.3887], [-21.0763, 148.3792], [-21.0753, 148.3735], [-21.0709, 148.3738],
    [-21.0734, 148.3557], [-21.0652, 148.3532], [-21.0718, 148.3473], [-21.0702, 148.3411],
    [-21.0628, 148.3365], [-21.0449, 148.3321], [-21.0351, 148.3455], [-21.0240, 148.3385],
    [-21.0134, 148.3490], [-20.9992, 148.3455], [-20.9974, 148.3565], [-20.9717, 148.3522],
    [-20.9675, 148.3467], [-20.9667, 148.3337], [-20.9610, 148.3320], [-20.9566, 148.3478],
    [-20.9481, 148.3516], [-20.9351, 148.3349], [-20.9145, 148.3207], [-20.9124, 148.3026],
    [-20.9028, 148.2887], [-20.8801, 148.2929], [-20.8668, 148.2783], [-20.8497, 148.2765],
    [-20.8432, 148.2372], [-20.8319, 148.2161], [-20.8282, 148.1956], [-20.8304, 148.1795],
    [-20.8423, 148.1636], [-20.8293, 148.1470], [-20.8383, 148.1216], [-20.8311, 148.1136],
    [-20.8307, 148.1074], [-20.8143, 148.0995], [-20.8096, 148.0833],
  ],
  // Flinders River: headwaters NE of Hughenden, Hughenden, Richmond, Walkers Bend, Gulf of Carpentaria. QLD watercourse lines
  flinders: [
    [-19.9483, 144.6472], [-19.9709, 144.7189], [-20.0300, 144.7484], [-20.1148, 144.6995],
    [-20.1632, 144.7516], [-20.3288, 144.7636], [-20.4567, 144.6463], [-20.4953, 144.6732],
    [-20.6549, 144.6499], [-20.6783, 144.6046], [-20.6722, 144.5415], [-20.8341, 144.4260],
    [-20.8237, 144.4003], [-20.8504, 144.3753], [-20.8347, 144.3302], [-20.8546, 144.2700],
    [-20.8366, 144.2542], [-20.8549, 144.2448], [-20.8362, 144.2278], [-20.8422, 144.2050],
    [-20.8179, 144.1287], [-20.8050, 144.1319], [-20.8086, 144.1196], [-20.7792, 144.0915],
    [-20.7795, 144.0606], [-20.7550, 144.0362], [-20.7397, 143.9793], [-20.6559, 143.8939],
    [-20.6455, 143.8634], [-20.6506, 143.7858], [-20.7053, 143.7622], [-20.7376, 143.6718],
    [-20.7691, 143.6664], [-20.8190, 143.5879], [-20.7944, 143.5416], [-20.8138, 143.5031],
    [-20.7996, 143.4522], [-20.7467, 143.3667], [-20.7647, 143.1890], [-20.7483, 143.1617],
    [-20.6973, 143.1331], [-20.6193, 143.0306], [-20.6349, 142.8770], [-20.6749, 142.7869],
    [-20.6416, 142.7537], [-20.6602, 142.6891], [-20.6369, 142.6761], [-20.6482, 142.6131],
    [-20.6320, 142.5972], [-20.6278, 142.5621], [-20.6015, 142.5439], [-20.5705, 142.4115],
    [-20.5718, 142.3382], [-20.5395, 142.2917], [-20.5386, 142.2566], [-20.5056, 142.2182],
    [-20.5078, 142.1677], [-20.4746, 142.1418], [-20.4863, 142.1090], [-20.4324, 142.0754],
    [-20.4340, 142.0322], [-20.4154, 141.9975], [-20.3503, 141.9681], [-20.3356, 141.9393],
    [-20.2837, 141.9241], [-20.2514, 141.8889], [-20.2432, 141.8448], [-20.2062, 141.8207],
    [-20.1836, 141.7634], [-20.1532, 141.7591], [-20.1205, 141.7210], [-20.1120, 141.6897],
    [-20.0434, 141.6307], [-20.0068, 141.5634], [-19.8912, 141.4256], [-19.7726, 141.3494],
    [-19.7419, 141.3074], [-19.7222, 141.2001], [-19.7354, 141.1944], [-19.7120, 141.1802],
    [-19.6971, 141.1360], [-19.5997, 141.1046], [-19.4688, 141.0221], [-19.4334, 141.0306],
    [-19.4095, 141.0014], [-19.3310, 140.9754], [-19.1497, 140.9422], [-19.0956, 140.8877],
    [-19.0800, 140.8963], [-19.0324, 140.8546], [-19.0344, 140.8398], [-18.9678, 140.8182],
    [-18.9589, 140.7874], [-18.9328, 140.7847], [-18.8589, 140.7199], [-18.7871, 140.6999],
    [-18.6565, 140.7089], [-18.6215, 140.6991], [-18.6208, 140.6722], [-18.6016, 140.6748],
    [-18.4087, 140.8782], [-18.2463, 140.8884], [-18.1629, 140.8580], [-17.9385, 140.8452],
    [-17.9286, 140.8146], [-17.8645, 140.7761], [-17.8480, 140.7428], [-17.8624, 140.7158],
    [-17.8466, 140.6963], [-17.7779, 140.7158], [-17.7632, 140.6918], [-17.7435, 140.6911],
    [-17.7436, 140.6768], [-17.7061, 140.6752], [-17.7159, 140.6382], [-17.6911, 140.6499],
    [-17.6958, 140.6268], [-17.6502, 140.6259], [-17.6535, 140.6051], [-17.6225, 140.6370],
    [-17.6044, 140.6247], [-17.5982, 140.5948],
  ],
  // Leichhardt River: headwaters SE of Mount Isa, Lake Moondarra, Lake Julius, Floraville, Gulf of Carpentaria. QLD watercourse lines
  leichhardt: [
    [-20.9450, 139.5682], [-20.8377, 139.5029], [-20.6699, 139.4965], [-20.5810, 139.5680],
    [-20.5767, 139.6251], [-20.5931, 139.6444], [-20.5942, 139.6916], [-20.5627, 139.7281],
    [-20.4017, 139.7679], [-20.3625, 139.7552], [-20.3570, 139.7348], [-20.3152, 139.7430],
    [-20.2822, 139.7180], [-20.2546, 139.7430], [-20.0909, 139.7304], [-20.0583, 139.7614],
    [-20.0750, 139.7754], [-20.0750, 139.7929], [-20.0274, 139.8434], [-20.0706, 139.9262],
    [-20.0553, 140.0243], [-19.9229, 140.1614], [-19.8284, 140.1616], [-19.8234, 140.1363],
    [-19.7355, 140.1100], [-19.7110, 140.1235], [-19.6593, 140.0729], [-19.5242, 140.0727],
    [-19.4945, 140.0591], [-19.4934, 140.0476], [-19.4105, 140.0301], [-19.3675, 140.0418],
    [-19.3637, 140.0269], [-19.3452, 140.0293], [-19.3315, 140.0050], [-19.2717, 140.0155],
    [-19.2145, 139.9659], [-19.1654, 139.9599], [-19.1390, 139.9298], [-19.0364, 139.9351],
    [-19.0358, 139.9128], [-18.9990, 139.8809], [-18.9673, 139.8885], [-18.9731, 139.8655],
    [-18.9423, 139.8475], [-18.9334, 139.8250], [-18.8882, 139.8035], [-18.8676, 139.8219],
    [-18.8456, 139.7972], [-18.8301, 139.8039], [-18.8280, 139.7837], [-18.8111, 139.7926],
    [-18.7598, 139.7634], [-18.7182, 139.7842], [-18.6916, 139.7622], [-18.5915, 139.8368],
    [-18.4950, 139.8673], [-18.2317, 139.8797], [-18.1559, 139.8860], [-18.1179, 139.8471],
    [-18.0896, 139.8460], [-18.0578, 139.8150], [-17.9783, 139.8149], [-17.9531, 139.7741],
    [-17.9327, 139.8172], [-17.9091, 139.7839], [-17.9227, 139.7606], [-17.9125, 139.7509],
    [-17.8705, 139.7733], [-17.8457, 139.7447], [-17.8221, 139.7638], [-17.8036, 139.7524],
    [-17.7230, 139.7996], [-17.7135, 139.7960], [-17.7125, 139.7767], [-17.6927, 139.7796],
    [-17.6962, 139.8173], [-17.6813, 139.8122], [-17.6702, 139.7850], [-17.6560, 139.7908],
    [-17.6496, 139.7748], [-17.6388, 139.8180], [-17.6163, 139.8155], [-17.6001, 139.7908],
    [-17.5755, 139.7962],
  ],
  // Cloncurry River: headwaters S of Cloncurry, Cloncurry, N to the Flinders River. QLD watercourse lines
  cloncurry: [
    [-21.5011, 140.7605], [-21.4805, 140.7680], [-21.4579, 140.7260], [-21.4192, 140.7227],
    [-21.4315, 140.6399], [-21.4165, 140.6201], [-21.3910, 140.5069], [-21.3525, 140.4049],
    [-21.3361, 140.3751], [-21.2845, 140.3394], [-21.2787, 140.3087], [-21.2365, 140.2602],
    [-21.1179, 140.2940], [-21.0685, 140.3566], [-21.0894, 140.3724], [-21.0880, 140.4029],
    [-21.0206, 140.4814], [-20.8787, 140.4877], [-20.8283, 140.5164], [-20.7207, 140.4848],
    [-20.6787, 140.4951], [-20.6276, 140.4920], [-20.5215, 140.5509], [-20.4654, 140.6148],
    [-20.1961, 140.7311], [-20.1592, 140.7734], [-20.1652, 140.7915], [-20.1085, 140.9102],
    [-20.0619, 140.9543], [-20.0664, 141.0227], [-20.0311, 141.1009], [-20.0466, 141.1300],
    [-20.0566, 141.1293], [-20.0472, 141.1935], [-19.9552, 141.2112], [-19.8917, 141.2053],
    [-19.8860, 141.1859], [-19.8623, 141.1739], [-19.8234, 141.1806], [-19.8056, 141.1523],
    [-19.7761, 141.1438], [-19.7615, 141.1134], [-19.7017, 141.0902], [-19.6765, 141.0536],
    [-19.5606, 141.0274], [-19.5552, 141.0125], [-19.5266, 141.0073], [-19.4787, 140.9616],
    [-19.3919, 140.9368], [-19.3586, 140.8904], [-19.3339, 140.8737], [-19.3255, 140.7950],
    [-19.2813, 140.7586], [-19.2382, 140.6726], [-19.2080, 140.6460], [-19.1968, 140.6210],
    [-19.1370, 140.5807], [-19.0162, 140.6067], [-18.8830, 140.5383], [-18.8316, 140.5283],
    [-18.7002, 140.5930], [-18.6016, 140.6748],
  ],

  // ============================================
  // CHANNEL COUNTRY / OUTBACK
  // ============================================
  // Barcoo River / Cooper Creek: Barcoo headwaters, Blackall, Thomson junction near Windorah, Nappa Merrie, to the SA border. QLD watercourse lines
  cooper: [
    [-24.9166, 146.5080], [-24.9136, 146.4565], [-24.9280, 146.4430], [-24.9115, 146.3969],
    [-24.8864, 146.3689], [-24.8937, 146.3432], [-24.8741, 146.3259], [-24.8833, 146.2796],
    [-24.8692, 146.2041], [-24.7213, 146.1474], [-24.6896, 146.0991], [-24.6744, 146.0228],
    [-24.5868, 146.0116], [-24.6129, 145.9639], [-24.5931, 145.9258], [-24.6060, 145.8492],
    [-24.5786, 145.8301], [-24.5826, 145.7976], [-24.5497, 145.7855], [-24.5362, 145.7446],
    [-24.5805, 145.6269], [-24.4820, 145.5176], [-24.4519, 145.5083], [-24.4393, 145.4690],
    [-24.4259, 145.4573], [-24.4448, 145.4077], [-24.3486, 145.3791], [-24.3211, 145.3498],
    [-24.3153, 145.3222], [-24.3023, 145.3094], [-24.3097, 145.2793], [-24.2922, 145.2463],
    [-24.3141, 145.1957], [-24.3037, 145.1797], [-24.3131, 145.1425], [-24.2881, 145.0538],
    [-24.2251, 145.0212], [-24.1048, 145.0030], [-24.0470, 144.9261], [-24.0564, 144.8914],
    [-24.0313, 144.8460], [-24.1034, 144.7236], [-24.0991, 144.6719], [-24.1167, 144.6269],
    [-24.1881, 144.5549], [-24.1917, 144.5076], [-24.2356, 144.4492], [-24.2874, 144.4302],
    [-24.2791, 144.3372], [-24.2991, 144.2571], [-24.3666, 144.1942], [-24.3799, 144.1310],
    [-24.6480, 144.0009], [-24.7324, 143.9107], [-24.8361, 143.8832], [-24.9105, 143.7481],
    [-25.0063, 143.6993], [-25.0255, 143.6162], [-25.1334, 143.5061], [-25.1989, 143.3484],
    [-25.1773, 143.2627], [-25.1998, 143.1351], [-25.2728, 142.9732], [-25.3106, 142.9415],
    [-25.3147, 142.8882], [-25.3753, 142.8217], [-25.4257, 142.8190], [-25.6199, 142.7062],
    [-25.8026, 142.5107], [-25.8428, 142.4271], [-25.8549, 142.3474], [-25.9319, 142.2701],
    [-26.1500, 142.1990], [-26.3425, 142.0816], [-26.4467, 142.0631], [-26.6507, 141.9034],
    [-26.7794, 141.8858], [-26.7956, 141.8617], [-26.9001, 141.8772], [-26.9680, 141.9122],
    [-27.2416, 141.9170], [-27.3292, 141.9587], [-27.5173, 141.9228], [-27.5950, 141.8243],
    [-27.6091, 141.7592], [-27.6076, 141.7052], [-27.5852, 141.6798], [-27.5796, 141.5106],
    [-27.5525, 141.4761], [-27.6005, 141.3517], [-27.5850, 141.3084], [-27.6064, 141.1794],
    [-27.5921, 141.1554], [-27.5974, 141.1073], [-27.6670, 140.9996],
  ],
  // Diamantina River: headwaters SW of Kynuna, Diamantina Lakes, Monkira, Birdsville, to the SA border. QLD watercourse lines
  diamantina: [
    [-21.9707, 141.3924], [-21.9086, 141.3408], [-21.8911, 141.3403], [-21.8042, 141.4164],
    [-21.7489, 141.4872], [-21.6546, 141.7061], [-21.6069, 141.7549], [-21.5788, 142.0105],
    [-21.6209, 142.1276], [-21.6617, 142.1782], [-21.6986, 142.2054], [-21.7083, 142.2277],
    [-21.8988, 142.3637], [-21.9447, 142.4161], [-22.0212, 142.4447], [-22.1490, 142.4470],
    [-22.2001, 142.4166], [-22.5065, 142.3537], [-22.5894, 142.3058], [-22.6626, 142.1950],
    [-22.6805, 142.1253], [-22.7589, 142.0717], [-23.0274, 141.7390], [-23.1707, 141.6951],
    [-23.2667, 141.6109], [-23.4346, 141.4331], [-23.5817, 141.2171], [-23.6726, 141.1264],
    [-23.7726, 141.0859], [-24.0281, 141.1274], [-24.0998, 141.0985], [-24.2334, 141.0927],
    [-24.3920, 140.9605], [-24.4305, 140.8642], [-24.5499, 140.7379], [-24.5525, 140.7024],
    [-24.6121, 140.6734], [-24.6693, 140.6012], [-24.8047, 140.5807], [-24.9788, 140.4560],
    [-25.1424, 140.3769], [-25.2052, 140.3006], [-25.3149, 140.2524], [-25.3882, 140.1388],
    [-25.4015, 140.0358], [-25.7306, 139.7828], [-25.7531, 139.6465], [-25.8172, 139.5506],
    [-25.8264, 139.4758], [-25.8743, 139.4352], [-25.8880, 139.3810], [-25.9432, 139.3461],
    [-25.9966, 139.3556],
  ],
  // Warrego River: Carnarvon Range headwaters, Augathella, Charleville, Cunnamulla, to the NSW border. QLD watercourse lines
  warrego: [
    [-25.0562, 147.4803], [-25.0257, 147.4686], [-25.0326, 147.4535], [-25.0018, 147.4337],
    [-24.9858, 147.4038], [-24.9960, 147.3817], [-24.9844, 147.3823], [-25.0360, 147.3268],
    [-25.0249, 147.3284], [-25.0227, 147.2829], [-25.0661, 147.2566], [-25.0654, 147.2321],
    [-25.0512, 147.2200], [-25.1058, 147.1941], [-25.1512, 147.1313], [-25.2235, 147.1328],
    [-25.2406, 147.0954], [-25.2597, 147.1039], [-25.2672, 147.1234], [-25.2932, 147.1018],
    [-25.3235, 147.1231], [-25.3477, 147.0841], [-25.4239, 147.0628], [-25.4304, 147.0275],
    [-25.4048, 147.0210], [-25.4189, 146.9951], [-25.3980, 146.9709], [-25.4196, 146.9688],
    [-25.4155, 146.9377], [-25.4420, 146.9164], [-25.4203, 146.8854], [-25.4293, 146.8654],
    [-25.5640, 146.7617], [-25.6068, 146.7691], [-25.6214, 146.7049], [-25.7032, 146.6618],
    [-25.7000, 146.6258], [-25.7502, 146.6256], [-25.8029, 146.5693], [-25.8542, 146.5602],
    [-25.8814, 146.4947], [-25.9815, 146.4252], [-26.0637, 146.4064], [-26.1154, 146.4219],
    [-26.2317, 146.3243], [-26.3164, 146.3109], [-26.4080, 146.2245], [-26.4662, 146.2169],
    [-26.5397, 146.1076], [-26.6706, 146.1481], [-26.7105, 146.0825], [-26.7483, 146.1084],
    [-26.8411, 146.0370], [-26.8986, 146.0425], [-26.9906, 145.9551], [-27.0536, 145.9657],
    [-27.1007, 145.9152], [-27.1956, 145.9185], [-27.2209, 145.9545], [-27.2465, 145.9691],
    [-27.2853, 145.9278], [-27.3361, 145.9438], [-27.5597, 145.8288], [-27.6939, 145.8231],
    [-27.8777, 145.6626], [-27.9216, 145.6917], [-28.1171, 145.6858], [-28.1922, 145.6938],
    [-28.2121, 145.7276], [-28.2758, 145.7456], [-28.3824, 145.7075], [-28.4298, 145.7409],
    [-28.4522, 145.7150], [-28.5290, 145.7462], [-28.6856, 145.6057], [-28.7538, 145.6463],
    [-28.8448, 145.6263], [-28.9207, 145.6739], [-28.9992, 145.6685],
  ],
  // Paroo River: headwaters, Eulo, Caiwarro, to the NSW border at Hungerford. QLD watercourse lines
  paroo: [
    [-26.5247, 145.2685], [-26.5903, 145.2812], [-26.6182, 145.2732], [-26.6606, 145.2928],
    [-26.6877, 145.3256], [-26.7441, 145.3261], [-26.8182, 145.3517], [-26.8431, 145.3674],
    [-26.8482, 145.3850], [-26.8921, 145.4069], [-26.9486, 145.4593], [-27.0125, 145.4714],
    [-27.1353, 145.4041], [-27.2722, 145.2909], [-27.4053, 145.2143], [-27.4533, 145.2098],
    [-27.5116, 145.2265], [-27.5495, 145.2049], [-27.5966, 145.2338], [-27.9614, 145.1330],
    [-28.0038, 145.1354], [-28.1523, 145.0562], [-28.1654, 145.0178], [-28.2076, 144.9869],
    [-28.2618, 144.9781], [-28.3019, 144.9366], [-28.3653, 144.9193], [-28.4185, 144.8583],
    [-28.5371, 144.8403], [-28.5690, 144.8574], [-28.6613, 144.8192], [-28.6909, 144.7857],
    [-28.7932, 144.6916], [-28.8160, 144.6265], [-28.9135, 144.5664], [-28.9422, 144.4693],
    [-28.9998, 144.3956],
  ],

  // ============================================
  // CAPE YORK
  // ============================================
  // Mitchell River: headwaters W of Mossman, past Mount Carbine, Dunbar (Koolatah), Gulf of Carpentaria (Walsh River tributary not drawn). QLD watercourse lines
  mitchell: [
    [-16.8965, 145.3890], [-16.8728, 145.3890], [-16.8429, 145.3530], [-16.8170, 145.3518],
    [-16.7940, 145.3081], [-16.7618, 145.2977], [-16.7504, 145.2775], [-16.7652, 145.2495],
    [-16.7253, 145.2164], [-16.5908, 145.1677], [-16.5361, 145.0335], [-16.5282, 145.0052],
    [-16.5449, 144.9609], [-16.5015, 144.9216], [-16.5421, 144.9202], [-16.5974, 144.8466],
    [-16.5766, 144.8150], [-16.5833, 144.7758], [-16.5624, 144.7682], [-16.5793, 144.7317],
    [-16.5784, 144.6677], [-16.6807, 144.6304], [-16.6105, 144.5963], [-16.6254, 144.5743],
    [-16.6140, 144.5629], [-16.6005, 144.5004], [-16.5422, 144.4779], [-16.5341, 144.4462],
    [-16.5062, 144.4351], [-16.5146, 144.3844], [-16.4949, 144.3720], [-16.4908, 144.3397],
    [-16.4720, 144.3279], [-16.4806, 144.2490], [-16.4565, 144.2235], [-16.4987, 144.1603],
    [-16.4878, 144.0940], [-16.4693, 144.0808], [-16.4593, 144.0518], [-16.3943, 144.0339],
    [-16.3799, 143.9828], [-16.3653, 143.9686], [-16.3604, 143.9308], [-16.3820, 143.8927],
    [-16.3748, 143.8493], [-16.3871, 143.8253], [-16.4731, 143.7557], [-16.4808, 143.7184],
    [-16.5356, 143.6909], [-16.5085, 143.6090], [-16.5307, 143.5783], [-16.5304, 143.5255],
    [-16.5093, 143.5101], [-16.5148, 143.4786], [-16.4928, 143.4425], [-16.5229, 143.4285],
    [-16.4816, 143.3894], [-16.4909, 143.3598], [-16.4648, 143.3272], [-16.4504, 143.2848],
    [-16.4313, 143.2724], [-16.4475, 143.2423], [-16.4278, 143.2220], [-16.4281, 143.1770],
    [-16.3910, 143.1341], [-16.3677, 143.0736], [-16.3166, 143.0530], [-16.3042, 143.0138],
    [-16.2686, 143.0066], [-16.2229, 142.9704], [-16.1766, 142.8454], [-16.1339, 142.8158],
    [-16.1339, 142.7695], [-16.0753, 142.7124], [-16.0584, 142.6526], [-16.0148, 142.6276],
    [-16.0173, 142.5613], [-15.9973, 142.5372], [-15.9908, 142.4968], [-15.9650, 142.4487],
    [-15.9545, 142.4475], [-15.9759, 142.3842], [-15.9461, 142.3765], [-15.9167, 142.3587],
    [-15.9303, 142.3010], [-15.8337, 142.2465], [-15.7969, 142.2434], [-15.7604, 142.1995],
    [-15.7176, 142.1797], [-15.6579, 142.0970], [-15.6360, 142.1057], [-15.5855, 142.0917],
    [-15.5648, 142.0718], [-15.5509, 142.0773], [-15.5164, 142.0244], [-15.4632, 142.0070],
    [-15.3985, 141.9411], [-15.3550, 141.9673], [-15.3428, 141.9425], [-15.2936, 141.8980],
    [-15.2954, 141.8173], [-15.2322, 141.7663], [-15.2236, 141.7310], [-15.2469, 141.6971],
    [-15.2250, 141.6603], [-15.2303, 141.6344], [-15.2136, 141.6300], [-15.2166, 141.6120],
    [-15.2011, 141.5926],
  ],
  // Normanby River: headwaters S of Battle Camp, Battle Camp, Kalpowar Crossing, Princess Charlotte Bay. QLD watercourse lines
  normanby: [
    [-15.6603, 144.9375], [-15.6545, 144.9225], [-15.6100, 144.9198], [-15.5922, 144.9041],
    [-15.5553, 144.8987], [-15.5497, 144.8913], [-15.5582, 144.8841], [-15.5515, 144.8801],
    [-15.5087, 144.8832], [-15.4939, 144.8685], [-15.4852, 144.8853], [-15.4500, 144.8771],
    [-15.4363, 144.8921], [-15.4242, 144.8660], [-15.3840, 144.8749], [-15.3614, 144.8528],
    [-15.3518, 144.8566], [-15.3415, 144.8426], [-15.3236, 144.8527], [-15.2813, 144.8382],
    [-15.2462, 144.8016], [-15.2675, 144.7911], [-15.2465, 144.7480], [-15.2656, 144.7312],
    [-15.2478, 144.7028], [-15.2525, 144.6451], [-15.2615, 144.6349], [-15.2508, 144.6048],
    [-15.2543, 144.5911], [-15.2421, 144.5772], [-15.2487, 144.5697], [-15.2460, 144.5367],
    [-15.2610, 144.5230], [-15.2385, 144.5117], [-15.2404, 144.4994], [-15.2232, 144.4956],
    [-15.2219, 144.4750], [-15.2094, 144.4690], [-15.1956, 144.4482], [-15.1970, 144.4212],
    [-15.1738, 144.4118], [-15.1614, 144.3885], [-15.1647, 144.3700], [-15.1459, 144.3477],
    [-15.1157, 144.3335], [-15.1049, 144.3420], [-15.0685, 144.3322], [-15.0137, 144.3447],
    [-14.9982, 144.3256], [-14.9453, 144.3082], [-14.9373, 144.2604], [-14.9255, 144.2468],
    [-14.9300, 144.2222], [-14.9178, 144.2119], [-14.8503, 144.1981], [-14.7742, 144.2100],
    [-14.7393, 144.1715], [-14.6998, 144.1623], [-14.6738, 144.1905], [-14.6469, 144.1839],
    [-14.6101, 144.1969], [-14.5914, 144.1867], [-14.6000, 144.1837], [-14.5918, 144.1714],
    [-14.5904, 144.1818], [-14.5778, 144.1813], [-14.5750, 144.1653], [-14.5741, 144.1772],
    [-14.5664, 144.1703], [-14.5523, 144.1782], [-14.5493, 144.1623], [-14.5470, 144.1755],
    [-14.5292, 144.1752], [-14.5215, 144.1625], [-14.5079, 144.1740], [-14.5004, 144.1571],
    [-14.4871, 144.1548], [-14.4858, 144.1428], [-14.4515, 144.1458], [-14.4484, 144.1585],
    [-14.4400, 144.1426], [-14.4085, 144.1425],
  ],

  // ============================================
  // GULF COUNTRY
  // ============================================
  // Norman River: Gregory Range headwaters, Glenore Weir, Normanton, Karumba. QLD watercourse lines
  norman: [
    [-19.5423, 143.3434], [-19.5414, 143.2069], [-19.5993, 143.1744], [-19.6210, 143.1284],
    [-19.6154, 143.0613], [-19.5834, 143.0080], [-19.5882, 142.9317], [-19.5722, 142.9034],
    [-19.5177, 142.8750], [-19.5129, 142.8505], [-19.5022, 142.8492], [-19.4761, 142.8019],
    [-19.4361, 142.7999], [-19.3978, 142.7635], [-19.3631, 142.7567], [-19.3417, 142.5369],
    [-19.3250, 142.4573], [-19.3114, 142.4440], [-19.3189, 142.3988], [-19.3113, 142.3633],
    [-19.2797, 142.3114], [-19.2943, 142.0598], [-19.2874, 142.0280], [-19.2469, 141.9919],
    [-19.2319, 141.9196], [-19.2088, 141.8978], [-19.2235, 141.8079], [-19.2096, 141.7772],
    [-19.1946, 141.7689], [-19.1801, 141.7144], [-19.1568, 141.6918], [-19.1489, 141.6214],
    [-19.0908, 141.5989], [-19.0544, 141.5658], [-19.0472, 141.5393], [-19.0075, 141.5225],
    [-18.9665, 141.4671], [-18.9074, 141.4414], [-18.8899, 141.4134], [-18.8329, 141.3971],
    [-18.8150, 141.3482], [-18.7755, 141.3126], [-18.6800, 141.3244], [-18.5193, 141.2833],
    [-18.4309, 141.3031], [-18.3528, 141.2538], [-18.3226, 141.2201], [-18.2197, 141.1871],
    [-18.1888, 141.1372], [-17.9909, 141.1236], [-17.9871, 141.0990], [-17.9681, 141.0839],
    [-17.8611, 141.1300], [-17.7863, 141.1185], [-17.7685, 141.0970], [-17.6924, 141.1059],
    [-17.6493, 141.0860], [-17.6576, 141.0555], [-17.6239, 141.0215], [-17.6211, 141.0032],
    [-17.6401, 140.9746], [-17.6152, 140.9752], [-17.6319, 140.9508], [-17.6234, 140.9341],
    [-17.5989, 140.9773], [-17.5804, 140.9649], [-17.5871, 140.9399], [-17.5735, 140.9217],
    [-17.5852, 140.8949], [-17.5427, 140.8897], [-17.5431, 140.9140], [-17.5186, 140.8993],
    [-17.5460, 140.8725], [-17.5275, 140.8343], [-17.5482, 140.8027], [-17.5197, 140.7893],
    [-17.4764, 140.8371],
  ],

  // ============================================
  // BOWEN AREA
  // ============================================
  // Don River: Clarke Range, Ida Creek, mouth E of Bowen. QLD watercourse lines
  don: [
    [-20.5515, 148.2770], [-20.5434, 148.2653], [-20.5450, 148.2449], [-20.5265, 148.2146],
    [-20.5182, 148.2190], [-20.5063, 148.2111], [-20.5026, 148.2002], [-20.4827, 148.1757],
    [-20.4554, 148.1641], [-20.4342, 148.1699], [-20.4287, 148.1629], [-20.4115, 148.1625],
    [-20.3887, 148.1375], [-20.3860, 148.1295], [-20.3781, 148.1324], [-20.3687, 148.1230],
    [-20.3529, 148.1221], [-20.3492, 148.1109], [-20.3263, 148.1132], [-20.3102, 148.1031],
    [-20.2881, 148.1163], [-20.2723, 148.1142], [-20.2652, 148.1064], [-20.2584, 148.1147],
    [-20.2318, 148.1070], [-20.2145, 148.1280], [-20.1906, 148.1301], [-20.1823, 148.1470],
    [-20.1664, 148.1364], [-20.1593, 148.1404], [-20.1586, 148.1542], [-20.1365, 148.1522],
    [-20.1243, 148.1640], [-20.1035, 148.1560], [-20.0687, 148.1715], [-20.0683, 148.1857],
    [-20.0526, 148.2007], [-20.0286, 148.1968], [-20.0027, 148.2058], [-19.9900, 148.1985],
    [-19.9647, 148.2236],
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
