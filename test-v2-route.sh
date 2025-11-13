#!/bin/bash

# Test script for V2 route
echo "Testing V2 Description Generation Route..."
echo ""

# Test 1: Basic functionality
echo "Test 1: Basic functionality (3 events)"
curl -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"year": 2020, "title": "First Event"},
      {"year": 2021, "title": "Second Event"},
      {"year": 2022, "title": "Third Event"}
    ],
    "timelineDescription": "A test timeline for evaluating the V2 route",
    "writingStyle": "narrative",
    "imageStyle": "Illustration",
    "themeColor": "#FF0000",
    "timelineTitle": "Test Timeline"
  }' | jq '{
    descriptions_count: (.descriptions | length),
    imagePrompts_count: (.imagePrompts | length),
    has_anchorStyle: (.anchorStyle != null),
    anchorStyle_preview: (.anchorStyle // "" | .[0:80])
  }'

echo ""
echo "Test 2: Cache test (same request, should be instant)"
time curl -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"year": 2020, "title": "First Event"},
      {"year": 2021, "title": "Second Event"},
      {"year": 2022, "title": "Third Event"}
    ],
    "timelineDescription": "A test timeline for evaluating the V2 route",
    "writingStyle": "narrative",
    "imageStyle": "Illustration",
    "themeColor": "#FF0000",
    "timelineTitle": "Test Timeline"
  }' > /dev/null 2>&1

echo ""
echo "Test 3: Newsworthiness heuristic (heuristic should be instant, but full generation takes ~9s)"
echo "Note: This measures total time including description generation, not just newsworthiness test"
time curl -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{"year": 2020, "title": "Election Day"}],
    "timelineDescription": "The election of Governor Cuomo",
    "writingStyle": "narrative",
    "timelineTitle": "The Election of Governor Cuomo"
  }' 2>&1 | grep -o '"descriptions":\[.*\]' | head -1 > /dev/null

echo ""
echo "Tests complete!"
