/**
 * River and town pages: which ones exist, and where their official information lives.
 */

import { GAUGE_STATIONS, RIVER_SYSTEM_NAMES } from './constants'
import type { RiverSystem } from './types'

// BOM river-height table covering each river system (bom.gov.au/cgi-bin/wrap_fwo.pl?IDQ602xx.html)
const BOM_BASIN_TABLES: Partial<Record<RiverSystem, string>> = {
  logan: 'IDQ60285', albert: 'IDQ60285', nerang: 'IDQ60285', coomera: 'IDQ60285',
  brisbane: 'IDQ60286', bremer: 'IDQ60286', lockyer: 'IDQ60286', northpine: 'IDQ60286',
  mooloolah: 'IDQ60287', mary: 'IDQ60287',
  burnett: 'IDQ60288', kolan: 'IDQ60288',
  clermont: 'IDQ60289', theresa: 'IDQ60289', wolfang: 'IDQ60289', douglas: 'IDQ60289', isaac: 'IDQ60289',
  nogoa: 'IDQ60289', mackenzie: 'IDQ60289', comet: 'IDQ60289', fitzroy: 'IDQ60289',
  pioneer: 'IDQ60290', proserpine: 'IDQ60290', don: 'IDQ60290', burdekin: 'IDQ60290', ross: 'IDQ60290', broken: 'IDQ60290',
  herbert: 'IDQ60291', tully: 'IDQ60291', johnstone: 'IDQ60291', mulgrave: 'IDQ60291', barron: 'IDQ60291', daintree: 'IDQ60291',
  condamine: 'IDQ60293',
  warrego: 'IDQ60294', paroo: 'IDQ60294',
  cooper: 'IDQ60295', diamantina: 'IDQ60295',
  leichhardt: 'IDQ60296', flinders: 'IDQ60296', norman: 'IDQ60296', cloncurry: 'IDQ60296', mitchell: 'IDQ60296', normanby: 'IDQ60296',
}

export function bomBasinUrl(system: RiverSystem): string | null {
  const table = BOM_BASIN_TABLES[system]
  return table ? `https://www.bom.gov.au/cgi-bin/wrap_fwo.pl?${table}.html` : null
}

export function riverName(system: RiverSystem): string {
  return RIVER_SYSTEM_NAMES[system]
}

// Rivers with at least two reporting gauges get their own page at /river/<system>
export const RIVER_PAGES: RiverSystem[] = (Object.keys(RIVER_SYSTEM_NAMES) as RiverSystem[])
  .filter((system) => GAUGE_STATIONS.filter((g) => g.riverSystem === system && !g.isOffline).length >= 2)
  .sort((a, b) => riverName(a).localeCompare(riverName(b)))

export function hasRiverPage(system: RiverSystem): boolean {
  return RIVER_PAGES.includes(system)
}

export interface TownPage {
  slug: string
  name: string
  lat: number
  lng: number
  gaugeRadiusKm: number
  cameraRadiusKm: number
  council: string
  councilUrl: string
}

// Town pages at /town/<slug>. Add towns only where people search for them; thin pages hurt the site.
export const TOWN_PAGES: TownPage[] = [
  {
    slug: 'clermont',
    name: 'Clermont',
    lat: -22.8245,
    lng: 147.6392,
    gaugeRadiusKm: 60,
    cameraRadiusKm: 45,
    council: 'Isaac Regional Council',
    councilUrl: 'https://www.isaac.qld.gov.au/disaster',
  },
]
