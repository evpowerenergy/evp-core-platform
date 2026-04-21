#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="additional-customer-customer-services"
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
  echo -e "${YELLOW}⚠️  Note: GET requests require authentication (JWT token)${NC}"
  echo -e "${YELLOW}⚠️  Without auth, will test error handling and method validation${NC}"
  echo ""
fi

echo "Function URL: ${FUNCTION_URL}"
echo ""

# Test 1: GET request (basic - should return data or 401)
echo -e "${YELLOW}Test 1: GET request (basic)${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

if [ "$HTTP_CODE1" == "200" ] || [ "$HTTP_CODE1" == "401" ]; then
  if [ "$HTTP_CODE1" == "401" ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE1} (Unauthorized - expected without auth)${NC}"
  else
    echo -e "${GREEN}✅ Status: ${HTTP_CODE1} (OK)${NC}"
    if command -v python3 &> /dev/null; then
      echo "$BODY1" | python3 -m json.tool 2>/dev/null | head -30 || echo "$BODY1" | head -30
    else
      echo "$BODY1" | head -30
    fi
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE1} (Unexpected)${NC}"
  echo "$BODY1"
fi
echo ""

# Test 2: GET request with search parameter
echo -e "${YELLOW}Test 2: GET request with search parameter${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?search=test")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

if [ "$HTTP_CODE2" == "200" ] || [ "$HTTP_CODE2" == "401" ]; then
  if [ "$HTTP_CODE2" == "401" ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE2} (Unauthorized - expected without auth)${NC}"
  else
    echo -e "${GREEN}✅ Status: ${HTTP_CODE2} (OK)${NC}"
    if command -v python3 &> /dev/null; then
      echo "$BODY2" | python3 -m json.tool 2>/dev/null | head -30 || echo "$BODY2" | head -30
    else
      echo "$BODY2" | head -30
    fi
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE2} (Unexpected)${NC}"
  echo "$BODY2"
fi
echo ""

# Test 3: GET request with id (detail - should return 404 or 401)
echo -e "${YELLOW}Test 3: GET request with id (detail - should return 404 or 401)${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?id=999999")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

if [ "$HTTP_CODE3" == "404" ] || [ "$HTTP_CODE3" == "401" ]; then
  if [ "$HTTP_CODE3" == "401" ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE3} (Unauthorized - expected without auth)${NC}"
  else
    echo -e "${GREEN}✅ Status: ${HTTP_CODE3} (Not Found as expected)${NC}"
  fi
  if command -v python3 &> /dev/null; then
    echo "$BODY3" | python3 -m json.tool 2>/dev/null || echo "$BODY3"
  else
    echo "$BODY3"
  fi
else
  echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE3} (May vary based on data)${NC}"
  echo "$BODY3"
fi
echo ""

# Test 4: GET request with multiple filters
echo -e "${YELLOW}Test 4: GET request with multiple filters${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?province=Bangkok&sale=test&serviceVisit1=true")
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

if [ "$HTTP_CODE4" == "200" ] || [ "$HTTP_CODE4" == "401" ]; then
  if [ "$HTTP_CODE4" == "401" ]; then
    echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE4} (Unauthorized - expected without auth)${NC}"
  else
    echo -e "${GREEN}✅ Status: ${HTTP_CODE4} (OK)${NC}"
    if command -v python3 &> /dev/null; then
      echo "$BODY4" | python3 -m json.tool 2>/dev/null | head -30 || echo "$BODY4" | head -30
    else
      echo "$BODY4" | head -30
    fi
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE4} (Unexpected)${NC}"
  echo "$BODY4"
fi
echo ""

# Test 5: POST method (should return 405)
echo -e "${YELLOW}Test 5: POST method (should return 405 Method Not Allowed)${NC}"
RESPONSE5=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)
BODY5=$(echo "$RESPONSE5" | head -n-1)

if [ "$HTTP_CODE5" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE5} (Method Not Allowed as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE5} (Expected 405)${NC}"
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

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Note: For full testing with valid data, you need:${NC}"
echo -e "${YELLOW}  1. Valid JWT token from Supabase auth${NC}"

