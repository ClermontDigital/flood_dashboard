/**
 * Bureau of Meteorology (BOM) Flood Warnings API Client
 *
 * This module fetches and parses flood warnings from BOM's public feeds.
 * Focuses on Queensland flood warnings, particularly for the Fitzroy Basin area.
 *
 * Warning feeds:
 * - Queensland flood warnings XML: http://www.bom.gov.au/fwo/IDQ60000.warnings_qld.xml
 * - Fitzroy Basin specific: http://www.bom.gov.au/fwo/IDQ20825.amoc.xml
 */

import type { FloodWarning, WarningsResponse } from '../types'
import { BOM_WARNINGS_URL } from '../constants'

// BOM warning product IDs for Fitzroy Basin area
const FITZROY_BASIN_PRODUCTS = [
  'IDQ20825', // Fitzroy River Basin flood warning
  'IDQ20800', // Queensland flood summary
  'IDQ20705', // Central Coast and Whitsundays flood warning
]

// Areas of interest for filtering warnings
const FITZROY_BASIN_AREAS = [
  'fitzroy',
  'mackenzie',
  'isaac',
  'nogoa',
  'dawson',
  'comet',
  'connors',
  'clermont',
  'emerald',
  'rockhampton',
  'central queensland',
  'central highlands',
]

// Parsed warning from BOM XML
interface RawBOMWarning {
  identifier: string
  title: string
  area: string
  phase: string
  issueTime: string
  expireTime?: string
  text: string
  productId: string
}

/**
 * Parse BOM warning level from text content
 */
function parseWarningLevel(text: string, title: string): 'minor' | 'moderate' | 'major' {
  const combined = `${title} ${text}`.toLowerCase()

  if (combined.includes('major flood')) {
    return 'major'
  }
  if (combined.includes('moderate flood')) {
    return 'moderate'
  }
  // Default to minor for any flood warning
  return 'minor'
}

/**
 * Extract summary from warning text
 * BOM warnings can be quite long - extract the key information
 */
function extractSummary(text: string, maxLength: number = 200): string {
  // Remove XML artifacts and excessive whitespace
  let cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Try to find key sentences about current situation
  const sentences = cleaned.split(/[.!]/g).map(s => s.trim()).filter(Boolean)

  // Look for sentences containing key phrases
  const keyPhrases = [
    'flooding',
    'flood warning',
    'river level',
    'water level',
    'rising',
    'falling',
    'expected',
    'forecast',
    'peak',
  ]

  const relevantSentences = sentences.filter(sentence =>
    keyPhrases.some(phrase => sentence.toLowerCase().includes(phrase))
  )

  if (relevantSentences.length > 0) {
    cleaned = relevantSentences.slice(0, 2).join('. ') + '.'
  }

  // Truncate if still too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...'
  }

  return cleaned || 'Flood warning in effect. Check BOM for details.'
}

/**
 * Check if a warning is relevant to the Fitzroy Basin area
 */
function isRelevantWarning(warning: RawBOMWarning): boolean {
  const searchText = `${warning.title} ${warning.area} ${warning.text}`.toLowerCase()

  return FITZROY_BASIN_AREAS.some(area => searchText.includes(area)) ||
         FITZROY_BASIN_PRODUCTS.includes(warning.productId)
}

/**
 * Parse XML response from BOM warnings feed
 * Uses simple regex parsing to avoid requiring a full XML parser
 */
function parseWarningsXML(xmlText: string): RawBOMWarning[] {
  const warnings: RawBOMWarning[] = []

  try {
    // Extract individual warning/amoc elements
    // BOM uses various XML formats - handle common ones
    const amocPattern = /<amoc[^>]*>([\s\S]*?)<\/amoc>/gi
    const warningPattern = /<warning[^>]*>([\s\S]*?)<\/warning>/gi
    const alertPattern = /<alert[^>]*>([\s\S]*?)<\/alert>/gi

    const patterns = [amocPattern, warningPattern, alertPattern]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(xmlText)) !== null) {
        const content = match[1]

        // Extract fields using regex
        const identifier = extractXMLField(content, 'identifier') ||
                          extractXMLField(content, 'id') ||
                          `warning-${Date.now()}-${warnings.length}`
        const title = extractXMLField(content, 'headline') ||
                     extractXMLField(content, 'title') ||
                     extractXMLField(content, 'event') ||
                     'Flood Warning'
        const area = extractXMLField(content, 'areaDesc') ||
                    extractXMLField(content, 'area') ||
                    extractXMLField(content, 'zone') ||
                    'Queensland'
        const phase = extractXMLField(content, 'phase') ||
                     extractXMLField(content, 'status') ||
                     'active'
        const issueTime = extractXMLField(content, 'sent') ||
                         extractXMLField(content, 'issue-time-utc') ||
                         extractXMLField(content, 'effective') ||
                         new Date().toISOString()
        const expireTimeRaw = extractXMLField(content, 'expires') ||
                          extractXMLField(content, 'expiry-time-utc')
        const expireTime = expireTimeRaw ?? undefined
        const text = extractXMLField(content, 'description') ||
                    extractXMLField(content, 'text') ||
                    extractXMLField(content, 'instruction') ||
                    content

        // Extract product ID from identifier or parent
        const productMatch = identifier.match(/IDQ\d+/) || xmlText.match(/IDQ\d+/)
        const productId = productMatch ? productMatch[0] : ''

        warnings.push({
          identifier,
          title,
          area,
          phase,
          issueTime,
          expireTime,
          text,
          productId,
        })
      }
    }

    // Also try to parse CAP format (Common Alerting Protocol)
    const capInfoPattern = /<info>([\s\S]*?)<\/info>/gi
    let capMatch
    while ((capMatch = capInfoPattern.exec(xmlText)) !== null) {
      const content = capMatch[1]

      // Only process if it looks like a flood warning
      if (!content.toLowerCase().includes('flood')) {
        continue
      }

      const identifier = extractXMLField(xmlText, 'identifier') ||
                        `cap-${Date.now()}-${warnings.length}`
      const title = extractXMLField(content, 'headline') ||
                   extractXMLField(content, 'event') ||
                   'Flood Warning'
      const area = extractXMLField(content, 'areaDesc') || 'Queensland'
      const issueTime = extractXMLField(xmlText, 'sent') || new Date().toISOString()
      const text = extractXMLField(content, 'description') || ''

      if (!warnings.some(w => w.identifier === identifier)) {
        warnings.push({
          identifier,
          title,
          area,
          phase: 'active',
          issueTime,
          text,
          productId: '',
        })
      }
    }
  } catch (error) {
    console.error('[Warnings] Error parsing XML:', error)
  }

  return warnings
}

