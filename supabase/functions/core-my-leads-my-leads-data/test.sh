#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="core-my-leads-my-leads-data"
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
echo -e "${YELLOW}⚠️  Note: This function requires a valid userId parameter${NC}"
echo ""

# Test 1: GET request without userId (should return 400)
echo -e "${YELLOW}Test 1: GET request without userId (should return 400)${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

if [ "$HTTP_CODE1" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE1} (Bad Request as expected)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY1" | python3 -m json.tool 2>/dev/null || echo "$BODY1"
  else
    echo "$BODY1"
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE1} (Expected 400)${NC}"
  echo "$BODY1"
fi
echo ""

# Test 2: GET request with userId but invalid (should return 200 with empty data)
echo -e "${YELLOW}Test 2: GET request with invalid userId (userId=invalid-test-id, category=Package)${NC}"
echo -e "${YELLOW}Expected: 200 with empty leads array${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?userId=invalid-test-id&category=Package")
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

# Test 3: GET request with valid userId format (use example UUID)
echo -e "${YELLOW}Test 3: GET request with valid userId format (userId=7231bda2-4d51-4592-8607-fe94a590aba7, category=Package)${NC}"
echo -e "${YELLOW}Expected: 200 with leads data (if user exists)${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?userId=7231bda2-4d51-4592-8607-fe94a590aba7&category=Package")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

if [ "$HTTP_CODE3" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE3}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY3" | python3 -m json.tool 2>/dev/null | head -100 || echo "$BODY3"
  else
    echo "$BODY3" | head -100
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE3}${NC}"
  echo "$BODY3"
fi
echo ""

# Test 4: GET request with category=Wholesales
echo -e "${YELLOW}Test 4: GET request with category=Wholesales (userId=7231bda2-4d51-4592-8607-fe94a590aba7)${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?userId=7231bda2-4d51-4592-8607-fe94a590aba7&category=Wholesales")
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

if [ "$HTTP_CODE4" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE4}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY4" | python3 -m json.tool 2>/dev/null | head -50 || echo "$BODY4"
  else
    echo "$BODY4" | head -50
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE4}${NC}"
  echo "$BODY4"
fi
echo ""

# Test 5: OPTIONS request (CORS preflight)
echo -e "${YELLOW}Test 5: OPTIONS request (CORS preflight)${NC}"
RESPONSE5=$(curl -s -w "\n%{http_code}" -X OPTIONS "${FUNCTION_URL}" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET")
HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)

if [ "$HTTP_CODE5" == "200" ]; then
  echo -e "${GREEN}✅ CORS preflight: ${HTTP_CODE5}${NC}"
  echo "$RESPONSE5" | head -n-1
else
  echo -e "${RED}❌ CORS preflight: ${HTTP_CODE5}${NC}"
fi
echo ""

# Test 6: POST method (should return 405)
echo -e "${YELLOW}Test 6: POST method (should return 405 Method Not Allowed)${NC}"
RESPONSE6=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE6=$(echo "$RESPONSE6" | tail -n1)
BODY6=$(echo "$RESPONSE6" | head -n-1)

if [ "$HTTP_CODE6" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE6} (Method Not Allowed as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE6} (Expected 405)${NC}"
  echo "$BODY6"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"

