#!/bin/bash

# Test the actual API endpoint with SDXL

echo "Testing /api/ai/generate-images endpoint with SDXL..."
echo ""

# Load token
TOKEN_LINE=$(grep "^REPLICATE_API_TOKEN=" .env.local | head -1)
if [ -n "$TOKEN_LINE" ]; then
  REPLICATE_API_TOKEN=$(echo "$TOKEN_LINE" | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//' | sed "s/^'//" | sed "s/'$//")
else
  echo "ERROR: Could not load REPLICATE_API_TOKEN"
  exit 1
fi

# Test the API endpoint
curl -X POST http://localhost:3000/api/ai/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "Test Event",
        "description": "A simple test event to verify SDXL works",
        "year": 2024
      }
    ],
    "imageStyle": "Illustration",
    "themeColor": "#3B82F6",
    "includesPeople": false
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "Test complete!"

