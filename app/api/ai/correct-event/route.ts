import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Correct/regenerate an event based on verification issues
 * Takes an event with issues and generates a corrected version
 */
export async function POST(request: NextRequest) {
  try {
    const { event, issues, timelineDescription, timelineName } = await request.json();

    if (!event || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: 'Event and issues array are required' },
        { status: 400 }
      );
    }

    if (!timelineDescription || !timelineName) {
      return NextResponse.json(
        { error: 'Timeline description and name are required' },
        { status: 400 }
      );
    }

    console.log('[CorrectEvent] Correcting event:', event.title, 'with issues:', issues);

    const client = getAIClient();

    const correctionPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Correct the following event based on the identified issues. Generate a factually accurate version.

Original Event:
- Date: ${event.year || 'No date'}${event.month ? `/${event.month}` : ''}${event.day ? `/${event.day}` : ''}
- Title: ${event.title}
- Description: ${event.description || 'No description'}

Issues identified:
${issues.map((issue: string, idx: number) => `${idx + 1}. ${issue}`).join('\n')}

Return a JSON object with corrected event:
{
  "title": "Corrected event title (only if title had issues, otherwise keep original)",
  "description": "Corrected description with accurate facts",
  "year": ${event.year || 'null'},
  "month": ${event.month || 'null'},
  "day": ${event.day || 'null'}
}

CRITICAL CORRECTION RULES:
- Only correct what is actually wrong - keep accurate information unchanged
- Use verified, factual information only
- Do not make up or invent details
- If you cannot verify a fact, omit it rather than guessing
- Ensure the corrected description is factually accurate and verifiable
- Maintain the same writing style and tone as the original
- Fix all issues identified in the issues list`;

    const response = await createChatCompletion(client, {
      model: client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a fact-checker and content corrector. Your task is to correct factual errors in timeline events while preserving accurate information. Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: correctionPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for factual accuracy
      max_tokens: 1000,
    });

    if (!response.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to generate correction' },
        { status: 500 }
      );
    }

    const corrected = JSON.parse(response.choices[0].message.content);

    // Merge corrections with original event (only update what was corrected)
    const correctedEvent = {
      ...event,
      title: corrected.title || event.title, // Use corrected title if provided, otherwise keep original
      description: corrected.description || event.description, // Use corrected description
      // Keep original date unless explicitly corrected
      year: corrected.year !== null && corrected.year !== undefined ? corrected.year : event.year,
      month: corrected.month !== null && corrected.month !== undefined ? corrected.month : event.month,
      day: corrected.day !== null && corrected.day !== undefined ? corrected.day : event.day,
    };

    console.log('[CorrectEvent] Correction complete for:', event.title);

    return NextResponse.json({ correctedEvent });
  } catch (error: any) {
    console.error('[CorrectEvent] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to correct event',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

