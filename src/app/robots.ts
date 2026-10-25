import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    // Camera pictures stay crawlable so link previews (and image search) can load them;
    // private upload pages are crawlable on purpose, so crawlers can see their noindex
    rules: { userAgent: '*', allow: ['/', '/api/cameras/*/image'], disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
