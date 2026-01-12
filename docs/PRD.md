# Product Requirements Document: Clermont Flood Warning Dashboard

## 1. Overview

### 1.1 Product Summary
A real-time flood warning dashboard for Clermont, QLD and the surrounding Fitzroy Basin region. The dashboard aggregates water level data from multiple government sources, provides predictive analytics for upstream/downstream flooding, and delivers timely warnings to help residents prepare for flood events.

### 1.2 Problem Statement
Residents in Clermont and the Fitzroy Basin lack a simple, centralized way to monitor flood conditions across multiple river systems. Existing government data sources (BOM, WMIP) are technical and fragmented, making it difficult for non-technical users to quickly assess flood risk and take appropriate action.

### 1.3 Target Users
- **Primary**: Clermont residents and property owners
- **Secondary**: Residents along Isaac, Nogoa, Mackenzie, Comet, and Fitzroy rivers
- **Tertiary**: Emergency services, local councils, farmers, and rural landholders

### 1.4 Success Metrics
- Dashboard loads in under 3 seconds on mobile
- Data updates successfully 95%+ of the time
- Users can find their nearest gauge within 2 taps
- Zero false alarms (only trigger on official BOM thresholds)

---

## 2. User Requirements

### 2.1 User Stories

| ID | As a... | I want to... | So that... | Acceptance Criteria |
|----|---------|--------------|------------|---------------------|
| U1 | Clermont resident | See current water levels at a glance | I know if flooding is imminent | Dashboard loads in <3s showing all gauge statuses with color-coded badges |
| U2 | Rural landholder | Search for gauges near my property | I can monitor relevant waterways | Can find gauge within 2 taps using search or "Near Me" |
| U3 | Non-technical user | Understand flood risk without jargon | I can make informed decisions | All statuses use plain English (e.g., "Water level is normal") |
| U4 | Mobile user | Check flood status on my phone | I can stay informed anywhere | Dashboard is fully functional on 320px viewport |
| U5 | Concerned resident | Get notified when levels rise | I don't have to constantly check | Push notification received within 5 mins of threshold breach |
| U6 | Data-savvy user | Compare multiple data sources | I can validate the readings | Can toggle between WMIP/BOM and see last update times |
| U7 | Upstream resident | See downstream impact predictions | I can warn friends/family | Prediction panel shows ETA for upstream peaks |

### 2.2 User Personas

**Persona 1: Margaret (68, Retired)**
- Lives in Clermont for 40 years
- Basic smartphone user
- Remembers 1916 flood stories
- Needs: Large text, simple status, no technical jargon

**Persona 2: Dave (45, Cattle Farmer)**
- Property on Isaac River
- Moderate tech skills
- Needs early warning to move livestock
- Needs: Multiple gauge monitoring, predictions, mobile alerts

**Persona 3: Sarah (32, Emergency Coordinator)**
- Works for Isaac Regional Council
- Tech-savvy, needs detailed data
- Needs: Multi-source validation, historical trends, basin overview

---

## 3. Functional Requirements

### 3.1 Core Features

#### FR1: Real-Time Water Level Display
- **Priority**: P0 (Must Have)
- Display current water levels for all monitored gauges
- Poll for source updates every 5 minutes (note: source data updates hourly)
- Show trend indicator (rising/falling/stable)
- Color-code by flood status (green/yellow/orange/red)
- Display "Last updated" timestamp prominently

#### FR2: Interactive Map
- **Priority**: P0 (Must Have)
- Center on Clermont (-22.8245, 147.6392)
- Show all 17 gauge stations as markers
- Tap marker to see gauge details
- Zoom to view full Fitzroy Basin

#### FR3: Location Search
- **Priority**: P0 (Must Have)
- Search bar with autocomplete (results within 200ms)
- Search by gauge name, town, or river (fuzzy matching)
- Quick-tap buttons for major locations (Clermont, Emerald, Rockhampton, Moranbah)
- **"Near Me" GPS-based search**:
  - Uses browser Geolocation API
  - Shows gauges within 100km radius, sorted by distance (straight-line)
  - If GPS unavailable/denied: shows prompt to enable, falls back to manual search
  - If no gauges within 100km: expands search or suggests nearest region

