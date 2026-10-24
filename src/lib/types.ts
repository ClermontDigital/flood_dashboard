// Flood status levels
export type FloodStatus = 'safe' | 'watch' | 'warning' | 'danger' | 'offline'

// Trend indicators
export type Trend = 'rising' | 'falling' | 'stable'

// River systems across Queensland
export type RiverSystem =
  // Fitzroy Basin
  | 'clermont'
  | 'theresa'
  | 'wolfang'
  | 'douglas'
  | 'isaac'
  | 'nogoa'
  | 'mackenzie'
  | 'comet'
  | 'fitzroy'
  // Burnett Basin
  | 'burnett'
  | 'kolan'
  // Brisbane Basin
  | 'brisbane'
  | 'bremer'
  | 'lockyer'
  | 'northpine'
  | 'mooloolah'
  // Logan-Albert Basin
  | 'logan'
  | 'albert'
  // Gold Coast
  | 'nerang'
  | 'coomera'
  // Mary River Basin
  | 'mary'
  // Burdekin Basin (Townsville)
  | 'burdekin'
  | 'ross'
  // Herbert Basin
  | 'herbert'
  // Cairns/Far North
  | 'barron'
  | 'mulgrave'
  | 'johnstone'
  | 'tully'
  | 'daintree'
  // Mackay/Pioneer
  | 'pioneer'
  | 'proserpine'
  | 'broken'
  // Condamine-Balonne (Darling Downs)
  | 'condamine'
  // Western Queensland
  | 'flinders'
  | 'leichhardt'
  | 'cloncurry'
  // Channel Country / Outback
  | 'cooper'
  | 'diamantina'
  | 'warrego'
  | 'paroo'
  // Cape York
  | 'mitchell'
  | 'normanby'
  // Gulf Country
  | 'norman'
  // Bowen area
  | 'don'

// Gauge station data
export interface GaugeStation {
  id: string
  name: string
  stream: string
  riverSystem: RiverSystem
  lat: number
  lng: number
  role: string
  isOffline?: boolean
  lastDataYear?: number // Year when gauge last had data (for offline gauges)
  reportingIntervalMinutes?: number // Expected reporting interval (default: 15, some gauges: 60)
}

// Water level reading
export interface WaterLevel {
  gaugeId: string
  level: number
  unit: string
  trend: Trend
  changeRate: number // m/hr
  status: FloodStatus
  timestamp: string
  source: 'wmip' | 'bom'
}

// Discharge/flow reading
export interface DischargeReading {
  gaugeId: string
  value: number
  unit: 'ML/d' | 'cumec' // Megalitres per day or cubic meters per second
  timestamp: string
  source: 'bom'
}

// Dam storage reading
export interface DamStorageReading {
  stationId: string
  name: string
  volume: number // ML
  volumeUnit: 'ML'
  level: number // m (elevation)
  levelUnit: 'm'
  percentFull?: number // calculated if capacity known
  timestamp: string
  source: 'bom'
}

// Rainfall reading at gauge
export interface RainfallReading {
  gaugeId: string
  value: number
  unit: 'mm'
  period: 'daily' | 'hourly'
  timestamp: string
  source: 'bom'
}

// Dam station configuration
export interface DamStation {
  id: string
  name: string
  river: string
  riverSystem: RiverSystem
  lat: number
  lng: number
  capacity?: number // ML - total storage capacity
  isOffline?: boolean // No real-time monitoring data available
  offlineReason?: string // Explanation for why data is unavailable
}

// Combined gauge data for display
export interface GaugeData {
  station: GaugeStation
  reading: WaterLevel | null
  thresholds: FloodThresholds | null
  discharge?: DischargeReading | null
  rainfall?: RainfallReading | null
  uptime?: {
    rollingUptime7d: number
    lastReportTimestamp: string | null
  }
}

// Flood thresholds for a gauge
export interface FloodThresholds {
  minor: number
  moderate: number
  major: number
}

// Historical data point
export interface HistoryPoint {
  timestamp: string
  level: number
}

// Prediction data
export interface Prediction {
  time: string // e.g., "+2h"
  level: number
  confidence: number // 0-1
}

// Upstream trigger info
export interface UpstreamTrigger {
  station: string
  level: number
  eta: string // e.g., "4-6 hours"
}

// API response types
export interface WaterLevelsResponse {
  timestamp: string
  gauges: GaugeData[]
  sources: string[]
  damStorage?: DamStorageReading[]
}

export interface PredictionsResponse {
  gaugeId: string
  current: number
  predicted: Prediction[]
  upstreamTrigger: UpstreamTrigger | null
}

export interface WarningsResponse {
  active: boolean
  warnings: FloodWarning[]
  lastChecked: string
}

export interface FloodWarning {
  id: string
  title: string
  area: string
  level: 'minor' | 'moderate' | 'major'
  issueTime: string
  summary: string
  url: string
}

// Search result
export interface SearchResult {
  type: 'gauge' | 'town' | 'river'
  id: string
  name: string
  description: string
  lat: number
  lng: number
}

// User preferences (stored in localStorage)
export interface UserPreferences {
  alertGauges: string[] // gauge IDs to receive alerts for
  lastViewedGauge: string | null
  mapZoom: number
  mapCenter: [number, number]
}

