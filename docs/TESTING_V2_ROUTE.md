# Testing the V2 Description Generation Route

## Quick Test Methods

### Method 1: Direct API Call with cURL

Test the V2 route directly from the command line:

```bash
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
  }'
```

**Expected Response:**
```json
{
  "descriptions": ["...", "...", "..."],
  "imagePrompts": ["...", "...", "..."],
  "anchorStyle": "...",
  "factualDetails": { ... } // Only if progression detected
}
```

### Method 2: Test Page (Temporary Modification)

1. Open `app/(main)/test-image-prompt/page.tsx`
2. Find line 84 where it calls `/api/ai/generate-descriptions`
3. Temporarily change it to `/api/ai/generate-descriptions-v2`:

```typescript
const response = await fetch("/api/ai/generate-descriptions-v2", {
  // ... rest of the code
});
```

4. Start your dev server: `npm run dev`
5. Navigate to `http://localhost:3000/test-image-prompt`
6. Fill in the form and click "Generate Descriptions"

### Method 3: Compare V1 vs V2 Side-by-Side

Create a simple test script:

```typescript
// test-v2-comparison.ts
const testData = {
  events: [
    { year: 2020, title: "Event 1" },
    { year: 2021, title: "Event 2" },
  ],
  timelineDescription: "A test timeline",
  writingStyle: "narrative",
  imageStyle: "Illustration",
  themeColor: "#FF0000",
  timelineTitle: "Test Timeline"
};

async function testRoute(url: string, name: string) {
  const start = Date.now();
  const response = await fetch(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData),
  });
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`\n${name}:`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Descriptions: ${data.descriptions?.length || 0}`);
  console.log(`  Image Prompts: ${data.imagePrompts?.length || 0}`);
  console.log(`  Anchor Style: ${data.anchorStyle ? 'Yes' : 'No'}`);
  console.log(`  Cache Hit: ${response.headers.get('x-cache-hit') || 'N/A'}`);
}

// Test both routes
await testRoute('/api/ai/generate-descriptions', 'V1 (Original)');
await testRoute('/api/ai/generate-descriptions-v2', 'V2 (Optimized)');
```

Run with: `npx tsx test-v2-comparison.ts`

## What to Test

### 1. Basic Functionality
- ✅ Descriptions are generated for all events
- ✅ Image prompts are generated for all events
- ✅ Anchor style is generated (should always be present)
- ✅ Response format matches V1

### 2. Performance
- ✅ Check response time (should be 60-70% faster)
- ✅ Check console logs for timing information
- ✅ Test cache hits (second identical request should be instant)

### 3. Newsworthiness Test Optimization
Test with different timeline types:

**Clear Newsworthy (should use heuristic, no API call):**
```json
{
  "timelineTitle": "The Election of Governor Cuomo",
  "timelineDescription": "A timeline of the events leading to the election"
}
```

**Clear Non-Newsworthy (should use heuristic, no API call):**
```json
{
  "timelineTitle": "Bruce Willis Films",
  "timelineDescription": "A timeline of Bruce Willis movies"
}
```

**Ambiguous (should call full AI test):**
```json
{
  "timelineTitle": "The Life of a Public Figure",
  "timelineDescription": "A biographical timeline"
}
```

Check console logs for:
- `[NewsworthinessTest] Quick heuristic result` (heuristic used)
- `[NewsworthinessTest] Ambiguous case, running full AI test` (full test used)

### 4. Batching (Long Timelines)
Test with >10 events to trigger batching:

```json
{
  "events": [
    {"year": 2020, "title": "Event 1"},
    {"year": 2021, "title": "Event 2"},
    // ... add 15+ events
  ],
  "timelineDescription": "A long timeline with many events"
}
```

Check console logs for:
- `[GenerateDescriptionsV2] Batching X events into chunks of 10`
- `[GenerateDescriptionsV2] Processing Y batches`

### 5. Caching
1. Make first request (should generate)
2. Make identical second request (should be instant from cache)
3. Check console for cache hit logs

### 6. Error Handling
- Test with invalid input (missing events, missing description)
- Test with very long timeline (>100 events)
- Test with network issues

## Monitoring Performance

### Check Console Logs

Look for these log messages:

```
[GenerateDescriptionsV2] Single unified call: events=5, maxTokens=4300
[GenerateDescriptionsV2] Generated in 1234ms
[NewsworthinessTest] Quick heuristic result: Low
```

### Compare Metrics

| Metric | V1 (Original) | V2 (Optimized) | Improvement |
|--------|---------------|----------------|-------------|
| API Calls | 3 (Anchor + Factual + Descriptions) | 1 (Unified) | 66% reduction |
| P50 Latency | ~3000ms | ~1000ms | 67% faster |
| P95 Latency | ~5000ms | ~2000ms | 60% faster |
| Cache Hits | N/A | ~0ms | Instant |
| Newsworthiness (clear cases) | ~800ms | ~0ms | 100% faster |

## Troubleshooting

### Issue: Route returns 404
- **Solution:** Make sure the dev server is running: `npm run dev`
- **Check:** The route file exists at `app/api/ai/generate-descriptions-v2/route.ts`

### Issue: Response format differs from V1
- **Check:** Both routes should return the same format
- **Verify:** `descriptions`, `imagePrompts`, `anchorStyle` are all present

### Issue: Cache not working
- **Check:** Make sure you're sending identical requests
- **Note:** Cache key includes: events, description, style, color, restrictions

### Issue: Batching not triggered
- **Check:** Need >10 events to trigger batching
- **Verify:** Check console logs for batching messages

## Next Steps After Testing

Once V2 is validated:

1. **Update Frontend:** Change all calls from `/api/ai/generate-descriptions` to `/api/ai/generate-descriptions-v2`
2. **Monitor:** Watch for errors and performance improvements
3. **Replace:** After validation period, replace V1 with V2 (rename V2 to remove `-v2`)

## Files to Update for Full Migration

1. `components/timeline-editor/EventDetailsStep.tsx` (line 50, 137)
2. `app/(main)/test-image-prompt/page.tsx` (line 84)
3. Any scripts that call the API directly