#### FR4: Simplified Status Display
- **Priority**: P0 (Must Have)
- Large status badges: SAFE / WATCH / WARNING / DANGER
- Plain English descriptions
- Current level with trend arrow
- Time since last update

#### FR5: Historical Charts
- **Priority**: P1 (Should Have)
- 24-hour water level history
- Multi-gauge overlay for comparison
- Zoom and pan controls
- Mark flood threshold lines

#### FR6: Predictive Analytics
- **Priority**: P1 (Should Have)
- Upstream-to-downstream travel time estimates
- Simple trend projection (2-6 hours ahead)
- Confidence indicators
- ETA for upstream peaks reaching Clermont

#### FR7: Push Notifications
- **Priority**: P1 (Should Have)
- Browser push notification support via service worker
- Alert when gauge exceeds minor flood threshold
- Gauge preferences stored in browser local storage (device-specific, no account required)
- Note: Preferences are per-device and will not sync across devices

#### FR8: Multi-Source Data Validation
- **Priority**: P2 (Nice to Have)
- Display data source for each reading
- Toggle between WMIP and BOM data
- Flag stale data (>2 hours old)
- Cross-reference when both sources available

#### FR9: River System Filtering
- **Priority**: P2 (Nice to Have)
- Filter gauges by river system
- Compare gauges within same system
- Basin schematic view

---

## 4. Data Requirements

### 4.1 Data Sources

| Source | Type | Update Frequency | Purpose |
|--------|------|------------------|---------|
| Queensland WMIP | Primary | Hourly | Real-time water levels |
| BOM Water Data Online | Secondary | Hourly | Backup/validation |
| BOM Flood Warnings | Tertiary | As issued | Official warnings |

### 4.2 Gauge Stations (17 Total)

**Clermont Area (3 gauges)**
- Theresa Creek @ Gregory Hwy (130212A)
- Sandy Creek @ Clermont (130207A)
- Clermont Alpha Rd (120311A)

**Isaac River System (3 gauges)**
- Isaac River @ Yatton (130401A)
- Isaac River @ Deverill (130410A)
- Connors River @ Pink Lagoon (130408A)

**Nogoa River System (3 gauges)**
- Nogoa River @ Craigmore (130209A)
- Nogoa River @ Duck Ponds (130219A)
- Retreat Creek @ Dunrobin (130204A)

**Mackenzie River System (3 gauges)**
- Mackenzie River @ Bingegang (130106A)
- Mackenzie River @ Coolmaringa (130105B)
- Mackenzie River @ Rileys Crossing (130113A)

**Comet River System (2 gauges)**
- Comet River @ Comet Weir (130504A)
- Comet River @ The Lake (130502A)

**Fitzroy River (3 gauges)**
- Fitzroy River @ The Gap (130004A)
- Fitzroy River @ Yaamba (130003A)
- Fitzroy River @ Rockhampton (130005A)

### 4.3 Flood Thresholds
Use official BOM flood classification levels for each gauge:
- **Below Minor**: Green - Normal conditions
- **Minor Flood**: Yellow - Monitor situation
- **Moderate Flood**: Orange - Prepare to act
- **Major Flood**: Red - Take action now

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load: <3 seconds on 4G
- Data refresh: <2 seconds
- Map interaction: 60fps on mobile
- Support 1000+ concurrent users

### 5.2 Accessibility
- WCAG 2.1 AA compliance
- Color-blind friendly (use icons + text labels)
- Screen reader compatible
- Minimum touch target: 44x44px

### 5.3 Reliability
- 99.5% uptime target
- Graceful degradation if data source unavailable
- Cache last known values for offline viewing
- Clear error messaging

