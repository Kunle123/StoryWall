#!/bin/bash

# Test script for debug endpoints
# Usage: ./scripts/test-debug-endpoints.sh [BASE_URL]
# Example: ./scripts/test-debug-endpoints.sh https://www.storywall.com

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testing Debug Endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Event Generation
echo "📝 Test 1: Event Generation"
echo "---------------------------"
RESPONSE1=$(curl -s -X POST "$BASE_URL/api/debug/test-prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "step": "events",
    "timelineName": "Test Timeline",
    "timelineDescription": "Good Morning Britain controversies about working-class people",
    "maxEvents": 5,
    "isFactual": true
  }')

SUCCESS1=$(echo "$RESPONSE1" | grep -o '"success":true' | head -1)
EVENT_COUNT=$(echo "$RESPONSE1" | grep -o '"year"' | wc -l | tr -d ' ')

if [ "$SUCCESS1" = '"success":true' ]; then
  echo "✅ Event generation: SUCCESS ($EVENT_COUNT events)"
else
  echo "❌ Event generation: FAILED"
  echo "$RESPONSE1" | head -20
fi

echo ""

# Test 2: Prompt Management
echo "📋 Test 2: Prompt Management (List)"
echo "------------------------------------"
RESPONSE2=$(curl -s -X GET "$BASE_URL/api/debug/prompts?step=events")
SUCCESS2=$(echo "$RESPONSE2" | grep -o '"prompts"' | head -1)

if [ -n "$SUCCESS2" ]; then
  echo "✅ Prompt listing: SUCCESS"
else
  echo "❌ Prompt listing: FAILED"
fi

echo ""

# Test 3: Prompt Optimization (if we have outputs)
echo "🔧 Test 3: Prompt Optimization"
echo "------------------------------"
# Extract events from first response for optimization
EVENTS=$(echo "$RESPONSE1" | grep -A 100 '"events"' | head -30)

if [ -n "$EVENTS" ] && [ "$EVENT_COUNT" -gt 0 ]; then
  RESPONSE3=$(curl -s -X POST "$BASE_URL/api/debug/optimize-prompt" \
    -H "Content-Type: application/json" \
    -d "{
      \"step\": \"events\",
      \"currentSystemPrompt\": \"Generate accurate historical events\",
      \"currentUserPrompt\": \"Generate events for timeline\",
      \"outputs\": $EVENTS,
      \"optimizationGoal\": \"More diverse events\"
    }")
  
  SUCCESS3=$(echo "$RESPONSE3" | grep -o '"success":true' | head -1)
  PROMPT_ID=$(echo "$RESPONSE3" | grep -o '"promptId":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ "$SUCCESS3" = '"success":true' ]; then
    echo "✅ Prompt optimization: SUCCESS (ID: $PROMPT_ID)"
  else
    echo "❌ Prompt optimization: FAILED"
  fi
else
  echo "⏭️  Skipping optimization (no events to analyze)"
fi

echo ""
echo "✅ Testing complete!"
echo ""
echo "💡 To test with optimized prompt:"
echo "   curl -X POST '$BASE_URL/api/debug/test-prompts' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"step\":\"events\",\"promptId\":\"$PROMPT_ID\",...}'"

