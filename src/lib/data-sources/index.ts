/**
 * Data Sources Index
 * Re-exports all data source clients for convenient importing
 */

export {
  fetchWMIPWaterLevel,
  fetchWMIPHistory,
  fetchWMIPMultipleGauges,
  fetchWMIPThresholds,
  type WMIPResponse,
  type WMIPHistoryResponse,
} from './wmip'

export {
  fetchBOMWaterLevel,
  fetchBOMWaterLevelResponse,
  fetchBOMWaterLevels,
  fetchBOMHistory,
  fetchBOMHistoryResponse,
  fetchBOMMultipleGauges,
  fetchAllBOMWaterLevels,
  checkBOMServiceStatus,
  fetchBOMDischarge,
  fetchBOMDamStorage,
  fetchAllBOMDamStorage,
  fetchBOMRainfall,
  fetchBOMExtendedData,
  type BOMWaterResponse,
  type BOMHistoryResponse,
} from './bom'

export {
  fetchBOMWarnings,
  fetchProductWarnings,
  fetchFitzroyBasinWarnings,
  getWarningsResponse,
  hasActiveMajorWarnings,
  getHighestWarningLevel,
} from './warnings'

export {
  fetchRainfall,
  fetchRainfallForGauges,
  fetchRegionalRainfall,
  fetchStateRainfall,
  getRainfallIntensity,
  getRainfallRisk,
  type RainfallPoint,
  type RainfallSummary,
  type RainfallResponse,
  type StateRainfallSummary,
  type StateRainfallResponse,
} from './rainfall'

export {
  fetchBOMWeather,
  getWeatherDescription,
  getWindDescription,
  type BOMObservation,
  type BOMWeatherResponse,
} from './bom-weather'

export {
  fetchFloodForecast,
  fetchGaugeFloodData,
  fetchMultipleGaugeFloodData,
  FLOOD_API_ATTRIBUTION,
  type FloodForecast,
  type GaugeFloodData,
  type FloodDataResponse,
} from './open-meteo-flood'
