import { NextResponse } from 'next/server'
import { gzipSync } from 'zlib'

const MIN_COMPRESS_BYTES = 1024

// Next.js doesn't compress route handler responses, and some of ours are large (fuel ~750 KB,
// gauge list ~50 KB), so gzip JSON here when the client accepts it.
export function jsonResponse(
  request: Request,
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
): NextResponse {
  const json = JSON.stringify(body)
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.append('Vary', 'Accept-Encoding')

  const acceptsGzip = /\bgzip\b/.test(request.headers.get('accept-encoding') || '')
  if (json.length >= MIN_COMPRESS_BYTES && acceptsGzip) {
    headers.set('Content-Encoding', 'gzip')
    return new NextResponse(new Uint8Array(gzipSync(json)), { status: init.status ?? 200, headers })
  }
  return new NextResponse(json, { status: init.status ?? 200, headers })
}
