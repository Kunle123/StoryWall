import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate descriptions for timeline events
 * 
 * Request Body:
 * {
 *   events: Array<{ year: number, title: string }>
 *   timelineDescription: string
 *   writingStyle: string
 * }
 * 
 * Response:
 * {
 *   descriptions: Array<string>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, timelineDescription, writingStyle = 'narrative' } = body;

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

    // TODO: Integrate with AI service
    const aiApiKey = process.env.OPENAI_API_KEY;
    
    if (!aiApiKey) {
      // Return mock data for development
      console.warn('OPENAI_API_KEY not set. Returning mock descriptions.');
      return NextResponse.json({
        descriptions: events.map(() => 
          'This is a placeholder description. Connect your AI service to generate real descriptions based on the event title and timeline context.'
        ),
      });
    }

    // Actual AI integration with OpenAI
    const styleInstructions: Record<string, string> = {
      formal: 'Write in a formal, academic tone.',
      casual: 'Write in a casual, conversational tone.',
      narrative: 'Write in an engaging narrative style.',
      academic: 'Write in an academic, scholarly tone.',
      journalistic: 'Write in a journalistic, objective tone.',
    };

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
            content: `You are a timeline description writer. ${styleInstructions[writingStyle] || styleInstructions.narrative} Generate engaging descriptions for historical events. Each description should be 2-4 sentences and relevant to the event title and timeline context.`,
          },
          {
            role: 'user',
            content: `Timeline Context: ${timelineDescription}\n\nGenerate descriptions for these events:\n${events.map((e: any, i: number) => `${i + 1}. ${e.year}: ${e.title}`).join('\n')}\n\nReturn a JSON object with a "descriptions" array containing one description per event in the same order.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate descriptions');
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    const descriptions = content.descriptions || events.map(() => 'Description not generated.');
    
    // Ensure we have the same number of descriptions as events
    while (descriptions.length < events.length) {
      descriptions.push('Description not generated.');
    }
    
    return NextResponse.json({ descriptions: descriptions.slice(0, events.length) });
  } catch (error: any) {
    console.error('Error generating descriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}

