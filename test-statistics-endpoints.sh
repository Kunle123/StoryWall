#!/bin/bash

# Test script for Statistics Timeline API endpoints
# These endpoints require Clerk authentication

# Configuration
BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
CLERK_SESSION_TOKEN="${CLERK_SESSION_TOKEN:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Statistics Timeline API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Base URL: $BASE_URL"
echo ""

# Check if session token is provided
if [ -z "$CLERK_SESSION_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  WARNING: CLERK_SESSION_TOKEN not set${NC}"
  echo "To get a session token:"
  echo "1. Sign in to your app at $BASE_URL"
  echo "2. Open browser DevTools (F12) → Network tab → Click any request → Cookies tab"
  echo "3. Look for one of these cookies and copy its VALUE:"
  echo "   - '_session' (preferred - main session cookie)"
  echo "   - '_session_qxUGuaOM' (environment-specific, if _session doesn't work)"
  echo "   - '__session' (alternative naming)"
  echo "4. Export it: export CLERK_SESSION_TOKEN='your-token-here'"
  echo ""
  echo "For testing without auth, you may need to temporarily disable auth checks in the routes."
  echo ""
fi

# Test 1: Generate Statistics Suggestions
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}TEST 1: Generate Statistics Suggestions${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Endpoint: POST /api/ai/generate-statistics-suggestions"
echo ""

# Try _session cookie (single underscore - most common for Clerk)
# If that doesn't work, try __session (double underscore) or _session_qxUGuaOM
RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/ai/generate-statistics-suggestions" \
  -H "Content-Type: application/json" \
  ${CLERK_SESSION_TOKEN:+-H "Cookie: _session=$CLERK_SESSION_TOKEN"} \
  -d '{
    "measurementQuestion": "Crime in West Midlands"
  }')

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS/d')

echo "Response:"
echo "$BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
echo ""
echo "HTTP Status: $HTTP_STATUS1"
echo ""

if [ "$HTTP_STATUS1" = "200" ]; then
  echo -e "${GREEN}✅ Test 1 PASSED${NC}"
  METRICS=$(echo "$BODY1" | jq -r '.metrics[]' 2>/dev/null | head -3 | tr '\n' ',' | sed 's/,$//')
  DATA_SOURCE=$(echo "$BODY1" | jq -r '.dataSource' 2>/dev/null)
  echo "   Metrics found: $METRICS"
  echo "   Data source: $DATA_SOURCE"
else
  echo -e "${RED}❌ Test 1 FAILED${NC}"
fi

echo ""
echo ""

# Test 2: Generate Statistics Data
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}TEST 2: Generate Statistics Data${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Endpoint: POST /api/ai/generate-statistics-data"
echo ""

# Use metrics from Test 1 if available, otherwise use defaults
if [ -n "$METRICS" ]; then
  METRICS_ARRAY=$(echo "$METRICS" | tr ',' '\n' | sed 's/^/        "/' | sed 's/$/",/' | tr '\n' ' ' | sed 's/, $//')
else
  METRICS_ARRAY='"Violent Crime", "Theft", "Car Crime"'
fi

RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/ai/generate-statistics-data" \
  -H "Content-Type: application/json" \
  ${CLERK_SESSION_TOKEN:+-H "Cookie: _session=$CLERK_SESSION_TOKEN"} \
  -d "{
    \"timelineName\": \"Crime in West Midlands\",
    \"timelineDescription\": \"Statistical analysis of crime data in West Midlands region\",
    \"metrics\": [$METRICS_ARRAY],
    \"dataSource\": \"${DATA_SOURCE:-Police.uk - Crime Statistics}\",
    \"period\": \"since-2020\"
  }")

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')

echo "Response:"
echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""
echo "HTTP Status: $HTTP_STATUS2"
echo ""

if [ "$HTTP_STATUS2" = "200" ]; then
  echo -e "${GREEN}✅ Test 2 PASSED${NC}"
  EVENT_COUNT=$(echo "$BODY2" | jq '.events | length' 2>/dev/null)
  DATA_QUALITY=$(echo "$BODY2" | jq -r '.dataQuality' 2>/dev/null)
  echo "   Events generated: $EVENT_COUNT"
  echo "   Data quality: $DATA_QUALITY"
  
  # Show first event as example
  if [ "$EVENT_COUNT" -gt 0 ]; then
    FIRST_EVENT=$(echo "$BODY2" | jq '.events[0]' 2>/dev/null)
    echo "   First event:"
    echo "$FIRST_EVENT" | jq '{title, date, data}' 2>/dev/null || echo "$FIRST_EVENT"
  fi
else
  echo -e "${RED}❌ Test 2 FAILED${NC}"
fi

echo ""
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Test 1 (Suggestions): $([ "$HTTP_STATUS1" = "200" ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo "Test 2 (Data Generation): $([ "$HTTP_STATUS2" = "200" ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo ""

