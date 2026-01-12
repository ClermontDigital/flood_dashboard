import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gauge - Clermont Flood Tracking',
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
        {/* Emergency Resources Banner */}
        <div className="bg-red-800 text-white text-xs px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-center sm:text-left">
                <strong>Important:</strong> This dashboard is for informational purposes only.
                Always follow official warnings. In emergencies, call <strong>000</strong>.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://www.bom.gov.au/qld/flood/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-200"
                >
                  BOM Flood Warnings
                </a>
                <span className="hidden sm:inline text-red-400">|</span>
                <a
                  href="https://www.qfes.qld.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-200"
                >
                  QFES
                </a>
                <span className="hidden sm:inline text-red-400">|</span>
                <a
                  href="https://www.isaac.qld.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-200"
                >
                  Isaac Regional Council
                </a>
                <span className="hidden sm:inline text-red-400">|</span>
                <a
                  href="https://www.ses.qld.gov.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-200"
                >
                  SES
                </a>
              </div>
            </div>
          </div>
        </div>

        {children}
      </body>
    </html>
  )
}
