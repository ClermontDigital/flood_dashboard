# GAUGE - Fitzroy Basin Flood Dashboard

An open source project by **[Clermont Digital](https://clermontdigital.com.au)**.

Real-time water level monitoring and flood warning dashboard for Clermont, QLD and the surrounding Fitzroy Basin region.

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
Queensland WMIP API ──┐
                      ├──> Next.js API Routes ──> SWR Cache ──> React UI
BOM Water Data API ───┘           │
                                  ├── Rate limiting
                                  ├── Input sanitization
                                  └── Mock data fallback (dev)
```

### Key Components

- **FloodMap** - Leaflet map with gauge markers, river polylines, and address search
- **GaugeListSidebar** - Priority-sorted gauge list grouped by river system
- **WaterLevelChart** - 24-hour history with flood threshold lines
- **StatusBadge** - Consistent status display across the app

## Features

- **Real-time Water Levels**: Live data from 17 gauge stations across the Fitzroy Basin
- **Discharge/Flow Rates**: Water flow data (ML/day or cumec) at gauge locations
- **Dam Storage Levels**: Fairbairn Dam storage volume and percentage full
- **Rainfall Data**: Rainfall readings at gauge stations
- **Interactive Map**: Satellite/street/hybrid map views with status-coded markers
- **Address Search**: Search by address, town, river, or gauge name
- **Historical Charts**: 24-hour water level history with flood threshold indicators
- **Flood Warnings**: Real-time BOM flood warning integration
- **Mobile Responsive**: Fully functional on all device sizes
- **Offline-friendly**: Cached data for poor connectivity areas

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Data Fetching**: SWR with auto-refresh

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

### Gauge Stations (17 Total)

| Region | Gauges |
|--------|--------|
| Clermont Area | Theresa Creek, Sandy Creek, Clermont Alpha Rd |
| Isaac River | Yatton, Deverill, Connors River |
| Nogoa River | Craigmore, Duck Ponds, Retreat Creek |
| Mackenzie River | Bingegang, Coolmaringa, Rileys Crossing |
| Comet River | Comet Weir, The Lake |
| Fitzroy River | The Gap, Yaamba, Rockhampton |

### Dam Storage

| Dam | Station ID | River | Capacity |
|-----|------------|-------|----------|
| Fairbairn Dam | 130216A | Nogoa River | 1,301,000 ML |

## Production Deployment

### Docker

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

## Important Disclaimer

This dashboard displays water level data from government sources for **informational purposes only**. It is NOT an official warning system.

**Always follow official warnings from:**
- Bureau of Meteorology (BOM)
- Queensland Fire and Emergency Services (QFES)

**In an emergency, call 000.**

## Contributing

GAUGE is an open source project and we welcome contributions! Whether it's bug fixes, new features, or documentation improvements, please feel free to submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## About Clermont Digital

[Clermont Digital](https://clermontdigital.com.au) is a technology company based in regional Queensland, building practical digital solutions for rural communities. GAUGE was created to help residents of Clermont and surrounding areas stay informed about flood conditions using freely available government data.

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.
