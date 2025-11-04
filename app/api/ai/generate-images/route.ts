import { NextRequest, NextResponse } from 'next/server';
import { containsFamousPerson, makePromptSafeForFamousPeople, getSafeStyleForFamousPeople } from '@/lib/utils/famousPeopleHandler';

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
// Using flux-schnell - much cheaper ($0.003 vs $0.025 per image) and faster
// Still high quality, just optimized for speed and cost
const FLUX_MODEL_NAME = "black-forest-labs/flux-schnell";

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
    
    // Check for famous people and make safe
    if (containsFamousPerson(prompt) || containsFamousPerson(event.title)) {
      prompt = makePromptSafeForFamousPeople(prompt, imageStyle);
      // Use safer style for famous people
      const safeStyle = getSafeStyleForFamousPeople(imageStyle);
      if (safeStyle !== imageStyle && !prompt.toLowerCase().includes(safeStyle.toLowerCase())) {
        prompt = `${safeStyle} style: ${prompt}`;
      }
    }
    
    // Ensure it includes style and color context if not already present
    if (!prompt.toLowerCase().includes(imageStyle.toLowerCase())) {
      prompt = `${imageStyle} style illustration: ${prompt}`;
    }
  } else {
    // Build from scratch if no AI prompt available
    const yearContext = event.year ? ` from ${event.year}` : '';
    const title = event.title;
    const description = event.description ? `. ${event.description.substring(0, 150)}` : '';
    
    let basePrompt = `${imageStyle} style historical illustration${yearContext}: ${title}${description}`;
    
    // Check for famous people and make safe
    if (containsFamousPerson(title) || containsFamousPerson(description)) {
      basePrompt = makePromptSafeForFamousPeople(basePrompt, imageStyle);
      const safeStyle = getSafeStyleForFamousPeople(imageStyle);
      if (safeStyle !== imageStyle) {
        basePrompt = basePrompt.replace(new RegExp(imageStyle, 'gi'), safeStyle);
      }
    }
    
    prompt = basePrompt;
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
    
    // PARALLEL GENERATION: Start all predictions at once for faster processing
    console.log(`[Flux] Starting parallel generation for ${events.length} images...`);
    
    // Step 1: Create all predictions in parallel
    const predictionPromises = events.map(async (event, index) => {
      try {
        // Build enhanced prompt with AI-generated prompt (if available), style, color, and cohesion
        const prompt = buildImagePrompt(event, imageStyle, themeColor, styleVisualLanguage);
        
        // Log the prompt being sent (for debugging)
        console.log(`[Flux] Creating prediction ${index + 1}/${events.length} for "${event.title}"`);
        
        // Create prediction via Replicate
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: fluxVersion,
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
          
          const errorMsg = errorData.detail || errorData.message || errorText;
          console.error(`[Flux] Replicate API error for "${event.title}":`, errorMsg);
          
          return { index, error: new Error(`Replicate API error: ${errorMsg}`), event };
        }

        const prediction = await createResponse.json();
        
        if (!prediction.id) {
          return { index, error: new Error('No prediction ID returned from Replicate'), event };
        }

        return { index, predictionId: prediction.id, event };
      } catch (error: any) {
        console.error(`[Flux] Error creating prediction for "${event.title}":`, error);
        return { index, error, event };
      }
    });

    // Wait for all predictions to be created
    const predictionResults = await Promise.all(predictionPromises);
    console.log(`[Flux] Created ${predictionResults.filter(r => r.predictionId).length}/${events.length} predictions successfully`);
    
    // Step 2: Poll all predictions in parallel
    const imagePromises = predictionResults.map(async (result) => {
      if (result.error || !result.predictionId) {
        return { index: result.index, imageUrl: null, error: result.error };
      }

      try {
        const imageUrl = await waitForPrediction(result.predictionId, replicateApiKey);
        console.log(`[Flux] Completed image ${result.index + 1}/${events.length} for "${result.event.title}"`);
        return { index: result.index, imageUrl, error: null };
      } catch (error: any) {
        console.error(`[Flux] Error waiting for prediction "${result.event.title}":`, error);
        return { index: result.index, imageUrl: null, error };
      }
    });

    // Wait for all images to complete
    const imageResults = await Promise.all(imagePromises);
    
    // Step 3: Assemble results in correct order
    const images: (string | null)[] = new Array(events.length).fill(null);
    imageResults.forEach((result) => {
      images[result.index] = result.imageUrl;
    });
    
    const successfulCount = images.filter(img => img !== null).length;
    console.log(`[Flux] Parallel generation complete: ${successfulCount}/${events.length} images generated`);
    
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
