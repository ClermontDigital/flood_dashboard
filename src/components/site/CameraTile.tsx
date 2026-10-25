import Link from 'next/link'
import type { FloodCamera } from '@/lib/types'
import { expandAbbreviations } from '@/lib/seo'
import { CameraThumb } from './CameraThumb'

export function CameraTile({ camera, note }: { camera: FloodCamera; note?: string }) {
  const credit = camera.kind === 'community' && camera.donor ? `Courtesy of ${camera.donor}` : camera.source
  return (
    <Link href={`/camera/${camera.key}`} className="block bg-gray-50 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all">
      <div className="aspect-video bg-gray-100">
        <CameraThumb src={camera.imageUrls[0]} alt={`Latest picture from the ${expandAbbreviations(camera.description)} flood camera`} />
      </div>
      <div className="p-2">
        <div className="text-sm font-medium text-gray-900 line-clamp-2">{camera.description}</div>
        <div className="text-xs text-gray-500 truncate">{note ?? credit}</div>
      </div>
    </Link>
  )
}
