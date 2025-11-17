import { NextRequest, NextResponse } from 'next/server';
import { getAIClient, createChatCompletion } from '@/lib/ai/client';
import { loadPrompt } from '@/lib/prompts/loader';

/**
 * Generate timeline description suggestions based on subject name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectName } = body;
    
    if (!subjectName || typeof subjectName !== 'string' || subjectName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Subject name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Get AI client
    let client;
    try {
      client = getAIClient();
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'AI provider not configured' },
        { status: 500 }
      );
    }

    // Load prompts
    const systemPrompt = loadPrompt('timeline-suggestions/system.txt');
    const userPrompt = loadPrompt('timeline-suggestions/user.txt', {
      subjectName: subjectName.trim(),
    });

    // Generate suggestions
    const modelToUse = client.provider === 'kimi' ? 'kimi-k2-turbo-preview' : 'gpt-4o-mini';
    
    const response = await createChatCompletion(client, {
      model: modelToUse,
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
      temperature: 0.8, // Higher temperature for more creative suggestions
      max_tokens: 1000,
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('No response from AI');
    }

    // Parse response - the AI should return a JSON object with a suggestions array
    let suggestions: string[] = [];
    try {
      const content = JSON.parse(response.choices[0].message.content);
      
      // Handle different possible response formats
      if (Array.isArray(content)) {
        suggestions = content;
      } else if (Array.isArray(content.suggestions)) {
        suggestions = content.suggestions;
      } else if (Array.isArray(content.descriptions)) {
        suggestions = content.descriptions;
      } else {
        // Try to extract array from any key
        const keys = Object.keys(content);
        for (const key of keys) {
          if (Array.isArray(content[key])) {
            suggestions = content[key];
            break;
          }
        }
      }
      
      // Validate we got suggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        console.warn('[SuggestTimelineDescriptions] Unexpected response format:', content);
        // Fallback: try to parse as comma-separated or newline-separated
        const text = response.choices[0].message.content;
        suggestions = text
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(s => s.length > 10 && s.length < 500)
          .slice(0, 5);
      }
    } catch (parseError: any) {
      console.error('[SuggestTimelineDescriptions] JSON parse error:', parseError);
      // Fallback: try to extract suggestions from plain text
      const text = response.choices[0].message.content;
      suggestions = text
        .split(/[,\n]/)
        .map(s => s.trim().replace(/^[-•*]\s*/, '').replace(/^"\s*|\s*"$/g, ''))
        .filter(s => s.length > 10 && s.length < 500)
        .slice(0, 5);
    }

    // Ensure we have at least 3 suggestions, pad with defaults if needed
    if (suggestions.length < 3) {
      const defaults = [
        `A biographical timeline of the key moments and milestones in ${subjectName}'s life and career.`,
        `An overview of ${subjectName}'s major achievements and significant events.`,
        `A critical analysis of ${subjectName}'s impact and influence.`,
      ];
      suggestions = [...suggestions, ...defaults.slice(0, 3 - suggestions.length)];
    }

    // Limit to 5 suggestions
    suggestions = suggestions.slice(0, 5);

    return NextResponse.json({
      suggestions,
    });
  } catch (error: any) {
    console.error('[SuggestTimelineDescriptions] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

