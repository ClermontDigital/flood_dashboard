import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAUGE_STATIONS } from '@/lib/constants'
import { getGaugeList } from '@/lib/initial-data'
import { getPublicCameras } from '@/lib/cameras'
import { TOWN_PAGES, type TownPage } from '@/lib/places'
import { calculateDistance } from '@/lib/utils'
import { ExternalLink, InfoCard, InfoPage } from '@/components/site/InfoPage'
import { CameraTile } from '@/components/site/CameraTile'
import { GaugeCard } from '@/components/dashboard/GaugeCard'

// Flood information for one town: nearby gauges and cameras, and where official updates are
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function nearestStream(town: TownPage): string {
  const nearest = GAUGE_STATIONS
    .filter((g) => !g.isOffline)
    .sort((a, b) => calculateDistance(town.lat, town.lng, a.lat, a.lng) - calculateDistance(town.lat, town.lng, b.lat, b.lng))[0]
  return nearest?.stream ?? 'River'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const town = TOWN_PAGES.find((t) => t.slug === slug)
  if (!town) return { title: 'Town not found' }
  const stream = nearestStream(town)
  const title = `${town.name} Flooding – ${stream} Height & Flood Cameras`
  return {
    // Drop the brand rather than have Google cut the title short
    title: (title + ' | Gauge').length <= 60 ? title : { absolute: title },
    description: `${stream} height at ${town.name} against BOM flood levels, plus nearby flood cameras and links to road closures and ${town.council} updates.`,
    alternates: { canonical: `/town/${town.slug}` },
  }
}

export default async function TownPage({ params }: Props) {
  const { slug } = await params
  const town = TOWN_PAGES.find((t) => t.slug === slug)
  if (!town) notFound()

  const [gauges, cameras] = await Promise.all([
    getGaugeList(),
    getPublicCameras().then((r) => r.cameras).catch(() => []),
  ])
  const km = (lat: number, lng: number) => calculateDistance(town.lat, town.lng, lat, lng)
  const nearbyGauges = gauges
    .filter((g) => !g.station.isOffline && km(g.station.lat, g.station.lng) <= town.gaugeRadiusKm)
    .sort((a, b) => km(a.station.lat, a.station.lng) - km(b.station.lat, b.station.lng))
  const nearbyCameras = cameras
    .filter((c) => km(c.lat, c.lng) <= town.cameraRadiusKm)
    .sort((a, b) => km(a.lat, a.lng) - km(b.lat, b.lng))

  return (
    <InfoPage
      crumbs={[{ name: 'Home', href: '/' }, { name: `${town.name} flooding`, href: `/town/${town.slug}` }]}
      mapHref={nearbyGauges[0] ? `/gauge/${nearbyGauges[0].station.id}#map` : '/'}
    >
      <InfoCard>
        <h1 className="text-xl font-semibold text-gray-900">{town.name} flooding: creek heights and flood cameras</h1>
        <p className="text-sm text-gray-600 mt-1">
          Latest creek and river heights around {town.name} against the Bureau of Meteorology&apos;s flood levels, and the nearest flood cameras.
          For warnings, road closures and evacuation information, follow the official sources below.
        </p>
      </InfoCard>

      {nearbyGauges.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Creek and river heights near {town.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {nearbyGauges.map((gauge) => (
              <div key={gauge.station.id}>
                <p className="text-xs text-gray-500 mb-1">{Math.round(km(gauge.station.lat, gauge.station.lng))} km from {town.name}</p>
                <GaugeCard gaugeData={gauge} />
              </div>
            ))}
          </div>
        </>
      )}

      {nearbyCameras.length > 0 && (
        <InfoCard>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Flood cameras near {town.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {nearbyCameras.map((camera) => (
              <CameraTile key={camera.key} camera={camera} note={`${Math.round(km(camera.lat, camera.lng))} km · ${camera.kind === 'community' && camera.donor ? `courtesy of ${camera.donor}` : camera.source}`} />
            ))}
          </div>
        </InfoCard>
      )}

      <InfoCard>
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Official information</h2>
        <ul className="text-sm space-y-1">
          <li><ExternalLink href={town.councilUrl}>{town.council} disaster updates</ExternalLink></li>
          <li><ExternalLink href="https://www.bom.gov.au/qld/flood/">BOM Queensland flood warnings</ExternalLink></li>
          <li><ExternalLink href="https://qldtraffic.qld.gov.au/">QLDTraffic road closures</ExternalLink></li>
          <li className="text-gray-600">Never drive through floodwater. For emergency help call SES 132 500, or 000 if life is in danger.</li>
        </ul>
      </InfoCard>
    </InfoPage>
  )
}
