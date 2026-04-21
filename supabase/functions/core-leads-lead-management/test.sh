#!/bin/bash
# Test function (production)
# Usage: ./test.sh

echo "🧪 Testing Function: core-leads-lead-management (Production)"
echo "============================================================"
echo ""

# Production URL
SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_URL="$SUPABASE_URL/functions/v1/core-leads-lead-management"

# Note: You need to set SUPABASE_ANON_KEY from your .env or config
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

echo "📋 Test 1: Basic GET request"
echo "----------------------------------------"
curl -s -X GET \
  "$FUNCTION_URL?category=Package&includeLeads=true&includeSalesTeam=true&includeUserData=false" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ Success:', data['success'])
    print('📊 Stats:')
    stats = data['data']['stats']
    print(f'   - Total Leads: {stats[\"totalLeads\"]}')
    print(f'   - Assigned: {stats[\"assignedLeads\"]}')
    print(f'   - Unassigned: {stats[\"unassignedLeads\"]}')
    print(f'   - Assignment Rate: {stats[\"assignmentRate\"]:.2f}%')
    print()
    print(f'📋 Leads returned: {len(data[\"data\"][\"leads\"])}')
    print(f'👥 Sales Team returned: {len(data[\"data\"][\"salesTeam\"])}')
    print(f'⏱️ Execution time: {data[\"meta\"][\"executionTime\"]}')
    print()
    if len(data['data']['leads']) > 0:
        print('✅ SUCCESS! Function is returning REAL DATA from production!')
        print(f'📝 Sample lead: {data[\"data\"][\"leads\"][0].get(\"full_name\", \"N/A\")}')
    else:
        print('⚠️  No leads returned - may need to check:')
        print('   - Database has leads with category=Package')
        print('   - RLS policies allow reading')
except Exception as e:
    print('❌ Error:', e)
    print('Raw response:', sys.stdin.read())
" 2>&1

echo ""
echo ""

echo "📋 Test 2: OPTIONS (CORS)"
echo "----------------------------------------"
curl -s -X OPTIONS "$FUNCTION_URL" -v 2>&1 | grep -E "(< HTTP|< access-control)" || echo "CORS headers checked"
echo ""
echo ""

echo "✅ Production testing completed!"
echo ""
echo "💡 Function Dashboard:"
echo "   https://supabase.com/dashboard/project/ttfjapfdzrxmbxbarfbn/functions/core-leads-lead-management"

