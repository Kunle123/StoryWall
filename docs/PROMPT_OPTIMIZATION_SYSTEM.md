# Prompt Optimization System - How It Works

## Overview

The prompt optimization system uses AI to iteratively improve prompts by analyzing outputs, identifying weaknesses, and generating better prompts. This creates a feedback loop for continuous improvement.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROMPT OPTIMIZATION SYSTEM               │
└─────────────────────────────────────────────────────────────┘

1. TEST PROMPTS
   └─> Generate outputs with current prompts
   └─> Capture full debug log (prompts + responses)

2. ANALYZE OUTPUTS
   └─> AI analyzes outputs vs. goals
   └─> Identifies issues and weaknesses
   └─> Suggests specific improvements

3. GENERATE IMPROVED PROMPTS
   └─> AI creates new system + user prompts
   └─> Includes reasoning for changes
   └─> Saves to prompt storage

4. TEST IMPROVED PROMPTS
   └─> Use saved prompt ID
   └─> Compare results
   └─> Iterate if needed
```

## Components

### 1. Debug Logger (`lib/utils/debugLogger.ts`)

**Purpose**: Captures all textual content during generation for analysis.

**What it logs**:
- User inputs (timeline name, description, settings)
- System prompts sent to AI
- User prompts sent to AI
- AI responses (full content)
- System information (metadata, model used, etc.)

**Output**: Formatted text log with timestamps and structured sections.

```typescript
// Example usage
debugLogger.init(timelineName, timelineDescription);
debugLogger.logPrompt('Event Generation', systemPrompt, userPrompt);
debugLogger.logAIResponse('Event Generation', aiResponse);
const log = debugLogger.getFormattedLog(); // Full debug log
```

### 2. Prompt Storage (`lib/utils/promptStorage.ts`)

**Purpose**: Stores and retrieves prompt versions for iterative testing.

**Storage**: In-memory Map (can be replaced with database).

**Functions**:
- `savePrompt()` - Save new prompt version
- `getPrompt(id)` - Retrieve specific prompt
- `getLatestPrompt(step)` - Get most recent prompt for a step
- `updatePrompt(id)` - Update existing prompt (increments version)
- `getAllPrompts(step?)` - List all prompts (optionally filtered by step)

**Prompt Structure**:
```typescript
{
  id: "events-1766426629656",
  step: "events" | "descriptions" | "images",
  systemPrompt: "...",
  userPrompt: "...",
  version: 1,
  createdAt: "2025-12-22T...",
  updatedAt: "2025-12-22T...",
  metadata: {
    description: "Optimization goal",
    improvements: ["List of improvements"],
    testResults: {...}
  }
}
```

### 3. Test Endpoint (`/api/debug/test-prompts`)

**Purpose**: Test prompts without authentication, capture full debug logs.

**Features**:
- Bypasses authentication (debug only)
- Supports all three steps: `events`, `descriptions`, `images`
- Can use saved prompts via `promptId`
- Returns full debug log with all prompts and responses
- Handles both default and custom prompts

**Request**:
```json
{
  "step": "events",
  "timelineName": "Test Timeline",
  "timelineDescription": "Description here",
  "maxEvents": 10,
  "isFactual": true,
  "promptId": "events-123" // Optional: use saved prompt
}
```

**Response**:
```json
{
  "success": true,
  "step": "events",
  "data": {
    "events": [...]
  },
  "debugLog": "Full formatted debug log..."
}
```

### 4. Optimize Endpoint (`/api/debug/optimize-prompt`)

**Purpose**: AI-powered prompt optimization - the core of the system.

**How it works**:

1. **Receives**:
   - Current system prompt
   - Current user prompt
   - Actual outputs generated
   - Full debug log (optional)
   - Optimization goal (e.g., "more diverse events")

2. **Sends to AI** (GPT-4o-mini or Kimi):
   ```
   You are an expert prompt engineer.
   
   CURRENT PROMPTS:
   [System prompt]
   [User prompt]
   
   OUTPUTS GENERATED:
   [JSON of actual outputs]
   
   DEBUG LOG:
   [Full generation process]
   
   OPTIMIZATION GOAL:
   [What to improve]
   
   Analyze and suggest improvements.
   ```

3. **AI Returns**:
   ```json
   {
     "analysis": "Detailed analysis of issues",
     "issues": ["List of specific problems"],
     "improvements": ["List of suggested fixes"],
     "improvedSystemPrompt": "New system prompt",
     "improvedUserPrompt": "New user prompt",
     "reasoning": "Why these changes help"
   }
   ```

4. **Saves** improved prompts to storage and returns:
   - Analysis results
   - Improved prompts
   - Prompt ID for future use
   - Original prompts for comparison

**Request**:
```json
{
  "step": "events",
  "currentSystemPrompt": "...",
  "currentUserPrompt": "...",
  "outputs": [...],
  "debugLog": "...",
  "optimizationGoal": "Generate more diverse events"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "analysis": "...",
    "issues": [...],
    "improvements": [...],
    "reasoning": "..."
  },
  "improvedPrompts": {
    "systemPrompt": "...",
    "userPrompt": "..."
  },
  "promptId": "events-1766426629656"
}
```

## Workflow Example

### Step 1: Test with Default Prompt
```bash
POST /api/debug/test-prompts
{
  "step": "events",
  "timelineName": "Tommy Robinson Criminal History",
  "timelineDescription": "History of criminal activities",
  "maxEvents": 10
}
```

**Result**: 5 events, clustered in 2018-2021, vague titles

### Step 2: Optimize Prompt
```bash
POST /api/debug/optimize-prompt
{
  "step": "events",
  "currentSystemPrompt": "...",
  "currentUserPrompt": "...",
  "outputs": [5 events from step 1],
  "optimizationGoal": "More events, wider timespan, better distribution"
}
```

**AI Analysis**:
- Issues: "Only 5 events, narrow range, clustered years"
- Improvements: "Remove restrictive clause, require dates, spread across years"
- New prompts generated with specific requirements

### Step 3: Test with Optimized Prompt
```bash
POST /api/debug/test-prompts
{
  "step": "events",
  "timelineName": "Tommy Robinson Criminal History",
  "timelineDescription": "History of criminal activities",
  "maxEvents": 10,
  "promptId": "events-1766426629656" // Use optimized prompt
}
```

**Result**: 10 events, 2012-2022 timespan, specific dates and charges

### Step 4: Iterate
Repeat steps 2-3 to further refine if needed.

## Key Features

### 1. **Full Visibility**
- Debug logger captures everything: prompts, responses, metadata
- Can analyze exactly what the AI saw and how it responded

### 2. **AI-Powered Analysis**
- Uses GPT-4o-mini/Kimi to analyze outputs
- Identifies patterns, weaknesses, and improvement opportunities
- Provides specific, actionable suggestions

### 3. **Version Control**
- Each prompt version is saved with ID
- Can compare original vs. improved prompts
- Track improvements over time

### 4. **Iterative Improvement**
- Test → Analyze → Improve → Test again
- Continuous refinement loop
- Can iterate multiple times on same prompt

### 5. **No Authentication Required**
- Debug endpoints bypass auth for easy testing
- Can test from command line, scripts, or API tools

## Usage Patterns

### Pattern 1: Quick Test
```bash
# Test default prompt
curl -X POST /api/debug/test-prompts -d '{...}'
```

### Pattern 2: Full Optimization Loop
```bash
# 1. Test
RESPONSE=$(curl -X POST /api/debug/test-prompts -d '{...}')

# 2. Optimize
OPTIMIZED=$(curl -X POST /api/debug/optimize-prompt -d '{
  "outputs": $RESPONSE.data.events,
  "optimizationGoal": "..."
}')

# 3. Test optimized
curl -X POST /api/debug/test-prompts -d '{
  "promptId": $OPTIMIZED.promptId,
  ...
}'
```

### Pattern 3: Compare Versions
```bash
# Get all prompts for a step
curl /api/debug/prompts?step=events

# Test each version and compare results
```

## Benefits

1. **Data-Driven**: Decisions based on actual outputs, not guesses
2. **Systematic**: Structured process for improvement
3. **Scalable**: Can optimize prompts for any step (events, descriptions, images)
4. **Transparent**: Full debug logs show exactly what happened
5. **Iterative**: Can refine multiple times until satisfied

## Future Enhancements

- Database storage for prompts (currently in-memory)
- A/B testing framework (compare prompt versions)
- Metrics tracking (quality scores, diversity metrics)
- Automated optimization (auto-iterate until goal met)
- Prompt templates library (reusable optimized prompts)



