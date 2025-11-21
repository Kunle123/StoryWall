#!/bin/bash

# Individual CURL commands for testing statistics endpoints
# Replace YOUR_SESSION_TOKEN with your actual Clerk session token

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
SESSION_TOKEN="${CLERK_SESSION_TOKEN:-YOUR_SESSION_TOKEN}"

echo "🧪 Statistics Timeline API Endpoint Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Generate Statistics Suggestions
echo "📊 TEST 1: Generate Statistics Suggestions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/ai/generate-statistics-suggestions" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$SESSION_TOKEN" \
  -d '{
    "measurementQuestion": "Crime in West Midlands"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 2: Generate Statistics Data
echo "📈 TEST 2: Generate Statistics Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/ai/generate-statistics-data" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$SESSION_TOKEN" \
  -d '{
    "timelineName": "Crime in West Midlands",
    "timelineDescription": "Statistical analysis of crime data in West Midlands region",
    "metrics": ["Violent Crime", "Theft", "Car Crime", "Burglary", "Drug Offences"],
    "dataSource": "Police.uk - Crime Statistics",
    "period": "since-2020"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 3: Generate Statistics Suggestions (UK Political Polling)
echo "📊 TEST 3: Generate Suggestions for UK Political Polling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/ai/generate-statistics-suggestions" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$SESSION_TOKEN" \
  -d '{
    "measurementQuestion": "UK Political Party Polling"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo ""

# Test 4: Generate Statistics Data (UK Political Polling)
echo "📈 TEST 4: Generate Data for UK Political Polling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/ai/generate-statistics-data" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$SESSION_TOKEN" \
  -d '{
    "timelineName": "UK Political Party Polling",
    "timelineDescription": "Polling data for UK political parties from 2020 to 2024",
    "metrics": ["Conservative Party", "Labour Party", "Liberal Democrats", "Green Party", "Reform UK"],
    "dataSource": "YouGov / Ipsos MORI / Office for National Statistics",
    "period": "since-2020"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "✅ All tests complete!"
