'use client'

import { useState } from 'react'

// Camera picture that falls back to a note when the council's image can't be loaded
export function CameraThumb({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(!src)

  if (failed) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Picture unavailable</div>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // An image that failed before hydration never fires onError; catch it when React attaches
      ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setFailed(true) }}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}
