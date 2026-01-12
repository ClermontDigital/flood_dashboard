'use client'

import dynamic from 'next/dynamic'

// Export existing components
export { GaugeCard } from './GaugeCard'
export { StatusBadge } from './StatusBadge'
export { WarningBanner } from './WarningBanner'
export { WaterLevelChart } from './WaterLevelChart'

// Export LocationSearch and QuickLinks directly
export { default as LocationSearch } from './LocationSearch'
export { default as QuickLinks } from './QuickLinks'

// Dynamically import FloodMap with SSR disabled to avoid Leaflet SSR issues
export const FloodMap = dynamic(() => import('./FloodMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading map...</span>
      </div>
    </div>
  ),
})
