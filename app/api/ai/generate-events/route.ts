import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate timeline events based on timeline description
 * 
 * Request Body:
 * {
 *   timelineDescription: string
 *   timelineName: string
 *   maxEvents: number (default: 20)
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
    const { timelineDescription, timelineName, maxEvents = 20 } = body;

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
            content: `You are a timeline event generator. Generate up to ${maxEvents} historical events based on the provided timeline description. Return events as a JSON object with an "events" array. Each event must have: year (required, number), title (required, string), and optionally month (number 1-12) and day (number 1-31). Events should be chronologically ordered and relevant to the timeline description.`,
          },
          {
            role: 'user',
            content: `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} relevant events. Return as JSON: { "events": [{ "year": 1939, "month": 9, "day": 1, "title": "Event Title" }, ...] }`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
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

