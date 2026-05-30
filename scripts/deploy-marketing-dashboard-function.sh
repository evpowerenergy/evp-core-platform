#!/usr/bin/env bash
# Deploy marketing-dashboard-summary Edge Function to Supabase
# Prerequisites: supabase login OR export SUPABASE_ACCESS_TOKEN=...
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_REF="${SUPABASE_PROJECT_REF:-ttfjapfdzrxmbxbarfbn}"
FUNCTION_NAME="marketing-dashboard-summary"

echo "Deploying $FUNCTION_NAME to project $PROJECT_REF ..."

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
else
  SUPABASE_CMD=(npx --yes supabase)
fi

"${SUPABASE_CMD[@]}" functions deploy "$FUNCTION_NAME" \
  --no-verify-jwt \
  --project-ref "$PROJECT_REF"

echo "Done. Smoke test:"
echo "  curl -X POST \"https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}\" \\"
echo "    -H \"Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"startDate\":\"2026-03-30\",\"endDate\":\"2026-03-30\"}'"
