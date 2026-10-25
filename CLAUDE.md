# Claude Code Agent Context - GAUGE Queensland Flood Tracking

This document provides context for AI agents working on this codebase. It documents project nuances, common pitfalls, and important patterns.

## Project Overview

GAUGE is a Queensland flood monitoring dashboard deployed at `https://gauge.clermont.digital`. It fetches water level data from government APIs (WMIP, BOM) and displays it on an interactive map with historical charts.

**Tech Stack:**
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS
- Firestore for caching
- Cloud Run (Singapore region: `asia-southeast1`)
- Cloud Scheduler for cron jobs

## Deployment

**CRITICAL:** The project deploys to **Singapore (`asia-southeast1`)**, NOT Australia.

```bash
# Build (image goes to the Sydney Artifact Registry repo `gauge`, tagged latest + BUILD_ID)
gcloud builds submit --config=cloudbuild.yaml --region=australia-southeast1 \
  --substitutions=_MAPBOX_TOKEN=<public Mapbox token> --project=clermontdigital-1741262269603

# Deploy that build (runtime identity + secrets from Secret Manager)
gcloud run deploy gauge-dashboard --region=asia-southeast1 --project=clermontdigital-1741262269603 \
  --image=australia-southeast1-docker.pkg.dev/clermontdigital-1741262269603/gauge/gauge-dashboard:<BUILD_ID> \
  --service-account=gauge-run@clermontdigital-1741262269603.iam.gserviceaccount.com \
  --set-secrets=QLDTRAFFIC_API_KEY=gauge-qldtraffic-api-key:latest,CRON_SECRET=gauge-cron-secret:latest,CAMERA_UPLOAD_KEY=gauge-camera-upload-key:latest \
  --allow-unauthenticated --timeout=300

# Then run the cron once so Firestore is refreshed by the new code
gcloud scheduler jobs run gauge-fetch-water-data-prod --location=asia-southeast1 --project=clermontdigital-1741262269603
```

Cloud Run stays in Singapore because Cloud Run domain mapping isn't available in Sydney (Firestore is in australia-southeast1).

**Service name:** `gauge-dashboard` (not `gauge`)

## Data Sources

### WMIP (Queensland Water Monitoring)
- Base URL: `https://water-monitoring.information.qld.gov.au/cgi/webservice.exe`
- Slow API: 2-5 seconds per request
- No authentication required
- Rate limiting exists but not well documented
- Multi-site requests work (batches of ~40 sites per `get_ts_traces` call); WMIP returns HTTP 408 if several large requests arrive at once, so send batches one at a time
- Use `data_type: 'point'` for current levels — `mean`/`hour` returns synthetic hourly buckets that lag 1–2 hours
- Many historic station IDs are closed (archive datasource `A` only). `GAUGE_ID_ALIASES` in constants.ts maps retired IDs to their replacements; `resolveGaugeId()` is used by `/gauge/[id]`

### Gauge Reporting Intervals
**CRITICAL:** Not all gauges report at the same frequency!
- Most gauges: Every 15 minutes (96 readings/day)
- Some gauges: Hourly (24 readings/day) - e.g., Sandy Creek @ Clermont
- The uptime tracking currently assumes 96 readings/day, causing hourly gauges to show ~25% uptime even when functioning perfectly

### Flood Status Model
`FloodStatus` (src/lib/types.ts): `safe` = below minor (also used when a gauge has no flood thresholds), `watch` = minor, `warning` = moderate, `danger` = major. `/api/water-levels` recomputes status from the level on every response, so statuses stored by older cron versions can't leak through. Labels/colours: `STATUS_LABELS` / `STATUS_COLORS` in constants.ts and `statusConfig` in StatusBadge.tsx.

Official flood levels live in `src/lib/flood-thresholds.ts` (one entry per gauge, citing the BOM station). Only add an entry after checking the BOM station page (`bom.gov.au/fwo/IDQ653xx/IDQ653xx.<BOM id>.tbl.shtml`): its classification, and that BOM's latest height matches our WMIP reading (same gauge zero). BOM station numbers are easy to get wrong; BOM's basin tables (`/cgi-bin/wrap_fwo.pl?IDQ60285.html` … `IDQ60296`) list every Queensland station and its page. Several older gauge entries in `GAUGE_STATIONS` (mostly offline ones) carry IDs that belong to other WMIP sites, so check names against WMIP before relying on them.

### SEO
Gauge, camera and home pages are rendered per request (`dynamic = 'force-dynamic'`) with the latest readings from Firestore (`src/lib/initial-data.ts`, shared response builder in `src/lib/water-levels.ts`), passed to DashboardClient as SWR `fallbackData`, so the first paint and Google see real content. Anything rendered from that data must be identical on server and client; relative times ("5 min ago") use `suppressHydrationWarning`. Titles/descriptions come from `src/lib/seo.ts` (never put a current level or status in them; Google keeps them for days). `sitemap.ts` lists home + online gauges; offline gauges and unlisted cameras are noindex. Don't describe the data as "real-time" or "live".

### Data Types
```typescript
// Key interfaces in src/lib/types.ts
GaugeStation    // Static gauge metadata (name, location, thresholds)
GaugeData       // Runtime gauge data (level, trend, status)
DailyUptimeStat // Uptime tracking per day
```

## File Structure Patterns

