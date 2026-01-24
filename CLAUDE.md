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
# Correct deployment command
gcloud run deploy gauge-dashboard --source . --region asia-southeast1 --project clermontdigital-1741262269603 --allow-unauthenticated --timeout=300
```

**Service name:** `gauge-dashboard` (not `gauge`)

## Data Sources

### WMIP (Queensland Water Monitoring)
- Base URL: `https://water-monitoring.information.qld.gov.au/cgi/webservice.exe`
- Slow API: 2-5 seconds per request
- No authentication required
- Rate limiting exists but not well documented
- **Key gotcha:** Multi-site batching doesn't work - must fetch gauges individually

### Gauge Reporting Intervals
**CRITICAL:** Not all gauges report at the same frequency!
- Most gauges: Every 15 minutes (96 readings/day)
- Some gauges: Hourly (24 readings/day) - e.g., Sandy Creek @ Clermont
- The uptime tracking currently assumes 96 readings/day, causing hourly gauges to show ~25% uptime even when functioning perfectly

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
Cron endpoints accept:
- `x-cron-secret` header matching `CRON_SECRET` env var
- `User-Agent: Google-Cloud-Scheduler`
- No auth in development mode

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
npm run dev          # Start dev server
npm run build        # Production build (generates static gauge pages)
```

## Key Decisions Made

1. **No redirect from /gauge/[id]** - Renders full dashboard to preserve OG tags for social sharing

2. **Shared DashboardClient component** - Both `/` and `/gauge/[id]` use the same component with optional `initialGaugeId` prop

3. **URL updates to /gauge/{id}** - When selecting a gauge, URL changes for shareable links

4. **LocalStorage for persistence** - Last selected gauge is remembered

5. **15-minute expected interval** - Uptime assumes most gauges report every 15 minutes (known limitation for hourly gauges)

## Future Improvements Needed

1. **Per-gauge reporting interval** - Add `reportingIntervalMinutes` to GaugeStation to fix uptime accuracy for hourly gauges

2. **Better OG image** - Current logo is 120x40px; should be 1200x630px for social previews

3. **Toast notifications** - Replace `alert()` in share/bookmark buttons with toasts

4. **Date timezone handling** - Chart X-axis dates may show wrong day due to UTC vs AEST parsing

## Useful Commands

```bash
# Run uptime backfill manually
curl -X POST "https://gauge.clermont.digital/api/cron/backfill-uptime" \
  -H "User-Agent: Google-Cloud-Scheduler"

# Check deployed services
gcloud run services list --project clermontdigital-1741262269603

# View logs
gcloud run services logs read gauge-dashboard --region asia-southeast1 --project clermontdigital-1741262269603
```

## Contact

Project by [Clermont Digital](https://clermontdigital.com.au)
