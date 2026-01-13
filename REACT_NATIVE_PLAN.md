# GAUGE React Native App - Implementation Plan

## Overview

Build a React Native mobile app for iOS and Android that provides flood monitoring functionality for the Fitzroy Basin region. The app will connect to the existing Next.js API backend.

**By:** Clermont Digital

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Project
Create new Expo project with the tabs template (includes Expo Router):
```bash
npx create-expo-app gauge-mobile --template tabs
```
- Configure TypeScript
- Set up ESLint and Prettier
- Configure app.config.ts for iOS and Android

### 1.2 Splash Screen - Clermont Digital Branding

A branded splash screen displays while the app initializes and establishes data connections.

**Implementation:**
```typescript
// app.config.ts
export default {
  expo: {
    name: "GAUGE",
    slug: "gauge-mobile",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a"  // slate-900 dark background
    },
    ios: {
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#0f172a"
      }
    },
    android: {
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#0f172a"
      }
    }
  }
}
```

**Splash Screen Design:**
- Clermont Digital logo centered (user to provide)
- Dark slate background (#0f172a) matching app theme
- Subtle fade-in animation
- Optional: Animated water ripple effect around logo

**Extended Splash with Loading State:**
```typescript
// src/components/SplashScreen.tsx
import { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface SplashScreenProps {
  onReady: () => void;
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    async function initialize() {
      setStatus('Loading cached data...');
      // Load cached data from AsyncStorage
      await loadCachedData();

      setStatus('Checking for updates...');
      // Attempt to fetch fresh data
      await prefetchData();

      setStatus('Ready');
      onReady();
    }
    initialize();
  }, []);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(500)}
      style={styles.container}
    >
      <Image
        source={require('../assets/clermont-digital-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.statusText}>{status}</Text>
      </View>
      <Text style={styles.tagline}>Flood monitoring for the Fitzroy Basin</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  tagline: {
    position: 'absolute',
    bottom: 60,
    color: '#64748b',
    fontSize: 12,
  },
});
```

**Assets Required:**
- `assets/splash.png` - Static splash (1284x2778px for iOS, 1080x1920px for Android)
- `assets/clermont-digital-logo.png` - Logo for animated splash
- Optional: `assets/splash-animation.json` - Lottie animation

### 1.3 Navigation Structure (Expo Router)

Use file-based routing with Expo Router (default in Expo SDK 54):

```
app/
├── _layout.tsx              # Root layout with providers + splash logic
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator configuration
│   ├── index.tsx            # Overview/Dashboard (home)
│   ├── map.tsx              # Interactive map
│   ├── alerts.tsx           # Warnings + Road closures
│   └── more.tsx             # Settings, all gauges, about
├── gauge/
│   └── [id].tsx             # Gauge detail (modal/push)
└── +not-found.tsx           # 404 handler
```

**Tab Navigation (4 tabs - optimized for emergency use):**
| Tab | Icon | Purpose |
|-----|------|---------|
| Overview | Home | Dashboard with favorites + status summary |
| Map | Map | Interactive flood map |
| Alerts | Bell | Warnings + road closures |
| More | Menu | Settings, full gauge list, about |

### 1.4 Development Build Setup (Required)

Due to Expo Go limitations, this app **requires development builds**:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS for this project
eas build:configure

# Create development builds
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Why development builds are required:**
- Google Maps on Android (not supported in Expo Go since SDK 53)
- Push notifications (expo-notifications)
- Background location/geofencing

### 1.5 Core Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "react-native-maps": "^1.21.0",
    "react-native-map-clustering": "^3.5.0",
    "react-native-svg": "^15.0.0",
    "react-native-gifted-charts": "^1.4.0",
    "@tanstack/react-query": "^5.90.0",
    "@tanstack/react-query-persist-client": "^5.90.0",
    "expo-location": "~18.0.0",
    "expo-notifications": "~0.29.0",
    "expo-splash-screen": "~0.29.0",
    "zustand": "^5.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@react-native-community/netinfo": "^11.0.0",
    "date-fns": "^3.6.0",
    "expo-haptics": "~14.0.0",
    "react-native-reanimated": "~3.16.0"
  },
  "devDependencies": {
    "@dev-plugins/react-query": "^0.1.0"
  }
}
```

---

## Phase 2: Offline-First Data Architecture

### 2.1 Aggressive Pre-Caching Strategy

The app must work reliably in rural Queensland with poor/no connectivity.

```typescript
// src/lib/cache-config.ts
export const CACHE_CONFIG = {
  // Gauge station metadata (never changes) - persist indefinitely
  gaugeStations: {
    key: 'gauge-stations',
    staleTime: Infinity,
    cacheTime: Infinity,
  },

  // Water level readings - cache 72 hours for offline
  waterLevels: {
    key: 'water-levels',
    staleTime: 2 * 60 * 1000,        // 2 minutes
    cacheTime: 72 * 60 * 60 * 1000,  // 72 hours
    refetchInterval: 5 * 60 * 1000,  // 5 minutes when online
  },

  // Historical data per gauge - cache 24 hours
  gaugeHistory: {
    key: 'gauge-history',
    staleTime: 5 * 60 * 1000,        // 5 minutes
    cacheTime: 24 * 60 * 60 * 1000,  // 24 hours
  },

  // BOM warnings - critical, cache aggressively
  warnings: {
    key: 'warnings',
    staleTime: 1 * 60 * 1000,        // 1 minute
    cacheTime: 24 * 60 * 60 * 1000,  // 24 hours
  },

  // Road closures
  roadClosures: {
    key: 'road-closures',
    staleTime: 5 * 60 * 1000,        // 5 minutes
    cacheTime: 12 * 60 * 60 * 1000,  // 12 hours
  },
};
```

### 2.2 React Query Persistence Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, focusManager } from '@tanstack/react-query';
import { useAppState } from 'react-native';
import { useEffect } from 'react';

// Create persister for AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'GAUGE_QUERY_CACHE',
});

// Configure online/offline detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 72 * 60 * 60 * 1000,  // 72 hours cache
      staleTime: 5 * 60 * 1000,     // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Handle app focus state for refetching
  const appState = useAppState();

  useEffect(() => {
    focusManager.setFocused(appState === 'active');
  }, [appState]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 72 * 60 * 60 * 1000, // 72 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries
            return query.state.status === 'success';
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

### 2.3 Staleness Indicators

```typescript
// src/lib/staleness.ts
export const STALENESS_THRESHOLDS = {
  normal: {
    fresh: 15 * 60 * 1000,       // 15 min - green indicator
    stale: 60 * 60 * 1000,       // 1 hour - yellow indicator
    veryStale: 4 * 60 * 60 * 1000, // 4 hours - red indicator
  },
  duringWarning: {
    fresh: 5 * 60 * 1000,        // 5 min
    stale: 15 * 60 * 1000,       // 15 min
    veryStale: 30 * 60 * 1000,   // 30 min
  },
};

