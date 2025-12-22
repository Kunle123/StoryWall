# Testing Prompt Optimization System

## Quick Test Script

### 1. Test Event Generation (Default Prompts)
```bash
curl -X POST http://localhost:3000/api/debug/test-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "step": "events",
    "timelineName": "Good Morning Britain Controversies",
    "timelineDescription": "Notable incidents where Good Morning Britain hosts made dismissive or condescending comments about working-class people",
    "maxEvents": 10,
    "isFactual": true
  }'
```

### 2. Optimize Prompts Based on Outputs
```bash
# First, save the outputs from step 1, then:
curl -X POST http://localhost:3000/api/debug/optimize-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "step": "events",
    "currentSystemPrompt": "PASTE_SYSTEM_PROMPT_FROM_DEBUG_LOG",
    "currentUserPrompt": "PASTE_USER_PROMPT_FROM_DEBUG_LOG",
    "outputs": [PASTE_EVENTS_ARRAY_FROM_RESPONSE],
    "debugLog": "PASTE_FULL_DEBUG_LOG",
    "optimizationGoal": "Generate more diverse events across different years, avoid repetitive complaint statistics"
  }'
```

### 3. Test with Optimized Prompts
```bash
# Use the promptId from step 2:
curl -X POST http://localhost:3000/api/debug/test-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "step": "events",
    "timelineName": "Good Morning Britain Controversies",
    "timelineDescription": "Notable incidents where Good Morning Britain hosts made dismissive or condescending comments about working-class people",
    "maxEvents": 10,
    "isFactual": true,
    "promptId": "PASTE_PROMPT_ID_FROM_STEP_2"
  }'
```

### 4. List Saved Prompts
```bash
curl http://localhost:3000/api/debug/prompts?step=events
```

### 5. Get Latest Prompt
```bash
curl http://localhost:3000/api/debug/prompts?step=events&latest=true
```

