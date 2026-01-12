'use client'

import { QUICK_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface QuickLinksProps {
  onSelect: (location: { name: string; lat: number; lng: number }) => void
}

export default function QuickLinks({ onSelect }: QuickLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_LINKS.map((location) => (
        <button
          key={location.name}
          onClick={() => onSelect(location)}
          className={cn(
            'px-4 py-2 rounded-full',
            'bg-blue-50 hover:bg-blue-100 active:bg-blue-200',
            'text-blue-700 font-medium text-sm',
            'border border-blue-200 hover:border-blue-300',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            'whitespace-nowrap'
          )}
        >
          {location.name}
        </button>
      ))}
    </div>
  )
}
