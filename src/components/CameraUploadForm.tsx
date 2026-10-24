'use client'

import { useEffect, useState } from 'react'

const MAX_WIDTH = 1600
const MAX_BYTES = 850 * 1024

// "2026-10-24T18:45" in the phone's own time, for the datetime-local input
function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Shrink big photos and turn screenshots (PNG/HEIC-as-JPEG) into a JPEG under the upload limit
async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  for (const quality of [0.85, 0.75, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_BYTES) return blob
  }
  throw new Error('That picture is too large to upload.')
}

export default function CameraUploadForm({ cameraId, cameraName }: { cameraId: string; cameraName: string }) {
  const [token, setToken] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [takenAt, setTakenAt] = useState('')
  const [state, setState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setToken(window.location.hash.slice(1) || '')
    setTakenAt(localInputValue(new Date()))
  }, [])

  const choose = (f: File | null) => {
    setFile(f)
    setState('idle')
    setMessage('')
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const upload = async () => {
    if (!file || !token) return
    setState('uploading')
    setMessage('')
    try {
      const jpeg = await toJpeg(file)
      const taken = takenAt ? new Date(takenAt) : new Date()
      const res = await fetch(`/api/cameras/${cameraId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'x-upload-token': token,
          'x-taken-at': taken.toISOString(),
        },
        body: jpeg,
      })
      if (res.status === 401) throw new Error('This upload link isn’t valid any more. Ask Steve for a new one.')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'The upload didn’t work. Please try again.')
      }
      setState('done')
      setMessage('Uploaded. The picture is now on the camera page.')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'The upload didn’t work. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-5">
        <h1 className="text-xl font-semibold text-gray-900">Upload a picture</h1>
        <p className="text-gray-600 mt-1">{cameraName}</p>

        {token === '' ? (
          <p className="mt-4 p-3 rounded-lg bg-amber-50 text-amber-800">
            This upload link is incomplete. Please use the full link you were sent.
          </p>
        ) : (
          <>
            <label className="mt-5 flex items-center justify-center w-full py-4 rounded-lg border-2 border-dashed border-gray-300 text-blue-600 font-medium cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => choose(e.target.files?.[0] ?? null)}
              />
              {file ? 'Choose a different picture' : 'Choose picture'}
            </label>

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Picture to upload" className="mt-4 w-full rounded-lg" />
            )}

            <label className="block mt-4 text-sm font-medium text-gray-700">
              When was the picture taken?
              <input
                type="datetime-local"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900"
              />
              <span className="block mt-1 text-xs text-gray-500">Leave as is if you just took it.</span>
            </label>

            <button
              type="button"
              onClick={upload}
              disabled={!file || !token || state === 'uploading'}
              className="mt-5 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              {state === 'uploading' ? 'Uploading…' : 'Upload'}
            </button>

            {message && (
              <p
                role="status"
                className={`mt-4 p-3 rounded-lg ${state === 'done' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
              >
                {message}
              </p>
            )}

            {state === 'done' && (
              <a href={`/camera/${cameraId}`} className="mt-3 block text-center text-blue-600 font-medium hover:underline">
                See it on the map
              </a>
            )}
          </>
        )}
      </div>
    </main>
  )
}
