import { jsonResponse } from '@/lib/http'
import { getPublicCameras } from '@/lib/cameras'
import type { FloodCamerasResponse } from '@/lib/types'

// Dynamic so responses can be compressed per request; src/lib/cameras.ts does the caching
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { cameras, lastUpdated } = await getPublicCameras()
    return jsonResponse(request, { cameras, lastUpdated } satisfies FloodCamerasResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[Cameras] Error fetching cameras:', error)
    return jsonResponse(request, { cameras: [], lastUpdated: new Date().toISOString() } satisfies FloodCamerasResponse)
  }
}
