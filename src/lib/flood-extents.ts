/**
 * Council flood-extent maps: the area expected to be under water when a gauge reaches a given
 * height. These are planning maps from council flood studies, not live observations.
 *
 * Every service below was checked on 24 Oct 2026: `<MapServer>?f=json` reports
 * `singleFusedMapCache: true` with a standard Web Mercator (EPSG:3857) tile scheme, and
 * `<MapServer>/tile/{z}/{y}/{x}` returns a 256 px PNG with flood pixels over the town at z14
 * (flooded area grows with each level). They are tile caches, so plain Leaflet tile layers work.
 *
 * Terms: no open licence is stated on any of these. Rockhampton's items carry a no-warranty
 * disclaimer ("Rockhampton Regional Council will not be held liable ... nor does it warrant that
 * the data is error free"), credit "Rockhampton Regional Council". The North Burnett and Bundaberg
 * layers are hosted by QIT Plus (the councils' dashboard vendor) with no licence or credits text.
 */

import type { FloodExtentSet } from './types'

const tiles = (mapServer: string) => `${mapServer}/tile/{z}/{y}/{x}`

const RRC = 'https://tiles-ap1.arcgis.com/hx2J5p82likyGt5G/arcgis/rest/services'
const QIT = 'https://services7.arcgis.com/si70weKpzPSa0BGV/arcgis/rest/services'
const QIT_TILES = 'https://tiles.arcgis.com/tiles/si70weKpzPSa0BGV/arcgis/rest/services'

export const FLOOD_EXTENT_SETS: FloodExtentSet[] = [
  {
    id: 'rockhampton',
    town: 'Rockhampton',
    river: 'Fitzroy River',
    // The layers say "gauge heights are taken from the Quay Street gauge" (BoM's Rockhampton flood gauge).
    // No gaugeId: GAUGE's 130005A is WMIP "Fitzroy River at The Gap", ~45 km upstream, a different datum.
    gaugeName: 'Fitzroy River at Rockhampton (Quay Street)',
    council: 'Rockhampton Regional Council',
    center: [-23.378, 150.513],
    zoom: 13,
    levels: [
      { level: 7, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_7m/MapServer`) },
      { level: 7.5, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_7_5m/MapServer`) },
      { level: 8, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_8_0m/MapServer`) },
      { level: 8.5, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_8_5m/MapServer`) },
      { level: 9, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_9_0m/MapServer`) },
      { level: 9.5, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_9_5m/MapServer`) },
      { level: 10, tileUrl: tiles(`${RRC}/RRC_Possible_Flood_Area_10m/MapServer`) },
    ],
    sourceUrl: 'https://emergency.rockhamptonregion.qld.gov.au/',
  },
  {
    id: 'gayndah',
    town: 'Gayndah',
    river: 'Burnett River',
    gaugeName: 'Burnett River at Gayndah',
    // WMIP "Burnett River at Gayndah Flume" (in the mapped area). Same height scale as these maps:
    // its recorded Jan 2013 peak was 19.3 m. The council layers don't name their gauge.
    gaugeId: '136017B',
    council: 'North Burnett Regional Council',
    center: [-25.627, 151.61],
    zoom: 14,
    levels: [
      { level: 14, tileUrl: tiles(`${QIT}/NBRC_Gayndah_14m/MapServer`) },
      { level: 15, tileUrl: tiles(`${QIT}/NBRC_Gayndah_15m/MapServer`) },
      { level: 16, tileUrl: tiles(`${QIT}/NBRC_Gayndah_16m/MapServer`) },
      { level: 17, tileUrl: tiles(`${QIT}/NBRC_Gayndah_17m/MapServer`) },
      { level: 18, tileUrl: tiles(`${QIT}/NBRC_Gayndah_18m/MapServer`) },
      { level: 19, tileUrl: tiles(`${QIT}/NBRC_Gayndah_19m/MapServer`) },
      { level: 20, tileUrl: tiles(`${QIT}/NBRC_Gayndah_20m/MapServer`) },
      // 21 m only exists on the tiles.arcgis.com host (services7 answers "Invalid URL")
      { level: 21, tileUrl: tiles(`${QIT_TILES}/NBRC_Gayndah_21m/MapServer`) },
    ],
    sourceUrl: 'https://emergency.northburnett.qld.gov.au/',
  },
  {
    id: 'mundubbera',
    town: 'Mundubbera',
    river: 'Burnett River',
    // No gaugeId: GAUGE's nearby 136004A is "Burnett River at Jones Weir Headwater" (the weir pool), not the town gauge
    gaugeName: 'Burnett River at Mundubbera',
    council: 'North Burnett Regional Council',
    center: [-25.592, 151.302],
    zoom: 14,
    levels: [18, 19, 20, 21, 22, 23, 24, 25].map(level => ({
      level,
      tileUrl: tiles(`${QIT}/NBRC_Mundubbera_${level}m/MapServer`),
    })),
    sourceUrl: 'https://emergency.northburnett.qld.gov.au/',
  },
  {
    id: 'monto',
    town: 'Monto',
    river: 'Three Moon Creek',
    gaugeName: 'Three Moon Creek at Monto',
    council: 'North Burnett Regional Council',
    center: [-24.863, 151.122],
    zoom: 14,
    // The services are named by water elevation (NBRC_Monto_226_5m ... 233_5m, m AHD); the council
    // dashboard labels them as 3 m ... 10 m flood levels, i.e. gauge height = AHD - 223.5 m.
    levels: [3, 4, 5, 6, 7, 8, 9, 10].map(level => ({
      level,
      tileUrl: tiles(`${QIT}/NBRC_Monto_${level + 223}_5m/MapServer`),
    })),
    sourceUrl: 'https://emergency.northburnett.qld.gov.au/',
  },
  {
    id: 'bundaberg',
    town: 'Bundaberg',
    river: 'Burnett River',
    // No gaugeId: GAUGE's 136001A is marked isOffline (and WMIP names that id "Burnett River at Walla")
    gaugeName: 'Burnett River at Bundaberg',
    council: 'Bundaberg Regional Council',
    center: [-24.866, 152.348],
    zoom: 13,
    levels: [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5].map(level => ({
      level,
      tileUrl: tiles(`${QIT_TILES}/Bundaberg_RC_FE_${level.toFixed(2).replace('.', '_')}m/MapServer`),
    })),
    sourceUrl: 'https://disaster.bundaberg.qld.gov.au/',
  },
]

