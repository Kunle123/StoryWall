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

    // TODO: Integrate with AI image generation service (OpenAI DALL-E, Stability AI, etc.)
    const aiImageApiKey = process.env.OPENAI_API_KEY || process.env.STABILITY_API_KEY;
    
    if (!aiImageApiKey) {
      // Return placeholder URLs for development
      console.warn('AI Image API key not set. Returning placeholder URLs.');
      return NextResponse.json({
        images: events.map(() => 
          `https://via.placeholder.com/800x600/${themeColor.slice(1)}/FFFFFF?text=AI+Image+Placeholder`
        ),
      });
    }

    // Determine which service to use
    const useOpenAI = !!process.env.OPENAI_API_KEY;
    
    const images: string[] = [];
    
    // Generate images for each event
    for (const event of events) {
      try {
        const prompt = `Create a ${imageStyle} style image representing: ${event.title}. ${event.description ? `Context: ${event.description.substring(0, 200)}` : ''} Theme color: ${themeColor}`;
        
        if (useOpenAI) {
          // OpenAI DALL-E 3
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: prompt.substring(0, 400), // DALL-E 3 has a 400 char limit
              n: 1,
              size: '1024x1024',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate image');
          }

          const data = await response.json();
          images.push(data.data[0].url);
        } else {
          // Stability AI or other service
          // Add implementation here based on your chosen service
          throw new Error('Image generation service not configured');
        }
      } catch (error: any) {
        console.error(`Error generating image for event "${event.title}":`, error);
        // Use placeholder if generation fails
        images.push(`https://via.placeholder.com/800x600/${themeColor.slice(1)}/FFFFFF?text=${encodeURIComponent(event.title)}`);
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

