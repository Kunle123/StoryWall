import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion, AIClientConfig } from '@/lib/ai/client';
import { parseYear } from '@/lib/utils/dateFormat';

/**
 * Attempts to repair common JSON malformation issues
 * Handles: unescaped quotes, trailing commas, missing commas, control characters
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;
  
  // Remove any BOM or leading whitespace
  repaired = repaired.trim();
  
  // Remove markdown code blocks if present
  if (repaired.startsWith('```')) {
    repaired = repaired.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  
  // Try to fix common issues in string values
  // This is a simplified approach - for complex cases, we'll rely on the extraction logic
  try {
    // First, try to find and fix unescaped quotes in string values
    // This regex finds string values and attempts to escape unescaped quotes
    // But this is complex, so we'll use a simpler approach: try parsing with fixes
    
    // Remove trailing commas before } or ]
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to fix common escape sequence issues
    repaired = repaired.replace(/\\(?!["\\/bfnrt])/g, '\\\\');
    
    return repaired;
  } catch (e) {
    // If repair fails, return original
    return jsonString;
  }
}

/**
 * Generate timeline events based on timeline description
 * 
 * Request Body:
 * {
 *   timelineDescription: string
 *   timelineName: string
 *   maxEvents: number (default: 20)
 *   isFactual: boolean (default: true) - true for factual/historical events, false for fictional/creative timelines
 * }
 * 
 * Response:
 * {
 *   events: Array<{ year: number, month?: number, day?: number, title: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { timelineDescription, timelineName, maxEvents = 20, isFactual = true, isNumbered = false, numberLabel = "Day", sourceRestrictions } = body;
    
    // Validate and clamp maxEvents to 1-100
    maxEvents = Math.max(1, Math.min(100, parseInt(String(maxEvents), 10) || 20));
    
    console.log('[GenerateEvents API] Request received:', {
      timelineName,
      descriptionLength: timelineDescription?.length,
      maxEvents,
      isFactual,
      isNumbered,
      numberLabel,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });

    if (!timelineDescription || !timelineName) {
      return NextResponse.json(
        { error: 'Timeline description and name are required' },
        { status: 400 }
      );
    }

    // Get configured AI client (OpenAI or Kimi based on AI_PROVIDER env var)
    // Note: Responses API (web search) is OpenAI-specific, so we'll use OpenAI for that
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let client;
    
    try {
      client = getAIClient();
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'AI provider not configured. Please set AI_PROVIDER and API key in environment variables.' },
        { status: 500 }
      );
    }

    // Determine if we need to batch (for Kimi with 100 events, batch into 4x25)
    const needsBatching = client.provider === 'kimi' && maxEvents >= 100;
    const batchSize = 25; // Generate 25 events per batch for Kimi (4 batches for 100 events)
    
    if (needsBatching) {
      console.log(`[GenerateEvents API] Batching enabled: splitting ${maxEvents} events into batches of ${batchSize}`);
      const batches: number[] = [];
      let remaining = maxEvents;
      while (remaining > 0) {
        batches.push(Math.min(batchSize, remaining));
        remaining -= batchSize;
      }
      console.log(`[GenerateEvents API] Will generate ${batches.length} batches: ${batches.join(', ')} events each`);
      
      // Generate batches in parallel (with concurrency limit to avoid rate limits)
      const allEvents: any[] = [];
      const allSources: any[] = [];
      const allImageRefs: any[] = [];
      
      const CONCURRENCY_LIMIT = 2; // Run 2 batches in parallel at a time
      
      // Process batches in parallel groups
      for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
        const batchGroup = batches.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batchGroup.map((batchMaxEvents, groupIndex) => {
          const batchNumber = i + groupIndex + 1;
          console.log(`[GenerateEvents API] Generating batch ${batchNumber}/${batches.length}: ${batchMaxEvents} events`);
          
          return generateEventsBatch(
            timelineDescription,
            timelineName,
            batchMaxEvents,
            isFactual,
            isNumbered,
            numberLabel,
            client,
            openaiApiKey,
            sourceRestrictions,
            batchNumber,
            batches.length
          );
        });
        
        // Wait for this group to complete before starting the next
        const batchResults = await Promise.all(batchPromises);
        
        // Combine results
        for (const batchResponse of batchResults) {
          if (batchResponse.events) {
            allEvents.push(...batchResponse.events);
          }
          if (batchResponse.sources) {
            allSources.push(...batchResponse.sources);
          }
          if (batchResponse.imageReferences) {
            allImageRefs.push(...batchResponse.imageReferences);
          }
        }
      }
      
      console.log(`[GenerateEvents API] Combined ${allEvents.length} events from ${batches.length} batches`);
      
      // Check if any batch converted to numbered, or if combined events lack meaningful dates
      let wasConverted = false;
      const batchWasConverted = batchResults.some((r: any) => r.wasConvertedToNumbered === true);
      
      if (!isNumbered && !batchWasConverted && allEvents.length > 0) {
        // Check if events have years (not undefined/null)
        const eventsWithYears = allEvents.filter((e: any) => {
          return e.year !== undefined && e.year !== null;
        });
        
        // If less than 50% of events have years, convert all to numbered events
        // This means AI didn't provide years for most events
        if (eventsWithYears.length < allEvents.length * 0.5) {
          console.log('[GenerateEvents API] Detected combined events without years - converting to numbered events');
          allEvents = allEvents.map((e: any, idx: number) => ({
            number: idx + 1,
            title: e.title || `Event ${idx + 1}`,
            description: e.description || '',
          }));
          wasConverted = true;
        }
      } else if (batchWasConverted) {
        wasConverted = true;
      }
      
      // Return combined results
      const responsePayload: any = { events: allEvents.slice(0, maxEvents) };
      if (wasConverted) {
        responsePayload.wasConvertedToNumbered = true;
        responsePayload.reason = 'Events did not have meaningful dates, so they were sequenced using numbers instead';
      }
      if (allSources.length > 0) {
        responsePayload.sources = allSources.slice(0, 10);
      }
      if (allImageRefs.length > 0) {
        responsePayload.imageReferences = allImageRefs.slice(0, 12);
      }
      return NextResponse.json(responsePayload);
    }
    
    // Original single-batch logic continues below
    // For Responses API (web search), we prefer OpenAI key but can fall back to Chat Completions
    // If OpenAI key is missing, we'll skip web search and use Chat Completions instead

    // Build prompts once
    const systemPrompt = isNumbered
      ? `You are a numbered timeline event generator. Generate ${maxEvents} sequential events numbered 1, 2, 3, etc. based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: number (required, sequential starting from 1), title (required, string). Events should be ordered sequentially and relevant to the timeline description.`
      : isFactual 
      ? `You are a timeline analyst and subject matter expert. Your task is to analyze a user's request and determine if it describes a sequential process or progression.

CRITICAL ANTI-HALLUCINATION REQUIREMENTS (READ FIRST):
- NEVER make up, invent, or fabricate events, dates, or facts
- NEVER guess or speculate about information you are not certain about
- ONLY include events that you can verify from reliable sources or your training data
- If you are unsure about specific dates, use only the year (do not guess month/day)
- If you are unsure about an event's details, omit it rather than inventing information
- DO NOT create events based on assumptions, inferences, or logical deductions without factual basis
- DO NOT fill gaps in your knowledge with plausible-sounding but unverified information
- When in doubt, prefer fewer accurate events over many potentially incorrect ones

STEP 1: PROGRESSION DETECTION
Analyze the timeline description to determine if it describes a PROCESS, PROGRESSION, or DEVELOPMENT with clear CUMULATIVE stages. 

CRITICAL: Only mark as progression if the stages are CUMULATIVE (each stage builds on the previous). Do NOT mark episodic, competition, or series content as progressions, even if they have sequential events.

Examples of TRUE progressions (cumulative):
- Fetal development → isProgression: true, progressionSubject: "a human fetus inside the womb"
- Construction of a building → isProgression: true, progressionSubject: "a skyscraper under construction"
- A disease progression → isProgression: true, progressionSubject: "a patient with [disease]"
- A scientific process → isProgression: true, progressionSubject: "[the process subject]"
- Manufacturing process → isProgression: true, progressionSubject: "[the product being made]"

Examples of FALSE progressions (episodic/sequential but NOT cumulative):
- Competition shows (Strictly Come Dancing, Bake Off, etc.) → isProgression: false (each week/episode is independent)
- TV series episodes → isProgression: false (each episode is independent)
- Sports seasons with weekly games → isProgression: false (each game is independent)
- Political campaigns, historical events → isProgression: false
- Award ceremonies → isProgression: false
- Seasonal decorations (Christmas decorations, holiday setup) → isProgression: false (each decoration is independent)
- Product launches/releases → isProgression: false (each release is independent)
- Concert tours → isProgression: false (each concert is independent)

If it is a progression, identify the single, core subject of the progression (e.g., "a human fetus", "a skyscraper", "a piece of steel").

STEP 2: EVENT GENERATION
You MUST generate ${maxEvents} accurate historical events based on the provided timeline description. NEVER return an empty events array - if information is available (from your knowledge or web search), you MUST generate events.

If isProgression is true: Generate events that show stages of the progression. Each event title must describe a specific state or milestone in the process. Do NOT create meta-events like "planning phase" or "research complete." Focus on physical, observable changes. Each event should represent a distinct stage or milestone that allows the user to see how the subject progresses through time.

If isProgression is false: Include major milestones, key dates, and significant events related to this topic.

Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). Do NOT include descriptions - those will be generated in a separate step.

Additionally, when people are mentioned (e.g., candidates, public officials, celebrities), include an optional top-level "image_references" array with 2-5 DIRECT image URLs (objects with { name: string, url: string }). CRITICAL: URLs must be DIRECT links to image files (.jpg, .png, .webp), NOT wiki pages or article pages. Prefer:
- Direct URLs from upload.wikimedia.org (e.g., https://upload.wikimedia.org/wikipedia/commons/5/56/filename.jpg)
- Official government/press image URLs ending in .jpg/.png
- News agency photo URLs (Reuters, AP, Getty) - direct image links only
NEVER use: commons.wikimedia.org/wiki/ URLs (these are pages, not images), Category pages, or article URLs.

If you use web search, you MUST include a top-level "sources" array with 3-5 reputable news or official sources used (objects with { name: string, url: string }).
- Cite the specific article URLs you relied on (NOT just homepages). Article URLs MUST contain a path beyond the domain, e.g. https://apnews.com/article/... or https://www.nytimes.com/2025/11/04/... 
- Prefer AP, Reuters, PBS, official election sites, and major newspapers.

CRITICAL RECENCY REQUIREMENT FOR NEWSWORTHY TOPICS:
- For political, current events, or news-related timelines, you MUST search for and include events that occurred TODAY or within the last 24-48 hours
- If news sources are reporting breaking developments (e.g., defections, resignations, announcements, election results), you MUST include these recent events in the timeline
- Always prefer contemporaneous sources; if the topic has events in the last 48 hours (e.g., election-night results, political defections, breaking news), you MUST include them via web search
- CRITICAL: For timelines about recent political events or ongoing situations, you MUST use web search to find events from TODAY and YESTERDAY. Do not skip recent events - actively search for the latest news articles about this topic
- Do not omit recent decisive outcomes when sources confirm them - recent events are often the most newsworthy
- When creating timelines about ongoing political situations, current events, or recent developments, prioritize including the most recent events that are being reported in news sources

ACCURACY REQUIREMENTS:
- Generate events based on your knowledge of factual, well-documented information
- Use your training data and web search to provide accurate events for the requested topic
- For public figures, campaigns, elections: include major milestones like announcements, primaries, elections, major events, results
- ALWAYS generate events when information is available - even if dates are approximate, include the events with the information you have
- If web search returns relevant information, you MUST use it to generate events - do not return an empty array
- Only return an empty events array if the topic is completely unknown or impossible to research

IMPORTANT: Only include month and day if you know the exact date. For events where only the year is known, only include the year. Do not default to January 1 or any other date. Only include precise dates when you are confident about them.

Events should be chronologically ordered and relevant to the timeline description.`
      : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). Do NOT include descriptions - those will be generated in a separate step. 

CRITICAL - TITLE REQUIREMENTS:
- Event titles MUST directly relate to and reflect the specific themes, contexts, and details mentioned in the timeline description
- Titles should incorporate key elements from the timeline description (e.g., if description mentions "horrible happenings in the upside down", titles should describe specific horrible events that occurred in the upside down)
- Titles should be specific and descriptive - avoid generic references like "Season 1 Episode 4" or "Episode 3" unless the timeline is specifically about episode-by-episode breakdowns
- Each title should clearly show how the event relates to the timeline's specific focus, setting, theme, or context
- If the timeline description emphasizes certain qualities (horrible, tragic, mysterious, etc.), titles should reflect those qualities
- If the timeline description specifies a location or setting (upside down, specific world, etc.), titles should reference that location when relevant
- Titles should be meaningful and specific to what makes this timeline unique, not generic episode or chapter references

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative

IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`;

    // Build source restrictions text if provided
    const sourceRestrictionsText = sourceRestrictions && Array.isArray(sourceRestrictions) && sourceRestrictions.length > 0
      ? `\n\nSOURCE RESTRICTIONS - CRITICAL: You MUST source all information, descriptions, and titles SOLELY from the following specific resources. Do not use any other sources:\n${sourceRestrictions.map((src: string, idx: number) => `  ${idx + 1}. ${src}`).join('\n')}\n\nIf information is not available in these sources, indicate that in the event description.`
      : '';

    const userPrompt = isNumbered
      ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nGenerate ${maxEvents} sequential events numbered 1, 2, 3, etc. Each event should be labeled as "${numberLabel} 1", "${numberLabel} 2", "${numberLabel} 3", etc. Events should be ordered sequentially and tell a coherent story or sequence based on the timeline description. Each event must include only a number and title - descriptions will be generated separately.\n\nCRITICAL TITLE REQUIREMENTS:\n- Each event title MUST directly relate to and incorporate key elements from the timeline description above\n- If the timeline description mentions specific themes, qualities, settings, or contexts, the titles MUST reflect these elements\n- Titles should be specific and descriptive - avoid generic references unless the timeline is specifically about generic breakdowns\n- Each title should clearly show how the event relates to the timeline's specific focus, setting, theme, or context\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. Return as JSON: { "events": [{ "number": 1, "title": "First event" }, { "number": 2, "title": "Second event" }, ...] }`
      : isFactual
      ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nYou MUST generate ${maxEvents} factual events based on your knowledge of this topic and web search results. Use your training data and web search tools (required for recency) to provide accurate events.\n\nCRITICAL: Analyze the timeline description to determine if it describes a PROCESS, PROGRESSION, or DEVELOPMENT with clear stages. Examples:\n- Fetal development → Generate events showing developmental stages (conception, implantation, neural tube formation, heart beating, limb buds, etc.)\n- Construction of a building → Generate events showing construction phases (planning, foundation, framing, completion, etc.)\n- A disease progression → Generate events showing disease stages (onset, symptoms, treatment, recovery, etc.)\n- A scientific process → Generate events showing process steps (hypothesis, experiment, results, conclusion, etc.)\n\nWhen a clear progression exists, generate events that tell that story through its stages. Each event should represent a distinct stage or milestone in the progression. The events should allow the user to see how the subject progresses through time.\n\nFor topics WITHOUT a clear progression (e.g., political campaigns, historical events), include major milestones, key dates, and significant events related to this topic.\n\nCRITICAL REQUIREMENTS:
- You MUST generate ${maxEvents} events - do not return fewer unless absolutely impossible
- If the topic has a clear progression/story, generate events that show that progression through its stages
- If web search finds relevant news articles, you MUST use that information to create events
- CRITICAL FOR NEWSWORTHY TOPICS: For political, current events, or news-related timelines, you MUST search for and include events that occurred TODAY or within the last 24-48 hours. If news sources are reporting breaking developments (e.g., political defections, resignations, announcements, election results), you MUST include these recent events in the timeline. Recent events are often the most newsworthy and should be prioritized.
- CRITICAL FOR RECENT TIMELINES: If the timeline description mentions a time period that includes today (e.g., "since 2024", "since the election", "since [recent date]"), you MUST use web search to actively find events from TODAY, YESTERDAY, and the last 48 hours. Do not rely solely on your training data - you MUST search for the most recent news articles. For example, if creating a timeline about "MPs that defected since 2024 general election", you MUST search for defections that happened today, yesterday, and this week.
- Include the most recent 48-hour developments (e.g., election-night result, political defections, breaking news) when relevant
- Include primary date(s) and result(s) as well
- Use article-level citations for these items (not just domain homepages)
- Also include an "image_references" array with high-quality reference image links for any famous people mentioned (official portraits, Wikimedia Commons), if available

For political campaigns, elections, or public figures: include ALL major events such as:
- Announcement of candidacy (with specific date if known)
- Filing deadlines or official declarations
- Primary elections (dates and results)
- Debates and major campaign events
- General election dates
- Election results and victory announcements
- Inauguration or assumption of office dates

Include as many significant events as you can. If you know the specific date (month and day), include it. If you only know the year, include only the year. Do not guess dates you're uncertain about.

IMPORTANT: If web search returns news articles about this topic, you MUST create events from that information. Do not return an empty events array if news sources are reporting on the topic. Generate a comprehensive timeline with all major events you know about this topic, using both your training data and web search results.\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. 

Return as JSON with these keys:
- "isProgression": boolean (true if the timeline describes a sequential process/progression, false otherwise)
- "progressionSubject": string (the core subject of the progression, e.g., "a human fetus inside the womb" - only include if isProgression is true, otherwise omit or set to null)
- "events": array of event objects, each with: year (required, number), title (required, string). Do NOT include descriptions - those will be generated separately.
- "sources": array (optional, only if web search was used) of objects with { name: string, url: string }
- "image_references": array (optional, only if people are mentioned) of objects with { name: string, url: string }

Example for progression: { "isProgression": true, "progressionSubject": "a human fetus inside the womb", "events": [{ "year": 2025, "title": "Neural Tube Formation", "description": "..." }, ...] }
Example for non-progression: { "isProgression": false, "events": [{ "year": 2020, "title": "Event title", "description": "..." }, ...], "sources": [...], "image_references": [...] }`
      : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nGenerate up to ${maxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Each event must include only a title and date - descriptions will be generated separately.\n\nCRITICAL TITLE REQUIREMENTS:\n- Each event title MUST directly relate to and incorporate key elements from the timeline description above\n- If the timeline description mentions specific themes (e.g., "horrible happenings"), qualities (e.g., "tragic", "mysterious"), settings (e.g., "in the upside down"), or contexts (e.g., "from Stranger Things"), the titles MUST reflect these elements\n- Titles should be specific and descriptive - avoid generic episode/chapter references like "Season 1 Episode 4" unless the timeline is specifically about episode-by-episode breakdowns\n- Each title should clearly show how the event relates to the timeline's specific focus, setting, theme, or context\n- Example: If timeline is "horrible happenings in Stranger Things that occurred in the upside down", titles should be like "Demogorgon Attack in the Upside Down" or "Will's Terrifying Encounter with the Mind Flayer" - NOT "Season 1 Episode 4" or "Episode 3"\n- Make titles meaningful and specific to what makes this timeline unique\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery" }, { "year": 2021, "title": "The First Conflict" }, ...] }`;

    // Prefer Responses API with web_search tool for factual timelines (helps with post-2024 knowledge)
    // Only use if OpenAI key is available (Responses API is OpenAI-specific)
    let response;
    let contentText: string | null = null;
    const useWebSearch = !!isFactual && !!openaiApiKey;

    if (useWebSearch) {
      try {
        console.log('[GenerateEvents API] Using Responses API with web_search tool');
        const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
            model: 'gpt-4o-mini',
            input: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            tools: [{ type: 'web_search' }],
            max_output_tokens: Math.min(40000, (maxEvents * 1500) + 10000),
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          console.log('[GenerateEvents API] Responses API response structure:', {
            hasOutputText: typeof data.output_text === 'string',
            hasOutput: Array.isArray(data.output),
            outputLength: Array.isArray(data.output) ? data.output.length : 0,
            dataKeys: Object.keys(data),
          });
          
          // Prefer convenient field when available
          if (typeof data.output_text === 'string') {
            contentText = data.output_text;
            console.log('[GenerateEvents API] Using output_text, length:', contentText?.length || 0);
          } else if (Array.isArray(data.output)) {
            // Find assistant message content text
            for (const item of data.output) {
              if (item.type === 'message' && item.role === 'assistant') {
                if (typeof item.content === 'string') {
                  contentText = item.content;
                  console.log('[GenerateEvents API] Using message.content (string), length:', contentText?.length || 0);
                  break;
                } else if (Array.isArray(item.content)) {
                  const textPart = item.content.find((c: any) => typeof c.text === 'string');
                  if (textPart) {
                    contentText = textPart.text;
                    console.log('[GenerateEvents API] Using message.content[].text, length:', contentText?.length || 0);
                    break;
                  }
                }
              }
            }
          }
          
          if (!contentText) {
            console.error('[GenerateEvents API] Could not extract content from Responses API:', JSON.stringify(data, null, 2));
          }
        } else {
          const errText = await resp.text();
          console.warn('[GenerateEvents API] Responses API failed, will fall back to Chat Completions:', errText);
          // Don't return error - let it fall through to Chat Completions fallback
          contentText = null;
        }
      } catch (e) {
        console.warn('[GenerateEvents API] Responses API error, will fall back to Chat Completions:', (e as any)?.message);
        // Don't return error - let it fall through to Chat Completions fallback
        contentText = null;
      }
    }

      // Declare variables in outer scope
      let isTruncatedByModel = false;
      let finishReason: string | undefined;
      
      // If not using web search (fictional) or content not set, fall back to Chat Completions
      if (!contentText) {
        if (isFactual && useWebSearch) {
          // Web search was attempted but failed - log warning but continue with Chat Completions
          console.warn('[GenerateEvents API] Web search failed, falling back to Chat Completions API for factual generation');
        }
        console.log('[GenerateEvents API] Using Chat Completions API' + (isFactual ? ' (fallback from web search)' : ''));
        
        // Use AI abstraction layer (supports OpenAI and Kimi)
        // Calculate max_tokens based on provider
        // Kimi models may have lower output token limits (e.g., 8k-16k) despite large context windows
        // OpenAI models can handle much larger outputs (up to 128k)
        const startTime = Date.now();
        let maxTokens: number;
        if (client.provider === 'kimi') {
          // For Kimi, try to use higher limits if available
          // K2 models may support higher output limits than moonshot-v1-128k
          // Try 32k for large requests - if it fails, the API will return an error
          if (maxEvents >= 100) {
            // For 100 events, kimi-latest-32k supports 32k output tokens
            // Use calculation: (maxEvents * 300) + 2000, capped at 32k
            maxTokens = Math.min(32000, (maxEvents * 300) + 2000);
          } else if (maxEvents > 50) {
            // For large requests, try 32k tokens
            maxTokens = Math.min(32000, (maxEvents * 800) + 4000);
          } else {
            // For smaller requests, use 16k cap (moonshot-v1-128k limit)
            maxTokens = Math.min(16384, (maxEvents * 800) + 4000);
          }
        } else {
          // For OpenAI, we can request much larger outputs
          maxTokens = Math.min(40000, (maxEvents * 2000) + 15000);
        }
        
        console.log(`[GenerateEvents API] Request config: provider=${client.provider}, maxEvents=${maxEvents}, maxTokens=${maxTokens}`);
        
        let data;
        try {
          // Kimi supports JSON mode (response_format), so we can use it for both providers
          // See: https://platform.moonshot.ai/docs/guide/use-json-mode-feature-of-kimi-api
          // Use kimi-k2-turbo-preview for web search (Moonshot recommends it for handling increased token load from search results)
          const modelForGeneration = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
          
          // For factual events, try to use web search if available
          // OpenAI Chat Completions supports web_search tool
          // Kimi models that support web_search: kimi-k2-0905-preview, kimi-k2-turbo-preview, moonshot/kimi-k2-preview
          // kimi-k2-thinking does NOT support web_search
          // We're using kimi-k2-turbo-preview which supports web_search
          const kimiModelSupportsWebSearch = client.provider === 'kimi' && modelForGeneration === 'kimi-k2-turbo-preview';
          const tools = isFactual && (client.provider === 'openai' || kimiModelSupportsWebSearch) 
            ? [{ type: 'web_search' }] 
            : undefined;
          data = await createChatCompletion(client, {
            model: modelForGeneration,
        messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            // Use JSON mode for both OpenAI and Kimi
        response_format: { type: 'json_object' },
        temperature: 0.7,
            max_tokens: maxTokens,
            maxEvents: maxEvents, // Pass maxEvents to help with model selection
            ...(tools && { tools }), // Include web search tool for factual events if supported
          });
        } catch (error: any) {
          console.error('AI API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate events', details: error.message || 'Unknown error' },
            { status: 500 }
          );
        }
        
        console.log('[GenerateEvents API] AI API response structure:', {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length,
          hasFirstChoice: !!data.choices?.[0],
          hasMessage: !!data.choices?.[0]?.message,
          messageContentLength: data.choices?.[0]?.message?.content?.length,
          finishReason: data.choices?.[0]?.finish_reason,
        });
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          console.error('[GenerateEvents API] Invalid AI response structure:', data);
        throw new Error('Invalid response format from AI API');
      }
        
        // Check finish_reason to detect truncation BEFORE processing content
        finishReason = data.choices[0].finish_reason;
        isTruncatedByModel = finishReason === 'length' || finishReason === 'max_tokens';
        
        if (isTruncatedByModel) {
          console.warn('[GenerateEvents API] Response was truncated by model (finish_reason:', finishReason + ')');
        }
        
        contentText = data.choices[0].message.content;
        
        const generationTime = Date.now() - startTime;
        // Log response details for debugging truncation
        console.log('[GenerateEvents API] Response details:', {
          provider: client.provider,
          model: data.model || 'unknown',
          finishReason: data.choices[0].finish_reason,
          contentLength: contentText?.length || 0,
          usage: data.usage || 'not provided',
          maxTokensRequested: maxTokens,
          generationTimeMs: generationTime,
          generationTimeSec: (generationTime / 1000).toFixed(2),
        });
      }

    if (!contentText || typeof contentText !== 'string') {
      throw new Error('Empty assistant response');
    }
    
    // Log content preview for debugging
    console.log('[GenerateEvents API] Content preview (first 1000 chars):', contentText.substring(0, 1000));

    // Check if content appears truncated (incomplete JSON)
    const trimmedContent = contentText.trim();
    const appearsTruncated = (
      trimmedContent.length > 0 &&
      !trimmedContent.endsWith('}') &&
      !trimmedContent.endsWith(']') &&
      !trimmedContent.endsWith('```') &&
      trimmedContent.includes('{') // Has JSON start but no proper end
    );

    if (appearsTruncated || isTruncatedByModel) {
      console.error('[GenerateEvents API] Response appears truncated:', {
        finishReason,
        isTruncatedByModel,
        appearsTruncated,
        contentLength: contentText.length,
        lastChars: contentText.substring(Math.max(0, contentText.length - 200)),
        contentPreview: contentText.substring(0, 500),
      });
      
      // Try to salvage partial JSON if possible
      try {
        const jsonMatch = trimmedContent.match(/\{[\s\S]*/);
        if (jsonMatch) {
          // Try to find the last complete event in the JSON
          const partialJson = jsonMatch[0];
          // Find the last complete event object
          const eventMatches = partialJson.match(/"events"\s*:\s*\[([\s\S]*)/);
          if (eventMatches) {
            const eventsText = eventMatches[1];
            // Try to extract complete event objects
            const completeEvents = [];
            let depth = 0;
            let currentEvent = '';
            let inString = false;
            let escapeNext = false;
            
            for (let i = 0; i < eventsText.length; i++) {
              const char = eventsText[i];
              if (escapeNext) {
                currentEvent += char;
                escapeNext = false;
                continue;
              }
              if (char === '\\') {
                escapeNext = true;
                currentEvent += char;
                continue;
              }
              if (char === '"') {
                inString = !inString;
                currentEvent += char;
                continue;
              }
              if (!inString) {
                if (char === '{') depth++;
                if (char === '}') depth--;
                currentEvent += char;
                if (depth === 0 && currentEvent.trim().length > 0) {
                  try {
                    const eventObj = JSON.parse(currentEvent.trim());
                    completeEvents.push(eventObj);
                    currentEvent = '';
                  } catch (e) {
                    // Skip incomplete event
                  }
                }
              } else {
                currentEvent += char;
              }
            }
            
            if (completeEvents.length > 0) {
              console.warn(`[GenerateEvents API] Salvaged ${completeEvents.length} complete events from truncated response`);
              // Return what we have
              return NextResponse.json({
                events: completeEvents,
                warning: `Response was truncated. Only ${completeEvents.length} of ${maxEvents} events were generated.`,
              });
            }
          }
        }
      } catch (salvageError: any) {
        console.error('[GenerateEvents API] Failed to salvage partial JSON:', salvageError.message);
      }
      
      throw new Error('AI response appears incomplete (truncated JSON). The response may have exceeded token limits. Please try with fewer events or a shorter description.');
    }

    let content;
    try {
      // Try to extract JSON from the response if it's wrapped in markdown code blocks
      let jsonText = trimmedContent;
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to repair JSON before parsing
      let repairedJson = repairJSON(jsonText);
      
      // Validate JSON structure before parsing
      const openBraces = (repairedJson.match(/\{/g) || []).length;
      const closeBraces = (repairedJson.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.error('[GenerateEvents API] JSON braces mismatch:', {
          openBraces,
          closeBraces,
          contentLength: repairedJson.length,
          lastChars: repairedJson.substring(Math.max(0, repairedJson.length - 200)),
        });
        throw new Error(`Incomplete JSON: ${openBraces} opening braces but ${closeBraces} closing braces`);
      }
      
      try {
        content = JSON.parse(repairedJson);
      } catch (initialParseError: any) {
        // If initial parse fails, try original (maybe repair made it worse)
        try {
          content = JSON.parse(jsonText);
        } catch (originalParseError: any) {
          // Both failed, throw the original error to trigger extraction logic
          throw initialParseError;
        }
      }
    } catch (parseError: any) {
      console.error('[GenerateEvents API] Failed to parse OpenAI message content:', {
        contentPreview: contentText.substring(0, 500),
        contentLength: contentText.length,
        lastChars: contentText.substring(Math.max(0, contentText.length - 200)),
        error: parseError.message,
        errorName: parseError.name,
      });
      
      // Try to extract JSON object from the text if it's embedded in other text
      // Look for the first { and try to find matching closing }
      let jsonStart = contentText.indexOf('{');
      if (jsonStart === -1) {
        throw new Error(`Failed to parse AI response: ${parseError.message}. No JSON object found in response (no opening brace).`);
      }
      
      // Extract from first { to end, then try to find the matching closing }
      let jsonCandidate = contentText.substring(jsonStart);
      
      // Try to find the last complete JSON object by matching braces (accounting for escaped braces)
      let braceCount = 0;
      let jsonEnd = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < jsonCandidate.length; i++) {
        const char = jsonCandidate[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }
      
      if (jsonEnd === -1) {
        // No complete JSON found, try the whole thing anyway
        console.warn('[GenerateEvents API] Could not find complete JSON, trying entire extracted text');
      } else {
        jsonCandidate = jsonCandidate.substring(0, jsonEnd);
      }
      
      try {
        // Remove any trailing text after the JSON
        let cleanedJson = jsonCandidate.trim();
        
        // Try to repair common JSON issues
        cleanedJson = repairJSON(cleanedJson);
        
        // First attempt: parse as-is
        try {
          content = JSON.parse(cleanedJson);
          console.warn('[GenerateEvents API] Successfully extracted JSON from text response (had text before JSON)');
        } catch (firstParseError: any) {
          // If that fails, try more aggressive repairs
          console.warn('[GenerateEvents API] First parse attempt failed, trying aggressive repairs...');
          
          // Try to fix unescaped quotes in string values by finding the problematic position
          const errorMatch = firstParseError.message.match(/position (\d+)/);
          if (errorMatch) {
            const errorPos = parseInt(errorMatch[1]);
            const beforeError = cleanedJson.substring(0, errorPos);
            const atError = cleanedJson[errorPos];
            const afterError = cleanedJson.substring(errorPos + 1);
            
            // Log context around the error
            const contextStart = Math.max(0, errorPos - 50);
            const contextEnd = Math.min(cleanedJson.length, errorPos + 50);
            console.error('[GenerateEvents API] JSON error context:', {
              position: errorPos,
              char: atError,
              context: cleanedJson.substring(contextStart, contextEnd),
              before: beforeError.substring(Math.max(0, beforeError.length - 30)),
              after: afterError.substring(0, 30),
            });
            
            // Try to fix common issues at this position
            // If it's a quote issue, try escaping it
            if (atError === '"' || atError === "'") {
              // Check if we're inside a string (count quotes before this position)
              let quoteCount = 0;
              let inString = false;
              for (let i = 0; i < errorPos; i++) {
                if (cleanedJson[i] === '\\') {
                  i++; // Skip escaped character
                  continue;
                }
                if (cleanedJson[i] === '"') {
                  inString = !inString;
                  quoteCount++;
                }
              }
              
              // If we're inside a string and hit an unescaped quote, try to escape it
              if (inString && atError === '"') {
                cleanedJson = cleanedJson.substring(0, errorPos) + '\\"' + cleanedJson.substring(errorPos + 1);
                console.warn('[GenerateEvents API] Attempted to escape unescaped quote at position', errorPos);
              }
            }
            
            // Try parsing again after repair
            try {
              content = JSON.parse(cleanedJson);
              console.warn('[GenerateEvents API] Successfully parsed after aggressive repair');
            } catch (secondParseError: any) {
              // Last resort: try to extract just the events array if possible
              const eventsMatch = cleanedJson.match(/"events"\s*:\s*\[([\s\S]*?)\]/);
              if (eventsMatch) {
                try {
                  // Try to parse just the events array
                  const eventsJson = '[' + eventsMatch[1] + ']';
                  const eventsArray = JSON.parse(eventsJson);
                  content = { events: eventsArray };
                  console.warn('[GenerateEvents API] Successfully extracted events array as fallback');
                } catch (eventsParseError: any) {
                  throw secondParseError;
                }
              } else {
                throw secondParseError;
              }
            }
          } else {
            throw firstParseError;
          }
        }
      } catch (extractError: any) {
        console.error('[GenerateEvents API] Failed to parse extracted JSON:', {
          error: extractError.message,
          jsonPreview: jsonCandidate.substring(0, 1000),
          jsonLength: jsonCandidate.length,
          errorPosition: extractError.message.match(/position (\d+)/)?.[1],
        });
        throw new Error(`Failed to parse AI response: ${parseError.message}. Extracted JSON also failed: ${extractError.message}`);
      }
    }
    
    console.log('[GenerateEvents API] Raw OpenAI response content:', JSON.stringify(content, null, 2));
    
    // Ensure the response has the correct format
    if (!content.events || !Array.isArray(content.events)) {
      console.error('[GenerateEvents API] Invalid events format:', {
        hasEvents: !!content.events,
        isArray: Array.isArray(content.events),
        contentKeys: Object.keys(content),
      });
      throw new Error('Invalid events format in OpenAI response');
    }
    
    console.log('[GenerateEvents API] Raw events from OpenAI:', content.events.length);
    
    // Map events with better validation
    // Multi-pass approach: Detect BC patterns, then parse with context
    // Also track which events actually had years provided by AI (vs made up)
    const parsedYears: number[] = [];
    const hadYearProvided: boolean[] = []; // Track if AI actually provided a year
    if (!isNumbered) {
      // First pass: parse all years and detect BC patterns
      const rawYears: number[] = [];
      const hasExplicitBC: boolean[] = [];
      
      content.events.forEach((event: any) => {
        // Check if AI actually provided a year field (not undefined/null/empty)
        const hadYear = event.year !== undefined && event.year !== null && String(event.year).trim() !== '';
        hadYearProvided.push(hadYear);
        
        const yearStr = String(event.year || '').trim();
        const hasBC = /(BC|BCE)/i.test(yearStr);
        hasExplicitBC.push(hasBC);
        
        // Parse without context first
        const year = hadYear ? parseYear(event.year) : undefined;
        rawYears.push(year);
      });
      
      // Detect if this is a BC timeline pattern:
      // - All years are large ancient years (>= 1000)
      // - Years are in descending order (typical BC pattern)
      // - At least some have explicit BC notation, or all are ambiguous
      const providedYears = rawYears.filter((y, i) => hadYearProvided[i] && y !== undefined);
      const allLargeAncient = providedYears.length > 0 && providedYears.every(y => Math.abs(y) >= 1000 && Math.abs(y) < 10000);
      const isDescending = providedYears.length > 1 && 
        providedYears.every((y, i) => i === 0 || Math.abs(providedYears[i - 1]) >= Math.abs(y));
      const hasAnyBC = hasExplicitBC.some(bc => bc);
      const allAmbiguous = hasExplicitBC.every(bc => !bc);
      
      // If pattern suggests BC timeline, mark ambiguous years as BC
      const isBCTimeline = allLargeAncient && isDescending && (hasAnyBC || allAmbiguous);
      
      if (isBCTimeline) {
        console.log('[GenerateEvents API] Detected BC timeline pattern - inferring BC for ambiguous years');
      }
      
      // Second pass: parse with BC inference if pattern detected
      content.events.forEach((event: any, index: number) => {
        const yearStr = String(event.year || '').trim();
        const hasExplicitNotation = /(BC|BCE|AD|CE)/i.test(yearStr);
        
        let year: number | undefined;
        if (hadYearProvided[index]) {
          // AI provided a year - parse it
          if (hasExplicitNotation) {
            year = parseYear(event.year);
          } else if (isBCTimeline && !hasExplicitBC[index]) {
            // Infer BC for ambiguous years in BC timeline pattern
            const numericYear = parseInt(yearStr, 10);
            year = -numericYear; // BC
          } else {
            // Use context from previous parsing
            const previousYear = index > 0 ? parsedYears[index - 1] : undefined;
            const nextYear = index < rawYears.length - 1 ? rawYears[index + 1] : undefined;
            year = parseYear(event.year, { previousYear, nextYear });
          }
        } else {
          // AI did not provide a year - leave undefined
          year = undefined;
        }
        parsedYears.push(year);
      });
    }
    
    const mappedEvents = content.events.map((event: any, index: number) => {
      const title = String(event.title || '').trim();
      
      if (isNumbered) {
        // For numbered events, use number instead of year
        const number = event.number ? parseInt(event.number) : (index + 1);
        console.log(`[GenerateEvents API] Numbered Event ${index + 1}:`, {
          rawNumber: event.number,
          parsedNumber: number,
          rawTitle: event.title,
          parsedTitle: title,
        });
        
        return {
          number: number,
          title: title || `${numberLabel} ${number}`,
          description: event.description || '',
        };
      } else {
        // For dated events, use the parsed year from our multi-pass approach
        const year = parsedYears[index];
        
        console.log(`[GenerateEvents API] Event ${index + 1}:`, {
          rawYear: event.year,
          parsedYear: year,
          rawTitle: event.title,
          parsedTitle: title,
          hasMonth: !!event.month,
          hasDay: !!event.day,
        });
        
        // Filter out placeholder dates (Jan 1, Dec 31) - only include month/day if they're real dates
        let month: number | undefined = undefined;
        let day: number | undefined = undefined;
        
        if (event.month && event.day) {
          const monthNum = parseInt(event.month);
          const dayNum = parseInt(event.day);
          // Only include if not placeholder dates (Jan 1 or Dec 31)
          if (!((monthNum === 1 && dayNum === 1) || (monthNum === 12 && dayNum === 31))) {
            month = monthNum;
            day = dayNum;
          }
        } else if (event.month) {
          // Only include month if day is also provided (both must be real)
          // If only month is provided, it's likely a placeholder, so ignore it
        }
        
        // If no year was provided by AI, don't default to current year
        // We'll detect this later and convert to numbered events
        return {
          year: year || undefined,
          month: month,
          day: day,
          title: title || `Event ${index + 1}`,
          description: event.description || '',
        };
      }
    });
    
    // Detect if events don't have meaningful dates (AI didn't provide years)
    // If so, convert them to numbered events instead of using fake dates
    if (!isNumbered && mappedEvents.length > 0) {
      // Check if AI actually provided years for the events
      const eventsWithYearsProvided = hadYearProvided.filter(had => had).length;
      
      // If less than 50% of events had years provided by AI, convert all to numbered events
      // This handles cases like fictional content where dates don't exist
      if (eventsWithYearsProvided < mappedEvents.length * 0.5) {
        console.log('[GenerateEvents API] Detected events without years provided by AI - converting to numbered events');
        const convertedEvents = mappedEvents.map((e: any, idx: number) => ({
          number: idx + 1,
          title: e.title || `Event ${idx + 1}`,
          description: e.description || '',
        }));
        
        // Update response to indicate these are now numbered
        return NextResponse.json({
          events: convertedEvents.slice(0, maxEvents),
          wasConvertedToNumbered: true,
          reason: 'Events did not have dates, so they were sequenced using numbers instead',
        });
      }
    }
    
    // Filter out only events that are completely invalid
    const events = mappedEvents.filter((event: any) => {
      const hasTitle = event.title && event.title.trim() && event.title !== 'Untitled Event';
      
      if (isNumbered) {
        // For numbered events, check for number and title
        const hasNumber = event.number && !isNaN(event.number) && event.number > 0;
        const isValid = hasTitle && hasNumber;
        if (!isValid) {
          console.warn('[GenerateEvents API] Filtered out invalid numbered event:', {
            title: event.title,
            number: event.number,
            hasTitle,
            hasNumber,
          });
        }
        return isValid;
      } else {
        // For dated events, check for year and title
        const hasYear = event.year && !isNaN(event.year) && event.year > 0;
        // Keep if it has a title (year can be defaulted)
        const isValid = hasTitle;
        if (!isValid) {
          console.warn('[GenerateEvents API] Filtered out invalid event:', {
            title: event.title,
            year: event.year,
            hasTitle,
            hasYear,
          });
        }
        return isValid;
      }
    });
    
    console.log('[GenerateEvents API] Events after filtering:', events.length, 'out of', mappedEvents.length);

    // Normalize and validate sources if provided (require article-level URLs, not bare domains)
    let normalizedSources: any[] = [];
    let normalizedImageRefs: any[] = [];
    if (Array.isArray(content.sources)) {
      const isArticleUrl = (url: string) => /^https?:\/\/[^\/]+\/.+/.test(url);
      normalizedSources = content.sources
        .map((s: any) => {
          if (typeof s === 'string') return { name: '', url: s };
          return { name: String(s?.name || ''), url: String(s?.url || '') };
        })
        .filter((s: any) => s.url && isArticleUrl(s.url))
        .slice(0, 10);
      if (normalizedSources.length > 0) {
        console.log('[GenerateEvents API] Sources (filtered):', normalizedSources.map((s: any) => s.url));
      }
    }
    if (Array.isArray(content.image_references)) {
      const isUrl = (url: string) => /^https?:\/\//.test(url);
      normalizedImageRefs = content.image_references
        .map((s: any) => {
          if (typeof s === 'string') return { name: '', url: s };
          return { name: String(s?.name || ''), url: String(s?.url || '') };
        })
        .filter((s: any) => s.url && isUrl(s.url))
        .slice(0, 12);
      if (normalizedImageRefs.length > 0) {
        console.log('[GenerateEvents API] Image references (filtered):', normalizedImageRefs.map((s: any) => s.url));
      }
    }
    
    // If all events were filtered out, return the mapped events anyway (with defaults)
    if (events.length === 0 && mappedEvents.length > 0) {
      console.warn('[GenerateEvents API] All events filtered out, using mapped events with defaults');
      const fallbackEvents = mappedEvents.map((e: any, idx: number) => {
        if (isNumbered) {
          return {
            number: e.number || (idx + 1),
            title: e.title || `${numberLabel} ${idx + 1}`,
            description: e.description || '',
          };
        } else {
          return {
            year: e.year || new Date().getFullYear(),
            month: e.month,
            day: e.day,
            title: e.title || 'Untitled Event',
            description: e.description || '',
          };
        }
      });
      return NextResponse.json({ events: fallbackEvents.slice(0, maxEvents) });
    }
    
    if (events.length === 0) {
      console.error('[GenerateEvents API] No valid events after processing.');
      console.error('[GenerateEvents API] Raw content keys:', Object.keys(content));
      console.error('[GenerateEvents API] Raw events array:', content.events);
      console.error('[GenerateEvents API] Mapped events:', mappedEvents);
      console.error('[GenerateEvents API] Full content (first 2000 chars):', JSON.stringify(content, null, 2).substring(0, 2000));
      
      return NextResponse.json(
        { 
          error: 'No events were generated. Please try again or provide more details in your timeline description.',
          details: 'The AI may have been uncertain about the topic or the response format was invalid. Check server logs for details.',
          debug: process.env.NODE_ENV === 'development' ? {
            contentKeys: Object.keys(content),
            eventsCount: content.events?.length || 0,
            mappedEventsCount: mappedEvents.length,
          } : undefined,
        },
        { status: 200 } // Return 200 but with error message so frontend can handle gracefully
      );
    }
    
    console.log('[GenerateEvents API] Successfully generated events:', events.length);
    
    // Extract progression detection data from content
    const isProgression = content.isProgression === true;
    const progressionSubject = content.progressionSubject || null;
    
    console.log('[GenerateEvents API] Progression detection:', {
      isProgression,
      progressionSubject: progressionSubject?.substring(0, 100),
    });
    
    // Include sources in response if provided
    const responsePayload: any = { events: events.slice(0, maxEvents) };
    if (isProgression && progressionSubject) {
      responsePayload.isProgression = true;
      responsePayload.progressionSubject = progressionSubject;
    }
    if (normalizedSources.length > 0) {
      responsePayload.sources = normalizedSources;
    }
    if (normalizedImageRefs.length > 0) {
      responsePayload.imageReferences = normalizedImageRefs;
    }
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[GenerateEvents API] Error generating events:', error);
    console.error('[GenerateEvents API] Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
      name: error.name,
    });
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate events',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to generate a single batch of events
async function generateEventsBatch(
  timelineDescription: string,
  timelineName: string,
  batchMaxEvents: number,
  isFactual: boolean,
  isNumbered: boolean,
  numberLabel: string,
  client: AIClientConfig,
  openaiApiKey: string | undefined,
  sourceRestrictions?: string[],
  batchNumber?: number,
  totalBatches?: number
): Promise<{ events: any[]; sources?: any[]; imageReferences?: any[] }> {
  const batchLabel = batchNumber ? ` (batch ${batchNumber}/${totalBatches})` : '';
  console.log(`[GenerateEventsBatch] Generating${batchLabel}: ${batchMaxEvents} events`);
  
  // Build prompts for this batch
  const systemPrompt = isNumbered
    ? `You are a numbered timeline event generator. Generate ${batchMaxEvents} sequential events numbered 1, 2, 3, etc. based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: number (required, sequential starting from 1), title (required, string), description (required, string, 1-3 sentences explaining the event). Events should be ordered sequentially and relevant to the timeline description.`
    : isFactual 
    ? `You are a factual timeline event generator. 

CRITICAL ANTI-HALLUCINATION REQUIREMENTS (MUST FOLLOW):
- NEVER make up, invent, or fabricate events, dates, or facts
- NEVER guess or speculate about information you are not certain about
- ONLY include events that you can verify from reliable sources or your training data
- If you are unsure about specific dates, use only the year (do not guess month/day)
- If you are unsure about an event's details, omit it rather than inventing information
- DO NOT create events based on assumptions, inferences, or logical deductions without factual basis
- DO NOT fill gaps in your knowledge with plausible-sounding but unverified information
- When in doubt, prefer fewer accurate events over many potentially incorrect ones

You MUST generate ${batchMaxEvents} accurate historical events based on the provided timeline description. NEVER return an empty events array - if information is available (from your knowledge or web search), you MUST generate events. Return events as a JSON object with an "events" array. Each event must have: year (required, number or string), title (required, string), and optionally month (number 1-12) and day (number 1-31). Do NOT include descriptions - those will be generated in a separate step.

CRITICAL - DATE FORMAT REQUIREMENTS:
- For dates BEFORE 1 AD (Common Era), you MUST include "BC" or "BCE" notation in the year field (e.g., "3000 BC", "753 BCE", "44 BC")
- For dates 1 AD and later, you may include "AD" or "CE" notation, or just the number (e.g., "2000", "2000 AD", "1066 CE")
- Examples:
  * "3000 BC" for events in 3000 Before Christ
  * "753 BCE" for events in 753 Before Common Era  
  * "44 BC" for events in 44 Before Christ
  * "1066" or "1066 AD" for events in 1066 Anno Domini
  * "2000" or "2000 CE" for events in 2000 Common Era
- The year field can be a string (with BC/AD notation) or a number (for AD dates only)
- DO NOT use positive numbers for BC dates - always include "BC" or "BCE" notation

Additionally, when people are mentioned (e.g., candidates, public officials, celebrities), include an optional top-level "image_references" array with 2-5 DIRECT image URLs (objects with { name: string, url: string }). CRITICAL: URLs must be DIRECT links to image files (.jpg, .png, .webp), NOT wiki pages or article pages. Prefer:
- Direct URLs from upload.wikimedia.org (e.g., https://upload.wikimedia.org/wikipedia/commons/5/56/filename.jpg)
- Official government/press image URLs ending in .jpg/.png
- News agency photo URLs (Reuters, AP, Getty) - direct image links only
NEVER use: commons.wikimedia.org/wiki/ URLs (these are pages, not images), Category pages, or article URLs.

If you use web search, you MUST include a top-level "sources" array with 3-5 reputable news or official sources used (objects with { name: string, url: string }).
- Cite the specific article URLs you relied on (NOT just homepages). Article URLs MUST contain a path beyond the domain, e.g. https://apnews.com/article/... or https://www.nytimes.com/2025/11/04/... 
- Prefer AP, Reuters, PBS, official election sites, and major newspapers.

CRITICAL RECENCY REQUIREMENT FOR NEWSWORTHY TOPICS:
- For political, current events, or news-related timelines, you MUST search for and include events that occurred TODAY or within the last 24-48 hours
- If news sources are reporting breaking developments (e.g., defections, resignations, announcements, election results), you MUST include these recent events in the timeline
- Always prefer contemporaneous sources; if the topic has events in the last 48 hours (e.g., election-night results, political defections, breaking news), you MUST include them via web search
- CRITICAL: For timelines about recent political events or ongoing situations, you MUST use web search to find events from TODAY and YESTERDAY. Do not skip recent events - actively search for the latest news articles about this topic
- Do not omit recent decisive outcomes when sources confirm them - recent events are often the most newsworthy
- When creating timelines about ongoing political situations, current events, or recent developments, prioritize including the most recent events that are being reported in news sources

ACCURACY REQUIREMENTS:
- Generate events based on your knowledge of factual, well-documented information
- Use your training data and web search to provide accurate events for the requested topic
- For public figures, campaigns, elections: include major milestones like announcements, primaries, elections, major events, results
- ALWAYS generate events when information is available - even if dates are approximate, include the events with the information you have
- If web search returns relevant information, you MUST use it to generate events - do not return an empty array
- Only return an empty events array if the topic is completely unknown or impossible to research

IMPORTANT: Only include month and day if you know the exact date. For events where only the year is known, only include the year. Do not default to January 1 or any other date. Only include precise dates when you are confident about them.

Events should be chronologically ordered and relevant to the timeline description.`
    : `You are a creative timeline event generator for fictional narratives. Generate up to ${batchMaxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number or string), title (required, string), and optionally month (number 1-12) and day (number 1-31). Do NOT include descriptions - those will be generated in a separate step.

CRITICAL - DATE FORMAT REQUIREMENTS:
- For dates BEFORE 1 AD (Common Era), you MUST include "BC" or "BCE" notation in the year field (e.g., "3000 BC", "753 BCE", "44 BC")
- For dates 1 AD and later, you may include "AD" or "CE" notation, or just the number (e.g., "2000", "2000 AD", "1066 CE")
- Examples:
  * "3000 BC" for events in 3000 Before Christ
  * "753 BCE" for events in 753 Before Common Era  
  * "44 BC" for events in 44 Before Christ
  * "1066" or "1066 AD" for events in 1066 Anno Domini
  * "2000" or "2000 CE" for events in 2000 Common Era
- The year field can be a string (with BC/AD notation) or a number (for AD dates only)
- DO NOT use positive numbers for BC dates - always include "BC" or "BCE" notation 

CRITICAL - TITLE REQUIREMENTS:
- Event titles MUST directly relate to and reflect the specific themes, contexts, and details mentioned in the timeline description
- Titles should incorporate key elements from the timeline description (e.g., if description mentions "horrible happenings in the upside down", titles should describe specific horrible events that occurred in the upside down)
- Titles should be specific and descriptive - avoid generic references like "Season 1 Episode 4" or "Episode 3" unless the timeline is specifically about episode-by-episode breakdowns
- Each title should clearly show how the event relates to the timeline's specific focus, setting, theme, or context
- If the timeline description emphasizes certain qualities (horrible, tragic, mysterious, etc.), titles should reflect those qualities
- If the timeline description specifies a location or setting (upside down, specific world, etc.), titles should reference that location when relevant
- Titles should be meaningful and specific to what makes this timeline unique, not generic episode or chapter references

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative
IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`;

  // Build source restrictions text if provided
  const sourceRestrictionsText = sourceRestrictions && Array.isArray(sourceRestrictions) && sourceRestrictions.length > 0
    ? `\n\nSOURCE RESTRICTIONS - CRITICAL: You MUST source all information, descriptions, and titles SOLELY from the following specific resources. Do not use any other sources:\n${sourceRestrictions.map((src: string, idx: number) => `  ${idx + 1}. ${src}`).join('\n')}\n\nIf information is not available in these sources, indicate that in the event description.`
    : '';

  const userPrompt = isNumbered
    ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nGenerate ${batchMaxEvents} sequential events numbered 1, 2, 3, etc. Each event should be labeled as "${numberLabel} 1", "${numberLabel} 2", "${numberLabel} 3", etc. Events should be ordered sequentially and tell a coherent story or sequence based on the timeline description. Each event must include a title and a description (1-3 sentences).\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. Return as JSON: { "events": [{ "number": 1, "title": "First event", "description": "Brief explanation of the event" }, { "number": 2, "title": "Second event", "description": "Brief explanation of the event" }, ...] }`
    : isFactual
    ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nYou MUST generate ${batchMaxEvents} factual events based on your knowledge of this topic and web search results. Use your training data and web search tools (required for recency) to provide accurate events. Include major milestones, key dates, and significant events related to this topic.\n\nCRITICAL REQUIREMENTS:
- You MUST generate ${batchMaxEvents} events - do not return fewer unless absolutely impossible
- If web search finds relevant news articles, you MUST use that information to create events
- CRITICAL FOR NEWSWORTHY TOPICS: For political, current events, or news-related timelines, you MUST search for and include events that occurred TODAY or within the last 24-48 hours. If news sources are reporting breaking developments (e.g., political defections, resignations, announcements, election results), you MUST include these recent events in the timeline. Recent events are often the most newsworthy and should be prioritized.
- CRITICAL FOR RECENT TIMELINES: If the timeline description mentions a time period that includes today (e.g., "since 2024", "since the election", "since [recent date]"), you MUST use web search to actively find events from TODAY, YESTERDAY, and the last 48 hours. Do not rely solely on your training data - you MUST search for the most recent news articles. For example, if creating a timeline about "MPs that defected since 2024 general election", you MUST search for defections that happened today, yesterday, and this week.
IMPORTANT: If web search returns news articles about this topic, you MUST create events from that information. Do not return an empty events array if news sources are reporting on the topic. Generate a comprehensive timeline with all major events you know about this topic, using both your training data and web search results. For newsworthy topics, prioritize including the most recent events being reported in news sources.\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. 

Return as JSON with these keys:
- "isProgression": boolean (true if the timeline describes a sequential process/progression, false otherwise)
- "progressionSubject": string (the core subject of the progression, e.g., "a human fetus inside the womb" - only include if isProgression is true, otherwise omit or set to null)
- "events": array of event objects, each with: year (required, number), title (required, string). Do NOT include descriptions - those will be generated separately.
- "sources": array (optional, only if web search was used) of objects with { name: string, url: string }
- "image_references": array (optional, only if people are mentioned) of objects with { name: string, url: string }

Example for progression: { "isProgression": true, "progressionSubject": "a human fetus inside the womb", "events": [{ "year": 2025, "title": "Neural Tube Formation", "description": "..." }, ...] }
Example for non-progression: { "isProgression": false, "events": [{ "year": 2020, "title": "Event title", "description": "..." }, ...], "sources": [...], "image_references": [...] }`
    : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictionsText}\n\nGenerate up to ${batchMaxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Each event must include a title and a description (1-3 sentences).\n\nCRITICAL TITLE REQUIREMENTS:\n- Each event title MUST directly relate to and incorporate key elements from the timeline description above\n- If the timeline description mentions specific themes (e.g., "horrible happenings"), qualities (e.g., "tragic", "mysterious"), settings (e.g., "in the upside down"), or contexts (e.g., "from Stranger Things"), the titles MUST reflect these elements\n- Titles should be specific and descriptive - avoid generic episode/chapter references like "Season 1 Episode 4" unless the timeline is specifically about episode-by-episode breakdowns\n- Each title should clearly show how the event relates to the timeline's specific focus, setting, theme, or context\n- Example: If timeline is "horrible happenings in Stranger Things that occurred in the upside down", titles should be like "Demogorgon Attack in the Upside Down" or "Will's Terrifying Encounter with the Mind Flayer" - NOT "Season 1 Episode 4" or "Episode 3"\n- Make titles meaningful and specific to what makes this timeline unique\n\nCRITICAL: You MUST return ONLY valid JSON. Do not include any explanatory text, comments, or other content. Start your response with { and end with }. Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery", "description": "Brief explanation of the event" }, { "year": 2021, "title": "The First Conflict", "description": "Brief explanation of the event" }, ...] }`;

  // Calculate max_tokens for this batch
  let maxTokens: number;
  if (client.provider === 'kimi') {
    // For smaller batches (25 events), use more conservative token limits
    // K2 models have 8k output token limits, so we need to be careful
    if (batchMaxEvents >= 25) {
      maxTokens = Math.min(8000, (batchMaxEvents * 300) + 2000);
    } else {
      maxTokens = Math.min(16384, (batchMaxEvents * 800) + 4000);
    }
  } else {
    maxTokens = Math.min(40000, (batchMaxEvents * 2000) + 15000);
  }
  
  console.log(`[GenerateEventsBatch] Request config${batchLabel}: provider=${client.provider}, batchMaxEvents=${batchMaxEvents}, maxTokens=${maxTokens}`);
  
  // Use Chat Completions - prioritize web search support for event generation
  // Use kimi-k2-turbo-preview: Moonshot recommends it for web search (handles increased token load from search results)
  const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
  
  const data = await createChatCompletion(client, {
    model: modelToUse,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: maxTokens,
    maxEvents: batchMaxEvents,
  });
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from AI API');
  }
  
  const contentText = data.choices[0].message.content;
  if (!contentText || typeof contentText !== 'string') {
    throw new Error('Empty assistant response');
  }
  
  // Log the raw response for debugging
  console.log(`[GenerateEventsBatch] Raw response${batchLabel} (first 500 chars):`, contentText.substring(0, 500));
  
  // Parse JSON response with error handling
  let jsonText = contentText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  let content;
  try {
    content = JSON.parse(jsonText);
  } catch (parseError: any) {
    console.error(`[GenerateEventsBatch] JSON parse error${batchLabel}:`, {
      error: parseError.message,
      contentPreview: jsonText.substring(0, 1000),
      contentLength: jsonText.length,
      firstChars: jsonText.substring(0, 100),
      lastChars: jsonText.substring(Math.max(0, jsonText.length - 200)),
    });
    
    // Check if the response is an error message or explanation
    if (jsonText.toLowerCase().includes('i cannot') || jsonText.toLowerCase().includes('i am unable') || 
        jsonText.toLowerCase().includes('i apologize') || jsonText.toLowerCase().startsWith('i ')) {
      console.error(`[GenerateEventsBatch] AI returned explanation instead of JSON${batchLabel}. Full response:`, jsonText);
      throw new Error(`AI returned explanation instead of JSON: ${jsonText.substring(0, 200)}`);
    }
    
    // Try to extract JSON object from the text if it's embedded in other text
    let jsonStart = jsonText.indexOf('{');
    if (jsonStart === -1) {
      console.error(`[GenerateEventsBatch] No JSON object found in response${batchLabel}. Full response:`, jsonText);
      throw new Error(`Failed to parse AI response: ${parseError.message}. No JSON object found in response (response starts with: "${jsonText.substring(0, 50)}")`);
    }
    
    // Extract from first { to end, then try to find the matching closing }
    let jsonCandidate = jsonText.substring(jsonStart);
    
    // Try to find the last complete JSON object by matching braces
    let braceCount = 0;
    let jsonEnd = -1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonCandidate.length; i++) {
      const char = jsonCandidate[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1) {
      throw new Error(`Failed to parse AI response: ${parseError.message}. Could not find complete JSON object.`);
    }
    
    jsonCandidate = jsonCandidate.substring(0, jsonEnd);
    
    try {
      content = JSON.parse(jsonCandidate.trim());
      console.warn(`[GenerateEventsBatch] Successfully extracted JSON from text response${batchLabel}`);
    } catch (extractError: any) {
      throw new Error(`Failed to parse AI response: ${parseError.message}. Extracted JSON also failed: ${extractError.message}`);
    }
  }
  
  if (!content.events || !Array.isArray(content.events)) {
    throw new Error('Invalid events format in AI response');
  }
  
  // Map and validate events
  // Track which events actually had years provided by AI (vs made up)
  const parsedYears: number[] = [];
  const hadYearProvided: boolean[] = []; // Track if AI actually provided a year
  if (!isNumbered) {
    // First pass: check which events had years provided and parse them
    content.events.forEach((event: any) => {
      // Check if AI actually provided a year field (not undefined/null/empty)
      const hadYear = event.year !== undefined && event.year !== null && String(event.year).trim() !== '';
      hadYearProvided.push(hadYear);
      
      // Parse year only if it was provided
      const year = hadYear ? parseYear(event.year) : undefined;
      parsedYears.push(year);
    });
  }
  
  const events = content.events.map((event: any, index: number) => {
    const title = String(event.title || '').trim();
    
    if (isNumbered) {
      const number = event.number ? parseInt(event.number) : (index + 1);
      return {
        number: number,
        title: title || `${numberLabel} ${number}`,
        description: event.description || '',
      };
    } else {
      // Use parseYear with context from sequence to infer BC/AD
      const previousYear = index > 0 ? parsedYears[index - 1] : undefined;
      const nextYear = index < parsedYears.length - 1 ? parsedYears[index + 1] : undefined;
      
      // Re-parse with context (but only if the year string doesn't have explicit BC/AD notation)
      const yearStr = String(event.year || '').trim();
      const hasExplicitNotation = /(BC|BCE|AD|CE)/i.test(yearStr);
      
      let year: number | undefined;
      if (hadYearProvided[index]) {
        // AI provided a year - parse it
        year = hasExplicitNotation 
          ? parseYear(event.year) 
          : parseYear(event.year, { previousYear, nextYear });
      } else {
        // AI did not provide a year - leave undefined
        year = undefined;
      }
      
      // Filter out placeholder dates (Jan 1, Dec 31) - only include month/day if they're real dates
      let month: number | undefined = undefined;
      let day: number | undefined = undefined;
      
      if (event.month && event.day) {
        const monthNum = parseInt(event.month);
        const dayNum = parseInt(event.day);
        // Only include if not placeholder dates (Jan 1 or Dec 31)
        if (!((monthNum === 1 && dayNum === 1) || (monthNum === 12 && dayNum === 31))) {
          month = monthNum;
          day = dayNum;
        }
      } else if (event.month) {
        // Only include month if day is also provided (both must be real)
        // If only month is provided, it's likely a placeholder, so ignore it
      }
      
      // If no year was provided by AI, don't default to current year
      // We'll detect this later and convert to numbered events
      return {
        year: year || undefined,
        month: month,
        day: day,
        title: title || `Event ${index + 1}`,
        description: event.description || '',
      };
    }
  }).filter((event: any) => {
    const hasTitle = event.title && event.title.trim() && event.title !== 'Untitled Event';
    if (isNumbered) {
      return hasTitle && event.number && !isNaN(event.number) && event.number > 0;
    } else {
      return hasTitle;
    }
  });
  
  // Normalize sources and image references
  const normalizedSources: any[] = [];
  const normalizedImageRefs: any[] = [];
  
  if (Array.isArray(content.sources)) {
    const isArticleUrl = (url: string) => /^https?:\/\/[^\/]+\/.+/.test(url);
    normalizedSources.push(...content.sources
      .map((s: any) => {
        if (typeof s === 'string') return { name: '', url: s };
        return { name: String(s?.name || ''), url: String(s?.url || '') };
      })
      .filter((s: any) => s.url && isArticleUrl(s.url))
      .slice(0, 10));
  }
  
  if (Array.isArray(content.image_references)) {
    const isUrl = (url: string) => /^https?:\/\//.test(url);
    normalizedImageRefs.push(...content.image_references
      .map((s: any) => {
        if (typeof s === 'string') return { name: '', url: s };
        return { name: String(s?.name || ''), url: String(s?.url || '') };
      })
      .filter((s: any) => s.url && isUrl(s.url))
      .slice(0, 12));
  }
  
  // Detect if events don't have meaningful dates (AI didn't provide years)
  // If so, convert them to numbered events instead of using fake dates
  if (!isNumbered && events.length > 0) {
    // Check if AI actually provided years for the events
    const eventsWithYearsProvided = hadYearProvided.filter(had => had).length;
    
    // If less than 50% of events had years provided by AI, convert all to numbered events
    // This handles cases like fictional content where dates don't exist
    if (eventsWithYearsProvided < events.length * 0.5) {
      console.log(`[GenerateEventsBatch] Detected events without years provided by AI - converting to numbered events${batchLabel}`);
      const convertedEvents = events.map((e: any, idx: number) => ({
        number: idx + 1,
        title: e.title || `Event ${idx + 1}`,
        description: e.description || '',
      }));
      
      return {
        events: convertedEvents,
        wasConvertedToNumbered: true,
        reason: 'Events did not have dates, so they were sequenced using numbers instead',
        sources: normalizedSources.length > 0 ? normalizedSources : undefined,
        imageReferences: normalizedImageRefs.length > 0 ? normalizedImageRefs : undefined,
      };
    }
  }
  
  console.log(`[GenerateEventsBatch] Generated${batchLabel}: ${events.length} events`);
  
  return {
    events,
    sources: normalizedSources.length > 0 ? normalizedSources : undefined,
    imageReferences: normalizedImageRefs.length > 0 ? normalizedImageRefs : undefined,
  };
}

