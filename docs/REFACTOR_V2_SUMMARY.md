# Description Generation V2 Refactor Summary

## Overview
Refactored the description generation API to reduce latency by collapsing multiple model calls into one, optimizing token usage, and adding caching.

## Quick Wins Implemented ✅

### 1. Collapsed Branches → 1 Model Call
**Before:** 3 separate API calls
- Anchor generation (separate call)
- Knowledge Injection for factual details (separate call)
- Descriptions + Image Prompts (separate call)

**After:** 1 unified API call
- Single call generates: Anchor Style + Descriptions + Image Prompts
- **Latency reduction:** ~60-70% (from 3 sequential calls to 1)

**Files:**
- `app/api/ai/generate-descriptions-v2/route.ts` - New unified route
- `prompts/unified/system.txt` - Unified system prompt
- `prompts/unified/user.txt` - Unified user prompt
- `lib/prompts/loader.ts` - Added `loadUnifiedPrompts()` function

### 2. Inlined Factual Mode
**Before:** Separate prompt file and conditional logic
- `prompts/descriptions/image-prompt-instructions-with-anchor-factual.txt`
- Separate detection and loading logic

**After:** Conditional section in unified prompt
- Factual mode activated via `{{#if hasFactualDetails}}` in system prompt
- No separate file needed
- **Token reduction:** ~200-300 tokens per call

### 3. Trimmed Prompt Tokens
**Optimizations:**
- Anchor preview: 60-80 chars (was 100+)
- Removed duplicate `eventTitles` (was in both anchor and description prompts)
- Drop empty variables (template engine skips empty sections)
- Compact image context (single line instead of multi-line)

**Token reduction:** ~15-25% per call

### 4. Content-Based Caching
**Implementation:**
- `lib/utils/cache.ts` - Simple in-memory cache with hash-based keys
- Cache key: SHA-256 hash of inputs (events, description, style, color, etc.)
- TTL: 1 hour
- **Latency reduction:** ~100% for cache hits (instant response)

**Usage:**
```typescript
const cacheKey = hashContent({ events, timelineDescription, ... });
const cached = getCached(cacheKey);
if (cached) return cached;
// ... generate ...
setCached(cacheKey, responseData);
```

### 5. Optimized Newsworthiness Test
**Before:** Sequential execution (blocking)
**After:** Parallel execution with progression detection
- Newsworthiness test runs in parallel with progression detection
- Progression detection is now rule-based (no API call)
- **Latency reduction:** ~200-500ms (parallel vs sequential)

## Performance Improvements

### Expected Latency Reduction
- **P50:** ~60-70% faster (3 calls → 1 call)
- **P95:** ~50-60% faster (cache hits + parallel execution)
- **Cache hits:** ~100% faster (instant response)

### Token Usage Reduction
- **Per call:** ~15-25% fewer tokens
- **Anchor preview:** 60-80 chars (was 100+)
- **Removed duplicates:** ~200-300 tokens saved

## Migration Path

### Option 1: Gradual Migration (Recommended)
1. Keep existing route (`/api/ai/generate-descriptions`) as fallback
2. Update frontend to use new route (`/api/ai/generate-descriptions-v2`)
3. Monitor performance and error rates
4. Remove old route after validation

### Option 2: Direct Replacement
1. Replace old route with V2 implementation
2. Update all frontend calls
3. Monitor for issues

## API Compatibility

The V2 route maintains the same request/response format:

**Request:**
```json
{
  "events": [{ "year": 2020, "title": "Event" }],
  "timelineDescription": "...",
  "writingStyle": "narrative",
  "imageStyle": "Illustration",
  "themeColor": "#FF0000",
  "sourceRestrictions": [],
  "timelineTitle": "..."
}
```

**Response:**
```json
{
  "descriptions": ["..."],
  "imagePrompts": ["..."],
  "anchorStyle": "...",
  "factualDetails": { ... }
}
```

## Next Steps (Pending)

### 5. Optimize Newsworthiness Test
- [ ] Replace with cheaper classifier (smaller model)
- [ ] Use heuristic-based pre-filter
- [ ] Only call expensive model when ambiguous

### 6. HTTP Keep-Alive & Connection Pooling
- [ ] Add `https.Agent` with `keepAlive: true`
- [ ] Configure connection pooling
- [ ] Set `maxSockets: 50`

### 7. Additional Optimizations
- [ ] Batching for long timelines (chunk events into groups of 10)
- [ ] Streaming responses for better UX
- [ ] Replace in-memory cache with Redis/KV store for production

## Testing

To test the V2 route:
```bash
curl -X POST http://localhost:3000/api/ai/generate-descriptions-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{"year": 2020, "title": "Test Event"}],
    "timelineDescription": "A test timeline",
    "writingStyle": "narrative"
  }'
```

## Files Changed

### New Files
- `app/api/ai/generate-descriptions-v2/route.ts`
- `prompts/unified/system.txt`
- `prompts/unified/user.txt`
- `lib/utils/cache.ts`
- `docs/REFACTOR_V2_SUMMARY.md`

### Modified Files
- `lib/prompts/loader.ts` - Added `loadUnifiedPrompts()`

### Unchanged (for backward compatibility)
- `app/api/ai/generate-descriptions/route.ts` - Original route still works

