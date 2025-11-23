import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Verify events and auto-correct low/medium confidence ones
 * Returns verified and corrected events
 */
export async function verifyAndCorrectEvents(
  events: Array<{
    year?: number;
    month?: number;
    day?: number;
    title: string;
    description?: string;
  }>,
  timelineDescription: string,
  timelineName: string,
  autoCorrect: boolean = true
): Promise<{
  verifiedEvents: Array<{
    year?: number;
    month?: number;
    day?: number;
    title: string;
    description?: string;
    verified: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues?: string[];
    corrected?: boolean;
  }>;
  summary: {
    total: number;
    verified: number;
    flagged: number;
    corrected: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}> {
  const client = getAIClient();

  // Batch verification (10 events at a time)
  const batchSize = 10;
  const batches: Array<Array<typeof events[0]>> = [];
  for (let i = 0; i < events.length; i += batchSize) {
    batches.push(events.slice(i, i + batchSize));
  }

  const verifiedEvents: Array<{
    year?: number;
    month?: number;
    day?: number;
    title: string;
    description?: string;
    verified: boolean;
    confidence: 'high' | 'medium' | 'low';
    issues?: string[];
    corrected?: boolean;
  }> = [];

  // Verify each batch
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    console.log(`[VerifyAndCorrect] Verifying batch ${batchIdx + 1}/${batches.length} (${batch.length} events)`);

    const verificationPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Verify the factual accuracy of these ${batch.length} events. For each event, determine:
1. Is the event factually accurate based on your knowledge?
2. Is the date (year/month/day) correct?
3. Is the event title accurate and verifiable?
4. Is the event description factually accurate? Check for:
   - Incorrect facts, dates, or details in the description
   - Unverified claims or speculation
   - Inconsistencies between the title and description
   - Hallucinated or made-up information
5. Are there any factual errors, inconsistencies, or unverified claims overall?

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
      "issues": ["Date may be incorrect", "Description contains unverified claims"]
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
  return `${idx}. ${dateStr}: ${e.title}${e.description ? `\n   Description: ${e.description}` : ''}`;
}).join('\n')}

CRITICAL VERIFICATION RULES:
- Mark as verified=false if you cannot confirm the event from reliable sources
- Mark confidence as "low" if dates or details are uncertain
- Mark confidence as "medium" if event is likely true but some details may be inaccurate
- Mark confidence as "high" only if you are certain the event is factually correct
- VERIFY THE DESCRIPTION: Check if the description contains accurate facts, correct dates, and verifiable information
- List specific issues (e.g., "Date appears incorrect", "Event title contains speculation", "Description contains unverified claims", "Description has factual errors", "Cannot verify this event occurred")
- Be conservative - when in doubt, flag the event`;

    try {
      const response = await createChatCompletion(client, {
        model: client.provider === 'kimi' ? 'kimi-k2-thinking' : 'gpt-4o-mini',
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

        // Process each event in the batch
        for (let idx = 0; idx < batch.length; idx++) {
          const event = batch[idx];
          const verification = verifications.find((v: any) => v.eventIndex === idx) || {
            verified: false,
            confidence: 'low' as const,
            issues: ['Verification failed'],
          };

          let correctedEvent = { ...event };
          let wasCorrected = false;

          // Auto-correct if low/medium confidence and autoCorrect is enabled
          if (autoCorrect && (!verification.verified || verification.confidence !== 'high') && verification.issues && verification.issues.length > 0) {
            console.log(`[VerifyAndCorrect] Auto-correcting event ${idx}: ${event.title} (confidence: ${verification.confidence})`);
            
            try {
              const correctionPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Correct the following event based on the identified issues. Generate a factually accurate version.

Original Event:
- Date: ${event.year || 'No date'}${event.month ? `/${event.month}` : ''}${event.day ? `/${event.day}` : ''}
- Title: ${event.title}
- Description: ${event.description || 'No description'}

Issues identified:
${verification.issues.map((issue: string, i: number) => `${i + 1}. ${issue}`).join('\n')}

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

              const correctionResponse = await createChatCompletion(client, {
                model: client.provider === 'kimi' ? 'kimi-k2-thinking' : 'gpt-4o-mini',
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

              if (correctionResponse.choices?.[0]?.message?.content) {
                const corrected = JSON.parse(correctionResponse.choices[0].message.content);
                correctedEvent = {
                  ...event,
                  title: corrected.title || event.title,
                  description: corrected.description || event.description,
                  year: corrected.year !== null && corrected.year !== undefined ? corrected.year : event.year,
                  month: corrected.month !== null && corrected.month !== undefined ? corrected.month : event.month,
                  day: corrected.day !== null && corrected.day !== undefined ? corrected.day : event.day,
                };
                wasCorrected = true;
                console.log(`[VerifyAndCorrect] Event corrected: ${event.title}`);
              }
            } catch (correctionError: any) {
              console.warn(`[VerifyAndCorrect] Correction failed for event ${idx}:`, correctionError.message);
              // Continue with original event if correction fails
            }
          }

          verifiedEvents.push({
            ...correctedEvent,
            verified: verification.verified !== false,
            confidence: verification.confidence || 'low',
            issues: verification.issues || [],
            corrected: wasCorrected,
          });
        }
      } else {
        // If verification fails, mark all as unverified
        batch.forEach((event) => {
          verifiedEvents.push({
            ...event,
            verified: false,
            confidence: 'low',
            issues: ['Verification system error'],
            corrected: false,
          });
        });
      }
    } catch (error: any) {
      console.error(`[VerifyAndCorrect] Error verifying batch ${batchIdx + 1}:`, error.message);
      // On error, mark all events in batch as unverified
      batch.forEach((event) => {
        verifiedEvents.push({
          ...event,
          verified: false,
          confidence: 'low',
          issues: ['Verification error'],
          corrected: false,
        });
      });
    }
  }

  // Calculate summary
  const summary = {
    total: verifiedEvents.length,
    verified: verifiedEvents.filter(e => e.verified).length,
    flagged: verifiedEvents.filter(e => !e.verified || e.confidence === 'low').length,
    corrected: verifiedEvents.filter(e => e.corrected).length,
    highConfidence: verifiedEvents.filter(e => e.confidence === 'high').length,
    mediumConfidence: verifiedEvents.filter(e => e.confidence === 'medium').length,
    lowConfidence: verifiedEvents.filter(e => e.confidence === 'low').length,
  };

  console.log('[VerifyAndCorrect] Verification complete:', summary);

  return { verifiedEvents, summary };
}

