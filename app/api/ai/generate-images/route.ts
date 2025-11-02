import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate images for timeline events using Flux (via Replicate)
 * 
 * Request Body:
 * {
 *   events: Array<{ title: string, description: string, year?: number, imagePrompt?: string }>
 *   imageStyle: string
 *   themeColor: string (hex color)
 * }
 * 
 * Response:
 * {
 *   images: Array<string> (URLs)
 * }
 */

// Style-specific visual language for cohesion
const STYLE_VISUAL_LANGUAGE: Record<string, string> = {
  'Photorealistic': 'highly detailed, realistic photography, natural lighting, sharp focus, professional composition, cinematic atmosphere',
  'Illustration': 'hand-drawn illustration style, detailed linework, rich textures, artistic composition, storybook aesthetic',
  'Minimalist': 'clean minimal design, simple geometric shapes, bold colors, negative space, modern aesthetic, flat design',
  'Vintage': 'retro aesthetic, aged paper texture, muted color palette, vintage poster style, nostalgic atmosphere, period-appropriate styling',
  'Watercolor': 'soft watercolor painting, fluid brushstrokes, translucent colors, artistic blending, ethereal quality, delicate details',
  '3D Render': '3D rendered style, dimensional depth, realistic lighting, volumetric shadows, modern digital art, polished finish',
  'Sketch': 'pencil sketch style, loose linework, crosshatching details, artistic drawing, hand-illustrated, expressive strokes',
  'Abstract': 'abstract art style, geometric forms, expressive colors, artistic interpretation, conceptual visualization, modern art aesthetic',
};

// Color name mapping for better prompt integration
const COLOR_NAMES: Record<string, string> = {
  '#A855F7': 'vibrant purple',
  '#10B981': 'emerald green',
  '#F97316': 'warm orange',
  '#EF4444': 'crimson red',
  '#EC4899': 'vivid pink',
  '#EAB308': 'golden yellow',
  '#3B82F6': 'bright blue',
  '#14B8A6': 'teal',
};

// Flux model on Replicate
// Using flux-dev - better prompt adherence for historical content
const FLUX_MODEL_NAME = "black-forest-labs/flux-dev";

