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
        // Sanitize event title and description for DALL-E content policy
        const sanitizePrompt = (text: string) => {
          // Remove or replace potentially problematic terms
          return text
            .replace(/violence|war|battle|conflict|death|killing|attack/gi, 'historical event')
            .replace(/occupation|colonization|colonial/gi, 'settlement')
            .replace(/invasion|conquest/gi, 'arrival')
            .replace(/massacre|genocide|atrocity/gi, 'historical moment')
            .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters except basic punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        };

        // Build prompt with style, event details, and theme
        let title = sanitizePrompt(event.title);
        let description = event.description ? sanitizePrompt(event.description.substring(0, 150)) : '';
        
        // Create a safe, descriptive prompt
        let prompt = `Create a ${imageStyle} style historical illustration: ${title}`;
        if (description) {
          prompt += `. ${description}`;
        }
        
        // DALL-E 3 has a 400 character limit for prompts
        prompt = prompt.substring(0, 400);
        
        // Ensure prompt doesn't end with partial word
        const lastSpace = prompt.lastIndexOf(' ');
        if (lastSpace > 350) {
          prompt = prompt.substring(0, lastSpace);
        }
        
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
          
          // Check if it's a content policy error and try with simplified prompt
          const errorMsg = errorData.message || errorData.error?.message || errorText;
          if (errorMsg.includes('unable to process') || errorMsg.includes('content policy') || errorMsg.includes('safety')) {
            // Retry with a simplified, safer prompt
            console.log(`Retrying with simplified prompt for "${event.title}"`);
            const simplifiedPrompt = `Create a ${imageStyle} style historical illustration from ${event.year}: ${title.substring(0, 200)}`;
            
            const retryResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${aiImageApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: simplifiedPrompt.substring(0, 400),
                n: 1,
                size: '1024x1024',
                quality: 'standard',
              }),
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              if (retryData.data && retryData.data[0] && retryData.data[0].url) {
                images.push(retryData.data[0].url);
                continue; // Success, move to next event
              }
            }
            
            // If retry also failed, return a more helpful error
            throw new Error(`Unable to generate image: The prompt may contain content that violates OpenAI's content policy. Try simplifying the event title or description.`);
          }
          
          throw new Error(`Failed to generate image: ${errorMsg}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data[0] || !data.data[0].url) {
          throw new Error('Invalid image response format from OpenAI');
        }
        
        images.push(data.data[0].url);
      } catch (error: any) {
        console.error(`Error generating image for event "${event.title}":`, error);
        
        // Instead of failing the entire request, skip this image and continue
        // This allows partial success - some images generated even if others fail
        const errorMsg = error.message || 'Unknown error';
        
        // Try to extract year from event title for a very simple fallback prompt
        const yearMatch = event.title.match(/\b(17|18|19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : '';
        
        // Final attempt with minimal prompt
        if (errorMsg.includes('content policy') || errorMsg.includes('unable to process')) {
          try {
            const minimalPrompt = `Historical ${imageStyle} style illustration${year ? ` from ${year}` : ''}`;
            
            const finalRetry = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${aiImageApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: minimalPrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
              }),
            });

            if (finalRetry.ok) {
              const finalData = await finalRetry.json();
              if (finalData.data && finalData.data[0] && finalData.data[0].url) {
                images.push(finalData.data[0].url);
                continue;
              }
            }
          } catch (retryError) {
            // If final retry fails, skip this image
          }
        }
        
        // If all retries failed, push null to maintain array index alignment
        // Frontend should handle missing images gracefully
        images.push(null as any);
        console.warn(`Skipping image generation for "${event.title}" due to error: ${errorMsg}`);
      }
    }
    
    // Filter out null values and check if we have any successful images
    const successfulImages = images.filter(img => img !== null);
    
    if (successfulImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images. Some prompts may violate OpenAI content policy.', details: 'Please try with different event titles or descriptions.' },
        { status: 500 }
      );
    }
    
    // Return all images (including nulls for failed ones) so frontend can handle gracefully
    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}