export function getStalenessLevel(
  lastUpdated: Date,
  hasActiveWarning: boolean
): 'fresh' | 'stale' | 'veryStale' {
  const age = Date.now() - lastUpdated.getTime();
  const thresholds = hasActiveWarning
    ? STALENESS_THRESHOLDS.duringWarning
    : STALENESS_THRESHOLDS.normal;

  if (age < thresholds.fresh) return 'fresh';
  if (age < thresholds.stale) return 'stale';
  return 'veryStale';
}
```

### 2.4 Offline Map Tiles (Post-MVP)

```typescript
// Future: Pre-download map tiles for Fitzroy Basin region
const OFFLINE_MAP_CONFIG = {
  region: {
    // Fitzroy Basin bounding box
    minLat: -24.5,
    maxLat: -21.5,
    minLng: 146.5,
    maxLng: 151.0,
  },
  zoomLevels: [8, 10, 12, 14],
  estimatedSize: '~50MB',
};
```

### 2.5 Port Existing Types

Copy and adapt from `src/lib/types.ts`:

```typescript
// src/lib/types.ts
export interface GaugeStation {
  id: string;
  name: string;
  stream: string;
  riverSystem: RiverSystem;
  lat: number;
  lng: number;
  thresholds: FloodThresholds;
  source: 'wmip' | 'bom';
}

export interface WaterReading {
  stationId: string;
  level: number;        // metres
  discharge?: number;   // ML/d
  rainfall?: number;    // mm
  timestamp: string;
  status: FloodStatus;
  trend: 'rising' | 'falling' | 'stable';
}

export interface FloodWarning {
  id: string;
  title: string;
  severity: 'minor' | 'moderate' | 'major';
  area: string;
  issueTime: string;
  description: string;
}

