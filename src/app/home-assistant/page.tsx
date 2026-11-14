import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'
import { ExternalLink, InfoCard, InfoPage } from '@/components/site/InfoPage'

const REPO = 'https://github.com/ClermontDigital/Gauge'

export const metadata: Metadata = {
  title: 'Queensland Flood Gauges in Home Assistant',
  description:
    'Add Queensland river and creek gauges to Home Assistant with the free Gauge integration: water level, flood status, trend and BOM flood levels for the gauges near you, and alerts when a creek comes up.',
  alternates: { canonical: '/home-assistant' },
}

const ALERT_EXAMPLE = `alias: Sandy Creek is coming up
triggers:
  - trigger: state
    entity_id: sensor.sandy_creek_clermont_flood_status
    to: [watch, warning, danger]
actions:
  - action: notify.mobile_app_your_phone
    data:
      title: "Sandy Creek: {{ states('sensor.sandy_creek_clermont_flood_status') | title }}"
      message: >-
        {{ states('sensor.sandy_creek_clermont_water_level') }} m and
        {{ states('sensor.sandy_creek_clermont_trend') }}.`

const SENSORS: [string, string][] = [
  ['Water level', 'The latest reading, in metres on the gauge’s own scale.'],
  ['Flood status', 'Safe, Watch, Warning or Danger, the same as on this site.'],
  ['Trend', 'Rising, falling or stable.'],
  ['Rate of change', 'How fast the level is moving, in metres an hour.'],
  ['Minor, moderate and major flood levels', 'The Bureau of Meteorology’s flood classification, where the gauge has one.'],
  ['Flow and rainfall', 'Where the gauge measures them.'],
  ['Last reading', 'When the gauge last reported.'],
]

export default function HomeAssistantPage() {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gauge for Home Assistant',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Home Assistant',
    description: 'Queensland river and creek gauges in Home Assistant: water level, flood status, trend and official flood levels.',
    url: `${SITE_URL}/home-assistant`,
    downloadUrl: REPO,
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
    publisher: { '@type': 'Organization', name: 'Clermont Digital', url: 'https://clermontdigital.com.au' },
  }

  return (
    <InfoPage crumbs={[{ name: 'Home', href: '/' }, { name: 'Home Assistant', href: '/home-assistant' }]}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <InfoCard>
        <h1 className="text-xl font-semibold text-gray-900">Queensland flood gauges in Home Assistant</h1>
        <p className="text-sm text-gray-600 mt-1">
          The Gauge integration puts the river and creek gauges near you into Home Assistant: the water level, flood
          status and trend, with the Bureau of Meteorology&apos;s flood levels, on your own dashboard. Home Assistant can
          then tell you when a creek comes up. It&apos;s free and open source.
        </p>
      </InfoCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
        <InfoCard>
          <h2 className="text-base font-semibold text-gray-900">What Home Assistant is</h2>
          <p className="text-sm text-gray-600 mt-2">
            <ExternalLink href="https://www.home-assistant.io">Home Assistant</ExternalLink> is free, open-source
            software for running a home&apos;s devices and information from one place: lights, solar and batteries,
            water tanks, cameras, weather stations and more. It runs at home on a small computer, such as a Home
            Assistant Green, a Raspberry Pi or a NAS, rather than in someone else&apos;s cloud, and its phone app shows
            your dashboards and sends you alerts.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Integrations connect it to other things. The Gauge integration connects it to this site&apos;s gauges.
          </p>
        </InfoCard>

        <InfoCard>
          <h2 className="text-base font-semibold text-gray-900">What you get</h2>
          <p className="text-sm text-gray-600 mt-2">Each gauge you add becomes a device in Home Assistant with:</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {SENSORS.map(([name, what]) => (
              <div key={name}>
                <dt className="inline font-medium text-gray-800">{name}: </dt>
                <dd className="inline text-gray-600">{what}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>
      </div>

      <InfoCard>
        <h2 className="text-base font-semibold text-gray-900">How to set it up</h2>
        <ol className="mt-2 space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>
            In Home Assistant, open the <span className="font-medium text-gray-800">Marketplace</span> (or HACS on older
            versions), choose <span className="font-medium text-gray-800">⋮ → Custom repositories</span>, and add{' '}
            <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-800 text-xs">{REPO}</code> as an{' '}
            <span className="font-medium text-gray-800">Integration</span>.
          </li>
          <li>Install <span className="font-medium text-gray-800">GAUGE</span>, then restart Home Assistant.</li>
          <li>
            Go to <span className="font-medium text-gray-800">Settings → Devices &amp; services → Add integration</span>{' '}
            and search for <span className="font-medium text-gray-800">Gauge</span>.
          </li>
          <li>Pick a gauge. The list is sorted by distance from your home, so the nearest is first.</li>
          <li>
            To follow more gauges, open Gauge under Devices &amp; services and choose{' '}
            <span className="font-medium text-gray-800">Add gauge</span>.
          </li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          Needs Home Assistant 2025.10 or later. Full instructions and the code are on{' '}
          <ExternalLink href={REPO}>GitHub</ExternalLink>.
        </p>
      </InfoCard>

      <InfoCard>
        <h2 className="text-base font-semibold text-gray-900">An alert when the creek comes up</h2>
        <p className="text-sm text-gray-600 mt-2">
          This automation sends a phone notification when Sandy Creek at Clermont reaches Watch or higher. Change the
          names to your gauge&apos;s, and the notify action to your phone&apos;s.
        </p>
        <pre className="mt-3 text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
          <code>{ALERT_EXAMPLE}</code>
        </pre>
      </InfoCard>

      <InfoCard>
        <h2 className="text-base font-semibold text-gray-900">Good to know</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-600 list-disc list-inside">
          <li>Home Assistant checks this site every 10 minutes, with one request for all the gauges you follow.</li>
          <li>
            A gauge that hasn&apos;t reported for 6 hours shows as unavailable, so an old reading isn&apos;t taken for
            the river now.
          </li>
          <li>
            Gauge is not an official warning service. Follow the Bureau of Meteorology&apos;s flood warnings, Queensland
            Fire Department and SES advice, and your local council.
          </li>
          <li>
            The integration is open source (Apache 2.0). Questions and ideas go to its{' '}
            <ExternalLink href={`${REPO}/issues`}>GitHub issues</ExternalLink>.
          </li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">
          Prefer a browser? <Link href="/" className="text-blue-600 hover:text-blue-800">Open the map</Link> or see{' '}
          <Link href="/rivers" className="text-blue-600 hover:text-blue-800">river heights</Link>.
        </p>
      </InfoCard>
    </InfoPage>
  )
}
