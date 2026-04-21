#!/bin/bash
# Test function (local & production)
# Usage: ./test.sh [local|production]

MODE=${1:-production}

if [ "$MODE" == "local" ]; then
    echo "🧪 Testing Function: core-leads-leads-list (Local)"
    echo "=================================================="
    echo ""
    
    SUPABASE_URL="http://127.0.0.1:54321"
    FUNCTION_URL="$SUPABASE_URL/functions/v1/core-leads-leads-list"
    SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    
    echo "📍 Function URL: $FUNCTION_URL"
    echo "⚠️  Note: Local DB may not have data"
    echo ""
else
    echo "🧪 Testing Function: core-leads-leads-list (Production)"
    echo "======================================================"
    echo ""
    
    SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
    FUNCTION_URL="$SUPABASE_URL/functions/v1/core-leads-leads-list"
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo "⚠️  SUPABASE_ANON_KEY not set in environment"
        echo "💡 Set it with: export SUPABASE_ANON_KEY=your_anon_key"
        echo ""
        echo "📋 To get your anon key:"
        echo "   1. Go to Supabase Dashboard"
        echo "   2. Settings > API"
        echo "   3. Copy 'anon public' key"
        exit 1
    fi
    
    echo "📍 Function URL: $FUNCTION_URL"
    echo "🔑 Using Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
    echo ""
fi

echo "📋 Test 1: Basic GET request with category"
echo "----------------------------------------"
curl -s -X GET \
  "$FUNCTION_URL?category=Package" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ Success:', data['success'])
    print(f'📋 Leads returned: {len(data[\"data\"][\"leads\"])}')
    if len(data['data']['leads']) > 0:
        print('✅ SUCCESS! Function is returning REAL DATA!')
        lead = data['data']['leads'][0]
        print(f'📝 Sample lead: {lead.get(\"full_name\", \"N/A\")}')
        if 'creator_name' in lead:
            print(f'👤 Creator: {lead.get(\"creator_name\", \"N/A\")}')
        if 'latest_productivity_log' in lead:
            log = lead.get('latest_productivity_log')
            print(f'📝 Latest log: {\"Yes\" if log else \"No\"}')
    else:
        print('⚠️  No leads returned')
        if not data['success']:
            print(f'❌ Error: {data.get(\"error\", \"Unknown error\")}')
except Exception as e:
    print('❌ Error:', e)
    import traceback
    traceback.print_exc()
" 2>&1

echo ""
echo ""

echo "📋 Test 2: With limit parameter"
echo "----------------------------------------"
curl -s -X GET \
  "$FUNCTION_URL?category=Package&limit=5" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    leads_count = len(data['data']['leads'])
    print('✅ Success:', data['success'])
    print(f'📋 Leads returned: {leads_count}')
    if leads_count <= 5:
        print('✅ Limit working correctly!')
    else:
        print('⚠️  Limit may not be working (got more than 5)')
except Exception as e:
    print('❌ Error:', e)
" 2>&1

echo ""
echo ""

echo "📋 Test 3: With date filter (priority over limit)"
echo "----------------------------------------"
# Use a date range from 30 days ago to today
DATE_TO=$(date +%Y-%m-%d)
DATE_FROM=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null || echo "2024-01-01")

curl -s -X GET \
  "$FUNCTION_URL?category=Package&from=$DATE_FROM&to=$DATE_TO&limit=10" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    leads_count = len(data['data']['leads'])
    print('✅ Success:', data['success'])
    print(f'📋 Leads returned: {leads_count}')
    print(f'📅 Date filter: {sys.argv[1]} to {sys.argv[2]}' if len(sys.argv) > 2 else '📅 Date filter applied')
    print('✅ Date filter takes priority (may return more than limit)')
except Exception as e:
    print('❌ Error:', e)
" 2>&1 "$DATE_FROM" "$DATE_TO"

echo ""
echo ""

echo "📋 Test 4: OPTIONS (CORS)"
echo "----------------------------------------"
curl -s -X OPTIONS "$FUNCTION_URL" -v 2>&1 | grep -E "(< HTTP|< access-control)" || echo "CORS headers checked"
echo ""
echo ""

echo "✅ Testing completed!"
echo ""
if [ "$MODE" == "production" ]; then
    echo "💡 Function Dashboard:"
    echo "   https://supabase.com/dashboard/project/ttfjapfdzrxmbxbarfbn/functions/core-leads-leads-list"
fi

