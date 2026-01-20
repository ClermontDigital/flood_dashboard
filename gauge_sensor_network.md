# Community Flood Monitoring - React Native Mobile App

## Overview

Extend the GAUGE Queensland Flood Dashboard with a **React Native mobile app** for Central Queensland communities to report flood conditions. The app will leverage **on-device AI and phone sensors** for smart flood detection without requiring constant internet connectivity.

### Target Region: Central Queensland
- Fitzroy Basin (Rockhampton, Emerald, Blackwater)
- Isaac Region (Clermont, Moranbah, Dysart)
- Mackay-Whitsunday hinterland
- Dawson/Callide valleys

---

## Part 1: On-Device AI & Sensor Intelligence

### 1.1 On-Device Image Analysis (TensorFlow Lite)

Use TensorFlow Lite models running directly on the phone to analyze flood photos **without internet**:

**Flood Detection Model:**
```
Input: Camera photo
Output:
  - isFloodDetected: boolean
  - waterCoverage: 'none' | 'partial' | 'significant' | 'severe'
  - confidenceScore: 0-1
  - detectedObjects: ['road', 'water', 'vehicle', 'debris', 'bridge']
```

**React Native Libraries:**
- `@tensorflow/tfjs-react-native` - TensorFlow.js for React Native
- `expo-camera` - Camera access with frame processing
- `react-native-vision-camera` - Alternative with frame processors

**Pre-trained Models to Fine-tune:**
- MobileNetV3 (image classification) - lightweight, fast
- EfficientDet-Lite (object detection) - detects water, roads, vehicles
- Custom flood model trained on CQ flood imagery

**On-Device Capabilities:**
| Feature | Model | Size | Inference Time |
|---------|-------|------|----------------|
| Flood presence | MobileNetV3 | ~5MB | <100ms |
| Water level estimate | Custom CNN | ~10MB | <200ms |
| Road visibility | EfficientDet-Lite | ~15MB | <300ms |

---

### 1.2 Phone Sensor Intelligence

Modern smartphones have sensors that can help assess flood conditions:

**Barometer (Pressure Sensor):**
- Detect rapid pressure drops indicating storm systems
- Correlate with BOM radar data when online
- Trigger "storm approaching" alerts

**GPS + Altitude:**
- Track elevation relative to known flood levels
- Warn user if entering flood-prone low areas
- Calculate distance to nearest high ground

**Accelerometer + Gyroscope:**
- Detect if vehicle is stationary on flooded road
- Identify erratic movement patterns (car in water)
- Auto-trigger emergency mode if phone detects crash + water

**Ambient Light Sensor:**
- Adjust camera settings for murky/rainy conditions
- Detect night-time flooding for appropriate photo modes

**React Native Sensor Libraries:**
```javascript
// Recommended packages
import { Barometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
```

---

### 1.3 Smart Photo Capture Assistant

Guide users to take useful flood photos with on-device analysis:

```
┌─────────────────────────────────────┐
│  FLOOD PHOTO ASSISTANT              │
├─────────────────────────────────────┤
│                                     │
│  ✓ Water detected in frame          │
│  ✓ Reference object visible         │
│  ⚠ Try to include road edge         │
│  ✓ Good lighting                    │
│                                     │
│  Estimated water depth: 40-60cm     │
│  Confidence: 78%                    │
│                                     │
│  [Capture]  [Retake]                │
└─────────────────────────────────────┘
```

**Features:**
- Real-time frame analysis while composing shot
- Prompts user to include reference objects (road signs, fence posts)
- Auto-estimates water depth from known object sizes
- Validates photo quality before submission

---

## Part 2: React Native Mobile App Architecture

### Tech Stack

```
React Native + Expo (Managed Workflow)
├── expo-camera          - Photo/video capture
├── expo-location        - GPS with background tracking
├── expo-sensors         - Barometer, accelerometer
├── expo-sqlite          - Offline database
├── expo-file-system     - Photo storage
├── expo-background-fetch - Offline sync
├── expo-notifications   - Push alerts
├── @tensorflow/tfjs-react-native - On-device ML
├── react-native-maps    - Offline map tiles
└── @tanstack/react-query - Data fetching/caching
```

### Core Features

1. **Offline-First Architecture**
   - SQLite local database for all reports
   - Queue system with retry logic
   - Background sync when connectivity returns
   - Pre-cached map tiles for Central QLD region

2. **Smart Report Types**
   - Water level observations (AI-assisted depth estimation)
   - Road flooding/closures with severity
   - Infrastructure damage reports
   - "All Clear" updates when flooding subsides

