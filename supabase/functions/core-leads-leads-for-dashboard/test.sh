#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="core-leads-leads-for-dashboard"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}"

echo -e "${YELLOW}🧪 Testing ${FUNCTION_NAME} Edge Function${NC}"
echo ""

# Test mode (local or production)
MODE=${1:-production}

if [ "$MODE" == "local" ]; then
  echo -e "${YELLOW}📡 Using LOCAL Supabase instance${NC}"
  SUPABASE_URL="http://127.0.0.1:54321"
  FUNCTION_URL="${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}"
  
  # Check if local Supabase is running
  if ! curl -s "${SUPABASE_URL}/rest/v1/" > /dev/null 2>&1; then
    echo -e "${RED}❌ Local Supabase is not running. Please run 'supabase start' first.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}📡 Using PRODUCTION Supabase instance${NC}"
fi

echo "Function URL: ${FUNCTION_URL}"
echo ""

# Test 1: Basic GET request (no parameters - default limit=5000)
echo -e "${YELLOW}Test 1: GET request (no parameters - default limit=5000)${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

if [ "$HTTP_CODE1" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE1}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY1" | python3 -m json.tool 2>/dev/null | head -80 || echo "$BODY1"
  else
    echo "$BODY1" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE1}${NC}"
  echo "$BODY1"
fi
echo ""

# Test 2: GET with date filter (priority over limit)
echo -e "${YELLOW}Test 2: GET request with date filter (from=2024-01-01&to=2024-12-31) - should not apply limit${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?from=2024-01-01&to=2024-12-31")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

if [ "$HTTP_CODE2" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE2}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY2" | python3 -m json.tool 2>/dev/null | head -80 || echo "$BODY2"
  else
    echo "$BODY2" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE2}${NC}"
  echo "$BODY2"
fi
echo ""

# Test 3: GET with limit parameter (when no date filter)
echo -e "${YELLOW}Test 3: GET request with limit=10 (no date filter)${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?limit=10")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

if [ "$HTTP_CODE3" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE3}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY3" | python3 -m json.tool 2>/dev/null | head -80 || echo "$BODY3"
  else
    echo "$BODY3" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE3}${NC}"
  echo "$BODY3"
fi
echo ""

# Test 4: OPTIONS request (CORS preflight)
echo -e "${YELLOW}Test 4: OPTIONS request (CORS preflight)${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" -X OPTIONS "${FUNCTION_URL}" -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET")
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)

if [ "$HTTP_CODE4" == "200" ]; then
  echo -e "${GREEN}✅ CORS preflight: ${HTTP_CODE4}${NC}"
  echo "$RESPONSE4" | head -n-1
else
  echo -e "${RED}❌ CORS preflight: ${HTTP_CODE4}${NC}"
fi
echo ""

# Test 5: POST method (should return 405)
echo -e "${YELLOW}Test 5: POST method (should return 405 Method Not Allowed)${NC}"
RESPONSE5=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" -H "Content-Type: application/json" -d '{}')
HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)
BODY5=$(echo "$RESPONSE5" | head -n-1)

if [ "$HTTP_CODE5" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE5} (Method Not Allowed as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE5} (Expected 405)${NC}"
  echo "$BODY5"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"

