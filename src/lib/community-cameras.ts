// Community cameras, curated by hand. A camera is only added here after it has been checked
// (location, what it shows, owner's consent and credit wording).
//
// visibility:
//   public   - on the map and in /api/cameras
//   unlisted - not on the map, but /camera/<id> works (for previewing with the camera owner)
//   hidden   - nowhere (testing); the image endpoint also refuses it
//
// The latest picture for each camera is stored in Firestore (see camera-store.ts) and is
// uploaded through POST /api/cameras/<id>/upload.

export type CameraVisibility = 'public' | 'unlisted' | 'hidden'

export interface CommunityCameraConfig {
  id: string          // Also the share link: /camera/<id>
  name: string
  lat: number
  lng: number
  donor: string       // Shown as "Camera courtesy of …" (agreed with the owner)
  intervalMin: number // Expected minutes between pictures
  visibility: CameraVisibility
}

export const COMMUNITY_CAMERAS: CommunityCameraConfig[] = [
  {
    id: 'clermont-weir',
    name: 'Clermont Weir (Sandy Creek Weir)',
    // Weir on Sandy Creek in Clermont (OpenStreetMap node 1982839086); confirm with the owner
    lat: -22.82069,
    lng: 147.62731,
    donor: 'K Burns',
    intervalMin: 15,
    visibility: 'unlisted',
  },
]

export function getCommunityCameraConfig(id: string): CommunityCameraConfig | undefined {
  return COMMUNITY_CAMERAS.find((c) => c.id === id)
}
