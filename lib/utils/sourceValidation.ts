/**
 * Source validation and formatting utilities
 */

export type SourceType = 
  | 'url' 
  | 'twitter' 
  | 'instagram' 
  | 'tiktok' 
  | 'facebook' 
  | 'linkedin' 
  | 'youtube' 
  | 'custom';

export interface SourceTypeConfig {
  label: string;
  placeholder: string;
  example: string;
  icon?: string;
  validate: (input: string) => { valid: boolean; formatted?: string; error?: string };
}

/**
 * Validate and format Twitter handle or URL
 */
function validateTwitter(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // Twitter URL patterns
  const urlPattern = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(\/.*)?$/i;
  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch) {
    const handle = urlMatch[4];
    return { valid: true, formatted: `Twitter: @${handle} (https://twitter.com/${handle})` };
  }
  
  // Twitter handle pattern (with or without @)
  const handlePattern = /^@?([a-zA-Z0-9_]{1,15})$/;
  const handleMatch = trimmed.match(handlePattern);
  if (handleMatch) {
    const handle = handleMatch[1];
    return { valid: true, formatted: `Twitter: @${handle} (https://twitter.com/${handle})` };
  }
  
  return { valid: false, error: 'Invalid Twitter handle or URL. Use @username or twitter.com/username' };
}

/**
 * Validate and format Instagram handle or URL
 */
function validateInstagram(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // Instagram URL pattern
  const urlPattern = /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})(\/.*)?$/i;
  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch) {
    const handle = urlMatch[3];
    return { valid: true, formatted: `Instagram: @${handle} (https://instagram.com/${handle})` };
  }
  
  // Instagram handle pattern (with or without @)
  const handlePattern = /^@?([a-zA-Z0-9._]{1,30})$/;
  const handleMatch = trimmed.match(handlePattern);
  if (handleMatch) {
    const handle = handleMatch[1];
    return { valid: true, formatted: `Instagram: @${handle} (https://instagram.com/${handle})` };
  }
  
  return { valid: false, error: 'Invalid Instagram handle or URL. Use @username or instagram.com/username' };
}

/**
 * Validate and format TikTok handle or URL
 */
function validateTikTok(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // TikTok URL pattern
  const urlPattern = /^(https?:\/\/)?(www\.)?(tiktok\.com)\/@?([a-zA-Z0-9._]{1,24})(\/.*)?$/i;
  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch) {
    const handle = urlMatch[4];
    return { valid: true, formatted: `TikTok: @${handle} (https://tiktok.com/@${handle})` };
  }
  
  // TikTok handle pattern (with or without @)
  const handlePattern = /^@?([a-zA-Z0-9._]{1,24})$/;
  const handleMatch = trimmed.match(handlePattern);
  if (handleMatch) {
    const handle = handleMatch[1];
    return { valid: true, formatted: `TikTok: @${handle} (https://tiktok.com/@${handle})` };
  }
  
  return { valid: false, error: 'Invalid TikTok handle or URL. Use @username or tiktok.com/@username' };
}

/**
 * Validate and format Facebook page URL
 */
function validateFacebook(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // Facebook URL patterns
  const urlPatterns = [
    /^(https?:\/\/)?(www\.)?facebook\.com\/([a-zA-Z0-9.]+)(\/.*)?$/i,
    /^(https?:\/\/)?(www\.)?fb\.com\/([a-zA-Z0-9.]+)(\/.*)?$/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const page = match[3];
      return { valid: true, formatted: `Facebook: ${page} (https://facebook.com/${page})` };
    }
  }
  
  // Facebook page name (without URL)
  if (trimmed.length > 0 && trimmed.length < 100) {
    return { valid: true, formatted: `Facebook: ${trimmed}` };
  }
  
  return { valid: false, error: 'Invalid Facebook URL. Use facebook.com/pagename or fb.com/pagename' };
}

/**
 * Validate and format LinkedIn profile or company URL
 */