```
src/
├── app/
│   ├── page.tsx              # Main dashboard (just imports DashboardClient)
│   ├── gauge/[id]/
│   │   ├── page.tsx          # Server component with generateMetadata for OG
│   │   └── DashboardClient.tsx  # Shared dashboard component
│   └── api/
│       ├── cron/
│       │   ├── fetch-water-data/  # Main data fetcher (runs every 2 min)
│       │   └── backfill-uptime/   # One-time historical uptime backfill
│       ├── water-levels/     # Returns cached gauge data
│       └── uptime/[id]/      # Returns gauge uptime stats
├── components/dashboard/
│   ├── FloodMap.tsx          # Leaflet map (client-side only)
│   ├── WaterLevelChart.tsx   # Recharts chart (includes uptime bars)
│   └── ...
└── lib/
    ├── constants.ts          # GAUGE_STATIONS array (111 gauges)
    ├── firestore.ts          # Firestore helpers + uptime tracking
    ├── types.ts              # TypeScript interfaces
    └── utils.ts              # Helper functions
```

## Common Gotchas

### 1. Next.js Dynamic Routes with Brackets
When using git commands with `[id]` paths, quote them:
```bash
# Correct
git add "src/app/gauge/[id]/page.tsx"

# Wrong - will fail
git add src/app/gauge/[id]/page.tsx
```

### 2. useSearchParams Requires Suspense
Any component using `useSearchParams()` must be wrapped in `<Suspense>`. The DashboardClient handles this internally.

### 3. OpenGraph Metadata
- OG tags only work on server components
- The `/gauge/[id]/page.tsx` is a server component that renders `DashboardClient`
- Never redirect from a page that has generateMetadata - crawlers won't see the tags

### 4. Cron Authentication
Cron endpoints accept only the `x-cron-secret` header matching `CRON_SECRET` (constant-time compare,
`src/lib/cron-auth.ts`). The Cloud Scheduler job sends that header. User-Agent is not trusted.
Without `CRON_SECRET`, requests are allowed only in development.

### 7. Community Cameras
Hand-curated in `src/lib/community-cameras.ts` (`public` = on the map, `unlisted` = only via its
`/camera/<id>` link, `hidden` = nowhere). The latest picture per camera lives in Firestore
(`communityCameraImages/<id>`) and is uploaded with
`POST /api/cameras/<id>/upload` (JPEG body, `x-camera-key: CAMERA_UPLOAD_KEY`, optional `x-taken-at`).
Every camera, council or community, has a share link `/camera/<key>` whose link preview uses the
camera's latest picture.

### 5. Firestore Uptime Tracking
Two tracking methods with different baselines:
- **Backfill:** Uses raw WMIP data (~96 expected reports/day at 15-min intervals)
- **Ongoing:** Counts each cron run (~720 expected reports/day at 2-min intervals)

The percentage calculation normalizes these, but the raw numbers differ significantly.

### 6. Offline Gauges
Some gauges in `GAUGE_STATIONS` have `isOffline: true`. This was used to exclude gauges that stopped reporting. However, gauges can come back online - check actual data before marking offline.

## URL Structure

```
/                          # Main dashboard
/gauge/{id}                # Dashboard with gauge pre-selected + OG metadata
/gauge/{id}#map            # Scroll to map section
/gauge/{id}#details        # Scroll to gauge details
/gauge/{id}#history        # Scroll to 24-hour chart
/gauge/{id}#reliability    # Scroll to 7-day uptime chart
```

## Environment Variables

Required for production:
- `CRON_SECRET` - Authentication for cron endpoints
- `QLDTRAFFIC_API_KEY` - QLDTraffic road closures API

## Testing Locally

```bash
# Gympie and Richmond council dashboards send incomplete certificate chains; the Docker image
# sets NODE_EXTRA_CA_CERTS automatically, locally pass it yourself to include those councils
NODE_EXTRA_CA_CERTS=certs/council-intermediates.pem npm run dev
npm run dev          # Start dev server
npm run build        # Production build (pages render per request; nothing is pre-generated)
```

## Key Decisions Made

1. **No redirect from /gauge/[id]** - Renders full dashboard to preserve OG tags for social sharing

2. **Shared DashboardClient component** - Both `/` and `/gauge/[id]` use the same component with optional `initialGaugeId` prop

3. **URL updates to /gauge/{id}** - When selecting a gauge, URL changes for shareable links

4. **LocalStorage for persistence** - Last selected gauge is remembered

5. **15-minute expected interval** - Uptime assumes most gauges report every 15 minutes (known limitation for hourly gauges)

## Future Improvements Needed

1. **Per-gauge reporting interval** - Add `reportingIntervalMinutes` to GaugeStation to fix uptime accuracy for hourly gauges

2. **Toast notifications** - Replace `alert()` in share/bookmark buttons with toasts

3. **Date timezone handling** - Chart X-axis dates may show wrong day due to UTC vs AEST parsing

## Useful Commands

```bash
# Run uptime backfill manually (needs the cron secret)
curl -X POST "https://gauge.clermont.digital/api/cron/backfill-uptime" \
  -H "x-cron-secret: $(gcloud secrets versions access latest --secret=gauge-cron-secret --project=clermontdigital-1741262269603)"

# Check deployed services
gcloud run services list --project clermontdigital-1741262269603

# View logs
gcloud run services logs read gauge-dashboard --region asia-southeast1 --project clermontdigital-1741262269603
```

## Contact

Project by [Clermont Digital](https://clermontdigital.com.au)