3. **AI-Powered Photo Capture**
   - On-device flood detection before upload
   - Real-time guidance for useful photos
   - Auto depth estimation from reference objects
   - Works completely offline

4. **Sensor-Enhanced Reporting**
   - Barometric pressure for storm detection
   - GPS elevation for flood risk assessment
   - Accelerometer for vehicle-in-water detection
   - Auto-location with offline fallback

### Report Data Schema

```typescript
interface CommunityFloodReport {
  id: string                    // UUID generated on device
  reporterId: string            // Device fingerprint or user ID
  reportType: 'water_level' | 'road_flooding' | 'infrastructure' | 'all_clear'

  location: {
    lat: number
    lng: number
    altitude: number            // From GPS - useful for flood context
    accuracy: number            // GPS accuracy in meters
    address?: string            // Reverse geocoded when online
    nearestGaugeId?: string     // Link to official GAUGE station
  }

  // AI-enhanced water level data
  waterLevel?: {
    estimatedDepth: number      // meters (AI + user estimate)
    aiConfidence: number        // ML model confidence 0-1
    referencePoint: string      // "knee height", "car bonnet", "fence post"
    trend: 'rising' | 'falling' | 'stable' | 'unknown'
    detectedObjects: string[]   // ['road', 'vehicle', 'sign', 'water']
  }

  roadCondition?: {
    roadName: string
    severity: 'passable_caution' | 'impassable_small' | 'impassable_all' | 'closed'
    waterDepthEstimate: number  // cm
    affectedLength?: number     // meters
    isRoadVisible: boolean      // AI detection - can road edges be seen?
  }

  infrastructure?: {
    type: 'bridge' | 'culvert' | 'levee' | 'erosion' | 'debris' | 'other'
    description: string
    severityRating: 1 | 2 | 3 | 4 | 5
  }

  // On-device sensor data
  sensorData: {
    barometricPressure?: number  // hPa - storm indicator
    pressureTrend?: 'rising' | 'falling' | 'stable'
    batteryLevel: number
    networkType: 'wifi' | 'cellular' | 'offline'
  }

  media: {
    photos: LocalPhoto[]        // Stored locally until sync
    thumbnails: string[]        // Base64 for offline display
  }

  metadata: {
    deviceType: string
    appVersion: string
    submittedAt: string         // Device timestamp
    syncedAt?: string           // Server receive timestamp
    isOfflineSubmission: boolean
    mlModelVersion: string      // Track which AI model was used
  }

  moderation: {
    status: 'pending' | 'approved' | 'flagged' | 'rejected'
    onDeviceScore: number       // AI confidence from phone
    serverScore?: number        // Optional server-side verification
    flags?: string[]            // ["low_confidence", "location_mismatch"]
  }
}

interface LocalPhoto {
  localUri: string              // file:// path on device
  remoteUrl?: string            // Cloud URL after sync
  capturedAt: string
  gpsLat: number
  gpsLng: number
  aiAnalysis: {
    floodDetected: boolean
    waterCoverage: 'none' | 'partial' | 'significant' | 'severe'
    estimatedDepth?: number
    confidence: number
  }
}
```

---

## Part 3: Backend Integration with GAUGE

### New Firestore Collections

```
Firestore Structure (additions):
├── communityReports
│   └── {reportId} (Document)
│       └── ... CommunityFloodReport fields
│
├── communitySensors
│   └── {sensorId} (Document)
│       ├── ... CommunityGaugeReading (latest)
│       └── history: subcollection of readings
│
├── sensorRegistry
│   └── {sensorId} (Document)
│       ├── ownerId: string
│       ├── location: GeoPoint
│       ├── installDate: timestamp
│       ├── calibration: { offset, reference }
│       ├── isVerified: boolean
│       └── status: 'active' | 'offline' | 'decommissioned'
│
└── reporters
    └── {reporterId} (Document)
        ├── trustScore: number (0-100)
        ├── totalReports: number
        ├── verifiedReports: number
        ├── flaggedReports: number
        └── lastActive: timestamp
```

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/community/reports` | GET | List community reports (with filters) |
| `/api/community/reports` | POST | Submit new flood report |
| `/api/community/reports/[id]` | GET | Get single report with media |
| `/api/community/sensors` | GET | List community sensor readings |
| `/api/community/sensors` | POST | Receive IoT sensor data |
| `/api/community/sensors/register` | POST | Register new sensor device |
| `/api/community/moderate` | POST | Admin moderation actions |

### Integration Points in Existing Code

1. **FloodMap.tsx** - Add community report markers
   - New marker layer for community reports
   - Different icons for report types (water level, road, infrastructure)
   - Cluster markers when zoomed out

2. **types.ts** - Add community data types

3. **firestore.ts** - Add community collection helpers

4. **constants.ts** - Add community marker styles/colors

5. **New component: CommunityReportPanel** - Display report details in sidebar

---

## Part 4: Hybrid AI Moderation (On-Device + Server)

### Two-Stage Moderation Pipeline

```
Photo Captured on Phone
        ↓
