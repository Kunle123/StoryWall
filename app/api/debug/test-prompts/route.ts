import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion, AIClientConfig } from '@/lib/ai/client';
import { getDebugLogger, resetDebugLogger } from '@/lib/utils/debugLogger';
import { loadUnifiedPrompts } from '@/lib/prompts/loader';

/**
 * Debug endpoint for testing prompt fidelity
 * Bypasses authentication - use only for debugging/testing
 */
export async function POST(request: NextRequest) {
  const debugLogger = resetDebugLogger(); // Start fresh for each request
  
  try {
    const body = await request.json();
    const { 
      step, // 'events' | 'descriptions' | 'images'
      timelineName,
      timelineDescription,
      events,
      maxEvents = 20,
      isFactual = true,
      isNumbered = false,
      numberLabel = "Day",
      sourceRestrictions,
      writingStyle = 'narrative',
      imageStyle,
      themeColor,
      includeDebugLog = true, // Always include debug log for this endpoint
    } = body;

    // Initialize debug logger
    debugLogger.init(timelineName, timelineDescription);
    debugLogger.logUserInput('Debug Test', {
      step,
      maxEvents,
      isFactual,
      isNumbered,
      writingStyle,
      imageStyle,
      themeColor,
    });

    if (step === 'events') {
      // Test event generation
      const client = getAIClient();
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      // Build prompts (simplified version from generate-events)
      const systemPrompt = isFactual
        ? `Generate accurate historical events based on the provided timeline description. Generate UP TO ${maxEvents} events, but ONLY if you can find that many UNIQUE, DISTINCT events. DO NOT fabricate events to reach ${maxEvents} - if fewer unique events exist, return only those.`
        : `You are a creative timeline event generator for fictional narratives. Generate up to ${maxEvents} engaging fictional events based on the provided timeline description.`;

      const userPrompt = `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}\n\nGenerate up to ${maxEvents} events. Return as JSON: { "events": [{ "year": 2020, "title": "Event title" }, ...] }`;

      debugLogger.logPrompt('Event Generation Test', systemPrompt, userPrompt, {
        maxEvents,
        isFactual,
        model: openaiApiKey ? 'gpt-4o-mini (Responses API)' : 'Chat Completions',
      });

      // Use Responses API if available, otherwise Chat Completions
      let contentText: string | null = null;
      if (isFactual && openaiApiKey) {
        try {
          const resp = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              input: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              tools: [{ type: 'web_search' }],
              max_output_tokens: Math.min(40000, (maxEvents * 1500) + 10000),
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (typeof data.output_text === 'string') {
              contentText = data.output_text;
            } else if (Array.isArray(data.output)) {
              for (const item of data.output) {
                if (item.type === 'message' && item.role === 'assistant') {
                  if (typeof item.content === 'string') {
                    contentText = item.content;
                    break;
                  } else if (Array.isArray(item.content)) {
                    const textPart = item.content.find((c: any) => typeof c.text === 'string');
                    if (textPart) {
                      contentText = textPart.text;
                      break;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('[Debug] Responses API failed, falling back to Chat Completions');
        }
      }

      if (!contentText) {
        const data = await createChatCompletion(client, {
          model: client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: Math.min(40000, (maxEvents * 2000) + 15000),
        });
        contentText = data.choices[0].message.content;
      }

      debugLogger.logAIResponse('Event Generation Test', contentText, {
        responseLength: contentText.length,
      });

      let parsedContent;
      try {
        parsedContent = JSON.parse(contentText);
      } catch (e) {
        parsedContent = { events: [], error: 'Failed to parse JSON' };
      }

      debugLogger.logSystemInfo('Event Generation Test - Results', {
        eventsGenerated: parsedContent.events?.length || 0,
        events: parsedContent.events || [],
      });

      return NextResponse.json({
        success: true,
        step: 'events',
        data: parsedContent,
        debugLog: debugLogger.getFormattedLog(),
      });

    } else if (step === 'descriptions') {
      // Test description generation
      if (!events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'Events array is required for description generation test' },
          { status: 400 }
        );
      }

      const client = getAIClient();
      const unifiedPrompts = loadUnifiedPrompts({
        timelineDescription,
        events: events.map((e: any) => ({ year: e.year, title: e.title })),
        writingStyle,
        imageStyle,
        themeColor,
        sourceRestrictions,
        imageContext: undefined,
        eventCount: events.length,
        canUseCelebrityLikeness: false,
        hasFactualDetails: false,
        anchorStylePreview: '',
        isSocialMedia: false,
      });

      const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
      const maxTokens = Math.min(
        client.provider === 'kimi' ? 32000 : 40000,
        2000 + (events.length * 400) + 300
      );

      debugLogger.logPrompt('Description Generation Test', unifiedPrompts.system, unifiedPrompts.user, {
        model: modelToUse,
        maxTokens,
        eventsCount: events.length,
      });

      const response = await createChatCompletion(client, {
        model: modelToUse,
        messages: [
          { role: 'system', content: unifiedPrompts.system },
          { role: 'user', content: unifiedPrompts.user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: maxTokens,
      });

      const rawResponse = response.choices[0].message.content;
      debugLogger.logAIResponse('Description Generation Test', rawResponse, {
        model: modelToUse,
        responseLength: rawResponse.length,
      });

      let parsedContent;
      try {
        parsedContent = JSON.parse(rawResponse);
      } catch (e) {
        parsedContent = { items: [], error: 'Failed to parse JSON' };
      }

      debugLogger.logSystemInfo('Description Generation Test - Results', {
        descriptionsGenerated: parsedContent.items?.length || 0,
        anchorStyle: parsedContent.anchorStyle ? parsedContent.anchorStyle.substring(0, 100) : null,
        items: parsedContent.items || [],
      });

      return NextResponse.json({
        success: true,
        step: 'descriptions',
        data: parsedContent,
        debugLog: debugLogger.getFormattedLog(),
      });

    } else if (step === 'images') {
      // Test image prompt generation
      if (!events || !Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'Events array is required for image generation test' },
          { status: 400 }
        );
      }

      // Log image prompts that would be generated
      debugLogger.logSystemInfo('Image Generation Test', {
        eventsCount: events.length,
        imageStyle,
        themeColor,
        events: events.map((e: any) => ({
          title: e.title,
          description: e.description,
          imagePrompt: e.imagePrompt,
        })),
      });

      return NextResponse.json({
        success: true,
        step: 'images',
        message: 'Image prompt generation would happen here. Check debug log for event details.',
        debugLog: debugLogger.getFormattedLog(),
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid step. Must be "events", "descriptions", or "images"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Debug Test] Error:', error);
    debugLogger.logSystemInfo('Error', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      debugLog: debugLogger.getFormattedLog(),
    }, { status: 500 });
  }
}

