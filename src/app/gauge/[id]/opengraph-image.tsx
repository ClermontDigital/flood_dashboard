import { ImageResponse } from 'next/og'
import { GAUGE_STATIONS } from '@/lib/constants'

export const runtime = 'edge'

export const alt = 'Gauge - Queensland Flood Tracking'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Image({ params }: Props) {
  const { id } = await params
  const gauge = GAUGE_STATIONS.find(g => g.id === id)

  const gaugeName = gauge?.name || 'Unknown Gauge'
  const streamName = gauge?.stream || ''

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
          width={200}
          height={200}
          style={{
            borderRadius: '24px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#1e40af',
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            {gaugeName}
          </div>
          {streamName && (
            <div
              style={{
                fontSize: 28,
                color: '#4b5563',
                textAlign: 'center',
              }}
            >
              {streamName}
            </div>
          )}
          <div
            style={{
              fontSize: 24,
              color: '#6b7280',
              marginTop: '8px',
            }}
          >
            Queensland Flood Tracking
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
