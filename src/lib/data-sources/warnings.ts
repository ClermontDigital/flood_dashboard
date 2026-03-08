/**
 * Bureau of Meteorology (BOM) Flood Warnings API Client
 *
 * Fetches flood warnings from BOM's public JSON API.
 * Focuses on Queensland flood warnings.
 *
 * API endpoint: https://api.weather.bom.gov.au/v1/warnings
 */

import type { FloodWarning, WarningsResponse } from '../types'

const BOM_WARNINGS_API = 'https://api.weather.bom.gov.au/v1/warnings'

// BOM API warning item
interface BOMWarningItem {
  id: string
  type: string
  title: string
  short_title: string
  state: string
  states: string[]
  warning_group_type: string
  issue_time: string
  expiry_time: string
  phase: string
}

/**
 * Parse warning level from BOM warning type and title
 */
function parseWarningLevel(warning: BOMWarningItem): 'minor' | 'moderate' | 'major' {
  const title = warning.title.toLowerCase()

  if (title.includes('major flood')) return 'major'
  if (title.includes('moderate flood')) return 'moderate'
  if (title.includes('minor flood')) return 'minor'

  // Flood watches are treated as minor
  if (warning.type === 'flood_watch') return 'minor'

  // Default flood warnings to minor
  return 'minor'
}

/**
 * Convert BOM API warning to FloodWarning type
 */
function convertToFloodWarning(warning: BOMWarningItem): FloodWarning {
  // Use short_title as the display title, full title has all the river locations
  const displayTitle = warning.short_title || warning.title
  // Extract a concise area from the full title (first location before the first comma)
  const area = warning.title.split(',')[0].trim()

  return {
    id: warning.id,
    title: displayTitle,
    area,
    level: parseWarningLevel(warning),
    issueTime: warning.issue_time,
    summary: `${warning.phase}. ${area}. Expires ${new Date(warning.expiry_time).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}.`,
    url: 'http://www.bom.gov.au/qld/flood/',
  }
}

/**
 * Fetch flood warnings from BOM JSON API
 */
export async function fetchBOMWarnings(): Promise<FloodWarning[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(BOM_WARNINGS_API, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; GaugeQLD/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[Warnings] HTTP ${response.status} from BOM warnings API`)
      return []
    }

    const json = await response.json()
    const items: BOMWarningItem[] = json.data || []

    // Filter to QLD flood warnings and flood watches only
    const qldFloodWarnings = items.filter(w =>
      w.states.includes('QLD') &&
      (w.type === 'flood_warning' || w.type === 'flood_watch')
    )

    // Filter out expired warnings
    const now = new Date()
    const activeWarnings = qldFloodWarnings.filter(w => {
      if (!w.expiry_time) return true
      return new Date(w.expiry_time) > now
    })

    // Convert to FloodWarning type
    const warnings = activeWarnings.map(convertToFloodWarning)

    // Sort by issue time (most recent first)
    warnings.sort((a, b) =>
      new Date(b.issueTime).getTime() - new Date(a.issueTime).getTime()
    )

    console.log(`[Warnings] Fetched ${warnings.length} active QLD flood warnings from BOM API`)
    return warnings
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('[Warnings] Request timeout fetching BOM warnings')
      } else {
        console.error('[Warnings] Error fetching BOM warnings:', error.message)
      }
    }
    return []
  }
}

/**
 * Fetch warnings from a specific BOM product (kept for compatibility)
 */
export async function fetchProductWarnings(productId: string): Promise<FloodWarning[]> {
  // The new API returns all warnings at once, filter by product ID
  const allWarnings = await fetchBOMWarnings()
  return allWarnings.filter(w => w.id === productId)
}

/**
 * Fetch Fitzroy Basin specific flood warnings
 */
export async function fetchFitzroyBasinWarnings(): Promise<FloodWarning[]> {
  // Fetch all QLD warnings from the new API
  return fetchBOMWarnings()
}

/**
 * Get full warnings response with metadata
 */
export async function getWarningsResponse(): Promise<WarningsResponse> {
  const warnings = await fetchBOMWarnings()

  return {
    active: warnings.length > 0,
    warnings,
    lastChecked: new Date().toISOString(),
  }
}

/**
 * Check if there are any active major warnings
 */
export async function hasActiveMajorWarnings(): Promise<boolean> {
  const warnings = await fetchBOMWarnings()
  return warnings.some(w => w.level === 'major')
}

/**
 * Get the highest warning level currently active
 */
export async function getHighestWarningLevel(): Promise<'none' | 'minor' | 'moderate' | 'major'> {
  const warnings = await fetchBOMWarnings()

  if (warnings.length === 0) return 'none'
  if (warnings.some(w => w.level === 'major')) return 'major'
  if (warnings.some(w => w.level === 'moderate')) return 'moderate'
  return 'minor'
}

const warningsClient = {
  fetchBOMWarnings,
  fetchProductWarnings,
  fetchFitzroyBasinWarnings,
  getWarningsResponse,
  hasActiveMajorWarnings,
  getHighestWarningLevel,
}

export default warningsClient
