import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Generate descriptions and image prompts for timeline events
 * 
 * Request Body:
 * {
 *   events: Array<{ year: number, title: string }>
 *   timelineDescription: string
 *   writingStyle: string
 *   imageStyle?: string (optional - for context-aware image prompts)
 *   themeColor?: string (optional - for context-aware image prompts)
 * }
 * 
 * Response:
 * {
 *   descriptions: Array<string>
 *   imagePrompts?: Array<string> (optional - AI-generated prompts optimized for image generation)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, timelineDescription, writingStyle = 'narrative', imageStyle, themeColor } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (!timelineDescription) {
      return NextResponse.json(
        { error: 'Timeline description is required' },
        { status: 400 }
      );
    }

    // Get configured AI client (OpenAI or Kimi based on AI_PROVIDER env var)
    let client;
    try {
      client = getAIClient();
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'AI provider not configured. Please set AI_PROVIDER and API key in environment variables.' },
        { status: 500 }
      );
    }

    // AI integration with OpenAI GPT-4
    // Map writing styles (case-insensitive) to instructions
    const styleInstructions: Record<string, string> = {
      narrative: 'Write in an engaging narrative style with vivid descriptions and compelling storytelling.',
      jovial: 'Write in a cheerful, lighthearted, and humorous tone. Use upbeat language and positive phrasing.',
      professional: 'Write in a formal, professional, and business-like tone. Use precise, clear, and authoritative language.',
      casual: 'Write in a casual, conversational tone. Use friendly, relaxed language as if speaking to a friend.',
      academic: 'Write in an academic, scholarly tone. Use formal language, precise terminology, and analytical perspective.',
      poetic: 'Write in a poetic, lyrical style with vivid imagery, metaphor, and emotional resonance. Use evocative language.',
      // Fallback mappings (for backwards compatibility)
      formal: 'Write in a formal, academic tone.',
      journalistic: 'Write in a journalistic, objective tone.',
    };
    
    // Normalize writing style to lowercase for lookup
    const normalizedStyle = writingStyle.toLowerCase();

    // Build lean, optimized prompt to avoid repetition
    // Combine style and color context concisely
    const imageContextParts: string[] = [];
    if (imageStyle) {
      imageContextParts.push(`Image style: ${imageStyle}.`);
    }
    if (themeColor) {
      imageContextParts.push(`Theme color: ${themeColor} (use as a subtle accent).`);
    }
    const imageContext = imageContextParts.join(' ');
    
    // Build the lean user prompt
    const userPrompt = `Timeline Context: ${timelineDescription}

${imageContext ? imageContext + '\n\n' : ''}Generate descriptions and image prompts for these ${events.length} events:

${events.map((e: any, i: number) => `${i + 1}. ${e.year}: ${e.title}`).join('\n')}
`;

    // Use AI abstraction layer (supports OpenAI and Kimi)
    const startTime = Date.now();
    let maxTokens: number;
    if (client.provider === 'kimi') {
      // For Kimi, use kimi-latest-128k for 100 events (supports 128k output)
      // For smaller requests, use appropriate limits
      if (events.length >= 100) {
        // For 100 events, kimi-latest-128k supports 128k output tokens
        // Use conservative calculation: (events * 300) + 2000, capped at reasonable limit
        maxTokens = Math.min(64000, (events.length * 300) + 2000);
      } else if (events.length > 50) {
        // For large requests, try 32k tokens
        maxTokens = Math.min(32000, (events.length * 600) + 4000);
      } else {
        // For smaller requests, use 16k cap (moonshot-v1-128k limit)
        maxTokens = Math.min(16384, (events.length * 600) + 4000);
      }
    } else {
      // For OpenAI, we can request much larger outputs
      maxTokens = Math.min(40000, (events.length * 350) + 500);
    }
    
    console.log(`[GenerateDescriptions] Request config: provider=${client.provider}, events=${events.length}, maxTokens=${maxTokens}`);
    
    let data;
    try {
      data = await createChatCompletion(client, {
        model: 'gpt-4o-mini', // Will be auto-mapped to appropriate Kimi model if using Kimi
        messages: [
          {
            role: 'system',
            content: `You are a timeline description writer and visual narrative expert. ${styleInstructions[normalizedStyle] || styleInstructions.narrative} Generate engaging descriptions for historical events. Each description should be 2-4 sentences and relevant to the event title and timeline context. Additionally, create a balanced and varied sequence of rich, detailed image descriptions that work together as a visual narrative. Vary locations (indoor/outdoor, public/private), compositions, moods, activities, time of day, and settings across the sequence. Each image description should be a single flowing sentence or two that paints a complete, evocative visual scene with specific locations, visual details, atmosphere, activities, and environmental elements. Return both as a JSON object with "descriptions" and "imagePrompts" arrays, each containing exactly ${events.length} items.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: maxTokens,
      });
    } catch (error: any) {
      console.error('[GenerateDescriptions] AI API error:', error);
      console.error('[GenerateDescriptions] Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        name: error.name,
      });
      return NextResponse.json(
        { error: 'Failed to generate descriptions', details: error.message || 'Unknown error' },
        { status: 500 }
      );
    }
    
    const generationTime = Date.now() - startTime;
    console.log('[GenerateDescriptions] API response received:', {
      provider: client.provider,
      model: data.model || 'unknown',
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasFirstChoice: !!data.choices?.[0],
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage || 'not provided',
      generationTimeMs: generationTime,
      generationTimeSec: (generationTime / 1000).toFixed(2),
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[GenerateDescriptions] Invalid response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format from AI API');
    }
    
    let content;
    try {
      const contentText = data.choices[0].message.content;
      if (typeof contentText !== 'string') {
        throw new Error(`Expected string content, got ${typeof contentText}`);
      }
      content = JSON.parse(contentText);
    } catch (parseError: any) {
      console.error('[GenerateDescriptions] Failed to parse JSON content:', {
        content: data.choices[0].message.content?.substring(0, 500),
        error: parseError.message,
      });
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
    
    if (!content.descriptions || !Array.isArray(content.descriptions)) {
      throw new Error('Invalid descriptions format in OpenAI response');
    }
    
    let descriptions = content.descriptions.map((desc: any) => String(desc || 'Description not generated.'));
    
    // Ensure we have the same number of descriptions as events
    while (descriptions.length < events.length) {
      descriptions.push('Description not generated.');
    }
    
    // Extract image prompts (always generated now)
    let imagePrompts: string[] = [];
    if (content.imagePrompts && Array.isArray(content.imagePrompts)) {
      imagePrompts = content.imagePrompts.map((prompt: any) => String(prompt || ''));
    }
    
    // Ensure we have the same number of image prompts as events
    while (imagePrompts.length < events.length) {
      imagePrompts.push('');
    }
    imagePrompts = imagePrompts.slice(0, events.length);
    
    const responseData: { descriptions: string[]; imagePrompts: string[] } = {
      descriptions: descriptions.slice(0, events.length),
      imagePrompts: imagePrompts
    };
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error generating descriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

