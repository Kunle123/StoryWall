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
    const { events, timelineDescription, writingStyle = 'narrative', imageStyle, themeColor, sourceRestrictions } = body;

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
    
    // Build source restrictions text if provided
    const sourceRestrictionsText = sourceRestrictions && Array.isArray(sourceRestrictions) && sourceRestrictions.length > 0
      ? `\n\nSOURCE RESTRICTIONS - CRITICAL: You MUST source all information, descriptions, and titles SOLELY from the following specific resources. Do not use any other sources:\n${sourceRestrictions.map((src: string, idx: number) => `  ${idx + 1}. ${src}`).join('\n')}\n\nIf information is not available in these sources, indicate that in the event description.`
      : '';

    // Build the lean user prompt
    const userPrompt = `Timeline Context: ${timelineDescription}${sourceRestrictionsText}

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
        // For 100 events, kimi-latest-32k supports 32k output tokens
        // Use calculation: (events * 300) + 2000, capped at 32k
        maxTokens = Math.min(32000, (events.length * 300) + 2000);
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
    console.log(`[GenerateDescriptions] Timeline description: ${timelineDescription.substring(0, 200)}...`);
    console.log(`[GenerateDescriptions] Writing style: ${writingStyle}`);
    console.log(`[GenerateDescriptions] Image style: ${imageStyle || 'not provided'}`);
    console.log(`[GenerateDescriptions] Theme color: ${themeColor || 'not provided'}`);
    
    // Use faster model for Kimi (kimi-k2-turbo-preview is optimized for speed: 60-100 tokens/s)
    const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
    
    // STEP 2: Detect if this is a progression and generate Anchor if needed
    // Check if events suggest a progression (stage-based titles, sequential development)
    // CRITICAL: Exclude episodic/competition/seasonal content - only detect CUMULATIVE progressions
    // A true progression means each stage builds on the previous (e.g., fetus grows, building is constructed)
    // NOT just sequential events (e.g., weekly competitions, decorations being put up, episodes)
    const progressionKeywords = ['development', 'formation', 'stage', 'phase', 'growth', 'progression', 'evolution', 'construction', 'building', 'formation', 'begins', 'appears', 'develops'];
    const exclusionKeywords = [
      'competition', 'dancing', 'bake off', 'strictly', 'episode', 'season', 'series', 'game', 'match', 'round', 'contest', 
      'award', 'ceremony', 'show', 'reality', 'decoration', 'decorating', 'christmas', 'xmas', 'holiday', 'festival',
      'event', 'performance', 'concert', 'tournament', 'league', 'championship', 'election', 'campaign', 'release',
      'announcement', 'launch', 'premiere', 'episode', 'installment'
    ];
    const eventTitles = events.map((e: any) => e.title?.toLowerCase() || '').join(' ');
    const timelineDescLower = timelineDescription.toLowerCase();
    
    // Check for exclusion patterns first (competition shows, episodic content, seasonal events)
    const isExcluded = exclusionKeywords.some(keyword => 
      timelineDescLower.includes(keyword) || 
      eventTitles.includes(keyword)
    );
    
    // Only detect as progression if:
    // 1. NOT excluded
    // 2. Has strong progression keywords (not just generic "stage" or "phase")
    // 3. Events suggest cumulative building (e.g., "neural tube forms" → "heart begins beating" → "limbs develop")
    //    NOT just sequential independent events (e.g., "Week 1: First Dance" → "Week 2: Second Dance")
    const hasStrongProgressionKeywords = ['development', 'formation', 'growth', 'progression', 'evolution', 'construction', 'building', 'develops', 'forms', 'grows'].some(keyword => 
      timelineDescLower.includes(keyword) || eventTitles.includes(keyword)
    );
    
    const appearsToBeProgression = !isExcluded && hasStrongProgressionKeywords && (
      // Must have progression keywords AND events that suggest cumulative stages
      (timelineDescLower.match(/\b(development|formation|construction|progression|evolution)\b/i) ||
       eventTitles.match(/\b(forms|develops|grows|begins|appears|emerges)\b/i)) &&
      // Exclude if it's clearly episodic (weekly episodes, rounds, matches)
      !timelineDescLower.match(/\b(week|episode|round|match|game|competition|dancing|bake|strictly)\s+\d+/i)
    );
    
    let anchorStyle: string | null = null;
    let progressionSubject: string | null = null;
    let factualDetails: Record<string, string[]> = {}; // Factual details from Knowledge Injection step
    
    // ALWAYS generate Anchor style for ALL timelines to ensure visual consistency
    // The Anchor provides a common visual theme that links all frames together
    console.log('[GenerateDescriptions] Generating Anchor style for visual consistency across all images...');
    
    try {
      const anchorResponse = await createChatCompletion(client, {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are a Director of Photography. Based on the subject, create a consistent visual style for a documentary series. Define the style, lighting, color, and camera rules. The output must be a single, reusable text block that will be applied to all images in the series.`,
          },
          {
            role: 'user',
            content: `Timeline Description: ${timelineDescription}\n\nEvent Titles: ${events.map((e: any) => e.title).join(', ')}\n\nUser's chosen image style: ${imageStyle || 'Illustration'}\n${themeColor ? `Theme color: ${themeColor}` : ''}\n\nCreate a detailed visual style (Anchor) for this documentary series that will be applied to EVERY image. This Anchor must include SPECIFIC visual instructions that create consistency:\n\nREQUIRED ELEMENTS:\n1. Color treatment: Specify a color wash, tint, or filter (e.g., "washed out grey-blue", "warm sepia tone", "cool cyan cast")\n2. Lighting/atmosphere: Specify lighting direction, quality, and mood (e.g., "soft directional light from upper left", "dramatic shadows", "even diffused lighting")\n3. Vignette or edge treatment: Specify if there should be a vignette, its color, and angle (e.g., "subtle dark vignette at edges", "45-degree angle gradient", "soft fade to edges")\n4. Composition approach: Specify framing or composition style (e.g., "centered composition", "rule of thirds", "wide angle perspective")\n${themeColor ? `5. Theme color integration: Incorporate ${themeColor} as a color wash, lighting tone, or vignette color` : ''}\n\nEXAMPLES OF GOOD ANCHORS:\n- "Apply a washed out grey-blue color wash with a subtle dark vignette sloping at a 45-degree angle. Soft directional lighting from upper left creates gentle shadows. Centered composition with slight desaturation."\n- "Warm sepia tone throughout with a soft circular vignette fading to edges. Even diffused lighting creates a documentary aesthetic. Balanced composition with muted color palette."\n- "Cool cyan cast applied as a color filter. Dramatic side lighting creates strong shadows. Wide angle perspective with subtle edge darkening."\n\nOutput a detailed, reusable style description (3-5 sentences) that includes these specific visual instructions. This Anchor will be prepended to every image prompt to ensure visual consistency.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300, // Increased to allow for detailed visual instructions (vignettes, color washes, lighting angles)
      });
      
      if (anchorResponse.choices?.[0]?.message?.content) {
        anchorStyle = anchorResponse.choices[0].message.content.trim();
        // Extract subject from timeline description
        const subjectMatch = timelineDescription.match(/(?:a|an|the)\s+([^,\.]+?)(?:\s+(?:inside|within|during|from|to|at|in)|$)/i);
        progressionSubject = subjectMatch ? subjectMatch[1].trim() : timelineDescription.split(' ').slice(0, 5).join(' ');
        console.log('[GenerateDescriptions] Generated Anchor:', anchorStyle.substring(0, 100) + '...');
        console.log('[GenerateDescriptions] Visual theme subject:', progressionSubject);
      }
    } catch (anchorError: any) {
      console.warn('[GenerateDescriptions] Failed to generate Anchor, continuing without it:', anchorError.message);
    }
    
    if (appearsToBeProgression) {
      
      // ✨ NEW: Knowledge Injection Step - Get factual details for each event
      // This ensures accuracy for scientific/medical topics
      try {
        console.log('[GenerateDescriptions] Starting Knowledge Injection step for factual accuracy...');
        
        // Build the fact-checking prompt with all events
        const factCheckingPrompt = `You are a medical fact-checker and researcher. Your ONLY task is to provide a concise, factual, and clinical description of the key physical developments for the given stages.

CRITICAL INSTRUCTIONS:
- DO NOT IMPROVISE. Base your description only on established, verifiable medical and embryological knowledge.
- BE OBJECTIVE & CLINICAL. Use precise terminology (e.g., "limb buds," "optic vesicles," "somites").
- FOCUS ON VISUALS. Describe the key observable, physical characteristics.
- NO PROSE. Output only factual bullet points.

Provide key factual developments for the following stages:
${events.map((e: any, idx: number) => {
          const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
          return `- ${eventLabel}`;
        }).join('\n')}

Return as JSON with keys matching the event labels (e.g., "Week 4: Neural Tube Forms" or just the title if no year), and values as arrays of factual bullet points.`;

        // Determine the domain for fact-checking (medical, construction, scientific, etc.)
        const isMedical = timelineDescription.toLowerCase().match(/\b(fetal|embryo|development|gestation|pregnancy|medical|anatomy|physiology|disease|health)\b/i);
        const isConstruction = timelineDescription.toLowerCase().match(/\b(construction|building|structure|foundation|framing)\b/i);
        const domainContext = isMedical 
          ? 'medical and embryological' 
          : isConstruction 
          ? 'construction and engineering' 
          : 'scientific and technical';
        
        const factCheckResponse = await createChatCompletion(client, {
          model: modelToUse,
          messages: [
            {
              role: 'system',
              content: `You are a fact-checker and researcher specializing in ${domainContext} knowledge. Your ONLY task is to provide a concise, factual, and objective description of the key observable characteristics for each given stage.

CRITICAL INSTRUCTIONS:
- DO NOT IMPROVISE. Base your description only on established, verifiable ${domainContext} knowledge.
- BE OBJECTIVE & PRECISE. Use accurate terminology specific to this domain.
- FOCUS ON VISUALS. Describe the key observable, physical characteristics that can be visually depicted.
- NO PROSE. Output only factual bullet points.
- Return ONLY valid JSON, no explanatory text.`,
            },
            {
              role: 'user',
              content: factCheckingPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for factual accuracy
          max_tokens: Math.min(4000, events.length * 200), // Enough tokens for factual details
        });
        
        if (factCheckResponse.choices?.[0]?.message?.content) {
          try {
            const factContent = JSON.parse(factCheckResponse.choices[0].message.content);
            // Map the factual details to events by matching keys
            events.forEach((e: any, idx: number) => {
              const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
              // Try multiple key formats
              const key1 = eventLabel;
              const key2 = e.title;
              const key3 = e.year ? `Week ${e.year}: ${e.title}` : e.title;
              
              const facts = factContent[key1] || factContent[key2] || factContent[key3] || 
                           factContent[`Event ${idx + 1}`] || factContent[`${idx + 1}`] || [];
              
              if (Array.isArray(facts) && facts.length > 0) {
                factualDetails[eventLabel] = facts.map((f: any) => String(f));
              } else if (typeof facts === 'string') {
                factualDetails[eventLabel] = [facts];
              }
            });
            
            console.log(`[GenerateDescriptions] Knowledge Injection: Retrieved factual details for ${Object.keys(factualDetails).length}/${events.length} events`);
            if (Object.keys(factualDetails).length > 0) {
              console.log('[GenerateDescriptions] Sample factual details:', JSON.stringify(Object.entries(factualDetails)[0]));
            }
          } catch (parseError: any) {
            console.warn('[GenerateDescriptions] Failed to parse factual details JSON:', parseError.message);
            console.warn('[GenerateDescriptions] Raw response:', factCheckResponse.choices[0].message.content.substring(0, 500));
          }
        }
      } catch (factError: any) {
        console.warn('[GenerateDescriptions] Knowledge Injection failed, continuing without factual details:', factError.message);
        // Continue without factual details - not a fatal error
      }
    }
    
    let data;
    try {
      // Build image prompt instructions - ALWAYS use Anchor if available for visual consistency
      const hasFactualDetails = anchorStyle && Object.keys(factualDetails).length > 0;
      const imagePromptInstructions = anchorStyle
        ? hasFactualDetails
          ? `For each event, create a concise image prompt that:
1. ALWAYS starts with the Anchor Style: "${anchorStyle.substring(0, 100)}${anchorStyle.length > 100 ? '...' : ''}"
2. Accurately depicts the Factual Details for that specific stage (provided below)
3. Focuses on the SUBJECT at that stage, not charts or abstract representations

Keep prompts concise - the event-specific details should be the focus. The Anchor provides visual consistency but shouldn't dominate the prompt.

Example:
- Event: "Week 4: Neural Tube Forms"
- Factual Details: ["The neural tube is closing", "A primitive S-shaped heart tube is forming", "The embryo is C-shaped"]
- Prompt: "Medically accurate 3D renderings with soft lighting. A 4-week old C-shaped embryo with the neural tube closing along its back and a primitive S-shaped heart tube forming."`
          : `For each event, create a concise image prompt that:
1. ALWAYS starts with the Anchor Style: "${anchorStyle.substring(0, 100)}${anchorStyle.length > 100 ? '...' : ''}"
2. Describes the specific event at that moment/stage
3. Focuses on the SUBJECT, not abstract representations

Keep prompts concise - the event content should be the focus. The Anchor provides visual consistency but shouldn't dominate.

Example: If Anchor is "medically accurate 3D renderings with soft lighting" and event is "Neural Tube Formation (Week 4)", the prompt should be: "Medically accurate 3D renderings with soft lighting. A 4-week old C-shaped embryo with the neural tube closing along its back."

CRITICAL: The Anchor Style must be included at the start of EVERY image prompt to maintain visual consistency across all images in the timeline.`
        : `For image prompts, create DIRECT, CLEAR descriptions that center the actual subject matter from the event title and description. The image prompt should directly state what to show at this specific stage/moment, allowing the viewer to see the progression of the story.

${themeColor ? `IMPORTANT: Incorporate the theme color (${themeColor}) as a subtle visual motif throughout the image prompts. Use it as an accent color, lighting tone, or atmospheric element - not as the dominant color, but as a subtle thematic element that ties the series together.` : ''}

CRITICAL: When events represent stages in a progression (e.g., fetal development, construction phases, disease stages), each image prompt should show the SUBJECT at that specific stage, not charts, screens, or abstract representations. Examples:
- "Neural Tube Formation" (Week 4) → "A detailed image of a fetus at 4 weeks gestation showing neural tube formation"
- "Foundation Laid" (Construction) → "A detailed image of a construction site showing the foundation being laid"
- "Heart Begins Beating" (Week 5) → "A detailed image of a fetus at 5 weeks gestation showing the developing heart"
- "Framing Complete" (Construction) → "A detailed image of a building showing the completed structural framing"

For non-progression events:
- "A concert" → "A concert with musicians performing on stage"
- "A bomb explosion" → "A bomb explosion with debris and smoke"
- "A man giving a speech" → "A man standing and giving a speech to an audience"

The image prompt should be a clear, direct statement of what to depict at this specific moment/stage, centered on the subject from the title and description. Be specific and concrete, showing the actual subject at this point in the progression, not abstract artistic interpretations or meta-representations (charts, screens, etc.).`;
      
      data = await createChatCompletion(client, {
        model: modelToUse, // Use faster turbo model for Kimi
        messages: [
          {
            role: 'system',
            content: `You are a timeline description writer and visual narrative expert. ${styleInstructions[normalizedStyle] || styleInstructions.narrative} Generate engaging descriptions for historical events. Each description should be 2-4 sentences and relevant to the event title and timeline context.

${imagePromptInstructions}
- "Foundation Laid" (Construction) → "A detailed image of a construction site showing the foundation being laid"
- "Heart Begins Beating" (Week 5) → "A detailed image of a fetus at 5 weeks gestation showing the developing heart"
- "Framing Complete" (Construction) → "A detailed image of a building showing the completed structural framing"

For non-progression events:
- "A concert" → "A concert with musicians performing on stage"
- "A bomb explosion" → "A bomb explosion with debris and smoke"
- "A man giving a speech" → "A man standing and giving a speech to an audience"

The image prompt should be a clear, direct statement of what to depict at this specific moment/stage, centered on the subject from the title and description. Be specific and concrete, showing the actual subject at this point in the progression, not abstract artistic interpretations or meta-representations (charts, screens, etc.).

Return both as a JSON object with "descriptions" and "imagePrompts" arrays, each containing exactly ${events.length} items.`,
          },
          {
            role: 'user',
            content: hasFactualDetails
              ? `${userPrompt}\n\n**FACTUAL DETAILS FOR EACH EVENT (MUST BE ACCURATELY DEPICTED):**\n${events.map((e: any, idx: number) => {
                  const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
                  const facts = factualDetails[eventLabel] || [];
                  if (facts.length > 0) {
                    return `\n**Event ${idx + 1}: ${eventLabel}**\nFactual Details:\n${facts.map((f: string) => `- ${f}`).join('\n')}`;
                  }
                  return `\n**Event ${idx + 1}: ${eventLabel}**\n(No specific factual details available - use general knowledge)`;
                }).join('\n')}`
              : userPrompt,
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
      model: data.model || modelToUse || 'unknown',
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
    
    // Log generated image prompts for debugging
    console.log(`[GenerateDescriptions] Generated ${imagePrompts.length} image prompts:`);
    imagePrompts.forEach((prompt: string, idx: number) => {
      const eventTitle = events[idx]?.title || `Event ${idx + 1}`;
      console.log(`[GenerateDescriptions] Image prompt ${idx + 1} for "${eventTitle}": ${prompt.substring(0, 300)}${prompt.length > 300 ? '...' : ''}`);
    });
    
    const responseData: any = {
      descriptions: descriptions.slice(0, events.length),
      imagePrompts: imagePrompts
    };
    
    // Include Anchor if generated
    if (anchorStyle) {
      responseData.anchorStyle = anchorStyle;
      responseData.progressionSubject = progressionSubject;
    }
    
    // Include factual details if available (for debugging and potential future use)
    if (Object.keys(factualDetails).length > 0) {
      responseData.factualDetails = factualDetails;
      console.log('[GenerateDescriptions] Including factual details in response');
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