// Helper to get latest version of a model
async function getLatestModelVersion(modelName: string, replicateApiKey: string): Promise<string> {
  try {
    const response = await fetch(`https://api.replicate.com/v1/models/${modelName}/versions`, {
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If version listing fails, try using model name directly
      // Replicate might auto-resolve in some cases
      console.warn(`[Flux] Could not fetch model versions, will try using model name directly`);
      return modelName;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return the latest version (first in results)
      return data.results[0].id;
    }

    // Fallback to model name
    return modelName;
  } catch (error) {
    console.warn(`[Flux] Error fetching model version: ${error}. Using model name directly.`);
    return modelName;
  }
}

// Build enhanced image prompt with style, color, and cohesion
function buildImagePrompt(
  event: { title: string; description?: string; year?: number; imagePrompt?: string },
  imageStyle: string,
  themeColor: string,
  styleVisualLanguage: string
): string {
  const colorName = COLOR_NAMES[themeColor] || 'thematic color';
  
  // Start with AI-generated prompt if available (from description step)
  let prompt = '';
  
  if (event.imagePrompt && event.imagePrompt.trim()) {
    // Use AI-generated prompt as base, but enhance it
    prompt = event.imagePrompt;
    
    // Ensure it includes style and color context if not already present
    if (!prompt.toLowerCase().includes(imageStyle.toLowerCase())) {
      prompt = `${imageStyle} style illustration: ${prompt}`;
    }
  } else {
    // Build from scratch if no AI prompt available
    const yearContext = event.year ? ` from ${event.year}` : '';
    const title = event.title;
    const description = event.description ? `. ${event.description.substring(0, 150)}` : '';
    
    prompt = `${imageStyle} style historical illustration${yearContext}: ${title}${description}`;
  }
  
  // Add prominent color integration
  const colorInstructions = [
    `dominant ${colorName} color palette`,
    `${colorName} as primary visual element`,
    `${colorName} lighting and atmosphere`,
    `${colorName} accents throughout composition`,
    `color harmony featuring ${colorName} prominently`
  ];
  
  // Select 2-3 color instructions for variety
  const selectedColorInstructions = colorInstructions.slice(0, 3).join(', ');
  prompt += `. ${selectedColorInstructions}`;
  
  // Add style-specific visual language for cohesion
  prompt += `. ${styleVisualLanguage}`;
  
  // Add historical period context if year is available
  if (event.year) {
    const century = Math.floor(event.year / 100) + 1;
    prompt += `. Period-accurate historical detail, ${century}th century setting`;
  }
  
  // Ensure consistent composition guidance
  prompt += `. Balanced composition, centered focal point, timeline-appropriate visual narrative`;
  
  // Flux handles longer prompts well, but keep it reasonable
  return prompt.substring(0, 900);
}

// Helper to wait for Replicate prediction to complete
async function waitForPrediction(predictionId: string, replicateApiKey: string): Promise<string | null> {
  const maxAttempts = 120; // 5 minutes max (120 * 2.5 seconds)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = await response.json();

    if (prediction.status === 'succeeded') {
      return prediction.output?.[0] || null;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || 'Prediction failed');
    }

    // Wait 2.5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2500));
    attempts++;
  }

  throw new Error('Prediction timeout - image generation took too long');
}

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

    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateApiKey) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN is not configured. Please add it to your environment variables.' },
        { status: 500 }
      );
    }

    // Get the latest Flux model version
    const fluxVersion = await getLatestModelVersion(FLUX_MODEL_NAME, replicateApiKey);
    console.log(`[Flux] Using model version: ${fluxVersion}`);

    // Get style-specific visual language for cohesion
    const styleVisualLanguage = STYLE_VISUAL_LANGUAGE[imageStyle] || STYLE_VISUAL_LANGUAGE['Illustration'];
    
    // Use Flux via Replicate for image generation
    const images: string[] = [];
    
    // Generate images for each event using Flux
    for (const event of events) {
      try {
        // Build enhanced prompt with AI-generated prompt (if available), style, color, and cohesion
        const prompt = buildImagePrompt(event, imageStyle, themeColor, styleVisualLanguage);
        
        // Log the prompt being sent (for debugging)
        console.log(`[Flux] Generating image for "${event.title}"`);
        console.log(`[Flux] Using AI prompt: ${!!event.imagePrompt}`);
        console.log(`[Flux] Prompt (${prompt.length} chars):`, prompt);
        console.log(`[Flux] Style: ${imageStyle}, Theme color: ${themeColor}`);

        // Create prediction via Replicate
        // Note: Replicate API format uses 'version' field with model identifier
        // For flux-dev, we need to get the latest version hash or use the model directly
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: fluxVersion, // Use the resolved version hash
            input: {
              prompt: prompt,
              aspect_ratio: '1:1', // Square images for timeline (1024x1024)
              output_format: 'png',
              output_quality: 90,
            },
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { detail: errorText };
          }
          
          // Provide helpful error message
          const errorMsg = errorData.detail || errorData.message || errorText;
          console.error(`[Flux] Replicate API error for "${event.title}":`, errorMsg);
          
          // If version format is wrong, provide helpful hint
          if (errorMsg.includes('version') || errorMsg.includes('model')) {
            throw new Error(`Replicate API error: ${errorMsg}. Make sure REPLICATE_API_TOKEN is valid and Flux model is accessible.`);
          }
          
          throw new Error(`Replicate API error: ${errorMsg}`);
        }

        const prediction = await createResponse.json();
        
        if (!prediction.id) {
          throw new Error('No prediction ID returned from Replicate');
        }

        // Wait for prediction to complete
        const imageUrl = await waitForPrediction(prediction.id, replicateApiKey);
        
        if (!imageUrl) {
          throw new Error('No image URL returned from prediction');
        }

        images.push(imageUrl);
        console.log(`[Flux] Successfully generated image for "${event.title}"`);
        
      } catch (error: any) {
        console.error(`[Flux] Error generating image for event "${event.title}":`, error);
        
        // Push null for failed images to maintain array index alignment
        // Frontend should handle missing images gracefully
        images.push(null as any);
        console.warn(`[Flux] Skipping image generation for "${event.title}" due to error: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Filter out null values and check if we have any successful images
    const successfulImages = images.filter(img => img !== null);
    
    if (successfulImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images. Please check your REPLICATE_API_TOKEN and try again.', details: 'Make sure you have a valid Replicate API token and sufficient credits.' },
        { status: 500 }
      );
    }
    
    // Log summary
    console.log(`[Flux] Generated ${successfulImages.length} of ${events.length} images successfully`);
    
    // Return all images (including nulls for failed ones) so frontend can handle gracefully
    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[Flux] Error generating images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}
