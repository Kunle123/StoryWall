import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';
import { loadUnifiedPrompts } from '@/lib/prompts/loader';
import { testNewsworthiness } from '@/lib/utils/newsworthinessTest';
import { hashContent, getCached, setCached } from '@/lib/utils/cache';

/**
 * OPTIMIZED V2: Single unified call for Anchor + Descriptions + Image Prompts
 * 
 * Quick wins implemented:
 * - Collapsed Anchor + Descriptions into 1 model call
 * - Inlined factual mode (conditional in prompt)
 * - Trimmed tokens (anchor preview 60-80 chars, removed duplicates)
 * - Added content-based caching
 * - Optimized newsworthiness test (parallel execution)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      events, 
      timelineDescription, 
      writingStyle = 'narrative', 
      imageStyle, 
      themeColor, 
      sourceRestrictions, 
      timelineTitle 
    } = body;
    
    // Validate inputs
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

    // Check cache first
    const cacheKey = hashContent({
      events: events.map((e: any) => ({ year: e.year, title: e.title })),
      timelineDescription,
      writingStyle,
      imageStyle,
      themeColor,
      sourceRestrictions,
    });
    
    const cached = getCached<any>(cacheKey);
    if (cached) {
      console.log('[GenerateDescriptionsV2] Cache hit!');
      return NextResponse.json(cached);
    }

    // Get AI client
    let client;
    try {
      client = getAIClient();
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'AI provider not configured' },
        { status: 500 }
      );
    }

    // Parallel: Newsworthiness test + progression detection
    const startTime = Date.now();
    
    const [newsworthinessResult, progressionInfo] = await Promise.allSettled([
      // Newsworthiness test (only if timeline title provided)
      timelineTitle && timelineDescription
        ? testNewsworthiness(timelineTitle, timelineDescription)
        : Promise.resolve({ 
            canUseLikeness: false, 
            riskLevel: 'Low' as const, 
            justification: '', 
            recommendation: '',
            inferredAttributes: undefined,
          }),
      
      // Progression detection (rule-based, no API call)
      Promise.resolve(detectProgression(timelineDescription, events)),
    ]);

    // Extract results
    let canUseCelebrityLikeness = false;
    let hasViolation = false;
    let newsworthinessData = null;
    
    if (newsworthinessResult.status === 'fulfilled') {
      newsworthinessData = newsworthinessResult.value;
      canUseCelebrityLikeness = newsworthinessData.canUseLikeness;
      
      // Check for violation
      const isCelebrityContent = newsworthinessData.inferredAttributes?.subjects?.some((subject: string) => 
        subject.toLowerCase().includes('celebrity') || 
        subject.toLowerCase().includes('actor') ||
        subject.toLowerCase().includes('film') ||
        subject.toLowerCase().includes('movie')
      ) || timelineTitle?.toLowerCase().includes('film') || 
         timelineTitle?.toLowerCase().includes('movie') ||
         timelineDescription.toLowerCase().includes('celebrity') ||
         timelineDescription.toLowerCase().includes('actor');
      
      hasViolation = !canUseCelebrityLikeness && isCelebrityContent && newsworthinessData.riskLevel === 'High';
      
      if (hasViolation) {
        return NextResponse.json(
          { 
            error: 'This timeline violates our Terms and Conditions. Please amend your description.',
            newsworthinessViolation: {
              message: 'This timeline violates our Terms and Conditions. Please amend your description.',
              riskLevel: newsworthinessData.riskLevel,
              recommendation: newsworthinessData.recommendation || 'Please revise your timeline to focus on newsworthy events or non-celebrity subjects.',
            },
          },
          { status: 400 }
        );
      }
    }

    const progression = progressionInfo.status === 'fulfilled' ? progressionInfo.value : null;
    
    // Get factual details if progression detected (parallel with main call if possible)
    let factualDetails: Record<string, string[]> = {};
    if (progression?.isProgression) {
      try {
        factualDetails = await getFactualDetails(client, events, timelineDescription);
      } catch (factError: any) {
        console.warn('[GenerateDescriptionsV2] Factual details failed, continuing:', factError.message);
      }
    }

    // Build image context (trimmed)
    const imageContextParts: string[] = [];
    if (imageStyle) imageContextParts.push(`Image style: ${imageStyle}`);
    if (themeColor) imageContextParts.push(`Theme: ${themeColor} (accent)`);
    const imageContext = imageContextParts.join('. ');

    // Build events with factual details
    const eventsWithFacts = events.map((e: any) => {
      const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
      return {
        ...e,
        facts: factualDetails[eventLabel] || [],
      };
    });

    // Load unified prompts (single call for everything)
    const unifiedPrompts = loadUnifiedPrompts({
      timelineDescription,
      events: eventsWithFacts,
      writingStyle,
      imageStyle,
      themeColor,
      sourceRestrictions,
      imageContext,
      eventCount: events.length,
      canUseCelebrityLikeness,
      hasFactualDetails: Object.keys(factualDetails).length > 0,
      // Anchor preview will be generated after first pass, but we'll use a placeholder
      anchorStylePreview: '', // Will be updated after generation
    });

    // Calculate max tokens (optimized)
    const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
    const baseTokens = 2000; // Base overhead
    const perEventTokens = 400; // Descriptions + image prompts per event
    const anchorTokens = 300; // Anchor style
    const maxTokens = Math.min(
      client.provider === 'kimi' ? 32000 : 40000,
      baseTokens + (events.length * perEventTokens) + anchorTokens
    );

    console.log(`[GenerateDescriptionsV2] Single unified call: events=${events.length}, maxTokens=${maxTokens}`);

    // SINGLE UNIFIED CALL: Anchor + Descriptions + Image Prompts
    const response = await createChatCompletion(client, {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: unifiedPrompts.system,
        },
        {
          role: 'user',
          content: unifiedPrompts.user,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const generationTime = Date.now() - startTime;
    console.log(`[GenerateDescriptionsV2] Generated in ${generationTime}ms`);

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from AI API');
    }

    // Parse response
    let content;
    try {
      content = JSON.parse(response.choices[0].message.content);
    } catch (parseError: any) {
      console.error('[GenerateDescriptionsV2] Parse error:', parseError.message);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Extract anchor style and create preview (60-80 chars)
    const anchorStyle = content.anchorStyle || '';
    const anchorStylePreview = anchorStyle.length > 80 
      ? anchorStyle.substring(0, 80) + '...'
      : anchorStyle;

    // Update image prompts to include anchor preview
    const items = content.items || [];
    const descriptions: string[] = [];
    const imagePrompts: string[] = [];

    items.forEach((item: any, idx: number) => {
      descriptions.push(item.description || 'Description not generated.');
      
      // Prepend anchor preview to image prompt if not already present
      let imagePrompt = item.imagePrompt || '';
      if (anchorStylePreview && !imagePrompt.includes('ANCHOR:')) {
        imagePrompt = `ANCHOR: ${anchorStylePreview}. ${imagePrompt}`;
      }
      imagePrompts.push(imagePrompt);
    });

    // Ensure we have the right number of items
    while (descriptions.length < events.length) {
      descriptions.push('Description not generated.');
    }
    while (imagePrompts.length < events.length) {
      imagePrompts.push('');
    }

    const responseData: any = {
      descriptions: descriptions.slice(0, events.length),
      imagePrompts: imagePrompts.slice(0, events.length),
      anchorStyle: anchorStyle || null,
    };

    if (Object.keys(factualDetails).length > 0) {
      responseData.factualDetails = factualDetails;
    }

    // Cache the result
    setCached(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[GenerateDescriptionsV2] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

/**
 * Rule-based progression detection (no API call)
 */