export interface RoadEvent {
  id: string;
  type: 'flooding' | 'road_closure' | 'hazard';
  title: string;
  description: string;
  road: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high' | 'extreme';
}

export interface DamStorageReading {
  stationId: string;
  name: string;
  volume: number;       // ML
  level: number;        // m
  percentFull?: number;
  timestamp: string;
}

export type FloodStatus = 'safe' | 'watch' | 'warning' | 'danger' | 'offline';
export type RiverSystem = 'clermont' | 'theresa' | 'isaac' | 'nogoa' | 'mackenzie' | 'comet' | 'fitzroy' | 'burnett';
```

### 2.6 Port Utility Functions

From `src/lib/utils.ts`:
- `getStatusFromLevel()` - calculate flood status from thresholds
- `formatWaterLevel()` - display formatting (e.g., "2.45 m")
- `getStatusColor()` - status to color mapping
- `calculateDistance()` - haversine distance for nearby gauges
- `formatTimestamp()` - Australian date/time formatting

### 2.7 Port Constants

From `src/lib/constants.ts`:
- `GAUGE_STATIONS` - all 29 stations with coordinates and thresholds
- `RIVER_SYSTEMS` - river system configuration
- `RIVER_PATHS` - polyline coordinates for map rendering
- `RAINVIEWER_CONFIG` - rain radar tile configuration
- `CLERMONT_CENTER` - default map center coordinates

---

## Phase 3: API Integration

### 3.1 API Client Setup

```typescript
// src/api/client.ts
const API_BASE_URL = 'https://gauge.clermontdigital.com.au/api';

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  getWaterLevels: () =>
    fetchWithTimeout(`${API_BASE_URL}/water-levels`).then(r => r.json()),

  getGaugeDetail: (id: string) =>
    fetchWithTimeout(`${API_BASE_URL}/water-levels/${id}`).then(r => r.json()),

  getWarnings: () =>
    fetchWithTimeout(`${API_BASE_URL}/warnings`).then(r => r.json()),

  getRainfall: () =>
    fetchWithTimeout(`${API_BASE_URL}/rainfall`).then(r => r.json()),

  getRoadClosures: () =>
    fetchWithTimeout(`${API_BASE_URL}/road-closures`).then(r => r.json()),

  getWeather: () =>
    fetchWithTimeout(`${API_BASE_URL}/weather`).then(r => r.json()),

  getFloodPredictions: () =>
    fetchWithTimeout(`${API_BASE_URL}/flood`).then(r => r.json()),

  getPredictions: (gaugeId: string) =>
    fetchWithTimeout(`${API_BASE_URL}/predictions?gaugeId=${gaugeId}`).then(r => r.json()),
};
```

### 3.2 React Query Hooks

```typescript
// src/hooks/useWaterLevels.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CACHE_CONFIG } from '../lib/cache-config';

export function useWaterLevels() {
  return useQuery({
    queryKey: [CACHE_CONFIG.waterLevels.key],
    queryFn: api.getWaterLevels,
    staleTime: CACHE_CONFIG.waterLevels.staleTime,
    gcTime: CACHE_CONFIG.waterLevels.cacheTime,
    refetchInterval: CACHE_CONFIG.waterLevels.refetchInterval,
  });
}

export function useGaugeDetail(gaugeId: string) {
  return useQuery({
    queryKey: [CACHE_CONFIG.gaugeHistory.key, gaugeId],
    queryFn: () => api.getGaugeDetail(gaugeId),
    staleTime: CACHE_CONFIG.gaugeHistory.staleTime,
    gcTime: CACHE_CONFIG.gaugeHistory.cacheTime,
    enabled: !!gaugeId,
  });
}

export function useWarnings() {
  return useQuery({
    queryKey: [CACHE_CONFIG.warnings.key],
    queryFn: api.getWarnings,
    staleTime: CACHE_CONFIG.warnings.staleTime,
    gcTime: CACHE_CONFIG.warnings.cacheTime,
    refetchInterval: 2 * 60 * 1000, // Check warnings every 2 min
  });
}

