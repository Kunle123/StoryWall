import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

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
    let { timelineDescription, timelineName, maxEvents = 20, isFactual = true, isNumbered = false, numberLabel = "Day" } = body;
    
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
    
    // For Responses API (web search), we prefer OpenAI key but can fall back to Chat Completions
    // If OpenAI key is missing, we'll skip web search and use Chat Completions instead

    // Build prompts once
    const systemPrompt = isNumbered
      ? `You are a numbered timeline event generator. Generate ${maxEvents} sequential events numbered 1, 2, 3, etc. based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: number (required, sequential starting from 1), title (required, string), description (required, string, 1-3 sentences explaining the event). Events should be ordered sequentially and relevant to the timeline description.`
      : isFactual 
      ? `You are a factual timeline event generator. You MUST generate ${maxEvents} accurate historical events based on the provided timeline description. NEVER return an empty events array - if information is available (from your knowledge or web search), you MUST generate events. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), description (required, string, 1-3 sentences explaining the event), and optionally month (number 1-12) and day (number 1-31).

Additionally, when people are mentioned (e.g., candidates, public officials, celebrities), include an optional top-level "image_references" array with 2-5 DIRECT image URLs (objects with { name: string, url: string }). CRITICAL: URLs must be DIRECT links to image files (.jpg, .png, .webp), NOT wiki pages or article pages. Prefer:
- Direct URLs from upload.wikimedia.org (e.g., https://upload.wikimedia.org/wikipedia/commons/5/56/filename.jpg)
- Official government/press image URLs ending in .jpg/.png
- News agency photo URLs (Reuters, AP, Getty) - direct image links only
NEVER use: commons.wikimedia.org/wiki/ URLs (these are pages, not images), Category pages, or article URLs.

If you use web search, you MUST include a top-level "sources" array with 3-5 reputable news or official sources used (objects with { name: string, url: string }).
- Cite the specific article URLs you relied on (NOT just homepages). Article URLs MUST contain a path beyond the domain, e.g. https://apnews.com/article/... or https://www.nytimes.com/2025/11/04/... 
- Prefer AP, Reuters, PBS, official election sites, and major newspapers.

RECENCY REQUIREMENT:
- Always prefer contemporaneous sources; if the topic has events in the last 48 hours (e.g., election-night results), you MUST include them via web search. Do not omit recent decisive outcomes when sources confirm them.

ACCURACY REQUIREMENTS:
- Generate events based on your knowledge of factual, well-documented information
- Use your training data and web search to provide accurate events for the requested topic
- If you are unsure about specific dates, use only the year (do not guess month/day)
- For public figures, campaigns, elections: include major milestones like announcements, primaries, elections, major events, results
- ALWAYS generate events when information is available - even if dates are approximate, include the events with the information you have
- If web search returns relevant information, you MUST use it to generate events - do not return an empty array
- Only return an empty events array if the topic is completely unknown or impossible to research

IMPORTANT: Only include month and day if you know the exact date. For events where only the year is known, only include the year. Do not default to January 1 or any other date. Only include precise dates when you are confident about them.

Events should be chronologically ordered and relevant to the timeline description.`
      : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), description (required, string, 1-3 sentences explaining the event), and optionally month (number 1-12) and day (number 1-31). 

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative

IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`;

    const userPrompt = isNumbered
      ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate ${maxEvents} sequential events numbered 1, 2, 3, etc. Each event should be labeled as "${numberLabel} 1", "${numberLabel} 2", "${numberLabel} 3", etc. Events should be ordered sequentially and tell a coherent story or sequence based on the timeline description. Each event must include a title and a description (1-3 sentences). Return as JSON: { "events": [{ "number": 1, "title": "First event", "description": "Brief explanation of the event" }, { "number": 2, "title": "Second event", "description": "Brief explanation of the event" }, ...] }`
      : isFactual
      ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nYou MUST generate ${maxEvents} factual events based on your knowledge of this topic and web search results. Use your training data and web search tools (required for recency) to provide accurate events. Include major milestones, key dates, and significant events related to this topic.\n\nCRITICAL REQUIREMENTS:
- You MUST generate ${maxEvents} events - do not return fewer unless absolutely impossible
- If web search finds relevant news articles, you MUST use that information to create events
- Include the most recent 48-hour developments (e.g., election-night result and victory announcement) when relevant
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

