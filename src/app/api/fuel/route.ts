import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/http'
import type { FuelResponse, FuelSite, FuelSiteStatus } from '@/lib/types'

// Fetched on demand and cached in memory; don't prerender (that would hit the layer at build time)
export const dynamic = 'force-dynamic'

// Statewide fuel availability and prices: the "Fuel Status" layer QIT Plus publishes for council
// disaster dashboards (~1,800 sites). Prices come from the Queensland Government Fuel Prices API
// (CC BY 4.0, per the dashboards' attribution); availability is flagged by the vendor and is
// described on the dashboards as a trial. No public page describes the layer, so sourceUrl is its
// ArcGIS item page.

const LAYER_URL = 'https://services7.arcgis.com/si70weKpzPSa0BGV/arcgis/rest/services/fuel_sites_qld/FeatureServer/0'
const SOURCE_URL = 'https://www.arcgis.com/home/item.html?id=c1f5eb5417194cdc83c26344236cd66e'

const FETCH_TIMEOUT_MS = 15_000
const CACHE_TTL_MS = 10 * 60 * 1000
const RETRY_TTL_MS = 60 * 1000
const MAX_PAGES = 10
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' }

// [layer field, label]; each has a matching `${field}_Price` field ("$2.359")
const FUEL_FIELDS: [string, string][] = [
  ['E10', 'E10'],
  ['Unleaded_91', 'Unleaded 91'],
  ['Premium_95', 'Premium 95'],
  ['Premium_98', 'Premium 98'],
  ['Diesel', 'Diesel'],
  ['Premium_Diesel', 'Premium Diesel'],
  ['E85', 'E85'],
  ['LPG', 'LPG'],
  ['AdBlue', 'AdBlue'],
  ['JetA1', 'Jet A-1'],
  ['AvGas', 'Avgas'],
]

const OUT_FIELDS = [
  'ObjectId',
  'Site_Id',
  'Service_Station_Name',
  'Brand_Name',
  'Location',
  'Outage_Type',
  'Information_Last_Updated',
  ...FUEL_FIELDS.flatMap(([field]) => [field, `${field}_Price`]),
].join(',')

interface ArcGisFeature {
  attributes: Record<string, unknown>
  geometry?: { x?: number; y?: number } | null
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[]
  exceededTransferLimit?: boolean
  error?: { code?: number; message?: string }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: 'no-store' })
  if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}`)
  return (await res.json()) as T
}

/** All features, paging past the layer's maxRecordCount (2,000) */
async function queryAllFeatures(): Promise<ArcGisFeature[]> {
  const features: ArcGisFeature[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      f: 'json',
      where: '1=1',
      outFields: OUT_FIELDS,
      outSR: '4326',
      orderByFields: 'ObjectId',
      resultOffset: String(features.length),
    })
    const body = await fetchJson<ArcGisQueryResponse>(`${LAYER_URL}/query?${params}`)
    if (body.error) throw new Error(`ArcGIS error ${body.error.code ?? ''}: ${body.error.message ?? 'unknown'}`)
    const batch = body.features ?? []
    features.push(...batch)
    if (!body.exceededTransferLimit || batch.length === 0) return features
  }
  return features
}

/** When the layer's data was last edited (the dashboards show this as "Information Last Checked") */
async function fetchLastEdit(): Promise<number | null> {
  try {
    const meta = await fetchJson<{ editingInfo?: { dataLastEditDate?: number; lastEditDate?: number } }>(
      `${LAYER_URL}?f=json`,
    )
    const t = meta.editingInfo?.dataLastEditDate ?? meta.editingInfo?.lastEditDate
    return typeof t === 'number' && Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5

function parsePrice(value: unknown): number | null {
  const n = Number(str(value).replace(/[$,\s]/g, ''))
  return str(value) && Number.isFinite(n) && n > 0 ? n : null
}

function parseAvailability(value: string): boolean | null {
  if (/^unavailable$|^not available$/i.test(value)) return false
  if (/^available$/i.test(value)) return true
  return null
}

function siteStatus(outageType: string, fuels: FuelSite['fuels']): FuelSiteStatus {
  // Outage_Type: "Fuel Available" | "Fuel Partially Available" | "Fuel Unavailable" | "Fuel Unknown"
  if (/partial/i.test(outageType)) return 'partial'
  if (/unavailable/i.test(outageType)) return 'unavailable'
  if (/available/i.test(outageType)) return 'available'
  if (/unknown/i.test(outageType)) return 'unknown'
  // No recognised Outage_Type: derive from the per-fuel flags
  const known = fuels.filter(f => f.available !== null)
  if (known.length === 0) return 'unknown'
  if (known.every(f => f.available)) return 'available'
  if (known.every(f => !f.available)) return 'unavailable'
  return 'partial'
}

function parseSite(f: ArcGisFeature): FuelSite | null {
  const a = f.attributes ?? {}
  const x = f.geometry?.x
  const y = f.geometry?.y
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null

  const fuels: FuelSite['fuels'] = []
  for (const [field, type] of FUEL_FIELDS) {
    const flag = str(a[field])
    const price = parsePrice(a[`${field}_Price`])
    if (!flag && price === null) continue // not sold here
    fuels.push({ type, available: flag ? parseAvailability(flag) : null, price })
  }

  const brand = str(a.Brand_Name)
  const address = str(a.Location)
  const updated = a.Information_Last_Updated
  return {
    id: str(a.Site_Id) || `obj-${str(a.ObjectId)}`,
    name: str(a.Service_Station_Name) || brand || 'Service station',
    ...(brand ? { brand } : {}),
    ...(address ? { address } : {}),
    lat: round5(y),
    lng: round5(x),
    status: siteStatus(str(a.Outage_Type), fuels),
    fuels,
    ...(typeof updated === 'number' && Number.isFinite(updated) ? { lastUpdated: new Date(updated).toISOString() } : {}),
  }
}

let cached: { data: FuelResponse; fetchedAt: number; ttl: number } | null = null
let lastGood: FuelResponse | null = null
let inFlight: Promise<FuelResponse> | null = null

async function load(): Promise<FuelResponse> {
  const [features, lastEdit] = await Promise.all([queryAllFeatures(), fetchLastEdit()])
  const sites = features.map(parseSite).filter((s): s is FuelSite => s !== null)
  if (sites.length === 0) throw new Error('Fuel layer returned no sites')
  return {
    sites,
    lastUpdated: new Date(lastEdit ?? Date.now()).toISOString(),
    sourceUrl: SOURCE_URL,
  }
}

async function getFuel(): Promise<FuelResponse> {
  if (cached && Date.now() - cached.fetchedAt < cached.ttl) return cached.data
  if (!inFlight) {
    inFlight = load()
      .then(data => {
        lastGood = data
        cached = { data, fetchedAt: Date.now(), ttl: CACHE_TTL_MS }
        return data
      })
      .catch(error => {
        console.error('[Fuel API] Fetch failed:', error)
        if (!lastGood) throw error
        // Keep serving the last good data; try again in a minute
        cached = { data: lastGood, fetchedAt: Date.now(), ttl: RETRY_TTL_MS }
        return lastGood
      })
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}

export async function GET(request: Request) {
  try {
    const data = await getFuel()
    return jsonResponse(request, data, { headers: CACHE_HEADERS })
  } catch {
    return jsonResponse(request, 
      { sites: [], lastUpdated: new Date().toISOString(), sourceUrl: SOURCE_URL } satisfies FuelResponse,
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
