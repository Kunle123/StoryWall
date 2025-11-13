import { NextRequest, NextResponse } from 'next/server';
import { containsFamousPerson, makePromptSafeForFamousPeople, getSafeStyleForFamousPeople } from '@/lib/utils/famousPeopleHandler';
import { persistImagesToCloudinary } from '@/lib/utils/imagePersistence';
import { generateImageWithImagen, isGoogleCloudConfigured } from '@/lib/google/imagen';

// Helper to extract famous person names from event text using OpenAI
// Returns array of objects with {name, search_query}
async function extractPersonNamesFromEvent(event: { title: string; description?: string }): Promise<Array<{name: string, search_query: string}>> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('[ImageGen] OPENAI_API_KEY not configured, skipping person extraction');
      return [];
    }

    // Combine title and description, prioritizing title
    const eventText = `${event.title}${event.description ? ' ' + event.description : ''}`.trim();
    if (!eventText || eventText.length < 10) {
      console.log(`[ImageGen] Event text too short for extraction: "${eventText}"`);
      return [];
    }

    console.log(`[ImageGen] Extracting person names from event - Title: "${event.title}", Description: "${event.description || 'none'}"`);

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
            content: 'You are a helpful assistant that extracts person names (famous or notable) from event descriptions. CRITICAL: Only extract person names if the event is actually ABOUT people (politicians, celebrities, public figures, named individuals). If the event is about concepts, processes, scientific phenomena, medical conditions, technical topics, or abstract ideas WITHOUT specific named people, return an empty array []. Examples: "Fetal development stages" = [] (no people), "Taylor Swift concert" = [{"name": "Taylor Swift", ...}], "The invention of the telephone" = [] (no specific person named), "Alexander Graham Bell invents telephone" = [{"name": "Alexander Graham Bell", ...}]. Return ONLY a JSON array of objects, each with "name" (full name when possible) and "search_query" (best query to find their image), or [] if no people are mentioned. Fix common typos (e.g., "mamdanis" -> "Mamdani").'
          },
          {
            role: 'user',
            content: `Extract person names from this event ONLY if it mentions specific named people:\nTitle: "${event.title}"\nDescription: "${event.description || 'none'}"\n\nReturn only a JSON array of objects with "name" and "search_query" fields, or [] if this event is about concepts, processes, science, medicine, or topics without specific named people.`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[ImageGen] Failed to extract person names: ${response.status}`, errorText);
        return [];
      }

      const data = await response.json();
      console.log(`[ImageGen] OpenAI response structure:`, JSON.stringify({
        model: data.model,
        usage: data.usage,
        choices_count: data.choices?.length,
        first_choice_finish_reason: data.choices?.[0]?.finish_reason,
      }, null, 2));
      
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log(`[ImageGen] Raw OpenAI content:`, content);
      
      if (!content) {
        console.warn('[ImageGen] No content in OpenAI response');
        return [];
      }

      // Parse JSON array - now expects array of objects with name and search_query
      try {
        const parsed = JSON.parse(content);
        console.log(`[ImageGen] Parsed extraction result:`, parsed);
        
        if (Array.isArray(parsed)) {
          // Handle both old format (array of strings) and new format (array of objects)
          const people: Array<{name: string, search_query: string}> = parsed
            .map((item: any) => {
              if (typeof item === 'string') {
                // Old format: just a string name
                return { name: item, search_query: item };
              } else if (item && typeof item === 'object' && item.name) {
                // New format: object with name and search_query
                return {
                  name: item.name,
                  search_query: item.search_query || item.name
                };
              }
              return null;
            })
            .filter((p): p is {name: string, search_query: string} => 
              p !== null && p.name && p.name.length > 0
            );
          
          console.log(`[ImageGen] Extracted ${people.length} person(s) from event: ${people.map((p) => p.name).join(', ')}`);
          return people;
        } else {
          console.warn('[ImageGen] Parsed result is not an array:', typeof parsed);
        }
      } catch (parseError: any) {
        console.warn('[ImageGen] Failed to parse person names JSON:', content);
        console.warn('[ImageGen] Parse error:', parseError.message);
      }

      return [];
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('[ImageGen] Timeout extracting person names (20s timeout)');
      } else {
        console.error('[ImageGen] Error extracting person names:', error.message);
      }
      return [];
    }
  } catch (error: any) {
    console.error('[ImageGen] Error in extractPersonNamesFromEvent:', error.message);
    return [];
  }
}

// Helper to normalize names (fix common typos)
function normalizeName(name: string): string {
  let normalized = name.trim();
  
  // Fix common typos
  normalized = normalized.replace(/mamdanis/gi, 'Mamdani');
  normalized = normalized.replace(/mamdani/gi, 'Mamdani');
  
  // Capitalize properly (first letter of each word)
  const words = normalized.split(/\s+/);
  normalized = words.map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  return normalized;
}

// Helper to generate name variations for better matching
function generateNameVariations(name: string): string[] {
  // First normalize the name
  const normalized = normalizeName(name);
  const variations = [normalized];
  const parts = normalized.trim().split(/\s+/);
  
  // If it's a single word (like "Cuomo"), try common full names
  if (parts.length === 1) {
    const lastName = parts[0];
    // Common first names for politicians/public figures
    const commonFirstNames = ['Andrew', 'Chris', 'Mario', 'John', 'Michael', 'David', 'Robert'];
    commonFirstNames.forEach(firstName => {
      variations.push(`${firstName} ${lastName}`);
    });
  } else if (parts.length === 2) {
    // If we have first and last, also try just last name
    variations.push(parts[parts.length - 1]);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

// Helper to check if a filename/title matches a person's name
function matchesPersonName(filename: string, personName: string): boolean {
  const filenameLower = filename.toLowerCase();
  const nameParts = personName.toLowerCase().split(/\s+/).filter(p => p.length > 2); // Ignore short words like "de", "van", etc.
  
  // Check if all significant name parts appear in the filename
  return nameParts.every(part => filenameLower.includes(part));
}

// Helper to use GPT-4o to find direct image URLs for people
async function findImageUrlWithGPT4o(personName: string, searchQuery: string): Promise<string | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('[ImageGen] OPENAI_API_KEY not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that finds direct image URLs (actual image files, not web pages) for public figures. Return ONLY a direct image URL (ending in .jpg, .png, .webp, etc.) from a reliable source like Wikimedia Commons (upload.wikimedia.org), official government sites, or news media. Return the URL as plain text, nothing else. If you cannot find a suitable image URL, return "null".'
            },
            {
              role: 'user',
              content: `Find a direct image URL (actual image file, not a webpage) for ${personName}. Search query: "${searchQuery}". Return only the URL, nothing else.`
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[ImageGen] GPT-4o image search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (!content || content.toLowerCase() === 'null') {
        console.log(`[ImageGen] GPT-4o found no image URL for: ${personName}`);
        return null;
      }

      // Extract URL from response (might have extra text)
      const urlMatch = content.match(/https?:\/\/[^\s"']+/);
      if (!urlMatch || urlMatch.length === 0) {
        console.warn(`[ImageGen] No URL found in GPT-4o response: ${content.substring(0, 200)}`);
        return null;
      }

      const imageUrl = urlMatch[0];
      console.log(`[ImageGen] GPT-4o found image URL for ${personName}: ${imageUrl.substring(0, 80)}...`);

      // Validate it's actually an image (with error handling)
      try {
        const isValid = await validateImageUrl(imageUrl);
        if (isValid) {
          console.log(`[ImageGen] ✓ Validated image URL for ${personName}`);
          return imageUrl;
        } else {
          console.warn(`[ImageGen] GPT-4o URL failed validation: ${imageUrl}`);
          return null;
        }
      } catch (validationError: any) {
        console.error(`[ImageGen] Error validating GPT-4o URL:`, validationError.message);
        return null;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`[ImageGen] Timeout finding image URL for ${personName} (15s timeout)`);
      } else {
        console.error(`[ImageGen] Error finding image URL:`, error.message);
      }
      return null;
    }
  } catch (error: any) {
    console.error(`[ImageGen] Error in findImageUrlWithGPT4o:`, error.message);
    return null;
  }
}

// Helper to search Wikimedia Commons for person images (fallback)
async function searchWikimediaForPerson(searchQuery: string, personName: string): Promise<string | null> {
  try {
    // Use the person's name more directly in the search
    const nameParts = personName.split(/\s+/).filter(p => p.length > 1);
    const directNameSearch = nameParts.join(' ');
    
    // Search with both the search query and direct name
    const searchTerms = `${directNameSearch} ${searchQuery}`.trim();
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerms + ' portrait OR headshot OR official photo')}&srnamespace=6&srlimit=10&origin=*`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`[ImageGen] Wikimedia search failed: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      const results = data.query?.search || [];
      
      if (results.length === 0) {
        console.log(`[ImageGen] No Wikimedia results for: ${searchTerms}`);
        return null;
      }
      
      // Find the first result that actually matches the person's name
      let matchingResult = null;
      for (const result of results) {
        const pageTitle = result.title;
        if (matchesPersonName(pageTitle, personName)) {
          matchingResult = result;
          console.log(`[ImageGen] Found matching result for ${personName}: ${pageTitle}`);
          break;
        }
      }
      
      // If no exact match, try the first result but log a warning
      if (!matchingResult) {
        console.warn(`[ImageGen] No exact name match found for ${personName}, using first result: ${results[0].title}`);
        matchingResult = results[0];
      }
      
      const pageTitle = matchingResult.title;
      
      // Fetch image info to get the direct URL (create new controller for this request)
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url&origin=*`;
      
      const infoController = new AbortController();
      const infoTimeoutId = setTimeout(() => infoController.abort(), 10000);
      
      const infoResponse = await fetch(imageInfoUrl, { signal: infoController.signal });
      clearTimeout(infoTimeoutId);
      if (!infoResponse.ok) {
        console.warn(`[ImageGen] Failed to get image info: ${infoResponse.status}`);
        return null;
      }
      
      const infoData = await infoResponse.json();
      const pages = infoData.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId]?.imageinfo?.[0];
      
      if (!imageInfo || !imageInfo.url) {
        console.log(`[ImageGen] No image URL found for: ${pageTitle}`);
        return null;
      }
      
      const directUrl = imageInfo.url;
      
      // Validate it's actually an image
      const isValid = await validateImageUrl(directUrl);
      if (isValid) {
        console.log(`[ImageGen] ✓ Found Wikimedia image for "${searchQuery}": ${directUrl.substring(0, 80)}...`);
        return directUrl;
      }
      
      return null;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`[ImageGen] Timeout searching Wikimedia for: ${searchQuery}`);
      } else {
        console.error(`[ImageGen] Error searching Wikimedia:`, fetchError.message);
      }
      return null;
    }
  } catch (error: any) {
    console.error(`[ImageGen] Error in searchWikimediaForPerson:`, error.message);
    return null;
  }
}

