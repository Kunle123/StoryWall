import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getAIClient } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
    
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

Guidelines:
- Suggest 3-8 metrics that are relevant to what the user wants to measure
- Metrics should be measurable and trackable over time
- Use clear, concise names (e.g., "Conservative Party", "Labour Party", "Violent Crime", "Theft", "Car Crime")
- If the topic involves categories that may change names over time (e.g., UKIP → Reform), suggest them as separate metrics
- Focus on the most important and relevant metrics
- Identify official data sources (e.g., "Office for National Statistics", "UK Parliament", "Police.uk", "NHS Digital")
- Return JSON with "metrics" array and "dataSource" string

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

Analyze this request and suggest:
1. Relevant metrics to track (3-8 metrics)
2. Available data sources

Return JSON with "metrics" array and "dataSource" string.`;

    const response = await aiClient.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract array if wrapped in object
      const arrayMatch = content.match(/\[.*\]/s);
      if (arrayMatch) {
        parsed = { metrics: JSON.parse(arrayMatch[0]) };
      } else {
        throw new Error('Invalid JSON response');
      }
    }

    // Ensure we have a metrics array
    const metrics = parsed.metrics || parsed.metric || (Array.isArray(parsed) ? parsed : []);
    const dataSource = parsed.dataSource || parsed.data_source || '';

    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new Error('No metrics found in response');
    }

    // Validate and clean metrics
    const validMetrics = metrics
      .filter((m: any) => typeof m === 'string' && m.trim().length > 0)
      .map((m: string) => m.trim())
      .slice(0, 8); // Limit to 8

    return NextResponse.json({
      metrics: validMetrics,
      dataSource: typeof dataSource === 'string' ? dataSource.trim() : '',
    });
  } catch (error: any) {
    console.error('[Statistics Suggestions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

