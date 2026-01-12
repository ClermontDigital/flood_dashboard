/**
 * Flood Warnings API Route
 * GET /api/warnings
 *
 * Returns active BOM flood warnings for the Fitzroy Basin area.
 * Filters warnings relevant to Clermont and surrounding regions.
 */

import { NextResponse } from 'next/server'
import type { WarningsResponse, FloodWarning } from '@/lib/types'
import { fetchBOMWarnings } from '@/lib/data-sources'

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

/**
 * Generate mock warnings for development/fallback
 */
function generateMockWarnings(): FloodWarning[] {
  // Return empty array by default (no active warnings is the normal state)
  // Occasionally return a mock warning for testing
  const showMockWarning = Math.random() < 0.1 // 10% chance

  if (!showMockWarning) {
    return []
  }

  const mockWarnings: FloodWarning[] = [
    {
      id: 'mock-warning-1',
      title: 'Minor Flood Warning for Fitzroy River',
      area: 'Fitzroy River Catchment including Rockhampton',
      level: 'minor',
      issueTime: new Date().toISOString(),
      summary:
        'Minor flooding is occurring along the Fitzroy River. River levels are expected to remain elevated over the next 24-48 hours. Residents in low-lying areas should monitor conditions.',
      url: 'http://www.bom.gov.au/qld/flood/',
    },
  ]

  return mockWarnings
}

export async function GET(): Promise<NextResponse<WarningsResponse>> {
  let warnings: FloodWarning[] = []
  let source = 'bom'

  try {
    const bomResult = await fetchBOMWarnings()

    if (bomResult && bomResult.length >= 0) {
      warnings = bomResult

      // Filter to only include relevant areas
      warnings = warnings.filter((warning) => {
        const area = warning.area.toLowerCase()
        const title = warning.title.toLowerCase()
        const summary = warning.summary.toLowerCase()

        const relevantAreas = [
          'fitzroy',
          'isaac',
          'mackenzie',
          'clermont',
          'nogoa',
          'comet',
          'central queensland',
          'central highlands',
          'rockhampton',
          'emerald',
        ]

        return relevantAreas.some(
          (region) =>
            area.includes(region) ||
            title.includes(region) ||
            summary.includes(region)
        )
      })

      // Sort by severity (major > moderate > minor) and then by issue time
      const severityOrder: Record<string, number> = {
        major: 3,
        moderate: 2,
        minor: 1,
      }

      warnings.sort((a, b) => {
        const severityDiff = severityOrder[b.level] - severityOrder[a.level]
        if (severityDiff !== 0) return severityDiff

        // More recent warnings first
        return (
          new Date(b.issueTime).getTime() - new Date(a.issueTime).getTime()
        )
      })
    } else {
      // Use mock data as fallback
      warnings = generateMockWarnings()
      source = 'mock'
    }
  } catch (error) {
    console.error('Error fetching warnings:', error)
    // Use mock data as fallback
    warnings = generateMockWarnings()
    source = 'mock'
  }

  const response: WarningsResponse = {
    active: warnings.length > 0,
    warnings,
    lastChecked: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      'X-Data-Source': source,
    },
  })
}
