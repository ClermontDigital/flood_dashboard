'use client'

import { cn } from '@/lib/utils'
import type { FloodStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: FloodStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const statusConfig = {
  safe: {
    color: 'bg-[#22c55e]',
    textColor: 'text-white',
    label: 'Safe',
    icon: (
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    description: 'Water levels are normal',
  },
  watch: {
    color: 'bg-[#eab308]',
    textColor: 'text-black',
    label: 'Watch',
    icon: (
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    description: 'Water levels are rising, stay informed',
  },
  warning: {
    color: 'bg-[#f97316]',
    textColor: 'text-white',
    label: 'Warning',
    icon: (
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    description: 'Flooding expected, prepare to act',
  },
  danger: {
    color: 'bg-[#ef4444]',
    textColor: 'text-white',
    label: 'Danger',
    icon: (
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    description: 'Major flooding, take action now',
  },
}

const sizeConfig = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    icon: 'w-2.5 h-2.5',
  },
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-3 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-4 py-1.5 text-base gap-2',
    icon: 'w-5 h-5',
  },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const shouldPulse = status === 'warning' || status === 'danger'

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        config.color,
        config.textColor,
        sizeStyles.badge,
        shouldPulse && 'animate-pulse'
      )}
      role="status"
      aria-label={`Flood status: ${config.label}. ${config.description}`}
    >
      <span className={sizeStyles.icon}>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}

export default StatusBadge
