import type { MetadataRoute } from 'next'
import { GAUGE_STATIONS } from '@/lib/constants'
import { getInitialWaterLevels } from '@/lib/initial-data'
import { SITE_URL } from '@/lib/seo'

// Built per request so lastModified follows the latest readings
export const dynamic = 'force-dynamic'

// Home and every online gauge. Offline gauges are noindex while offline. Camera pages are left out
// until they show the camera's own details in the page (today that's only in the map popup).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latest = await getInitialWaterLevels()
  const readingTimes = new Map(latest?.gauges.map((g) => [g.station.id, g.reading?.timestamp]) ?? [])
  const gauges: MetadataRoute.Sitemap = GAUGE_STATIONS.filter((g) => !g.isOffline).map((g) => {
    const readAt = readingTimes.get(g.id)
    return { url: `${SITE_URL}/gauge/${g.id}`, ...(readAt && { lastModified: new Date(readAt) }) }
  })
  return [{ url: `${SITE_URL}/` }, ...gauges]
}
