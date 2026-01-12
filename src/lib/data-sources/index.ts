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
  getRainfallIntensity,
  getRainfallRisk,
  type RainfallPoint,
  type RainfallSummary,
  type RainfallResponse,
} from './rainfall'
