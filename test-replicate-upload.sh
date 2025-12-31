#!/bin/bash

# Test Replicate file upload API using curl
# This tests the exact same upload format we use in the code

# Try to get API key from environment or argument
REPLICATE_API_KEY="${REPLICATE_API_TOKEN:-${REPLICATE_API_KEY:-$1}}"

if [ -z "$REPLICATE_API_KEY" ]; then
    echo "❌ Error: REPLICATE_API_TOKEN not provided"
    echo "Usage: $0 <replicate_api_token>"
    echo "   or: REPLICATE_API_TOKEN=xxx $0"
    echo "   or: REPLICATE_API_KEY=xxx $0"
    exit 1
fi

echo "🧪 Testing Replicate File Upload API"
echo "===================================="
echo ""

# Test image URL (using the Frank Bruno image that was being used)
TEST_IMAGE_URL="https://upload.wikimedia.org/wikipedia/commons/b/bb/Frank_Bruno_2022.png"

echo "Step 1: Downloading test image..."
echo "URL: $TEST_IMAGE_URL"
echo ""

# Download the image
IMAGE_FILE=$(mktemp /tmp/test-image-XXXXXX.png)
HTTP_CODE=$(curl -s -o "$IMAGE_FILE" -w "%{http_code}" "$TEST_IMAGE_URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Failed to download test image: HTTP $HTTP_CODE"
    exit 1
fi

FILE_SIZE=$(stat -f%z "$IMAGE_FILE" 2>/dev/null || stat -c%s "$IMAGE_FILE" 2>/dev/null)
echo "✅ Downloaded image: $FILE_SIZE bytes"
echo ""

# Get content type
CONTENT_TYPE=$(file -b --mime-type "$IMAGE_FILE" 2>/dev/null || echo "image/png")
echo "Content-Type: $CONTENT_TYPE"
echo ""

echo "Step 2: Uploading to Replicate (with retries and monitoring)..."
echo "Endpoint: https://api.replicate.com/v1/files"
echo ""

# Test with multiple attempts to see if it's consistent
MAX_ATTEMPTS=3
SUCCESS_COUNT=0
FAIL_COUNT=0

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Attempt $attempt/$MAX_ATTEMPTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Create multipart form data using curl
    # This mimics what form-data package does
    START_TIME=$(date +%s%N)
    RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X POST \
        -H "Authorization: Token $REPLICATE_API_KEY" \
        -F "content=@$IMAGE_FILE;type=$CONTENT_TYPE;filename=image.png" \
        "https://api.replicate.com/v1/files" 2>&1)
    END_TIME=$(date +%s%N)
    DURATION_MS=$(( (END_TIME - START_TIME) / 1000000 ))
    
    # Extract HTTP code and time (last two lines)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n2 | head -n1)
    TIME_TOTAL=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d' | sed '$d')
    
    echo "HTTP Status: $HTTP_CODE"
    echo "Response Time: ${TIME_TOTAL}s (${DURATION_MS}ms)"
    echo ""
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Upload successful!"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        
        # Extract URL if present
        UPLOAD_URL=$(echo "$BODY" | jq -r '.url // .urls.get // .urls.post // empty' 2>/dev/null)
        if [ -n "$UPLOAD_URL" ] && [ "$UPLOAD_URL" != "null" ]; then
            echo "Upload URL: $UPLOAD_URL"
        fi
        
        echo ""
        echo "Response Body:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    else
        echo "❌ Upload failed with HTTP $HTTP_CODE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        
        echo ""
        echo "Response Body:"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        
        # If 500 error, show verbose details
        if [ "$HTTP_CODE" = "500" ]; then
            echo ""
            echo "🔍 500 Internal Server Error detected"
            echo "Getting verbose curl output for debugging..."
            echo ""
            
            # Get verbose output (headers and request details)
            VERBOSE_OUTPUT=$(curl -v \
                -X POST \
                -H "Authorization: Token $REPLICATE_API_KEY" \
                -F "content=@$IMAGE_FILE;type=$CONTENT_TYPE;filename=image.png" \
                "https://api.replicate.com/v1/files" 2>&1)
            
            echo "Verbose Output (first 80 lines):"
            echo "$VERBOSE_OUTPUT" | head -80
        fi
    fi
    
    echo ""
    
    # Wait between attempts (except for last one)
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
        WAIT_TIME=2
        echo "Waiting ${WAIT_TIME}s before next attempt..."
        sleep $WAIT_TIME
        echo ""
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary: $SUCCESS_COUNT successful, $FAIL_COUNT failed out of $MAX_ATTEMPTS attempts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -f "$IMAGE_FILE"

echo ""
echo "===================================="
echo "Test complete"

