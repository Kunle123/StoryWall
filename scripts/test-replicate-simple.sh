#!/bin/bash

# Simple Replicate API test - just create a prediction and show the response
# Usage: ./scripts/test-replicate-simple.sh

# Load REPLICATE_API_TOKEN from .env.local
if [ -f .env.local ]; then
  REPLICATE_API_TOKEN=$(grep "^REPLICATE_API_TOKEN=" .env.local | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//' | tr -d '\r\n')
  export REPLICATE_API_TOKEN
fi

if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "Error: REPLICATE_API_TOKEN not found"
  exit 1
fi

echo "Testing Replicate API - Creating Prediction"
echo "==========================================="
echo ""

# Use SDXL model version directly (from previous test)
VERSION_ID="7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc"

echo "Model: stability-ai/sdxl"
echo "Version: $VERSION_ID"
echo ""

# Test with a simple prompt (no image)
echo "Test 1: Creating prediction WITHOUT image input..."
echo ""

RESPONSE=$(curl -s -X POST \
  "https://api.replicate.com/v1/predictions" \
  -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "'"${VERSION_ID}"'",
    "input": {
      "prompt": "A simple test image of a cat",
      "num_outputs": 1,
      "guidance_scale": 7.5,
      "num_inference_steps": 30
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check for errors
ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)
if [ ! -z "$ERROR" ] && [ "$ERROR" != "null" ]; then
  echo "ERROR DETECTED: $ERROR"
  echo ""
  DETAIL=$(echo "$RESPONSE" | jq -r '.detail' 2>/dev/null)
  if [ ! -z "$DETAIL" ] && [ "$DETAIL" != "null" ]; then
    echo "Detail: $DETAIL"
  fi
fi

# Test with image URL (if you have one)
echo ""
echo "Test 2: Creating prediction WITH image input (if you have a test image URL)..."
echo ""

# You can set this to a test image URL
TEST_IMAGE_URL="${1:-}"

if [ ! -z "$TEST_IMAGE_URL" ]; then
  RESPONSE2=$(curl -s -X POST \
    "https://api.replicate.com/v1/predictions" \
    -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "version": "'"${VERSION_ID}"'",
      "input": {
        "prompt": "A simple test image of a cat",
        "image": "'"${TEST_IMAGE_URL}"'",
        "prompt_strength": 0.8,
        "num_outputs": 1,
        "guidance_scale": 7.5,
        "num_inference_steps": 30
      }
    }')
  
  echo "Response:"
  echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
  echo ""
  
  ERROR2=$(echo "$RESPONSE2" | jq -r '.error' 2>/dev/null)
  if [ ! -z "$ERROR2" ] && [ "$ERROR2" != "null" ]; then
    echo "ERROR DETECTED: $ERROR2"
    DETAIL2=$(echo "$RESPONSE2" | jq -r '.detail' 2>/dev/null)
    if [ ! -z "$DETAIL2" ] && [ "$DETAIL2" != "null" ]; then
      echo "Detail: $DETAIL2"
    fi
  fi
else
  echo "Skipping (no image URL provided)"
  echo "Usage: $0 <image-url>"
fi

