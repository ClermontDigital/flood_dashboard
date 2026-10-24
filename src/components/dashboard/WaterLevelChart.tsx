'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { HistoryPoint, FloodThresholds, DailyUptimeStat } from '@/lib/types'

interface WaterLevelChartProps {
  history: HistoryPoint[]
  thresholds?: FloodThresholds
  gaugeId: string
  uptimeStats?: DailyUptimeStat[]
}

interface ChartDataPoint {
  time: string
  timestamp: number
  level: number
  displayTime: string
}

function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Brisbane',
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
    timeZone: 'Australia/Brisbane',
  })
}

// Real readings wobble by a few millimetres; without a floor on the range that noise fills the chart
const MIN_Y_SPAN_M = 0.5

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
  uptimeStats,
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

    // Keep a sensible minimum range centred on the readings
    if (maxLevel - minLevel < MIN_Y_SPAN_M) {
      const mid = (maxLevel + minLevel) / 2
      minLevel = mid - MIN_Y_SPAN_M / 2
      maxLevel = mid + MIN_Y_SPAN_M / 2
    }

    // Add padding
    const padding = (maxLevel - minLevel) * 0.1 || 0.5
    const low = minLevel - padding
    return [minLevel >= 0 ? Math.max(0, low) : low, maxLevel + padding]
  }, [chartData, thresholds])

  // Two decimals when the range is small, so tick labels don't all round to the same value
  const yDecimals = yDomain[1] - yDomain[0] < 2 ? 2 : 1

  // X-axis ticks every 4 hours on the hour. The axis is a real time scale, so gaps in
  // readings show as gaps rather than being squashed together.
  const xTicks = useMemo(() => {
    if (chartData.length < 2) return chartData.map((d) => d.timestamp)
    const step = 4 * 60 * 60 * 1000
    const first = chartData[0].timestamp
    const last = chartData[chartData.length - 1].timestamp
    const ticks: number[] = []
    for (let t = Math.ceil(first / step) * step; t <= last; t += step) ticks.push(t)
    return ticks
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
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value: number) => formatTime(value)}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
              ticks={xTicks}
            />

            <YAxis
              domain={yDomain}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#d1d5db' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={(value: number) => `${value.toFixed(yDecimals)}m`}
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

      {/* 7-Day Uptime Bar Chart */}
      {uptimeStats && uptimeStats.length > 0 && (
        <div id="reliability" className="mt-6 pt-4 border-t border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              7-Day Reliability
            </h3>
            <p className="text-sm text-gray-600">
              Percentage of expected reports received each day
            </p>
          </div>

          <div
            className="w-full h-32"
            role="img"
            aria-label={`Uptime chart showing gauge reliability over the past 7 days`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uptimeStats} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(date) => {
                    const d = new Date(date)
                    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' })
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={{ stroke: '#d1d5db' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickFormatter={(value) => `${value}%`}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const data = payload[0].payload as DailyUptimeStat
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(data.date).toLocaleDateString('en-AU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {data.uptime.toFixed(1)}% uptime
                        </p>
                        <p className="text-xs text-gray-500">
                          {data.actualReports} / {data.expectedReports} reports
                        </p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine
                  y={95}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
                <Bar dataKey="uptime" radius={[4, 4, 0, 0]}>
                  {uptimeStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.uptime >= 95
                          ? '#22c55e'
                          : entry.uptime >= 80
                          ? '#eab308'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Uptime Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-green-500 rounded" aria-hidden="true" />
              <span className="text-gray-600">95%+ (Reliable)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-yellow-500 rounded" aria-hidden="true" />
              <span className="text-gray-600">80-95% (Intermittent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded" aria-hidden="true" />
              <span className="text-gray-600">&lt;80% (Unreliable)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WaterLevelChart
