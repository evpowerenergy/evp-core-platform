#!/bin/bash
# Test Google Ads Refresh Token
# ใช้สำหรับตรวจสอบว่า Refresh Token ยังใช้ได้หรือไม่

echo "🔍 Testing Google Ads Refresh Token..."
echo ""

# Read from .env
source .env

# Test token refresh
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$VITE_GOOGLE_ADS_CLIENT_ID" \
  -d "client_secret=$VITE_GOOGLE_ADS_CLIENT_SECRET" \
  -d "refresh_token=$VITE_GOOGLE_ADS_REFRESH_TOKEN" \
  -d "grant_type=refresh_token")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE:")

echo "HTTP Status Code: $http_code"
echo ""

if [ "$http_code" == "200" ]; then
  echo "✅ SUCCESS: Refresh token is valid!"
  echo ""
  echo "Response:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo "❌ ERROR: Refresh token is invalid or expired!"
  echo ""
  echo "Response:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo ""
  echo "💡 Solution: Generate a new refresh token using OAuth 2.0 Playground"
  echo "   URL: https://developers.google.com/oauthplayground/"
  echo ""
  echo "📖 Read more: docs/GOOGLE_ADS_ERROR_400_FIX.md"
fi