// Helper to fetch reference images for person names
async function fetchReferenceImagesForPeople(people: Array<{name: string, search_query: string}>): Promise<Array<{ name: string; url: string }>> {
  const references: Array<{ name: string; url: string }> = [];

  for (const person of people) {
    const { name, search_query } = person;
    
    // Try name variations to improve matching
    const nameVariations = generateNameVariations(name);
    let found = false;
    
    // Try the search query first, then name variations
    const searchQueries = [search_query, ...nameVariations];
    
    // Try GPT-4o first (most accurate)
    try {
      console.log(`[ImageGen] Using GPT-4o to find image URL for: ${name} (search query: "${search_query}")`);
      const startTime = Date.now();
      const imageUrl = await findImageUrlWithGPT4o(name, search_query);
      const elapsed = Date.now() - startTime;
      
      if (imageUrl) {
        references.push({ name, url: imageUrl });
        console.log(`[ImageGen] ✓ Found reference image for ${name} in ${elapsed}ms: ${imageUrl.substring(0, 80)}...`);
        found = true;
      } else {
        console.log(`[ImageGen] GPT-4o did not find image URL for ${name} (took ${elapsed}ms)`);
      }
    } catch (error: any) {
      console.error(`[ImageGen] ✗ Error with GPT-4o search for ${name}:`, error.message);
      console.error(`[ImageGen] GPT-4o error stack:`, error.stack);
    }
    
    // Fallback to Wikimedia search if GPT-4o didn't find anything
    // Wikimedia is the best source for celebrities, public figures, and politicians
    // (has official photos, press photos, and good coverage of famous people)
    if (!found) {
      for (const query of searchQueries) {
        if (found) break; // Stop if we found an image for this person
        
        try {
          console.log(`[ImageGen] Fallback: Searching Wikimedia for: ${query}`);
          const wikimediaUrl = await searchWikimediaForPerson(query, name);
          if (wikimediaUrl) {
            references.push({ name, url: wikimediaUrl });
            console.log(`[ImageGen] ✓ Found Wikimedia reference image for ${name}: ${wikimediaUrl.substring(0, 80)}...`);
            found = true;
            break;
          }
        } catch (error: any) {
          console.error(`[ImageGen] Error searching Wikimedia for ${query}:`, error.message);
          // Continue with next query
        }
      }
    }
    
    if (!found) {
      console.warn(`[ImageGen] ✗ Could not find reference image for ${name} (tried GPT-4o and Wikimedia with queries: ${searchQueries.join(', ')})`);
    }
  }

  return references;
}

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
  // Google Imagen 4 Fast: Best quality/price ratio ($0.02/image) - available on Replicate, supports image input
  PHOTOREALISTIC: "google/imagen-4-fast", // $0.02/image - excellent quality, best price, supports image-to-image
  PHOTOREALISTIC_FALLBACK: "black-forest-labs/flux-dev", // $0.025-0.030/image - fallback if Google not configured
  // Alternative photorealistic options:
  // - "google-imagen-4-standard": $0.04/image (higher quality)
  // - "black-forest-labs/flux-pro": $0.05-0.10/image (highest quality, expensive)
  // - "stability-ai/stable-diffusion-3.5-large-turbo": $0.04/image (very high quality)
  // - "black-forest-labs/flux-kontext-pro": $0.04/image (with reference image support)
  
  // Artistic models (best for illustrations, watercolor, etc.)
  ARTISTIC: "stability-ai/sdxl", // $0.0048/image - excellent for artistic styles
  ARTISTIC_ALT: "black-forest-labs/flux-dev", // $0.025-0.030/image - alternative artistic option
  // IP-Adapter for artistic styles with reference images (much cheaper than Flux Kontext Pro)
  ARTISTIC_WITH_REF: "lucataco/ip-adapter", // $0.002-0.005/image - SDXL + IP-Adapter for reference images
};

// Map image styles to models
const STYLE_TO_MODEL: Record<string, string> = {
  // Photorealistic styles -> use photorealistic model
  'Photorealistic': MODELS.PHOTOREALISTIC,
  'photorealistic': MODELS.PHOTOREALISTIC,
  'Realistic': MODELS.PHOTOREALISTIC,
  'realistic': MODELS.PHOTOREALISTIC,
  
  // Artistic styles -> use artistic model
  'Illustration': MODELS.ARTISTIC, // Use SDXL for Illustration style
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

// Helper to detect if text is expected in the image
// VERY RESTRICTIVE - only for things that MUST have readable text (signs, newspapers, etc.)
function expectsTextInImage(event: { title: string; description?: string; imagePrompt?: string }): boolean {
  const text = `${event.title} ${event.description || ''} ${event.imagePrompt || ''}`.toLowerCase();
  
  // Only detect when text is ESSENTIAL to the image (very narrow list)
  const textIndicators = [
    'newspaper headline', 'banner reads', 'sign reads', 'sign says',
    'billboard reads', 'poster reads', 'headline reads', 'headline says'
  ];
  
  return textIndicators.some(indicator => text.includes(indicator));
}

// Helper to get model for a given style
// If text is expected, prefer Flux models (better at text rendering)
function getModelForStyle(imageStyle: string, needsText: boolean = false): string {
  const baseModel = STYLE_TO_MODEL[imageStyle] || DEFAULT_MODEL;
  
  // If text is needed and we're using SDXL (which struggles with text), switch to Flux
  if (needsText && baseModel === MODELS.ARTISTIC) {
    // Flux Dev is better at text than SDXL
    return MODELS.PHOTOREALISTIC_FALLBACK; // Flux Dev
  }
  
  return baseModel;
}

// Legacy constant for backward compatibility
const SDXL_MODEL_NAME = "stability-ai/sdxl";

// Helper to validate that a URL actually points to an image
async function validateImageUrl(url: string): Promise<boolean> {
  try {
    // Check if URL has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    if (!hasImageExtension && !url.includes('upload.wikimedia.org')) {
      console.warn(`[ImageGen] URL doesn't appear to be an image: ${url.substring(0, 100)}`);
      return false;
    }
    
    // Make HEAD request to check content-type with proper headers to avoid 403
    const headResponse = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!headResponse.ok) {
      console.warn(`[ImageGen] Image URL returned ${headResponse.status}: ${url.substring(0, 100)}`);
      return false;
    }
    
    const contentType = headResponse.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    
    if (!isImage) {
      console.warn(`[ImageGen] URL is not an image (content-type: ${contentType}): ${url.substring(0, 100)}`);
      return false;
    }
    
    console.log(`[ImageGen] Validated image URL: ${url.substring(0, 100)} (${contentType})`);
    return true;
  } catch (error: any) {
    console.error(`[ImageGen] Error validating image URL: ${url.substring(0, 100)}`, error.message);
    return false;
  }
}

// Helper to convert Wikimedia Commons page URL to direct image URL
async function getWikimediaDirectImageUrl(pageUrl: string): Promise<string | null> {
  try {
    // Extract filename from URL like https://commons.wikimedia.org/wiki/File:...
    const match = pageUrl.match(/File:(.+?)$/);
    if (!match) return null;
    
    const filename = match[1];
    
    // Use Wikimedia API to get direct image URL
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.error(`[ImageGen] Wikimedia API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId]?.imageinfo?.[0]?.url;
    
    if (!imageUrl) {
      console.warn(`[ImageGen] No image URL found in Wikimedia API response for: ${filename}`);
      return null;
    }
    
    // Validate the URL actually points to an image
    const isValid = await validateImageUrl(imageUrl);
    if (!isValid) {
      return null;
    }
    
    return imageUrl;
  } catch (error: any) {
    console.error(`[ImageGen] Error converting Wikimedia URL: ${pageUrl}`, error.message);
    return null;
  }
}

// Helper to upload image to Replicate's file storage
async function uploadImageToReplicate(imageUrl: string, replicateApiKey: string): Promise<string | null> {
  try {
    console.log(`[ImageGen] Starting upload to Replicate for: ${imageUrl.substring(0, 80)}...`);
    
    // Download the image with proper headers to avoid 403
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!imageResponse.ok) {
      console.warn(`[ImageGen] Failed to download image (${imageResponse.status}): ${imageUrl.substring(0, 100)}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    console.log(`[ImageGen] Downloaded image (${imageBuffer.byteLength} bytes, ${contentType})`);

    // Convert ArrayBuffer to Buffer for Node.js
    const buffer = Buffer.from(imageBuffer);
    
    // Create FormData - in Node.js 18+, FormData is available globally
    const formData = new FormData();
    
    // In Node.js, FormData can accept a Blob directly
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: contentType });
    
    // Append the blob to FormData with a filename
    // In Node.js FormData, we can append a Blob with options
    formData.append('file', blob, 'image.jpg');

    console.log(`[ImageGen] Uploading to Replicate...`);
    const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[ImageGen] Failed to upload image to Replicate (${uploadResponse.status}): ${errorText}`);
      return null;
    }

    const uploadData = await uploadResponse.json();
    console.log(`[ImageGen] Upload response:`, JSON.stringify(uploadData, null, 2));
    
    const replicateUrl = uploadData.url || uploadData.urls?.get || uploadData.urls?.get || null;
    
    if (replicateUrl) {
      console.log(`[ImageGen] ✓ Successfully uploaded image to Replicate: ${replicateUrl.substring(0, 80)}...`);
      return replicateUrl;
    }

    console.warn(`[ImageGen] No URL found in Replicate upload response`);
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[ImageGen] Timeout uploading image to Replicate: ${imageUrl.substring(0, 100)}`);
    } else {
      console.error(`[ImageGen] Error uploading image to Replicate: ${imageUrl.substring(0, 100)}`, error.message);
      console.error(`[ImageGen] Error stack:`, error.stack);
    }
    return null;
  }
}

