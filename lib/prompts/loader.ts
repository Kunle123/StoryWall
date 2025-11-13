import fs from 'fs';
import path from 'path';

/**
 * Simple template engine for prompt files
 * Supports {{variable}} and {{#if condition}}...{{/if}} syntax
 */
export function loadPrompt(
  promptPath: string,
  variables: Record<string, any> = {}
): string {
  const fullPath = path.join(process.cwd(), 'prompts', promptPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Prompt file not found: ${fullPath}`);
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Handle {{#if variable}}...{{/if}} blocks
  content = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, blockContent) => {
    const value = variables[varName];
    if (value && value !== false && value !== null && value !== undefined && value !== '') {
      return blockContent;
    }
    return '';
  });
  
  // Handle {{#each array}}...{{/each}} blocks
  content = content.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, varName, blockContent) => {
    const array = variables[varName];
    if (!Array.isArray(array)) {
      return '';
    }
    return array.map((item, index) => {
      let itemContent = blockContent;
      // Replace {{@index}} with array index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));
      // Replace {{property}} with item properties
      Object.keys(item).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        itemContent = itemContent.replace(regex, String(item[key] || ''));
      });
      return itemContent;
    }).join('');
  });
  
  // Replace simple {{variable}} placeholders
  Object.keys(variables).forEach(key => {
    const value = variables[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, String(value));
    }
  });
  
  return content.trim();
}

/**
 * Load anchor generation prompts
 */
export function loadAnchorPrompts(variables: {
  timelineDescription: string;
  eventTitles: string;
  imageStyle?: string;
  themeColor?: string;
}) {
  return {
    system: loadPrompt('anchor/system.txt'),
    user: loadPrompt('anchor/user.txt', variables),
  };
}

/**
 * Load description generation prompts
 */
export function loadDescriptionPrompts(variables: {
  timelineDescription: string;
  events: Array<{ year?: number; title: string }>;
  writingStyle: string;
  imageStyle?: string;
  themeColor?: string;
  anchorStyle?: string;
  hasFactualDetails?: boolean;
  sourceRestrictions?: string[];
  imageContext?: string;
  eventCount: number;
  styleInstructions: Record<string, string>;
  canUseCelebrityLikeness?: boolean; // New: result from newsworthiness test
}) {
  const normalizedStyle = variables.writingStyle.toLowerCase();
  const writingStyleInstructions = variables.styleInstructions[normalizedStyle] || variables.styleInstructions.narrative;
  
  // Determine which image prompt instructions to use
  let imagePromptInstructions: string;
  if (variables.anchorStyle) {
    const anchorPreview = variables.anchorStyle.length > 100 
      ? variables.anchorStyle.substring(0, 100) + '...' 
      : variables.anchorStyle;
    
    if (variables.hasFactualDetails) {
      // For progressions with factual details
      imagePromptInstructions = loadPrompt('descriptions/image-prompt-instructions-with-anchor-factual.txt', {
        anchorStylePreview: anchorPreview,
      });
    } else {
      // For regular timelines with anchor
      imagePromptInstructions = loadPrompt('descriptions/image-prompt-instructions-with-anchor.txt', {
        anchorStylePreview: anchorPreview,
        canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false,
      });
    }
  } else {
    // No anchor style
    imagePromptInstructions = loadPrompt('descriptions/image-prompt-instructions-without-anchor.txt', {
      themeColor: variables.themeColor || '',
      canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false,
    });
  }
  
  const systemPrompt = loadPrompt('descriptions/system.txt', {
    writingStyleInstructions,
    imagePromptInstructions,
    eventCount: variables.eventCount,
    canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false,
  });
  
  const userPrompt = loadPrompt('descriptions/user-prompt.txt', {
    timelineDescription: variables.timelineDescription,
    sourceRestrictions: variables.sourceRestrictions || [],
    imageContext: variables.imageContext,
    eventCount: variables.eventCount,
    events: variables.events,
  });
  
  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

/**
 * Load unified prompts (Anchor + Descriptions + Image Prompts in one call)
 */
export function loadUnifiedPrompts(variables: {
  timelineDescription: string;
  events: Array<{ year?: number; title: string; facts?: string[] }>;
  writingStyle: string;
  imageStyle?: string;
  themeColor?: string;
  sourceRestrictions?: string[];
  imageContext?: string;
  eventCount: number;
  canUseCelebrityLikeness?: boolean;
  hasFactualDetails?: boolean;
  anchorStylePreview?: string; // 60-80 char preview for image prompts
}) {
  const systemPrompt = loadPrompt('unified/system.txt', {
    canUseCelebrityLikeness: variables.canUseCelebrityLikeness || false,
    hasFactualDetails: variables.hasFactualDetails || false,
    anchorStylePreview: variables.anchorStylePreview || '',
  });
  
  // Build factual details for events if available
  const eventsWithFacts = variables.events.map((e, idx) => {
    const eventLabel = e.year ? `${e.year}: ${e.title}` : e.title;
    const facts = e.facts || [];
    return {
      ...e,
      facts: facts.length > 0 ? facts.join('; ') : undefined,
    };
  });
  
  const userPrompt = loadPrompt('unified/user.txt', {
    timelineDescription: variables.timelineDescription,
    sourceRestrictions: variables.sourceRestrictions || [],
    imageContext: variables.imageContext,
    eventCount: variables.eventCount,
    events: eventsWithFacts,
    themeColor: variables.themeColor,
    hasFactualDetails: variables.hasFactualDetails || false,
  });
  
  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

