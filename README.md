# GAUGE - Queensland Flood Tracking Dashboard

A project by **[Clermont Digital](https://clermontdigital.com.au)**.

Real-time water level monitoring and flood warning dashboard covering all of Queensland, from the Gold Coast to Cape York, including Brisbane, Townsville, Cairns, Mackay, Rockhampton, and remote Western Queensland.

## Approach & Architecture

GAUGE is designed with rural Queensland communities in mind, where reliable internet connectivity cannot be guaranteed and users need quick, actionable flood information.

### Design Principles

1. **Clarity over complexity** - Status levels use plain language (SAFE, WATCH, WARNING, DANGER) with color-coded visual indicators. No technical jargon.

2. **Map-first interface** - The interactive map is the primary view, with satellite/hybrid imagery showing familiar landmarks. River overlays display real-time status at a glance.

3. **Progressive data loading** - Core gauge status loads first via SWR with auto-refresh. Historical charts and detailed data load on-demand when a gauge is selected.

4. **Offline resilience** - Data is cached client-side. When connectivity drops, users still see the last known readings with staleness indicators.

5. **Mobile-responsive** - Full functionality on phones, designed for users checking conditions from the field.

### Data Flow

```
                                    Cloud Scheduler (every 2 min)
                                             │
                                             ▼
Queensland WMIP API ──┐              ┌──────────────┐
                      ├──> Cron API ─>│  Firestore   │
BOM Water Data API ───┘              └──────────────┘
                                             │
                                             ▼
                              Next.js API Routes ──> SWR Cache ──> React UI
                                      │
                                      ├── Rate limiting
                                      ├── Input sanitization
                                      └── Direct fetch fallback
```

### Cloud Architecture

GAUGE uses **Firestore + Cloud Scheduler** for reliable data caching across Cloud Run instances:

- **Cloud Scheduler** triggers the `/api/cron/fetch-water-data` endpoint every 2 minutes
- **Firestore** stores the latest readings, shared across all Cloud Run instances
- **API routes** read from Firestore (fast) with fallback to direct WMIP/BOM fetch
- **Application Default Credentials (ADC)** handle authentication automatically on Cloud Run

### Key Components

- **FloodMap** - Leaflet map with gauge markers, river polylines, and address search
- **GaugeListSidebar** - Priority-sorted gauge list grouped by river system
- **WaterLevelChart** - 24-hour history with flood threshold lines
- **StatusBadge** - Consistent status display across the app

## Features

- **Real-time Water Levels**: Live data from 100+ gauge stations across Queensland
- **Discharge/Flow Rates**: Water flow data (ML/day or cumec) at gauge locations
- **Dam Storage Levels**: 30+ major dams including Wivenhoe, Burdekin Falls, Fairbairn
- **Rainfall Data**: Statewide aggregated rainfall with location-specific data when gauges selected
- **Road Closures**: Real-time flood-related road closures from QLD Traffic
- **Interactive Map**: Satellite/street/hybrid map views with status-coded markers
- **Address Search**: Search by address, town, river, or gauge name
- **Historical Charts**: 24-hour water level history with flood threshold indicators
- **Flood Warnings**: Real-time BOM flood warning integration
- **Rain Radar**: Live weather radar overlay from RainViewer
- **Mobile Responsive**: Fully functional on all device sizes
- **Offline-friendly**: Cached data for poor connectivity areas

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Data Fetching**: SWR with auto-refresh
- **Database**: Google Cloud Firestore
- **Hosting**: Google Cloud Run
- **Scheduling**: Google Cloud Scheduler

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/ClermontDigital/flood_dashboard.git
   cd flood_dashboard
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

See `.env.example` for all available configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_WMIP_BASE_URL` | Queensland WMIP API endpoint | Set |
| `NEXT_PUBLIC_BOM_WATERDATA_URL` | BOM Water Data API | Set |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | Enable mock data fallback | `true` (dev only) |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit per minute | `60` |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID for Firestore | Auto-detected on Cloud Run |
| `CRON_SECRET` | Secret for Cloud Scheduler auth | Optional |

## Data Sources

All data is sourced from official Australian Government APIs:

### Bureau of Meteorology (BOM) - Water Data Online
**URL**: [www.bom.gov.au/waterdata/](https://www.bom.gov.au/waterdata/)

The BOM SOS2 (Sensor Observation Service) API provides:

| Data Type | Parameter | Unit | Description |
|-----------|-----------|------|-------------|
| Water Level | `Water Course Level` | metres | Current water height at gauge |
| Discharge | `Water Course Discharge` | ML/d or cumec | Water flow rate |
| Dam Storage Volume | `Storage Volume` | ML | Total water stored |
| Dam Storage Level | `Storage Level` | metres | Dam water elevation |
| Rainfall | `Rainfall` | mm | Daily rainfall totals |

### Queensland WMIP (Water Monitoring Information Portal)
**URL**: [water-monitoring.information.qld.gov.au](https://water-monitoring.information.qld.gov.au/)

Queensland Government's water monitoring system, used as a fallback data source for water levels.

### BOM Flood Warnings
**URL**: [www.bom.gov.au/qld/flood/](https://www.bom.gov.au/qld/flood/)

Official flood warnings and alerts for Queensland catchments.

## Monitored Infrastructure

### River Systems (45+ Catchments)

**Southeast Queensland**
- Brisbane River, Bremer River, Lockyer Creek, North Pine River
- Logan River, Albert River, Nerang River, Coomera River
- Mooloolah River, Mary River

**Wide Bay-Burnett**
- Burnett River, Kolan River

**Central Queensland (Fitzroy Basin)**
- Sandy Creek (Clermont), Theresa Creek, Wolfang Creek, Douglas Creek
- Isaac River, Nogoa River, Mackenzie River, Comet River, Fitzroy River

**Mackay-Whitsunday**
- Pioneer River, Proserpine River, Broken River, Don River

**North Queensland**
- Burdekin River, Ross River, Herbert River

**Far North Queensland**
- Barron River, Mulgrave River, Johnstone River, Tully River, Daintree River

**Cape York**
- Mitchell River, Normanby River

**Gulf Country**
- Norman River, Flinders River, Leichhardt River, Cloncurry River

**Channel Country / Outback**
- Cooper Creek, Diamantina River, Warrego River, Paroo River

**Darling Downs**
- Condamine River

### Major Dams (30+)

| Region | Dams |
|--------|------|
| Southeast QLD | Wivenhoe, Somerset, Hinze, North Pine, Leslie Harrison, Lake Manchester, Moogerah, Lake Maroon, Lake Clarendon, Atkinson |
| Sunshine Coast | Ewen Maddock, Baroon Pocket |
| Burnett | Paradise, Boondooma, Fred Haigh, Wuruma |
| Central QLD | Fairbairn, Theresa Creek |
| Mackay-Whitsunday | Peter Faust, Kinchant, Eungella, Teemburra |
| North QLD | Burdekin Falls, Ross River, Tinaroo Falls, Copperlode |
| Western QLD | Julius, Lake Moondarra, Lake Fred Tritton |
| Darling Downs | Leslie, Storm King, Coolmunda, Glenlyon |

## Production Deployment

### Cloud Run (Recommended)

GAUGE is deployed on Google Cloud Run with Firestore for data caching.

**Live Sites:**
- **Production**: https://gauge.clermont.digital

**Deploy to Cloud Run:**

```bash
# Build and push image
docker build -t gcr.io/YOUR_PROJECT/gauge-dashboard .
docker push gcr.io/YOUR_PROJECT/gauge-dashboard

# Deploy to Cloud Run
gcloud run deploy gauge-dashboard \
  --image gcr.io/YOUR_PROJECT/gauge-dashboard \
  --region asia-southeast1 \
  --allow-unauthenticated

# Create Cloud Scheduler job for data fetching
gcloud scheduler jobs create http gauge-fetch-water-data \
  --location=asia-southeast1 \
  --schedule="*/2 * * * *" \
  --uri="https://YOUR_SERVICE_URL/api/cron/fetch-water-data" \
  --http-method=POST \
  --oidc-service-account-email=YOUR_SERVICE_ACCOUNT
```

### Docker (Local)

```bash
docker build -t gauge-dashboard .
docker run -p 3000:3000 gauge-dashboard
```

### Docker Compose

```bash
docker-compose up -d
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/water-levels` | GET | Current readings for all gauges |
| `/api/water-levels/[id]` | GET | Single gauge with 24hr history |
| `/api/warnings` | GET | Active BOM flood warnings |
| `/api/predictions` | GET | Calculated flood forecasts |
| `/api/weather` | GET | Current weather conditions |
| `/api/rainfall` | GET | Regional rainfall data and forecasts |
| `/api/cron/fetch-water-data` | POST | Cloud Scheduler endpoint (internal) |

## Important Disclaimer

This dashboard displays water level data from government sources for **informational purposes only**. It is NOT an official warning system.

**Always follow official warnings from:**
- Bureau of Meteorology (BOM)
- Queensland Fire and Emergency Services (QFES)

**In an emergency, call 000.**


