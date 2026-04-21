#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="additional-customer-customer-service-mutations"
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
  echo -e "${YELLOW}⚠️  Note: POST mutations require authentication (JWT token)${NC}"
  echo -e "${YELLOW}⚠️  Without auth, will test error handling and method validation${NC}"
  echo ""
fi

echo "Function URL: ${FUNCTION_URL}"
echo ""

# Test 1: POST request without action (should return 400)
echo -e "${YELLOW}Test 1: POST request without action (should return 400)${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{}')
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

# Test 2: POST request with invalid action (should return 400)
echo -e "${YELLOW}Test 2: POST request with invalid action (should return 400)${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action": "invalidAction"}')
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

if [ "$HTTP_CODE2" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE2} (Bad Request as expected)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY2" | python3 -m json.tool 2>/dev/null || echo "$BODY2"
  else
    echo "$BODY2"
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE2} (Expected 400)${NC}"
  echo "$BODY2"
fi
echo ""

# Test 3: POST createCustomerService without data (should return 400)
echo -e "${YELLOW}Test 3: POST createCustomerService without data (should return 400)${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action": "createCustomerService"}')
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

if [ "$HTTP_CODE3" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE3} (Bad Request as expected)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY3" | python3 -m json.tool 2>/dev/null || echo "$BODY3"
  else
    echo "$BODY3"
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE3} (Expected 400)${NC}"
  echo "$BODY3"
fi
echo ""

# Test 4: POST updateCustomerService without id (should return 400)
echo -e "${YELLOW}Test 4: POST updateCustomerService without id (should return 400)${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action": "updateCustomerService", "data": {}}')
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

if [ "$HTTP_CODE4" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE4} (Bad Request as expected)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY4" | python3 -m json.tool 2>/dev/null || echo "$BODY4"
  else
    echo "$BODY4"
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE4} (Expected 400)${NC}"
  echo "$BODY4"
fi
echo ""

# Test 5: POST deleteCustomerService without id (should return 400)
echo -e "${YELLOW}Test 5: POST deleteCustomerService without id (should return 400)${NC}"
RESPONSE5=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action": "deleteCustomerService"}')
HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)
BODY5=$(echo "$RESPONSE5" | head -n-1)

if [ "$HTTP_CODE5" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE5} (Bad Request as expected)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY5" | python3 -m json.tool 2>/dev/null || echo "$BODY5"
  else
    echo "$BODY5"
  fi
else
  echo -e "${RED}❌ Status: ${HTTP_CODE5} (Expected 400)${NC}"
  echo "$BODY5"
fi
echo ""

# Test 6: GET method (should return 405)
echo -e "${YELLOW}Test 6: GET method (should return 405 Method Not Allowed)${NC}"
RESPONSE6=$(curl -s -w "\n%{http_code}" -X GET "${FUNCTION_URL}")
HTTP_CODE6=$(echo "$RESPONSE6" | tail -n1)
BODY6=$(echo "$RESPONSE6" | head -n-1)

if [ "$HTTP_CODE6" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE6} (Method Not Allowed as expected)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE6} (Expected 405)${NC}"
  echo "$BODY6"
fi
echo ""

# Test 7: OPTIONS request (CORS preflight)
echo -e "${YELLOW}Test 7: OPTIONS request (CORS preflight)${NC}"
RESPONSE7=$(curl -s -w "\n%{http_code}" -X OPTIONS "${FUNCTION_URL}" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST")
HTTP_CODE7=$(echo "$RESPONSE7" | tail -n1)

if [ "$HTTP_CODE7" == "200" ]; then
  echo -e "${GREEN}✅ CORS preflight: ${HTTP_CODE7}${NC}"
  echo "$RESPONSE7" | head -n-1
else
  echo -e "${RED}❌ CORS preflight: ${HTTP_CODE7}${NC}"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Note: For full testing with valid mutations, you need:${NC}"
echo -e "${YELLOW}  1. Valid JWT token from Supabase auth${NC}"
echo -e "${YELLOW}  2. Valid data for createCustomerService${NC}"
echo -e "${YELLOW}  3. Valid id and data for updateCustomerService${NC}"
echo -e "${YELLOW}  4. Valid id for deleteCustomerService${NC}"

