import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAUGE_STATIONS, resolveGaugeId } from '@/lib/constants'
import { getFloodThresholds } from '@/lib/flood-thresholds'
import { getInitialWaterLevels } from '@/lib/initial-data'
import { SITE_NAME, SITE_URL, gaugeDescription, gaugeTitle } from '@/lib/seo'
import DashboardClient from './DashboardClient'

// Rendered per request with the latest readings, so the page (and search engines) show the gauge's
// current level straight away. Not statically generated: a build-time page would carry stale data.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for OpenGraph based on gauge ID
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = resolveGaugeId((await params).id)
  const gauge = GAUGE_STATIONS.find(g => g.id === id)

  if (!gauge) {
    return {
      title: 'Gauge not found',
      description: 'The requested gauge could not be found.',
    }
  }

  const thresholds = getFloodThresholds(id)
  const title = gaugeTitle(gauge, thresholds)
  const description = gaugeDescription(gauge, thresholds)
  const url = `${SITE_URL}/gauge/${id}`

  return {
    title,
    description,
    // Retired station IDs render the same page; point search engines at the current one
    alternates: { canonical: url },
    // Offline gauges have no readings to show, so keep them out of search results while offline
    robots: gauge.isOffline ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// Render dashboard with the gauge pre-selected (no redirect - preserves OG tags for crawlers)
export default async function GaugePage({ params }: Props) {
  const id = resolveGaugeId((await params).id)
  if (!GAUGE_STATIONS.some(g => g.id === id)) notFound()
  const initialWaterLevels = await getInitialWaterLevels()
  return <DashboardClient initialGaugeId={id} initialWaterLevels={initialWaterLevels ?? undefined} />
}
