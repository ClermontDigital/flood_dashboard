#!/usr/bin/env bash
# Upload a picture for a community camera, e.g. one sent over Messenger.
#
#   scripts/upload-camera-image.sh <camera-id> <image.jpg> "<taken at, AEST>"
#   scripts/upload-camera-image.sh clermont-weir ~/Downloads/download.jpg "2026-10-24 18:45:29"
#
# Messenger strips photo metadata, so pass the time shown in the picture's overlay (AEST).
# Needs gcloud access to the GAUGE project (reads the upload key from Secret Manager).
set -euo pipefail

CAMERA_ID="${1:?camera id, e.g. clermont-weir}"
IMAGE="${2:?path to a JPEG}"
TAKEN_LOCAL="${3:?time shown on the picture, e.g. \"2026-10-24 18:45:29\"}"
PROJECT="clermontdigital-1741262269603"
ACCOUNT="${GCLOUD_ACCOUNT:-developersteve@thecoochin.co}"

# AEST is UTC+10 all year (Queensland has no daylight saving)
TAKEN_AT="$(date -j -u -v-10H -f '%Y-%m-%d %H:%M:%S' "$TAKEN_LOCAL" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
  || date -u -d "$TAKEN_LOCAL +1000" '+%Y-%m-%dT%H:%M:%SZ')"

KEY="$(gcloud secrets versions access latest --secret=gauge-camera-upload-key --project="$PROJECT" --account="$ACCOUNT")"
curl -sS -X POST "https://gauge.clermont.digital/api/cameras/${CAMERA_ID}/upload" \
  -H "x-camera-key: ${KEY}" \
  -H "Content-Type: image/jpeg" \
  -H "x-taken-at: ${TAKEN_AT}" \
  --data-binary @"${IMAGE}"
echo
echo "Check: https://gauge.clermont.digital/camera/${CAMERA_ID}"
