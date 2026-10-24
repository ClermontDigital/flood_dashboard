/**
 * Latest picture for each community camera, one Firestore document per camera
 * (collection `communityCameraImages`, document id = camera id). Pictures are small
 * (~100 KB), well under Firestore's 1 MB document limit, and each upload overwrites the last.
 *
 * Local development without Firestore credentials keeps pictures in memory instead.
 */

import { getDb } from './firestore'

const COLLECTION = 'communityCameraImages'
export const MAX_IMAGE_BYTES = 900 * 1024
const IMAGE_CACHE_MS = 60 * 1000

export interface CameraImageMeta {
  takenAt: string
  lastAttemptAt: string
  status: 'ok' | 'unreachable'
  bytes: number
  width?: number
  height?: number
}

export interface CameraImage extends CameraImageMeta {
  data: Buffer
  contentType: string
}

// Dev fallback store, and a short read cache so viewers and link previews don't each hit Firestore.
// Kept on globalThis because Next loads route handlers and pages as separate module copies.
const shared = globalThis as typeof globalThis & {
  __gaugeCameraImages?: Map<string, CameraImage>
  __gaugeCameraReadCache?: Map<string, { at: number; image: CameraImage | null }>
}
const memoryStore = (shared.__gaugeCameraImages ??= new Map<string, CameraImage>())
const readCache = (shared.__gaugeCameraReadCache ??= new Map<string, { at: number; image: CameraImage | null }>())

/** Width and height from a JPEG's start-of-frame marker, if present. */
export function jpegDimensions(data: Buffer): { width: number; height: number } | null {
  let i = 2
  while (i + 9 < data.length) {
    if (data[i] !== 0xff) return null
    const marker = data[i + 1]
    const length = data.readUInt16BE(i + 2)
    // SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) }
    }
    i += 2 + length
  }
  return null
}

export function isJpeg(data: Buffer): boolean {
  return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
}

export async function saveCameraImage(id: string, data: Buffer, takenAt: string): Promise<CameraImageMeta> {
  const now = new Date().toISOString()
  const dims = jpegDimensions(data)
  const image: CameraImage = {
    data,
    contentType: 'image/jpeg',
    takenAt,
    lastAttemptAt: now,
    status: 'ok',
    bytes: data.length,
    ...(dims ?? {}),
  }

  const db = getDb()
  if (db) {
    await db.collection(COLLECTION).doc(id).set(image)
  } else {
    memoryStore.set(id, image)
  }
  readCache.set(id, { at: Date.now(), image })
  const { data: _data, contentType: _type, ...meta } = image
  return meta
}

/** Record a failed capture: the picture stays, but it's flagged so the UI says "Last seen". */
export async function markCameraUnreachable(id: string): Promise<void> {
  const update = { status: 'unreachable' as const, lastAttemptAt: new Date().toISOString() }
  const db = getDb()
  if (db) {
    await db.collection(COLLECTION).doc(id).set(update, { merge: true })
  } else {
    const existing = memoryStore.get(id)
    if (existing) memoryStore.set(id, { ...existing, ...update })
  }
  readCache.delete(id)
}

export async function getCameraImage(id: string): Promise<CameraImage | null> {
  const cached = readCache.get(id)
  if (cached && Date.now() - cached.at < IMAGE_CACHE_MS) return cached.image

  let image: CameraImage | null = null
  const db = getDb()
  if (db) {
    const doc = await db.collection(COLLECTION).doc(id).get()
    const d = doc.data()
    if (d?.data) {
      image = {
        data: Buffer.from(d.data),
        contentType: d.contentType || 'image/jpeg',
        takenAt: d.takenAt,
        lastAttemptAt: d.lastAttemptAt || d.takenAt,
        status: d.status === 'unreachable' ? 'unreachable' : 'ok',
        bytes: d.bytes || 0,
        width: d.width,
        height: d.height,
      }
    }
  } else {
    image = memoryStore.get(id) ?? null
  }
  readCache.set(id, { at: Date.now(), image })
  return image
}

export async function getCameraImageMeta(id: string): Promise<CameraImageMeta | null> {
  const image = await getCameraImage(id)
  if (!image) return null
  const { data: _data, contentType: _type, ...meta } = image
  return meta
}
