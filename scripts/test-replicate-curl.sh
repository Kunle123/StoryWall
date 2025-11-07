#!/bin/bash

# Test Replicate API with curl
# Usage: ./scripts/test-replicate-curl.sh

# Load REPLICATE_API_TOKEN from .env.local
if [ -f .env.local ]; then
  # Extract REPLICATE_API_TOKEN value (handles both KEY=value and KEY="value" formats)
  REPLICATE_API_TOKEN=$(grep "^REPLICATE_API_TOKEN=" .env.local | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//' | tr -d '\r\n')
  export REPLICATE_API_TOKEN
fi

# Check if REPLICATE_API_TOKEN is set
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "Error: REPLICATE_API_TOKEN not found in .env.local"
  echo "Please add it to .env.local:"
  echo "  REPLICATE_API_TOKEN=your-token-here"
  exit 1
fi

echo "Using REPLICATE_API_TOKEN: ${REPLICATE_API_TOKEN:0:10}..."

echo "Testing Replicate API..."
echo "========================"
echo ""

# Test 1: Get model versions for SDXL
echo "Test 1: Getting SDXL model versions..."
MODEL_NAME="stability-ai/sdxl"
echo "Model: $MODEL_NAME"
echo ""

VERSIONS_RESPONSE=$(curl -s -X GET \
  "https://api.replicate.com/v1/models/${MODEL_NAME}/versions" \
  -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
  -H "Content-Type: application/json")

echo "Versions Response:"
echo "$VERSIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$VERSIONS_RESPONSE"
echo ""

# Extract the first version ID
VERSION_ID=$(echo "$VERSIONS_RESPONSE" | jq -r '.results[0].id' 2>/dev/null)

if [ -z "$VERSION_ID" ] || [ "$VERSION_ID" = "null" ]; then
  echo "Error: Could not get model version"
  echo "Full response: $VERSIONS_RESPONSE"
  exit 1
fi

echo "Using version: $VERSION_ID"
echo ""

# Test 2: Create a prediction
echo "Test 2: Creating prediction..."
echo ""

PREDICTION_RESPONSE=$(curl -s -X POST \
  "https://api.replicate.com/v1/predictions" \
  -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": \"${VERSION_ID}\",
    \"input\": {
      \"prompt\": \"Illustration style: A baker in a tent, with a collapsed Swiss roll, in a baking competition setting, eliminated moment. vibrant purple color palette, vibrant purple lighting. hand-drawn illustration style, detailed linework, rich textures, artistic composition, storybook aesthetic. 21th century period detail. Balanced composition, centered focal point\",
      \"num_outputs\": 1,
      \"guidance_scale\": 7.5,
      \"num_inference_steps\": 30
    }
  }")

echo "Prediction Response:"
echo "$PREDICTION_RESPONSE" | jq '.' 2>/dev/null || echo "$PREDICTION_RESPONSE"
echo ""

# Extract prediction ID
PREDICTION_ID=$(echo "$PREDICTION_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ -z "$PREDICTION_ID" ] || [ "$PREDICTION_ID" = "null" ]; then
  echo "Error: Could not create prediction"
  echo "Full response: $PREDICTION_RESPONSE"
  exit 1
fi

echo "Prediction ID: $PREDICTION_ID"
echo ""

# Test 3: Poll for result
echo "Test 3: Polling for result (this may take 30-60 seconds)..."
echo ""

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS_RESPONSE=$(curl -s -X GET \
    "https://api.replicate.com/v1/predictions/${PREDICTION_ID}" \
    -H "Authorization: Token ${REPLICATE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
  
  echo "Attempt $((ATTEMPT + 1)): Status = $STATUS"
  
  if [ "$STATUS" = "succeeded" ]; then
    echo ""
    echo "Success! Final response:"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    
    OUTPUT=$(echo "$STATUS_RESPONSE" | jq -r '.output' 2>/dev/null)
    echo ""
    echo "Output: $OUTPUT"
    exit 0
  elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
    ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.error' 2>/dev/null)
    echo ""
    echo "Prediction failed!"
    echo "Error: $ERROR"
    echo "Full response:"
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    exit 1
  fi
  
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "Timeout: Prediction did not complete within expected time"
echo "Last status: $STATUS"
exit 1

