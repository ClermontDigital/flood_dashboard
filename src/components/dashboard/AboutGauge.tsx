import Link from 'next/link'
import type { FloodThresholds, GaugeStation } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/constants'
import { bomBasinUrl, hasRiverPage, riverName } from '@/lib/places'

// Plain-English notes under a gauge's details: what the numbers mean and where official warnings are
export function AboutGauge({ station, thresholds, source }: { station: GaugeStation; thresholds: FloodThresholds | null; source?: string }) {
  const basin = bomBasinUrl(station.riverSystem)
  const levels = thresholds
    ? [
        { name: 'Minor', value: thresholds.minor, color: STATUS_COLORS.watch, meaning: 'low-lying land beside the river floods; minor roads may close and low-level bridges go under.' },
        { name: 'Moderate', value: thresholds.moderate, color: STATUS_COLORS.warning, meaning: 'wider flooding; main roads may be cut and some buildings may flood above floor level. Evacuation may be needed.' },
        { name: 'Major', value: thresholds.major, color: STATUS_COLORS.danger, meaning: 'widespread flooding; many buildings flood above floor level and properties and towns may be cut off. Evacuation may be needed.' },
      ]
    : []

  return (
    <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-700 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">About this gauge</h3>
      <p>
        {station.name} (gauge {station.id}) is a Queensland Government river gauge. Heights are metres on the local gauge, not water depth.
        Readings come from {source === 'bom' ? 'the Bureau of Meteorology' : "the Queensland Government's water monitoring network"}, and
        Gauge checks for new readings every few minutes.
      </p>
      {thresholds ? (
        <div>
          <p className="font-medium text-gray-900">BOM flood levels</p>
          <ul className="mt-1 space-y-1">
            {levels.map((level) => (
              <li key={level.name} className="flex gap-2">
                <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} aria-hidden="true" />
                <span><span className="font-medium">{level.name} {level.value} m:</span> {level.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>The Bureau of Meteorology hasn&apos;t published flood levels for this gauge, so Gauge can&apos;t say whether it&apos;s in flood. Watch the trend and official warnings.</p>
      )}
      <p>
        Roads and causeways can flood below the minor level. Never drive through floodwater. Gauge is a community tool and doesn&apos;t replace
        official warnings: <a href="https://www.bom.gov.au/qld/flood/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">BOM flood warnings</a>,
        SES 132 500, or 000 in an emergency.
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        {hasRiverPage(station.riverSystem) && (
          <Link href={`/river/${station.riverSystem}`} className="text-blue-600 hover:text-blue-800">All {riverName(station.riverSystem)} gauges</Link>
        )}
        {basin && (
          <a href={basin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">BOM river heights for this area</a>
        )}
      </p>
    </div>
  )
}