// Helper to prepare image for Replicate (upload to Replicate to avoid 403 errors)
async function prepareImageForReplicate(imageUrl: string, replicateApiKey: string): Promise<string | null> {
  try {
    let finalUrl = imageUrl;
    
    // Convert Wikimedia Commons page URLs to direct image URLs
    if (imageUrl.includes('commons.wikimedia.org/wiki/File:')) {
      console.log(`[ImageGen] Converting Wikimedia page URL to direct image URL...`);
      const directUrl = await getWikimediaDirectImageUrl(imageUrl);
      if (directUrl) {
        finalUrl = directUrl;
        console.log(`[ImageGen] Using direct Wikimedia image: ${finalUrl.substring(0, 100)}...`);
      } else {
        console.warn(`[ImageGen] Failed to convert Wikimedia URL: ${imageUrl.substring(0, 100)}`);
        return null;
      }
    }
    
    // Check if URL is publicly accessible (starts with http/https)
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      console.warn(`[ImageGen] URL is not publicly accessible: ${finalUrl.substring(0, 100)}`);
      return null;
    }
    
    // For Wikimedia URLs, upload to Replicate ONLY if using SDXL (which has 403 errors)
    // Skip upload for Imagen and other models that can fetch Wikimedia URLs directly
    if (finalUrl.includes('upload.wikimedia.org') || finalUrl.includes('wikimedia.org')) {
      // Check if we're using SDXL (which needs uploaded images)
      // Note: We can't check the model here since it's determined per-event
      // So we'll always return the direct URL and let the caller decide if upload is needed
      console.log(`[ImageGen] Wikimedia image ready: ${finalUrl.substring(0, 80)}...`);
      // Return direct URL - upload will be handled per-model if needed
      return finalUrl;
    }
    
    // For non-Wikimedia URLs, validate that the URL actually points to an image
    const isValid = await validateImageUrl(finalUrl);
    if (!isValid) {
      console.warn(`[ImageGen] URL validation failed: ${finalUrl.substring(0, 100)}`);
      return null;
    }
    
    console.log(`[ImageGen] Validated and ready to use reference image: ${finalUrl.substring(0, 100)}...`);
    return finalUrl;
  } catch (error: any) {
    console.error(`[ImageGen] Error preparing reference image for Replicate: ${imageUrl.substring(0, 100)}`, error.message);
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
      const errorText = await response.text();
      console.warn(`[ImageGen] Could not fetch model versions for ${modelName} (${response.status}): ${errorText}`);
      // Return model name - caller will use 'model' field instead of 'version'
      return modelName;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const versionId = data.results[0].id;
      // Validate version ID format (should be a hash, typically 64 characters)
      if (versionId && versionId.length >= 20 && !versionId.includes('/')) {
        console.log(`[ImageGen] ✓ Fetched version ${versionId.substring(0, 20)}... for ${modelName}`);
        return versionId;
      } else {
        console.warn(`[ImageGen] Invalid version ID format: ${versionId}, using model name`);
        return modelName;
      }
    }

    // Fallback to model name
    console.warn(`[ImageGen] No versions found for ${modelName}, using model name directly`);
    return modelName;
  } catch (error: any) {
    console.warn(`[ImageGen] Error fetching model version for ${modelName}: ${error.message}. Using model name directly.`);
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

// Extract person names from image references
function extractPersonNames(imageReferences?: Array<{ name: string; url: string }>): string[] {
  if (!imageReferences || imageReferences.length === 0) return [];
  
  const personNames: string[] = [];
  imageReferences.forEach(ref => {
    // Extract person name from reference name (e.g., "Joe Biden (official portrait)" -> "Joe Biden")
    const nameMatch = ref.name.match(/^([^(]+?)(?:\s*\(|$)/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      // Filter out common non-person words
      if (name && !name.match(/^(official|portrait|photograph|photo|image|picture)$/i)) {
        personNames.push(name);
      }
    }
  });
  
  return personNames;
}

// Build enhanced image prompt with style, color, and cohesion
function buildImagePrompt(
  event: { title: string; description?: string; year?: number; imagePrompt?: string },
  imageStyle: string,
  themeColor: string,
  styleVisualLanguage: string,
  needsText: boolean = false,
  imageReferences?: Array<{ name: string; url: string }>,
  hasReferenceImage: boolean = false,
  includesPeople: boolean = true,
  anchorStyle?: string | null
): string {
  const colorName = COLOR_NAMES[themeColor] || 'thematic color';
  
  // STEP 4: If Anchor is provided (for progression timelines), use it as the base
  // The Anchor defines the consistent visual style for the entire series
  let prompt = '';
  
  if (anchorStyle && anchorStyle.trim()) {
    // For progression timelines with Anchor: ALWAYS use it for consistency
    // We don't rely on the AI to include it - we enforce it here
    console.log(`[ImageGen] Using Anchor style for progression timeline (enforcing consistency)`);
    
    // Normalize Anchor text (remove "Anchor:" prefix if AI added it)
    let normalizedAnchor = anchorStyle.replace(/^Anchor:\s*/i, '').trim();
    
    // CRITICAL: Remove event titles and brand names from Anchor to prevent repetition
    // Extract event titles from the current event to avoid removing them from the event description
    const eventTitleWords = event.title.split(/\s+/).filter(w => w.length > 2);
    const eventTitlePattern = new RegExp(`\\b(${eventTitleWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
    
    // Remove common brand names and service names that might have been included
    const brandPatterns = [
      /\bNetflix\b/gi,
      /\bM\*A\*S\*H\b/gi,
      /\bApollo\s+11\b/gi,
      /\bThe\s+Beatles\s+on\s+The\s+Ed\s+Sullivan\s+Show\b/gi,
      /\bJohn\s+Logie\s+Baird\b/gi,
      /\bSuper\s+Bowl\s+LIX\b/gi,
      /\bKansas\s+City\s+Chiefs\b/gi,
      /\bPhiladelphia\s+Eagles\b/gi,
    ];
    
    // Remove brand names and repeated event titles from anchor
    brandPatterns.forEach(pattern => {
      normalizedAnchor = normalizedAnchor.replace(pattern, '');
    });
    
    // Clean up multiple spaces and trim
    normalizedAnchor = normalizedAnchor.replace(/\s+/g, ' ').trim();
    
    // Extract event-specific description from the AI-generated prompt (if available)
    // or build it from title + description
    let eventDescription = event.title;
    
    if (event.imagePrompt && event.imagePrompt.trim()) {
      // Try to extract the event-specific part from the existing prompt
      // Remove style prefixes and generic phrases
      let eventSpecificPart = event.imagePrompt
        .replace(/^(?:Anchor:\s*)?/i, '') // Remove "Anchor:" prefix if present
        .replace(/^(?:Illustration|Minimalist|Watercolor|Photorealistic|Vintage|3D Render|Sketch|Abstract)\s+style:\s*/i, '')
        .replace(/^A detailed image of\s*/i, '')
        .replace(/^The scene shows\s*/i, '')
        .trim();
      
      // Check if this part contains the Anchor (if so, extract just the event-specific part)
      const anchorLower = normalizedAnchor.toLowerCase();
      const partLower = eventSpecificPart.toLowerCase();
      
      // If the prompt starts with the Anchor, extract what comes after
      if (partLower.startsWith(anchorLower.substring(0, 50))) {
        eventSpecificPart = eventSpecificPart.substring(normalizedAnchor.length).trim();
        // Remove leading "The scene shows" or similar phrases
        eventSpecificPart = eventSpecificPart.replace(/^(?:The scene shows|\.|,)\s*/i, '').trim();
      }
      
      // If we have meaningful event-specific content (not just generic), use it
      if (eventSpecificPart.length > 15 && 
          !eventSpecificPart.toLowerCase().startsWith('illustration style') &&
          !eventSpecificPart.toLowerCase().startsWith('hand-drawn')) {
        eventDescription = eventSpecificPart;
      } else {
        // Fall back to building from title + description
        if (event.description) {
          const stageMatch = event.description.match(/(\d+\s*(?:weeks?|months?|days?|stages?|phases?))/i);
          if (stageMatch) {
            eventDescription = `${event.title} at ${stageMatch[1]}`;
          } else {
            eventDescription = `${event.title}: ${event.description.split(' ').slice(0, 20).join(' ')}`;
          }
        }
      }
    } else {
      // No imagePrompt - build from title + description
      if (event.description) {
        const stageMatch = event.description.match(/(\d+\s*(?:weeks?|months?|days?|stages?|phases?))/i);
        if (stageMatch) {
          eventDescription = `${event.title} at ${stageMatch[1]}`;
        } else {
          eventDescription = `${event.title}: ${event.description.split(' ').slice(0, 20).join(' ')}`;
        }
      }
    }
    
    // ALWAYS build prompt with Anchor + event-specific description
    // The Anchor contains specific visual instructions (color washes, vignettes, lighting) that MUST be preserved
    // Don't truncate the Anchor - it needs to include all visual consistency instructions
    // The Anchor should be prepended in full to ensure all visual effects are applied
    
    prompt = `${normalizedAnchor}. ${eventDescription}`;
    console.log(`[ImageGen] Enforced Anchor consistency for "${event.title}" (Anchor: ${normalizedAnchor.length} chars)`);
    
    // CRITICAL: When anchorStyle is provided, we MUST use it - don't fall through to other logic
    // The prompt is now set above, so we can continue to the rest of the function
  } else if (event.imagePrompt && event.imagePrompt.trim()) {
    // Use AI-generated prompt as base, but clean it up
    // IMPORTANT: Preserve the detailed description from Step 3 - it contains specific visual details!
    let basePrompt = event.imagePrompt;
    
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
      basePrompt = basePrompt.replace(pattern, '');
    });
    
    // Check if this is a good, detailed prompt (contains specific visual details)
    const hasSpecificDetails = basePrompt.toLowerCase().includes('showing') ||
      basePrompt.toLowerCase().includes('with') ||
      basePrompt.toLowerCase().includes('during') ||
      basePrompt.toLowerCase().includes('at ') ||
      basePrompt.toLowerCase().includes('gestation') ||
      basePrompt.toLowerCase().includes('process of') ||
      basePrompt.length > 60;
    
    // If it's a good detailed prompt, preserve it as-is (just add style prefix if needed)
    if (hasSpecificDetails) {
      // Check for famous people and make safe (only if timeline includes people)
      if (includesPeople && (containsFamousPerson(basePrompt) || containsFamousPerson(event.title))) {
        basePrompt = makePromptSafeForFamousPeople(basePrompt, imageStyle);
        const safeStyle = getSafeStyleForFamousPeople(imageStyle);
        if (safeStyle !== imageStyle && !basePrompt.toLowerCase().includes(safeStyle.toLowerCase())) {
          prompt = `${safeStyle} style: ${basePrompt}`;
        } else {
          prompt = basePrompt;
        }
      } else {
        // For non-people content, just ensure style is present
        if (!basePrompt.toLowerCase().includes(imageStyle.toLowerCase())) {
          prompt = `${imageStyle} style: ${basePrompt}`;
        } else {
          prompt = basePrompt;
        }
      }
    } else {
      // If prompt is too generic, fall through to rebuilding logic below
      prompt = '';
    }
  } else {
    // Build from scratch using event title and description directly
    // Use the FULL description to ensure accuracy, not just first 15 words
    
    // Start with the event title as the main subject
    let visualDescription = event.title;
    
    // Use the full description to build a comprehensive, accurate prompt
    if (event.description) {
      // Use the full description (or at least more of it) to ensure accuracy
      // For medical/scientific/technical content, we need the full context
      const fullDescription = event.description.trim();
      visualDescription = `${event.title}: ${fullDescription}`;
    }
    
    // Build base prompt
    const yearContext = event.year ? `, historical period ${event.year}` : '';
    let basePrompt = `${imageStyle} style: ${visualDescription}${yearContext}`;
    
    // Check for famous people and make safe (only if timeline includes people)
    if (includesPeople && (containsFamousPerson(visualDescription) || containsFamousPerson(event.title))) {
      basePrompt = makePromptSafeForFamousPeople(basePrompt, imageStyle);
      const safeStyle = getSafeStyleForFamousPeople(imageStyle);
      if (safeStyle !== imageStyle) {
        basePrompt = basePrompt.replace(new RegExp(imageStyle, 'gi'), safeStyle);
      }
    }
    
    prompt = basePrompt;
  }
  
  // Always ensure the prompt centers the subject from title and description
  // Abstract prompts often describe scenes, charts, screens, or artistic interpretations instead of the actual subject
  // Examples of abstract: "Illustration of a chart", "screen showing", "displaying", "presenting"
  // We want: "A detailed image of a fetus at 4 weeks showing neural tube formation"
  const promptIsAbstract = event.imagePrompt && (
    event.imagePrompt.toLowerCase().includes('illustration of a') ||
    event.imagePrompt.toLowerCase().includes('illustration of an') ||
    event.imagePrompt.toLowerCase().includes('chart') ||
    event.imagePrompt.toLowerCase().includes('screen showing') ||
    event.imagePrompt.toLowerCase().includes('displaying') ||
    event.imagePrompt.toLowerCase().includes('presenting') ||
    event.imagePrompt.toLowerCase().includes('video frame') ||
    event.imagePrompt.toLowerCase().includes('monitor showing') ||
    event.imagePrompt.toLowerCase().includes('computer screen') ||
    (event.imagePrompt.toLowerCase().startsWith('minimalist') && 
     !event.imagePrompt.toLowerCase().includes(event.title.toLowerCase().split(' ')[0]))
  );

  // Check if the existing prompt is already good (contains specific subject details, not just title)
  // Good prompts: "A detailed illustration of a zygote showing the fusion of sperm and egg with visible pronuclei"
  // Bad prompts: "Illustration of a chart showing development" or just the title
  const promptIsGood = event.imagePrompt && 
    !promptIsAbstract &&
    (event.imagePrompt.toLowerCase().includes('showing') ||
     event.imagePrompt.toLowerCase().includes('with') ||
     event.imagePrompt.toLowerCase().includes('during') ||
     event.imagePrompt.toLowerCase().includes('at ') ||
     event.imagePrompt.toLowerCase().includes('gestation') ||
     event.imagePrompt.toLowerCase().includes('process of') ||
     event.imagePrompt.length > 60); // Longer prompts usually have more detail

  // If prompt is abstract or doesn't exist, rebuild it to center the actual subject
  // The goal is to show the SUBJECT at this specific stage/moment, not charts/screens/abstract representations
  // BUT: If the prompt is already good and specific, preserve it!
  // CRITICAL: Skip this logic if anchorStyle is provided (we've already handled it above)
  if (!anchorStyle && (promptIsAbstract || !event.imagePrompt) && !includesPeople && !promptIsGood) {
    // Extract the core subject from the title (remove meta words like "Updated", "Released", "Published")
    const titleWords = event.title.split(' ');
    const coreSubject = titleWords.filter(word => 
      !['updated', 'released', 'published', 'launched', 'created', 'announced', 'draft', 'of', 'the', 'first', 'second', 'third'].includes(word.toLowerCase())
    ).join(' ').trim();
    
    // Build direct subject description - show the subject at this specific stage
    let directSubject = coreSubject;
    
    if (event.description) {
      // Extract key content from description, focusing on what the subject looks like at this stage
      // Remove meta descriptions about "released", "updated", etc.
      // Focus on the actual state/condition/appearance of the subject
      const descWords = event.description
        .split(' ')
        .filter(word => !['released', 'updated', 'published', 'launched', 'offering', 'allowing', 'debuts', 'is', 'are', 'the', 'a', 'an'].includes(word.toLowerCase()))
        .slice(0, 30)
        .join(' ');
      
      // If description contains stage/age/time info (e.g., "4 weeks", "week 4", "at 25 weeks"), include it
      const stageMatch = event.description.match(/(\d+\s*(?:weeks?|months?|days?|years?|stages?|phases?))/i);
      if (stageMatch) {
        directSubject = `${coreSubject} at ${stageMatch[1]}: ${descWords}`;
      } else {
        directSubject = `${coreSubject}: ${descWords}`;
      }
    }
    
    // Replace with a direct, subject-centered prompt that shows the subject at this stage
    prompt = `${imageStyle} style: A detailed image of ${directSubject}`;
  } else if (event.imagePrompt && !includesPeople) {
    // If the prompt is already good and specific, preserve it (just add style if needed)
    if (promptIsGood && !prompt.toLowerCase().includes(imageStyle.toLowerCase())) {
      // Just prepend the style, don't rebuild the whole prompt
      prompt = `${imageStyle} style: ${event.imagePrompt || event.title}`;
    } else if (promptIsAbstract || !prompt.toLowerCase().includes(event.title.toLowerCase().split(' ')[0])) {
      // Rebuild to center on subject
      const titleWords = event.title.split(' ');
      const coreSubject = titleWords.filter(word => 
        !['updated', 'released', 'published', 'launched', 'created', 'announced'].includes(word.toLowerCase())
      ).join(' ').trim();
      
      const stageMatch = event.description?.match(/(\d+\s*(?:weeks?|months?|days?|years?|stages?|phases?))/i);
      const subjectDesc = stageMatch 
        ? `${coreSubject} at ${stageMatch[1]}`
        : coreSubject;
      
      prompt = `${imageStyle} style: A detailed image of ${subjectDesc}${event.description ? `: ${event.description.split(' ').slice(0, 25).join(' ')}` : ''}`;
    }
    // If prompt is good and already has style, use it as-is
  } else {
    // For people content, use existing logic
    prompt += `. CRITICAL: Accurately depict the specific event: ${event.title}`;
  }
  
  if (event.description && !includesPeople && !prompt.includes(event.description.substring(0, 30))) {
    // Add description context, but keep it focused on showing the subject
    prompt += `. Show: ${event.description}`;
  }
  
  // Add theme color as a subtle accent (if provided and not default blue)
  // Use it as a subtle motif, not the dominant color
  if (themeColor && themeColor !== '#3B82F6' && colorName !== 'thematic color') {
    prompt += `. Use ${colorName} as a subtle accent color or lighting tone - not dominant, but as a thematic element`;
  }
  
  // Add style-specific visual language
  prompt += `. ${styleVisualLanguage}`;
  
  // Add historical period context if year is available
  if (event.year) {
    const century = Math.floor(event.year / 100) + 1;
    prompt += `. ${century}th century period detail, historically accurate`;
  }
  
  // Add composition guidance (concise)
  prompt += `. Balanced composition, centered focal point, clear visual storytelling`;
  
  // Add series consistency instructions - images should look like they belong to the same photographic/documentary series
  // Since the model can't see other images, we need to specify the exact visual style to maintain
  // Use a consistent, documentary-style approach that works for progression timelines
  prompt += `. SERIES CONSISTENCY: Use a consistent documentary photography style: soft, even lighting from above (like a medical/scientific photograph), neutral background (white or light gray), centered subject composition, same scale and magnification level, clinical/educational aesthetic. Maintain this exact visual approach across all images in the series - same lighting direction, same background color, same composition style, same level of detail. Images should look like they were photographed in the same scientific documentation session`;
  
  // Add person matching instructions when reference images are provided AND timeline includes people
  // These instructions are critical for accurate person matching with Imagen
  // Place BEFORE text instructions so they have more weight
  if (includesPeople && hasReferenceImage && imageReferences && imageReferences.length > 0) {
    const personNames = extractPersonNames(imageReferences);
    if (personNames.length > 0) {
      // CRITICAL: Ensure the prompt uses FULL person names, not just last names
      // Replace instances of just last names with full names in the prompt
      personNames.forEach(personName => {
        const nameParts = personName.split(' ');
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          const promptLower = prompt.toLowerCase();
          const personNameLower = personName.toLowerCase();
          
          // Check if full name is already in prompt
          if (promptLower.includes(personNameLower)) {
            // Full name is present - good!
            return;
          }
          
          // Replace standalone last name with full name (case-insensitive, word boundary)
          // This handles cases like "Wonder on stage" -> "Stevie Wonder on stage"
          // IMPORTANT: Use a more specific regex that doesn't match if the full name is already nearby
          // e.g., don't replace "Wonder" in "Stevie Wonder" but do replace standalone "Wonder"
          const fullNameRegex = new RegExp(`\\b${firstName}\\s+${lastName}\\b`, 'gi');
          const lastNameRegex = new RegExp(`\\b${lastName}\\b`, 'gi');
          
          // Only replace if full name isn't already present nearby
          if (!prompt.match(fullNameRegex)) {
            if (prompt.match(lastNameRegex)) {
              prompt = prompt.replace(lastNameRegex, personName);
              console.log(`[ImageGen] Replaced "${lastName}" with "${personName}" in prompt`);
            }
          }
          
          // Also check for first name only and replace with full name
          const firstNameRegex = new RegExp(`\\b${firstName}\\b`, 'gi');
          if (prompt.match(firstNameRegex) && !promptLower.includes(personNameLower)) {
            prompt = prompt.replace(firstNameRegex, personName);
            console.log(`[ImageGen] Replaced "${firstName}" with "${personName}" in prompt`);
          }
          
          // If person still isn't mentioned at all, add them explicitly
          if (!promptLower.includes(personNameLower)) {
            // Try to add after style prefix or at the start of the main description
            // Look for pattern like "Watercolor style: Wonder on stage" -> "Watercolor style: Stevie Wonder on stage"
            const stylePrefixRegex = /(Watercolor|Illustration|Minimalist|Photorealistic|Sketch|Vintage|3D Render|Abstract)\s+style:\s*/i;
            if (prompt.match(stylePrefixRegex)) {
              // Add person name right after style prefix
              prompt = prompt.replace(stylePrefixRegex, `$1 style: ${personName} `);
              console.log(`[ImageGen] Added "${personName}" after style prefix`);
            } else {
              // Add at the beginning if no style prefix
              prompt = `${personName} ${prompt}`;
              console.log(`[ImageGen] Added "${personName}" at the start of prompt`);
            }
          }
        }
      });
      
      // Add specific person matching instructions - make them VERY prominent
      // Explicitly preserve hair color, skin tone, and all physical attributes
      const isMultiplePeople = personNames.length > 1;
      if (isMultiplePeople) {
        // For multiple people, be VERY explicit about showing all of them in a SINGLE unified scene (not a grid)
        prompt += `. CRITICAL: Show ${personNames.length} DISTINCT people: ${personNames.join(', ')} together in a SINGLE unified scene. Each person must be clearly visible and recognizable in the same image. Do NOT create grids, panels, or separate images. Do NOT merge or combine their features. Each person must have their own distinct appearance matching their reference image. `;
        prompt += `CRITICAL PERSON MATCHING FOR EACH PERSON: Match the exact appearance of ${personNames.join(' and ')} from their reference images. For each person, PRESERVE EXACT HAIR COLOR from their reference - if reference has black hair, generate black hair (NOT grey, NOT white, NOT brown). PRESERVE EXACT SKIN TONE from reference. PRESERVE EXACT FACIAL FEATURES, eye color, hair style, facial hair, and all physical characteristics for EACH person. DO NOT alter hair color, skin tone, or any physical attributes. Each person must match their facial structure, distinctive features, and recognizable characteristics exactly. Show all ${personNames.length} people together in one unified scene, not in separate panels or grids`;
      } else {
        // Single person - simpler instructions
        prompt += `. CRITICAL PERSON MATCHING: Match the exact appearance of ${personNames[0]} from the reference image. PRESERVE EXACT HAIR COLOR from reference - if reference has black hair, generate black hair (NOT grey, NOT white, NOT brown). PRESERVE EXACT SKIN TONE from reference. PRESERVE EXACT FACIAL FEATURES, eye color, hair style, facial hair, and all physical characteristics. DO NOT alter hair color, skin tone, or any physical attributes. Match facial structure, distinctive features, and recognizable characteristics exactly. Maintain these exact physical attributes while adapting to the scene context and style`;
      }
    } else {
      // Generic person matching instruction if names can't be extracted
      prompt += `. CRITICAL PERSON MATCHING: Match the exact person's appearance from the reference image. PRESERVE EXACT HAIR COLOR from reference - if reference has black hair, generate black hair (NOT grey, NOT white). PRESERVE EXACT SKIN TONE from reference. PRESERVE EXACT FACIAL FEATURES, eye color, hair style, and all physical characteristics. DO NOT alter hair color, skin tone, or any physical attributes. Maintain accurate facial structure, distinctive characteristics, and physical appearance exactly as shown in reference`;
    }
  }
  
  // Add text handling instructions - always minimize text
  if (needsText) {
    // When text is needed, limit to essential text only (headlines, signs)
    prompt += `. Minimal text - only essential headlines or signs if needed. Keep text brief and clear`;
  } else {
    // For most images, avoid all text
    prompt += `. No text, no words, no written content, no labels. Pure visual scene without any readable text or letters`;
  }
  
  // Note: Reference images are now handled separately via direct image input
  // Don't include URLs in prompt when using image-to-image
  
  // Model prompt limits:
  // - SDXL (used for Illustration, Watercolor, Sketch, etc.): ~77 tokens (~400-500 characters on Replicate)
  // - Imagen 4 Fast: 480 tokens (~1,900 characters)
  // - Flux models: ~200 tokens (~1,000 characters)
  // Use 1,500 chars as a safe limit that works across all models
  // This ensures person matching instructions and detailed descriptions aren't cut off
  return prompt.substring(0, 1500).trim();
}

// Helper to wait for Replicate prediction to complete
async function waitForPrediction(predictionId: string, replicateApiKey: string): Promise<string | null> {
  const maxAttempts = 180; // 3 minutes max (180 * 1 second)
  let attempts = 0;
  // Adaptive polling: start fast (1s), slow down if taking long (2s after 30 attempts)
  const getPollInterval = (attempt: number) => attempt < 30 ? 1000 : 2000;

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

    // Adaptive polling: faster at start, slower if taking long
    const pollInterval = getPollInterval(attempts);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Prediction timeout - image generation took too long');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, imageStyle = 'photorealistic', themeColor = '#3B82F6', imageReferences = [], referencePhoto, includesPeople = true, anchorStyle } = body;
    
    // Log Anchor status for debugging
    if (anchorStyle) {
      console.log(`[ImageGen] Anchor style provided: ${anchorStyle.substring(0, 100)}...`);
    } else {
      console.log(`[ImageGen] No Anchor style provided`);
    }

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

    // Detect which events need text in images
    const eventsWithTextNeeds = events.map(event => ({
      event,
      needsText: expectsTextInImage(event)
    }));
    
    const textNeededCount = eventsWithTextNeeds.filter(e => e.needsText).length;
    if (textNeededCount > 0) {
      console.log(`[ImageGen] ${textNeededCount} of ${events.length} events require text in images - will use text-capable models`);
    }
    
    // Add user-provided reference photo if available
    let finalImageReferences = imageReferences && imageReferences.length > 0 ? [...imageReferences] : [];
    
    console.log(`[ImageGen] Initial state: includesPeople=${includesPeople}, provided imageReferences=${imageReferences?.length || 0}, finalImageReferences=${finalImageReferences.length}`);
    
    // Add reference photo if provided and valid
    if (referencePhoto && referencePhoto.url && referencePhoto.personName && referencePhoto.hasPermission) {
      console.log(`[ImageGen] Using user-provided reference photo for ${referencePhoto.personName}`);
      finalImageReferences.push({
        name: referencePhoto.personName,
        url: referencePhoto.url,
      });
    }
    
    if (finalImageReferences.length === 0 && includesPeople) {
      console.log(`[ImageGen] ✓ includesPeople=true and no reference images provided - will fetch reference images from events`);
      try {
        console.log(`[ImageGen] No reference images provided - extracting person names from events (style: ${imageStyle})...`);
        
        // Extract person names from all events
        const allPeople = new Map<string, {name: string, search_query: string}>();
        for (const event of events) {
          try {
            console.log(`[ImageGen] Extracting names from event: "${event.title}"`);
            const people = await extractPersonNamesFromEvent(event);
            console.log(`[ImageGen] Extracted ${people.length} person(s) from "${event.title}": ${people.map(p => p.name).join(', ')}`);
            people.forEach(person => {
              // Use name as key to avoid duplicates
              if (!allPeople.has(person.name.toLowerCase())) {
                allPeople.set(person.name.toLowerCase(), person);
              }
            });
          } catch (extractError: any) {
            console.error(`[ImageGen] Error extracting names from event "${event.title}":`, extractError.message);
            console.error(`[ImageGen] Extract error stack:`, extractError.stack);
            // Continue with other events
          }
        }
        
        const peopleArray = Array.from(allPeople.values());
        console.log(`[ImageGen] Total unique people extracted: ${peopleArray.length} - ${peopleArray.map(p => `${p.name} (query: ${p.search_query})`).join(', ')}`);
        
        if (peopleArray.length > 0) {
          // Fetch reference images for all people
          try {
            console.log(`[ImageGen] Starting to fetch reference images for ${peopleArray.length} person(s)...`);
            const startTime = Date.now();
            const fetchedReferences = await fetchReferenceImagesForPeople(peopleArray);
            const fetchTime = Date.now() - startTime;
            console.log(`[ImageGen] Reference image fetch completed in ${fetchTime}ms`);
            
            if (fetchedReferences.length > 0) {
              finalImageReferences = fetchedReferences;
              console.log(`[ImageGen] ✓ Successfully fetched ${fetchedReferences.length} reference image(s):`, fetchedReferences.map(r => `${r.name}: ${r.url.substring(0, 60)}...`).join(', '));
            } else {
              console.warn(`[ImageGen] ⚠ No reference images found for ${peopleArray.length} person(s) after ${fetchTime}ms`);
            }
          } catch (fetchError: any) {
            console.error('[ImageGen] ✗ Error fetching reference images:', fetchError.message);
            console.error('[ImageGen] Fetch error stack:', fetchError.stack);
            // Continue without reference images
          }
        } else {
          console.log('[ImageGen] No famous people detected in events');
        }
      } catch (error: any) {
        console.error('[ImageGen] ✗ Error in person extraction/image fetching:', error.message);
        console.error('[ImageGen] Error stack:', error.stack);
        // Continue without reference images - don't fail the whole request
      }
    } else {
      if (finalImageReferences.length > 0) {
        console.log(`[ImageGen] Using provided ${finalImageReferences.length} reference image(s)`);
      } else if (!includesPeople) {
        console.log(`[ImageGen] ⚠️ includesPeople=false - skipping reference image fetching. If timeline includes people, enable the "includesPeople" toggle.`);
      } else {
        console.log(`[ImageGen] ⚠️ includesPeople=true but no reference images were fetched (check logs above for extraction/fetch errors)`);
      }
    }
    
    const hasReferenceImages = finalImageReferences && finalImageReferences.length > 0;
    
    // Get style-specific visual language for cohesion
    const styleVisualLanguage = STYLE_VISUAL_LANGUAGE[imageStyle] || STYLE_VISUAL_LANGUAGE['Illustration'];
    
    // Prepare reference images for Replicate if available (one per event, or use first available)
    // Filter out invalid URLs (categories, articles, non-image URLs)
    const validImageReferences = finalImageReferences && finalImageReferences.length > 0
      ? finalImageReferences.filter((ref: { name: string; url: string }) => {
          // Must have a valid URL
          if (!ref.url || typeof ref.url !== 'string') return false;
          
          // Accept direct image URLs (upload.wikimedia.org, etc.)
          if (ref.url.includes('upload.wikimedia.org')) return true;
          
          // Accept Wikimedia page URLs that can be converted
          if (ref.url.includes('commons.wikimedia.org/wiki/File:')) return true;
          
          // Accept other direct image URLs with image extensions
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const hasImageExtension = imageExtensions.some(ext => ref.url.toLowerCase().includes(ext));
          if (hasImageExtension && (ref.url.startsWith('http://') || ref.url.startsWith('https://'))) {
            return true;
          }
          
          // Reject category pages, article pages, etc.
          if (ref.url.includes('/Category:') || ref.url.includes('/wiki/') && !ref.url.includes('/File:')) {
            return false;
          }
          
          return false;
        })
      : [];
    
    console.log(`[ImageGen] Filtered ${validImageReferences.length}/${finalImageReferences?.length || 0} valid image references`);
    
    // Prepare reference images with error handling
    let preparedReferences: (string | null)[] = [];
    if (validImageReferences.length > 0) {
      try {
        const referenceImagePromises = validImageReferences.slice(0, events.length).map(async (ref: { name: string; url: string }) => {
          try {
            return await prepareImageForReplicate(ref.url, replicateApiKey);
          } catch (error: any) {
            console.error(`[ImageGen] Error preparing reference image for ${ref.name}:`, error.message);
            return null;
          }
        });
        preparedReferences = await Promise.all(referenceImagePromises);
        console.log(`[ImageGen] Prepared ${preparedReferences.filter(r => r !== null).length}/${validImageReferences.length} reference images for Replicate`);
      } catch (error: any) {
        console.error('[ImageGen] Error preparing reference images:', error.message);
        preparedReferences = [];
      }
    }
    
    // Check if we actually have successfully prepared reference images (not just attempted)
    const hasPreparedReferences = preparedReferences.some(ref => ref !== null && ref.length > 0);
    console.log(`[ImageGen] Has prepared reference images: ${hasPreparedReferences} (${preparedReferences.filter(r => r !== null).length} successful)`);
    
    // PARALLEL GENERATION: Start all predictions at once for faster processing
    console.log(`[ImageGen] Starting parallel generation for ${events.length} images...`);
    
        // Step 1: Create all predictions in parallel
    const predictionPromises = eventsWithTextNeeds.map(async ({ event, needsText }, index) => {
      // Define prompt at function scope so it's accessible in catch block
      let prompt: string = '';
      let isFacelessMannequin = false;
      
      try {
        // Select model based on style and text needs
        let selectedModel = getModelForStyle(imageStyle, needsText);
        
        // CRITICAL: SDXL fails with 403 errors when Replicate tries to fetch Wikimedia URLs
        // Use cheaper IP-Adapter for artistic styles, Flux Kontext Pro for photorealistic
        const originalModel = selectedModel;
        const isSDXL = selectedModel === MODELS.ARTISTIC || 
                       selectedModel.includes('sdxl') || 
                       selectedModel === "stability-ai/sdxl" ||
                       selectedModel.includes('stability-ai/sdxl');
        const isArtistic = isSDXL || selectedModel === MODELS.ARTISTIC;
        const isPhotorealistic = selectedModel === MODELS.PHOTOREALISTIC || selectedModel.includes('flux-dev');
        
        if (hasReferenceImages) {
          // For SDXL with reference images, use IP-Adapter (SDXL + IP-Adapter)
          // This is cheaper than Flux Kontext Pro and works well with SDXL
          if (isSDXL || isArtistic) {
            selectedModel = MODELS.ARTISTIC_WITH_REF; // IP-Adapter (SDXL + IP-Adapter)
            console.log(`[ImageGen] ✓ Switching from ${originalModel} to IP-Adapter (SDXL with reference images, $0.002-0.005/image)`);
          } else if (selectedModel.includes('flux') && !selectedModel.includes('kontext')) {
            // Fallback for other flux models
            selectedModel = "black-forest-labs/flux-kontext-pro";
            console.log(`[ImageGen] ✓ Switching from ${originalModel} to Flux Kontext Pro (with reference images, $0.04/image)`);
          }
        } else {
          // No reference images - SDXL is the default for all styles
          if (isSDXL) {
            console.log(`[ImageGen] Using SDXL (${selectedModel}) - default model for all styles`);
          }
        }
        
        // Get model version for this specific event
        let modelVersion: string;
        try {
          modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
          console.log(`[ImageGen] Using model version: ${modelVersion} for "${event.title}" with model ${selectedModel}`);
          
          // Validate model version format (should be a hash or model name)
          if (!modelVersion || (modelVersion.length < 10 && !modelVersion.includes('/'))) {
            console.warn(`[ImageGen] Invalid model version format: ${modelVersion}, using model name directly`);
            modelVersion = selectedModel;
          }
        } catch (versionError: any) {
          console.error(`[ImageGen] Error getting model version for ${selectedModel}:`, versionError.message);
          console.error(`[ImageGen] Version error stack:`, versionError.stack);
          // Use model name as fallback instead of throwing
          console.warn(`[ImageGen] Falling back to using model name directly: ${selectedModel}`);
          modelVersion = selectedModel;
        }
        
        if (needsText) {
          console.log(`[ImageGen] Event "${event.title}" needs text - using ${selectedModel} (better text rendering)`);
        }
        
        // Get reference image URL for this event (use first available, or cycle through if multiple events)
        let referenceImageUrl = preparedReferences[index] || preparedReferences[0] || null;
        const hasReferenceImage = !!referenceImageUrl;
        
        if (hasReferenceImage && referenceImageUrl) {
          console.log(`[ImageGen] ✓ Reference image URL for "${event.title}" (index ${index}): ${referenceImageUrl.substring(0, 80)}...`);
          console.log(`[ImageGen] Reference image will be INJECTED into model input for this event`);
          
          // Upload to Replicate ONLY if using SDXL (which has 403 errors with Wikimedia)
          // Skip for Imagen which can fetch Wikimedia URLs directly
          const isSDXL = selectedModel.includes('sdxl') || selectedModel === MODELS.ARTISTIC;
          if (isSDXL && referenceImageUrl.includes('wikimedia.org')) {
            console.log(`[ImageGen] SDXL detected - uploading Wikimedia image to Replicate...`);
            const uploadedUrl = await uploadImageToReplicate(referenceImageUrl, replicateApiKey);
            if (uploadedUrl) {
              referenceImageUrl = uploadedUrl;
              console.log(`[ImageGen] ✓ Using uploaded Replicate URL for SDXL`);
            } else {
              console.warn(`[ImageGen] Upload failed, SDXL may have 403 errors with direct Wikimedia URL`);
            }
          }
        } else {
          console.log(`[ImageGen] ⚠️ No reference image available for "${event.title}" (prepared: ${preparedReferences.length}, index: ${index})`);
          console.log(`[ImageGen] Prepared references: ${preparedReferences.map((r, i) => `[${i}]: ${r ? '✓' : '✗'}`).join(', ')}`);
        }
        
        // Build enhanced prompt with AI-generated prompt (if available), style, color, and cohesion
        // Include person matching instructions when reference images are provided
        prompt = buildImagePrompt(
          event, 
          imageStyle, 
          themeColor, 
          styleVisualLanguage, 
          needsText,
          finalImageReferences,
          hasReferenceImage,
          includesPeople,
          anchorStyle // Pass Anchor if available
        );
        
        // Check if this is a faceless mannequin prompt (after prompt is built)
        isFacelessMannequin = event.imagePrompt?.toLowerCase().includes('faceless') || 
                               event.imagePrompt?.toLowerCase().includes('mannequin') ||
                               prompt.toLowerCase().includes('faceless') ||
                               prompt.toLowerCase().includes('mannequin');
        
        if (isFacelessMannequin) {
          console.log(`[ImageGen] ✓ Detected faceless mannequin prompt - adding negative prompts to prevent faces`);
        }
        
        // Log the prompt being sent (for debugging)
        console.log(`[ImageGen] Creating prediction ${index + 1}/${events.length} for "${event.title}"${referenceImageUrl ? ' with reference image' : ' (text only)'}`);
        console.log(`[ImageGen] Full prompt for "${event.title}":`, prompt);
        console.log(`[ImageGen] Prompt length: ${prompt.length} characters`);
        console.log(`[ImageGen] includesPeople: ${includesPeople}, hasReferenceImage: ${hasReferenceImage}`);
        if (hasReferenceImage) {
          const personNames = extractPersonNames(finalImageReferences);
          console.log(`[ImageGen] Person matching enabled for: ${personNames.join(', ') || 'person in reference image'}`);
        }
        
        // Build input - structure varies by model (for Replicate models)
        const input: any = {
          prompt: prompt,
        };
        
        // Model-specific parameters
        if (selectedModel.includes('ip-adapter') || selectedModel === MODELS.ARTISTIC_WITH_REF) {
          // IP-Adapter (SDXL + IP-Adapter) - cheap option for artistic styles with reference images
          input.prompt = prompt;
          input.num_outputs = 1;
          input.guidance_scale = 7.5;
          input.num_inference_steps = 25; // Reduced from 30 for faster generation (minimal quality impact)
          
          if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.length > 0) {
            if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
              input.image = referenceImageUrl;
              input.ip_adapter_scale = 0.75; // Control strength of reference image (0.5-1.0)
              console.log(`[ImageGen] Using reference image with IP-Adapter (scale: 0.75, $0.002-0.005/image)`);
            } else {
              console.warn(`[ImageGen] Invalid reference image URL format for IP-Adapter: ${referenceImageUrl.substring(0, 50)}`);
            }
          } else {
            console.log(`[ImageGen] No valid reference image for IP-Adapter, generating without reference`);
          }
          
          // Add negative prompt for artistic styles
          // Prevent grids, panels, multiple images, text, brand names, logos
          // If faceless mannequin, also prevent faces
          const baseNegativePrompt = "text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, brand names, company names, logos, Netflix, Amazon, Google, Apple, Microsoft, Facebook, Twitter, Instagram, YouTube, Disney, HBO, CNN, BBC, CBS, NBC, ABC, ESPN, service names, streaming services, platform logos, trademark symbols, copyright symbols, registered trademarks, brand logos, company logos, corporate logos, product logos, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage";
          const facelessNegativePrompt = isFacelessMannequin ? ", face, faces, facial features, eyes, nose, mouth, facial expression, human face, person face, recognizable face, detailed face, portrait, facial details, eyebrows, lips, facial hair, facial structure" : "";
          if (!needsText) {
            input.negative_prompt = baseNegativePrompt + facelessNegativePrompt;
          }
        } else if (selectedModel.includes('imagen')) {
          // Google Imagen 4 Fast - supports image input for image-to-image
          // Note: This is only used if explicitly selected, not as default
          input.prompt = prompt;
          
          // Disable prompt rewriting for better person matching control
          // enhancePrompt can interfere with specific person matching instructions
          input.enhancePrompt = false;
          
          // Add negative prompt for Imagen - prevent text, brand names, logos, and faces if needed
          const imagenNegativeParts: string[] = [];
          if (!needsText) {
            imagenNegativeParts.push("text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, brand names, company names, logos, Netflix, Amazon, Google, Apple, Microsoft, Facebook, Twitter, Instagram, YouTube, Disney, HBO, CNN, BBC, CBS, NBC, ABC, ESPN, service names, streaming services, platform logos, trademark symbols, copyright symbols, registered trademarks, brand logos, company logos, corporate logos, product logos");
          }
          if (isFacelessMannequin) {
            imagenNegativeParts.push("face, faces, facial features, eyes, nose, mouth, facial expression, human face, person face, recognizable face, detailed face, portrait, facial details, eyebrows, lips, facial hair, facial structure");
          }
          imagenNegativeParts.push("grid, grids, multiple images, image grid, panel, panels");
          if (imagenNegativeParts.length > 0) {
            input.negative_prompt = imagenNegativeParts.join(", ");
          }
          
          if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.length > 0) {
            if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
              input.image = referenceImageUrl;
              // Note: Imagen 4 Fast on Replicate doesn't document a 'strength' parameter
              // The model uses the reference image automatically when provided
              console.log(`[ImageGen] ✓ INJECTING reference image into Google Imagen 4 Fast for "${event.title}" (URL: ${referenceImageUrl.substring(0, 80)}..., enhancePrompt: false for better person matching, $0.02/image)`);
            } else {
              console.warn(`[ImageGen] Invalid reference image URL format for Google Imagen: ${referenceImageUrl.substring(0, 50)}`);
            }
          } else {
            console.log(`[ImageGen] ⚠️ NO reference image for "${event.title}" - using Google Imagen 4 Fast without reference image`);
          }
          console.log(`[ImageGen] Using Google Imagen 4 Fast parameters (prompt length: ${prompt.length} chars)`);
        } else if (selectedModel.includes('flux-kontext-pro')) {
          // Flux Kontext Pro supports reference images
          input.num_outputs = 1;
          input.guidance_scale = 3.5;
          input.num_inference_steps = 28;
          
          if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.length > 0) {
            // Validate the URL is actually a valid image URL
            if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
              input.image = referenceImageUrl;
              input.prompt_strength = 0.75;
              input.strength = 0.75;
              console.log(`[ImageGen] Using reference image with Flux Kontext Pro (strength: 0.75)`);
            } else {
              console.warn(`[ImageGen] Invalid reference image URL format for Flux Kontext Pro: ${referenceImageUrl.substring(0, 50)}`);
            }
          } else {
            console.log(`[ImageGen] No valid reference image for Flux Kontext Pro, generating without reference`);
          }
        } else if (selectedModel.includes('flux')) {
          // Other Flux models (Flux Dev, Flux Pro) don't support direct image input
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
            input.prompt_strength = 0.75; // Balanced for person matching
            input.strength = 0.75;
            console.log(`[ImageGen] Using reference image with SD 3.5 (strength: 0.75)`);
          }
        } else {
          // SDXL and similar models
          input.num_outputs = 1;
          input.guidance_scale = 7.5;
          input.num_inference_steps = 25; // Reduced from 30 for faster generation (minimal quality impact)
          
          // Add negative prompt for SDXL - strongly discourage text in all cases
          // Most images should be pure visual without any text
          // Also prevent grids, panels, multiple images, comic strips
          // If faceless mannequin, also prevent faces
          const baseNegativeSDXL = !needsText 
            ? "text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, announcements, posters with text, billboards, newspapers, documents, books, magazines, readable text, legible text, alphabet, numbers, digits, characters, symbols, written language, printed text, handwriting, calligraphy, inscriptions, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage"
            : "excessive text, too much text, text blocks, paragraphs, multiple lines of text, small text, tiny text, blurry text, misspelled words, garbled text, unreadable text, text errors, wrong spelling, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage";
          const facelessNegativeSDXL = isFacelessMannequin ? ", face, faces, facial features, eyes, nose, mouth, facial expression, human face, person face, recognizable face, detailed face, portrait, facial details, eyebrows, lips, facial hair, facial structure" : "";
          input.negative_prompt = baseNegativeSDXL + facelessNegativeSDXL;
          
          // Add reference image if available (for image-to-image transformation)
          // SDXL supports direct image input via 'image' parameter (URL from Replicate)
          if (referenceImageUrl) {
            input.image = referenceImageUrl;
            // Higher prompt_strength (0.7-0.85) for better person matching while allowing scene adaptation
            // Lower values (0.5-0.7) preserve more of reference, higher (0.8-0.9) allow more transformation
            input.prompt_strength = 0.75; // Balanced: maintain person likeness while adapting to scene
            input.strength = 0.75; // Additional strength parameter for some models
            console.log(`[ImageGen] Using reference image for image-to-image transformation with person matching (strength: 0.75)`);
          }
        }
        
        // Create prediction via Replicate
        console.log(`[ImageGen] Creating Replicate prediction for "${event.title}" with model ${selectedModel}, version ${modelVersion}`);
        console.log(`[ImageGen] Input parameters:`, JSON.stringify({
          ...input,
          prompt: input.prompt?.substring(0, 100) + '...',
          image: input.image ? input.image.substring(0, 80) + '...' : undefined
        }, null, 2));
        
        // Create the prediction with a generous timeout for production environment
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        try {
          const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${replicateApiKey}`,
              'Content-Type': 'application/json',
              'Connection': 'keep-alive', // Maintain connection for slower networks
            },
            body: JSON.stringify(
              // If modelVersion is a hash (version ID), use version field
              // If modelVersion is a model name (contains '/'), use model field
              modelVersion.includes('/') || modelVersion.length < 20
                ? { model: modelVersion, input: input }
                : { version: modelVersion, input: input }
            ),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!createResponse.ok) {
            clearTimeout(timeoutId);
            const errorText = await createResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { detail: errorText };
            }
            
            const errorMsg = errorData.detail || errorData.message || errorText;
            console.error(`[ImageGen] ✗ Replicate API error for "${event.title}" (${createResponse.status}):`, errorMsg);
            console.error(`[ImageGen] Full error response:`, errorText);
            
            return { index, error: new Error(`Replicate API error (${createResponse.status}): ${errorMsg}`), event, prompt };
          }

          const prediction = await createResponse.json();
          
          if (!prediction.id) {
            return { index, error: new Error('No prediction ID returned from Replicate'), event, prompt };
          }

          return { index, predictionId: prediction.id, event, prompt };
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        console.error(`[ImageGen] Error creating prediction for "${event.title}":`, error);
        return { index, error, event, prompt: (typeof prompt === 'string' ? prompt : String(prompt || '')) };
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
    
    // Step 2: Poll all predictions in parallel, with retry for failed ones
    const MAX_RETRIES = 2; // Retry failed images up to 2 times
    
    // Helper function to wait for a prediction with retry
    const waitForPredictionWithRetry = async (
      result: { index: number; predictionId?: string; error?: Error; event: any; prompt: string; needsText?: boolean },
      attempt: number = 0
    ): Promise<{ index: number; imageUrl: string | null; error: Error | null; event: any; prompt: string }> => {
      if (result.error || !result.predictionId) {
        const errorMsg = result.error?.message || (result.error instanceof Error ? result.error.toString() : String(result.error || 'No prediction ID'));
        console.error(`[ImageGen] Skipping prediction for "${result.event.title}": ${errorMsg}`);
        return { 
          index: result.index, 
          imageUrl: null, 
          error: result.error || new Error(errorMsg), 
          event: result.event,
          prompt: (typeof result.prompt === 'string' ? result.prompt : String(result.prompt || ''))
        };
      }

      try {
        console.log(`[ImageGen] Polling prediction ${result.predictionId} for "${result.event.title}"...`);
        const imageUrl = await waitForPrediction(result.predictionId, replicateApiKey);
        console.log(`[ImageGen] Completed image ${result.index + 1}/${events.length} for "${result.event.title}": ${imageUrl ? imageUrl.substring(0, 100) + '...' : 'null'}`);
        return { 
          index: result.index, 
          imageUrl, 
          error: null, 
          event: result.event,
          prompt: (typeof result.prompt === 'string' ? result.prompt : String(result.prompt || ''))
        };
      } catch (error: any) {
        console.error(`[ImageGen] Error waiting for prediction "${result.event.title}" (ID: ${result.predictionId}, attempt ${attempt + 1}):`, error);
        
        // Retry by creating a new prediction if we haven't exceeded max retries
        if (attempt < MAX_RETRIES) {
          console.log(`[ImageGen] Retrying image generation for "${result.event.title}" (attempt ${attempt + 2}/${MAX_RETRIES + 1})...`);
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Create a new prediction (reuse the original prediction creation logic)
          // For simplicity, we'll create a new prediction with the same parameters
          try {
            const needsText = result.needsText ?? expectsTextInImage(result.event);
            let selectedModel = getModelForStyle(imageStyle, needsText);
            
            // Apply same model selection logic as original
            const isSDXL = selectedModel === MODELS.ARTISTIC || selectedModel.includes('sdxl');
            const isArtistic = isSDXL || selectedModel === MODELS.ARTISTIC;
            const isPhotorealistic = selectedModel === MODELS.PHOTOREALISTIC || selectedModel.includes('flux-dev');
            
            if (hasReferenceImages) {
              if (isArtistic || isPhotorealistic) {
                selectedModel = MODELS.PHOTOREALISTIC;
              } else if (selectedModel.includes('flux') && !selectedModel.includes('kontext')) {
                selectedModel = "black-forest-labs/flux-kontext-pro";
              }
            }
            
            const modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
            const referenceImageUrl = preparedReferences[result.index] || preparedReferences[0] || null;
            const hasReferenceImage = !!referenceImageUrl;
            
            // Rebuild prompt
            const prompt = buildImagePrompt(
              result.event,
              imageStyle,
              themeColor,
              styleVisualLanguage,
              needsText,
              finalImageReferences,
              hasReferenceImage,
              includesPeople,
              anchorStyle
            );
            
            // Build input (simplified - reuse same logic as original)
            const input: any = { prompt };
            if (selectedModel.includes('ip-adapter') || selectedModel === MODELS.ARTISTIC_WITH_REF) {
              input.num_outputs = 1;
              input.guidance_scale = 7.5;
              input.num_inference_steps = 25;
              if (referenceImageUrl) input.image = referenceImageUrl;
              if (!needsText) input.negative_prompt = "text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage";
            } else if (selectedModel.includes('imagen')) {
              // Google Imagen - only used if explicitly selected
              input.enhancePrompt = false;
              if (referenceImageUrl) input.image = referenceImageUrl;
            } else if (selectedModel.includes('flux-kontext-pro')) {
              input.num_outputs = 1;
              input.guidance_scale = 3.5;
              input.num_inference_steps = 28;
              if (referenceImageUrl) {
                input.image = referenceImageUrl;
                input.prompt_strength = 0.75;
                input.strength = 0.75;
              }
            } else if (selectedModel.includes('flux')) {
              input.num_outputs = 1;
              input.guidance_scale = 3.5;
              input.num_inference_steps = selectedModel.includes('flux-pro') ? 50 : 28;
            } else {
              // SDXL
              input.num_outputs = 1;
              input.guidance_scale = 7.5;
              input.num_inference_steps = 25;
              if (!needsText) {
                input.negative_prompt = "text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, announcements, posters with text, billboards, newspapers, documents, books, magazines, readable text, legible text, alphabet, numbers, digits, characters, symbols, written language, printed text, handwriting, calligraphy, inscriptions, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage";
              }
              if (referenceImageUrl) {
                input.image = referenceImageUrl;
                input.prompt_strength = 0.75;
                input.strength = 0.75;
              }
            }
            
            // Create new prediction
            const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
              method: 'POST',
              headers: {
                'Authorization': `Token ${replicateApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                // Use model field if modelVersion is a model name, version field if it's a version ID
                ...(modelVersion.includes('/') || modelVersion.length < 20
                  ? { model: modelVersion }
                  : { version: modelVersion }),
                input: input,
              }),
            });
            
            if (!createResponse.ok) {
              throw new Error(`Retry prediction creation failed: ${createResponse.statusText}`);
            }
            
            const newPrediction = await createResponse.json();
            if (!newPrediction.id) {
              throw new Error('No prediction ID in retry');
            }
            
            // Wait for the new prediction
            const retryResult = { ...result, predictionId: newPrediction.id, needsText };
            return waitForPredictionWithRetry(retryResult, attempt + 1);
          } catch (retryError: any) {
            console.error(`[ImageGen] Retry failed for "${result.event.title}":`, retryError.message);
            return { 
              index: result.index, 
              imageUrl: null, 
              error: error, 
              event: result.event,
              prompt: (typeof result.prompt === 'string' ? result.prompt : String(result.prompt || ''))
            };
          }
        }
        
        return { 
          index: result.index, 
          imageUrl: null, 
          error, 
          event: result.event,
          prompt: (typeof result.prompt === 'string' ? result.prompt : String(result.prompt || ''))
        };
      }
    };
    
    // Poll all predictions in parallel (with retry logic built in)
    const imagePromises = predictionResults.map(result => 
      waitForPredictionWithRetry({
        ...result,
        needsText: eventsWithTextNeeds[result.index]?.needsText
      })
    );
    
    // Wait for all images to complete (with retries)
    const imageResults = await Promise.all(imagePromises);
    
    // Step 3: Assemble results in correct order
    const images: (string | null)[] = new Array(events.length).fill(null);
    const prompts: (string | null)[] = new Array(events.length).fill(null);
    const errors: (Error | null)[] = new Array(events.length).fill(null);
    imageResults.forEach((result) => {
      images[result.index] = result.imageUrl;
      // Ensure prompt is always a string or null - explicitly convert to string
      const promptValue: string | null = typeof result.prompt === 'string' 
        ? result.prompt 
        : (result.prompt != null ? String(result.prompt) : null);
      prompts[result.index] = promptValue;
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
    return NextResponse.json({ 
      images: persistedImages,
      prompts: prompts, // Include prompts for debugging/testing
      referenceImages: finalImageReferences // Include auto-fetched reference images
    });
  } catch (error: any) {
    console.error('[ImageGen] Error generating images:', error);
    console.error('[ImageGen] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate images',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
