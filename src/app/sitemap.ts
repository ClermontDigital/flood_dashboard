import type { MetadataRoute } from 'next'
import { GAUGE_STATIONS } from '@/lib/constants'
import { getInitialWaterLevels } from '@/lib/initial-data'
import { RIVER_PAGES, TOWN_PAGES } from '@/lib/places'
import { SITE_URL } from '@/lib/seo'

// Built per request so lastModified follows the latest readings
export const dynamic = 'force-dynamic'

// Home, the camera/river/town pages and every online gauge. Offline gauges are noindex while offline. Camera pages are left out
// until they show the camera's own details in the page (today that's only in the map popup).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latest = await getInitialWaterLevels()
  const readingTimes = new Map(latest?.gauges.map((g) => [g.station.id, g.reading?.timestamp]) ?? [])
  const gauges: MetadataRoute.Sitemap = GAUGE_STATIONS.filter((g) => !g.isOffline).map((g) => {
    const readAt = readingTimes.get(g.id)
    return { url: `${SITE_URL}/gauge/${g.id}`, ...(readAt && { lastModified: new Date(readAt) }) }
  })
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/cameras` },
    { url: `${SITE_URL}/rivers` },
    ...RIVER_PAGES.map((system) => ({ url: `${SITE_URL}/river/${system}` })),
    ...TOWN_PAGES.map((town) => ({ url: `${SITE_URL}/town/${town.slug}` })),
  ]
  return [{ url: `${SITE_URL}/` }, ...pages, ...gauges]
}
