import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL } from '@/lib/seo'
import './globals.css'

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-XH0PJ1D3NJ'

export const metadata: Metadata = {
  // Pages set their own title; the template adds the brand
  title: { default: HOME_TITLE, template: '%s | Gauge' },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
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
    <html lang="en-AU">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
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
            <div className="text-center">
              <nav aria-label="More from Gauge" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm mb-2">
                <Link href="/cameras" className="hover:text-white">Flood cameras</Link>
                <Link href="/rivers" className="hover:text-white">River heights</Link>
                <Link href="/town/clermont" className="hover:text-white">Clermont flooding</Link>
              </nav>
              <p className="text-sm">
                A community project by{' '}
                <a
                  href="https://clermontdigital.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Clermont Digital
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
