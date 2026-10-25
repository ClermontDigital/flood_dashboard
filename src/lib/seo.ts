/**
 * Search-friendly titles and descriptions, in the words people search with ("Theresa Creek height at
 * Valeria", "Isaac flood cameras"). Never include the current level or status: Google keeps titles
 * and descriptions for days, so a number there could be badly out of date during a flood. Flood
 * levels are fixed, so they're fine to include.
 */

import type { FloodCamera, FloodThresholds, GaugeStation } from './types'

export const SITE_URL = 'https://gauge.clermont.digital'
export const SITE_NAME = 'Gauge Flood Tracker'
export const HOME_TITLE = 'Gauge Flood Tracker: Queensland River Heights & Flood Cameras'
// Not "real-time": readings come from BOM and Queensland Government gauges, which report every 15-60 minutes
export const HOME_DESCRIPTION = 'Free map of Queensland river heights, flood levels, flood cameras and road closures, from BOM and Queensland Government gauges, checked every few minutes.'

// The layout's title template appends this to page titles
const BRAND_SUFFIX = ' | Gauge'
const MAX_TITLE = 60
const MAX_DESCRIPTION = 160

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bHwy\b/g, 'Highway'],
  [/\bRd\b/g, 'Road'],
  [/\bCk\b/g, 'Creek'],
  [/\bTW$/, '(tailwater)'],
  [/\bHW$/, '(headwater)'],
]

export function expandAbbreviations(text: string): string {
  return ABBREVIATIONS.reduce((out, [pattern, word]) => out.replace(pattern, word), text)
}

/** "Theresa Creek @ Valeria" -> { stream: "Theresa Creek", site: "Valeria" } */
export function gaugePlace(station: GaugeStation): { stream: string; site: string } {
  const at = station.name.indexOf('@')
  const site = at >= 0 ? station.name.slice(at + 1).trim() : station.name
  return { stream: expandAbbreviations(station.stream), site: expandAbbreviations(site) }
}

function metres(value: number): string {
  return `${Number(value.toFixed(2))} m`
}

/** Page title without the brand suffix (the layout template adds " | Gauge") */
export function gaugeTitle(station: GaugeStation, thresholds: FloodThresholds | null): string {
  const { stream, site } = gaugePlace(station)
  const base = `${stream} Height at ${site}`
  const withLevels = `${base} – Flood Levels`
  return thresholds && (withLevels + BRAND_SUFFIX).length <= MAX_TITLE ? withLevels : base
}

export function gaugeDescription(station: GaugeStation, thresholds: FloodThresholds | null): string {
  const { stream, site } = gaugePlace(station)
  const source = ' From BOM and Queensland Government gauges, checked every few minutes.'
  if (station.isOffline) {
    return `${stream} height at ${site}. This gauge has no current readings; see the BOM for the latest river heights.`
  }
  const main = thresholds
    ? `Latest ${stream} height at ${site}, rising or falling, and BOM flood levels: minor ${metres(thresholds.minor)}, moderate ${metres(thresholds.moderate)}, major ${metres(thresholds.major)}.`
    : `Latest ${stream} height at ${site}, whether it's rising or falling, and recent history.`
  return (main + source).length <= MAX_DESCRIPTION ? main + source : main
}

/** "Isaac Regional Council" -> "Isaac" */
function councilArea(source: string): string | null {
  const area = source.replace(/\s+(Regional|Shire|City)?\s*Council$/i, '').trim()
  return area && area !== source ? area : null
}

/** Full title for a camera page (returned as an absolute title, so it can drop the brand when long) */
export function cameraTitle(camera: FloodCamera): string {
  const name = expandAbbreviations(camera.description)
  const area = camera.kind === 'community' ? null : councilArea(camera.source)
  const base = `${name} Flood Camera${area ? `, ${area}` : ''}`
  if ((base + BRAND_SUFFIX).length <= MAX_TITLE) return base + BRAND_SUFFIX
  // Long names: drop a trailing direction ("Upstream", "- North"), then the brand
  const shorter = base.replace(/\s*[-–]\s*(North|South|East|West|Upstream|Downstream)\b/i, '')
  return (shorter + BRAND_SUFFIX).length <= MAX_TITLE ? shorter + BRAND_SUFFIX : shorter
}

/** Search description for a camera page (no picture time: Google would show it for days) */
export function cameraDescription(camera: FloodCamera): string {
  const name = expandAbbreviations(camera.description)
  if (camera.kind === 'community') {
    return [`Latest picture from the ${name} flood camera, beside nearby river heights on one free map.`, camera.donor ? `Camera courtesy of ${camera.donor}.` : null]
      .filter(Boolean)
      .join(' ')
  }
  const main = `Latest picture from the ${name} flood camera, run by ${camera.source}`
  const extra = ', with nearby river heights and road closures on one free map.'
  return (main + extra).length <= MAX_DESCRIPTION ? main + extra : `${main}.`
}
