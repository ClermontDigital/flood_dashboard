import type { Metadata } from 'next'
import { getPublicCameras } from '@/lib/cameras'
import { councilArea } from '@/lib/seo'
import type { FloodCamera } from '@/lib/types'
import { InfoCard, InfoPage } from '@/components/site/InfoPage'
import { CameraTile } from '@/components/site/CameraTile'

// Every public flood camera, grouped by council, each linking to its own camera page
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Queensland Flood Cameras by Council',
  description: 'Latest pictures from more than 200 council and community flood cameras across Queensland, from Cairns and Townsville to Bundaberg and Gympie, beside the latest river heights.',
  alternates: { canonical: '/cameras' },
}

interface CameraGroup {
  slug: string
  heading: string
  note: string
  cameras: FloodCamera[]
}

function groupCameras(cameras: FloodCamera[]): CameraGroup[] {
  const groups = new Map<string, CameraGroup>()
  for (const camera of cameras) {
    const community = camera.kind === 'community'
    const area = community ? 'Community' : councilArea(camera.source) ?? camera.source
    const slug = area.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!groups.has(slug)) {
      groups.set(slug, {
        slug,
        heading: community ? 'Community cameras' : `${area} flood cameras`,
        note: community ? 'Cameras shared by local people and checked by Gauge' : `Run by ${camera.source}`,
        cameras: [],
      })
    }
    groups.get(slug)!.cameras.push(camera)
  }
  for (const group of groups.values()) group.cameras.sort((a, b) => a.description.localeCompare(b.description))
  // Community cameras first, then councils A-Z
  return [...groups.values()].sort((a, b) => (a.slug === 'community' ? -1 : b.slug === 'community' ? 1 : a.heading.localeCompare(b.heading)))
}

export default async function CamerasPage() {
  const cameras = await getPublicCameras().then((r) => r.cameras).catch(() => [])
  const groups = groupCameras(cameras)
  const councils = groups.filter((g) => g.slug !== 'community').length

  return (
    <InfoPage crumbs={[{ name: 'Home', href: '/' }, { name: 'Flood cameras', href: '/cameras' }]}>
      <InfoCard>
        <h1 className="text-xl font-semibold text-gray-900">Queensland flood cameras</h1>
        {cameras.length > 0 ? (
          <p className="text-sm text-gray-600 mt-1">
            {cameras.length} cameras from {councils} councils{groups.some((g) => g.slug === 'community') ? ' and the community' : ''}, each showing its latest picture.
            Pictures come from each council&apos;s own system, so how often they update varies. Choose a camera to see it on the map beside nearby river heights and road closures.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-1">The camera list isn&apos;t available right now. Please try again shortly.</p>
        )}
        {groups.length > 1 && (
          <nav aria-label="Councils" className="flex flex-wrap gap-2 mt-3">
            {groups.map((group) => (
              <a key={group.slug} href={`#${group.slug}`} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200">
                {group.slug === 'community' ? 'Community' : group.heading.replace(/ flood cameras$/, '')} ({group.cameras.length})
              </a>
            ))}
          </nav>
        )}
      </InfoCard>

      {groups.map((group) => (
        <InfoCard key={group.slug} id={group.slug}>
          <h2 className="text-sm font-semibold text-gray-900">{group.heading}</h2>
          <p className="text-xs text-gray-500 mb-3">{group.note}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {group.cameras.map((camera) => (
              <CameraTile key={camera.key} camera={camera} />
            ))}
          </div>
        </InfoCard>
      ))}
    </InfoPage>
  )
}
