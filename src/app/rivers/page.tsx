import type { Metadata } from 'next'
import Link from 'next/link'
import { getGaugeList } from '@/lib/initial-data'
import { RIVER_PAGES, riverName } from '@/lib/places'
import { gaugePlace } from '@/lib/seo'
import type { FloodStatus } from '@/lib/types'
import { InfoCard, InfoPage } from '@/components/site/InfoPage'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Queensland River Heights by River',
  description: 'Latest heights for Queensland rivers and creeks, from the Burdekin and Fitzroy to the Mary and Brisbane, against BOM flood levels. From BOM and Queensland Government gauges.',
  alternates: { canonical: '/rivers' },
}

const STATUS_RANK: Record<FloodStatus, number> = { danger: 0, warning: 1, watch: 2, safe: 3, offline: 4 }

export default async function RiversPage() {
  const gauges = await getGaugeList()

  return (
    <InfoPage crumbs={[{ name: 'Home', href: '/' }, { name: 'River heights', href: '/rivers' }]}>
      <InfoCard>
        <h1 className="text-xl font-semibold text-gray-900">Queensland river heights</h1>
        <p className="text-sm text-gray-600 mt-1">
          Latest heights for each river with two or more reporting gauges, against the Bureau of Meteorology&apos;s flood levels.
          Readings come from BOM and Queensland Government gauges, which report every 15 to 60 minutes.
        </p>
      </InfoCard>
      <InfoCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RIVER_PAGES.map((system) => {
            const riverGauges = gauges.filter((g) => g.station.riverSystem === system && !g.station.isOffline)
            const worst = riverGauges
              .map((g) => g.reading?.status)
              .filter((s): s is FloodStatus => !!s)
              .sort((a, b) => STATUS_RANK[a] - STATUS_RANK[b])[0]
            return (
              <Link key={system} href={`/river/${system}`} className="block p-3 bg-gray-50 rounded-lg hover:ring-2 hover:ring-blue-300 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">{riverName(system)}</h2>
                  {worst && <StatusBadge status={worst} size="xs" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {riverGauges.length} gauges: {riverGauges.map((g) => gaugePlace(g.station).site).join(', ')}
                </p>
              </Link>
            )
          })}
        </div>
      </InfoCard>
    </InfoPage>
  )
}
