#!/bin/bash

# Test SDXL model using token from .env.local
# This tests if the model and API token work

echo "Testing SDXL model with token from .env.local..."
echo ""

# Load REPLICATE_API_TOKEN from .env.local
if [ -f .env.local ]; then
  # Extract token value (handle both quoted and unquoted values)
  TOKEN_LINE=$(grep "^REPLICATE_API_TOKEN=" .env.local | head -1)
  if [ -n "$TOKEN_LINE" ]; then
    # Remove REPLICATE_API_TOKEN= and any quotes
    REPLICATE_API_TOKEN=$(echo "$TOKEN_LINE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")
    export REPLICATE_API_TOKEN
    echo "✓ Loaded REPLICATE_API_TOKEN from .env.local"
  else
    echo "ERROR: REPLICATE_API_TOKEN not found in .env.local"
    exit 1
  fi
else
  echo "ERROR: .env.local not found"
  exit 1
fi

# Check if REPLICATE_API_TOKEN is set
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "ERROR: REPLICATE_API_TOKEN is empty"
  exit 1
fi

echo "✓ REPLICATE_API_TOKEN found (${#REPLICATE_API_TOKEN} characters)"
echo ""

echo "1. Testing model version fetch for stability-ai/sdxl..."
VERSION_RESPONSE=$(curl -s -X GET "https://api.replicate.com/v1/models/stability-ai/sdxl/versions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$VERSION_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
VERSION_BODY=$(echo "$VERSION_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ]; then
  VERSION_ID=$(echo "$VERSION_BODY" | jq -r '.results[0].id' 2>/dev/null)
  if [ -n "$VERSION_ID" ] && [ "$VERSION_ID" != "null" ]; then
    echo "✓ Latest version: $VERSION_ID"
  else
    echo "⚠ Could not parse version ID"
    echo "$VERSION_BODY" | jq '.' 2>/dev/null || echo "$VERSION_BODY"
  fi
else
  echo "✗ Failed to fetch versions"
  echo "$VERSION_BODY"
  exit 1
fi

echo ""
echo "2. Testing SDXL prediction creation..."
PREDICTION_RESPONSE=$(curl -s -X POST "https://api.replicate.com/v1/predictions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "input": {
      "prompt": "Illustration style: A simple test image of a cat sitting on a windowsill",
      "num_outputs": 1,
      "guidance_scale": 7.5,
      "num_inference_steps": 25,
      "negative_prompt": "text, words, letters, grid, multiple images"
    }
  }' \
  -w "\nHTTP_STATUS:%{http_code}")

PRED_HTTP_STATUS=$(echo "$PREDICTION_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
PRED_BODY=$(echo "$PREDICTION_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $PRED_HTTP_STATUS"
if [ "$PRED_HTTP_STATUS" = "201" ] || [ "$PRED_HTTP_STATUS" = "200" ]; then
  PREDICTION_ID=$(echo "$PRED_BODY" | jq -r '.id' 2>/dev/null)
  if [ -n "$PREDICTION_ID" ] && [ "$PREDICTION_ID" != "null" ]; then
    echo "✓ Prediction created successfully!"
    echo "  Prediction ID: $PREDICTION_ID"
    echo "  Status: $(echo "$PRED_BODY" | jq -r '.status' 2>/dev/null)"
  else
    echo "⚠ Could not parse prediction ID"
    echo "$PRED_BODY" | jq '.' 2>/dev/null || echo "$PRED_BODY"
  fi
else
  echo "✗ Failed to create prediction"
  echo "$PRED_BODY" | jq '.' 2>/dev/null || echo "$PRED_BODY"
  exit 1
fi

echo ""
echo "Test complete! SDXL model is working."

