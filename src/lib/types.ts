// Flood status levels
export type FloodStatus = 'safe' | 'watch' | 'warning' | 'danger' | 'offline'

// Trend indicators
export type Trend = 'rising' | 'falling' | 'stable'

// River systems in the Fitzroy Basin and Burnett Basin
export type RiverSystem =
  | 'clermont'
  | 'theresa'
  | 'wolfang'
  | 'douglas'
  | 'isaac'
  | 'nogoa'
  | 'mackenzie'
  | 'comet'
  | 'fitzroy'
  | 'burnett'

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
  source: 'qldtraffic'
  sourceUrl: string // Link to verify on QLDTraffic
  lastUpdated: string
}

export interface RoadEventsResponse {
  events: RoadEvent[]
  lastUpdated: string
  source: 'qldtraffic'
  sourceUrl: string // Main QLDTraffic URL for verification
}
