#!/bin/bash

echo "=== V2 Route Timing Breakdown Test ==="
echo ""
echo "This test will show the timing breakdown in the server console."
echo "Watch your dev server terminal for logs like:"
echo "  [NewsworthinessTest] Quick heuristic result (Xms): Low"
echo "  [GenerateDescriptionsV2] Timing breakdown:"
echo "    - Newsworthiness test: Xms"
echo "    - Description generation: Xms"
echo "    - Total time: Xms"
echo ""

# Test with clear newsworthy case (should use heuristic)
echo "Test 1: Clear newsworthy case (should use heuristic, ~0-2ms)"
echo "Sending request..."
curl -s -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{"year": 2024, "title": "Election Day"}],
    "timelineDescription": "The election of a new governor",
    "writingStyle": "narrative",
    "timelineTitle": "Governor Election 2024"
  }' | jq -r 'if .descriptions then "✅ Success - Check server console for timing" else .error end'

echo ""
echo "Test 2: Clear non-newsworthy case (should use heuristic, ~0-2ms)"
echo "Sending request..."
curl -s -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{"year": 2020, "title": "Film Release"}],
    "timelineDescription": "A timeline of Bruce Willis films",
    "writingStyle": "narrative",
    "timelineTitle": "Bruce Willis Films"
  }' | jq -r 'if .descriptions then "✅ Success - Check server console for timing" else .error end'

echo ""
echo "✅ Tests complete! Check your dev server console for detailed timing logs."
