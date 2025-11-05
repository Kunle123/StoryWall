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

    // AI integration with OpenAI GPT-4
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: isFactual 
              ? `You are a factual timeline event generator. Generate up to ${maxEvents} accurate historical events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). 

CRITICAL ACCURACY REQUIREMENTS:
- Only generate events that are FACTUALLY VERIFIED and well-documented
- Do NOT invent, speculate, or make up events that you are not certain about
- If you are unsure about specific dates or details, omit them rather than guessing
- For recent or obscure topics, be extra cautious and only include information you are confident is accurate
- If the topic is too recent or not well-documented, generate fewer events rather than inaccurate ones

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
              ? `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} FACTUALLY ACCURATE events. Only include events you are certain are correct based on verified historical information. If you are unsure about any details, omit them rather than guessing. Only include month and day for events with historically significant specific dates (like 9/11/2001, D-Day 6/6/1944). For most events, only include the year. Return as JSON: { "events": [{ "year": 2001, "month": 9, "day": 11, "title": "9/11 Attacks" }, { "year": 1945, "title": "End of World War II" }, ...] }`
              : `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} creative fictional events that tell an engaging story. Build events that flow chronologically and create an interesting narrative. Use your imagination to create compelling events that fit the theme. Include specific dates when they enhance the narrative. Return as JSON: { "events": [{ "year": 2020, "month": 3, "day": 15, "title": "The Discovery" }, { "year": 2021, "title": "The First Conflict" }, ...] }`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: isFactual ? 0.3 : 0.8, // Lower temperature for factual, higher for creative/fictional
        // Optimize: ~100 tokens per event + structure overhead
        // Cap at reasonable max to prevent slow responses
        max_tokens: Math.min(3000, (maxEvents * 100) + 500),
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
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    const content = JSON.parse(data.choices[0].message.content);
    
    // Ensure the response has the correct format
    if (!content.events || !Array.isArray(content.events)) {
      throw new Error('Invalid events format in OpenAI response');
    }
    
    const events = content.events.map((event: any) => ({
      year: parseInt(event.year) || new Date().getFullYear(),
      month: event.month ? parseInt(event.month) : undefined,
      day: event.day ? parseInt(event.day) : undefined,
      title: String(event.title || 'Untitled Event'),
    })).filter((event: any) => event.year && event.title);
    
    return NextResponse.json({ events: events.slice(0, maxEvents) });
  } catch (error: any) {
    console.error('Error generating events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate events' },
      { status: 500 }
    );
  }
}

