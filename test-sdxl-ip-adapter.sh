#!/bin/bash

# Test SDXL+IP-Adapter with curl
# This tests the image generation API with:
# - Illustration style (triggers SDXL)
# - Reference image (triggers IP-Adapter)

echo "Testing SDXL+IP-Adapter image generation..."
echo ""

# Test with a reference image
curl -X POST http://localhost:3000/api/ai/generate-images \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "Test Event",
        "description": "A test event to verify SDXL+IP-Adapter works",
        "year": 2024,
        "imagePrompt": "Illustration style: A person standing in a modern office setting"
      }
    ],
    "imageStyle": "Illustration",
    "themeColor": "#3B82F6",
    "imageReferences": [
      {
        "name": "Test Person",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/256px-President_Barack_Obama.jpg"
      }
    ],
    "includesPeople": true
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "Test complete!"

