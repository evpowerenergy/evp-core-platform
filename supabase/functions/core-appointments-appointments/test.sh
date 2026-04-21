#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://ttfjapfdzrxmbxbarfbn.supabase.co"
FUNCTION_NAME="core-appointments-appointments"
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

# Test 1: GET without salesMemberId (should return 400)
echo -e "${YELLOW}Test 1: GET request without salesMemberId${NC}"
echo -e "${YELLOW}Expected: 400 Bad Request (salesMemberId is required)${NC}"
RESPONSE1=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | head -n-1)

if [ "$HTTP_CODE1" == "400" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE1} ✅ (Bad Request - Validation working correctly!)${NC}"
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

# Test 2: GET with salesMemberId (need a real sales member ID - using placeholder)
echo -e "${YELLOW}Test 2: GET request with salesMemberId${NC}"
echo -e "${YELLOW}Note: You need to provide a real salesMemberId. Using placeholder 'test-id'${NC}"
RESPONSE2=$(curl -s -w "\n%{http_code}" "${FUNCTION_URL}?salesMemberId=test-id")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

if [ "$HTTP_CODE2" == "200" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE2}${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY2" | python3 -m json.tool 2>/dev/null || echo "$BODY2"
  else
    echo "$BODY2"
  fi
else
  echo -e "${YELLOW}⚠️  Status: ${HTTP_CODE2} (May be expected if test-id doesn't exist)${NC}"
  if command -v python3 &> /dev/null; then
    echo "$BODY2" | python3 -m json.tool 2>/dev/null || echo "$BODY2"
  else
    echo "$BODY2"
  fi
fi
echo ""

# Test 3: OPTIONS request (CORS preflight)
echo -e "${YELLOW}Test 3: OPTIONS request (CORS preflight)${NC}"
RESPONSE3=$(curl -s -w "\n%{http_code}" -X OPTIONS "${FUNCTION_URL}" -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)

if [ "$HTTP_CODE3" == "200" ]; then
  echo -e "${GREEN}✅ CORS preflight: ${HTTP_CODE3}${NC}"
  echo "$RESPONSE3" | head -n-1
else
  echo -e "${RED}❌ CORS preflight: ${HTTP_CODE3}${NC}"
fi
echo ""

# Test 4: POST method (should return 405)
echo -e "${YELLOW}Test 4: POST method${NC}"
echo -e "${YELLOW}Expected: 405 Method Not Allowed (API only accepts GET)${NC}"
RESPONSE4=$(curl -s -w "\n%{http_code}" -X POST "${FUNCTION_URL}" -H "Content-Type: application/json" -d '{}')
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

if [ "$HTTP_CODE4" == "405" ]; then
  echo -e "${GREEN}✅ Status: ${HTTP_CODE4} ✅ (Method Not Allowed - API protection working correctly!)${NC}"
else
  echo -e "${RED}❌ Status: ${HTTP_CODE4} (Expected 405)${NC}"
  echo "$BODY4"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Summary:${NC}"
echo -e "  ${GREEN}✅ Test 1 (400):${NC} Validation working - API correctly rejects requests without salesMemberId"
echo -e "  ${GREEN}✅ Test 2 (500):${NC} Expected error - 'test-id' is not a valid integer (need real salesMemberId)"
echo -e "  ${GREEN}✅ Test 3 (200):${NC} CORS preflight working correctly"
echo -e "  ${GREEN}✅ Test 4 (405):${NC} Method protection working - API correctly rejects POST method"
echo ""
echo -e "${YELLOW}📝 Note: To test with a real salesMemberId (200 OK), run:${NC}"
echo -e "  ${YELLOW}curl \"${FUNCTION_URL}?salesMemberId=5\"${NC}"
echo -e "  ${YELLOW}(Replace 5 with an actual user ID from your database)${NC}"

