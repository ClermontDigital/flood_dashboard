'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { HistoryPoint, FloodThresholds } from '@/lib/types'

interface WaterLevelChartProps {
  history: HistoryPoint[]
  thresholds?: FloodThresholds
  gaugeId: string
}

interface ChartDataPoint {
  time: string
  timestamp: number
  level: number
  displayTime: string
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatFullTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload as ChartDataPoint

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-3"
      role="tooltip"
    >
      <p className="text-sm font-medium text-gray-900">{data.displayTime}</p>
      <p className="text-lg font-bold text-blue-600">
        {data.level.toFixed(2)} m
      </p>
    </div>
  )
}

export function WaterLevelChart({
  history,
  thresholds,
  gaugeId,
}: WaterLevelChartProps) {
  // Transform and sort data for the chart
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return history
      .map((point) => ({
        time: formatTime(point.timestamp),
        timestamp: new Date(point.timestamp).getTime(),
        level: point.level,
        displayTime: formatFullTime(point.timestamp),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [history])

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 10]

    const levels = chartData.map((d) => d.level)
    let minLevel = Math.min(...levels)
    let maxLevel = Math.max(...levels)

    // Include thresholds in the domain calculation
    if (thresholds) {
      maxLevel = Math.max(maxLevel, thresholds.major + 0.5)
    }

    // Add padding
    const padding = (maxLevel - minLevel) * 0.1 || 0.5
    return [Math.max(0, minLevel - padding), maxLevel + padding]
  }, [chartData, thresholds])

  // Get tick values for X-axis (show fewer ticks for readability)
  const xTicks = useMemo(() => {
    if (chartData.length <= 6) {
      return chartData.map((d) => d.time)
    }
    const step = Math.ceil(chartData.length / 6)
    return chartData.filter((_, i) => i % step === 0).map((d) => d.time)
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200"
        role="img"
        aria-label="No water level history data available"
      >
        <p className="text-gray-500">No historical data available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          24-Hour Water Level History
        </h3>
        <p className="text-sm text-gray-600">
          Water levels measured in metres over the past 24 hours
        </p>
      </div>

      {/* Chart Container */}
      <div
        className="w-full h-64 sm:h-80"
        role="img"
        aria-label={`Water level chart for gauge ${gaugeId} showing ${chartData.length} data points over 24 hours`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
              ticks={xTicks}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={yDomain}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value) => `${value.toFixed(1)}m`}
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Threshold Reference Lines */}
            {thresholds && (
              <>
                <ReferenceLine
                  y={thresholds.minor}
                  stroke="#eab308"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Minor',
                    position: 'right',
                    fill: '#eab308',
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={thresholds.moderate}
                  stroke="#f97316"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Moderate',
                    position: 'right',
                    fill: '#f97316',
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={thresholds.major}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'Major',
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 11,
                  }}
                />
              </>
            )}

            {/* Water Level Line */}
            <Line
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#3b82f6',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              name="Water Level"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {thresholds && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-blue-500" aria-hidden="true" />
            <span className="text-gray-600">Water Level</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 bg-yellow-500"
              style={{ borderTop: '2px dashed' }}
              aria-hidden="true"
            />
            <span className="text-gray-600">
              Minor ({thresholds.minor}m)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 bg-orange-500"
              style={{ borderTop: '2px dashed' }}
              aria-hidden="true"
            />
            <span className="text-gray-600">
              Moderate ({thresholds.moderate}m)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 bg-red-500"
              style={{ borderTop: '2px dashed' }}
              aria-hidden="true"
            />
            <span className="text-gray-600">
              Major ({thresholds.major}m)
            </span>
          </div>
        </div>
      )}

      {/* Accessibility Description */}
      <div className="sr-only">
        <p>
          This chart shows water level readings over the past 24 hours.
          {thresholds && (
            <>
              {' '}
              Flood thresholds are marked: minor flooding at {thresholds.minor}{' '}
              metres, moderate flooding at {thresholds.moderate} metres, and
              major flooding at {thresholds.major} metres.
            </>
          )}
        </p>
        <p>
          Latest reading:{' '}
          {chartData.length > 0
            ? `${chartData[chartData.length - 1].level.toFixed(2)} metres at ${chartData[chartData.length - 1].displayTime}`
            : 'No data available'}
        </p>
      </div>
    </div>
  )
}

export default WaterLevelChart
