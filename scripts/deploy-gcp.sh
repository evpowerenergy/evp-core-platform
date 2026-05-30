#!/usr/bin/env bash
# Deploy Frontend ไป GCP Cloud Run
# ใช้: จาก root โปรเจกต์รัน ./scripts/deploy-gcp.sh
# หรือจาก scripts/: ./deploy-gcp.sh (จะ cd ไป root อัตโนมัติ)
# ต้องมีไฟล์ .env.cloudrun ที่ root โปรเจกต์ (export VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY)

set -e

# หา root โปรเจกต์ (โฟลเดอร์ที่มี Dockerfile และ cloudbuild.yaml)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f Dockerfile || ! -f cloudbuild.yaml ]]; then
  echo "❌ ไม่พบ Dockerfile หรือ cloudbuild.yaml — กรุณารันจาก root โปรเจกต์ (ev-power-energy-crm)"
  exit 1
fi

ENV_FILE=".env.cloudrun"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ ไม่พบไฟล์ $ENV_FILE"
  echo "   สร้างที่ root โปรเจกต์และใส่:"
  echo "   export VITE_SUPABASE_URL=\"https://xxxxx.supabase.co\""
  echo "   export VITE_SUPABASE_ANON_KEY=\"your_anon_key\""
  exit 1
fi

# โหลด env (อนุญาต override PROJECT_ID, REGION จาก environment ได้)
source "$ENV_FILE"

PROJECT_ID="${PROJECT_ID:-ev-power-energy-prod}"
REGION="${REGION:-asia-southeast1}"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/ev-power-energy-prod/frontend:latest"
SERVICE_NAME="${GCP_RUN_SERVICE_NAME:-ev-power-crm-frontend}"

if [[ -z "$VITE_SUPABASE_URL" || -z "$VITE_SUPABASE_ANON_KEY" ]]; then
  echo "❌ ใน $ENV_FILE ต้องมี VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY"
  exit 1
fi

echo "📦 Project: $PROJECT_ID | Region: $REGION"
echo "🖼  Image:  $IMAGE"
echo "🚀 Service: $SERVICE_NAME"
echo ""

# Resolve gcloud (บาง shell เช่นใน IDE ไม่โหลด PATH ของ Cloud SDK)
if [[ -n "${GCLOUD_BIN:-}" && -x "${GCLOUD_BIN}" ]]; then
  export PATH="$(dirname "${GCLOUD_BIN}"):${PATH}"
elif ! command -v gcloud &>/dev/null; then
  for _g in \
    "${HOME}/google-cloud-sdk/bin/gcloud" \
    "/opt/homebrew/bin/gcloud" \
    "/usr/local/bin/gcloud" \
    "/usr/local/google-cloud-sdk/bin/gcloud"; do
    if [[ -x "$_g" ]]; then
      export PATH="$(dirname "$_g"):${PATH}"
      break
    fi
  done
fi
if ! command -v gcloud &>/dev/null; then
  echo "❌ ไม่พบคำสั่ง gcloud"
  echo "   ติดตั้ง SDK: https://cloud.google.com/sdk/docs/install"
  echo "   หรือรันใน Terminal ที่ล็อกอิน gcloud แล้ว หรือตั้ง export GCLOUD_BIN=\$HOME/google-cloud-sdk/bin/gcloud"
  exit 127
fi

# ตั้งโปรเจกต์
gcloud config set project "$PROJECT_ID" --quiet

echo "🔨 Building image (Cloud Build)..."
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_IMAGE="$IMAGE",_VITE_SUPABASE_URL="$VITE_SUPABASE_URL",_VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY"

echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --port 8080 \
  --no-invoker-iam-check

echo ""
echo "✅ Deploy เสร็จแล้ว — เปิด Service URL ด้านบนในเบราว์เซอร์"