┌───────────────────────────┐
│  STAGE 1: ON-DEVICE       │
│  (No internet required)   │
├───────────────────────────┤
│  1. TensorFlow Lite       │
│     - Flood detection     │
│     - Water coverage %    │
│     - Object recognition  │
│                           │
│  2. Sensor Validation     │
│     - GPS bounds (CQ)     │
│     - Altitude check      │
│     - Barometer reading   │
│                           │
│  3. Photo Quality         │
│     - Blur detection      │
│     - Lighting check      │
│     - Reference objects   │
│                           │
│  → onDeviceScore: 0-100   │
└───────────┬───────────────┘
            ↓
      Report Queued
            ↓
   (When online syncs...)
            ↓
┌───────────────────────────┐
│  STAGE 2: SERVER-SIDE     │
│  (Optional verification)  │
├───────────────────────────┤
│  1. Duplicate Detection   │
│     - Same location <1km  │
│     - Within 30 minutes   │
│                           │
│  2. Cross-Reference       │
│     - Compare to nearby   │
│       official gauges     │
│     - Check BOM warnings  │
│                           │
│  3. Trust Score           │
│     - User history        │
│     - Device reputation   │
│                           │
│  → serverScore: 0-100     │
└───────────┬───────────────┘
            ↓
┌───────────────────────────┐
│  PUBLISH DECISION         │
├───────────────────────────┤
│  Combined score > 70:     │
│    → Auto-publish         │
│                           │
│  Score 40-70:             │
│    → Publish with flag    │
│                           │
│  Score < 40:              │
│    → Hold for review      │
└───────────────────────────┘
```

### On-Device ML Models

**Model 1: Flood Classifier (MobileNetV3)**
```
Purpose: Binary flood detection
Input: 224x224 RGB image
Output: { isFlood: boolean, confidence: number }
Size: ~5MB
Training: Fine-tune on CQ flood photos + normal road images
```

**Model 2: Water Segmentation (DeepLabV3-Lite)**
```
Purpose: Identify water coverage area
Input: 256x256 RGB image
Output: Segmentation mask + coverage percentage
Size: ~8MB
Training: Flood imagery with water masks
```

**Model 3: Depth Estimator (Custom CNN)**
```
Purpose: Estimate water depth from reference objects
Input: 224x224 image + detected objects
Output: { estimatedDepth: number, confidence: number }
Size: ~10MB
Training: CQ flood images with known depths
```

### Training Data Sources

For Central QLD-specific models:
- Historical flood photos from Rockhampton/Emerald floods
- TMR flood camera archives
- Community-submitted training images (with consent)
- Synthetic data augmentation (water overlays on dry roads)

---

## Part 5: Implementation Phases

### Phase 1: React Native Project Setup
- [ ] Initialize Expo project with TypeScript
- [ ] Configure expo-camera, expo-location, expo-sensors
- [ ] Set up SQLite for offline storage
- [ ] Implement basic navigation structure
- [ ] Create report submission form (without AI)

### Phase 2: On-Device AI Integration
- [ ] Integrate TensorFlow.js React Native
- [ ] Add flood classifier model (MobileNetV3)
- [ ] Build smart camera component with real-time analysis
- [ ] Implement photo quality validation
- [ ] Add depth estimation logic

### Phase 3: Sensor Integration
- [ ] Add barometer monitoring for storm detection
- [ ] Implement GPS tracking with altitude
- [ ] Build flood-risk elevation warnings
- [ ] Create sensor data collection service

### Phase 4: Offline-First Architecture
- [ ] Design SQLite schema for reports
- [ ] Build offline queue with retry logic
- [ ] Implement background sync service
- [ ] Cache map tiles for Central QLD region
- [ ] Add connectivity status indicators

### Phase 5: Backend API (GAUGE Dashboard)
- [ ] Add community types to `types.ts`
- [ ] Create Firestore collections
- [ ] Build `/api/community/reports` endpoints
- [ ] Add community markers to FloodMap
- [ ] Implement server-side moderation checks

### Phase 6: Testing & Launch
- [ ] Beta test with CQ community group
- [ ] Collect training data for model improvement
- [ ] Deploy to TestFlight/Play Store
- [ ] Monitor and refine AI accuracy
- [ ] Launch before wet season (Oct-Nov)

---

## Part 6: Project Structure

### React Native Mobile App (New Project)

```
gauge-community-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx            # Map view with cached tiles
│   │   ├── report.tsx           # New report form
│   │   ├── history.tsx          # User's submitted reports
│   │   └── settings.tsx         # Preferences, sync status
│   ├── camera.tsx               # Smart photo capture
│   └── report/[id].tsx          # Report detail view
├── components/
│   ├── SmartCamera.tsx          # AI-powered camera with guidance
│   ├── FloodAnalysis.tsx        # Display AI analysis results
│   ├── DepthEstimator.tsx       # Water depth estimation UI
│   ├── SensorDisplay.tsx        # Barometer, GPS readouts
│   ├── OfflineIndicator.tsx     # Connection status
│   └── ReportForm/
│       ├── WaterLevelForm.tsx
│       ├── RoadFloodingForm.tsx
│       └── InfrastructureForm.tsx
├── services/
│   ├── database.ts              # SQLite operations
│   ├── sync.ts                  # Background sync service
│   ├── sensors.ts               # Phone sensor monitoring
│   ├── ml/
│   │   ├── floodClassifier.ts   # TFLite flood detection
│   │   ├── waterSegmentation.ts # Water coverage analysis
│   │   └── depthEstimator.ts    # Depth estimation
│   └── api.ts                   # GAUGE backend client
├── assets/
│   ├── models/                  # TFLite model files
│   │   ├── flood_classifier.tflite
│   │   ├── water_segmentation.tflite
│   │   └── depth_estimator.tflite
│   └── tiles/                   # Pre-cached CQ map tiles
├── types/
│   └── index.ts                 # TypeScript interfaces
└── utils/
    ├── location.ts              # GPS helpers
    ├── offline.ts               # Offline detection
    └── compression.ts           # Image compression
