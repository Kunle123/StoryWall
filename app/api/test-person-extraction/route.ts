import { NextRequest, NextResponse } from 'next/server';

// Helper to extract famous person names from event text using OpenAI
async function extractPersonNamesFromEvent(event: { title: string; description?: string }): Promise<string[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('[Test] OPENAI_API_KEY not configured, skipping person extraction');
      return [];
    }

    const eventText = `${event.title}${event.description ? ' ' + event.description : ''}`.trim();
    if (!eventText || eventText.length < 10) {
      console.log(`[Test] Event text too short for extraction: "${eventText}"`);
      return [];
    }

    console.log(`[Test] Extracting person names from event - Title: "${event.title}", Description: "${event.description || 'none'}"`);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts person names (famous or notable) from event descriptions. Extract ALL person names mentioned in BOTH the title and description, including politicians, celebrities, public figures, and any named individuals. Pay special attention to the title as it often contains the main people involved. Return ONLY a JSON array of person names (full names when possible, or last names if that\'s how they\'re referred to). Example: ["Taylor Swift", "Kanye West"] or ["Zohran Mamdani", "Andrew Cuomo"] or []. If only a last name is mentioned (like "Cuomo"), include it as-is. Fix common typos (e.g., "mamdanis" -> "Mamdani").'
            },
            {
              role: 'user',
              content: `Extract all person names from this event:\nTitle: "${event.title}"\nDescription: "${event.description || 'none'}"\n\nReturn only a JSON array of names, nothing else. Include all named people mentioned in the title or description, even if only by last name.`
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Test] Failed to extract person names: ${response.status}`, errorText);
        return [];
      }

      const data = await response.json();
      console.log(`[Test] OpenAI response structure:`, JSON.stringify({
        model: data.model,
        usage: data.usage,
        choices_count: data.choices?.length,
        first_choice_finish_reason: data.choices?.[0]?.finish_reason,
      }, null, 2));
      
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log(`[Test] Raw OpenAI content:`, content);
      
      if (!content) {
        console.warn('[Test] No content in OpenAI response');
        return [];
      }

      // Parse JSON array
      try {
        const names = JSON.parse(content);
        console.log(`[Test] Parsed names array:`, names);
        if (Array.isArray(names)) {
          const filtered = names.filter((n: any) => typeof n === 'string' && n.length > 0);
          console.log(`[Test] Extracted ${filtered.length} person name(s) from event: ${filtered.join(', ')}`);
          return filtered;
        } else {
          console.warn('[Test] Parsed result is not an array:', typeof names);
        }
      } catch (parseError: any) {
        console.warn('[Test] Failed to parse person names JSON:', content);
        console.warn('[Test] Parse error:', parseError.message);
      }

      return [];
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('[Test] Timeout extracting person names (20s timeout)');
      } else {
        console.error('[Test] Error extracting person names:', error.message);
      }
      return [];
    }
  } catch (error: any) {
    console.error('[Test] Error in extractPersonNamesFromEvent:', error.message);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const names = await extractPersonNamesFromEvent({ title, description });
    
    return NextResponse.json({
      title,
      description,
      extractedNames: names,
      count: names.length
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract person names' },
      { status: 500 }
    );
  }
}