export function useRoadClosures() {
  return useQuery({
    queryKey: [CACHE_CONFIG.roadClosures.key],
    queryFn: api.getRoadClosures,
    staleTime: CACHE_CONFIG.roadClosures.staleTime,
    gcTime: CACHE_CONFIG.roadClosures.cacheTime,
  });
}
```

---

## Phase 4: Core Screens

### 4.1 Overview Screen (Home)

The home screen shows critical information immediately without navigation.

**Components:**
- Status summary banner ("All Safe" or "2 Gauges at Warning Level")
- Favorite gauges list with current readings
- Active warnings count badge
- Emergency quick actions: "000", "SES 132 500"
- Last sync timestamp with staleness indicator

```typescript
// app/(tabs)/index.tsx - Overview Screen
export default function OverviewScreen() {
  const { data: waterLevels, dataUpdatedAt } = useWaterLevels();
  const { data: warnings } = useWarnings();
  const favorites = useAppStore((s) => s.favoriteGaugeIds);

  const statusSummary = useMemo(() =>
    calculateStatusSummary(waterLevels), [waterLevels]);

  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <StatusBanner summary={statusSummary} />

      {/* Active Warnings Alert */}
      {warnings?.length > 0 && (
        <WarningAlert count={warnings.length} />
      )}

      {/* Favorite Gauges */}
      <Section title="My Gauges">
        {favorites.map(id => (
          <GaugeCard key={id} gaugeId={id} compact />
        ))}
        {favorites.length === 0 && (
          <EmptyState message="Tap + to add favorite gauges" />
        )}
      </Section>

      {/* Nearby Gauges (if location enabled) */}
      <NearbyGaugesSection />

      {/* Emergency Contacts */}
      <EmergencyContacts />

      {/* Sync Status */}
      <SyncStatus lastUpdated={dataUpdatedAt} />
    </ScrollView>
  );
}
```

### 4.2 Map Screen

**Port from:** `FloodMap.tsx`

```typescript
// app/(tabs)/map.tsx
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';

