import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';
import { loadAnchorPrompts, loadDescriptionPrompts } from '@/lib/prompts/loader';
import { testNewsworthiness } from '@/lib/utils/newsworthinessTest';

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
    const { events, timelineDescription, writingStyle = 'narrative', imageStyle, themeColor, sourceRestrictions, timelineTitle } = body;
    
    // Test newsworthiness if timeline title is provided
    let canUseCelebrityLikeness = false;
    let newsworthinessResult = null;
    let hasViolation = false;
    
    if (timelineTitle && timelineDescription) {
      try {
        console.log('[GenerateDescriptions] Testing newsworthiness for celebrity likeness usage...');
        newsworthinessResult = await testNewsworthiness(timelineTitle, timelineDescription);
        canUseCelebrityLikeness = newsworthinessResult.canUseLikeness;
        // Check if this is a celebrity timeline that failed the test
        // We'll detect this by checking if the test explicitly says it's about celebrities/entertainment
        const isCelebrityContent = newsworthinessResult.inferredAttributes?.subjects?.some((subject: string) => 
          subject.toLowerCase().includes('celebrity') || 
          subject.toLowerCase().includes('actor') ||
          subject.toLowerCase().includes('film') ||
          subject.toLowerCase().includes('movie')
        ) || timelineTitle.toLowerCase().includes('film') || 
           timelineTitle.toLowerCase().includes('movie') ||
           timelineDescription.toLowerCase().includes('celebrity') ||
           timelineDescription.toLowerCase().includes('actor');
        
        hasViolation = !canUseCelebrityLikeness && isCelebrityContent && newsworthinessResult.riskLevel === 'High';
        
        console.log('[GenerateDescriptions] Newsworthiness test result:', {
          canUseLikeness: canUseCelebrityLikeness,
          riskLevel: newsworthinessResult.riskLevel,
          hasViolation,
          isCelebrityContent,
        });
        
        // If violation detected, return error immediately
        if (hasViolation) {
          return NextResponse.json(
            { 
              error: 'This timeline violates our Terms and Conditions. Please amend your description.',
              newsworthinessViolation: {
                message: 'This timeline violates our Terms and Conditions. Please amend your description.',
                riskLevel: newsworthinessResult.riskLevel,
                recommendation: newsworthinessResult.recommendation || 'Please revise your timeline to focus on newsworthy events or non-celebrity subjects.',
              },
            },
            { status: 400 }
          );
        }
      } catch (testError: any) {
        console.warn('[GenerateDescriptions] Newsworthiness test failed, defaulting to safe mode:', testError.message);
        // Default to safe mode (no celebrity likenesses) if test fails
        canUseCelebrityLikeness = false;
        hasViolation = false; // Don't show violation if test failed
      }
    } else {
      console.log('[GenerateDescriptions] No timeline title provided, defaulting to safe mode (no celebrity likenesses)');
      canUseCelebrityLikeness = false;
      hasViolation = false;
    }

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

CRITICAL FOR IMAGE PROMPTS: Each image prompt must describe a LITERAL, RECOGNIZABLE scene with FACELESS MOOD DOUBLES:

1. RECOGNIZABLE SCENES: Describe specific, iconic scenes that would be instantly recognizable even with faceless characters
2. FACELESS MOOD DOUBLES: Replace characters with "faceless mannequin-like figures" (animated store mannequins) that have:
   - EXACT same physique/build as the character
   - EXACT same clothing and costume details
   - EXACT same posture, stance, and body language
   - EXACT same emotion conveyed through body language (not facial features)
   - NO faces - completely blank/smooth where face would be
3. HYPER-SPECIFIC DETAILS: Name EVERYTHING - locations, objects, actions, body positions, clothing details
4. DIRECT, CONCRETE LANGUAGE: What you would actually SEE if you were there

NEVER use poetic, metaphorical, or abstract language. Examples:
- BAD: "A journey through darkness", "The weight of destiny", "Metaphors of power"
- BAD: "A man crawling through a vent" (too vague)
- GOOD: "A faceless mannequin-like figure with the physique of a 1980s cop, wearing a torn white tank top with visible soot, barefoot with cuts, crawling on hands and knees through a narrow metal air vent in a 1980s corporate building, with emergency red lighting filtering through grates - instantly recognizable as the air vent crawl scene"
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
      // Load anchor prompts from files
      const anchorPrompts = loadAnchorPrompts({
        timelineDescription,
        eventTitles: events.map((e: any) => e.title).join(', '),
        imageStyle: imageStyle || 'Illustration',
        themeColor,
      });
      
      const anchorResponse = await createChatCompletion(client, {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: anchorPrompts.system,
          },
          {
            role: 'user',
            content: anchorPrompts.user,
          },
        ],
        temperature: 0.7,
        max_tokens: 600, // Increased to allow for comprehensive mood parameters (palette, setting, character, emotion, cinematography)
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
      // Load description prompts from files
      const hasFactualDetails = anchorStyle && Object.keys(factualDetails).length > 0;
      const descriptionPrompts = loadDescriptionPrompts({
        timelineDescription,
        events,
        writingStyle,
        imageStyle,
        themeColor,
        anchorStyle: anchorStyle ?? undefined,
        hasFactualDetails,
        sourceRestrictions,
        imageContext,
        eventCount: events.length,
        styleInstructions,
        canUseCelebrityLikeness,
      });
      
      // Build user prompt with factual details if available
      let finalUserPrompt = descriptionPrompts.user;
      if (hasFactualDetails) {
        finalUserPrompt += `\n\n**FACTUAL DETAILS FOR EACH EVENT (MUST BE ACCURATELY DEPICTED):**\n${events.map((e: any, idx: number) => {
          const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
          const facts = factualDetails[eventLabel] || [];
          if (facts.length > 0) {
            return `\n**Event ${idx + 1}: ${eventLabel}**\nFactual Details:\n${facts.map((f: string) => `- ${f}`).join('\n')}`;
          }
          return `\n**Event ${idx + 1}: ${eventLabel}**\n(No specific factual details available - use general knowledge)`;
        }).join('\n')}`;
      }
      
      data = await createChatCompletion(client, {
        model: modelToUse, // Use faster turbo model for Kimi
        messages: [
          {
            role: 'system',
            content: descriptionPrompts.system,
          },
          {
            role: 'user',
            content: finalUserPrompt,
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

