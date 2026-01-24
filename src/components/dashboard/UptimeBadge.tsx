'use client'

import { cn } from '@/lib/utils'

interface UptimeBadgeProps {
  percentage: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeConfig = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    dot: 'w-1.5 h-1.5',
  },
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    dot: 'w-2.5 h-2.5',
  },
}

function getUptimeConfig(percentage: number) {
  if (percentage >= 95) {
    return {
      color: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-500',
      label: 'Reliable',
      description: 'Gauge is reliably reporting data',
    }
  }
  if (percentage >= 80) {
    return {
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      dotColor: 'bg-yellow-500',
      label: 'Intermittent',
      description: 'Gauge has some reporting gaps',
    }
  }
  return {
    color: 'bg-red-100',
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
    label: 'Unreliable',
    description: 'Gauge frequently stops reporting',
  }
}

export function UptimeBadge({ percentage, size = 'sm', showLabel = false }: UptimeBadgeProps) {
  const config = getUptimeConfig(percentage)
  const sizeStyles = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.color,
        config.textColor,
        sizeStyles.badge
      )}
      role="status"
      aria-label={`7-day uptime: ${percentage.toFixed(0)}%. ${config.description}`}
      title={`7-day uptime: ${percentage.toFixed(1)}%`}
    >
      <span className={cn('rounded-full', config.dotColor, sizeStyles.dot)} />
      <span>{percentage.toFixed(0)}%</span>
      {showLabel && <span className="opacity-75">uptime</span>}
    </span>
  )
}

export default UptimeBadge
