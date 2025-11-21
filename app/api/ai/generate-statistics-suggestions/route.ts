import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { measurementQuestion, timelineName, timelineDescription } = body;

    // Support both new question-based format and legacy format
    const question = measurementQuestion || (timelineName && timelineDescription ? `${timelineName}: ${timelineDescription}` : null);

    if (!question) {
      return NextResponse.json(
        { error: 'Measurement question is required' },
        { status: 400 }
      );
    }

    const aiClient = getAIClient();

    const systemPrompt = `You are a statistics and data analysis expert. Your task is to analyze what a user wants to measure and suggest:
1. Relevant metrics that should be tracked
2. Available data sources for this topic

CRITICAL: You MUST return ONLY valid JSON in this exact format:
{
  "metrics": ["Metric 1", "Metric 2", "Metric 3", ...],
  "dataSource": "Data Source Name"
}

Guidelines:
- Suggest 3-8 metrics that are relevant to what the user wants to measure
- Metrics should be measurable and trackable over time
- Use clear, concise names (e.g., "Conservative Party", "Labour Party", "Violent Crime", "Theft", "Car Crime")
- If the topic involves categories that may change names over time (e.g., UKIP → Reform), suggest them as separate metrics
- Focus on the most important and relevant metrics
- Identify official data sources (e.g., "Office for National Statistics", "UK Parliament", "Police.uk", "NHS Digital")
- The "metrics" field MUST be an array of strings
- The "dataSource" field MUST be a string
- Do NOT include any explanatory text, comments, or markdown formatting
- Start your response with { and end with }

Example for "Crime in West Midlands":
{
  "metrics": ["Violent Crime", "Theft", "Car Crime", "Burglary", "Drug Offences", "Public Order Offences"],
  "dataSource": "Police.uk - Crime Statistics"
}

Example for "UK Political Party Polling":
{
  "metrics": ["Conservative Party", "Labour Party", "Liberal Democrats", "Green Party", "Reform UK", "Scottish National Party"],
  "dataSource": "YouGov / Ipsos MORI / Office for National Statistics"
}`;

    const userPrompt = `What the user wants to measure: "${question}"

Analyze this request and return ONLY a JSON object with this exact structure:
{
  "metrics": ["Metric 1", "Metric 2", "Metric 3", ...],
  "dataSource": "Data Source Name"
}

Requirements:
- "metrics" must be an array of 3-8 strings
- "dataSource" must be a string
- Return ONLY the JSON object, no other text`;

    const response = await createChatCompletion(aiClient, {
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from AI');
    }

    // Remove markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Remove trailing commas before } or ]
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('[Statistics Suggestions] JSON parse error:', {
        error: parseError.message,
        contentPreview: jsonText.substring(0, 200),
      });
      
      // Try to extract JSON object from text
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

    // Validate structure - must have metrics array and dataSource string
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }

    // Extract metrics - try multiple possible keys
    let metrics = parsed.metrics || parsed.metric || parsed.metricNames || [];
    
    // If metrics is not an array, try to find an array in the object
    if (!Array.isArray(metrics)) {
      const arrayKeys = Object.keys(parsed).filter(key => Array.isArray(parsed[key]));
      if (arrayKeys.length > 0) {
        metrics = parsed[arrayKeys[0]];
      } else {
        throw new Error('No metrics array found in response. Expected format: { "metrics": [...], "dataSource": "..." }');
      }
    }

    // Extract dataSource - try multiple possible keys
    let dataSource = parsed.dataSource || parsed.data_source || parsed.source || parsed.dataSourceName || '';

    // Validate metrics array
    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new Error('Metrics array is empty or invalid. Expected at least 3 metrics.');
    }

    if (metrics.length < 3) {
      console.warn(`[Statistics Suggestions] Only ${metrics.length} metrics found, expected at least 3`);
    }

    // Validate and clean metrics
    const validMetrics = metrics
      .filter((m: any) => typeof m === 'string' && m.trim().length > 0)
      .map((m: string) => m.trim())
      .slice(0, 8); // Limit to 8

    if (validMetrics.length === 0) {
      throw new Error('No valid metrics found after validation. All metrics must be non-empty strings.');
    }

    // Validate dataSource
    if (typeof dataSource !== 'string') {
      dataSource = '';
    }
    const validDataSource = dataSource.trim();

    // Return validated response
    return NextResponse.json({
      metrics: validMetrics,
      dataSource: validDataSource,
    });
  } catch (error: any) {
    console.error('[Statistics Suggestions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

