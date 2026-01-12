import type { Prediction, HistoryPoint } from '../types'

/**
 * Calculate trend-based predictions using simple linear projection
 *
 * Formula: Stage(t+lead) = Stage(t) + (Stage(t) - Stage(t-1)) * lead_hours
 *
 * Confidence decreases with prediction horizon:
 * - 2 hours: 85%
 * - 4 hours: 70%
 * - 6 hours: 55%
 */
export function calculateTrendPredictions(
  currentLevel: number,
  previousLevel: number,
  hoursApart: number = 1
): Prediction[] {
  // Calculate hourly rate of change
  const hourlyChange = (currentLevel - previousLevel) / hoursApart

  // Prediction horizons
  const horizons = [
    { hours: 2, confidence: 0.85 },
    { hours: 4, confidence: 0.70 },
    { hours: 6, confidence: 0.55 },
  ]

  return horizons.map(({ hours, confidence }) => ({
    time: `+${hours}h`,
    level: Math.max(0, currentLevel + hourlyChange * hours),
    confidence,
  }))
}

/**
 * Calculate predictions from historical data points
 */
export function calculatePredictionsFromHistory(
  history: HistoryPoint[]
): Prediction[] | null {
  if (history.length < 2) return null

  // Sort by timestamp, most recent first
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const current = sorted[0]
  const previous = sorted[1]

  // Calculate hours between readings
  const timeDiff =
    (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
    (1000 * 60 * 60)

  if (timeDiff <= 0) return null

  return calculateTrendPredictions(current.level, previous.level, timeDiff)
}

/**
 * Get the average rate of change over multiple readings
 */
export function getAverageChangeRate(history: HistoryPoint[]): number {
  if (history.length < 2) return 0

  // Sort by timestamp
  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  // Calculate total change over period
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const totalHours =
    (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) /
    (1000 * 60 * 60)

  if (totalHours <= 0) return 0

  return (last.level - first.level) / totalHours
}
