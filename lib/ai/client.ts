/**
 * AI Provider Abstraction Layer
 * Supports both OpenAI and Kimi (Moonshot AI) APIs
 */

export type AIProvider = 'openai' | 'kimi';

export interface AIClientConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
  tools?: Array<{ type: string; [key: string]: any }>; // For web search and other tools
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Get the appropriate API base URL for the provider
 */
function getBaseURL(provider: AIProvider): string {
  switch (provider) {
    case 'kimi':
      return 'https://api.moonshot.cn/v1';
    case 'openai':
      return 'https://api.openai.com/v1';
    default:
      return 'https://api.openai.com/v1';
  }
}

/**
 * Get the appropriate model name for the provider
 * Maps OpenAI models to Kimi equivalents based on context window needs
 */
export function getModelForProvider(
  openAIModel: string,
  provider: AIProvider,
  maxTokens?: number,
  maxEvents?: number // Add maxEvents parameter to help with model selection
): string {
  if (provider === 'kimi') {
    // Determine which Kimi model to use based on context needs
    // OpenAI models have 128k context, so we need Kimi models with similar capacity
    
    // For 100 events, try K2 models first (may support higher output limits)
    // If 32k tokens are requested, use K2 models which may support it
    if (maxEvents && maxEvents >= 100) {
      // Try K2 models for 100 events - they may support higher output limits
      const modelMap: Record<string, string> = {
        'gpt-4o': 'kimi-k2-0905-preview', // 256k context, latest K2 model
        'gpt-4o-mini': 'kimi-k2-turbo-preview', // 256k context, optimized for speed
        'gpt-4': 'kimi-k2-0905-preview',
        'gpt-3.5-turbo': 'kimi-k2-turbo-preview',
      };
      return modelMap[openAIModel] || 'kimi-k2-turbo-preview';
    }
    
    // For very long contexts (30k+ tokens), use the largest models
    // K2 models have 256k context and may support higher output limits
    if (maxTokens && maxTokens > 30000) {
      const modelMap: Record<string, string> = {
        'gpt-4o': 'kimi-k2-0905-preview', // 256k context, latest K2 model
        'gpt-4o-mini': 'kimi-k2-turbo-preview', // 256k context, optimized for speed (60-100 tokens/s)
        'gpt-4': 'kimi-k2-0905-preview',
        'gpt-3.5-turbo': 'kimi-k2-turbo-preview',
      };
      return modelMap[openAIModel] || 'kimi-k2-turbo-preview';
    }
    
    // For large output requests (16k-30k tokens), also use K2 models
    // They may support higher output limits than moonshot-v1 models
    if (maxTokens && maxTokens > 16000) {
      const modelMap: Record<string, string> = {
        'gpt-4o': 'kimi-k2-0905-preview', // Try K2 for large outputs
        'gpt-4o-mini': 'kimi-k2-turbo-preview', // Try K2 for large outputs
        'gpt-4': 'kimi-k2-0905-preview',
        'gpt-3.5-turbo': 'kimi-k2-turbo-preview',
      };
      return modelMap[openAIModel] || 'kimi-k2-turbo-preview';
    }
    
    // For moderate contexts (8k-30k tokens), use 128k model
    if (maxTokens && maxTokens > 8000) {
      const modelMap: Record<string, string> = {
        'gpt-4o': 'moonshot-v1-128k', // 128k context
        'gpt-4o-mini': 'moonshot-v1-128k',
        'gpt-4': 'moonshot-v1-128k',
        'gpt-3.5-turbo': 'moonshot-v1-128k',
      };
      return modelMap[openAIModel] || 'moonshot-v1-128k';
    }
    
    // For short contexts (<8k tokens), use 32k model for better quality
    // Default to 32k for better quality, fallback to 8k if needed
    const modelMap: Record<string, string> = {
      'gpt-4o': 'moonshot-v1-32k', // 32k context for better quality
      'gpt-4o-mini': 'moonshot-v1-32k',
      'gpt-4': 'moonshot-v1-32k',
      'gpt-3.5-turbo': 'moonshot-v1-32k',
    };
    return modelMap[openAIModel] || 'moonshot-v1-32k';
  }
  return openAIModel;
}

/**
 * Get Kimi model for complex reasoning tasks
 * Use this for tasks requiring multi-step reasoning
 */
export function getKimiThinkingModel(): string {
  return 'kimi-k2-thinking'; // 256k context, advanced reasoning
}

/**
 * Get Kimi model for fast responses
 * Use this when speed is more important than reasoning
 */
export function getKimiTurboModel(): string {
  return 'kimi-k2-turbo-preview'; // 256k context, 60-100 tokens/s
}

/**
 * Create a chat completion using the configured provider
 */
export async function createChatCompletion(
  config: AIClientConfig,
  options: ChatCompletionOptions & { maxEvents?: number } // Add maxEvents to options
): Promise<ChatCompletionResponse> {
  const baseURL = config.baseURL || getBaseURL(config.provider);
  // Pass max_tokens and maxEvents to model selection to choose appropriate context window
  const model = getModelForProvider(options.model, config.provider, options.max_tokens, options.maxEvents);
  
  const url = `${baseURL}/chat/completions`;
  
  // Build request body - some parameters may not be supported by all providers
  const requestBody: any = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens,
  };
  
  // Add optional parameters if provided
  // Kimi API supports JSON mode - see https://platform.moonshot.ai/docs/guide/use-json-mode-feature-of-kimi-api
  // For Kimi, use response_format with type: 'json_object' to enable JSON mode
  if (options.response_format) {
    if (config.provider === 'kimi') {
      // Kimi supports JSON mode - use the same format as OpenAI
      requestBody.response_format = options.response_format;
    } else {
      // OpenAI also supports response_format
      requestBody.response_format = options.response_format;
    }
  }
  // Tools (like web_search) - may not be supported by all providers
  if (options.tools && options.tools.length > 0) {
    requestBody.tools = options.tools;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    
    throw new Error(
      `AI API error (${response.status}): ${errorData.error?.message || errorData.error || errorText}`
    );
  }

  return await response.json();
}

/**
 * Get the configured AI client from environment variables
 */
export function getAIClient(): AIClientConfig {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase() as AIProvider;
  
  if (provider === 'kimi') {
    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      throw new Error('KIMI_API_KEY is not configured. Please add it to your environment variables.');
    }
    return {
      provider: 'kimi',
      apiKey,
      baseURL: process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1',
    };
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Please add it to your environment variables.');
    }
    return {
      provider: 'openai',
      apiKey,
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    };
  }
}