### 5.4 Security
- HTTPS only
- No user authentication required (public data)
- Rate limiting on API endpoints
- Input sanitization on search

### 5.5 Compatibility
- Mobile: iOS 14+, Android 10+
- Desktop: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Responsive: 320px to 2560px viewport

---

## 6. User Interface Requirements

### 6.1 Design Principles
1. **Clarity First**: Information must be instantly understandable
2. **Mobile Priority**: Design for phone, enhance for desktop
3. **Accessibility**: Never rely on color alone
4. **Speed**: Every interaction should feel instant

### 6.2 Key Screens

#### Home / Dashboard
```
┌─────────────────────────────────┐
│ [Search: Find a location...]  🔍│
├─────────────────────────────────┤
│ ⚠️ FLOOD WARNING ACTIVE         │
│ Sandy Creek @ Clermont          │
├─────────────────────────────────┤
│ Quick Links:                    │
│ [Clermont] [Emerald] [Rocky]    │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │         MAP VIEW            │ │
│ │    (Gauge markers shown)    │ │
│ │                             │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Nearby Gauges:                  │
│ ┌─────────────────────────────┐ │
│ │ Sandy Creek @ Clermont      │ │
│ │ 🟡 WATCH    2.45m  ↗️ Rising │ │
│ │ Updated 5 mins ago          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Gauge Detail
```
┌─────────────────────────────────┐
│ ← Sandy Creek @ Clermont        │
├─────────────────────────────────┤
│         🟡 WATCH                │
│                                 │
│          2.45 m                 │
│          ↗️ Rising              │
│                                 │
│ "Water level is elevated.       │
│  Continue to monitor."          │
├─────────────────────────────────┤
│ 24-Hour History:                │
│ ┌─────────────────────────────┐ │
│ │     ___/                    │ │
│ │ ___/                        │ │
│ │/          [Chart]           │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Upstream: Theresa Creek         │
│ 4.2m - ETA to Clermont: 4-6hrs │
├─────────────────────────────────┤
│ Data: WMIP • Updated 10:15 AM   │
│ [🔔 Enable Alerts]              │
└─────────────────────────────────┘
```

### 6.3 Status Badge Specifications

| Status | Color | Icon | Message | Action Guidance |
|--------|-------|------|---------|-----------------|
| SAFE | Green (#22c55e) | ✓ | "Water level is normal" | None required |
| WATCH | Yellow (#eab308) | 👁️ | "Water level is elevated. Monitor situation." | Check back regularly |
| WARNING | Orange (#f97316) | ⚠️ | "Flooding possible. Prepare to act." | Review evacuation routes, secure property |
| DANGER | Red (#ef4444) | 🚨 | "Flooding occurring. Take action now." | Follow emergency services advice, evacuate if directed |

**Note**: WARNING and DANGER statuses will display prominent links to emergency resources (BOM, SES, Council).

---

## 7. Technical Architecture

### 7.1 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Data Fetching**: SWR with server-side caching

### 7.2 Deployment
- **Hosting**: RunCloud container
- **CDN/Tunnel**: Cloudflare
- **Container**: Docker with multi-stage build

### 7.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/water-levels` | GET | Current readings for all gauges |
| `/api/water-levels/[id]` | GET | Single gauge with history |
| `/api/predictions` | GET | Calculated forecasts |
| `/api/warnings` | GET | Active BOM warnings |
| `/api/search` | GET | Location/gauge search |

---

## 8. Constraints & Assumptions

### 8.1 Constraints
- Dependent on government data sources (WMIP, BOM)
- No control over data update frequency
- Must handle data outages gracefully
- Public data only - no authentication

### 8.2 Assumptions
- WMIP API remains publicly accessible
- BOM data format remains stable
- Users have modern browsers with JavaScript
- Mobile data connectivity in rural areas

