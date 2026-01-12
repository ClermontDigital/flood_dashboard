// Flood status levels
export type FloodStatus = 'safe' | 'watch' | 'warning' | 'danger'

// Trend indicators
export type Trend = 'rising' | 'falling' | 'stable'

// River systems in the Fitzroy Basin
export type RiverSystem =
  | 'clermont'
  | 'isaac'
  | 'nogoa'
  | 'mackenzie'
  | 'comet'
  | 'fitzroy'

// Gauge station data
export interface GaugeStation {
  id: string
  name: string
  stream: string
  riverSystem: RiverSystem
  lat: number
  lng: number
  role: string
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

// Combined gauge data for display
export interface GaugeData {
  station: GaugeStation
  reading: WaterLevel | null
  thresholds: FloodThresholds | null
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
