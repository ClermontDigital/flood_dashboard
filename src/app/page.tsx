import type { Metadata } from 'next'
import DashboardClient from './gauge/[id]/DashboardClient'
import { getInitialWaterLevels } from '@/lib/initial-data'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

// Rendered per request with the latest readings, so the first paint (and search engines) get real
// content. The dashboard restores a remembered gauge from localStorage after it loads.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

// Gives Google the site's own name; without it Google shows the parent domain's "Clermont Digital"
const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: ['Gauge', 'Gauge QLD'],
  url: `${SITE_URL}/`,
}

export default async function DashboardPage() {
  const initialWaterLevels = await getInitialWaterLevels()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }} />
      <DashboardClient initialWaterLevels={initialWaterLevels ?? undefined} />
    </>
  )
}
