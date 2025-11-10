# Migration Example: Updating generate-descriptions to use Kimi

This shows how to update `app/api/ai/generate-descriptions/route.ts` to use the new AI abstraction layer.

## Before (OpenAI Direct)

```typescript
const aiApiKey = process.env.OPENAI_API_KEY;

if (!aiApiKey) {
  return NextResponse.json(
    { error: 'OPENAI_API_KEY is not configured...' },
    { status: 500 }
  );
}

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${aiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
  }),
});
```

## After (Using Abstraction Layer)

```typescript
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

// Get configured client (reads AI_PROVIDER env var)
let client;
try {
  client = getAIClient();
} catch (error: any) {
  return NextResponse.json(
    { error: error.message || 'AI provider not configured' },
    { status: 500 }
  );
}

const response = await createChatCompletion(client, {
  model: 'gpt-4o-mini', // Will be auto-mapped to Kimi model if using Kimi
  messages: [...],
  temperature: 0.8,
  max_tokens: Math.min(40000, (events.length * 350) + 500),
  response_format: { type: 'json_object' },
});
```

## Complete Updated File

Here's the key changes needed in `app/api/ai/generate-descriptions/route.ts`:

```typescript
// Add import at top
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

// Replace lines 40-47:
// OLD:
const aiApiKey = process.env.OPENAI_API_KEY;
if (!aiApiKey) {
  return NextResponse.json(
    { error: 'OPENAI_API_KEY is not configured...' },
    { status: 500 }
  );
}

// NEW:
let client;
try {
  client = getAIClient();
} catch (error: any) {
  return NextResponse.json(
    { error: error.message || 'AI provider not configured' },
    { status: 500 }
  );
}

// Replace lines 75-101:
// OLD:
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${aiApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: Math.min(40000, (events.length * 350) + 500),
  }),
});

// NEW:
const response = await createChatCompletion(client, {
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `You are a timeline description writer...`,
    },
    {
      role: 'user',
      content: descriptionPrompt + imagePromptRequest,
    },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.8,
  max_tokens: Math.min(40000, (events.length * 350) + 500),
});

// Replace lines 103-116:
// OLD:
if (!response.ok) {
  const errorText = await response.text();
  // ... error handling
}

const data = await response.json();

// NEW:
// createChatCompletion throws on error, so wrap in try-catch:
try {
  const data = await createChatCompletion(client, {...});
  // ... rest of processing
} catch (error: any) {
  console.error('AI API error:', error);
  return NextResponse.json(
    { error: 'Failed to generate descriptions', details: error.message },
    { status: 500 }
  );
}
```

## Important Notes

1. **Error Handling**: `createChatCompletion` throws errors, so wrap in try-catch
2. **Response Format**: The response structure is the same, so no changes needed to parsing logic
3. **Model Mapping**: The model name is automatically mapped (e.g., `gpt-4o-mini` → `moonshot-v1-8k`)
4. **Token Limits**: Be aware of Kimi's 8k token limit - may need to reduce `max_tokens` for very long timelines