export default function MapScreen() {
  const { data: waterLevels } = useWaterLevels();
  const [selectedGauge, setSelectedGauge] = useState<string | null>(null);
  const [showRainRadar, setShowRainRadar] = useState(false);

  return (
    <View style={styles.container}>
      <ClusteredMapView
        style={styles.map}
        initialRegion={FITZROY_BASIN_REGION}
        clusterColor={colors.safe}
        radius={50}
        maxZoom={15}
      >
        {/* Rain Radar Overlay */}
        {showRainRadar && <RainRadarLayer />}

        {/* River Polylines */}
        {Object.entries(RIVER_PATHS).map(([river, coords]) => (
          <Polyline
            key={river}
            coordinates={coords.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            strokeColor="#3b82f6"
            strokeWidth={2}
          />
        ))}

        {/* Gauge Markers */}
        {waterLevels?.map((gauge) => (
          <GaugeMarker
            key={gauge.stationId}
            gauge={gauge}
            onPress={() => setSelectedGauge(gauge.stationId)}
            isSelected={selectedGauge === gauge.stationId}
          />
        ))}

        {/* Dam Markers */}
        <DamMarkers />

        {/* Road Closure Markers */}
        <RoadClosureMarkers />
      </ClusteredMapView>

      {/* Map Controls */}
      <MapControls
        onToggleRainRadar={() => setShowRainRadar(!showRainRadar)}
        showRainRadar={showRainRadar}
      />

      {/* Selected Gauge Bottom Sheet */}
      {selectedGauge && (
        <GaugeBottomSheet
          gaugeId={selectedGauge}
          onClose={() => setSelectedGauge(null)}
        />
      )}
    </View>
  );
}
```

**Rain Radar Implementation:**
```typescript
// src/components/map/RainRadarLayer.tsx
import { UrlTile } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';

export function RainRadarLayer() {
  const { data: radarData } = useQuery({
    queryKey: ['rain-radar'],
    queryFn: async () => {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      return data.radar.past[data.radar.past.length - 1]; // Latest frame
    },
    refetchInterval: 5 * 60 * 1000,
  });

  if (!radarData) return null;

  return (
    <UrlTile
      urlTemplate={`https://tilecache.rainviewer.com${radarData.path}/256/{z}/{x}/{y}/2/1_1.png`}
      opacity={0.6}
      zIndex={1}
    />
  );
}
```

### 4.3 Alerts Screen

Combines warnings and road closures for quick access during emergencies.

```typescript
// app/(tabs)/alerts.tsx
export default function AlertsScreen() {
  const { data: warnings } = useWarnings();
  const { data: roadClosures } = useRoadClosures();

  return (
    <ScrollView style={styles.container}>
      {/* Active Warnings */}
      <Section title="Flood Warnings">
        {warnings?.map((warning) => (
          <WarningCard key={warning.id} warning={warning} />
        ))}
        {(!warnings || warnings.length === 0) && (
          <EmptyState
            icon="check-circle"
            message="No active flood warnings"
          />
        )}
      </Section>

      {/* Road Closures */}
      <Section title="Road Closures">
        {roadClosures?.map((closure) => (
          <RoadClosureCard key={closure.id} closure={closure} />
        ))}
        {(!roadClosures || roadClosures.length === 0) && (
          <EmptyState
            icon="road"
            message="No reported road closures"
          />
        )}
      </Section>
    </ScrollView>
  );
}
```

### 4.4 Gauge Detail Screen (Modal)

```typescript
// app/gauge/[id].tsx
import { useLocalSearchParams, router } from 'expo-router';
import { WaterLevelChart } from '../components/charts/WaterLevelChart';

export default function GaugeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: gaugeDetail, isLoading } = useGaugeDetail(id);
  const station = GAUGE_STATIONS.find(s => s.id === id);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      {/* Header with status */}
      <View style={styles.header}>
        <Text style={styles.title}>{station?.name}</Text>
        <Text style={styles.subtitle}>{station?.stream}</Text>
        <StatusBadge status={gaugeDetail?.status} size="lg" />
      </View>

      {/* Current Readings */}
      <View style={styles.readings}>
        <ReadingItem
          label="Water Level"
          value={`${gaugeDetail?.level.toFixed(2)} m`}
          trend={gaugeDetail?.trend}
        />
        {gaugeDetail?.discharge && (
          <ReadingItem
            label="Discharge"
            value={`${gaugeDetail.discharge.toFixed(0)} ML/d`}
          />
        )}
        {gaugeDetail?.rainfall && (
          <ReadingItem
            label="Rainfall (24hr)"
            value={`${gaugeDetail.rainfall.toFixed(1)} mm`}
          />
        )}
      </View>

      {/* 24-Hour Chart */}
      <Section title="24-Hour History">
        <WaterLevelChart
          data={gaugeDetail?.history || []}
          thresholds={station?.thresholds}
        />
      </Section>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Navigate to Gauge"
          onPress={() => openMapsApp(station?.lat, station?.lng)}
        />
        <Button
          title="Share Reading"
          onPress={() => shareReading(gaugeDetail)}
        />
      </View>
    </ScrollView>
  );
}
```

### 4.5 More Screen (Settings & Full List)

```typescript
// app/(tabs)/more.tsx
export default function MoreScreen() {
  return (
    <ScrollView style={styles.container}>
      <MenuItem
        icon="list"
        title="All Gauges"
        onPress={() => router.push('/gauges')}
      />
      <MenuItem
        icon="star"
        title="Manage Favorites"
        onPress={() => router.push('/favorites')}
      />
      <MenuItem
        icon="bell"
        title="Notification Settings"
        onPress={() => router.push('/notifications')}
      />
      <MenuItem
        icon="download"
        title="Offline Data"
        subtitle="50 MB cached"
        onPress={() => router.push('/offline')}
      />
      <MenuItem
        icon="globe"
        title="Web Dashboard"
        onPress={() => Linking.openURL('https://gauge.clermontdigital.com.au')}
      />
      <MenuItem
        icon="info"
        title="About"
        onPress={() => router.push('/about')}
      />
    </ScrollView>
  );
}
```

---

## Phase 5: State Management

### 5.1 App Store (Zustand with Persistence)

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // Favorites (persisted)
  favoriteGaugeIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;

  // Notification preferences (persisted)
  notificationPreferences: {
    enabled: boolean;
    alertThreshold: 'watch' | 'warning' | 'danger';
    enabledGaugeIds: string[];
    enableHaptics: boolean;
  };
  setNotificationPreference: <K extends keyof AppState['notificationPreferences']>(
    key: K,
    value: AppState['notificationPreferences'][K]
  ) => void;

  // UI state (not persisted)
  selectedGaugeId: string | null;
  setSelectedGauge: (id: string | null) => void;

  // Offline state
  lastSuccessfulSync: number | null;
  setLastSync: (timestamp: number) => void;

  // Emergency mode (more aggressive refresh)
  isEmergencyMode: boolean;
  setEmergencyMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Favorites
      favoriteGaugeIds: [],
      addFavorite: (id) => set((s) => ({
        favoriteGaugeIds: [...s.favoriteGaugeIds, id]
      })),
      removeFavorite: (id) => set((s) => ({
        favoriteGaugeIds: s.favoriteGaugeIds.filter(fid => fid !== id)
      })),

      // Notifications
      notificationPreferences: {
        enabled: true,
        alertThreshold: 'warning',
        enabledGaugeIds: [],
        enableHaptics: true,
      },
      setNotificationPreference: (key, value) => set((s) => ({
        notificationPreferences: { ...s.notificationPreferences, [key]: value }
      })),

      // UI
      selectedGaugeId: null,
      setSelectedGauge: (id) => set({ selectedGaugeId: id }),

      // Offline
      lastSuccessfulSync: null,
      setLastSync: (timestamp) => set({ lastSuccessfulSync: timestamp }),

      // Emergency
      isEmergencyMode: false,
      setEmergencyMode: (enabled) => set({ isEmergencyMode: enabled }),
    }),
    {
      name: 'gauge-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoriteGaugeIds: state.favoriteGaugeIds,
        notificationPreferences: state.notificationPreferences,
        lastSuccessfulSync: state.lastSuccessfulSync,
      }),
    }
  )
);
```

