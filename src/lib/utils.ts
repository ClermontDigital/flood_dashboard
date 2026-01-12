import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import type { FloodStatus, Trend, WaterLevel, FloodThresholds } from './types'

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate flood status based on water level and thresholds
export function calculateStatus(level: number, thresholds: FloodThresholds | null): FloodStatus {
  if (!thresholds) return 'safe'

  if (level >= thresholds.major) return 'danger'
  if (level >= thresholds.moderate) return 'warning'
  if (level >= thresholds.minor) return 'watch'
  return 'safe'
}

// Calculate trend from recent readings
export function calculateTrend(current: number, previous: number, hoursApart: number = 1): Trend {
  const changeRate = (current - previous) / hoursApart

  if (changeRate > 0.05) return 'rising'
  if (changeRate < -0.05) return 'falling'
  return 'stable'
}

// Format time since last update
export function formatTimeSince(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

// Check if data is stale (older than 2 hours)
export function isDataStale(timestamp: string): boolean {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    return diffMs > 2 * 60 * 60 * 1000 // 2 hours
  } catch {
    return true
  }
}

// Format water level for display
export function formatLevel(level: number, unit: string = 'm'): string {
  return `${level.toFixed(2)} ${unit}`
}

// Get trend arrow icon
export function getTrendArrow(trend: Trend): string {
  switch (trend) {
    case 'rising': return '↗'
    case 'falling': return '↘'
    case 'stable': return '→'
  }
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Sort gauges by distance from a point
export function sortByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  fromLat: number,
  fromLng: number
): T[] {
  return [...items].sort((a, b) => {
    const distA = calculateDistance(fromLat, fromLng, a.lat, a.lng)
    const distB = calculateDistance(fromLat, fromLng, b.lat, b.lng)
    return distA - distB
  })
}

// Filter gauges within radius (km)
export function filterByRadius<T extends { lat: number; lng: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): T[] {
  return items.filter((item) => {
    const distance = calculateDistance(centerLat, centerLng, item.lat, item.lng)
    return distance <= radiusKm
  })
}

// Fuzzy search for gauges/locations
export function fuzzySearch(query: string, items: { name: string; stream?: string }[]): typeof items {
  const lowerQuery = query.toLowerCase()
  return items.filter((item) => {
    const name = item.name.toLowerCase()
    const stream = item.stream?.toLowerCase() || ''
    return name.includes(lowerQuery) || stream.includes(lowerQuery)
  })
}

// Local storage helpers
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable
  }
}

// Generate mock water level for development
export function generateMockWaterLevel(gaugeId: string): WaterLevel {
  const baseLevel = 1 + Math.random() * 4
  const trend: Trend = ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as Trend

  return {
    gaugeId,
    level: baseLevel,
    unit: 'm',
    trend,
    changeRate: trend === 'rising' ? 0.1 : trend === 'falling' ? -0.05 : 0,
    status: baseLevel > 8 ? 'danger' : baseLevel > 6 ? 'warning' : baseLevel > 4 ? 'watch' : 'safe',
    timestamp: new Date().toISOString(),
    source: 'wmip',
  }
}
