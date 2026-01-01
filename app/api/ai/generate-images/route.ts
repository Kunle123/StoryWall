import { NextRequest, NextResponse } from 'next/server';
import { containsFamousPerson, makePromptSafeForFamousPeople, getSafeStyleForFamousPeople } from '@/lib/utils/famousPeopleHandler';
import { persistImagesToCloudinary } from '@/lib/utils/imagePersistence';
import { generateImageWithImagen, isGoogleCloudConfigured } from '@/lib/google/imagen';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

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
// Strict name matching to avoid false positives
// Since AI-provided names are likely correct, we require strict matching
function scorePersonNameMatch(filename: string, personName: string): number {
  const filenameLower = filename.toLowerCase();
  const nameParts = personName.toLowerCase().split(/\s+/).filter((p: string) => p.length > 2); // Ignore short words like "de", "van", etc.
  
  if (nameParts.length === 0) return 0;
  
  // For single-part names, require exact match
  if (nameParts.length === 1) {
    const isExactWord = new RegExp(`\\b${nameParts[0]}\\b`).test(filenameLower);
    return isExactWord ? 10 : 0;
  }
  
  // For multi-part names, require ALL significant parts to match as exact words
  // This prevents false positives like "Mary Berry" matching "Mary (Berry) Beall"
  let allPartsMatch = true;
  let totalScore = 0;
  
  for (const part of nameParts) {
    const isExactWord = new RegExp(`\\b${part}\\b`).test(filenameLower);
    if (!isExactWord) {
      allPartsMatch = false;
      break;
    }
    // Give higher score for longer names (more specific matches)
    totalScore += part.length > 4 ? 3 : 2; // Longer names = more specific
  }
  
  // Require ALL parts to match as exact words to avoid false positives
  if (!allPartsMatch) {
    return 0;
  }
  
  // Additional validation: check for common false positive patterns
  // But be smart about it - don't penalize metadata like "(cropped)" or file IDs
  // Check for "X and Y" pattern - this is a strong indicator of multiple people
  // But only penalize if there are capitalized names before "and"
  const andPattern = /[A-Z][a-z]+\s+and\s+[A-Z][a-z]+/;
  if (andPattern.test(filename)) {
    // Check if the person's name appears AFTER "and" (less ideal - group photo)
    const nameAfterAnd = new RegExp(`and\\s+.*${nameParts.join('.*')}`, 'i').test(filenameLower);
    if (nameAfterAnd) {
      // Person appears after "and" - likely a group photo, reduce score significantly
      totalScore *= 0.4;
    } else {
      // Person appears before "and" - might be primary subject, less penalty
      totalScore *= 0.7;
    }
  }
  
  // Don't penalize common metadata patterns like "(cropped)", "(cropped 2)", file IDs, etc.
  // These are just image processing notes, not false positives
  const metadataPatterns = [
    /\(cropped/i,
    /\(cropped \d+\)/i,
    /\(noirlab-.*\)/i,
    /\(cropped\)/i,
  ];
  
  const hasOnlyMetadata = metadataPatterns.some(p => p.test(filenameLower));
  
  // Apply other false positive penalties only if not just metadata
  if (!hasOnlyMetadata) {
    // Date ranges might indicate different person
    if (/\d{4}-\d{4}/.test(filenameLower)) {
      totalScore *= 0.7;
    }
  }
  
  return totalScore;
}

function matchesPersonName(filename: string, personName: string): boolean {
  const score = scorePersonNameMatch(filename, personName);
  // Require minimum score to ensure quality match
  return score >= 4; // At least 2 name parts with decent score
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
    // Throttle Wikimedia API requests to avoid rate limits
    await throttleWikimediaRequest();
    
    // Use the person's name more directly in the search
    const nameParts = personName.split(/\s+/).filter((p: string) => p.length > 1);
    const directNameSearch = nameParts.join(' ');
    
    // Search with person's name first (more important), then add generic terms
    // Prioritize name matches over generic "official photo" terms to avoid false positives
    // Use "intitle:" prefix to prioritize files with the person's name in the title
    const nameSearch = `intitle:${directNameSearch}`;
    const searchTerms = `${nameSearch} ${searchQuery}`.trim();
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerms)}&srnamespace=6&srlimit=10&origin=*`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const searchRequest = async (): Promise<Response> => {
        const response = await fetch(searchUrl, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });
        return response;
      };
      
      const response = await retryWithBackoff(searchRequest, 3, 1000, [429, 503, 502, 500]);
      clearTimeout(timeoutId);
      
      if (!response || !response.ok) {
        console.warn(`[ImageGen] Wikimedia search failed: ${response?.status || 'unknown'}`);
        return null;
      }
      
      const data = await response.json();
      let results = data.query?.search || [];
      
      if (results.length === 0) {
        console.log(`[ImageGen] No Wikimedia results for: ${searchTerms}`);
        return null;
      }
      
      // "Ashlan Chidester" appearing in results is a strong indicator that the search was too generic
      // This image ranks highly because it matches generic terms like "official photo headshot"
      // If we see it, the search query needs to be more specific - retry with just the person's name
      const KNOWN_FALSE_POSITIVE_INDICATOR = 'Ashlan Chidester';
      const hasFalsePositiveIndicator = results.some((result: any) => 
        result.title.toLowerCase().includes(KNOWN_FALSE_POSITIVE_INDICATOR.toLowerCase())
      );
      
      if (hasFalsePositiveIndicator) {
        console.warn(`[ImageGen] ⚠️ Search quality error: "Ashlan Chidester" found - search "${searchTerms}" was too generic`);
        console.warn(`[ImageGen] Retrying with more specific search (name only, no generic terms)...`);
        
        // Retry with just the person's name (more specific, no generic terms)
        const specificSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(`intitle:${directNameSearch}`)}&srnamespace=6&srlimit=10&origin=*`;
        
        try {
          await throttleWikimediaRequest();
          const specificResponse = await fetch(specificSearchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            signal: controller.signal,
          });
          
          if (specificResponse.ok) {
            const specificData = await specificResponse.json();
            const specificResults = specificData.query?.search || [];
            
            if (specificResults.length > 0) {
              console.log(`[ImageGen] ✓ Retry found ${specificResults.length} more specific results`);
              // Use the more specific results instead
              results = specificResults;
            }
          }
        } catch (retryError: any) {
          console.warn(`[ImageGen] Retry search failed: ${retryError.message}`);
          // Continue with original results
        }
      }
      
      // Filter out known false positive images
      const KNOWN_FALSE_POSITIVES = [
        'Ashlan Chidester',
        'Ashlan Chidestar', // Common misspelling
      ];
      
      const filteredResults = results.filter((result: any) => {
        const titleLower = result.title.toLowerCase();
        return !KNOWN_FALSE_POSITIVES.some(fp => titleLower.includes(fp.toLowerCase()));
      });
      
      if (filteredResults.length < results.length) {
        console.log(`[ImageGen] Filtered out ${results.length - filteredResults.length} known false positive(s)`);
      }
      
      // Find the best matching result using strict scoring
      let bestMatch: { result: any; score: number } | null = null;
      const MIN_SCORE_THRESHOLD = 3; // Require minimum score to ensure quality match (lowered to allow metadata like "cropped")
      
      for (const result of filteredResults) {
        const pageTitle = result.title;
        const score = scorePersonNameMatch(pageTitle, personName);
        
        if (score >= MIN_SCORE_THRESHOLD) {
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { result, score };
          }
        } else if (score > 0) {
          // Log why this result was rejected (for debugging)
          console.log(`[ImageGen] Rejected "${pageTitle}" for ${personName} (score: ${score} < ${MIN_SCORE_THRESHOLD})`);
        }
      }
      
      // Only use a match if we found a good one above threshold
      // Don't use first result as fallback - it's too dangerous
      if (!bestMatch) {
        const errorMsg = hasFalsePositiveIndicator 
          ? `Search was too generic (Ashlan Chidester indicator) and no specific matches found`
          : `No matching result found`;
        console.warn(`[ImageGen] ${errorMsg} for ${personName} in ${filteredResults.length} results (required score >= ${MIN_SCORE_THRESHOLD}). Skipping to avoid false positives.`);
        if (filteredResults.length > 0) {
          console.log(`[ImageGen] Top result was: "${filteredResults[0].title}" (would need to match all name parts as exact words)`);
        }
        return null;
      }
      
      const matchingResult = bestMatch.result;
      console.log(`[ImageGen] ✓ Found high-quality match for ${personName} (score: ${bestMatch.score}): ${matchingResult.title}`);
      
      const pageTitle = matchingResult.title;
      
      // Throttle before fetching image info
      await throttleWikimediaRequest();
      
      // Fetch image info to get the direct URL (create new controller for this request)
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url&origin=*`;
      
      const infoController = new AbortController();
      const infoTimeoutId = setTimeout(() => infoController.abort(), 10000);
      
      const infoRequest = async (): Promise<Response> => {
        return await fetch(imageInfoUrl, { 
          signal: infoController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });
      };
      
      const infoResponse = await retryWithBackoff(infoRequest, 3, 1000, [429, 503, 502, 500]);
      clearTimeout(infoTimeoutId);
      if (!infoResponse || !infoResponse.ok) {
        console.warn(`[ImageGen] Failed to get image info: ${infoResponse?.status || 'unknown'}`);
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
  // SDXL is PRIMARY - good quality, low cost, reliable
  // Imagen on Replicate is FALLBACK - use if SDXL fails (note: may not expose versions via API)
  PHOTOREALISTIC: "stability-ai/sdxl", // $0.0048/image - PRIMARY: excellent quality, best price, reliable
  PHOTOREALISTIC_FALLBACK: "google/imagen-4-fast", // $0.02/image - FALLBACK: available on Replicate, supports image input
  // Alternative photorealistic options:
  // - "google-imagen-4-standard": $0.04/image (higher quality)
  // - "black-forest-labs/flux-pro": $0.05-0.10/image (highest quality, expensive)
  // - "stability-ai/stable-diffusion-3.5-large-turbo": $0.04/image (very high quality)
  // - "black-forest-labs/flux-kontext-pro": $0.04/image (with reference image support)
  
  // Artistic models (best for illustrations, watercolor, etc.)
  ARTISTIC: "stability-ai/sdxl", // $0.0048/image - excellent for artistic styles
  ARTISTIC_ALT: "black-forest-labs/flux-dev", // $0.025-0.030/image - alternative artistic option
  // IP-Adapter for artistic styles with reference images (much cheaper than Flux Kontext Pro)
  ARTISTIC_WITH_REF: "chigozienri/ip_adapter-sdxl", // $0.028/image - SDXL + IP-Adapter for reference images
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

// Rate limit tracking for Wikimedia requests
let lastWikimediaRequest = 0;
const WIKIMEDIA_MIN_DELAY = 200; // Minimum 200ms between requests to avoid rate limits

// Helper to throttle Wikimedia requests
async function throttleWikimediaRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastWikimediaRequest;
  if (timeSinceLastRequest < WIKIMEDIA_MIN_DELAY) {
    await new Promise(resolve => setTimeout(resolve, WIKIMEDIA_MIN_DELAY - timeSinceLastRequest));
  }
  lastWikimediaRequest = Date.now();
}

// Helper to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  retryableStatuses: number[] = [429, 503, 502, 500]
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      const status = error.status || error.response?.status;
      const isRetryable = status && retryableStatuses.includes(status);
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[ImageGen] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (status: ${status})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

// Helper to validate that a URL actually points to an image
async function validateImageUrl(url: string, retryOnRateLimit: boolean = true): Promise<boolean> {
  try {
    // Check if URL has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    if (!hasImageExtension && !url.includes('upload.wikimedia.org')) {
      console.warn(`[ImageGen] URL doesn't appear to be an image: ${url.substring(0, 100)}`);
      return false;
    }
    
    // Throttle Wikimedia requests
    if (url.includes('wikimedia.org')) {
      await throttleWikimediaRequest();
    }
    
    const validateRequest = async (): Promise<boolean> => {
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
        // If rate limited and retry is enabled, throw to trigger retry
        if (headResponse.status === 429 && retryOnRateLimit) {
          const error: any = new Error(`Rate limited: ${headResponse.status}`);
          error.status = headResponse.status;
          throw error;
        }
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
    };
    
    if (retryOnRateLimit && url.includes('wikimedia.org')) {
      const result = await retryWithBackoff(validateRequest, 3, 1000, [429, 503, 502]);
      return result ?? false;
    }
    
    return await validateRequest();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`[ImageGen] Timeout validating image URL: ${url.substring(0, 100)}`);
    } else {
      console.error(`[ImageGen] Error validating image URL: ${url.substring(0, 100)}`, error.message);
    }
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
    
    // Throttle Wikimedia requests before downloading
    if (imageUrl.includes('wikimedia.org')) {
      await throttleWikimediaRequest();
    }
    
    // Download the image with retry logic for rate limits
    const downloadImage = async (): Promise<Response> => {
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/*',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!imageResponse.ok) {
        // If rate limited, throw to trigger retry
        if (imageResponse.status === 429 || imageResponse.status === 503 || imageResponse.status === 502) {
          const error: any = new Error(`Rate limited or server error: ${imageResponse.status}`);
          error.status = imageResponse.status;
          throw error;
        }
        // For other errors, throw to fail immediately
        const error: any = new Error(`Failed to download: ${imageResponse.status}`);
        error.status = imageResponse.status;
        throw error;
      }
      
      return imageResponse;
    };
    
    let imageResponse: Response;
    try {
      if (imageUrl.includes('wikimedia.org')) {
        const result = await retryWithBackoff(downloadImage, 3, 2000, [429, 503, 502]);
        if (!result) {
          console.warn(`[ImageGen] Failed to download image after retries: ${imageUrl.substring(0, 100)}`);
          return null;
        }
        imageResponse = result;
      } else {
        imageResponse = await downloadImage();
      }
    } catch (error: any) {
      if (error.status && [429, 503, 502].includes(error.status)) {
        console.warn(`[ImageGen] Failed to download image after retries (${error.status}): ${imageUrl.substring(0, 100)}`);
      } else {
        console.warn(`[ImageGen] Failed to download image (${error.status || 'unknown'}): ${imageUrl.substring(0, 100)}`);
      }
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    console.log(`[ImageGen] Downloaded image (${imageBuffer.byteLength} bytes, ${contentType})`);

    // Convert ArrayBuffer to Buffer for Node.js
    const buffer = Buffer.from(imageBuffer);
    
    // Use form-data package for reliable multipart uploads in Node.js
    // The built-in FormData might not work correctly with Replicate's API
    const FormDataNode = require('form-data');
    
    // Use a proper filename with extension based on content type
    const extension = contentType.includes('png') ? 'png' : 
                     contentType.includes('webp') ? 'webp' : 
                     contentType.includes('gif') ? 'gif' : 'jpg';

    console.log(`[ImageGen] Uploading to Replicate...`);
    console.log(`[ImageGen] Buffer size: ${buffer.length} bytes, Content-Type: ${contentType}`);
    
    // Retry logic for Replicate uploads (especially for 500 errors which are often transient)
    // FormData can only be used once, so we recreate it for each retry
    const performUpload = async (): Promise<Response> => {
      // Create a new FormData for each retry attempt (FormData is a stream and can only be used once)
      const formData = new FormDataNode();
      // Replicate expects the multipart field to be named "content"
      formData.append('content', buffer, {
        filename: `image.${extension}`,
        contentType: contentType,
      });
      
      // Get headers from form-data (includes boundary). Also include Content-Length when available.
      const formHeaders = formData.getHeaders();
      try {
        const contentLength = formData.getLengthSync();
        if (typeof contentLength === 'number' && Number.isFinite(contentLength)) {
          formHeaders['Content-Length'] = contentLength;
        }
      } catch (err) {
        // getLengthSync may throw; skip setting Content-Length in that case.
      }
      
      const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateApiKey}`,
          ...formHeaders, // Include Content-Type with boundary from form-data
        },
        body: formData as any, // form-data package works with fetch in Node.js
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      // For retryable errors, throw to trigger retry
      if (!uploadResponse.ok) {
        const status = uploadResponse.status;
        // 500, 502, 503, 429 are retryable
        if ([500, 502, 503, 429].includes(status)) {
          const errorText = await uploadResponse.text().catch(() => 'Unable to read error response');
          const error: any = new Error(`Replicate upload failed: ${status} - ${errorText}`);
          error.status = status;
          throw error;
        }
        // For non-retryable errors, return the response to handle normally
        return uploadResponse;
      }
      
      return uploadResponse;
    };
    
    let uploadResponse: Response;
    try {
      // Retry up to 3 times for 500, 502, 503, 429 errors with exponential backoff
      const result = await retryWithBackoff(performUpload, 3, 2000, [500, 502, 503, 429]);
      if (!result) {
        console.error(`[ImageGen] Failed to upload to Replicate after retries`);
        return null;
      }
      uploadResponse = result;
    } catch (error: any) {
      // If retry failed or non-retryable error, handle it
      if (error.status && ![500, 502, 503, 429].includes(error.status)) {
        // Non-retryable error that was thrown
        console.error(`[ImageGen] Failed to upload image to Replicate (${error.status}): ${error.message}`);
        return null;
      } else if (error.status) {
        // Retryable error that exhausted retries
        console.error(`[ImageGen] Failed to upload image to Replicate after retries (${error.status}): ${error.message}`);
        return null;
      } else {
        // Unexpected error
        console.error(`[ImageGen] Unexpected error uploading to Replicate: ${error.message}`);
        return null;
      }
    }

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[ImageGen] Failed to upload image to Replicate (${uploadResponse.status}): ${errorText}`);
      console.error(`[ImageGen] Upload error details: status=${uploadResponse.status}, statusText=${uploadResponse.statusText}`);
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
      console.error(`[ImageGen] Could not fetch model versions for ${modelName} (${response.status}): ${errorText}`);
      // Replicate API requires a version ID, not a model name - throw error instead of returning model name
      throw new Error(`Failed to fetch versions for ${modelName}: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const versionId = data.results[0].id;
      // Validate version ID format (should be a hash, typically 64 characters)
      if (versionId && versionId.length >= 20 && !versionId.includes('/')) {
        console.log(`[ImageGen] ✓ Fetched version ${versionId.substring(0, 20)}... for ${modelName}`);
        return versionId;
      } else {
        console.error(`[ImageGen] Invalid version ID format: ${versionId} (expected hash, got something else)`);
        throw new Error(`Invalid version ID format for ${modelName}: ${versionId}`);
      }
    }

    // No versions found
    console.error(`[ImageGen] No versions found for ${modelName}`);
    throw new Error(`No versions found for model ${modelName}`);
  } catch (error: any) {
    console.error(`[ImageGen] Error fetching model version for ${modelName}: ${error.message}`);
    // Re-throw to ensure caller knows we failed
    throw error;
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
  anchorStyle?: string | null,
  relevantImageRefs?: Array<{ name: string; url: string }> // Only people relevant to this specific event
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
  // IMPORTANT: Only process people who are actually relevant to THIS event
  // Use relevantImageRefs if provided, otherwise fall back to all imageReferences
  const peopleToProcess = (relevantImageRefs && relevantImageRefs.length > 0) 
    ? relevantImageRefs 
    : (imageReferences || []);
    
  if (includesPeople && hasReferenceImage && peopleToProcess.length > 0) {
    const personNames = extractPersonNames(peopleToProcess);
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
  } else if (includesPeople && event.imagePrompt) {
    // If no reference image but person is mentioned in the prompt, check if race/ethnicity is explicitly stated
    // Extract person names from event title/description to check if we need to add race info
    const eventText = `${event.title} ${event.description || ''}`.toLowerCase();
    const commonNames = ['tatum', 'art', 'wonder', 'swift', 'obama', 'trump', 'biden']; // Add more as needed
    
    // Check if prompt already mentions race/ethnicity
    const promptLower = event.imagePrompt.toLowerCase();
    const hasRaceDescriptor = /\b(black|white|asian|latino|hispanic|african|european|middle eastern|indian|native american)\b/i.test(promptLower);
    
    // If person name detected but no race descriptor, add explicit instruction
    const hasPersonName = commonNames.some(name => eventText.includes(name.toLowerCase()));
    
    if (hasPersonName && !hasRaceDescriptor) {
      // Add explicit race/ethnicity preservation instruction
      // Note: We can't infer race from name alone, but we can add a strong instruction
      prompt += `. CRITICAL: The person in this image must match their actual race/ethnicity as they exist in reality. If the person is Black, show a Black person. If White, show a White person. If Asian, show an Asian person. Preserve the exact race/ethnicity, skin tone, and physical characteristics of the person accurately. DO NOT change or misrepresent their race or ethnicity.`;
      console.log(`[ImageGen] Added explicit race/ethnicity preservation instruction for event: ${event.title}`);
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
  const maxAttempts = 240; // 4 minutes max (240 * 1 second)
  let attempts = 0;
  // Optimized polling: start very fast (500ms), then moderate (1s), slow down if taking long (2s after 60 attempts)
  // This detects completion faster while still being respectful of API rate limits
  const getPollInterval = (attempt: number) => {
    if (attempt < 20) return 500; // First 10 seconds: poll every 500ms for faster detection
    if (attempt < 60) return 1000; // Next 40 seconds: poll every 1s
    return 2000; // After 60 seconds: poll every 2s
  };

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
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create user for credit management
    const user = await getOrCreateUser(userId);

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

    // Check credits before generation (1 credit per image)
    const requiredCredits = events.length;
    const userCredits = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    if (!userCredits || userCredits.credits < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          credits: userCredits?.credits || 0,
          required: requiredCredits,
        },
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
    
    // Log summary of reference image state
    console.log(`[ImageGen] 📊 Reference Image Summary: hasReferenceImages=${hasReferenceImages}, count=${finalImageReferences?.length || 0}, includesPeople=${includesPeople}`);
    if (hasReferenceImages) {
      console.log(`[ImageGen] Reference images: ${finalImageReferences.map(r => `${r.name} (${r.url.substring(0, 50)}...)`).join(', ')}`);
    }
    
    // Get style-specific visual language for cohesion
    const styleVisualLanguage = STYLE_VISUAL_LANGUAGE[imageStyle] || STYLE_VISUAL_LANGUAGE['Illustration'];
    
    // Prepare reference images for Replicate if available (one per event, or use first available)
    // Filter out invalid URLs (categories, articles, non-image URLs)
    // Then validate that URLs actually exist (AI sometimes generates fake URLs)
    let validImageReferences = finalImageReferences && finalImageReferences.length > 0
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
    
    console.log(`[ImageGen] 🔍 Pattern Filtering: ${validImageReferences.length}/${finalImageReferences?.length || 0} passed pattern validation`);
    
    // Validate that URLs actually exist (AI sometimes generates fake URLs like "Piers_Morgan_2019.jpg" that don't exist)
    // Validate with delays to avoid rate limits (especially for Wikimedia)
    if (validImageReferences.length > 0) {
      console.log(`[ImageGen] ✅ Starting URL validation for ${validImageReferences.length} image reference(s)...`);
      const validationStartTime = Date.now();
      
      // Process validation with delays between requests to avoid rate limits
      const validationResults: Array<{ ref: { name: string; url: string }; isValid: boolean }> = [];
      for (let i = 0; i < validImageReferences.length; i++) {
        const ref = validImageReferences[i];
        console.log(`[ImageGen] Validating [${i + 1}/${validImageReferences.length}] ${ref.name}...`);
        const isValid = await validateImageUrl(ref.url);
        if (isValid) {
          console.log(`[ImageGen] ✓ Valid: ${ref.name} (${ref.url.substring(0, 60)}...)`);
        } else {
          console.warn(`[ImageGen] ✗ Invalid: ${ref.name} (${ref.url.substring(0, 60)}...)`);
        }
        validationResults.push({ ref, isValid });
        
        // Add delay between validations to avoid rate limits (especially for Wikimedia)
        if (i < validImageReferences.length - 1 && ref.url.includes('wikimedia.org')) {
          await new Promise(resolve => setTimeout(resolve, WIKIMEDIA_MIN_DELAY));
        }
      }
      const validationTime = Date.now() - validationStartTime;
      const validRefs = validationResults.filter(r => r.isValid).map(r => r.ref);
      const invalidRefs = validationResults.filter(r => !r.isValid).map(r => r.ref);
      
      console.log(`[ImageGen] 📊 Validation Results: ${validRefs.length} valid, ${invalidRefs.length} invalid (took ${validationTime}ms)`);
      
      if (invalidRefs.length > 0) {
        console.log(`[ImageGen] 🔄 Fetching replacement images for ${invalidRefs.length} invalid URL(s): ${invalidRefs.map(r => r.name).join(', ')}`);
        const fetchStartTime = Date.now();
        
        // For invalid refs, try to fetch real image URLs using the person's name
        const fetchPromises = invalidRefs.map(async (ref: { name: string; url: string }) => {
          try {
            console.log(`[ImageGen] Searching for replacement image for ${ref.name}...`);
            // Extract person name and search for real image
            const realUrl = await findImageUrlWithGPT4o(ref.name, ref.name) || 
                           await searchWikimediaForPerson(ref.name, ref.name);
            if (realUrl) {
              console.log(`[ImageGen] ✓ Found replacement for ${ref.name}: ${realUrl.substring(0, 80)}...`);
              return { name: ref.name, url: realUrl };
            } else {
              console.warn(`[ImageGen] ✗ No replacement found for ${ref.name}`);
            }
          } catch (error: any) {
            console.error(`[ImageGen] Error fetching replacement for ${ref.name}:`, error.message);
          }
          return null;
        });
        
        const fetchedRefs = (await Promise.all(fetchPromises)).filter((r): r is { name: string; url: string } => r !== null);
        const fetchTime = Date.now() - fetchStartTime;
        validImageReferences = [...validRefs, ...fetchedRefs];
        console.log(`[ImageGen] 📊 After replacement fetch: ${validImageReferences.length} total valid (${fetchedRefs.length} replacements found, took ${fetchTime}ms)`);
      } else {
        console.log(`[ImageGen] ✓ All ${validImageReferences.length} image reference URLs are valid (no replacements needed)`);
      }
    } else {
      console.log(`[ImageGen] ⚠️ No valid image references after pattern filtering`);
    }
    
    // Prepare reference images with error handling
    let preparedReferences: (string | null)[] = [];
    if (validImageReferences.length > 0) {
      console.log(`[ImageGen] 🚀 Starting preparation of ${Math.min(validImageReferences.length, events.length)} reference image(s) for Replicate...`);
      const prepStartTime = Date.now();
      try {
        const referenceImagePromises = validImageReferences.slice(0, events.length).map(async (ref: { name: string; url: string }, index: number) => {
          try {
            console.log(`[ImageGen] Preparing [${index + 1}/${Math.min(validImageReferences.length, events.length)}] ${ref.name}...`);
            const preparedUrl = await prepareImageForReplicate(ref.url, replicateApiKey);
            if (preparedUrl) {
              console.log(`[ImageGen] ✓ Prepared ${ref.name}: ${preparedUrl.substring(0, 60)}...`);
            } else {
              console.warn(`[ImageGen] ✗ Failed to prepare ${ref.name} (returned null)`);
            }
            return preparedUrl;
          } catch (error: any) {
            console.error(`[ImageGen] ✗ Error preparing ${ref.name}:`, error.message);
            return null;
          }
        });
        preparedReferences = await Promise.all(referenceImagePromises);
        const prepTime = Date.now() - prepStartTime;
        const successCount = preparedReferences.filter(r => r !== null).length;
        const failureCount = preparedReferences.length - successCount;
        console.log(`[ImageGen] 📊 Preparation Results: ${successCount} succeeded, ${failureCount} failed (took ${prepTime}ms)`);
        if (failureCount > 0) {
          const failedNames = validImageReferences.slice(0, events.length)
            .filter((_, i) => !preparedReferences[i])
            .map(ref => ref.name);
          console.warn(`[ImageGen] ⚠️ Failed to prepare: ${failedNames.join(', ')}`);
        }
      } catch (error: any) {
        console.error('[ImageGen] ✗ Fatal error during reference image preparation:', error.message);
        console.error('[ImageGen] Error stack:', error.stack);
        preparedReferences = [];
      }
    } else {
      console.log(`[ImageGen] ⚠️ No valid image references to prepare`);
    }
    
    // Check if we actually have successfully prepared reference images (not just attempted)
    const hasPreparedReferences = preparedReferences.some(ref => ref !== null && ref.length > 0);
    const preparedCount = preparedReferences.filter(r => r !== null && r.length > 0).length;
    console.log(`[ImageGen] 📊 Final Reference Image Status: hasPreparedReferences=${hasPreparedReferences}, preparedCount=${preparedCount}/${preparedReferences.length}, willUseIPAdapter=${hasPreparedReferences}`);
    
    // Log comprehensive summary
    console.log(`[ImageGen] 📋 Reference Image Pipeline Summary:`);
    console.log(`[ImageGen]    - Initial: provided=${imageReferences?.length || 0}, includesPeople=${includesPeople}`);
    console.log(`[ImageGen]    - After fetch: finalImageReferences=${finalImageReferences?.length || 0}`);
    console.log(`[ImageGen]    - After pattern filter: validImageReferences=${validImageReferences.length}`);
    console.log(`[ImageGen]    - After preparation: preparedReferences=${preparedCount}/${preparedReferences.length}`);
    console.log(`[ImageGen]    - Final decision: hasPreparedReferences=${hasPreparedReferences}, willUseIPAdapter=${hasPreparedReferences}`);
    if (!hasPreparedReferences && hasReferenceImages) {
      console.log(`[ImageGen]    ⚠️ WARNING: Reference images were provided but none were successfully prepared!`);
    }
    
    // PARALLEL GENERATION: Start all predictions at once for faster processing
    console.log(`[ImageGen] Starting parallel generation for ${events.length} images...`);
    const totalGenerationStartTime = Date.now();
    
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
        const isPhotorealistic = selectedModel === MODELS.PHOTOREALISTIC || 
                                 selectedModel === MODELS.PHOTOREALISTIC_FALLBACK ||
                                 selectedModel.includes('flux-dev') ||
                                 selectedModel.includes('imagen');
        
        // Use hasPreparedReferences instead of hasReferenceImages - we need actual prepared images, not just attempted ones
        if (hasPreparedReferences) {
          // For SDXL with reference images, use IP-Adapter (SDXL + IP-Adapter)
          // This is cheaper than Flux Kontext Pro and works well with SDXL
          if (isSDXL || isArtistic) {
            selectedModel = MODELS.ARTISTIC_WITH_REF; // IP-Adapter (SDXL + IP-Adapter)
            console.log(`[ImageGen] ✅ Model Selection: Switching from ${originalModel} to IP-Adapter (hasPreparedReferences=true, preparedCount=${preparedCount}, $0.028/image)`);
          } else if (selectedModel.includes('flux') && !selectedModel.includes('kontext')) {
            // Fallback for other flux models
            selectedModel = "black-forest-labs/flux-kontext-pro";
            console.log(`[ImageGen] ✅ Model Selection: Switching from ${originalModel} to Flux Kontext Pro (hasPreparedReferences=true, preparedCount=${preparedCount}, $0.04/image)`);
          }
        } else {
          // No prepared reference images - SDXL is the default for all styles
          if (isSDXL) {
            if (hasReferenceImages) {
              console.log(`[ImageGen] ⚠️ Model Selection: Reference images were provided (${finalImageReferences?.length || 0}) but all failed validation/preparation - using SDXL without reference images`);
            } else {
              console.log(`[ImageGen] ℹ️ Model Selection: Using SDXL (${selectedModel}) - no reference images available (hasReferenceImages=false, includesPeople=${includesPeople})`);
            }
          }
        }
        
        // Get model version for this specific event
        // Replicate API REQUIRES a version ID (hash), not a model name
        let modelVersion: string;
        try {
          modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
          console.log(`[ImageGen] Fetched version for "${event.title}": ${modelVersion.substring(0, 20)}... (model: ${selectedModel})`);
          
          // Validate that we got a proper version ID (hash, typically 64 chars, no slashes)
          const isValidVersionId = modelVersion && 
                                   modelVersion.length >= 20 && 
                                   !modelVersion.includes('/') &&
                                   !modelVersion.includes('stability-ai') &&
                                   !modelVersion.includes('black-forest');
          
          if (!isValidVersionId) {
            // If version fetch returned a model name, we need to retry or use a known-good version
            console.error(`[ImageGen] Invalid version ID format: ${modelVersion} (looks like a model name, not a version ID)`);
            console.error(`[ImageGen] Replicate API requires a version ID (hash), not a model name`);
            throw new Error(`Failed to get valid version ID for ${selectedModel}. Got: ${modelVersion}`);
          }
        } catch (versionError: any) {
          console.error(`[ImageGen] Error getting model version for ${selectedModel}:`, versionError.message);
          console.error(`[ImageGen] Version error stack:`, versionError.stack);
          // Re-throw the error - we cannot proceed without a valid version ID
          throw new Error(`Cannot generate image for "${event.title}": Failed to get version ID for ${selectedModel}. ${versionError.message}`);
        }
        
        if (needsText) {
          console.log(`[ImageGen] Event "${event.title}" needs text - using ${selectedModel} (better text rendering)`);
        }
        
        // Get reference image URL for this event - only use if event mentions the person
        // Check which people (if any) are mentioned in this event
        const eventText = `${event.title} ${event.description || ''}`.toLowerCase();
        let relevantImageRefs: Array<{ name: string; url: string }> = [];
        let referenceImageUrl: string | null = null;
        
        const singleSubjectRef = finalImageReferences && finalImageReferences.length === 1
          ? finalImageReferences[0]
          : null;

        if (finalImageReferences && finalImageReferences.length > 0) {
          // Find which reference images are relevant to this event
          // Use precise matching: prefer full name, then first+last, then last name only if unambiguous
          relevantImageRefs = finalImageReferences.filter(ref => {
            const personName = ref.name.toLowerCase().trim();
            const nameParts = personName.split(' ').filter((p: string) => p.length > 0);
            
            // 1. Check for full name match (most precise)
            if (eventText.includes(personName)) {
              return true;
            }
            
            // 2. Check for first name + last name (if person has both)
            if (nameParts.length >= 2) {
              const firstName = nameParts[0];
              const lastName = nameParts[nameParts.length - 1];
              // Both first and last name must appear (not just last name)
              if (eventText.includes(firstName) && eventText.includes(lastName)) {
                // Check if this last name is unique among all references
                const peopleWithSameLastName = finalImageReferences.filter(r => {
                  const rNameParts = r.name.toLowerCase().trim().split(' ').filter((p: string) => p.length > 0);
                  return rNameParts.length >= 2 && rNameParts[rNameParts.length - 1] === lastName;
                });
                
                // If only one person has this last name, it's unambiguous
                if (peopleWithSameLastName.length === 1) {
                  return true;
                }
                
                // If multiple people share the last name, require first name match
                // Check if event text contains the full first name (not just a substring)
                const firstNamePattern = new RegExp(`\\b${firstName}\\b`, 'i');
                if (firstNamePattern.test(eventText)) {
                  return true;
                }
              }
            }
            
            return false;
          });
          
          // If there is exactly one subject reference and no explicit match, assume the timeline
          // is about that person and apply the reference across events (e.g., Ben Affleck),
          // but only when we actually prepared a reference.
          if (relevantImageRefs.length === 0 && singleSubjectRef && hasPreparedReferences) {
            relevantImageRefs = [singleSubjectRef];
            console.log(`[ImageGen] Forcing single-subject reference for "${event.title}" using ${singleSubjectRef.name}`);
          }

          if (relevantImageRefs.length > 0) {
            // If multiple matches, prefer the one with the most specific match (full name > first+last > last only)
            let bestMatch = relevantImageRefs[0];
            let bestScore = 0;
            
            for (const ref of relevantImageRefs) {
              const personName = ref.name.toLowerCase().trim();
              let score = 0;
              
              // Full name match = highest score
              if (eventText.includes(personName)) {
                score = 100;
              } else {
                const nameParts = personName.split(' ').filter((p: string) => p.length > 0);
                if (nameParts.length >= 2) {
                  const firstName = nameParts[0];
                  const lastName = nameParts[nameParts.length - 1];
                  if (eventText.includes(firstName) && eventText.includes(lastName)) {
                    score = 50; // First + last name match
                  }
                }
              }
              
              if (score > bestScore) {
                bestScore = score;
                bestMatch = ref;
              }
            }
            
            const relevantRef = bestMatch;
            const refIndex = finalImageReferences.findIndex(r => r.name === relevantRef.name);
            referenceImageUrl = preparedReferences[refIndex] || null;
            
            if (referenceImageUrl) {
              console.log(`[ImageGen] ✓ Event "${event.title}" mentions "${relevantRef.name}" - using reference image (match score: ${bestScore})`);
            }
          } else {
            console.log(`[ImageGen] Event "${event.title}" does not mention any people from imageReferences - skipping person matching`);
          }
        } else {
          // Fallback: use first available reference if no specific matching (for backwards compatibility)
          referenceImageUrl = preparedReferences[index] || preparedReferences[0] || null;
        }
        
        const hasReferenceImage = !!referenceImageUrl;
        
        if (hasReferenceImage && referenceImageUrl) {
          const personName = relevantImageRefs.length > 0 ? relevantImageRefs[0].name : 'unknown';
          console.log(`[ImageGen] ✅ Event "${event.title}" (${index + 1}/${events.length}): Using reference image for ${personName}`);
          console.log(`[ImageGen]    Reference URL: ${referenceImageUrl.substring(0, 80)}...`);
          console.log(`[ImageGen]    Model: ${selectedModel} (will inject reference image)`);
          
          // Upload to Replicate if using IP-Adapter or SDXL (which have 403 errors with Wikimedia)
          // Skip for Imagen which can fetch Wikimedia URLs directly
          const needsUpload = selectedModel.includes('ip-adapter') || 
                             selectedModel === MODELS.ARTISTIC_WITH_REF ||
                             (selectedModel.includes('sdxl') || selectedModel === MODELS.ARTISTIC);
          if (needsUpload && referenceImageUrl.includes('wikimedia.org')) {
            console.log(`[ImageGen] IP-Adapter/SDXL detected - uploading Wikimedia image to Replicate...`);
            const uploadedUrl = await uploadImageToReplicate(referenceImageUrl, replicateApiKey);
            if (uploadedUrl) {
              referenceImageUrl = uploadedUrl;
              console.log(`[ImageGen] ✓ Using uploaded Replicate URL: ${uploadedUrl.substring(0, 80)}...`);
            } else {
              console.warn(`[ImageGen] Upload failed (likely rate limit or network error), will skip reference image to avoid 403 errors`);
              referenceImageUrl = null; // Don't use direct Wikimedia URL - it will fail
            }
          }
        } else {
          console.log(`[ImageGen] ⚠️ Event "${event.title}" (${index + 1}/${events.length}): No reference image available`);
          console.log(`[ImageGen]    Reason: preparedReferences.length=${preparedReferences.length}, index=${index}, hasPreparedReferences=${hasPreparedReferences}`);
          console.log(`[ImageGen]    Prepared references status: ${preparedReferences.map((r, i) => `[${i}]: ${r ? '✓' : '✗'}`).join(', ')}`);
          if (finalImageReferences && finalImageReferences.length > 0) {
            console.log(`[ImageGen]    Note: ${finalImageReferences.length} reference image(s) were provided but not prepared/available for this event`);
          }
        }
        
        // Build enhanced prompt with AI-generated prompt (if available), style, color, and cohesion
        // Include person matching instructions when reference images are provided
        // Only pass relevant image references (people mentioned in this event)
        prompt = buildImagePrompt(
          event, 
          imageStyle, 
          themeColor, 
          styleVisualLanguage, 
          needsText,
          finalImageReferences, // Pass all references for context
          hasReferenceImage,
          includesPeople && relevantImageRefs.length > 0, // Only include people if event mentions them
          anchorStyle,
          relevantImageRefs.length > 0 ? relevantImageRefs : undefined // Only process relevant people
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
        
        // Log image prompt for debugging
        const { getDebugLogger } = await import('@/lib/utils/debugLogger');
        const debugLogger = getDebugLogger();
        debugLogger.logPrompt(`Image Generation - Event ${index + 1}: ${event.title}`, 
          `Image generation prompt for event: ${event.title}`, 
          prompt, 
          {
            eventIndex: index,
            eventTitle: event.title,
            eventYear: event.year,
            imageStyle,
            themeColor,
            hasReferenceImage: !!referenceImageUrl,
            needsText,
            model: selectedModel,
          }
        );
        console.log(`[ImageGen] includesPeople: ${includesPeople && relevantImageRefs.length > 0}, hasReferenceImage: ${hasReferenceImage}`);
        if (hasReferenceImage && relevantImageRefs.length > 0) {
          const personNames = extractPersonNames(relevantImageRefs);
          console.log(`[ImageGen] Person matching enabled for: ${personNames.join(', ') || 'person in reference image'}`);
        }
        
        // Build input - structure varies by model (for Replicate models)
        // Set 1:1 aspect ratio (1024x1024) for all images going forward
        const input: any = {
          prompt: prompt,
          width: 1024,
          height: 1024,
        };
        
        // Model-specific parameters
        if (selectedModel.includes('ip-adapter') || selectedModel === MODELS.ARTISTIC_WITH_REF) {
          // IP-Adapter (SDXL + IP-Adapter) - cheap option for artistic styles with reference images
          // CRITICAL: IP-Adapter model requires an image parameter - if we don't have one, fall back to regular SDXL
          if (!referenceImageUrl || typeof referenceImageUrl !== 'string' || referenceImageUrl.length === 0) {
            console.warn(`[ImageGen] IP-Adapter requires a reference image, but none available. Falling back to regular SDXL.`);
            selectedModel = MODELS.ARTISTIC; // Use regular SDXL instead
            // Re-fetch version for SDXL
            modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
            // Continue with SDXL input setup below
          } else {
            // We have a reference image - use IP-Adapter
            input.prompt = prompt;
            input.num_outputs = 1;
            input.guidance_scale = 7.5;
            input.num_inference_steps = 25;
            
            if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
              input.image = referenceImageUrl;
              input.scale = 0.75; // Control strength of reference image (0.5-1.0) - parameter is "scale" not "ip_adapter_scale"
              console.log(`[ImageGen] Using reference image with IP-Adapter (scale: 0.75, $0.028/image)`);
            } else {
              console.warn(`[ImageGen] Invalid reference image URL format for IP-Adapter: ${referenceImageUrl.substring(0, 50)}`);
              // Fall back to SDXL
              selectedModel = MODELS.ARTISTIC;
              modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
            }
          }
        }
        
        // If we fell back to SDXL or are using SDXL directly (not IP-Adapter)
        if ((selectedModel === MODELS.ARTISTIC || selectedModel.includes('sdxl')) && 
            !selectedModel.includes('ip-adapter') && selectedModel !== MODELS.ARTISTIC_WITH_REF) {
          // Regular SDXL (not IP-Adapter)
          input.prompt = prompt;
          input.num_outputs = 1;
          input.guidance_scale = 7.5;
          input.num_inference_steps = 25;
          
          // Add negative prompt for artistic styles
          // Prevent grids, panels, multiple images, text, brand names, logos
          // If faceless mannequin, also prevent faces
          const baseNegativePrompt = "text, words, letters, typography, writing, captions, titles, labels, signs, banners, headlines, brand names, company names, logos, Netflix, Amazon, Google, Apple, Microsoft, Facebook, Twitter, Instagram, YouTube, Disney, HBO, CNN, BBC, CBS, NBC, ABC, ESPN, service names, streaming services, platform logos, trademark symbols, copyright symbols, registered trademarks, brand logos, company logos, corporate logos, product logos, grid, grids, multiple images, image grid, panel, panels, comic strip, comic panels, triptych, diptych, polyptych, split screen, divided image, multiple panels, image array, photo grid, collage of images, separate images, image montage";
          const facelessNegativePrompt = isFacelessMannequin ? ", face, faces, facial features, eyes, nose, mouth, facial expression, human face, person face, recognizable face, detailed face, portrait, facial details, eyebrows, lips, facial hair, facial structure" : "";
          if (!needsText) {
            input.negative_prompt = baseNegativePrompt + facelessNegativePrompt;
          }
          
          // SDXL can optionally use reference images (but not required like IP-Adapter)
          if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.length > 0) {
            if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
              input.image = referenceImageUrl;
              input.prompt_strength = 0.75;
              input.strength = 0.75;
              console.log(`[ImageGen] Using reference image with SDXL (optional, not required)`);
            }
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
            body: JSON.stringify({
              // Replicate API requires 'version' field with a version ID (hash)
              // If we got a model name instead, we need to fail or retry version fetch
              version: modelVersion,
              input: input,
            }),
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

    // Wait for all predictions to be created (all in parallel)
    const startTime = Date.now();
    const predictionResults = await Promise.all(predictionPromises);
    const creationTime = Date.now() - startTime;
    const createdCount = predictionResults.filter(r => r.predictionId).length;
    const failedCreationCount = predictionResults.filter(r => r.error).length;
    console.log(`[ImageGen] Created ${createdCount}/${events.length} predictions successfully in ${(creationTime / 1000).toFixed(1)}s (parallel)`);
    
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
            const originalSelectedModel = getModelForStyle(imageStyle, needsText);
            let selectedModel = originalSelectedModel;
            
            // Apply same model selection logic as original
            const isSDXL = originalSelectedModel === MODELS.ARTISTIC || originalSelectedModel.includes('sdxl');
            const isArtistic = isSDXL || originalSelectedModel === MODELS.ARTISTIC;
            const isPhotorealistic = originalSelectedModel === MODELS.PHOTOREALISTIC || originalSelectedModel.includes('flux-dev');
            
            // For retries, use the same model selection logic as original
            // BUT: Don't use Imagen (google/imagen-4-fast) as it doesn't expose versions via Replicate API
            // Use hasPreparedReferences to ensure we actually have prepared images, not just attempted ones
            if (hasPreparedReferences) {
              if (isSDXL || isArtistic) {
                selectedModel = MODELS.ARTISTIC_WITH_REF; // Use IP-Adapter, not Imagen
              } else if (originalSelectedModel.includes('flux') && !originalSelectedModel.includes('kontext')) {
                selectedModel = "black-forest-labs/flux-kontext-pro";
              }
              // Don't use Imagen for retries - it doesn't expose versions via Replicate API
            }
            
            const modelVersion = await getLatestModelVersion(selectedModel, replicateApiKey);
            
            // Recalculate relevant image references for this event (same logic as original)
            const eventText = `${result.event.title} ${result.event.description || ''}`.toLowerCase();
            const relevantImageRefs = finalImageReferences && finalImageReferences.length > 0
              ? finalImageReferences.filter(ref => {
                  const personName = ref.name.toLowerCase();
                  const nameParts = personName.split(' ');
                  return nameParts.some((part: string) => part.length > 2 && eventText.includes(part)) ||
                         eventText.includes(personName);
                })
              : [];
            
            const referenceImageUrl = relevantImageRefs.length > 0
              ? (() => {
                  const relevantRef = relevantImageRefs[0];
                  const refIndex = finalImageReferences.findIndex(r => r.name === relevantRef.name);
                  return preparedReferences[refIndex] || null;
                })()
              : (preparedReferences[result.index] || preparedReferences[0] || null);
            const hasReferenceImage = !!referenceImageUrl;
            
            // Rebuild prompt with only relevant image references
            const prompt = buildImagePrompt(
              result.event,
              imageStyle,
              themeColor,
              styleVisualLanguage,
              needsText,
              finalImageReferences, // Pass all references for context
              hasReferenceImage,
              includesPeople && relevantImageRefs.length > 0,
              anchorStyle,
              relevantImageRefs.length > 0 ? relevantImageRefs : undefined // Only process relevant people
            );
            
            // Build input (simplified - reuse same logic as original)
            const input: any = { prompt };
            if (selectedModel.includes('ip-adapter') || selectedModel === MODELS.ARTISTIC_WITH_REF) {
              input.num_outputs = 1;
              input.guidance_scale = 7.5;
              input.num_inference_steps = 25;
              // Only use reference image if we have a valid URL
              if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.length > 0) {
                if (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://')) {
                  input.image = referenceImageUrl;
                  input.scale = 0.75; // Use "scale" parameter, not "ip_adapter_scale"
                }
              }
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
                // Replicate API requires 'version' field with a version ID (hash)
                version: modelVersion,
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
    
    // Check if client wants streaming (progressive loading)
    const stream = request.nextUrl.searchParams.get('stream') === 'true';
    
    // Poll all predictions in parallel (with retry logic built in)
    // All images are polled simultaneously - as soon as each completes, it's returned
    console.log(`[ImageGen] Starting parallel polling for ${predictionResults.length} predictions (all running simultaneously)...`);
    const pollingStartTime = Date.now();
    const imagePromises = predictionResults.map(result => 
      waitForPredictionWithRetry({
        ...result,
        needsText: eventsWithTextNeeds[result.index]?.needsText
      })
    );
    
    // If streaming, process results as they complete and send updates
    if (stream) {
      // Create a readable stream for Server-Sent Events
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const images: (string | null)[] = new Array(events.length).fill(null);
            const prompts: (string | null)[] = new Array(events.length).fill(null);
            const errors: (Error | null)[] = new Array(events.length).fill(null);
            let completedCount = 0;
            const totalEvents = events.length;
            const streamingStartTime = Date.now();
            
            // Process each promise as it completes
            imagePromises.forEach((promise, promiseIndex) => {
              promise.then(async (result) => {
                try {
                  // Persist image to Cloudinary immediately
                  const persistedImage = result.imageUrl 
                    ? (await persistImagesToCloudinary([result.imageUrl]))[0]
                    : null;
                  
                  images[result.index] = persistedImage;
                  prompts[result.index] = typeof result.prompt === 'string' 
                    ? result.prompt 
                    : (result.prompt != null ? String(result.prompt) : null);
                  errors[result.index] = result.error || null;
                  completedCount++;
                  
                  // Send update to client
                  const update = {
                    type: 'image',
                    index: result.index,
                    imageUrl: persistedImage,
                    prompt: prompts[result.index],
                    error: result.error?.message || null,
                    completed: completedCount,
                    total: totalEvents,
                    eventTitle: result.event.title
                  };
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
                  
                  // If all done, deduct credits and send final message
                  if (completedCount === totalEvents) {
                    const successfulImages = images.filter(img => img !== null);
                    const creditsToDeduct = successfulImages.length;
                    
                    // Deduct credits AFTER all images are generated
                    if (creditsToDeduct > 0) {
                      try {
                        await prisma.user.update({
                          where: { id: user.id },
                          data: {
                            credits: {
                              decrement: creditsToDeduct,
                            },
                          },
                          select: {
                            id: true,
                            credits: true,
                          },
                        });
                        console.log(`[ImageGen] [Streaming] Deducted ${creditsToDeduct} credits from user ${user.id} for ${successfulImages.length} generated images`);
                      } catch (creditError: any) {
                        console.error(`[ImageGen] [Streaming] Failed to deduct credits:`, creditError);
                        // Don't fail the request if credit deduction fails - images were already generated
                      }
                    }
                    
                    const streamingTime = Date.now() - streamingStartTime;
                    const totalStreamingTime = Date.now() - totalGenerationStartTime;
                    console.log(`[ImageGen] [Streaming] All images generated: ${successfulImages.length}/${totalEvents} in ${(streamingTime / 1000).toFixed(1)}s (total: ${(totalStreamingTime / 1000).toFixed(1)}s, avg ${(totalStreamingTime / totalEvents / 1000).toFixed(1)}s per image)`);
                    
                    const finalUpdate = {
                      type: 'complete',
                      images: images,
                      prompts: prompts,
                      successful: successfulImages.length,
                      failed: errors.filter(err => err !== null).length,
                      creditsDeducted: creditsToDeduct, // Inform client how many credits were deducted
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
                    controller.close();
                  }
                } catch (error: any) {
                  console.error('[ImageGen] Error processing streaming result:', error);
                  errors[result.index] = error;
                  completedCount++;
                  
                  // Send error update
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'image',
                    index: result.index,
                    imageUrl: null,
                    error: error.message,
                    completed: completedCount,
                    total: totalEvents,
                    eventTitle: result.event.title
                  })}\n\n`));
                  
                  if (completedCount === totalEvents) {
                    // Deduct credits for successful images even if some failed
                    const successfulImages = images.filter(img => img !== null);
                    const creditsToDeduct = successfulImages.length;
                    
                    if (creditsToDeduct > 0) {
                      try {
                        await prisma.user.update({
                          where: { id: user.id },
                          data: {
                            credits: {
                              decrement: creditsToDeduct,
                            },
                          },
                          select: {
                            id: true,
                            credits: true,
                          },
                        });
                        console.log(`[ImageGen] [Streaming] Deducted ${creditsToDeduct} credits from user ${user.id} for ${successfulImages.length} generated images (with processing errors)`);
                      } catch (creditError: any) {
                        console.error(`[ImageGen] [Streaming] Failed to deduct credits:`, creditError);
                      }
                    }
                    
                    // Send final update
                    const streamingTime = Date.now() - streamingStartTime;
                    const totalStreamingTime = Date.now() - totalGenerationStartTime;
                    console.log(`[ImageGen] [Streaming] All images generated: ${successfulImages.length}/${totalEvents} in ${(streamingTime / 1000).toFixed(1)}s (total: ${(totalStreamingTime / 1000).toFixed(1)}s, avg ${(totalStreamingTime / totalEvents / 1000).toFixed(1)}s per image)`);
                    
                    const finalUpdate = {
                      type: 'complete',
                      images: images,
                      prompts: prompts,
                      successful: successfulImages.length,
                      failed: errors.filter(err => err !== null).length,
                      creditsDeducted: creditsToDeduct,
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
                    controller.close();
                  }
                }
              }).catch(async (error) => {
                console.error('[ImageGen] Error in streaming promise:', error);
                completedCount++;
                if (completedCount === totalEvents) {
                  // Even if there were errors, deduct credits for successful images
                  const successfulImages = images.filter(img => img !== null);
                  const creditsToDeduct = successfulImages.length;
                  
                  if (creditsToDeduct > 0) {
                    try {
                      await prisma.user.update({
                        where: { id: user.id },
                        data: {
                          credits: {
                            decrement: creditsToDeduct,
                          },
                        },
                        select: {
                          id: true,
                          credits: true,
                        },
                      });
                      console.log(`[ImageGen] [Streaming] Deducted ${creditsToDeduct} credits from user ${user.id} for ${successfulImages.length} generated images (with errors)`);
                    } catch (creditError: any) {
                      console.error(`[ImageGen] [Streaming] Failed to deduct credits:`, creditError);
                    }
                  }
                  
                  // Send final update with credits deducted
                  const streamingTime = Date.now() - streamingStartTime;
                  const totalStreamingTime = Date.now() - totalGenerationStartTime;
                  console.log(`[ImageGen] [Streaming] All images generated: ${successfulImages.length}/${totalEvents} in ${(streamingTime / 1000).toFixed(1)}s (total: ${(totalStreamingTime / 1000).toFixed(1)}s, avg ${(totalStreamingTime / totalEvents / 1000).toFixed(1)}s per image)`);
                  
                  const finalUpdate = {
                    type: 'complete',
                    images: images,
                    prompts: prompts,
                    successful: successfulImages.length,
                    failed: errors.filter(err => err !== null).length,
                    creditsDeducted: creditsToDeduct,
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
                  controller.close();
                }
              });
            });
          } catch (error: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
            controller.close();
          }
        }
      });
      
      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Non-streaming: Wait for all images to complete (with retries)
    // All images are polled in parallel - they complete as soon as Replicate finishes each one
    const imageResults = await Promise.all(imagePromises);
    const pollingTime = Date.now() - pollingStartTime;
    const totalGenerationTime = Date.now() - totalGenerationStartTime;
    const successfulImagesCount = imageResults.filter(r => r.imageUrl).length;
    console.log(`[ImageGen] Parallel polling complete: ${successfulImagesCount}/${imageResults.length} images generated in ${(pollingTime / 1000).toFixed(1)}s (all processed simultaneously)`);
    console.log(`[ImageGen] Total generation time: ${(totalGenerationTime / 1000).toFixed(1)}s (creation: ${(creationTime / 1000).toFixed(1)}s + polling: ${(pollingTime / 1000).toFixed(1)}s) - avg ${(totalGenerationTime / events.length / 1000).toFixed(1)}s per image`);
    
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
    const persistenceStartTime = Date.now();
    const persistedImages = await persistImagesToCloudinary(images);
    const persistenceTime = Date.now() - persistenceStartTime;
    
    // Log summary
    const persistedCount = persistedImages.filter(img => img !== null && img.includes('res.cloudinary.com')).length;
    console.log(`[ImageGen] Generated ${successfulImages.length} of ${events.length} images successfully`);
    if (persistedCount > 0) {
      console.log(`[ImageGen] Persisted ${persistedCount} images to Cloudinary for permanent storage in ${(persistenceTime / 1000).toFixed(1)}s (${(persistenceTime / persistedCount / 1000).toFixed(1)}s per image)`);
    }
    
    // Deduct credits AFTER successful generation (1 credit per successfully generated image)
    const creditsToDeduct = successfulImages.length;
    if (creditsToDeduct > 0) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: creditsToDeduct,
            },
          },
          select: {
            id: true,
            credits: true,
          },
        });
        console.log(`[ImageGen] Deducted ${creditsToDeduct} credits from user ${user.id} for ${successfulImages.length} generated images`);
      } catch (creditError: any) {
        console.error(`[ImageGen] Failed to deduct credits:`, creditError);
        // Don't fail the request if credit deduction fails - images were already generated
        // But log the error for investigation
      }
    }
    
    // Return all images (including nulls for failed ones) so frontend can handle gracefully
    // Images are now Cloudinary URLs (if Cloudinary is configured) or original Replicate URLs
    return NextResponse.json({ 
      images: persistedImages,
      prompts: prompts, // Include prompts for debugging/testing
      referenceImages: finalImageReferences, // Include auto-fetched reference images
      creditsDeducted: creditsToDeduct, // Inform client how many credits were deducted
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
