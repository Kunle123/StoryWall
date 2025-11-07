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
      ? `You are a factual timeline event generator. You MUST generate ${maxEvents} accurate historical events based on the provided timeline description. NEVER return an empty events array - if information is available (from your knowledge or web search), you MUST generate events. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31).

Additionally, when people are mentioned (e.g., candidates, public officials), include an optional top-level "image_references" array with 3-8 high-quality reference image links (objects with { name: string, url: string }). Prefer:
- Official portraits or headshots (campaign or government sites)
- Wikimedia Commons pages for the person
- Major newspapers’ article image pages (if durable)
Avoid low-quality or generic stock links.

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
      : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). 

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative

IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`;

    const userPrompt = isFactual
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

Return as JSON: { "events": [...], "sources": [{ "name": "Associated Press", "url": "https://apnews.com/article/..." }, { "name": "Reuters", "url": "https://www.reuters.com/world/us/..." }, ...], "image_references": [{ "name": "Zohran Mamdani", "url": "https://commons.wikimedia.org/..." }, ...] }`
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
            tools: [{ type: 'web_search' }],
            reasoning: { effort: 'low' },
            verbosity: 'low',
            max_completion_tokens: Math.min(3000, (maxEvents * 100) + 500),
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
          console.warn('[GenerateEvents API] Responses API failed (web_search required for factual):', errText);
          return NextResponse.json(
            { error: 'Web search failed for factual generation', details: errText },
            { status: 502 }
          );
        }
      } catch (e) {
        console.warn('[GenerateEvents API] Responses API error (web_search required):', (e as any)?.message);
        return NextResponse.json(
          { error: 'Web search error for factual generation', details: (e as any)?.message || 'Unknown error' },
          { status: 502 }
        );
      }
    }

    // If not using web search (fictional) or content not set
    if (!contentText) {
      if (isFactual) {
        return NextResponse.json(
          { error: 'No content from web search for factual generation', details: 'Responses API returned no content' },
          { status: 502 }
        );
      }
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
          reasoning_effort: isFactual ? 'low' : 'low',
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
      // Try to extract JSON from the response if it's wrapped in markdown code blocks
      let jsonText = contentText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      content = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('[GenerateEvents API] Failed to parse OpenAI message content:', {
        contentPreview: contentText.substring(0, 500),
        contentLength: contentText.length,
        error: parseError.message,
      });
      
      // Try to extract JSON object from the text if it's embedded in other text
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          content = JSON.parse(jsonMatch[0]);
          console.log('[GenerateEvents API] Successfully extracted JSON from text');
        } catch (e) {
          throw new Error('Failed to parse OpenAI response content: ' + parseError.message);
        }
      } else {
        throw new Error('Failed to parse OpenAI response content: ' + parseError.message);
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
    // But be more lenient - if it has a title, keep it even if year is missing
    const events = mappedEvents.filter((event: any) => {
      const hasTitle = event.title && event.title.trim() && event.title !== 'Untitled Event';
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
      const fallbackEvents = mappedEvents.map((e: any) => ({
        year: e.year || new Date().getFullYear(),
        month: e.month,
        day: e.day,
        title: e.title || 'Untitled Event',
      }));
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