```

### GAUGE Dashboard Modifications (Existing Project)

**New Files:**
- `src/lib/types/community.ts` - Community data types
- `src/app/api/community/reports/route.ts` - Reports API
- `src/components/dashboard/CommunityLayer.tsx` - Map markers
- `src/components/dashboard/CommunityReportPanel.tsx` - Details panel

**Modified Files:**
- `src/lib/types.ts` - Export community types
- `src/lib/firestore.ts` - Add community collection
- `src/components/dashboard/FloodMap.tsx` - Add community layer
- `src/lib/constants.ts` - Add CQ-specific marker styles

---

## Part 7: Cost Estimates

### Development
- React Native/Expo: Free (open source)
- TensorFlow.js: Free (open source)
- Model training: Free (local or Google Colab)

### App Store Distribution
- Apple Developer Program: $149 AUD/year
- Google Play Console: $25 USD one-time

### Cloud Services (monthly, moderate usage)
- Firestore: ~$5-20 (depends on report volume)
- Cloud Storage (photos): ~$5-15
- Cloud Run (existing): No additional cost
- **Total: ~$10-35/month**

### Optional Server-Side AI
- Google Cloud Vision: ~$1.50 per 1000 images (only if needed)
- Claude API: ~$3 per 1000 photos (only if needed)

---

## Part 8: Central QLD Specific Considerations

### Pre-Cached Map Coverage
Cache offline map tiles for key flood-prone areas:
- Rockhampton urban + surrounds (50km radius)
- Emerald/Capella/Springsure corridor
- Clermont/Moranbah/Dysart (Isaac region)
- Mackay hinterland creek crossings
- Major highway corridors (Bruce, Capricorn, Peak Downs)

### Known Flood Hotspots
Pre-populate app with CQ flood-prone locations:
- Fitzroy River crossings (Rockhampton, Yaamba)
- Sandy Creek (Clermont)
- Nogoa River crossings (Emerald)
- Connors River (Nebo)
- Isaac River bridges

### Connectivity Zones
- **Good coverage**: Rockhampton, Mackay, Emerald CBD
- **Patchy coverage**: Mining towns, highway corridors
- **Poor coverage**: Western grazing properties, creek crossings

App must handle all these scenarios with offline-first design.

---

## Summary

This plan delivers a **React Native mobile app** for Central Queensland flood reporting with:

1. **On-device AI** - TensorFlow Lite models for flood detection, water coverage analysis, and depth estimation - works completely offline
2. **Smart sensors** - Barometer for storm detection, GPS/altitude for flood risk assessment
3. **Offline-first** - SQLite storage, background sync, cached maps for poor connectivity
4. **AI-powered photos** - Real-time guidance for useful flood photos with auto depth estimation
5. **GAUGE integration** - Reports sync to dashboard when connectivity returns

The hybrid on-device + server moderation ensures reports are validated before display, with most processing happening on the phone to minimize connectivity requirements.