function validateLinkedIn(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // LinkedIn URL patterns
  const urlPatterns = [
    /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)(\/.*)?$/i,
    /^(https?:\/\/)?(www\.)?linkedin\.com\/company\/([a-zA-Z0-9-]+)(\/.*)?$/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const identifier = match[3];
      const type = pattern.source.includes('/in/') ? 'Profile' : 'Company';
      return { valid: true, formatted: `LinkedIn ${type}: ${identifier} (${trimmed.startsWith('http') ? trimmed : `https://linkedin.com${match[0].includes('/in/') ? '/in' : '/company'}/${identifier}`})` };
    }
  }
  
  // LinkedIn handle/identifier
  if (/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { valid: true, formatted: `LinkedIn: ${trimmed}` };
  }
  
  return { valid: false, error: 'Invalid LinkedIn URL. Use linkedin.com/in/username or linkedin.com/company/name' };
}

/**
 * Validate and format YouTube channel or video URL
 */
function validateYouTube(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // YouTube URL patterns
  const urlPatterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(channel|user|c|@)?\/?([a-zA-Z0-9_-]+)(\/.*)?$/i,
  ];
  
  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const identifier = match[5];
      return { valid: true, formatted: `YouTube: ${identifier} (${trimmed.startsWith('http') ? trimmed : `https://youtube.com/${identifier}`})` };
    }
  }
  
  // YouTube channel name
  if (trimmed.length > 0) {
    return { valid: true, formatted: `YouTube: ${trimmed}` };
  }
  
  return { valid: false, error: 'Invalid YouTube URL. Use youtube.com/channel/ID or youtube.com/@channel' };
}

/**
 * Validate and format generic URL
 */
function validateURL(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  
  // URL pattern
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
  
  if (urlPattern.test(trimmed)) {
    const formatted = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    return { valid: true, formatted: `URL: ${formatted}` };
  }
  
  return { valid: false, error: 'Invalid URL. Include domain name (e.g., example.com or https://example.com)' };
}

/**
 * Custom source (no validation, just format)
 */
function validateCustom(input: string): { valid: boolean; formatted?: string; error?: string } {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Source cannot be empty' };
  }
  return { valid: true, formatted: trimmed };
}

export const SOURCE_TYPE_CONFIGS: Record<SourceType, SourceTypeConfig> = {
  url: {
    label: 'Website URL',
    placeholder: 'example.com or https://example.com',
    example: 'https://www.bbc.com/news',
    validate: validateURL,
  },
  twitter: {
    label: 'Twitter/X',
    placeholder: '@username or twitter.com/username',
    example: '@elonmusk or https://twitter.com/elonmusk',
    validate: validateTwitter,
  },
  instagram: {
    label: 'Instagram',
    placeholder: '@username or instagram.com/username',
    example: '@instagram or https://instagram.com/instagram',
    validate: validateInstagram,
  },
  tiktok: {
    label: 'TikTok',
    placeholder: '@username or tiktok.com/@username',
    example: '@tiktok or https://tiktok.com/@tiktok',
    validate: validateTikTok,
  },
  facebook: {
    label: 'Facebook',
    placeholder: 'facebook.com/pagename or page name',
    example: 'facebook.com/facebook or "Facebook Page"',
    validate: validateFacebook,
  },
  linkedin: {
    label: 'LinkedIn',
    placeholder: 'linkedin.com/in/username or company/name',
    example: 'linkedin.com/in/username or linkedin.com/company/example',
    validate: validateLinkedIn,
  },
  youtube: {
    label: 'YouTube',
    placeholder: 'youtube.com/channel/ID or @channel',
    example: 'youtube.com/@channel or youtube.com/channel/UC...',
    validate: validateYouTube,
  },
  custom: {
    label: 'Custom Source',
    placeholder: 'Any text description',
    example: 'The writings of Noam Chomsky',
    validate: validateCustom,
  },
};

/**
 * Detect source type from input string
 */
export function detectSourceType(input: string): SourceType {
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed.includes('twitter.com') || trimmed.includes('x.com') || trimmed.startsWith('@') && !trimmed.includes('/')) {
    return 'twitter';
  }
  if (trimmed.includes('instagram.com')) {
    return 'instagram';
  }
  if (trimmed.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.com')) {
    return 'facebook';
  }
  if (trimmed.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return 'youtube';
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.')) {
    return 'url';
  }
  
  return 'custom';
}