// Camera station for flood/traffic monitoring
export interface CameraStation {
  id: string
  name: string
  description: string
  lat: number
  lng: number
  riverSystem?: RiverSystem
  imageUrl: string // Live image URL
  videoUrl?: string // Optional video stream URL
  source: 'tmr' | 'council' | 'bom' // Transport and Main Roads, Council, or BOM
  lastUpdated?: string
}

// Road closure/event from QLDTraffic
export interface RoadEvent {
  id: string
  type: 'flooding' | 'road_closure' | 'hazard' | 'roadworks' | 'crash' | 'congestion' | 'special_event'
  title: string
  description: string
  road: string
  suburb?: string
  direction?: string
  lat: number
  lng: number
  startTime?: string
  endTime?: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  source: 'qldtraffic' | 'council'
  council?: string // Council name when source is 'council'
  sourceUrl: string // Link to verify on QLDTraffic or the council disaster dashboard
  lastUpdated: string
}

export interface RoadEventsResponse {
  events: RoadEvent[]
  lastUpdated: string
  source: 'qldtraffic'
  sourceUrl: string // Main QLDTraffic URL for verification
}

// Flood camera from council dashboard
export interface FloodCamera {
  id: number
  description: string
  lat: number
  lng: number
  imageUrls: string[]
  source: string
}

export interface FloodCamerasResponse {
  cameras: FloodCamera[]
  lastUpdated: string
}

// Gauge uptime tracking
export interface DailyUptimeStat {
  date: string // "2026-01-23" (AEST)
  uptime: number // 0-100 percentage
  expectedReports: number
  actualReports: number
  dataSource?: 'backfill' | 'ongoing' // Indicates how this data was collected
}

export interface GaugeUptimeData {
  rollingUptime7d: number // 7-day rolling average percentage
  lastReportTimestamp: string | null
  dailyStats: DailyUptimeStat[]
  detectedIntervalMinutes?: number // Auto-detected reporting interval (15, 30, or 60 min)
}

export interface GaugeUptimeSummary {
  [gaugeId: string]: {
    rollingUptime7d: number
    lastReportTimestamp: string | null
  }
}

// ---- Council disaster dashboards (QIT Plus "Guardian" platform) ----

// Per-council fetch outcome, so a dead feed is visible rather than looking like "nothing to report"
export interface CouncilFeedStatus {
  council: string
  ok: boolean
  count: number
  error?: string
}

// Road closures entered by council staff (merged with QLDTraffic on the map)
export interface CouncilRoadsResponse {
  events: RoadEvent[] // source: 'council'
  councils: CouncilFeedStatus[]
  lastUpdated: string
}

// Evacuation centres, sandbag points and other active centres
export interface ActiveCentre {
  id: string
  council: string
  name: string
  type: string        // e.g. 'Evacuation Centre', 'Sandbag Collection Point'
  status: string      // e.g. 'Open', 'Available', 'Closed'
  isOpen: boolean
  address?: string
  note?: string
  organisation?: string
  lat: number
  lng: number
  lastUpdated?: string
  sourceUrl: string   // Council disaster dashboard
}

export interface ActiveCentresResponse {
  centres: ActiveCentre[]
  councils: CouncilFeedStatus[]
  lastUpdated: string
}

// Council-run water level sensors (creeks, floodways) with their own thresholds
export type CouncilSensorStatus = 'normal' | 'over_road' | 'minor' | 'moderate' | 'major' | 'nodata'

export interface CouncilSensor {
  id: string
  council: string
  name: string
  lat: number
  lng: number
  level: number | null       // metres, latest reading
  timestamp: string | null   // ISO, latest reading
  roadLevel: number | null   // level at which water is over the road/floodway, if published
  thresholds: FloodThresholds | null
  status: CouncilSensorStatus
  history: { timestamp: string; level: number }[] // ~last 24 hours, oldest first, for a sparkline
  sourceUrl: string
}

export interface CouncilSensorsResponse {
  sensors: CouncilSensor[]
  councils: CouncilFeedStatus[]
  lastUpdated: string
}

// Fuel availability (statewide ArcGIS layer)
export type FuelSiteStatus = 'available' | 'partial' | 'unavailable' | 'unknown'

export interface FuelSite {
  id: string
  name: string
  brand?: string
  address?: string
  lat: number
  lng: number
  status: FuelSiteStatus
  fuels: { type: string; available: boolean | null; price: number | null }[]
  lastUpdated?: string
}

export interface FuelResponse {
  sites: FuelSite[]
  lastUpdated: string
  sourceUrl: string
}

// Council flood-extent maps: the area expected to flood at a given gauge height (planning maps, not live)
export interface FloodExtentLevel {
  level: number    // gauge height in metres
  tileUrl: string  // Leaflet tile template, e.g. https://.../MapServer/tile/{z}/{y}/{x}
}

export interface FloodExtentSet {
  id: string
  town: string
  river: string
  gaugeName: string          // The gauge the levels refer to, e.g. 'Fitzroy River at Rockhampton'
  gaugeId?: string           // GAUGE_STATIONS id when we track that gauge
  council: string
  center: [number, number]
  zoom: number
  levels: FloodExtentLevel[]
  sourceUrl: string
}
