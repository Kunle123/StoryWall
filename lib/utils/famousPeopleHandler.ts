/**
 * Utilities for handling famous people in image prompts
 * to avoid copyright/publicity right issues
 */

/**
 * Common famous people names that should use stylized representations
 * This is not exhaustive but covers major historical figures
 */
const FAMOUS_PEOPLE_KEYWORDS = [
  // Historical leaders
  'king', 'queen', 'emperor', 'empress', 'president', 'prime minister',
  'caesar', 'napoleon', 'churchill', 'lincoln', 'washington', 'kennedy',
  'gandhi', 'mandela', 'martin luther king', 'mlk',
  
  // Scientists & Inventors
  'einstein', 'newton', 'darwin', 'tesla', 'edison', 'curie',
  
  // Artists & Writers
  'shakespeare', 'picasso', 'van gogh', 'mozart', 'beethoven',
  
  // Generic patterns that indicate specific people
  'portrait of', 'photo of', 'picture of', 'image of',
];

/**
 * Check if a prompt likely references a famous person
 */
export function containsFamousPerson(prompt: string | null | undefined): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  const lowerPrompt = prompt.toLowerCase();
  return FAMOUS_PEOPLE_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Transform prompt to use safe, stylized representation
 * instead of photorealistic likeness
 */
export function makePromptSafeForFamousPeople(
  prompt: string,
  imageStyle: string
): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // If already artistic/stylized, it's safer
  const artisticStyles = ['illustration', 'sketch', 'watercolor', 'painting', 'drawing', 'artistic'];
  const isAlreadyArtistic = artisticStyles.some(style => lowerPrompt.includes(style));
  
  // Remove direct portrait/photo references
  let safePrompt = prompt
    .replace(/\b(portrait of|photo of|picture of|image of)\s+/gi, '')
    .replace(/\b(specific|actual|real|authentic|exact)\s+(likeness|portrait|photo|image)\b/gi, '');
  
  // Add stylization instructions
  const stylizationPhrases = [
    'stylized historical illustration',
    'artistic representation',
    'period-appropriate illustration',
    'symbolic representation',
    'historical painting style',
  ];
  
  // If photorealistic style, modify to illustration
  if (imageStyle.toLowerCase() === 'photorealistic' && lowerPrompt.match(/\b(king|queen|president|famous|celebrity)\b/)) {
    safePrompt = safePrompt.replace(/\bphotorealistic\b/gi, 'illustration');
    safePrompt += '. Stylized artistic representation, not a direct likeness';
  } else if (!isAlreadyArtistic && containsFamousPerson(safePrompt)) {
    // Add artistic style modifier if not already present
    safePrompt += '. Stylized historical illustration, artistic interpretation';
  }
  
  // Emphasize context over likeness
  safePrompt = safePrompt.replace(
    /\b(show|depict|feature)\s+(?:the|this|specific)\s+person\b/gi,
    'show the historical context and setting'
  );
  
  // Add disclaimer instructions
  if (containsFamousPerson(safePrompt)) {
    safePrompt += '. Focus on historical setting, period-appropriate clothing, and symbolic elements rather than specific facial features';
  }
  
  return safePrompt;
}

/**
 * Get recommended image style for famous people (safer alternatives)
 */
export function getSafeStyleForFamousPeople(requestedStyle: string): string {
  const style = requestedStyle.toLowerCase();
  
  // Photorealistic is risky for famous people
  if (style === 'photorealistic') {
    return 'Illustration'; // Safer default
  }
  
  // These styles are generally safer (less identifiable)
  const safeStyles = ['illustration', 'sketch', 'watercolor', 'vintage', '3d render', 'abstract'];
  if (safeStyles.includes(style)) {
    return requestedStyle; // Already safe
  }
  
  return requestedStyle; // Others are generally okay
}

