import { createHmac } from 'crypto'
import { secretMatches } from './secrets'

/**
 * Per-camera upload token for the private upload link (/camera/<id>/upload#<token>),
 * derived from CAMERA_UPLOAD_KEY so there's nothing extra to store. Rotating the key
 * revokes every camera's link.
 */
export function cameraUploadToken(cameraId: string): string | null {
  const key = process.env.CAMERA_UPLOAD_KEY
  if (!key) return null
  return createHmac('sha256', key).update(`camera-upload:${cameraId}`).digest('base64url').slice(0, 32)
}

/** Upload allowed with the master key (scripts, capture job) or that camera's own token (upload link). */
export function isCameraUploadAuthorized(request: Request, cameraId: string): boolean {
  const key = process.env.CAMERA_UPLOAD_KEY
  if (!key) return process.env.NODE_ENV === 'development'
  return (
    secretMatches(request.headers.get('x-camera-key'), key) ||
    secretMatches(request.headers.get('x-upload-token'), cameraUploadToken(cameraId) ?? undefined)
  )
}
