import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Verify/validate generated timeline events for factual accuracy
 * This is a post-generation fact-checking step
 * 
 * Request Body:
 * {
 *   events: Array<{ year?: number; title: string; description?: string }>
 *   timelineDescription: string
 *   timelineName: string
 * }
 * 
 * Response:
 * {
 *   verifiedEvents: Array<{ ...event, verified: boolean, confidence: 'high' | 'medium' | 'low', issues?: string[] }>
 *   summary: { total: number, verified: number, flagged: number }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, timelineDescription, timelineName } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (!timelineDescription || !timelineName) {
      return NextResponse.json(
        { error: 'Timeline description and name are required' },
        { status: 400 }
      );
    }

    console.log('[VerifyEvents] Verifying', events.length, 'events for timeline:', timelineName);

    const client = getAIClient();

    // Batch verification for efficiency (verify 10 events at a time)
    const batchSize = 10;
    const batches: Array<Array<{ year?: number; title: string; description?: string }>> = [];
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    const verifiedEvents: Array<{
      year?: number;
      title: string;
      description?: string;
      verified: boolean;
      confidence: 'high' | 'medium' | 'low';
      issues?: string[];
    }> = [];

    // Verify each batch
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(`[VerifyEvents] Verifying batch ${batchIdx + 1}/${batches.length} (${batch.length} events)`);

      const verificationPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Verify the factual accuracy of these ${batch.length} events. For each event, determine:
1. Is the event factually accurate based on your knowledge?
2. Is the date (year/month/day) correct?
3. Are there any factual errors, inconsistencies, or unverified claims?

Return JSON with this structure:
{
  "verifications": [
    {
      "eventIndex": 0,
      "verified": true,
      "confidence": "high",
      "issues": []
    },
    {
      "eventIndex": 1,
      "verified": false,
      "confidence": "low",
      "issues": ["Date may be incorrect", "Event title contains unverified details"]
    }
  ]
}

Events to verify:
${batch.map((e, idx) => {
  const dateStr = e.year 
    ? (e.year.toString().includes('BC') || e.year.toString().includes('BCE') 
        ? e.year 
        : `${e.year}${e.month ? `-${e.month.toString().padStart(2, '0')}` : ''}${e.day ? `-${e.day.toString().padStart(2, '0')}` : ''}`)
    : 'No date';
  return `${idx}. ${dateStr}: ${e.title}${e.description ? ` - ${e.description.substring(0, 100)}...` : ''}`;
}).join('\n')}

CRITICAL VERIFICATION RULES:
- Mark as verified=false if you cannot confirm the event from reliable sources
- Mark confidence as "low" if dates or details are uncertain
- Mark confidence as "medium" if event is likely true but some details may be inaccurate
- Mark confidence as "high" only if you are certain the event is factually correct
- List specific issues (e.g., "Date appears incorrect", "Event title contains speculation", "Cannot verify this event occurred")
- Be conservative - when in doubt, flag the event`;

      try {
        const response = await createChatCompletion(client, {
          model: client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a fact-checker and historical accuracy verifier. Your task is to verify the factual accuracy of timeline events. Be conservative - flag any events that cannot be verified or contain uncertain information. Return ONLY valid JSON.`,
            },
            {
              role: 'user',
              content: verificationPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2, // Low temperature for factual verification
          max_tokens: 2000,
        });

        if (response.choices?.[0]?.message?.content) {
          const verificationResult = JSON.parse(response.choices[0].message.content);
          const verifications = verificationResult.verifications || [];

          // Map verifications back to events
          batch.forEach((event, idx) => {
            const verification = verifications.find((v: any) => v.eventIndex === idx) || {
              verified: false,
              confidence: 'low' as const,
              issues: ['Verification failed'],
            };

            verifiedEvents.push({
              ...event,
              verified: verification.verified !== false,
              confidence: verification.confidence || 'low',
              issues: verification.issues || [],
            });
          });
        } else {
          // If verification fails, mark all as unverified
          batch.forEach((event) => {
            verifiedEvents.push({
              ...event,
              verified: false,
              confidence: 'low',
              issues: ['Verification system error'],
            });
          });
        }
      } catch (error: any) {
        console.error(`[VerifyEvents] Error verifying batch ${batchIdx + 1}:`, error.message);
        // On error, mark all events in batch as unverified
        batch.forEach((event) => {
          verifiedEvents.push({
            ...event,
            verified: false,
            confidence: 'low',
            issues: ['Verification error'],
          });
        });
      }
    }

    // Calculate summary
    const summary = {
      total: verifiedEvents.length,
      verified: verifiedEvents.filter(e => e.verified).length,
      flagged: verifiedEvents.filter(e => !e.verified || e.confidence === 'low').length,
      highConfidence: verifiedEvents.filter(e => e.confidence === 'high').length,
      mediumConfidence: verifiedEvents.filter(e => e.confidence === 'medium').length,
      lowConfidence: verifiedEvents.filter(e => e.confidence === 'low').length,
    };

    console.log('[VerifyEvents] Verification complete:', summary);

    return NextResponse.json({
      verifiedEvents,
      summary,
    });
  } catch (error: any) {
    console.error('[VerifyEvents] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify events',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

