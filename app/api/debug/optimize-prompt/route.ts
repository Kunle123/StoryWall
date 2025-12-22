import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';
import { getLatestPrompt, savePrompt, updatePrompt, getPrompt } from '@/lib/utils/promptStorage';

/**
 * AI-Powered Prompt Optimizer
 * Analyzes outputs and suggests prompt improvements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      step, // 'events' | 'descriptions' | 'images'
      currentSystemPrompt,
      currentUserPrompt,
      outputs, // The actual outputs from the generation
      debugLog, // Full debug log
      testResults, // Any test results or metrics
      optimizationGoal, // What to optimize for (e.g., "more diverse events", "better descriptions")
    } = body;

    if (!step || !currentSystemPrompt || !currentUserPrompt) {
      return NextResponse.json(
        { error: 'step, currentSystemPrompt, and currentUserPrompt are required' },
        { status: 400 }
      );
    }

    const client = getAIClient();
    const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';

    // Build analysis prompt for the AI optimizer
    const analysisPrompt = `You are an expert prompt engineer specializing in improving AI prompts for timeline generation.

CURRENT PROMPTS:
System Prompt:
${currentSystemPrompt}

User Prompt:
${currentUserPrompt}

OUTPUTS GENERATED:
${JSON.stringify(outputs, null, 2)}

${debugLog ? `DEBUG LOG (shows full generation process):\n${debugLog.substring(0, 5000)}...` : ''}

${testResults ? `TEST RESULTS:\n${JSON.stringify(testResults, null, 2)}` : ''}

${optimizationGoal ? `OPTIMIZATION GOAL: ${optimizationGoal}` : ''}

ANALYSIS TASK:
1. Analyze the outputs and identify issues or areas for improvement
2. Determine what changes to the prompts would improve the outputs
3. Provide specific, actionable improvements

Return a JSON object with:
{
  "analysis": "Detailed analysis of what's working and what's not",
  "issues": ["List of specific issues found in outputs"],
  "improvements": ["List of specific improvements to make"],
  "improvedSystemPrompt": "Improved system prompt (or null if no changes needed)",
  "improvedUserPrompt": "Improved user prompt (or null if no changes needed)",
  "reasoning": "Explanation of why these changes will improve outputs"
}`;

    const response = await createChatCompletion(client, {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: 'You are an expert prompt engineer. Analyze prompts and outputs, then suggest specific improvements. Return only valid JSON.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse AI analysis response', rawResponse: content },
        { status: 500 }
      );
    }

    // Save the improved prompts
    const promptId = savePrompt(
      step,
      analysis.improvedSystemPrompt || currentSystemPrompt,
      analysis.improvedUserPrompt || currentUserPrompt,
      {
        description: optimizationGoal || 'AI-optimized prompt',
        testResults,
        improvements: analysis.improvements,
      }
    );

    return NextResponse.json({
      success: true,
      analysis: {
        analysis: analysis.analysis,
        issues: analysis.issues,
        improvements: analysis.improvements,
        reasoning: analysis.reasoning,
      },
      improvedPrompts: {
        systemPrompt: analysis.improvedSystemPrompt || currentSystemPrompt,
        userPrompt: analysis.improvedUserPrompt || currentUserPrompt,
      },
      promptId, // ID to use in future tests
      originalPrompts: {
        systemPrompt: currentSystemPrompt,
        userPrompt: currentUserPrompt,
      },
    });

  } catch (error: any) {
    console.error('[Prompt Optimizer] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

