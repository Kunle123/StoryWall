import { NextRequest, NextResponse } from 'next/server';

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

    const aiApiKey = process.env.OPENAI_API_KEY;
    
    if (!aiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Please add it to your environment variables.' },
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

    // Build prompt for description generation
    const descriptionPrompt = `Timeline Context: ${timelineDescription}\n\nGenerate descriptions for these ${events.length} events:\n${events.map((e: any, i: number) => `${i + 1}. ${e.year}: ${e.title}`).join('\n')}\n\nReturn JSON: { "descriptions": ["description 1", "description 2", ...] } with exactly ${events.length} descriptions in the same order.`;
    
    // If imageStyle is provided, also generate optimized image prompts
    let imagePromptRequest = '';
    if (imageStyle) {
      const colorContext = themeColor ? `The selected theme color is ${themeColor}. Use this color prominently in the visual composition - as primary backgrounds, key elements, or atmospheric lighting.` : '';
      imagePromptRequest = `\n\nAdditionally, generate optimized image prompts for each event. These prompts will be used to create ${imageStyle} style illustrations. ${colorContext} Each image prompt should:\n- Be visually descriptive and specific\n- Include key visual elements from the event\n- Suggest composition and atmosphere\n- Be optimized for ${imageStyle} style illustration\n- Include the year/period context\n- IMPORTANT: If the event involves famous people, use "stylized representation" or "symbolic illustration" style - focus on historical setting, period-appropriate clothing, and context rather than specific facial features or direct likenesses\n\nReturn both descriptions and imagePrompts as JSON: { "descriptions": [...], "imagePrompts": [...] } with exactly ${events.length} items in each array.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use gpt-4o-mini for descriptions - much faster (3-5x) and cheaper, quality is still excellent
                model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a timeline description writer and visual narrative expert. ${styleInstructions[normalizedStyle] || styleInstructions.narrative} Generate engaging descriptions for historical events. Each description should be 2-4 sentences and relevant to the event title and timeline context.${imagePromptRequest ? ' Additionally, create detailed image prompts optimized for visual illustration that capture the essence, composition, and atmosphere of each historical event.' : ''} Return descriptions as a JSON object with a "descriptions" array.${imagePromptRequest ? ' If image style context is provided, also return an "imagePrompts" array with optimized visual prompts for each event.' : ''}`,
          },
          {
            role: 'user',
            content: descriptionPrompt + imagePromptRequest,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        // Optimize token usage: ~150 tokens per description + ~100 per image prompt
        // Reserve extra for JSON structure and instructions
        max_tokens: Math.min(4000, (events.length * 250) + 500),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate descriptions from OpenAI API', details: errorData.message || errorData.error?.message || 'Unknown error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    const content = JSON.parse(data.choices[0].message.content);
    
    if (!content.descriptions || !Array.isArray(content.descriptions)) {
      throw new Error('Invalid descriptions format in OpenAI response');
    }
    
    let descriptions = content.descriptions.map((desc: any) => String(desc || 'Description not generated.'));
    
    // Ensure we have the same number of descriptions as events
    while (descriptions.length < events.length) {
      descriptions.push('Description not generated.');
    }
    
    // Extract image prompts if provided
    let imagePrompts: string[] | undefined = undefined;
    if (imageStyle && content.imagePrompts && Array.isArray(content.imagePrompts)) {
      imagePrompts = content.imagePrompts.map((prompt: any) => String(prompt || ''));
      // Ensure we have the same number of image prompts as events
      if (imagePrompts) {
        while (imagePrompts.length < events.length) {
          imagePrompts.push('');
        }
        imagePrompts = imagePrompts.slice(0, events.length);
      }
    }
    
    const responseData: { descriptions: string[]; imagePrompts?: string[] } = {
      descriptions: descriptions.slice(0, events.length)
    };
    
    if (imagePrompts) {
      responseData.imagePrompts = imagePrompts;
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error generating descriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