/**
 * Extract a field value from XML content
 */
function extractXMLField(content: string, fieldName: string): string | null {
  // Try various XML patterns
  const patterns = [
    new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, 'i'),
    new RegExp(`<${fieldName}[^>]*\\/?>([^<]*)`, 'i'),
    new RegExp(`${fieldName}="([^"]*)"`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Convert raw BOM warning to FloodWarning type
 */
function convertToFloodWarning(raw: RawBOMWarning): FloodWarning {
  return {
    id: raw.identifier,
    title: raw.title,
    area: raw.area,
    level: parseWarningLevel(raw.text, raw.title),
    issueTime: raw.issueTime,
    summary: extractSummary(raw.text),
    url: `http://www.bom.gov.au/qld/flood/`,
  }
}

/**
 * Fetch flood warnings from BOM Queensland feed
 */
export async function fetchBOMWarnings(): Promise<FloodWarning[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(BOM_WARNINGS_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[Warnings] HTTP ${response.status} from BOM warnings feed`)
      return []
    }

    const xmlText = await response.text()
    const rawWarnings = parseWarningsXML(xmlText)

    // Filter for Fitzroy Basin relevance
    const relevantWarnings = rawWarnings.filter(isRelevantWarning)

    // Convert to FloodWarning type
    const warnings = relevantWarnings.map(convertToFloodWarning)

    // Sort by issue time (most recent first)
    warnings.sort((a, b) =>
      new Date(b.issueTime).getTime() - new Date(a.issueTime).getTime()
    )

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
 * Fetch warnings from a specific BOM product
 */
export async function fetchProductWarnings(productId: string): Promise<FloodWarning[]> {
  const productUrl = `http://www.bom.gov.au/fwo/${productId}.amoc.xml`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(productUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Product may not exist or have active warnings
      return []
    }

    const xmlText = await response.text()
    const rawWarnings = parseWarningsXML(xmlText)

    return rawWarnings.map(convertToFloodWarning)
  } catch {
    return []
  }
}

/**
 * Fetch Fitzroy Basin specific flood warnings
 */
export async function fetchFitzroyBasinWarnings(): Promise<FloodWarning[]> {
  // Fetch from multiple product feeds in parallel
  const productPromises = FITZROY_BASIN_PRODUCTS.map(productId =>
    fetchProductWarnings(productId)
  )

  // Also fetch from main Queensland warnings
  const mainPromise = fetchBOMWarnings()

  const results = await Promise.all([mainPromise, ...productPromises])

  // Combine and deduplicate
  const allWarnings = results.flat()
  const uniqueWarnings = new Map<string, FloodWarning>()

  for (const warning of allWarnings) {
    // Use ID as key, but prefer newer versions
    const existing = uniqueWarnings.get(warning.id)
    if (!existing || new Date(warning.issueTime) > new Date(existing.issueTime)) {
      uniqueWarnings.set(warning.id, warning)
    }
  }

  // Convert back to array and sort
  const warnings = Array.from(uniqueWarnings.values())
  warnings.sort((a, b) =>
    new Date(b.issueTime).getTime() - new Date(a.issueTime).getTime()
  )

  return warnings
}

/**
 * Get full warnings response with metadata
 */
export async function getWarningsResponse(): Promise<WarningsResponse> {
  const warnings = await fetchFitzroyBasinWarnings()

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
  const warnings = await fetchFitzroyBasinWarnings()
  return warnings.some(w => w.level === 'major')
}

/**
 * Get the highest warning level currently active
 */
export async function getHighestWarningLevel(): Promise<'none' | 'minor' | 'moderate' | 'major'> {
  const warnings = await fetchFitzroyBasinWarnings()

  if (warnings.length === 0) return 'none'
  if (warnings.some(w => w.level === 'major')) return 'major'
  if (warnings.some(w => w.level === 'moderate')) return 'moderate'
  return 'minor'
}

export default {
  fetchBOMWarnings,
  fetchProductWarnings,
  fetchFitzroyBasinWarnings,
  getWarningsResponse,
  hasActiveMajorWarnings,
  getHighestWarningLevel,
}
