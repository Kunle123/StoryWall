import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Generate natural, abridged narration scripts for TikTok slideshow
 * Creates flowing, concise descriptions that avoid repetition and abrupt endings
 */
export async function POST(request: NextRequest) {
  try {
    const { events, timelineTitle, timelineDescription } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (!timelineTitle) {
      return NextResponse.json(
        { error: 'Timeline title is required' },
        { status: 400 }
      );
    }

    console.log('[generate-slideshow-narration] Generating narration for', events.length, 'events');

    const client = getAIClient();

    // Create a prompt that generates natural, flowing narration
    const systemPrompt = `You are a professional narrator creating concise, engaging voiceover scripts for a TikTok slideshow. Your scripts should:
- Be natural and conversational
- Provide an abridged summary of the event (not a description of the visual scene)
- Use smooth transitions between events
- Avoid repetition
- Be concise (2-4 sentences per event)
- Never end with ellipsis or abrupt cutoffs
- Flow naturally from one event to the next
- Create a cohesive narrative that walks through the history
- Focus on what happened and why it matters, not what the image looks like`;

    const userPrompt = `Create a natural, abridged narration script for a TikTok slideshow about "${timelineTitle}".

${timelineDescription ? `Timeline Description: ${timelineDescription}\n\n` : ''}

For each of the ${events.length} events below, create a concise narration script (2-4 sentences) that:
1. Provides an abridged summary of the event itself (what happened, why it matters)
2. Explains the event's significance in a natural, conversational way
3. Transitions smoothly to the next event (except for the last one)
4. Avoids repetition of information already mentioned
5. Never ends with ellipsis or incomplete thoughts
6. Focuses on the historical/eventual significance, NOT on describing the visual image

Events:
${events.map((e: any, idx: number) => {
  const dateStr = e.year 
    ? (e.year.toString().includes('BC') || e.year.toString().includes('BCE') 
        ? e.year 
        : `${e.year}${e.month ? `-${e.month.toString().padStart(2, '0')}` : ''}${e.day ? `-${e.day.toString().padStart(2, '0')}` : ''}`)
    : 'No date';
  return `${idx + 1}. ${dateStr}: ${e.title}${e.description ? ` - ${e.description}` : ''}`;
}).join('\n')}

Return a JSON object with this structure:
{
  "scripts": [
    {
      "eventIndex": 0,
      "script": "Natural narration for first event that describes what's shown and transitions smoothly..."
    },
    {
      "eventIndex": 1,
      "script": "Natural narration for second event..."
    }
  ]
}

CRITICAL REQUIREMENTS:
- Each script must be complete sentences - no ellipsis, no abrupt endings
- Scripts should flow naturally from one to the next
- Provide an abridged summary of the event (what happened, its significance) - NOT a description of the visual scene
- Keep it concise but complete
- The last script should have a natural conclusion
- Focus on the event's meaning and impact, not what the image looks like`;

    const response = await createChatCompletion(client, {
      model: client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Slightly higher for more natural flow
      max_tokens: 3000,
    });

    if (!response.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Failed to generate narration scripts' },
        { status: 500 }
      );
    }

    const result = JSON.parse(response.choices[0].message.content);
    const scripts = result.scripts || [];

    // Ensure we have a script for each event
    const narrationScripts: string[] = [];
    for (let i = 0; i < events.length; i++) {
      const scriptData = scripts.find((s: any) => s.eventIndex === i);
      if (scriptData && scriptData.script) {
        narrationScripts.push(scriptData.script);
      } else {
        // Fallback: use simple description
        const event = events[i];
        narrationScripts.push(`${event.title}. ${event.description || ''}`);
      }
    }

    // Add intro to first script
    if (narrationScripts.length > 0) {
      let introText = `Welcome to ${timelineTitle}.`;
      if (timelineDescription) {
        const shortDesc = timelineDescription.length > 80
          ? timelineDescription.substring(0, 80) + '...'
          : timelineDescription;
        introText += ` ${shortDesc}`;
      }
      introText += ' Let\'s explore the key moments. ';
      narrationScripts[0] = introText + narrationScripts[0];
    }

    // Add conclusion to last script
    if (narrationScripts.length > 0) {
      const lastScript = narrationScripts[narrationScripts.length - 1];
      if (!lastScript.includes('Thanks') && !lastScript.includes('thank')) {
        narrationScripts[narrationScripts.length - 1] = lastScript + ' Thanks for watching!';
      }
    }

    console.log('[generate-slideshow-narration] Generated', narrationScripts.length, 'narration scripts');

    return NextResponse.json({ scripts: narrationScripts });
  } catch (error: any) {
    console.error('[generate-slideshow-narration] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate narration scripts',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

