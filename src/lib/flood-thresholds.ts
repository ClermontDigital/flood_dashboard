import type { FloodThresholds } from './types'

// Official Bureau of Meteorology flood classification levels (minor / moderate / major, metres).
// Verified 25 Oct 2026 against each BOM station page (bom.gov.au/fwo/IDQ653xx/IDQ653xx.<BOM id>.tbl.shtml):
// the classification matches, and BOM's latest height matches the WMIP reading, so both share the
// same gauge zero. Gauges without a published classification, whose BOM levels belong to a
// different physical gauge, or with no live BOM station to check against are deliberately left
// out (no guessing).
// Refresh when BOM publishes a new Service Level Specification (roughly yearly).
export const OFFICIAL_FLOOD_THRESHOLDS: Record<string, FloodThresholds> = {
  '003103A': { minor: 3, moderate: 6, major: 9 }, // Cooper Creek @ Nappa Merrie (BOM 545002)
  '003202A': { minor: 3.3, moderate: 4.3, major: 5.3 }, // Thomson River @ Longreach (BOM 036161)
  '003303A': { minor: 2.9, moderate: 4.9, major: 5.9 }, // Barcoo River @ Blackall (BOM 536003)
  '108002A': { minor: 8, moderate: 10, major: 12 }, // Daintree River @ Bairds (BOM 531029)
  '110001D': { minor: 5, moderate: 8.5, major: 10 }, // Barron River @ Myola (BOM 531040)
  '111005A': { minor: 2.5, moderate: 5, major: 7 }, // Mulgrave River @ The Fisheries (BOM 531076)
  '111007A': { minor: 5, moderate: 7, major: 8 }, // Mulgrave River @ Gordonvale (BOM 531052)
  '112004A': { minor: 7, moderate: 8, major: 8.5 }, // North Johnstone @ Tung Oil (BOM 032166)
  '113006A': { minor: 6, moderate: 8, major: 9 }, // Tully River @ Euramo (BOM 532059)
  '116001F': { minor: 10, moderate: 11, major: 12 }, // Herbert River @ Ingham (BOM 032171)
  '116006B': { minor: 5.5, moderate: 8.5, major: 12.5 }, // Herbert River @ Abergowrie (BOM 032174)
  '119003A': { minor: 5, moderate: 6, major: 8 }, // Haughton River @ Powerline (BOM 533056)
  '120002D': { minor: 12, moderate: 14, major: 15 }, // Burdekin River @ Sellheim (BOM 533075)
  '120006B': { minor: 9, moderate: 13, major: 17 }, // Burdekin River @ Clare (BOM 033286)
  '121001A': { minor: 2.5, moderate: 4, major: 5.5 }, // Don River @ Ida Creek (BOM 033265)
  '130005A': { minor: 10, moderate: 14, major: 16 }, // Fitzroy River @ Rockhampton (BOM 033285)
  '130105B': { minor: 7.5, moderate: 9.5, major: 16.5 }, // Mackenzie River @ Coolmaringa (BOM 535163)
  '130106A': { minor: 9.5, moderate: 12.5, major: 15.5 }, // Mackenzie River @ Bingegang (BOM 035295)
  '130206A': { minor: 9, moderate: 9.5, major: 10 }, // Theresa Creek @ Gregory Hwy (BOM 535098)
  '130207A': { minor: 4, moderate: 5, major: 6 }, // Sandy Creek @ Clermont (BOM 535028)
  '130209A': { minor: 9, moderate: 12, major: 14 }, // Nogoa River @ Craigmore (BOM 035251)
  '130210A': { minor: 8, moderate: 8.5, major: 9 }, // Theresa Creek @ Valeria (BOM 035187)
  '130403A': { minor: 9, moderate: 10.5, major: 15.5 }, // Connors River @ Mount Bridget (BOM 533091)
  '130404A': { minor: 6.5, moderate: 9, major: 14.5 }, // Connors River @ Pink Lagoon (BOM 534004)
  '130410A': { minor: 7, moderate: 9, major: 11 }, // Isaac River @ Deverill (BOM 534003)
  '130504B': { minor: 6.5, moderate: 7.5, major: 8 }, // Comet River @ Comet Weir (BOM 535094)
  '130506A': { minor: 10, moderate: 11, major: 12 }, // Comet River @ The Lake (BOM 535010)
  '136002D': { minor: 5, moderate: 6, major: 8 }, // Burnett River @ Mount Lawless (BOM 539151)
  '136004A': { minor: 111.5, moderate: 115, major: 121 }, // Burnett River @ Jones Weir (BOM 539066)
  '136017B': { minor: 5.5, moderate: 8.5, major: 15.5 }, // Burnett River @ Gayndah (BOM 539191)
  '136101C': { minor: 5, moderate: 6, major: 8 }, // Three Moon Creek @ Abercorn (BOM 039319)
  '136103B': { minor: 5.5, moderate: 6.5, major: 8.5 }, // Burnett River @ Ceratodus (BOM 539183)
  '136106A': { minor: 4, moderate: 7.5, major: 10 }, // Burnett River @ Eidsvold (BOM 539189)
  '136207A': { minor: 6.5, moderate: 8.5, major: 9.5 }, // Barambah Creek @ Ban Ban (BOM 040827)
  '136315A': { minor: 4, moderate: 5, major: 6 }, // Boyne River @ Carters (BOM 540056)
  '138001A': { minor: 7.5, moderate: 9.5, major: 15.5 }, // Mary River @ Miva (BOM 040826)
  '138110A': { minor: 5.55, moderate: 8.05, major: 11.1 }, // Mary River @ Bellbird Creek (BOM 540332)
  '141006A': { minor: 5.33, moderate: 5.76, major: 6.26 }, // Mooloolah River @ Mooloolah (BOM 540345)
  '143001C': { minor: 9, moderate: 16, major: 21 }, // Brisbane River @ Savages Crossing (BOM 540150)
  '143007A': { minor: 2, moderate: 5.5, major: 6.5 }, // Brisbane River @ Linville (BOM 540261)
  '143107A': { minor: 5, moderate: 6.5, major: 8.5 }, // Bremer River @ Walloon (BOM 540504)
  '143108A': { minor: 4.5, moderate: 6.5, major: 7.5 }, // Warrill Creek @ Amberley (BOM 040816)
  '143113A': { minor: 5, moderate: 6.5, major: 8 }, // Purga Creek @ Loamside (BOM 540062)
  '143203C': { minor: 4, moderate: 6.5, major: 8 }, // Lockyer Creek @ Helidon (BOM 540143)
  '143212A': { minor: 4.5, moderate: 5, major: 6.5 }, // Tenthill Creek @ Tenthill (BOM 540152)
  '145008A': { minor: 9.5, moderate: 12, major: 14 }, // Logan River @ Round Mountain (BOM 040945)
  '145010A': { minor: 3, moderate: 5, major: 6 }, // Running Creek @ Dieckmans Bridge (BOM 040943)
  '145011A': { minor: 3, moderate: 4.5, major: 6 }, // Teviot Brook @ Croftby (BOM 040947)
  '146010A': { minor: 5, moderate: 6, major: 7 }, // Coomera River @ Army Camp (BOM 540290)
  '422308C': { minor: 6, moderate: 8, major: 10 }, // Condamine River @ Chinchilla (BOM 041517)
  '422310C': { minor: 4, moderate: 5, major: 6 }, // Condamine River @ Warwick (BOM 041503)
  '423202C': { minor: 6, moderate: 6.8, major: 7.5 }, // Warrego River @ Cunnamulla (BOM 544019)
  '424201A': { minor: 1.5, moderate: 2.5, major: 3.5 }, // Paroo River @ Caiwarro (BOM 544015)
  '913007B': { minor: 5, moderate: 6.5, major: 8 }, // Leichhardt River @ Floraville (BOM 529010)
  '915003A': { minor: 5, moderate: 5.3, major: 8 }, // Flinders River @ Walkers Bend (BOM 529007)
  '915008A': { minor: 4.5, moderate: 6, major: 8.2 }, // Flinders River @ Richmond (BOM 530009)
  '915203C': { minor: 3, moderate: 5, major: 7 }, // Cloncurry River @ Cloncurry (BOM 529011)
  '916001B': { minor: 9, moderate: 12, major: 15 }, // Norman River @ Glenore (BOM 529012)
}

export function getFloodThresholds(gaugeId: string): FloodThresholds | null {
  return OFFICIAL_FLOOD_THRESHOLDS[gaugeId] ?? null
}
