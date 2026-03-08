/**
 * Flood Warnings API Route
 * GET /api/warnings
 *
 * Returns active BOM flood warnings for all of Queensland.
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
  // Warnings banner disabled — returns empty to prevent overlay on dashboard
  const response: WarningsResponse = {
    active: false,
    warnings: [],
    lastChecked: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      'X-Data-Source': 'disabled',
    },
  })
}
