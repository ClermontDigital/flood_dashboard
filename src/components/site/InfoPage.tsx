import Image from 'next/image'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo'

export interface Crumb {
  name: string
  href: string
}

// Layout for the text pages (cameras, rivers, towns): the dashboard's header and card style,
// without the map. The last crumb is the current page.
export function InfoPage({ crumbs, mapHref = '/', children }: { crumbs: Crumb[]; mapHref?: string; children: React.ReactNode }) {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href === '/' ? '/' : crumb.href}`,
    })),
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <header className="mb-4 flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo-header.png" alt="Gauge" width={40} height={40} priority style={{ width: 'auto', height: '40px' }} />
          </Link>
          <nav aria-label="Breadcrumb" className="flex-1 min-w-0 text-sm text-gray-500 truncate">
            {crumbs.map((crumb, i) => (
              <span key={crumb.href}>
                {i > 0 && <span className="mx-1.5 text-gray-300" aria-hidden="true">/</span>}
                {i < crumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-gray-800">{crumb.name}</Link>
                ) : (
                  <span className="text-gray-700" aria-current="page">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>
          <Link
            href={mapHref}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 flex-shrink-0"
          >
            Open map
          </Link>
        </header>
        {children}
      </div>
    </main>
  )
}

// Card used for each section, matching the dashboard's panels
export function InfoCard({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`bg-white rounded-lg shadow-sm p-4 mb-4 scroll-mt-4 ${className}`}>
      {children}
    </section>
  )
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
      {children}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}
