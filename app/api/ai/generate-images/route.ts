import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate images for timeline events using AI
 * 
 * Request Body:
 * {
 *   events: Array<{ title: string, description: string }>
 *   imageStyle: string
 *   themeColor: string (hex color)
 * }
 * 
 * Response:
 * {
 *   images: Array<string> (URLs)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, imageStyle = 'photorealistic', themeColor = '#3B82F6' } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    const aiImageApiKey = process.env.OPENAI_API_KEY;
    
    if (!aiImageApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Please add it to your environment variables.' },
        { status: 500 }
      );
    }

    // Use OpenAI DALL-E 3 for image generation
    
    const images: string[] = [];
    
    // Generate images for each event using DALL-E 3
    for (const event of events) {
      try {
        // Build prompt with style, event details, and theme
        let prompt = `Create a ${imageStyle} style image representing: ${event.title}`;
        if (event.description) {
          prompt += `. ${event.description.substring(0, 150)}`;
        }
        // DALL-E 3 has a 400 character limit for prompts
        prompt = prompt.substring(0, 400);
        
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${aiImageApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          console.error(`OpenAI DALL-E API error for "${event.title}":`, errorData);
          throw new Error(`Failed to generate image: ${errorData.message || errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data[0] || !data.data[0].url) {
          throw new Error('Invalid image response format from OpenAI');
        }
        
        images.push(data.data[0].url);
      } catch (error: any) {
        console.error(`Error generating image for event "${event.title}":`, error);
        return NextResponse.json(
          { error: `Failed to generate image for "${event.title}"`, details: error.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}

