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
    const { timelineName, timelineDescription } = body;

    if (!timelineName || !timelineDescription) {
      return NextResponse.json(
        { error: 'Timeline name and description are required' },
        { status: 400 }
      );
    }

    const aiClient = getAIClient();

    const systemPrompt = `You are a statistics and data analysis expert. Your task is to suggest relevant metrics that should be tracked for a given statistical timeline.

Guidelines:
- Suggest 3-8 metrics that are relevant to the timeline topic
- Metrics should be measurable and trackable over time
- Use clear, concise names (e.g., "Conservative Party", "Labour Party", "EV Sales", "ICE Sales")
- If the topic involves categories that may change names over time (e.g., UKIP → Reform), suggest them as separate metrics
- Focus on the most important and relevant metrics for the topic
- Return ONLY a JSON array of metric names, no explanations

Example for "UK Political Party Polling":
["Conservative Party", "Labour Party", "Liberal Democrats", "Green Party", "Reform UK", "Scottish National Party"]

Example for "UK Car Production":
["Electric Vehicles (EVs)", "Internal Combustion Engine (ICE)", "Hybrid Vehicles", "Hydrogen Fuel Cell", "Other"]`;

    const userPrompt = `Timeline: "${timelineName}"
Description: ${timelineDescription}

Suggest relevant metrics to track for this statistical timeline. Return a JSON array of metric names (3-8 metrics).`;

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
    });
  } catch (error: any) {
    console.error('[Statistics Suggestions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

