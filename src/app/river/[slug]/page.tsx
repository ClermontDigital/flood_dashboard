import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAUGE_STATIONS } from '@/lib/constants'
import { getGaugeList } from '@/lib/initial-data'
import { getPublicCameras } from '@/lib/cameras'
import { RIVER_PAGES, bomBasinUrl, riverName } from '@/lib/places'
import { gaugePlace } from '@/lib/seo'
import { calculateDistance } from '@/lib/utils'
import type { RiverSystem } from '@/lib/types'
import { ExternalLink, InfoCard, InfoPage } from '@/components/site/InfoPage'
import { CameraTile } from '@/components/site/CameraTile'
import { GaugeCard } from '@/components/dashboard/GaugeCard'

// One page per river: every gauge's latest height against BOM flood levels, plus nearby cameras
export const dynamic = 'force-dynamic'

const CAMERA_RADIUS_KM = 15
const MAX_CAMERAS = 10

interface Props {
  params: Promise<{ slug: string }>
}

function riverFromSlug(slug: string): RiverSystem | null {
  return (RIVER_PAGES as string[]).includes(slug) ? (slug as RiverSystem) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const system = riverFromSlug((await params).slug)
  if (!system) return { title: 'River not found' }
  const name = riverName(system)
  const sites = GAUGE_STATIONS.filter((g) => g.riverSystem === system && !g.isOffline).map((g) => gaugePlace(g).site)
  return {
    title: `${name} Heights – Latest Gauge Readings`,
    description: `Latest ${name} heights at ${sites.slice(0, 2).join(' and ')}${sites.length > 2 ? ' and more' : ''}, rising or falling, against BOM flood levels. From BOM and Queensland Government gauges.`,
    alternates: { canonical: `/river/${system}` },
  }
}

export default async function RiverPage({ params }: Props) {
  const system = riverFromSlug((await params).slug)
  if (!system) notFound()
  const name = riverName(system)

  const [gauges, cameras] = await Promise.all([
    getGaugeList(),
    getPublicCameras().then((r) => r.cameras).catch(() => []),
  ])
  const riverGauges = gauges.filter((g) => g.station.riverSystem === system)
  const reporting = riverGauges.filter((g) => !g.station.isOffline)
  const notReporting = riverGauges.filter((g) => g.station.isOffline)
  const nearbyCameras = cameras
    .map((camera) => ({ camera, km: Math.min(...reporting.map((g) => calculateDistance(camera.lat, camera.lng, g.station.lat, g.station.lng))) }))
    .filter((c) => c.km <= CAMERA_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, MAX_CAMERAS)
  const basin = bomBasinUrl(system)

  return (
    <InfoPage
      crumbs={[{ name: 'Home', href: '/' }, { name: 'River heights', href: '/rivers' }, { name, href: `/river/${system}` }]}
      mapHref={reporting[0] ? `/gauge/${reporting[0].station.id}#map` : '/'}
    >
      <InfoCard>
        <h1 className="text-xl font-semibold text-gray-900">{name} heights</h1>
        <p className="text-sm text-gray-600 mt-1">
          Latest readings from {reporting.length} gauges on the {name}, with the Bureau of Meteorology&apos;s flood levels where they&apos;re published.
          Heights are metres on each local gauge, not water depth. Gauges report every 15 to 60 minutes.
        </p>
      </InfoCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {reporting.map((gauge) => (
          <GaugeCard key={gauge.station.id} gaugeData={gauge} />
        ))}
      </div>
      {notReporting.length > 0 && (
        <p className="text-xs text-gray-500 mb-4">Not currently reporting: {notReporting.map((g) => g.station.name).join(', ')}.</p>
      )}

      {nearbyCameras.length > 0 && (
        <InfoCard>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Flood cameras near the {name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {nearbyCameras.map(({ camera }) => (
              <CameraTile key={camera.key} camera={camera} />
            ))}
          </div>
        </InfoCard>
      )}

      <InfoCard>
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Official information</h2>
        <ul className="text-sm space-y-1">
          {basin && <li><ExternalLink href={basin}>BOM river heights for this area</ExternalLink></li>}
          <li><ExternalLink href="https://www.bom.gov.au/qld/flood/">BOM Queensland flood warnings</ExternalLink></li>
          <li className="text-gray-600">Never drive through floodwater. For emergency help call SES 132 500, or 000 if life is in danger.</li>
        </ul>
      </InfoCard>
    </InfoPage>
  )
}
