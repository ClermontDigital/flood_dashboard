import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gauge - Clermont Flood Tracking',
  description: 'Real-time water level monitoring and flood warnings for Clermont, QLD and the Fitzroy Basin region',
  manifest: '/manifest.json',
  metadataBase: new URL('https://gauge.clermont.digital'),
  openGraph: {
    title: 'Gauge - Clermont Flood Tracking',
    description: 'Real-time water level monitoring and flood warnings for Clermont, QLD and the Fitzroy Basin region',
    url: 'https://gauge.clermont.digital',
    siteName: 'Gauge',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Gauge - Clermont Flood Tracking Logo',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gauge - Clermont Flood Tracking',
    description: 'Real-time water level monitoring and flood warnings for Clermont, QLD and the Fitzroy Basin region',
    images: ['/logo.png'],
  },
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

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm">
                  An open source project by{' '}
                  <a
                    href="https://clermontdigital.com.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Clermont Digital
                  </a>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Built for the community by the community
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/ClermontDigital/flood_dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
