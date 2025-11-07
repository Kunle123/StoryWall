import { NextRequest, NextResponse } from 'next/server';
import { containsFamousPerson, makePromptSafeForFamousPeople, getSafeStyleForFamousPeople } from '@/lib/utils/famousPeopleHandler';
import { persistImagesToCloudinary } from '@/lib/utils/imagePersistence';
import { generateImageWithImagen, isGoogleCloudConfigured } from '@/lib/google/imagen';

/**
 * Generate images for timeline events using style-appropriate models (via Replicate)
 * - Photorealistic styles: Flux Pro (best quality) or SDXL (cost-effective)
 * - Artistic styles: SDXL (excellent for illustrations, watercolor, etc.)
 * Supports image-to-image generation with reference images (SDXL)
 * 
 * Request Body:
 * {
 *   events: Array<{ title: string, description: string, year?: number, imagePrompt?: string }>
 *   imageStyle: string
 *   themeColor: string (hex color)
 *   imageReferences?: Array<{ name: string, url: string }>
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

// Model selection based on image style
// Photorealistic styles use models optimized for realism
// Artistic styles use models optimized for creative/artistic output

// Models available on Replicate
const MODELS = {
  // Photorealistic models (best for realistic photos)
  // Google Imagen 4 Fast: Best quality/price ratio ($0.02/image) - requires Google Cloud setup
  PHOTOREALISTIC: "google-imagen-4-fast", // $0.02/image - excellent quality, best price
  PHOTOREALISTIC_FALLBACK: "black-forest-labs/flux-dev", // $0.025-0.030/image - fallback if Google not configured
  // Alternative photorealistic options:
  // - "google-imagen-4-standard": $0.04/image (higher quality)
  // - "black-forest-labs/flux-pro": $0.05-0.10/image (highest quality, expensive)
  // - "stability-ai/stable-diffusion-3.5-large-turbo": $0.04/image (very high quality)
  // - "black-forest-labs/flux-kontext-pro": $0.04/image (with reference image support)
  
  // Artistic models (best for illustrations, watercolor, etc.)
  ARTISTIC: "stability-ai/sdxl", // $0.0048/image - excellent for artistic styles
  ARTISTIC_ALT: "black-forest-labs/flux-dev", // $0.025-0.030/image - alternative artistic option
};

// Map image styles to models
const STYLE_TO_MODEL: Record<string, string> = {
  // Photorealistic styles -> use photorealistic model
  'Photorealistic': MODELS.PHOTOREALISTIC,
  'photorealistic': MODELS.PHOTOREALISTIC,
  'Realistic': MODELS.PHOTOREALISTIC,
  'realistic': MODELS.PHOTOREALISTIC,
  
  // Artistic styles -> use artistic model
  'Illustration': MODELS.ARTISTIC,
  'illustration': MODELS.ARTISTIC,
  'Watercolor': MODELS.ARTISTIC,
  'watercolor': MODELS.ARTISTIC,
  'Minimalist': MODELS.ARTISTIC,
  'minimalist': MODELS.ARTISTIC,
  'Vintage': MODELS.ARTISTIC,
  'vintage': MODELS.ARTISTIC,
  '3D Render': MODELS.ARTISTIC,
  '3d render': MODELS.ARTISTIC,
  'Sketch': MODELS.ARTISTIC,
  'sketch': MODELS.ARTISTIC,
  'Abstract': MODELS.ARTISTIC,
  'abstract': MODELS.ARTISTIC,
};

// Default model (fallback)
const DEFAULT_MODEL = MODELS.ARTISTIC; // SDXL - good all-around

// Helper to get model for a given style
function getModelForStyle(imageStyle: string): string {
  return STYLE_TO_MODEL[imageStyle] || DEFAULT_MODEL;
}

// Legacy constant for backward compatibility
const SDXL_MODEL_NAME = "stability-ai/sdxl";

// Helper to prepare image for Replicate (try URL first, upload if needed)
async function prepareImageForReplicate(imageUrl: string, replicateApiKey: string): Promise<string | null> {
  try {
    // Check if URL is publicly accessible (starts with http/https)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Try using the URL directly first (Replicate accepts publicly accessible URLs)
      console.log(`[ImageGen] Using reference image URL directly: ${imageUrl.substring(0, 100)}...`);
      return imageUrl;
    }
    
    // If it's a data URL or base64, we need to handle it differently
    // For now, return null and log a warning
    if (imageUrl.startsWith('data:')) {
      console.warn(`[ImageGen] Data URLs not directly supported by Replicate. Need to upload or convert.`);
      // Could extract base64 and upload, but for now return null
      return null;
    }
    
    return null;
  } catch (error) {
    console.error(`[ImageGen] Error preparing reference image for Replicate: ${imageUrl}`, error);
    return null;
  }
}

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

// Extract visual elements and suggest what should be depicted
function extractVisualElements(title: string, description?: string): {
  subjects: string[];
  objects: string[];
  setting: string;
  actions: string[];
} {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Common visual nouns (people, objects, places)
  const peoplePatterns = [
    /\b(person|people|man|woman|baker|chef|player|athlete|politician|leader|soldier|artist|scientist|inventor|explorer)\w*/gi,
    /\b([A-Z][a-z]+)\b/g, // Proper nouns (names)
  ];
  
  const objectPatterns = [
    /\b(cake|roll|bread|food|dish|meal|equipment|tool|weapon|vehicle|building|structure|document|paper|book|machine|device)\w*/gi,
    /\b(swiss roll|tent|kitchen|stadium|office|house|car|plane|ship)\w*/gi,
  ];
  
  const settingPatterns = [
    /\b(tent|kitchen|stadium|field|office|building|room|hall|street|city|country|battlefield|laboratory|studio)\w*/gi,
    /\b(baking|competition|election|war|meeting|ceremony|event|celebration)\w*/gi,
  ];
  
  const actionPatterns = [
    /\b(eliminated|collapsed|won|lost|announced|declared|created|built|discovered|invented|launched|started|ended|defeated|victory|defeat)\w*/gi,
    /\b(baking|cooking|competing|fighting|speaking|signing|celebrating|mourning)\w*/gi,
  ];
  
  const subjects: string[] = [];
  const objects: string[] = [];
  const actions: string[] = [];
  let setting = '';
  
  // Extract people/subjects
  peoplePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!subjects.includes(match) && match.length > 2) {
          subjects.push(match);
        }
      });
    }
  });
  
  // Extract objects
  objectPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!objects.includes(match) && match.length > 2) {
          objects.push(match);
        }
      });
    }
  });
  
  // Extract setting
  const settingMatches = text.match(settingPatterns[0]) || text.match(settingPatterns[1]);
  if (settingMatches && settingMatches.length > 0) {
    setting = settingMatches[0];
  }
  
  // Extract actions
  actionPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!actions.includes(match) && match.length > 2) {
          actions.push(match);
        }
      });
    }
  });
  
  return {
    subjects: subjects.slice(0, 3), // Limit to 3 most relevant
    objects: objects.slice(0, 3),
    setting: setting || '',
    actions: actions.slice(0, 2),
  };
}

