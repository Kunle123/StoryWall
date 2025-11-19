# Accuracy and Verification System

## Overview

This document describes the multi-layered approach to prevent AI hallucinations and ensure factual accuracy in timeline generation.

## 1. Prompt Optimization

### Key Principle: Critical Instructions First
- **Anti-hallucination requirements** are placed at the **very top** of all prompts
- Marked with `⚠️ CRITICAL` and `(READ FIRST - HIGHEST PRIORITY)` to ensure visibility
- Instructions are concise and actionable to prevent being lost in long prompts

### Prompt Length Management
- System prompts are kept focused and structured
- Critical instructions are separated from detailed examples
- Redundant instructions are removed to reduce token usage

## 2. Anti-Hallucination Instructions

All prompts now include explicit instructions at the top:

```
⚠️ CRITICAL ANTI-HALLUCINATION POLICY (READ FIRST - HIGHEST PRIORITY):
- NEVER make up, invent, or fabricate facts, dates, names, or details
- NEVER guess or speculate about information you are not certain about
- ONLY use information from the provided events and your verified knowledge
- If you are unsure about a fact, omit it rather than inventing it
- DO NOT create plausible-sounding but unverified information
- DO NOT fill gaps with assumptions or logical deductions without factual basis
- When describing events, stick to what is known and documented
```

## 3. Post-Generation Verification

### Verification Endpoint: `/api/ai/verify-events`

A new verification endpoint that fact-checks generated events:

**Request:**
```json
{
  "events": [
    { "year": 1920, "title": "Event title", "description": "..." }
  ],
  "timelineDescription": "...",
  "timelineName": "..."
}
```

**Response:**
```json
{
  "verifiedEvents": [
    {
      "year": 1920,
      "title": "Event title",
      "description": "...",
      "verified": true,
      "confidence": "high",
      "issues": []
    }
  ],
  "summary": {
    "total": 10,
    "verified": 8,
    "flagged": 2,
    "highConfidence": 6,
    "mediumConfidence": 2,
    "lowConfidence": 2
  }
}
```

### How It Works
1. **Batches events** (10 at a time) for efficient verification
2. **Uses low temperature** (0.2) for conservative fact-checking
3. **Flags uncertain events** with specific issues
4. **Returns confidence levels**: high, medium, low

## 4. Quickest and Surest Way to Ensure Accuracy

### Recommended Approach (Fastest + Most Reliable):

1. **Prevention (Primary)**: 
   - ✅ Anti-hallucination instructions at top of prompts
   - ✅ Web search for recent/uncertain topics
   - ✅ Source restrictions when available
   - ✅ Conservative date handling (year-only when uncertain)

2. **Post-Generation Verification (Secondary)**:
   - ✅ Call `/api/ai/verify-events` after event generation
   - ✅ Flag low-confidence events for user review
   - ✅ Display verification status in UI

3. **User Review (Final Check)**:
   - ✅ Show verification badges/indicators
   - ✅ Allow users to edit flagged events
   - ✅ Provide source citations when available

### Integration Options

**Option A: Automatic Verification (Recommended)**
- Automatically verify all generated events
- Show verification status in the editor
- Highlight flagged events for user review

**Option B: On-Demand Verification**
- Add "Verify Events" button in editor
- User can trigger verification when needed
- Useful for editing existing timelines

**Option C: Selective Verification**
- Only verify events flagged by heuristics (e.g., recent dates, uncertain titles)
- Faster but less comprehensive

## 5. Implementation Status

✅ **Completed:**
- Anti-hallucination instructions added to all prompts
- Instructions moved to top of prompts
- Verification endpoint created (`/api/ai/verify-events`)

⏳ **To Do:**
- Integrate verification into event generation flow
- Add UI indicators for verification status
- Add "Verify Events" button in editor
- Display confidence levels and issues

## 6. Best Practices

1. **Always use web search** for recent events (last 48 hours)
2. **Require sources** for factual timelines
3. **Be conservative** with dates - prefer year-only when uncertain
4. **Verify after generation** for critical timelines
5. **Allow user editing** - verification is a tool, not a replacement for human review

## 7. Cost Considerations

- Verification adds ~1 API call per 10 events
- Uses cheaper model (gpt-4o-mini) for verification
- Can be made optional or selective to reduce costs
- Estimated cost: ~$0.001-0.002 per event verified