function detectProgression(
  timelineDescription: string,
  events: Array<{ year?: number; title: string }>
): { isProgression: boolean; subject?: string } {
  const exclusionKeywords = [
    'competition', 'dancing', 'bake off', 'strictly', 'episode', 'season', 'series', 
    'game', 'match', 'round', 'contest', 'award', 'ceremony', 'show', 'reality',
  ];
  
  const progressionKeywords = ['development', 'formation', 'growth', 'progression', 
    'evolution', 'construction', 'building', 'develops', 'forms', 'grows'];
  
  const eventTitles = events.map((e: any) => e.title?.toLowerCase() || '').join(' ');
  const descLower = timelineDescription.toLowerCase();
  
  const isExcluded = exclusionKeywords.some(kw => descLower.includes(kw) || eventTitles.includes(kw));
  const hasProgressionKeywords = progressionKeywords.some(kw => 
    descLower.includes(kw) || eventTitles.includes(kw)
  );
  
  const isProgression = !isExcluded && hasProgressionKeywords;
  
  return {
    isProgression,
    subject: isProgression ? timelineDescription.split(' ').slice(0, 5).join(' ') : undefined,
  };
}

/**
 * Get factual details for progression events (only if needed)
 */
async function getFactualDetails(
  client: any,
  events: Array<{ year?: number; title: string }>,
  timelineDescription: string
): Promise<Record<string, string[]>> {
  const isMedical = timelineDescription.toLowerCase().match(/\b(fetal|embryo|development|gestation|pregnancy|medical)\b/i);
  const domainContext = isMedical ? 'medical and embryological' : 'scientific and technical';
  
  const factPrompt = `Provide concise factual details for these stages (JSON format, keys match event labels):
${events.map((e: any) => {
    const label = e.year ? `${e.year}: ${e.title}` : e.title;
    return `- ${label}`;
  }).join('\n')}`;

  try {
    const response = await createChatCompletion(client, {
      model: client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a fact-checker specializing in ${domainContext} knowledge. Return ONLY valid JSON with factual bullet points for each stage.`,
        },
        {
          role: 'user',
          content: factPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: Math.min(4000, events.length * 200),
    });

    if (response.choices?.[0]?.message?.content) {
      const facts = JSON.parse(response.choices[0].message.content);
      const result: Record<string, string[]> = {};
      
      events.forEach((e: any) => {
        const label = e.year ? `${e.year}: ${e.title}` : e.title;
        const eventFacts = facts[label] || facts[e.title] || [];
        result[label] = Array.isArray(eventFacts) ? eventFacts.map(String) : [String(eventFacts)];
      });
      
      return result;
    }
  } catch (error: any) {
    console.warn('[GenerateDescriptionsV2] Factual details error:', error.message);
  }
  
  return {};
}

