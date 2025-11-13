# Kimi API Integration Guide

This guide explains how to integrate Kimi (Moonshot AI) API as an alternative to OpenAI in your StoryWall project.

## Overview

Kimi is a Chinese AI assistant API by Moonshot AI that provides similar functionality to OpenAI's API. The integration uses an abstraction layer that allows you to switch between OpenAI and Kimi seamlessly.

## Setup

### 1. Get Kimi API Key

**Option 1: CometAPI (English - Recommended for English speakers)**
1. Visit [CometAPI](https://www.cometapi.com)
2. Sign up with your email and describe your use case
3. You'll receive a free API key immediately
4. CometAPI provides English interface and documentation
5. **Note:** CometAPI uses the same Moonshot AI backend, so the API is compatible

**Option 2: Moonshot AI Platform (English Interface)**
1. Visit [Moonshot AI Platform](https://platform.moonshot.ai/) (note: `.ai` domain, not `.cn`)
2. Sign up for an account using email or Google account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key
6. **Note:** The interface may have English support, or you can use browser translation

**Option 3: Moonshot AI Platform (Chinese - Original)**
1. Visit [Moonshot AI Platform (Chinese)](https://platform.moonshot.cn/)
2. Sign up for an account
3. Use browser translation (Chrome/Edge auto-translate) if needed
4. Navigate to API Keys section
5. Create a new API key
6. Copy the API key

**Option 4: Vercel AI Gateway (If using Vercel)**
- If you're deploying on Vercel, you can use Vercel's AI Gateway
- Set model to `moonshotai/kimi-k2` in your AI SDK
- Provides built-in observability and automatic retries
- See [Vercel AI Gateway Docs](https://vercel.com/changelog/moonshot-ai-kimi-k2-model-is-now-supported-in-vercel-ai-gateway)

**Note:** The API endpoints and authentication are the same regardless of which platform you use. The base URL is `https://api.moonshot.cn/v1`.

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Choose your AI provider: 'openai' or 'kimi'
AI_PROVIDER=kimi

# Kimi API Configuration
KIMI_API_KEY=your_kimi_api_key_here

# Optional: Custom base URL (defaults to https://api.moonshot.cn/v1)
# KIMI_API_BASE_URL=https://api.moonshot.cn/v1

# Keep OpenAI key as fallback (optional)
# OPENAI_API_KEY=your_openai_key_here
```

### 3. Model Mapping

The integration automatically maps OpenAI models to Kimi equivalents based on context window needs:

#### Automatic Model Selection

The system intelligently selects Kimi models based on `max_tokens`:

| Context Size | OpenAI Model | Kimi Model | Context Window |
|-------------|-------------|------------|----------------|
| **Very Long** (>30k tokens) | `gpt-4o` | `kimi-k2-0905-preview` | 256K tokens |
| **Very Long** (>30k tokens) | `gpt-4o-mini` | `kimi-k2-turbo-preview` | 256K tokens (faster) |
| **Long** (8k-30k tokens) | `gpt-4o` / `gpt-4o-mini` | `moonshot-v1-128k` | 128K tokens |
| **Short** (<8k tokens) | `gpt-4o` / `gpt-4o-mini` | `moonshot-v1-32k` | 32K tokens |

#### Available Kimi Models

| Model Name | Context Window | Best For |
|-----------|----------------|----------|
| `moonshot-v1-8k` | 8,192 tokens | Short conversations |
| `moonshot-v1-32k` | 32,768 tokens | Moderate-length interactions |
| `moonshot-v1-128k` | 131,072 tokens | Long documents/conversations |
| `kimi-k2-0905-preview` | 262,144 tokens | Latest K2, enhanced capabilities |
| `kimi-k2-turbo-preview` | 262,144 tokens | Fast (60-100 tokens/s) |
| `kimi-k2-thinking` | 262,144 tokens | Complex reasoning tasks |
| `kimi-latest` | 262,144 tokens | Current default K2 version |

**Note:** The system automatically selects the appropriate model based on your `max_tokens` parameter. For very long timelines (40k+ tokens), it will use the 256K context models.

## Usage

### Automatic Provider Selection

The code automatically uses the provider specified in `AI_PROVIDER` environment variable:

```typescript
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

// Get configured client (reads from AI_PROVIDER env var)
const client = getAIClient();

// Use it just like OpenAI
const response = await createChatCompletion(client, {
  model: 'gpt-4o', // Will be mapped to moonshot-v1-8k if using Kimi
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
```

### Manual Provider Selection

You can also manually specify the provider:

```typescript
import { createChatCompletion } from '@/lib/ai/client';

// Use Kimi explicitly
const kimiClient = {
  provider: 'kimi' as const,
  apiKey: process.env.KIMI_API_KEY!,
};

const response = await createChatCompletion(kimiClient, {
  model: 'moonshot-v1-8k',
  messages: [...],
});
```

## Migration Steps

### Step 1: Update Existing API Routes

Replace direct OpenAI calls with the abstraction layer:

**Before:**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
  }),
});
```

**After:**
```typescript
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

const client = getAIClient();
const response = await createChatCompletion(client, {
  model: 'gpt-4o-mini', // Will be auto-mapped if using Kimi
  messages: [...],
});
```

### Step 2: Update Files

The following files need to be updated to use the new abstraction:

1. `app/api/ai/generate-events/route.ts`
2. `app/api/ai/generate-descriptions/route.ts`
3. `app/api/ai/generate-images/route.ts` (for person extraction and image URL finding)
4. `app/api/test-person-extraction/route.ts`

### Step 3: Test

1. Set `AI_PROVIDER=kimi` in your `.env.local`
2. Test event generation
3. Test description generation
4. Test image reference finding
5. Verify all functionality works as expected

## API Differences

### Response Format

Both APIs return similar JSON structures, but there may be minor differences:

- **OpenAI**: `{ choices: [{ message: { content: "..." } }] }`
- **Kimi**: Same structure (compatible)

### Rate Limits

- **OpenAI**: Varies by tier
- **Kimi**: Check [Kimi Pricing](https://platform.moonshot.cn/pricing) for current limits

### Token Limits

- **OpenAI**: 
  - `gpt-4o`: 128k tokens
  - `gpt-4o-mini`: 128k tokens
- **Kimi**: 
  - `moonshot-v1-8k`: 8k tokens
  - `moonshot-v1-32k`: 32k tokens
  - `moonshot-v1-128k`: 128k tokens
  - `kimi-k2-*`: 256k tokens (latest models)

**Important:** The system automatically selects the appropriate Kimi model based on your `max_tokens`:
- **<8k tokens**: Uses `moonshot-v1-32k` (32k context)
- **8k-30k tokens**: Uses `moonshot-v1-128k` (128k context)
- **>30k tokens**: Uses `kimi-k2-turbo-preview` or `kimi-k2-0905-preview` (256k context)

This means Kimi can handle even longer timelines than OpenAI! The 256K context models are perfect for very long timelines.

### Error Handling

Both APIs use similar error formats, but error messages may differ. The abstraction layer normalizes errors.

## Cost Comparison

Compare costs between providers:

- **OpenAI**: [OpenAI Pricing](https://openai.com/api/pricing/)
- **Kimi**: [Kimi Pricing](https://platform.moonshot.cn/pricing)

## Troubleshooting

### Issue: "KIMI_API_KEY is not configured"

**Solution:** Add `KIMI_API_KEY` to your `.env.local` file.

### Issue: "Model not found"

**Solution:** Check the model mapping in `lib/ai/client.ts`. Kimi model names may have changed. Update the `getModelForProvider` function.

### Issue: Token limit exceeded

**Solution:** 
- Reduce `max_tokens` in requests
- Split large requests into smaller batches
- Consider using OpenAI for very long timelines

### Issue: API returns different format

**Solution:** Check Kimi API documentation for latest response format. Update `createChatCompletion` if needed.

## Testing

Test the integration:

```bash
# Test with Kimi
AI_PROVIDER=kimi npm run dev

# Test with OpenAI (default)
AI_PROVIDER=openai npm run dev
```

## Next Steps

1. ✅ Create abstraction layer (`lib/ai/client.ts`)
2. ⏳ Update `generate-events/route.ts`
3. ⏳ Update `generate-descriptions/route.ts`
4. ⏳ Update `generate-images/route.ts`
5. ⏳ Update `test-person-extraction/route.ts`
6. ⏳ Test all endpoints
7. ⏳ Update documentation

## Additional Resources

### English Resources
- **Kimi K2 API Documentation**: [kimi-k2.ai/api-docs](https://kimi-k2.ai/api-docs)
- **Kimi AI API Guide**: [kimi-ai.chat/docs/api](https://kimi-ai.chat/docs/api)
- **Building Apps with Kimi API**: [kimi-ai.chat/guide/building-apps-with-kimi-ai-api](https://kimi-ai.chat/guide/building-apps-with-kimi-ai-api)
- **Alibaba Cloud Model Studio**: [alibabacloud.com/help/en/model-studio/kimi-api](https://www.alibabacloud.com/help/en/model-studio/kimi-api)

### Sign-Up Platforms
- **CometAPI (English)**: [cometapi.com](https://www.cometapi.com) - Free API key, English interface
- **Moonshot AI Platform (English)**: [platform.moonshot.ai](https://platform.moonshot.ai/) - Official platform, may have English support
- **Moonshot AI Platform (Chinese)**: [platform.moonshot.cn](https://platform.moonshot.cn/) - Original platform, use browser translation
- **Vercel AI Gateway**: [Vercel AI Gateway](https://vercel.com/changelog/moonshot-ai-kimi-k2-model-is-now-supported-in-vercel-ai-gateway) - If using Vercel

### Chinese Resources
- [Kimi API Documentation (Chinese)](https://platform.moonshot.cn/docs)
- [Moonshot AI Platform (Chinese)](https://platform.moonshot.cn/)

### General
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Kimi Official Website](https://kimi.online)

