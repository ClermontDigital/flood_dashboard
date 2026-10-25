import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findCamera } from '@/lib/cameras'
import { getCommunityCameraConfig } from '@/lib/community-cameras'
import { getInitialWaterLevels } from '@/lib/initial-data'
import { SITE_NAME, SITE_URL, cameraDescription, cameraTitle } from '@/lib/seo'
import type { FloodCamera } from '@/lib/types'
import DashboardClient from '../../gauge/[id]/DashboardClient'

// Share links for a single camera, e.g. /camera/clermont-weir or /camera/isaac-45.
// Renders the dashboard focused on the camera (no redirect, so link previews see the tags).

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ key: string }>
}

function takenText(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Brisbane',
  })
}

function absoluteImageUrl(camera: FloodCamera): string | undefined {
  const url = camera.imageUrls[0]
  if (!url) return undefined
  return url.startsWith('/') ? `${SITE_URL}${url}` : url
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  const camera = await findCamera(key)
  if (!camera) {
    return { title: 'Camera not found' }
  }

  const title = `${camera.description} – Flood camera`
  // Search results get a timeless description (Google shows it for days); link previews, which are
  // fetched when the link is shared, also say when the picture was taken
  const description = cameraDescription(camera)
  const shareDescription = camera.kind === 'community'
    ? [
        camera.takenAt ? `Latest picture taken ${takenText(camera.takenAt)}.` : null,
        camera.donor ? `Camera courtesy of ${camera.donor}.` : null,
      ].filter(Boolean).join(' ')
    : description
  const image = absoluteImageUrl(camera)
  const url = `${SITE_URL}/camera/${camera.key}`
  // Unlisted community cameras are only for people given the link; keep them out of search results
  const unlisted = camera.kind === 'community' && getCommunityCameraConfig(camera.key)?.visibility === 'unlisted'

  return {
    title: { absolute: cameraTitle(camera) },
    description,
    alternates: { canonical: url },
    robots: unlisted ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: shareDescription,
      url,
      siteName: SITE_NAME,
      locale: 'en_AU',
      type: 'website',
      images: image ? [{ url: image, alt: `Latest picture from ${camera.description}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: shareDescription,
      images: image ? [image] : undefined,
    },
  }
}

export default async function CameraPage({ params }: Props) {
  const { key } = await params
  const camera = await findCamera(key)
  if (!camera) notFound()
  const initialWaterLevels = await getInitialWaterLevels()
  return <DashboardClient initialCamera={camera} initialWaterLevels={initialWaterLevels ?? undefined} />
}
