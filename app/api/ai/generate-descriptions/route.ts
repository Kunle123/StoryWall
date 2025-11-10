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

    // Build prompt for description generation
    const descriptionPrompt = `Timeline Context: ${timelineDescription}\n\nGenerate descriptions for these ${events.length} events:\n${events.map((e: any, i: number) => `${i + 1}. ${e.year}: ${e.title}`).join('\n')}\n\nReturn JSON: { "descriptions": ["description 1", "description 2", ...] } with exactly ${events.length} descriptions in the same order.`;
    
    // Always generate image prompts - focused on what should be visually depicted
    const imageStyleContext = imageStyle ? `The image style will be ${imageStyle}.` : 'The image style will be determined later.';
    const colorContext = themeColor ? `The theme color is ${themeColor} - use this color subtly as a minor accent or motif, not as the dominant color scheme.` : '';
    
    const imagePromptRequest = `\n\nAdditionally, generate a separate image description for each event that will be part of a visual narrative sequence. These images will work together to tell the story of the timeline, so create a BALANCED and VARIED sequence of scenes. ${imageStyleContext} ${colorContext}\n\nIMPORTANT: When creating the image descriptions, ensure VARIETY across the sequence:\n- Mix different LOCATION TYPES: indoor/outdoor, public/private, formal/casual, urban/natural, modern/historical\n- Vary COMPOSITIONS: wide shots, close-ups, different angles and perspectives\n- Balance MOODS: some bright and energetic, some moody and atmospheric, some warm and intimate\n- Include different ACTIVITIES: conversations, performances, work, leisure, travel, etc.\n- Vary TIME OF DAY: morning, afternoon, evening, night, sunset, dawn\n- Mix SETTINGS: studios, cafes, outdoor spaces, offices, homes, venues, etc.\n\nFor each event, create a rich, detailed image description that includes:\n- SPECIFIC LOCATION: Describe a vivid, concrete setting (e.g., "In a television studio", "Inside a moody, 1940s-style jazz bar", "At a rooftop garden cafe", "In a minimalist loft with floor-to-ceiling windows", "Outdoors in the Arctic Circle", "In an antique bookstore after hours")\n- VISUAL DETAILS: Include specific visual elements (e.g., "seated on a red sofa", "surrounded by sand dunes at sunset", "wood-paneled library filled with portraits", "neon-lit dive bar with graffiti-covered walls", "on eco-friendly stools surrounded by icebergs")\n- ATMOSPHERE/MOOD: Describe lighting, ambiance, and mood (e.g., "under bright lights and cameras", "warm lighting and jazz in the background", "moody", "neon-lit", "at dusk", "with candles lit")\n- ACTIVITIES/GESTURES: What are the subjects doing? (e.g., "chatting casually", "sipping herbal tea", "sitting on patterned rugs", "laughing over shots", "leaning on the balustrade")\n- ADDITIONAL ELEMENTS: Include environmental details that add richness (e.g., "piano playing", "crackling campfire", "holograms floating around", "LED panels pulsing to the beat", "candles lit", "typewriters clicking nearby", "smoke effects", "red velvet curtains")\n- Period-appropriate details if a year is provided\n\nFormat: Write as a single, flowing sentence or two that paints a complete visual scene. Be specific and evocative. Example: "In a television studio, seated on a red sofa, chatting casually under bright lights and cameras." or "Inside a moody, 1940s-style jazz bar with smoke effects, red velvet curtains, and piano playing." or "Outdoors in the Arctic Circle, seated on eco-friendly stools surrounded by icebergs."\n\nIMPORTANT: If the event involves famous people, focus on the setting, atmosphere, and context rather than specific facial features or direct likenesses.\n\nReturn both descriptions and imagePrompts as JSON: { "descriptions": [...], "imagePrompts": [...] } with exactly ${events.length} items in each array.`;

    // Use AI abstraction layer (supports OpenAI and Kimi)
    const maxTokens = Math.min(40000, (events.length * 350) + 500);
    
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
            content: descriptionPrompt + imagePromptRequest,
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
    
    console.log('[GenerateDescriptions] API response received:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasFirstChoice: !!data.choices?.[0],
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
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

