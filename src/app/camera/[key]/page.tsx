import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findCamera } from '@/lib/cameras'
import type { FloodCamera } from '@/lib/types'
import DashboardClient from '../../gauge/[id]/DashboardClient'

// Share links for a single camera, e.g. /camera/clermont-weir or /camera/isaac-45.
// Renders the dashboard focused on the camera (no redirect, so link previews see the tags).

export const dynamic = 'force-dynamic'

const SITE = 'https://gauge.clermont.digital'

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
  return url.startsWith('/') ? `${SITE}${url}` : url
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  const camera = await findCamera(key)
  if (!camera) {
    return { title: 'Camera not found - Gauge' }
  }

  const title = `${camera.description} – Flood camera`
  const description = camera.kind === 'community'
    ? [
        camera.takenAt ? `Latest picture taken ${takenText(camera.takenAt)}.` : null,
        camera.donor ? `Camera courtesy of ${camera.donor}.` : null,
      ].filter(Boolean).join(' ')
    : `Flood camera from ${camera.source}, updated regularly.`
  const image = absoluteImageUrl(camera)
  const url = `${SITE}/camera/${camera.key}`

  return {
    title: `${title} - Gauge`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Gauge',
      locale: 'en_AU',
      type: 'website',
      images: image ? [{ url: image, alt: `Latest picture from ${camera.description}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function CameraPage({ params }: Props) {
  const { key } = await params
  const camera = await findCamera(key)
  if (!camera) notFound()
  return <DashboardClient initialCamera={camera} />
}
