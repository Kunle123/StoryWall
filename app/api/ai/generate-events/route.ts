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

    // TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
    // For now, return a mock response structure
    // Replace this with actual AI API call
    
    const aiApiKey = process.env.OPENAI_API_KEY;
    
    if (!aiApiKey) {
      // Return mock data for development
      console.warn('OPENAI_API_KEY not set. Returning mock data.');
      return NextResponse.json({
        events: [
          { year: 1939, month: 9, day: 1, title: 'Start of Timeline Event 1' },
          { year: 1940, title: 'Timeline Event 2' },
          { year: 1941, month: 12, day: 7, title: 'Timeline Event 3' },
        ].slice(0, Math.min(maxEvents, 3)),
      });
    }

    // Actual AI integration with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a timeline event generator. Generate up to ${maxEvents} historical events based on the provided timeline description. Return events as a JSON array with fields: year (required), month (optional), day (optional), title (required). Events should be chronologically ordered and relevant to the timeline description.`,
          },
          {
            role: 'user',
            content: `Timeline: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate ${maxEvents} relevant events as a JSON array.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate events');
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    // Ensure the response has the correct format
    const events = content.events || [];
    
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error generating events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate events' },
      { status: 500 }
    );
  }
}

