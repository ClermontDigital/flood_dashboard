import { NextResponse } from 'next/server'
import { getCommunityCameraConfig } from '@/lib/community-cameras'
import { getCameraImage } from '@/lib/camera-store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cameras/<id>/image — latest picture from a community camera.
 * URLs carry ?t=<taken at>, so each new picture gets a fresh URL and this one can be cached.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const config = getCommunityCameraConfig(id)
  if (!config || config.visibility === 'hidden') {
    return new NextResponse('Not found', { status: 404 })
  }

  const image = await getCameraImage(id)
  if (!image) {
    return new NextResponse('No picture yet', { status: 404 })
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.contentType,
      'Content-Length': String(image.data.length),
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'Last-Modified': new Date(image.takenAt).toUTCString(),
    },
  })
}
