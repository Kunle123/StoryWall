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

    // AI integration with OpenAI GPT-5
    // Using Chat Completions API (can also use Responses API for better CoT support)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini', // Using GPT-5-mini for cost optimization with excellent instruction following
        messages: [
          {
            role: 'system',
            content: isFactual 
              ? `You are a factual timeline event generator. Generate up to ${maxEvents} accurate historical events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). 

CRITICAL ACCURACY REQUIREMENTS:
- Only generate events that are FACTUALLY VERIFIED and well-documented in reliable sources
- Do NOT invent, speculate, or make up events that you are not certain about
- If you are unsure about specific dates or details, omit them rather than guessing
- For recent or obscure topics, be extra cautious and only include information you are confident is accurate

GUIDELINES FOR RECENT EVENTS (2023-PRESENT):
- Your training data may not include recent events or may be outdated
- For well-known public figures, campaigns, or widely reported events, generate events based on what is commonly known and documented
- If the topic is a public figure or widely covered event, try to generate at least 3-5 well-documented events that are commonly known
- Only return an empty array if the topic is completely unknown, unknowable, or if you have absolutely no knowledge about it
- For public political campaigns, elections, or public figures, include major milestones like: announcement dates (if known), primary dates, election dates, major campaign events, results, etc.
- If specific dates are uncertain, use only the year
- PREFER generating fewer accurate events (3-5) over returning an empty array for known topics

IMPORTANT: Only include month and day if the exact date is historically known and significant (e.g., "September 11, 2001" for 9/11). For events where only the year is known, only include the year. Do not default to January 1 or any other date. Only include precise dates for well-known specific dates like 9/11, D-Day (June 6, 1944), etc.

Events should be chronologically ordered and relevant to the timeline description.`
              : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). 

CREATIVE GUIDELINES:
- Generate imaginative, compelling events that fit the narrative theme
- Create events that build upon each other to tell a coherent story
- Use creative freedom to develop interesting plot points and developments
- Events should be chronologically ordered and relevant to the timeline description
- Feel free to include specific dates when they enhance the narrative

IMPORTANT: Only include month and day when they add narrative significance. For most events, including the year is sufficient.`,
          },
          {
            role: 'user',
            content: isFactual
              ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} FACTUALLY ACCURATE events. Only include events you are certain are correct based on verified historical information. If you are unsure about any details, omit them rather than guessing. 

For this timeline, generate events based on what is commonly known and documented. If this is a well-known public figure, campaign, or widely reported topic, include major milestones and key events that are publicly documented. Try to generate at least 3-5 events if the topic is known to you. Only return an empty array if you have absolutely no knowledge about this topic.

For recent events (2023-present), use only the year if specific dates are uncertain. DO NOT make up specific dates or events you're not confident about, but DO try to generate events for well-known topics.

Only include month and day for events with historically significant specific dates (like 9/11/2001, D-Day 6/6/1944). For most events, only include the year. Return as JSON: { "events": [{ "year": 2001, "month": 9, "day": 11, "title": "9/11 Attacks" }, { "year": 1945, "title": "End of World War II" }, ...] }`
              : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery" }, { "year": 2021, "title": "The First Conflict" }, ...] }`,
          },
        ],
        response_format: { type: 'json_object' },
        // GPT-5 doesn't support temperature - use reasoning_effort and verbosity instead
        reasoning_effort: isFactual ? 'low' : 'low', // Low reasoning for better recall and less empty responses
        verbosity: 'low', // Low verbosity for concise JSON responses
        // GPT-5 uses max_completion_tokens instead of max_tokens
        // Optimize: ~100 tokens per event + structure overhead
        // Cap at reasonable max to prevent slow responses
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
    
    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (parseError: any) {
      console.error('[GenerateEvents API] Failed to parse OpenAI message content:', {
        content: data.choices[0].message.content,
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
    
    return NextResponse.json({ events: events.slice(0, maxEvents) });
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

