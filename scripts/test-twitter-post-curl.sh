#!/bin/bash

# Test script to post a tweet with an image using curl
# For the account: kunle2000@gmail.com
#
# Usage:
# 1. Sign in to StoryWall as kunle2000@gmail.com
# 2. Open DevTools → Application → Cookies → Copy __session value
# 3. Run: ./scripts/test-twitter-post-curl.sh YOUR_SESSION_TOKEN

SESSION_TOKEN="${1:-}"
BASE_URL="${NEXT_PUBLIC_APP_URL:-https://www.storywall.com}"

if [ -z "$SESSION_TOKEN" ]; then
  echo "❌ Error: Session token required"
  echo ""
  echo "Usage: ./scripts/test-twitter-post-curl.sh YOUR_SESSION_TOKEN"
  echo ""
  echo "To get your session token:"
  echo "1. Sign in to StoryWall as kunle2000@gmail.com"
  echo "2. Open DevTools (F12) → Application → Cookies"
  echo "3. Copy the value of the __session cookie"
  exit 1
fi

echo "🧪 Testing Twitter Post with Image"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Base URL: $BASE_URL"
echo ""

# Test image URL (using Unsplash as a test image)
TEST_IMAGE_URL="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
TEST_TEXT="Test tweet from StoryWall API 🚀

Testing image upload with OAuth 1.0a!"

echo "📝 Tweet text:"
echo "$TEST_TEXT"
echo ""
echo "🖼️  Image URL: $TEST_IMAGE_URL"
echo ""

# Make the API call
echo "📤 Posting tweet..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/twitter/post-tweet" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$SESSION_TOKEN" \
  -d "{
    \"text\": \"$TEST_TEXT\",
    \"imageUrl\": \"$TEST_IMAGE_URL\"
  }")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Response:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Pretty print JSON if jq is available, otherwise just print
if command -v jq &> /dev/null; then
  echo "$BODY" | jq '.'
else
  echo "$BODY"
fi

echo ""
echo "HTTP Status: $HTTP_STATUS"
echo ""

# Parse and display results
if echo "$BODY" | grep -q '"success":true'; then
  echo "✅ Tweet posted successfully!"
  
  # Extract tweet URL if available
  TWEET_URL=$(echo "$BODY" | grep -o '"tweetUrl":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$TWEET_URL" ]; then
    echo "🔗 Tweet URL: $TWEET_URL"
  fi
  
  # Check if image was attached
  if echo "$BODY" | grep -q '"imageAttached":true'; then
    echo "✅ Image was successfully attached!"
  elif echo "$BODY" | grep -q '"imageAttached":false'; then
    echo "⚠️  Image was NOT attached"
    # Check for warning message
    WARNING=$(echo "$BODY" | grep -o '"warning":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$WARNING" ]; then
      echo "   Warning: $WARNING"
    fi
  fi
else
  echo "❌ Failed to post tweet"
  ERROR=$(echo "$BODY" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$ERROR" ]; then
    echo "   Error: $ERROR"
  fi
fi