### 8.3 Out of Scope (v1)
- User accounts with cloud-synced preferences (local storage only)
- Historical data beyond 24 hours
- SMS/email notifications
- Rainfall data integration
- Dam release information
- Native mobile apps (PWA only)

---

## 9. Legal & Liability

### 9.1 Required Disclaimer
The following disclaimer must be prominently displayed on all pages:

> **Important Notice**: This dashboard displays water level data from government sources for informational purposes only. It is NOT an official warning system. Data may be delayed by up to 1 hour. During rapidly changing conditions, actual water levels may differ significantly from displayed values.
>
> **Always follow official warnings from:**
> - Bureau of Meteorology (BOM)
> - Queensland Fire and Emergency Services (QFES)
> - Isaac Regional Council
>
> **In an emergency, call 000.**

### 9.2 Data Attribution
- All water level data must display its source (WMIP/BOM)
- Include link to original data source
- Clearly state data update frequency and potential latency

### 9.3 Liability Limitations
- Dashboard provides information only, not advice
- Users are responsible for their own safety decisions
- No guarantee of data accuracy or availability
- Not a substitute for professional emergency management advice

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| WMIP API unavailable | High | Medium | Fallback to BOM data source |
| Incorrect flood thresholds | High | Low | Use official BOM classifications only |
| Mobile performance issues | Medium | Medium | Optimize bundle, lazy load map |
| Data staleness not detected | Medium | Medium | Show clear "last updated" timestamps |
| User misinterprets data | High | Medium | Plain language, no jargon, disclaimers |
| User makes safety decision based on stale data | High | Medium | Prominent data age warning, auto-refresh |
| API rate limiting during flood event | High | Low | Implement caching, use Cloudflare edge caching |
| Dashboard unavailable during flood | Critical | Low | Multi-region hosting consideration for v2 |

---

## 11. Release Criteria

### 11.1 MVP (v1.0)
- [ ] Real-time data from WMIP for all 17 gauges
- [ ] Interactive map with gauge markers
- [ ] Location search with autocomplete
- [ ] Mobile-responsive design
- [ ] Status badges with plain English
- [ ] 24-hour historical charts
- [ ] Background data refresh
- [ ] Deployed to RunCloud with Cloudflare tunnel

### 11.2 Post-MVP (v1.1+)
- [ ] Browser push notifications
- [ ] BOM data source integration
- [ ] Predictive analytics
- [ ] Multi-gauge comparison
- [ ] PWA offline support

---

## 12. Testing Strategy

### 12.1 Testing Approach
| Test Type | Scope | Tools |
|-----------|-------|-------|
| Unit Tests | API clients, prediction algorithms | Jest |
| Integration Tests | API routes, data aggregation | Jest + MSW |
| E2E Tests | Critical user flows | Playwright |
| Accessibility | WCAG 2.1 AA compliance | axe-core, manual |
| Performance | Load time, responsiveness | Lighthouse, WebPageTest |
| Load Testing | 1000+ concurrent users | k6 or Artillery |

### 12.2 Critical Test Scenarios
1. Data source failover (WMIP down, switch to BOM)
2. Search returns no results - graceful handling
3. GPS unavailable - fallback to manual search
4. Offline mode - cached data display
5. Push notification delivery when threshold exceeded
6. Mobile viewport rendering (320px - 428px)

### 12.3 Acceptance Criteria Examples
- **FR1**: Given source data updated at 10:00, when user views dashboard at 10:05, then data displays with "Updated 5 mins ago"
- **FR3**: Given user types "Cler", when autocomplete appears, then "Clermont" option is visible within 200ms
- **FR4**: Given gauge at Minor Flood level, when user views gauge, then WATCH badge displays with yellow color AND text label

---

## 13. Monitoring & Observability

### 13.1 Application Monitoring
- **APM Tool**: Vercel Analytics or self-hosted (consider Sentry)
- **Metrics**: Page load time, API response time, error rate
- **Alerting**: Slack/email when error rate >1% or p95 latency >3s

