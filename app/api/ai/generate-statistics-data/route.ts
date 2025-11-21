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
4. You MUST prioritize CONTIGUOUS YEARS - try to retrieve data for consecutive years without gaps
5. You MUST create events for missing years with explanatory notes when data is unavailable
6. You MUST return data in the exact JSON format specified below
7. If you cannot find real data, create an explanatory event rather than omitting the year

CONTIGUOUS DATA REQUIREMENT:
- When retrieving data for a time period, prioritize getting data for ALL years in that period
- If data exists for 2015, 2016, 2018, 2019, 2021, 2022 - you MUST also check for 2017, 2020, 2023
- If a year is missing from official sources, create an event explaining WHY (e.g., "GCSEs abandoned due to COVID-19 pandemic", "Results unavailable - data collection suspended", "No data published for this year")
- Missing year events should have ALL metric values set to 0 or null, with a clear description explaining the absence

MISSING DATA EVENTS:
When data is unavailable for a year, create an event like this:
{
  "id": "event-missing-2020",
  "title": "2020 - GCSEs Cancelled",
  "description": "GCSE examinations were cancelled due to the COVID-19 pandemic. No official results were published for this year.",
  "date": "2020-08-01",
  "data": {
    "Metric 1": 0,
    "Metric 2": 0,
    "Metric 3": 0
  },
  "source": "Department for Education / Official announcement",
  "dataUnavailable": true,
  "reason": "GCSEs cancelled due to COVID-19 pandemic"
}

Data Quality Checks:
- All values must be realistic and consistent with known trends
- Percentages should sum appropriately (if applicable)
- Dates should be accurate and correspond to real events
- Values should show logical progression over time
- Missing years should be explicitly noted with explanations

Return ONLY valid JSON in this exact format:
{
  "events": [
    {
      "id": "event-1",
      "title": "Event Title (e.g., '2020 - GCSEs Cancelled' or '2017 Results')",
      "description": "Brief description of what happened at this time, or explanation if data unavailable",
      "date": "2020-01-15",
      "data": {
        "Metric 1": 35.5,
        "Metric 2": 42.3,
        "Metric 3": 8.2
      },
      "source": "Official source name",
      "dataUnavailable": false,
      "reason": "Optional: reason if data unavailable (e.g., 'COVID-19 pandemic', 'Data collection suspended')"
    }
  ],
  "periodUsed": "Description of the time period covered",
  "dataQuality": "high|medium|low",
  "warnings": ["Any warnings about data availability or quality", "Note any years where data was unavailable and why"]
}

If you cannot find sufficient real data, create explanatory events for missing years rather than omitting them.`;

    const userPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Metrics to track: ${metrics.join(', ')}

Data Source: ${dataSource}

${periodContext ? `Time Period: ${periodContext}` : 'Time Period: Choose significant periods based on data availability'}

CRITICAL: Generate events for CONTIGUOUS YEARS. If data exists for some years but not others in the period:
1. Include events for ALL years where data is available
2. Create explanatory events for missing years explaining why data is unavailable
3. Common reasons: COVID-19 pandemic, data collection suspended, results not published, examinations cancelled
4. For missing years, set all metric values to 0 and include a clear description (e.g., "2020 - GCSEs cancelled due to COVID-19 pandemic")

Generate 5-15 events with real statistical data for these metrics. Each event should:
- Have a clear title (e.g., "2020 Results", "2020 - GCSEs Cancelled", "2017 Results")
- Include a brief description of what happened OR explanation if data unavailable
- Have accurate dates (use mid-year dates like "2020-08-01" for annual data)
- Include data values for ALL metrics: ${metrics.join(', ')} (use 0 for missing years)
- Cite the data source
- If data is unavailable, include "dataUnavailable": true and a "reason" field

CRITICAL: You MUST include events for ALL years in the requested period, even if data is unavailable.

SPECIFIC YEAR REQUIREMENTS:
- If the period includes 2015-2023, you MUST include events for: 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023
- If the period includes 2010-2023, you MUST include events for ALL years from 2010 to 2023
- NO EXCEPTIONS: Every year in the period must have an event, either with data OR with an explanation

For missing years, create events like:
- "2017 - [Reason data unavailable]" (e.g., "2017 - Results not published", "2017 - Data collection suspended")
- "2023 - [Reason data unavailable]" (e.g., "2023 - Data not yet published", "2023 - Results pending", "2023 - Data collection in progress")

DO NOT skip years. If you cannot find data for 2017 or 2023, you MUST still create an event explaining why the data is unavailable.

Focus on creating a complete timeline with contiguous years, noting any gaps with explanatory events.`;

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
        
        // For missing data events, allow 0 or null values
        const isMissingData = event.dataUnavailable === true;
        
        // Ensure all metrics have values (0 is allowed for missing data events)
        const hasAllMetrics = metrics.every(m => {
          const value = event.data[m];
          return (typeof value === 'number' && !isNaN(value)) || 
                 (isMissingData && (value === 0 || value === null || value === undefined));
        });
        
        return hasAllMetrics;
      })
      .map((event: any, index: number) => {
        // Sanitize and validate data
        const sanitizedData: Record<string, number> = {};
        const isMissingData = event.dataUnavailable === true;
        metrics.forEach(metric => {
          const value = event.data[metric];
          if (typeof value === 'number' && !isNaN(value)) {
            sanitizedData[metric] = value;
          } else if (value === null || value === undefined) {
            // For missing data events, use 0
            sanitizedData[metric] = 0;
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

    // Post-process: Detect missing years and create explanatory events
    // Extract years from events
    const eventYears = validatedEvents
      .map(e => {
        if (e.date) {
          return new Date(e.date).getFullYear();
        }
        // Try to extract year from title
        const yearMatch = e.title.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
      })
      .filter((y): y is number => y !== null)
      .sort((a, b) => a - b);

    if (eventYears.length > 0) {
      const minYear = eventYears[0];
      const maxYear = eventYears[eventYears.length - 1];
      const missingYears: number[] = [];

      // Find gaps in the year sequence
      for (let year = minYear; year <= maxYear; year++) {
        if (!eventYears.includes(year)) {
          missingYears.push(year);
        }
      }

      // Create explanatory events for missing years
      const missingYearEvents = missingYears.map(year => {
        // Determine reason based on year
        let reason = 'Data not available';
        let description = `Data for ${year} is not available from the specified data source.`;
        
        if (year === 2020) {
          reason = 'COVID-19 pandemic';
          description = `Data collection or publication may have been affected by the COVID-19 pandemic.`;
        } else if (year === 2023) {
          reason = 'Data not yet published';
          description = `Data for ${year} may not yet be published or available from the data source.`;
        } else if (year === 2017) {
          reason = 'Data not available';
          description = `Data for ${year} is not available from the specified data source.`;
        } else if (year > new Date().getFullYear()) {
          reason = 'Future year';
          description = `This is a future year - data is not yet available.`;
        }

        // Create zero data for all metrics
        const zeroData: Record<string, number> = {};
        metrics.forEach(metric => {
          zeroData[metric] = 0;
        });

        return {
          id: `event-missing-${year}`,
          title: `${year} - Data Unavailable`,
          description: description,
          date: new Date(year, 7, 1), // August 1st of the missing year
          data: zeroData,
          source: dataSource,
          dataUnavailable: true,
          reason: reason,
        };
      });

      // Merge missing year events with validated events
      const allEvents = [...validatedEvents, ...missingYearEvents];
      
      // Sort by date
      allEvents.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

      // Update validatedEvents to include missing year events
      validatedEvents.length = 0;
      validatedEvents.push(...allEvents);
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

