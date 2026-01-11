#!/bin/bash
set -e

echo "=== Testing Replicate File Storage Upload ==="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | grep REPLICATE_API_TOKEN | xargs)
fi

if [ -z "$REPLICATE_API_TOKEN" ]; then
    echo "❌ Error: REPLICATE_API_TOKEN not found in .env.local"
    exit 1
fi

echo "✓ Found REPLICATE_API_TOKEN"
echo ""

# Download Bill Gates image from Wikimedia
IMAGE_URL="https://upload.wikimedia.org/wikipedia/commons/a/a0/Bill_Gates_2018.jpg"
echo "📥 Downloading image from Wikimedia..."
echo "URL: $IMAGE_URL"

curl -s -L \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  -H "Accept: image/*" \
  -o /tmp/bill-gates-test.jpg \
  "$IMAGE_URL"

if [ ! -f /tmp/bill-gates-test.jpg ]; then
    echo "❌ Failed to download image"
    exit 1
fi

FILE_SIZE=$(wc -c < /tmp/bill-gates-test.jpg | tr -d ' ')
echo "✓ Downloaded image: $FILE_SIZE bytes"
echo ""

# Upload to Replicate file storage
echo "📤 Uploading to Replicate file storage..."
echo "URL: https://api.replicate.com/v1/files"
echo ""

HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/replicate-response.json \
  -X POST \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -F "content=@/tmp/bill-gates-test.jpg;type=image/jpeg;filename=image.jpg" \
  https://api.replicate.com/v1/files)

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ SUCCESS: Upload completed"
    echo ""
    echo "Response:"
    cat /tmp/replicate-response.json | jq '.'
    echo ""
    
    # Extract and display the URL
    UPLOAD_URL=$(cat /tmp/replicate-response.json | jq -r '.urls.get // .url // empty')
    if [ -n "$UPLOAD_URL" ]; then
        echo "📎 Uploaded file URL:"
        echo "$UPLOAD_URL"
    fi
else
    echo "❌ FAILED: Upload failed with HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    cat /tmp/replicate-response.json
    echo ""
fi

# Cleanup
rm -f /tmp/bill-gates-test.jpg /tmp/replicate-response.json

echo ""
echo "=== Test Complete ==="
