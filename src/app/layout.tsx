import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GAUGE - Fitzroy Basin Flood Dashboard',
  description: 'Real-time water level monitoring and flood warnings for Clermont, QLD and the Fitzroy Basin region',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e40af',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        {/* Disclaimer Banner */}
        <div className="bg-blue-900 text-white text-xs px-4 py-2 text-center">
          <strong>Important:</strong> This dashboard is for informational purposes only.
          Always follow official <a href="https://www.bom.gov.au/qld/flood/" className="underline">BOM warnings</a>.
          In emergencies, call <strong>000</strong>.
        </div>

        {children}
      </body>
    </html>
  )
}