/**
 * Leaflet TileLayer options per set id. The caches only hold some zoom levels: request outside
 * min/maxNativeZoom and the tiles 404, so pass these through (Leaflet scales the nearest level).
 * Ranges are the intersection across each set's levels; bounds are the union of their extents.
 */
export const FLOOD_EXTENT_TILE_OPTIONS: Record<
  string,
  { minNativeZoom: number; maxNativeZoom: number; bounds: [[number, number], [number, number]]; attribution: string }
> = {
  rockhampton: {
    minNativeZoom: 10,
    maxNativeZoom: 19,
    bounds: [[-23.5, 150.375], [-23.268, 150.677]],
    attribution: 'Flood extents &copy; Rockhampton Regional Council',
  },
  gayndah: {
    minNativeZoom: 9,
    maxNativeZoom: 17,
    bounds: [[-25.647, 151.495], [-25.567, 151.656]],
    attribution: 'Flood extents: North Burnett Regional Council',
  },
  mundubbera: {
    minNativeZoom: 9,
    maxNativeZoom: 17,
    bounds: [[-25.685, 151.206], [-25.571, 151.358]],
    attribution: 'Flood extents: North Burnett Regional Council',
  },
  monto: {
    minNativeZoom: 9,
    maxNativeZoom: 18,
    bounds: [[-24.908, 151.091], [-24.816, 151.148]],
    attribution: 'Flood extents: North Burnett Regional Council',
  },
  bundaberg: {
    minNativeZoom: 7,
    maxNativeZoom: 18,
    bounds: [[-25.361, 151.906], [-24.673, 152.433]],
    attribution: 'Flood extents: Bundaberg Regional Council',
  },
}
