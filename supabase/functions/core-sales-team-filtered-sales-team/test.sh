#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="core-sales-team-filtered-sales-team"
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

# Test 1: GET request with role=sale_package
echo -e "${YELLOW}Test 1: GET request with role=sale_package${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?role=sale_package")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

if [ "$HTTP_CODE1" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE1}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY1" | python3 -m json.tool 2>/dev/null | head -50 || echo "$BODY1"
  else
    echo "$BODY1" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE1}${NC}"
  echo "$BODY1"
fi
echo ""

# Test 2: GET request with role=sale_wholesale
echo -e "${YELLOW}Test 2: GET request with role=sale_wholesale${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?role=sale_wholesale")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

if [ "$HTTP_CODE2" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE2}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY2" | python3 -m json.tool 2>/dev/null | head -50 || echo "$BODY2"
  else
    echo "$BODY2" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE2}${NC}"
  echo "$BODY2"
fi
echo ""

# Test 3: GET request with roles parameter (comma-separated)
echo -e "${YELLOW}Test 3: GET request with roles=sale_package,manager_sale${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?roles=sale_package,manager_sale")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

if [ "$HTTP_CODE3" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE3}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY3" | python3 -m json.tool 2>/dev/null | head -50 || echo "$BODY3"
  else
    echo "$BODY3" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE3}${NC}"
  echo "$BODY3"
fi
echo ""

# Test 4: GET request without role/roles (should return 400)
echo -e "${YELLOW}Test 4: GET request without role/roles (should return 400)${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}")
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

if [ "$HTTP_CODE4" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE4} (Bad Request as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE4} (Expected 400)${NC}"
  echo "$BODY4"
fi
echo ""

# Test 5: GET request with invalid role (should return 400)
echo -e "${YELLOW}Test 5: GET request with invalid role (should return 400)${NC}"
RESPONSE5=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?role=invalid_role")
HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)
BODY5=$(echo "$RESPONSE5" | head -n-1)

if [ "$HTTP_CODE5" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE5} (Bad Request as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE5} (Expected 400)${NC}"
  echo "$BODY5"
fi
echo ""

# Test 6: OPTIONS request (CORS preflight)
echo -e "${YELLOW}Test 6: OPTIONS request (CORS preflight)${NC}"
RESPONSE6=$(curl -s -w "\n%{http_code}" -X OPTIONS "${FUNCTION_URL}" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET")
HTTP_CODE6=$(echo "$RESPONSE6" | tail -n1)

if [ "$HTTP_CODE6" == "200" ]; then
  echo -e "${GREEN}✅ CORS preflight: ${HTTP_CODE6}${NC}"
  echo "$RESPONSE6" | head -n-1
else
  echo -e "${RED}❌ CORS preflight: ${HTTP_CODE6}${NC}"
fi
echo ""

# Test 7: POST method (should return 405)
echo -e "${YELLOW}Test 7: POST method (should return 405 Method Not Allowed)${NC}"
RESPONSE7=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}?role=sale_package" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE7=$(echo "$RESPONSE7" | tail -n1)
BODY7=$(echo "$RESPONSE7" | head -n-1)

if [ "$HTTP_CODE7" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE7} (Method Not Allowed as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE7} (Expected 405)${NC}"
  echo "$BODY7"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"

