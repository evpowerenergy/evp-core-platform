#!/usr/bin/env bash
# Deploy my-leads Edge Functions (ใช้ RPC get_latest_productivity_logs_for_leads)
# Prerequisites: supabase login OR export SUPABASE_ACCESS_TOKEN=...
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_REF="${SUPABASE_PROJECT_REF:-ttfjapfdzrxmbxbarfbn}"
FUNCTIONS=(
  "core-my-leads-my-leads"
  "core-my-leads-my-leads-data"
)

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
else
  SUPABASE_CMD=(npx --yes supabase)
fi

echo "Deploying my-leads functions to project $PROJECT_REF ..."

for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
  echo ""
  echo "==> Deploying $FUNCTION_NAME"
  "${SUPABASE_CMD[@]}" functions deploy "$FUNCTION_NAME" \
    --no-verify-jwt \
    --project-ref "$PROJECT_REF"
done

echo ""
echo "Done. Deployed:"
for FUNCTION_NAME in "${FUNCTIONS[@]}"; do
  echo "  - https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"
done
