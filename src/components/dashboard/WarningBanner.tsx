'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { FloodWarning } from '@/lib/types'

interface WarningBannerProps {
  warnings: FloodWarning[]
  onDismiss?: () => void
}

const levelConfig = {
  minor: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    icon: 'text-yellow-400',
  },
  moderate: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-800',
    icon: 'text-orange-400',
  },
  major: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
    icon: 'text-red-400',
  },
}

const emergencyResources = [
  {
    name: 'Bureau of Meteorology',
    shortName: 'BOM',
    url: 'http://www.bom.gov.au/qld/warnings/',
    description: 'Official flood warnings and weather updates',
  },
  {
    name: 'QLD SES',
    shortName: 'SES',
    url: 'https://www.ses.qld.gov.au/',
    description: 'State Emergency Service - call 132 500',
  },
  {
    name: 'Isaac Regional Council',
    shortName: 'Council',
    url: 'https://www.isaac.qld.gov.au/disaster-management',
    description: 'Local disaster management information',
  },
]

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-6 h-6', className)}
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
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-3 h-3 ml-1 inline-block', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export function WarningBanner({ warnings, onDismiss }: WarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [dismissedWarningIds, setDismissedWarningIds] = useState<Set<string>>(new Set())

  // Get the highest severity level from all warnings
  const getHighestLevel = useCallback(() => {
    if (warnings.some((w) => w.level === 'major')) return 'major'
    if (warnings.some((w) => w.level === 'moderate')) return 'moderate'
    return 'minor'
  }, [warnings])

  // Check for new warnings that weren't previously dismissed
  const hasNewWarnings = warnings.some((w) => !dismissedWarningIds.has(w.id))

  // Reset dismissed state if there are new warnings
  useEffect(() => {
    if (hasNewWarnings && isDismissed) {
      setIsDismissed(false)
    }
  }, [hasNewWarnings, isDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
    setDismissedWarningIds(new Set(warnings.map((w) => w.id)))
    onDismiss?.()
  }

  // Don't render if no warnings or all dismissed
  if (warnings.length === 0 || isDismissed) {
    return null
  }

  const highestLevel = getHighestLevel()
  const styles = levelConfig[highestLevel]

  return (
    <div
      className={cn(
        'relative border-l-4 p-4 mb-4',
        styles.bg,
        styles.border
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className={cn(
          'absolute top-2 right-2 p-1 rounded-full',
          'hover:bg-black/10 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
        )}
        aria-label="Dismiss warning banner"
      >
        <CloseIcon className={styles.text} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <WarningIcon className={styles.icon} />
        <div className="flex-1">
          <h2 className={cn('text-lg font-bold', styles.text)}>
            {warnings.length === 1
              ? 'Active Flood Warning'
              : `${warnings.length} Active Flood Warnings`}
          </h2>

          {/* Warning List */}
          <div className="mt-2 space-y-3">
            {warnings.map((warning) => (
              <div key={warning.id} className={cn('text-sm', styles.text)}>
                <p className="font-semibold">
                  {warning.title}
                  <span className="ml-2 text-xs font-normal opacity-75">
                    ({warning.level} flooding)
                  </span>
                </p>
                <p className="mt-1 opacity-90">{warning.summary}</p>
                <p className="mt-1 text-xs opacity-75">
                  Area: {warning.area} | Issued:{' '}
                  {new Date(warning.issueTime).toLocaleString('en-AU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                {warning.url && (
                  <a
                    href={warning.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-block mt-1 text-xs underline hover:no-underline',
                      styles.text
                    )}
                  >
                    View full warning
                    <ExternalLinkIcon />
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Emergency Resources */}
          <div className="mt-4 pt-3 border-t border-current/20">
            <p className={cn('text-xs font-semibold mb-2', styles.text)}>
              Emergency Resources:
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {emergencyResources.map((resource) => (
                <a
                  key={resource.shortName}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full',
                    'bg-white/50 hover:bg-white/80 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    styles.text
                  )}
                  title={resource.description}
                >
                  {resource.shortName}
                  <ExternalLinkIcon />
                  <span className="sr-only">
                    {resource.name} - {resource.description} (opens in new tab)
                  </span>
                </a>
              ))}
            </div>
            <p className={cn('mt-2 text-xs', styles.text)}>
              In an emergency, call <strong>000</strong>. For SES assistance, call{' '}
              <strong>132 500</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WarningBanner