### 13.2 Data Source Monitoring
- Track WMIP API availability and response time
- Track BOM API availability and response time
- Alert when data is stale (>90 minutes since last update)

### 13.3 Key Performance Indicators
| KPI | Target | Measurement |
|-----|--------|-------------|
| Page Load (p50) | <2s | Vercel Analytics |
| Page Load (p95) | <3s | Vercel Analytics |
| API Success Rate | >99% | Server logs |
| Data Freshness | <60 mins | Cron job check |
| Uptime | >99.5% | Uptime monitor |

### 13.4 Incident Response
- On-call rotation during flood season (Nov-Mar)
- Runbook for common failures (API down, stale data)
- Escalation to hosting provider if infrastructure issue

---

## 14. Error States

### 14.1 Error State Wireframes

#### Data Source Unavailable
```
┌─────────────────────────────────┐
│ ⚠️ Data Temporarily Unavailable │
│                                 │
│ We're having trouble getting    │
│ the latest water level data.    │
│                                 │
│ Last known data from 10:15 AM   │
│ (2 hours ago)                   │
│                                 │
│ [Try Again]  [View Cached Data] │
│                                 │
│ For current conditions, visit:  │
│ • BOM Queensland Flood Warnings │
│ • WMIP Portal                   │
└─────────────────────────────────┘
```

#### No Search Results
```
┌─────────────────────────────────┐
│ No results for "xyz creek"      │
│                                 │
│ Try searching for:              │
│ • A town name (e.g., Clermont)  │
│ • A river name (e.g., Isaac)    │
│ • A gauge name (e.g., Sandy Ck) │
│                                 │
│ Or browse by region:            │
│ [Clermont] [Emerald] [Rocky]    │
└─────────────────────────────────┘
```

#### GPS Unavailable
```
┌─────────────────────────────────┐
│ 📍 Location access denied       │
│                                 │
│ To find gauges near you, please │
│ enable location in your browser │
│ settings.                       │
│                                 │
│ Or search manually:             │
│ [Search: Find a location...]    │
└─────────────────────────────────┘
```

#### Stale Data Warning
```
┌─────────────────────────────────┐
│ ⚠️ Data may be outdated         │
│ Last update: 2+ hours ago       │
│                                 │
│ Conditions may have changed.    │
│ Check official BOM warnings.    │
│                                 │
│ [View BOM Warnings]             │
└─────────────────────────────────┘
```

---

## 15. Appendix

### 15.1 Glossary
- **AHD**: Australian Height Datum - reference for measuring elevation
- **BOM**: Bureau of Meteorology
- **WMIP**: Water Monitoring Information Portal (Queensland Government)
- **Gauge**: Water level monitoring station
- **Stage Height**: Water level at a gauge (use "water height" for users)

### 15.2 References
- [Queensland WMIP](https://water-monitoring.information.qld.gov.au/)
- [BOM Water Data Online](https://www.bom.gov.au/waterdata/)
- [BOM Queensland Flood Warnings](https://www.bom.gov.au/qld/flood/)
- [Isaac Regional Council Flood Studies](https://www.isaac.qld.gov.au/Residents/Planning-and-Development/Flood-Studies/)

### 15.3 Emergency Resources
The dashboard should link to these resources when WARNING or DANGER status is active:

| Resource | URL | Purpose |
|----------|-----|---------|
| BOM Flood Warnings | bom.gov.au/qld/flood/ | Official warnings |
| QFES | qfes.qld.gov.au | Emergency services |
| Isaac Regional Council | isaac.qld.gov.au/disaster | Local emergency info |
| SES | ses.qld.gov.au | Request assistance |
| Emergency | 000 | Life-threatening emergencies |

### 15.4 Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude | Initial PRD |
| 1.1 | 2026-01-12 | Claude | Added Legal & Liability, Testing Strategy, Monitoring, Error States. Fixed data frequency inconsistency, gauge count, user preferences scope. Added emergency action guidance and Near Me specifications. |
