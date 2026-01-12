/**
 * Weather Observations Client
 *
 * Fetches current weather using Open-Meteo API (BOM blocks direct server requests).
 * Data is for Clermont region, QLD.
 *
 * @see https://open-meteo.com/
 */

export interface BOMObservation {
  stationName: string
  stationId: string
  timestamp: string
  temperature: number | null  // Current air temp in Celsius
  apparentTemp: number | null // "Feels like" temperature
  humidity: number | null     // Relative humidity %
  windSpeed: number | null    // Wind speed km/h
  windDirection: string | null // Wind direction (N, NE, etc)
  windGust: number | null     // Wind gust km/h
  pressure: number | null     // Pressure hPa
  rainfall: number | null     // Current precipitation mm
  cloud: string | null        // Cloud cover description
  description: string | null  // Weather description
}

export interface BOMWeatherResponse {
  success: boolean
  data: BOMObservation | null
  error?: string
}

// Clermont coordinates
const CLERMONT_LAT = -22.8245
const CLERMONT_LNG = 147.6392
const CLERMONT_STATION_ID = '94363'

const API_TIMEOUT = 10000

// Map weather codes to descriptions
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

/**
 * Convert wind degrees to compass direction
 */
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

/**
 * Fetches current weather from Open-Meteo for Clermont region
 * (BOM blocks direct server API requests)
 */
export async function fetchBOMWeather(stationId: string = CLERMONT_STATION_ID): Promise<BOMWeatherResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    // Use Open-Meteo for current weather (BOM blocks direct server access)
    const params = new URLSearchParams({
      latitude: CLERMONT_LAT.toString(),
      longitude: CLERMONT_LNG.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover',
      hourly: 'precipitation',
      past_hours: '12',
      forecast_hours: '1',
      timezone: 'Australia/Brisbane',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`)
    }

    const data = await response.json()
    const current = data?.current

    if (!current) {
      return { success: false, data: null, error: 'No current weather data' }
    }

    // Calculate recent rainfall (sum of last 12 hours of hourly precipitation)
    const hourlyPrecip = data?.hourly?.precipitation || []
    const recentRainfall = hourlyPrecip.reduce((sum: number, val: number) => sum + (val || 0), 0)

    // Get cloud cover description
    let cloudDesc: string | null = null
    if (current.cloud_cover !== undefined) {
      if (current.cloud_cover >= 80) cloudDesc = 'Overcast'
      else if (current.cloud_cover >= 50) cloudDesc = 'Cloudy'
      else if (current.cloud_cover >= 20) cloudDesc = 'Partly cloudy'
      else cloudDesc = 'Clear'
    }

    const observation: BOMObservation = {
      stationName: 'Clermont Region',
      stationId: stationId,
      timestamp: current.time,
      temperature: current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : null,
      apparentTemp: current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature * 10) / 10 : null,
      humidity: current.relative_humidity_2m ?? null,
      windSpeed: current.wind_speed_10m ? Math.round(current.wind_speed_10m) : null,
      windDirection: current.wind_direction_10m !== undefined ? getWindDirection(current.wind_direction_10m) : null,
      windGust: current.wind_gusts_10m ? Math.round(current.wind_gusts_10m) : null,
      pressure: current.surface_pressure ? Math.round(current.surface_pressure) : null,
      rainfall: Math.round(recentRainfall * 10) / 10, // Recent rainfall in last 12 hours
      cloud: cloudDesc,
      description: WEATHER_DESCRIPTIONS[current.weather_code] || cloudDesc || 'Unknown',
    }

    return { success: true, data: observation }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Weather fetch error:', error)
    return { success: false, data: null, error: String(error) }
  }
}

/**
 * Gets weather description based on conditions
 */
export function getWeatherDescription(obs: BOMObservation): string {
  if (obs.description) return obs.description

  if (obs.rainfall && obs.rainfall > 0) {
    if (obs.rainfall > 10) return 'Heavy rain'
    if (obs.rainfall > 2) return 'Rain'
    return 'Light rain'
  }

  if (obs.cloud) {
    if (obs.cloud.toLowerCase().includes('overcast')) return 'Overcast'
    if (obs.cloud.toLowerCase().includes('cloudy')) return 'Cloudy'
    if (obs.cloud.toLowerCase().includes('partly')) return 'Partly cloudy'
  }

  return 'Fine'
}

/**
 * Gets wind description
 */
export function getWindDescription(speed: number | null): string {
  if (!speed || speed === 0) return 'Calm'
  if (speed < 20) return 'Light'
  if (speed < 40) return 'Moderate'
  if (speed < 60) return 'Fresh'
  if (speed < 80) return 'Strong'
  return 'Gale'
}

const bomWeatherClient = {
  fetchBOMWeather,
  getWeatherDescription,
  getWindDescription,
  CLERMONT_STATION_ID,
}

export default bomWeatherClient
