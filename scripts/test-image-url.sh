#!/bin/bash

# Test if an image URL is accessible and what format it is
# Usage: ./scripts/test-image-url.sh <image-url>

if [ -z "$1" ]; then
  echo "Usage: $0 <image-url>"
  exit 1
fi

IMAGE_URL="$1"

echo "Testing image URL: $IMAGE_URL"
echo "=============================="
echo ""

# Test 1: Check if URL is accessible
echo "Test 1: Checking if URL is accessible..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$IMAGE_URL")
echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: URL returned status $HTTP_CODE (not 200)"
  exit 1
fi

echo "✓ URL is accessible"
echo ""

# Test 2: Check content type
echo "Test 2: Checking content type..."
CONTENT_TYPE=$(curl -s -I -L --max-time 10 "$IMAGE_URL" | grep -i "content-type:" | head -1 | cut -d ':' -f2 | tr -d ' \r\n')
echo "Content-Type: $CONTENT_TYPE"

if [[ ! "$CONTENT_TYPE" =~ ^(image/jpeg|image/png|image/gif|image/webp) ]]; then
  echo "WARNING: Content-Type is not a standard image format"
fi
echo ""

# Test 3: Download and check file
echo "Test 3: Downloading and checking file..."
TEMP_FILE=$(mktemp)
curl -s -L --max-time 10 "$IMAGE_URL" -o "$TEMP_FILE"

FILE_SIZE=$(stat -f%z "$TEMP_FILE" 2>/dev/null || stat -c%s "$TEMP_FILE" 2>/dev/null)
echo "File size: $FILE_SIZE bytes"

# Check if it's a valid image using file command
FILE_TYPE=$(file -b "$TEMP_FILE" 2>/dev/null || echo "unknown")
echo "File type: $FILE_TYPE"

# Check first few bytes
FIRST_BYTES=$(head -c 20 "$TEMP_FILE" | xxd -p | tr -d '\n')
echo "First bytes (hex): $FIRST_BYTES"

# JPEG starts with FF D8 FF
# PNG starts with 89 50 4E 47
if [[ "$FIRST_BYTES" =~ ^ffd8ff ]]; then
  echo "✓ Valid JPEG image"
elif [[ "$FIRST_BYTES" =~ ^89504e47 ]]; then
  echo "✓ Valid PNG image"
else
  echo "WARNING: File doesn't appear to be a standard JPEG or PNG"
fi

rm -f "$TEMP_FILE"
echo ""

# Test 4: Test with Replicate (if token available)
if [ -f .env.local ]; then
  REPLICATE_API_TOKEN=$(grep "^REPLICATE_API_TOKEN=" .env.local | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//' | tr -d '\r\n')
  
  if [ ! -z "$REPLICATE_API_TOKEN" ]; then
    echo "Test 4: Testing with Replicate API..."
    VERSION_ID="7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc"
    
    RESPONSE=$(curl -s -X POST \
      "https://api.replicate.com/v1/predictions" \
      -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "version": "'"${VERSION_ID}"'",
        "input": {
          "prompt": "test",
          "image": "'"${IMAGE_URL}"'",
          "prompt_strength": 0.8,
          "num_outputs": 1,
          "guidance_scale": 7.5,
          "num_inference_steps": 30
        }
      }')
    
    PREDICTION_ID=$(echo "$RESPONSE" | jq -r '.id' 2>/dev/null)
    ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)
    
    if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
      echo "ERROR creating prediction: $ERROR"
      DETAIL=$(echo "$RESPONSE" | jq -r '.detail' 2>/dev/null)
      if [ ! -z "$DETAIL" ] && [ "$DETAIL" != "null" ]; then
        echo "Detail: $DETAIL"
      fi
    elif [ ! -z "$PREDICTION_ID" ] && [ "$PREDICTION_ID" != "null" ]; then
      echo "✓ Prediction created: $PREDICTION_ID"
      echo "Waiting 10 seconds to check status..."
      sleep 10
      
      STATUS_RESPONSE=$(curl -s -X GET \
        "https://api.replicate.com/v1/predictions/${PREDICTION_ID}" \
        -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
        -H "Content-Type: application/json")
      
      STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
      STATUS_ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error' 2>/dev/null)
      
      echo "Status: $STATUS"
      if [ ! -z "$STATUS_ERROR" ] && [ "$STATUS_ERROR" != "null" ]; then
        echo "ERROR: $STATUS_ERROR"
        echo "Full error response:"
        echo "$STATUS_RESPONSE" | jq '.error, .logs' 2>/dev/null || echo "$STATUS_RESPONSE"
      fi
    else
      echo "Failed to create prediction"
      echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
  fi
fi

