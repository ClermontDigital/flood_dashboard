import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Clermont Flood Tracking'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://gauge.clermont.digital/logo.png"
          alt="Gauge Logo"
          width={256}
          height={256}
          style={{
            borderRadius: '32px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#1e40af',
              textAlign: 'center',
            }}
          >
            Clermont Flood Tracking
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#4b5563',
            }}
          >
            Real-time water level monitoring
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