// Build enhanced image prompt with style, color, and cohesion
function buildImagePrompt(
  event: { title: string; description?: string; year?: number; imagePrompt?: string },
  imageStyle: string,
  themeColor: string,
  styleVisualLanguage: string,
  imageReferences?: Array<{ name: string; url: string }>
): string {
  const colorName = COLOR_NAMES[themeColor] || 'thematic color';
  
  // Extract visual elements to suggest what should be depicted
  const visualElements = extractVisualElements(event.title, event.description);
  
  // Build the core visual description
  let visualDescription = '';
  
  // Start with main subject(s)
  if (visualElements.subjects.length > 0) {
    visualDescription = visualElements.subjects.join(', ');
  } else {
    // Fallback to title if no subjects extracted
    visualDescription = event.title;
  }
  
  // Add key objects that should be visible
  if (visualElements.objects.length > 0) {
    visualDescription += ` with ${visualElements.objects.join(', ')}`;
  }
  
  // Add setting/environment
  if (visualElements.setting) {
    visualDescription += ` in ${visualElements.setting}`;
  }
  
  // Add action/moment being depicted
  if (visualElements.actions.length > 0) {
    visualDescription += `, ${visualElements.actions.join(' ')}`;
  }
  
  // Start with AI-generated prompt if available (from description step)
  let prompt = '';
  
  if (event.imagePrompt && event.imagePrompt.trim()) {
    // Use AI-generated prompt as base, but clean it up
    prompt = event.imagePrompt;
    
    // Remove narrative/exclamatory phrases from AI prompt
    const narrativePatterns = [
      /Oh dear!/gi,
      /Talk about/gi,
      /It was a/gi,
      /This is/gi,
      /What a/gi,
      /\.\.\./g,
    ];
    narrativePatterns.forEach(pattern => {
      prompt = prompt.replace(pattern, '');
    });
    
    // Enhance with visual elements if not already present
    if (!prompt.toLowerCase().includes(visualElements.subjects[0]?.toLowerCase() || '')) {
      prompt = `${visualDescription}. ${prompt}`;
    }
    
    // Check for famous people and make safe
    if (containsFamousPerson(prompt) || containsFamousPerson(event.title)) {
      prompt = makePromptSafeForFamousPeople(prompt, imageStyle);
      // Use safer style for famous people
      const safeStyle = getSafeStyleForFamousPeople(imageStyle);
      if (safeStyle !== imageStyle && !prompt.toLowerCase().includes(safeStyle.toLowerCase())) {
        prompt = `${safeStyle} style: ${prompt}`;
      }
    }
    
    // Ensure it includes style if not already present
    if (!prompt.toLowerCase().includes(imageStyle.toLowerCase())) {
      prompt = `${imageStyle} style: ${prompt}`;
    }
  } else {
    // Build from scratch with visual focus
    const yearContext = event.year ? `, ${event.year}` : '';
    let basePrompt = `${imageStyle} style: ${visualDescription}${yearContext}`;
    
    // Check for famous people and make safe
    if (containsFamousPerson(visualDescription)) {
      basePrompt = makePromptSafeForFamousPeople(basePrompt, imageStyle);
      const safeStyle = getSafeStyleForFamousPeople(imageStyle);
      if (safeStyle !== imageStyle) {
        basePrompt = basePrompt.replace(new RegExp(imageStyle, 'gi'), safeStyle);
      }
    }
    
    prompt = basePrompt;
  }
  
  // Add explicit depiction suggestions
  const depictionSuggestions: string[] = [];
  
  if (visualElements.subjects.length > 0) {
    depictionSuggestions.push(`depict ${visualElements.subjects[0]}`);
  }
  
  if (visualElements.objects.length > 0) {
    depictionSuggestions.push(`show ${visualElements.objects[0]}`);
  }
  
  if (visualElements.setting) {
    depictionSuggestions.push(`set in ${visualElements.setting}`);
  }
  
  if (depictionSuggestions.length > 0) {
    prompt += `. ${depictionSuggestions.join(', ')}`;
  }
  
  // Add color integration (concise)
  prompt += `. ${colorName} color palette, ${colorName} lighting`;
  
  // Add style-specific visual language
  prompt += `. ${styleVisualLanguage}`;
  
  // Add historical period context if year is available
  if (event.year) {
    const century = Math.floor(event.year / 100) + 1;
    prompt += `. ${century}th century period detail`;
  }
  
  // Add composition guidance (concise)
  prompt += `. Balanced composition, centered focal point`;
  
  // Add text handling instructions to avoid misspelled text
  // SDXL struggles with text rendering, so we strongly discourage text unless explicitly needed
  prompt += `. No text, no words, no signs, no labels, no written content. Visual scene only`;
  
  // Note: Reference images are now handled separately via direct image input
  // Don't include URLs in prompt when using image-to-image
  
  // Keep prompt concise and visual-focused (max 600 chars to accommodate text instructions)
  return prompt.substring(0, 600).trim();
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
      // Log the raw output for debugging
      console.log(`[ImageGen] Prediction output type: ${typeof prediction.output}, value:`, JSON.stringify(prediction.output).substring(0, 200));
      
      // Handle different output formats from Replicate
      let imageUrl: string | null = null;
      
      if (Array.isArray(prediction.output)) {
        // Standard format: array of URLs
        imageUrl = prediction.output[0] || null;
      } else if (typeof prediction.output === 'string') {
        // Sometimes output is a direct string URL
        imageUrl = prediction.output;
      } else if (prediction.output?.url) {
        // Sometimes output is an object with a url property
        imageUrl = prediction.output.url;
      }
      
      // Validate that we have a proper URL
      if (imageUrl) {
        // Ensure it's a full URL (starts with http:// or https://)
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          console.error(`[ImageGen] Invalid URL format from Replicate: ${imageUrl}`);
          // Try to construct a full URL if it's a relative path
          if (imageUrl.startsWith('/')) {
            console.warn(`[ImageGen] Received relative path, cannot resolve: ${imageUrl}`);
            return null;
          }
          return null;
        }
        
        console.log(`[ImageGen] Successfully received image URL: ${imageUrl.substring(0, 100)}...`);
        return imageUrl;
      }
      
      console.error(`[ImageGen] No valid image URL found in prediction output:`, JSON.stringify(prediction.output));
      return null;
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
    const { events, imageStyle = 'photorealistic', themeColor = '#3B82F6', imageReferences = [] } = body;

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

    // Select model based on image style
    let selectedModel = getModelForStyle(imageStyle);
    const hasReferenceImages = imageReferences && imageReferences.length > 0;
    
    // Use Flux Dev for photorealistic (better quality for real people than Google Imagen)
    // Google Imagen has quality/restriction issues with real people
    if (selectedModel === MODELS.PHOTOREALISTIC) {
      console.log(`[ImageGen] Using Flux Dev for photorealistic images (better quality for real people)`);
      selectedModel = MODELS.PHOTOREALISTIC_FALLBACK; // Flux Dev
    }
    
    // Google Imagen disabled due to poor quality for real people
    
    // If reference images are provided and we're using Flux (which doesn't support image input),
    // we have options:
    // 1. Use Flux Kontext Pro (supports reference images, $0.04/image)
    // 2. Fall back to SDXL (supports reference images, $0.0048/image, lower quality)
    if (hasReferenceImages && selectedModel.includes('flux') && !selectedModel.includes('kontext')) {
      // For photorealistic with reference images, use Flux Kontext Pro if available
      // Otherwise fall back to SDXL
      const useKontextPro = selectedModel === MODELS.PHOTOREALISTIC_FALLBACK;
      if (useKontextPro) {
        console.log(`[ImageGen] Reference images provided. Using Flux Kontext Pro for photorealistic with reference support.`);
        selectedModel = "black-forest-labs/flux-kontext-pro"; // Supports reference images
      } else {
        console.log(`[ImageGen] Reference images provided but Flux doesn't support image input. Switching to SDXL for reference image support.`);
        selectedModel = MODELS.ARTISTIC; // SDXL
      }
    }
    
    // Get model version for Replicate models
    let modelVersion: string | null = null;
    modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
    console.log(`[ImageGen] Style: "${imageStyle}" -> Model: ${selectedModel}, Version: ${modelVersion}${hasReferenceImages ? ' (with reference images)' : ''}`);

    // Get style-specific visual language for cohesion
    const styleVisualLanguage = STYLE_VISUAL_LANGUAGE[imageStyle] || STYLE_VISUAL_LANGUAGE['Illustration'];
    
    // Prepare reference images for Replicate if available (one per event, or use first available)
    const referenceImagePromises = imageReferences && imageReferences.length > 0
      ? imageReferences.slice(0, events.length).map((ref: { name: string; url: string }) => prepareImageForReplicate(ref.url, replicateApiKey))
      : [];
    const preparedReferences = await Promise.all(referenceImagePromises);
    console.log(`[ImageGen] Prepared ${preparedReferences.filter(r => r !== null).length}/${imageReferences.length} reference images for Replicate`);
    
    // PARALLEL GENERATION: Start all predictions at once for faster processing
    console.log(`[ImageGen] Starting parallel generation for ${events.length} images using ${selectedModel}...`);
    
    // Step 1: Create all predictions in parallel
    const predictionPromises = events.map(async (event, index) => {
      try {
        // Build enhanced prompt with AI-generated prompt (if available), style, color, and cohesion
        const prompt = buildImagePrompt(event, imageStyle, themeColor, styleVisualLanguage);
        
        // Get reference image URL for this event (use first available, or cycle through if multiple events)
        const referenceImageUrl = preparedReferences[index] || preparedReferences[0] || null;
        
        // Log the prompt being sent (for debugging)
        console.log(`[ImageGen] Creating prediction ${index + 1}/${events.length} for "${event.title}"${referenceImageUrl ? ' with reference image' : ' (text only)'}`);
        
        // Build input - structure varies by model (for Replicate models)
        const input: any = {
          prompt: prompt,
        };
        
        // Model-specific parameters
        if (selectedModel.includes('flux')) {
          // Flux models use different parameters
          input.num_outputs = 1;
          // Flux Dev uses slightly different parameters than Flux Pro
          if (selectedModel.includes('flux-dev')) {
            input.guidance_scale = 3.5;
            input.num_inference_steps = 28;
          } else if (selectedModel.includes('flux-pro')) {
            input.guidance_scale = 3.5;
            input.num_inference_steps = 50; // More steps for higher quality
          } else {
            // Default Flux parameters
            input.guidance_scale = 3.5;
            input.num_inference_steps = 28;
          }
          
          // Flux models don't support direct image input via Replicate API
          // If reference images are needed, we could include URLs in prompt (less effective)
          // For photorealistic with reference images, consider using SDXL or Flux Kontext Pro instead
          if (referenceImageUrl) {
            console.warn(`[ImageGen] Flux models don't support direct image input. Reference images will be ignored. For reference images, use SDXL or Flux Kontext Pro.`);
            // Note: We could add reference URLs to prompt, but it's less effective than direct input
          }
        } else if (selectedModel.includes('stable-diffusion-3')) {
          // Stable Diffusion 3.5 models
          input.num_outputs = 1;
          input.guidance_scale = 7.0;
          input.num_inference_steps = 30;
          
          // SD 3.5 may support image input - check model docs
          if (referenceImageUrl) {
            // Use Replicate URL for image input
            input.image = referenceImageUrl;
            input.prompt_strength = 0.8;
            console.log(`[ImageGen] Using reference image with SD 3.5`);
          }
        } else {
          // SDXL and similar models
          input.num_outputs = 1;
          input.guidance_scale = 7.5;
          input.num_inference_steps = 30;
          
          // Add negative prompt for SDXL to avoid misspelled text
          // SDXL struggles with text rendering, so we discourage unnecessary text
          input.negative_prompt = "text, words, letters, signs, labels, misspelled text, garbled text, unreadable text, text errors, written words, text blocks, documents with text";
          
          // Add reference image if available (for image-to-image transformation)
          // SDXL supports direct image input via 'image' parameter (URL from Replicate)
          if (referenceImageUrl) {
            input.image = referenceImageUrl;
            input.prompt_strength = 0.8; // How strongly the prompt transforms the input image (0-1)
            console.log(`[ImageGen] Using reference image for image-to-image transformation`);
          }
        }
        
        // Create prediction via Replicate
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: modelVersion,
            input: input,
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
          console.error(`[ImageGen] Replicate API error for "${event.title}":`, errorMsg);
          
          return { index, error: new Error(`Replicate API error: ${errorMsg}`), event };
        }

        const prediction = await createResponse.json();
        
        if (!prediction.id) {
          return { index, error: new Error('No prediction ID returned from Replicate'), event };
        }

        return { index, predictionId: prediction.id, event };
      } catch (error: any) {
        console.error(`[ImageGen] Error creating prediction for "${event.title}":`, error);
        return { index, error, event };
      }
    });

    // Wait for all predictions to be created
    const predictionResults = await Promise.all(predictionPromises);
    const createdCount = predictionResults.filter(r => r.predictionId).length;
    const failedCreationCount = predictionResults.filter(r => r.error).length;
    console.log(`[ImageGen] Created ${createdCount}/${events.length} predictions successfully`);
    
    // Log creation errors
    if (failedCreationCount > 0) {
      console.error(`[ImageGen] ${failedCreationCount} predictions failed to create:`);
      predictionResults.forEach((result) => {
        if (result.error) {
          console.error(`[ImageGen] Event "${result.event.title}": ${result.error.message || result.error}`);
        }
      });
    }
    
    // Step 2: Poll all predictions in parallel
    const imagePromises = predictionResults.map(async (result) => {
      if (result.error || !result.predictionId) {
        const errorMsg = result.error?.message || result.error || 'No prediction ID';
        console.error(`[ImageGen] Skipping prediction for "${result.event.title}": ${errorMsg}`);
        return { index: result.index, imageUrl: null, error: result.error, event: result.event };
      }

      try {
        console.log(`[ImageGen] Polling prediction ${result.predictionId} for "${result.event.title}"...`);
        const imageUrl = await waitForPrediction(result.predictionId, replicateApiKey);
        console.log(`[ImageGen] Completed image ${result.index + 1}/${events.length} for "${result.event.title}": ${imageUrl ? imageUrl.substring(0, 100) + '...' : 'null'}`);
        return { index: result.index, imageUrl, error: null, event: result.event };
      } catch (error: any) {
        console.error(`[ImageGen] Error waiting for prediction "${result.event.title}" (ID: ${result.predictionId}):`, error);
        console.error(`[ImageGen] Error details:`, error.message, error.stack?.substring(0, 500));
        return { index: result.index, imageUrl: null, error, event: result.event };
      }
    });

    // Wait for all images to complete
    const imageResults = await Promise.all(imagePromises);
    
    // Step 3: Assemble results in correct order
    const images: (string | null)[] = new Array(events.length).fill(null);
    const errors: (Error | null)[] = new Array(events.length).fill(null);
    imageResults.forEach((result) => {
      images[result.index] = result.imageUrl;
      errors[result.index] = result.error || null;
    });
    
    const successfulCount = images.filter(img => img !== null).length;
    const failedCount = errors.filter(err => err !== null).length;
    console.log(`[ImageGen] Parallel generation complete: ${successfulCount}/${events.length} images generated, ${failedCount} failed`);
    
    // Log detailed error information
    if (failedCount > 0) {
      console.error(`[ImageGen] Failed image generation details:`);
      imageResults.forEach((result) => {
        if (result.error) {
          console.error(`[ImageGen] Event "${result.event.title}": ${result.error.message || result.error}`);
        }
      });
    }
    
    // Filter out null values and check if we have any successful images
    const successfulImages = images.filter(img => img !== null);
    
    if (successfulImages.length === 0) {
      // Collect all error messages for better debugging
      const errorMessages = imageResults
        .filter(r => r.error)
        .map(r => `${r.event.title}: ${r.error?.message || r.error}`)
        .join('; ');
      
      console.error(`[ImageGen] All ${events.length} images failed to generate. Errors: ${errorMessages}`);
      
      return NextResponse.json(
        { 
          error: 'Failed to generate any images. Please check your REPLICATE_API_TOKEN and try again.', 
          details: `All ${events.length} image generations failed. ${errorMessages || 'Check server logs for details.'}`,
          debug: process.env.NODE_ENV === 'development' ? {
            totalEvents: events.length,
            createdPredictions: createdCount,
            failedPredictions: failedCreationCount,
            successfulImages: successfulCount,
            errors: errorMessages,
          } : undefined,
        },
        { status: 500 }
      );
    }
    
    // Step 4: Persist all images to Cloudinary (if configured)
    // This ensures images are permanently stored and won't expire from Replicate
    console.log(`[ImageGen] Persisting ${successfulImages.length} images to Cloudinary...`);
    const persistedImages = await persistImagesToCloudinary(images);
    
    // Log summary
    const persistedCount = persistedImages.filter(img => img !== null && img.includes('res.cloudinary.com')).length;
    console.log(`[ImageGen] Generated ${successfulImages.length} of ${events.length} images successfully`);
    if (persistedCount > 0) {
      console.log(`[ImageGen] Persisted ${persistedCount} images to Cloudinary for permanent storage`);
    }
    
    // Return all images (including nulls for failed ones) so frontend can handle gracefully
    // Images are now Cloudinary URLs (if Cloudinary is configured) or original Replicate URLs
    return NextResponse.json({ images: persistedImages });
  } catch (error: any) {
    console.error('[ImageGen] Error generating images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate images' },
      { status: 500 }
    );
  }
}
