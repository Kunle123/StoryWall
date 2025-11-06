import { NextRequest, NextResponse } from 'next/server';

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
    const { timelineDescription, timelineName, maxEvents = 20, isFactual = true } = body;
    
    console.log('[GenerateEvents API] Request received:', {
      timelineName,
      descriptionLength: timelineDescription?.length,
      maxEvents,
      isFactual,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });

    if (!timelineDescription || !timelineName) {
      return NextResponse.json(
        { error: 'Timeline description and name are required' },
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

    // Build prompts once
    const systemPrompt = isFactual 
      ? `You are a factual timeline event generator. Generate up to ${maxEvents} accurate historical events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31).

If you use web search, you MUST include a top-level "sources" array with 3-5 reputable news or official sources used (objects with { name: string, url: string }).
- Cite the specific article URLs you relied on (NOT just homepages). Article URLs MUST contain a path beyond the domain, e.g. https://apnews.com/article/... or https://www.nytimes.com/2025/11/04/... 
- Prefer AP, Reuters, PBS, official election sites, and major newspapers.

ACCURACY REQUIREMENTS:
- Generate events based on your knowledge of factual, well-documented information
- Use your training data (and web search if available) to provide accurate events for the requested topic
- If you are unsure about specific dates, use only the year (do not guess month/day)
- For public figures, campaigns, elections: include major milestones like announcements, primaries, elections, major events, results
- Generate as many accurate events as you can, up to the requested maximum

IMPORTANT: Only include month and day if you know the exact date. For events where only the year is known, only include the year. Do not default to January 1 or any other date. Only include precise dates when you are confident about them.

Events should be chronologically ordered and relevant to the timeline description.`
      : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). 

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative

IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`;

    const userPrompt = isFactual
      ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} factual events based on your knowledge of this topic. Use your training data and web search tools (if available) to provide accurate events. Include major milestones, key dates, and significant events related to this topic.\n\nCRITICAL: Include the most recent election-night result (date and result) and victory announcement if they occurred. Include primary date(s) and result(s) as well. Use article-level citations for these items (not just domain homepages). 

For political campaigns, elections, or public figures: include ALL major events such as:
- Announcement of candidacy (with specific date if known)
- Filing deadlines or official declarations
- Primary elections (dates and results)
- Debates and major campaign events
- General election dates
- Election results and victory announcements
- Inauguration or assumption of office dates

Include as many significant events as you can. If you know the specific date (month and day), include it. If you only know the year, include only the year. Do not guess dates you're uncertain about.

Generate a comprehensive timeline with all major events you know about this topic. Return as JSON: { "events": [...], "sources": [{ "name": "Associated Press", "url": "https://apnews.com/article/..." }, { "name": "Reuters", "url": "https://www.reuters.com/world/us/..." }, ...] }`
      : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery" }, { "year": 2021, "title": "The First Conflict" }, ...] }`;

    // Prefer Responses API with web_search tool for factual timelines (helps with post-2024 knowledge)
    let response;
    let contentText: string | null = null;
    const useWebSearch = !!isFactual;

    if (useWebSearch) {
      try {
        console.log('[GenerateEvents API] Using Responses API with web_search tool');
        const resp = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            input: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            tools: [{ type: 'web_search' }],
            reasoning_effort: 'minimal',
            verbosity: 'low',
            max_completion_tokens: Math.min(3000, (maxEvents * 100) + 500),
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          // Prefer convenient field when available
          if (typeof data.output_text === 'string') {
            contentText = data.output_text;
          } else if (Array.isArray(data.output)) {
            // Find assistant message content text
            for (const item of data.output) {
              if (item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)) {
                const textPart = item.content.find((c: any) => typeof c.text === 'string');
                if (textPart) {
                  contentText = textPart.text;
                  break;
                }
              }
            }
          }
        } else {
          const errText = await resp.text();
          console.warn('[GenerateEvents API] Responses API failed, falling back to chat completions:', errText);
        }
      } catch (e) {
        console.warn('[GenerateEvents API] Responses API error, falling back to chat completions:', (e as any)?.message);
      }
    }

    // Fallback or if not using web search: Chat Completions API
    if (!contentText) {
      console.log('[GenerateEvents API] Using Chat Completions API');
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          reasoning_effort: isFactual ? 'minimal' : 'low',
          verbosity: 'low',
          max_completion_tokens: Math.min(3000, (maxEvents * 100) + 500),
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
        const errorMessage = errorData.message || errorData.error?.message || errorText || 'Unknown error';
        return NextResponse.json(
          { error: 'Failed to generate events from OpenAI API', details: errorMessage },
          { status: response.status >= 400 && response.status < 600 ? response.status : 500 }
        );
      }

      const data = await response.json();
      
      console.log('[GenerateEvents API] OpenAI API response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasFirstChoice: !!data.choices?.[0],
        hasMessage: !!data.choices?.[0]?.message,
        messageContentLength: data.choices?.[0]?.message?.content?.length,
      });
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[GenerateEvents API] Invalid OpenAI response structure:', data);
        throw new Error('Invalid response format from OpenAI');
      }
      contentText = data.choices[0].message.content;
    }

    if (!contentText || typeof contentText !== 'string') {
      throw new Error('Empty assistant response');
    }

    let content;
    try {
      content = JSON.parse(contentText);
    } catch (parseError: any) {
      console.error('[GenerateEvents API] Failed to parse OpenAI message content:', {
        content: contentText,
        error: parseError.message,
      });
      throw new Error('Failed to parse OpenAI response content');
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
      const year = parseInt(event.year);
      const title = String(event.title || '').trim();
      
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
      };
    });
    
    // Filter out only events that are completely invalid (no year AND no title)
    const events = mappedEvents.filter((event: any) => {
      const isValid = event.year && event.title && event.title !== 'Untitled Event';
      if (!isValid) {
        console.warn('[GenerateEvents API] Filtered out invalid event:', event);
      }
      return isValid;
    });
    
    console.log('[GenerateEvents API] Events after filtering:', events.length, 'out of', mappedEvents.length);

    // Normalize and validate sources if provided (require article-level URLs, not bare domains)
    let normalizedSources: any[] | undefined = undefined;
    if (Array.isArray(content.sources)) {
      const isArticleUrl = (url: string) => /^https?:\/\/[^\/]+\/.+/.test(url);
      normalizedSources = content.sources
        .map((s: any) => {
          if (typeof s === 'string') return { name: '', url: s };
          return { name: String(s?.name || ''), url: String(s?.url || '') };
        })
        .filter((s: any) => s.url && isArticleUrl(s.url))
        .slice(0, 10);
      console.log('[GenerateEvents API] Sources (filtered):', normalizedSources.map((s: any) => s.url));
    }
    
    // If all events were filtered out, return the mapped events anyway (with defaults)
    if (events.length === 0 && mappedEvents.length > 0) {
      console.warn('[GenerateEvents API] All events filtered out, using mapped events with defaults');
      const fallbackEvents = mappedEvents.map((e: any) => ({
        year: e.year || new Date().getFullYear(),
        month: e.month,
        day: e.day,
        title: e.title || 'Untitled Event',
      }));
      return NextResponse.json({ events: fallbackEvents.slice(0, maxEvents) });
    }
    
    if (events.length === 0) {
      console.error('[GenerateEvents API] No valid events after processing. Raw content:', content);
      return NextResponse.json(
        { 
          error: 'No events were generated. Please try again or provide more details in your timeline description.',
          details: 'The AI may have been uncertain about the topic or the response format was invalid.'
        },
        { status: 200 } // Return 200 but with error message so frontend can handle gracefully
      );
    }
    
    console.log('[GenerateEvents API] Successfully generated events:', events.length);
    
    // Include sources in response if provided
    const responsePayload: any = { events: events.slice(0, maxEvents) };
    if (normalizedSources && normalizedSources.length > 0) {
      responsePayload.sources = normalizedSources;
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

