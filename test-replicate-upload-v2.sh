#!/bin/bash

# Test Replicate file upload API using curl with different formats
# This tests various ways to upload to match form-data package behavior

REPLICATE_API_KEY="${REPLICATE_API_TOKEN:-${REPLICATE_API_KEY:-$1}}"

if [ -z "$REPLICATE_API_KEY" ]; then
    echo "❌ Error: REPLICATE_API_TOKEN not provided"
    exit 1
fi

echo "🧪 Testing Replicate File Upload API (Multiple Formats)"
echo "========================================================"
echo ""

# Test image URL
TEST_IMAGE_URL="https://upload.wikimedia.org/wikipedia/commons/b/bb/Frank_Bruno_2022.png"

echo "Step 1: Downloading test image..."
IMAGE_FILE=$(mktemp /tmp/test-image-XXXXXX.png)
HTTP_CODE=$(curl -s -o "$IMAGE_FILE" -w "%{http_code}" "$TEST_IMAGE_URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Failed to download test image: HTTP $HTTP_CODE"
    exit 1
fi

FILE_SIZE=$(stat -f%z "$IMAGE_FILE" 2>/dev/null || stat -c%s "$IMAGE_FILE" 2>/dev/null)
CONTENT_TYPE=$(file -b --mime-type "$IMAGE_FILE" 2>/dev/null || echo "image/png")
echo "✅ Downloaded: $FILE_SIZE bytes, $CONTENT_TYPE"
echo ""

# Test different upload formats
echo "Testing different upload formats..."
echo ""

# Format 1: Basic -F with explicit filename
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Format 1: curl -F with explicit filename"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE1=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Token $REPLICATE_API_KEY" \
    -F "content=@$IMAGE_FILE;filename=image.png;type=$CONTENT_TYPE" \
    "https://api.replicate.com/v1/files")
HTTP_CODE1=$(echo "$RESPONSE1" | tail -n1)
BODY1=$(echo "$RESPONSE1" | sed '$d')
echo "Status: $HTTP_CODE1"
echo "$BODY1" | jq '.' 2>/dev/null || echo "$BODY1"
echo ""

# Format 2: -F without type (let curl detect)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Format 2: curl -F without explicit type"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE2=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Token $REPLICATE_API_KEY" \
    -F "content=@$IMAGE_FILE" \
    "https://api.replicate.com/v1/files")
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')
echo "Status: $HTTP_CODE2"
echo "$BODY2" | jq '.' 2>/dev/null || echo "$BODY2"
echo ""

# Format 3: Using --form (same as -F but more explicit)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Format 3: curl --form with explicit filename"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE3=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Token $REPLICATE_API_KEY" \
    --form "content=@$IMAGE_FILE;filename=image.png" \
    "https://api.replicate.com/v1/files")
HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | sed '$d')
echo "Status: $HTTP_CODE3"
echo "$BODY3" | jq '.' 2>/dev/null || echo "$BODY3"
echo ""

# Format 4: Manual multipart (like form-data package does)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Format 4: Manual multipart/form-data (verbose to see headers)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BOUNDARY=$(openssl rand -hex 16)
TEMP_MULTIPART=$(mktemp /tmp/multipart-XXXXXX)

# Create multipart body manually
{
    echo -e "--$BOUNDARY\r"
    echo -e "Content-Disposition: form-data; name=\"content\"; filename=\"image.png\"\r"
    echo -e "Content-Type: $CONTENT_TYPE\r"
    echo -e "\r"
    cat "$IMAGE_FILE"
    echo -e "\r"
    echo -e "--$BOUNDARY--\r"
} > "$TEMP_MULTIPART"

RESPONSE4=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Token $REPLICATE_API_KEY" \
    -H "Content-Type: multipart/form-data; boundary=$BOUNDARY" \
    --data-binary "@$TEMP_MULTIPART" \
    "https://api.replicate.com/v1/files")
HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | sed '$d')
echo "Status: $HTTP_CODE4"
echo "$BODY4" | jq '.' 2>/dev/null || echo "$BODY4"
rm -f "$TEMP_MULTIPART"
echo ""

# Format 5: Check what form-data package actually sends (using Node.js)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Format 5: Using Node.js form-data package (like our code)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat > /tmp/test-formdata.js << 'EOF'
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const imagePath = process.argv[2];
const apiKey = process.argv[3];

const formData = new FormData();
formData.append('content', fs.createReadStream(imagePath), {
  filename: 'image.png',
  contentType: 'image/png'
});

const headers = {
  'Authorization': `Token ${apiKey}`,
  ...formData.getHeaders()
};

fetch('https://api.replicate.com/v1/files', {
  method: 'POST',
  headers: headers,
  body: formData
})
.then(res => res.text())
.then(text => {
  console.log(`HTTP ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
})
.catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
EOF

if command -v node >/dev/null 2>&1; then
    NODE_OUTPUT=$(cd /tmp && node test-formdata.js "$IMAGE_FILE" "$REPLICATE_API_KEY" 2>&1)
    echo "$NODE_OUTPUT"
else
    echo "Node.js not available, skipping this test"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "  Format 1: $HTTP_CODE1"
echo "  Format 2: $HTTP_CODE2"
echo "  Format 3: $HTTP_CODE3"
echo "  Format 4: $HTTP_CODE4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -f "$IMAGE_FILE" /tmp/test-formdata.js

