#!/bin/bash

# Test Twitter image upload on Railway deployment
# Usage: ./scripts/test-twitter-upload-railway.sh

RAILWAY_URL="https://www.storywall.com"
IMAGE_URL="https://res.cloudinary.com/dnybzkkfn/image/upload/v1763367993/storywall/ai-generated/qiwvaruecspjsracbtcg.jpg"

# You need to provide your Clerk session token
# Get it from browser DevTools > Application > Cookies > __session
if [ -z "$CLERK_SESSION" ]; then
  echo "Error: CLERK_SESSION environment variable not set"
  echo "Get your session token from browser DevTools > Application > Cookies > __session"
  echo "Then run: CLERK_SESSION=your_token_here ./scripts/test-twitter-upload-railway.sh"
  exit 1
fi

echo "Testing Twitter image upload on Railway..."
echo "URL: $RAILWAY_URL/api/twitter/post-tweet"
echo "Image: $IMAGE_URL"
echo ""

# Test tweet text
TWEET_TEXT="Test tweet with image - $(date +%s)"

curl -X POST "$RAILWAY_URL/api/twitter/post-tweet" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=$CLERK_SESSION" \
  -d "{
    \"text\": \"$TWEET_TEXT\",
    \"imageUrl\": \"$IMAGE_URL\"
  }" \
  -v \
  -w "\n\nHTTP Status: %{http_code}\n"

