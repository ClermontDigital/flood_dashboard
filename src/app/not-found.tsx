import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-7rem)] -mb-8 flex items-center justify-center px-4 py-16 overflow-hidden bg-gray-50">
      {/* Animated water level background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Solid water fill at the very bottom to prevent gaps */}
        <div className="absolute bottom-0 left-0 w-full h-16" style={{ background: 'rgba(30, 64, 175, 0.18)' }} />
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          style={{ height: '60%' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Back wave - slowest */}
          <path fill="url(#water-grad)">
            <animate
              attributeName="d"
              values="M0,120 C240,60 480,160 720,100 C960,40 1200,140 1440,80 L1440,400 L0,400Z;M0,100 C240,160 480,60 720,120 C960,160 1200,40 1440,100 L1440,400 L0,400Z;M0,120 C240,60 480,160 720,100 C960,40 1200,140 1440,80 L1440,400 L0,400Z"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>

          {/* Middle wave */}
          <path fill="#1e40af" opacity="0.06">
            <animate
              attributeName="d"
              values="M0,160 C360,110 720,200 1080,140 C1260,110 1380,170 1440,150 L1440,400 L0,400Z;M0,140 C360,200 720,110 1080,170 C1260,190 1380,120 1440,160 L1440,400 L0,400Z;M0,160 C360,110 720,200 1080,140 C1260,110 1380,170 1440,150 L1440,400 L0,400Z"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>

          {/* Front wave - fastest */}
          <path fill="#1e40af" opacity="0.04">
            <animate
              attributeName="d"
              values="M0,200 C180,170 360,220 540,190 C720,160 900,230 1080,195 C1260,165 1380,210 1440,195 L1440,400 L0,400Z;M0,190 C180,220 360,170 540,205 C720,230 900,165 1080,200 C1260,225 1380,180 1440,200 L1440,400 L0,400Z;M0,200 C180,170 360,220 540,190 C720,160 900,230 1080,195 C1260,165 1380,210 1440,195 L1440,400 L0,400Z"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Animated water level gauge SVG */}
        <div className="relative mx-auto w-48 h-64 mb-8">
          <svg viewBox="0 0 120 180" className="w-full h-full" aria-hidden="true">
            {/* Gauge pole */}
            <rect x="55" y="10" width="10" height="160" rx="5" fill="#d1d5db" />

            {/* Gauge markings */}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <rect x="40" y={150 - i * 30} width="15" height="2" fill="#9ca3af" />
                <text x="35" y={154 - i * 30} textAnchor="end" fontSize="10" fill="#6b7280">
                  {i}m
                </text>
              </g>
            ))}

            {/* Rising water animation */}
            <defs>
              <clipPath id="gauge-clip">
                <rect x="0" y="0" width="120" height="180" />
              </clipPath>
            </defs>

            {/* Water */}
            <g clipPath="url(#gauge-clip)">
              <rect x="0" y="90" width="120" height="100" fill="#1e40af" opacity="0.15" rx="4">
                <animate
                  attributeName="y"
                  values="130;90;130"
                  dur="4s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
              </rect>

              {/* Wave line */}
              <path
                d="M0,100 Q15,92 30,100 Q45,108 60,100 Q75,92 90,100 Q105,108 120,100"
                fill="none"
                stroke="#1e40af"
                strokeWidth="2.5"
                opacity="0.4"
              >
                <animate
                  attributeName="d"
                  values="M0,100 Q15,92 30,100 Q45,108 60,100 Q75,92 90,100 Q105,108 120,100;M0,100 Q15,108 30,100 Q45,92 60,100 Q75,108 90,100 Q105,92 120,100;M0,100 Q15,92 30,100 Q45,108 60,100 Q75,92 90,100 Q105,108 120,100"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="transform"
                  attributeType="XML"
                  type="translate"
                  values="0,30;0,-10;0,30"
                  dur="4s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
              </path>
            </g>

            {/* "404" on the gauge reading plate */}
            <rect x="68" y="55" width="48" height="24" rx="4" fill="#1e40af" />
            <text x="92" y="72" textAnchor="middle" fontSize="15" fontWeight="bold" fill="white">
              404
            </text>
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Water Level Not Found
        </h1>
        <p className="text-lg text-gray-500 mb-2">
          This Gauge page has gone offline... or maybe it never existed.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Like a creek in the dry season, there&apos;s nothing here right now.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Back to Dashboard
          </Link>
          <a
            href="https://www.bom.gov.au/qld/flood/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            BOM Flood Warnings
          </a>
        </div>

        <p className="mt-10 text-sm text-gray-400">
          If the rivers are rising, head to higher ground, not to this page.
        </p>
      </div>
    </div>
  )
}
