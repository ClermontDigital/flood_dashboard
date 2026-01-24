import { Metadata } from 'next'
import { GAUGE_STATIONS } from '@/lib/constants'
import DashboardClient from './DashboardClient'

interface Props {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for OpenGraph based on gauge ID
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const gauge = GAUGE_STATIONS.find(g => g.id === id)

  if (!gauge) {
    return {
      title: 'Gauge Not Found - Queensland Flood Tracking',
      description: 'The requested gauge could not be found.',
    }
  }

  const title = `${gauge.name} - Gauge Queensland Flood Tracking`
  const description = `Real-time water level monitoring for ${gauge.name} on ${gauge.stream}. View current levels, trends, and 7-day history.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://gauge.clermont.digital/gauge/${id}`,
      siteName: 'Gauge',
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

// Generate static params for known gauges (improves build performance)
export async function generateStaticParams() {
  return GAUGE_STATIONS.map((gauge) => ({
    id: gauge.id,
  }))
}

// Render dashboard with the gauge pre-selected (no redirect - preserves OG tags for crawlers)
export default async function GaugePage({ params }: Props) {
  const { id } = await params
  return <DashboardClient initialGaugeId={id} />
}