---

## Phase 6: Mobile-Specific Features

### 6.1 Local Notifications

```typescript
// src/hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotificationSetup() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);
}

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permission denied');
    return;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // Immediate
  });
}
```

### 6.2 Background Sync

```typescript
// src/lib/background-sync.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-water-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const waterLevels = await api.getWaterLevels();

    // Check for status changes and notify
    const previousLevels = await AsyncStorage.getItem('previous-levels');
    if (previousLevels) {
      const changes = detectStatusChanges(JSON.parse(previousLevels), waterLevels);
      for (const change of changes) {
        await sendLocalNotification(
          `${change.name} Status Changed`,
          `Now at ${change.newStatus.toUpperCase()} level`
        );
      }
    }

    await AsyncStorage.setItem('previous-levels', JSON.stringify(waterLevels));
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

### 6.3 Location Services

```typescript
// src/hooks/useLocation.ts
import * as Location from 'expo-location';

export function useUserLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return location;
}

export function useNearbyGauges(limit = 5) {
  const location = useUserLocation();
  const { data: waterLevels } = useWaterLevels();

  return useMemo(() => {
    if (!location || !waterLevels) return [];

    return GAUGE_STATIONS
      .map(station => ({
        ...station,
        distance: calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          station.lat,
          station.lng
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }, [location, waterLevels, limit]);
}
```

### 6.4 Haptic Feedback

```typescript
// src/lib/haptics.ts
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';

export function useStatusHaptics() {
  const enableHaptics = useAppStore((s) => s.notificationPreferences.enableHaptics);

  const triggerForStatus = useCallback((status: FloodStatus) => {
    if (!enableHaptics) return;

    switch (status) {
      case 'danger':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'watch':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  return { triggerForStatus };
}
```

---

## Phase 7: UI/UX Design

### 7.1 Design System

```typescript
// src/theme/colors.ts
export const colors = {
  // Status colors
  safe: '#22c55e',      // green-500
  watch: '#eab308',     // yellow-500
  warning: '#f97316',   // orange-500
  danger: '#ef4444',    // red-500
  offline: '#6b7280',   // gray-500

  // App colors
  background: '#0f172a', // slate-900
  surface: '#1e293b',    // slate-800
  surfaceLight: '#334155', // slate-700
  text: '#f8fafc',       // slate-50
  textSecondary: '#94a3b8', // slate-400
  textMuted: '#64748b',  // slate-500

  // Accent
  primary: '#3b82f6',    // blue-500
  primaryDark: '#2563eb', // blue-600
};

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### 7.2 Component Library

- `SplashScreen` - Clermont Digital branded loading
- `StatusBadge` - Color + icon status indicator
- `GaugeCard` - List item with readings
- `WaterLevelChart` - 24hr history with thresholds
- `WarningCard` - BOM warning display
- `EmptyState` - Placeholder for empty lists
- `SyncStatus` - Last updated + staleness indicator
- `EmergencyContacts` - Quick dial 000, SES

### 7.3 Accessibility

```typescript
// Accessibility requirements
const ACCESSIBILITY_CONFIG = {
  // Minimum touch targets
  minTouchTarget: Platform.OS === 'ios' ? 44 : 48,

  // Screen reader labels
  statusLabels: {
    safe: 'Safe - water levels normal',
    watch: 'Watch - water levels elevated',
    warning: 'Warning - flooding possible',
    danger: 'Danger - flooding occurring',
    offline: 'Offline - no recent data',
  },

  // High contrast colors (WCAG AAA)
  highContrast: {
    danger: '#ff0000',
    warning: '#ff8800',
    text: '#ffffff',
  },
};
```

---

## Phase 8: Security

### 8.1 API Security
- Certificate pinning for API requests (production)
- Rate limiting awareness with client-side backoff
- No sensitive data in notification payloads

### 8.2 Data Protection
- Encrypted storage for sensitive preferences (expo-secure-store)
- Clear offline cache option in settings

### 8.3 Location Privacy
- Request permissions only when needed
- Offer "approximate location" option
- Allow manual location entry as alternative

---

## Phase 9: Testing & Quality

### 9.1 Testing Strategy
- **Unit tests:** Jest + React Native Testing Library
- **E2E tests:** Maestro for critical flows
- **Offline testing:** Test with airplane mode
- **Field testing:** Test in actual Fitzroy Basin locations

### 9.2 Performance Targets
- Cold start to content: < 3 seconds
- Map interaction: 60fps
- Memory footprint: < 150MB
- Offline cache limit: 50MB (configurable)
- Bundle size: < 15MB

---

## Phase 10: Build & Deployment

### 10.1 EAS Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### 10.2 App Store Requirements
- Privacy Policy URL
- App description and screenshots
- iOS: App Tracking Transparency if analytics used
- Android: Data Safety section

---

## Folder Structure

```
gauge-mobile/
├── app/
│   ├── _layout.tsx              # Root layout + splash
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab config
│   │   ├── index.tsx            # Overview (home)
│   │   ├── map.tsx              # Map screen
│   │   ├── alerts.tsx           # Warnings + closures
│   │   └── more.tsx             # Settings menu
│   ├── gauge/
│   │   └── [id].tsx             # Gauge detail
│   ├── gauges.tsx               # Full gauge list
│   ├── favorites.tsx            # Manage favorites
│   ├── notifications.tsx        # Notification settings
│   └── about.tsx                # About screen
├── src/
│   ├── api/
│   │   └── client.ts
│   ├── components/
│   │   ├── SplashScreen.tsx
│   │   ├── common/
│   │   ├── map/
│   │   ├── gauges/
│   │   └── charts/
│   ├── hooks/
│   ├── store/
│   │   └── useAppStore.ts
│   ├── lib/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── cache-config.ts
│   │   └── staleness.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   └── spacing.ts
│   └── providers/
│       └── QueryProvider.tsx
├── assets/
│   ├── splash.png               # Static splash
│   ├── clermont-digital-logo.png # Animated splash logo
│   └── icon.png                 # App icon
└── app.config.ts
```

---

## MVP vs Post-MVP Scope

### MVP (Target: 6-8 weeks)
- Splash screen with Clermont Digital branding
- Overview screen with favorites + status summary
- Interactive map with gauge markers
- Gauge detail with current readings
- Alerts screen (warnings + road closures)
- Offline data caching (72-hour retention)
- Local notifications for favorites
- Basic settings (favorites, theme)

### Post-MVP Phase 1
- 24-hour water level charts
- Push notifications with backend
- Rain radar overlay
- Background sync

### Post-MVP Phase 2
- Home screen widgets (iOS/Android)
- Location-based features (nearby, geofencing)
- Offline map tiles
- Deep linking

### Post-MVP Phase 3
- iOS Critical Alerts entitlement
- Android Foreground Service
- Advanced analytics
- User accounts for sync

---

## Success Criteria

1. **Offline capable** - Works with 72-hour cached data
2. **Fast startup** - Splash to content < 3 seconds
3. **Emergency ready** - Critical info visible immediately
4. **Battery efficient** - Optimized background refresh
5. **Accessible** - VoiceOver/TalkBack support
6. **Reliable alerts** - Notifications reach users promptly
