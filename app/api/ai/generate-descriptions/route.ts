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

    const aiApiKey = process.env.OPENAI_API_KEY;
    
    if (!aiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Please add it to your environment variables.' },
        { status: 500 }
      );
    }

    // AI integration with OpenAI GPT-4
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
            content: `You are a timeline description writer. ${styleInstructions[writingStyle] || styleInstructions.narrative} Generate engaging descriptions for historical events. Each description should be 2-4 sentences and relevant to the event title and timeline context. Return descriptions as a JSON object with a "descriptions" array.`,
          },
          {
            role: 'user',
            content: `Timeline Context: ${timelineDescription}\n\nGenerate descriptions for these ${events.length} events:\n${events.map((e: any, i: number) => `${i + 1}. ${e.year}: ${e.title}`).join('\n')}\n\nReturn JSON: { "descriptions": ["description 1", "description 2", ...] } with exactly ${events.length} descriptions in the same order.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 3000,
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
      return NextResponse.json(
        { error: 'Failed to generate descriptions from OpenAI API', details: errorData.message || errorData.error?.message || 'Unknown error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    const content = JSON.parse(data.choices[0].message.content);
    
    if (!content.descriptions || !Array.isArray(content.descriptions)) {
      throw new Error('Invalid descriptions format in OpenAI response');
    }
    
    let descriptions = content.descriptions.map((desc: any) => String(desc || 'Description not generated.'));
    
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

