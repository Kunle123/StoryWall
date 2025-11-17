/**
 * Hashtag categorization system
 * Maps hashtags to categories for filtering timelines
 */

export type TimelineCategory = 
  | 'sport'
  | 'technology'
  | 'science'
  | 'culture'
  | 'history'
  | 'art'
  | 'entertainment'
  | 'politics'
  | 'business'
  | 'health'
  | 'education'
  | 'travel'
  | 'food'
  | 'fashion'
  | 'music'
  | 'other';

/**
 * Maps hashtags to categories
 * This is a lookup table for common hashtags
 */
const hashtagCategoryMap: Record<string, TimelineCategory> = {
  // Sports
  'formula1': 'sport',
  'f1': 'sport',
  'football': 'sport',
  'soccer': 'sport',
  'basketball': 'sport',
  'tennis': 'sport',
  'golf': 'sport',
  'cricket': 'sport',
  'rugby': 'sport',
  'baseball': 'sport',
  'hockey': 'sport',
  'olympics': 'sport',
  'sports': 'sport',
  'athletics': 'sport',
  'cycling': 'sport',
  'swimming': 'sport',
  'boxing': 'sport',
  'mma': 'sport',
  'ufc': 'sport',
  
  // Technology
  'technology': 'technology',
  'tech': 'technology',
  'ai': 'technology',
  'artificialintelligence': 'technology',
  'machinelearning': 'technology',
  'programming': 'technology',
  'coding': 'technology',
  'software': 'technology',
  'hardware': 'technology',
  'computing': 'technology',
  'internet': 'technology',
  'web': 'technology',
  'mobile': 'technology',
  'app': 'technology',
  'startup': 'technology',
  'innovation': 'technology',
  
  // Science
  'science': 'science',
  'biology': 'science',
  'chemistry': 'science',
  'physics': 'science',
  'astronomy': 'science',
  'space': 'science',
  'medicine': 'science',
  'medical': 'science',
  'research': 'science',
  'discovery': 'science',
  'environment': 'science',
  'climate': 'science',
  'nature': 'science',
  
  // Culture
  'culture': 'culture',
  'society': 'culture',
  'social': 'culture',
  'community': 'culture',
  'tradition': 'culture',
  'heritage': 'culture',
  'customs': 'culture',
  
  // History
  'history': 'history',
  'historical': 'history',
  'ancient': 'history',
  'medieval': 'history',
  'worldwar': 'history',
  'ww1': 'history',
  'ww2': 'history',
  'civilization': 'history',
  'archaeology': 'history',
  
  // Art
  'art': 'art',
  'painting': 'art',
  'sculpture': 'art',
  'photography': 'art',
  'design': 'art',
  'creative': 'art',
  'visualarts': 'art',
  
  // Entertainment
  'entertainment': 'entertainment',
  'movie': 'entertainment',
  'film': 'entertainment',
  'cinema': 'entertainment',
  'tv': 'entertainment',
  'television': 'entertainment',
  'series': 'entertainment',
  'show': 'entertainment',
  'celebrity': 'entertainment',
  'hollywood': 'entertainment',
  
  // Politics
  'politics': 'politics',
  'political': 'politics',
  'government': 'politics',
  'election': 'politics',
  'democracy': 'politics',
  'policy': 'politics',
  
  // Business
  'business': 'business',
  'economy': 'business',
  'finance': 'business',
  'trading': 'business',
  'market': 'business',
  'corporate': 'business',
  
  // Health
  'health': 'health',
  'fitness': 'health',
  'wellness': 'health',
  'mentalhealth': 'health',
  'nutrition': 'health',
  
  // Education
  'education': 'education',
  'learning': 'education',
  'school': 'education',
  'university': 'education',
  'academic': 'education',
  
  // Travel
  'travel': 'travel',
  'tourism': 'travel',
  'vacation': 'travel',
  'adventure': 'travel',
  
  // Food
  'food': 'food',
  'cooking': 'food',
  'recipe': 'food',
  'cuisine': 'food',
  'restaurant': 'food',
  
  // Fashion
  'fashion': 'fashion',
  'style': 'fashion',
  'clothing': 'fashion',
  'designer': 'fashion',
  
  // Music
  'music': 'music',
  'song': 'music',
  'album': 'music',
  'concert': 'music',
  'musician': 'music',
};

/**
 * Categorizes a hashtag by looking it up in the map
 * Returns 'other' if not found
 */
export function categorizeHashtag(hashtag: string): TimelineCategory {
  const normalized = hashtag.toLowerCase().replace(/^#/, '').trim();
  return hashtagCategoryMap[normalized] || 'other';
}

/**
 * Categorizes multiple hashtags and returns the most common category
 * If there's a tie, returns the first one found
 */
export function categorizeHashtags(hashtags: string[]): TimelineCategory {
  if (hashtags.length === 0) return 'other';
  
  const categories = hashtags.map(categorizeHashtag);
  const categoryCounts: Record<TimelineCategory, number> = {} as any;
  
  categories.forEach(cat => {
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  // Find the most common category
  let maxCount = 0;
  let mostCommon: TimelineCategory = 'other';
  
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = cat as TimelineCategory;
    }
  });
  
  return mostCommon;
}

/**
 * Gets all categories from an array of hashtags
 */
export function getCategoriesFromHashtags(hashtags: string[]): TimelineCategory[] {
  const categories = new Set<TimelineCategory>();
  hashtags.forEach(hashtag => {
    categories.add(categorizeHashtag(hashtag));
  });
  return Array.from(categories);
}