IMPORTANT: If web search returns news articles about this topic, you MUST create events from that information. Do not return an empty events array if news sources are reporting on the topic. Generate a comprehensive timeline with all major events you know about this topic, using both your training data and web search results.

Return as JSON: { "events": [{ "year": 2020, "title": "Event title", "description": "Brief explanation of the event" }, ...], "sources": [{ "name": "Associated Press", "url": "https://apnews.com/article/..." }, { "name": "Reuters", "url": "https://www.reuters.com/world/us/..." }, ...], "image_references": [{ "name": "Zohran Mamdani", "url": "https://commons.wikimedia.org/..." }, ...] }`
      : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Each event must include a title and a description (1-3 sentences). Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery", "description": "Brief explanation of the event" }, { "year": 2021, "title": "The First Conflict", "description": "Brief explanation of the event" }, ...] }`;

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
        let maxTokens: number;
        if (client.provider === 'kimi') {
          // For Kimi, try increasing the cap for large requests
          // K2 models (kimi-k2-*) may support higher output limits
          // Test with 32k cap for large requests (100 events)
          if (maxEvents > 50) {
            // For very large requests, try 32k tokens (K2 models may support this)
            maxTokens = Math.min(32000, (maxEvents * 800) + 4000);
          } else {
            // For smaller requests, use 16k cap
            maxTokens = Math.min(16000, (maxEvents * 800) + 4000);
          }
        } else {
          // For OpenAI, we can request much larger outputs
          maxTokens = Math.min(40000, (maxEvents * 2000) + 15000);
        }
        
        let data;
        try {
          // For factual events, try to use web search if available
          // OpenAI Chat Completions supports tools, Kimi may also support web search
          const tools = isFactual ? [{ type: 'web_search' }] : undefined;
          
          // Kimi supports JSON mode (response_format), so we can use it for both providers
          // See: https://platform.moonshot.ai/docs/guide/use-json-mode-feature-of-kimi-api
          data = await createChatCompletion(client, {
            model: 'gpt-4o-mini', // Will be auto-mapped to appropriate Kimi model if using Kimi
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            // Use JSON mode for both OpenAI and Kimi
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: maxTokens,
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
        
        // Log response details for debugging truncation
        console.log('[GenerateEvents API] Response details:', {
          provider: client.provider,
          model: data.model || 'unknown',
          finishReason: data.choices[0].finish_reason,
          contentLength: contentText?.length || 0,
          usage: data.usage || 'not provided',
          maxTokensRequested: maxTokens,
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
      
      // Validate JSON structure before parsing
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        console.error('[GenerateEvents API] JSON braces mismatch:', {
          openBraces,
          closeBraces,
          contentLength: jsonText.length,
          lastChars: jsonText.substring(Math.max(0, jsonText.length - 200)),
        });
        throw new Error(`Incomplete JSON: ${openBraces} opening braces but ${closeBraces} closing braces`);
      }
      
      content = JSON.parse(jsonText);
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
        const cleanedJson = jsonCandidate.trim();
        content = JSON.parse(cleanedJson);
        console.warn('[GenerateEvents API] Successfully extracted JSON from text response (had text before JSON)');
      } catch (extractError: any) {
        console.error('[GenerateEvents API] Failed to parse extracted JSON:', {
          error: extractError.message,
          jsonPreview: jsonCandidate.substring(0, 500),
          jsonLength: jsonCandidate.length,
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
        // For dated events, use year/month/day
        const year = parseInt(event.year);
        console.log(`[GenerateEvents API] Event ${index + 1}:`, {
          rawYear: event.year,
          parsedYear: year,
          rawTitle: event.title,
          parsedTitle: title,
          hasMonth: !!event.month,
          hasDay: !!event.day,
        });
        
        return {
          year: year || new Date().getFullYear(),
          month: event.month ? parseInt(event.month) : undefined,
          day: event.day ? parseInt(event.day) : undefined,
          title: title || `Event ${index + 1}`,
          description: event.description || '',
        };
      }
    });
    
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
    
    // Include sources in response if provided
    const responsePayload: any = { events: events.slice(0, maxEvents) };
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

