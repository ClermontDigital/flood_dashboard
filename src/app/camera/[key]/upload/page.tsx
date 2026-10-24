import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCommunityCameraConfig } from '@/lib/community-cameras'
import CameraUploadForm from '@/components/CameraUploadForm'

// Private upload page for a community camera's owner: /camera/<id>/upload#<token>.
// The token sits in the URL fragment so it never reaches server logs; the form sends it as a header.

interface Props {
  params: Promise<{ key: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  const camera = getCommunityCameraConfig(key)
  return {
    title: camera ? `Upload a picture – ${camera.name}` : 'Upload a picture',
    robots: { index: false, follow: false },
  }
}

export default async function CameraUploadPage({ params }: Props) {
  const { key } = await params
  const camera = getCommunityCameraConfig(key)
  if (!camera) notFound()
  return <CameraUploadForm cameraId={camera.id} cameraName={camera.name} />
}
