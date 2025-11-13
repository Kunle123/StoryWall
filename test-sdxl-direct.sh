#!/bin/bash

# Test SDXL model directly with Replicate API
# This tests if the model and API token work

echo "Testing SDXL model directly with Replicate API..."
echo ""

# Check if REPLICATE_API_TOKEN is set
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "ERROR: REPLICATE_API_TOKEN not set in environment"
  echo "Please set it with: export REPLICATE_API_TOKEN=your_token"
  exit 1
fi

echo "1. Testing model version fetch for stability-ai/sdxl..."
curl -X GET "https://api.replicate.com/v1/models/stability-ai/sdxl/versions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.results[0] | {id, created_at}' 2>/dev/null || echo "Failed to parse response"

echo ""
echo "2. Testing SDXL prediction creation..."
curl -X POST "https://api.replicate.com/v1/predictions" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "input": {
      "prompt": "Illustration style: A simple test image of a cat",
      "num_outputs": 1,
      "guidance_scale": 7.5,
      "num_inference_steps": 25,
      "negative_prompt": "text, words, letters, grid, multiple images"
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "Test complete!"

