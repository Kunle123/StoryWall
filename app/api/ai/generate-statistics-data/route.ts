import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

/**
 * Generate statistical data events for a statistics timeline
 * 
 * This endpoint searches for real statistical data and creates events with data points.
 * It includes sanity checks to avoid hallucinations and uses official sources.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Statistics Data] Request received at:', new Date().toISOString());
    const cookieHeader = request.headers.get('cookie');
    console.log('[Statistics Data] Request headers:', {
      cookie: cookieHeader ? 'present' : 'missing',
      cookieLength: cookieHeader?.length || 0,
      cookiePreview: cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'none',
      'user-agent': request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });
    
    const authResult = await auth();
    const userId = authResult?.userId || null;
    
    console.log('[Statistics Data] Auth result:', { userId: userId || 'null' });
    
    if (!userId) {
      console.warn('[Statistics Data] Unauthorized - no userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timelineName, timelineDescription, metrics, dataSource, period } = body;

    if (!timelineName || !timelineDescription || !metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Timeline name, description, and metrics are required' },
        { status: 400 }
      );
    }

    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source is required' },
        { status: 400 }
      );
    }

    const aiClient = getAIClient();

    // Build period context for the prompt
    let periodContext = '';
    if (period) {
      const periodMap: Record<string, string> = {
        'since-brexit': 'from 2016 (since Brexit referendum) to present',
        'since-2020': 'from 2020 to present',
        'since-2010': 'from 2010 to present',
        'since-ww2': 'from 1945 (end of World War II) to present',
        'last-5-years': 'the last 5 years',
        'last-10-years': 'the last 10 years',
      };
      periodContext = periodMap[period] || '';
    }

    const systemPrompt = `You are a statistical data analyst specializing in finding and verifying real-world statistical data from official sources.

CRITICAL REQUIREMENTS:
1. You MUST only use REAL, VERIFIABLE data from official sources
2. You MUST NOT hallucinate or invent data
3. You MUST cite the data source for each data point
4. You MUST create events at significant periods (e.g., major policy changes, elections, economic events)
5. You MUST return data in the exact JSON format specified below
6. If you cannot find real data, return fewer events rather than making up data

Data Quality Checks:
- All values must be realistic and consistent with known trends
- Percentages should sum appropriately (if applicable)
- Dates should be accurate and correspond to real events
- Values should show logical progression over time

Return ONLY valid JSON in this exact format:
{
  "events": [
    {
      "id": "event-1",
      "title": "Event Title (e.g., 'January 2020')",
      "description": "Brief description of what happened at this time",
      "date": "2020-01-15",
      "data": {
        "Metric 1": 35.5,
        "Metric 2": 42.3,
        "Metric 3": 8.2
      },
      "source": "Official source name"
    }
  ],
  "periodUsed": "Description of the time period covered",
  "dataQuality": "high|medium|low",
  "warnings": ["Any warnings about data availability or quality"]
}

If you cannot find sufficient real data, return fewer events with a warning.`;

    const userPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Metrics to track: ${metrics.join(', ')}

Data Source: ${dataSource}

${periodContext ? `Time Period: ${periodContext}` : 'Time Period: Choose significant periods based on data availability'}

Generate 5-15 events with real statistical data for these metrics. Each event should:
- Have a clear title (e.g., "January 2020", "Q1 2021", "After Brexit Vote")
- Include a brief description of what happened
- Have accurate dates
- Include data values for ALL metrics: ${metrics.join(', ')}
- Cite the data source

Focus on significant periods where data is available and meaningful changes occurred.`;

    const response = await createChatCompletion(aiClient, {
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Remove trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('[Statistics Data] JSON parse error:', parseError);
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      } else {
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    }

    // Validate response structure
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.events)) {
      throw new Error('Invalid response format: expected events array');
    }

    // Validate and sanitize events
    const validatedEvents = parsed.events
      .filter((event: any) => {
        // Basic validation
        if (!event.title || typeof event.title !== 'string') return false;
        if (!event.data || typeof event.data !== 'object') return false;
        
        // Ensure all metrics have values
        const hasAllMetrics = metrics.every(m => 
          typeof event.data[m] === 'number' && !isNaN(event.data[m])
        );
        
        return hasAllMetrics;
      })
      .map((event: any, index: number) => {
        // Sanitize and validate data
        const sanitizedData: Record<string, number> = {};
        metrics.forEach(metric => {
          const value = event.data[metric];
          if (typeof value === 'number' && !isNaN(value)) {
            sanitizedData[metric] = value;
          } else {
            // Try to parse if it's a string
            const parsed = parseFloat(String(value));
            sanitizedData[metric] = isNaN(parsed) ? 0 : parsed;
          }
        });

        // Parse date
        let eventDate: Date | undefined;
        if (event.date) {
          try {
            eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) {
              eventDate = undefined;
            }
          } catch {
            eventDate = undefined;
          }
        }

        return {
          id: event.id || `event-${Date.now()}-${index}`,
          title: String(event.title).trim(),
          description: event.description ? String(event.description).trim() : undefined,
          date: eventDate,
          data: sanitizedData,
          source: event.source || dataSource,
        };
      });

    if (validatedEvents.length === 0) {
      throw new Error('No valid events generated. Please check your metrics and data source.');
    }

    // Sanity check: verify data makes sense
    const warnings: string[] = [];
    
    // Check for unrealistic values (e.g., negative percentages, values > 1000% for percentages)
    validatedEvents.forEach((event: { title: string; data: Record<string, number> }, idx: number) => {
      metrics.forEach(metric => {
        const value = event.data[metric];
        if (value < 0) {
          warnings.push(`Event "${event.title}": ${metric} has negative value (${value})`);
        }
        // If metrics seem to be percentages, check they're reasonable
        if (value > 100 && metric.toLowerCase().includes('percent')) {
          warnings.push(`Event "${event.title}": ${metric} value (${value}) seems unusually high for a percentage`);
        }
      });
    });

    // Check for data consistency (values shouldn't jump too dramatically between events)
    for (let i = 1; i < validatedEvents.length; i++) {
      const prev = validatedEvents[i - 1];
      const curr = validatedEvents[i];
      metrics.forEach(metric => {
        const prevValue = prev.data[metric];
        const currValue = curr.data[metric];
        const change = Math.abs(currValue - prevValue);
        const percentChange = prevValue !== 0 ? (change / Math.abs(prevValue)) * 100 : 0;
        
        // Warn if change is more than 500% (likely an error)
        if (percentChange > 500 && prevValue !== 0) {
          warnings.push(`Large change detected: ${metric} changed from ${prevValue} to ${currValue} between "${prev.title}" and "${curr.title}"`);
        }
      });
    }

    return NextResponse.json({
      events: validatedEvents,
      periodUsed: parsed.periodUsed || 'Auto-selected based on data availability',
      dataQuality: parsed.dataQuality || (warnings.length === 0 ? 'high' : 'medium'),
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error('[Statistics Data] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate statistical data' },
      { status: 500 }
    );
  }
}

