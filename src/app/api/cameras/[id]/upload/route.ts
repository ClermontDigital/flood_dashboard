import { NextResponse } from 'next/server'
import { getCommunityCameraConfig } from '@/lib/community-cameras'
import { isJpeg, markCameraUnreachable, MAX_IMAGE_BYTES, saveCameraImage } from '@/lib/camera-store'
import { isCameraUploadAuthorized } from '@/lib/camera-upload-token'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cameras/<id>/upload — store a community camera's latest picture.
 *
 *   Body: the JPEG (Content-Type: image/jpeg), up to 900 KB
 *   x-camera-key: upload key (CAMERA_UPLOAD_KEY, from Secret Manager), or
 *   x-upload-token: that camera's token from its private upload link
 *   x-taken-at:   optional ISO time the picture was taken (defaults to now)
 *
 * Or send JSON {"status":"unreachable"} to record a failed capture; the last picture stays
 * and the site shows "Last seen …".
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isCameraUploadAuthorized(request, id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!getCommunityCameraConfig(id)) {
    return NextResponse.json({ error: 'Unknown camera' }, { status: 404 })
  }

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    if (body?.status !== 'unreachable') {
      return NextResponse.json({ error: 'Expected {"status":"unreachable"}' }, { status: 400 })
    }
    await markCameraUnreachable(id)
    return NextResponse.json({ ok: true, status: 'unreachable' })
  }

  const data = Buffer.from(await request.arrayBuffer())
  if (data.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: `Image too large (max ${MAX_IMAGE_BYTES} bytes)` }, { status: 413 })
  }
  if (!isJpeg(data)) {
    return NextResponse.json({ error: 'Expected a JPEG image' }, { status: 415 })
  }

  const takenHeader = request.headers.get('x-taken-at')
  const takenAtMs = takenHeader ? Date.parse(takenHeader) : Date.now()
  if (!Number.isFinite(takenAtMs) || takenAtMs > Date.now() + 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Invalid x-taken-at' }, { status: 400 })
  }

  const meta = await saveCameraImage(id, data, new Date(takenAtMs).toISOString())
  console.log(`[Cameras] Stored picture for ${id}: ${meta.bytes} bytes, taken ${meta.takenAt}`)
  return NextResponse.json({ ok: true, ...meta })
}
