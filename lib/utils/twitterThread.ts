import { TimelineEvent } from "@/components/timeline/Timeline";
import { formatEventDate } from "./dateFormat";

export interface TwitterThreadTweet {
  text: string;
  order: number;
}

/**
 * Format a timeline into a Twitter thread
 * Each tweet is limited to 280 characters (Twitter's limit)
 */
export function formatTimelineAsTwitterThread(
  timelineTitle: string,
  timelineDescription: string | undefined,
  events: TimelineEvent[],
  timelineUrl?: string,
  timelineImageUrl?: string
): TwitterThreadTweet[] {
  const tweets: TwitterThreadTweet[] = [];
  
  // First tweet: Timeline description as subject, with title and URL
  // Twitter doesn't support markdown, so URLs will be auto-linked
  let firstTweet = '';
  
  // Use description as the subject/topic of the tweet
  if (timelineDescription) {
    firstTweet = timelineDescription;
    
    // Truncate description to leave room for title and URL
    // URL takes ~23 chars (t.co shortened), title takes ~title.length + 3 chars (emoji + spacing)
    const urlOverhead = timelineUrl ? 25 : 0; // Reserve space for URL
    const titleOverhead = timelineTitle ? timelineTitle.length + 5 : 0; // Reserve space for title with emoji
    const totalOverhead = urlOverhead + titleOverhead;
    
    const maxDescLength = 280 - totalOverhead - 10; // -10 for safety margin
    if (firstTweet.length > maxDescLength) {
      firstTweet = firstTweet.substring(0, maxDescLength - 3) + '...';
    }
  } else {
    // Fallback if no description
    firstTweet = `🧵 ${timelineTitle}`;
  }
  
  // Add title and URL (Twitter will auto-link the URL)
  if (timelineTitle && timelineUrl) {
    const titleAndUrl = `\n\n🧵 ${timelineTitle}\n\n${timelineUrl}`;
    if (firstTweet.length + titleAndUrl.length <= 280) {
      firstTweet += titleAndUrl;
    } else {
      // If too long, prioritize URL over title
      const urlOnly = `\n\n${timelineUrl}`;
      if (firstTweet.length + urlOnly.length <= 280) {
        firstTweet += urlOnly;
      }
    }
  } else if (timelineTitle) {
    // If no URL, just add title
    const titleText = `\n\n🧵 ${timelineTitle}`;
    if (firstTweet.length + titleText.length <= 280) {
      firstTweet += titleText;
    }
  } else if (timelineUrl) {
    // If no title, just add URL
    const urlOnly = `\n\n${timelineUrl}`;
    if (firstTweet.length + urlOnly.length <= 280) {
      firstTweet += urlOnly;
    }
  }
  
  tweets.push({ text: firstTweet, order: 1 });
  
  // Subsequent tweets: Each event
  events.forEach((event, index) => {
    const tweetNumber = index + 2; // Start from tweet 2
    
    // Format date
    let dateStr = '';
    if (event.number !== undefined) {
      const label = event.numberLabel || 'Event';
      dateStr = `${label} ${event.number}`;
    } else if (event.year) {
      dateStr = formatEventDate(event.year, event.month, event.day);
    }
    
    // Build tweet text
    let tweetText = '';
    if (dateStr) {
      tweetText = `${dateStr}\n\n`;
    }
    
    // Add title
    tweetText += `📌 ${event.title}`;
    
    // Add description if available
    if (event.description) {
      const remainingChars = 280 - tweetText.length - 1; // -1 for newline
      if (remainingChars > 0) {
        const truncatedDesc = event.description.length > remainingChars
          ? event.description.substring(0, remainingChars - 3) + '...'
          : event.description;
        tweetText += `\n\n${truncatedDesc}`;
      }
    }
    
    // Ensure tweet is within limit
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    tweets.push({ text: tweetText, order: tweetNumber });
  });
  
  return tweets;
}

/**
 * Format tweets as a single string with thread markers
 * Useful for copying to clipboard
 */
export function formatTweetsAsThreadString(tweets: TwitterThreadTweet[]): string {
  return tweets.map((tweet, index) => {
    const threadMarker = index === 0 ? '1/' : `${index + 1}/${tweets.length}`;
    return `${threadMarker}\n\n${tweet.text}`;
  }).join('\n\n---\n\n');
}

/**
 * Generate Twitter intent URL for posting a thread
 * Note: Twitter doesn't support multi-tweet threads via URL, so this opens compose with first tweet
 */
export function generateTwitterIntentUrl(tweets: TwitterThreadTweet[]): string {
  const firstTweet = tweets[0]?.text || '';
  const encodedText = encodeURIComponent(firstTweet);
  return `https://twitter.com/intent/tweet?text=${encodedText}`;
}

/**
 * Copy thread to clipboard as formatted text
 */
export async function copyThreadToClipboard(tweets: TwitterThreadTweet[]): Promise<boolean> {
  try {
    const threadText = formatTweetsAsThreadString(tweets);
    await navigator.clipboard.writeText(threadText);
    return true;
  } catch (error) {
    console.error('Failed to copy thread to clipboard:', error);
    return false;
  }
}

/**
 * Generate up to 3 relevant hashtags from tweet text
 * Extracts keywords and creates hashtags, ensuring they fit within character limit
 */
export function generateHashtags(text: string, maxHashtags: number = 3): string[] {
  // Remove URLs and common words
  const cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .toLowerCase();
  
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'now', 'then', 'here', 'there', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'once', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'within', 'without', 'across', 'around', 'near', 'far', 'away'
  ]);
  
  // Extract words (2+ characters) and count frequency
  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));
  
  // Count word frequency
  const wordCounts = new Map<string, number>();
  words.forEach(word => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });
  
  // Sort by frequency and length (prefer longer, more frequent words)
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => {
      // First sort by frequency (descending)
      if (b[1] !== a[1]) return b[1] - a[1];
      // Then by length (descending) - longer words make better hashtags
      return b[0].length - a[0].length;
    })
    .map(([word]) => word);
  
  // Generate hashtags (max 3, ensure they're unique and valid)
  const hashtags: string[] = [];
  const seen = new Set<string>();
  
  for (const word of sortedWords) {
    if (hashtags.length >= maxHashtags) break;
    
    // Create hashtag: capitalize first letter of each word if multi-word, or use as-is
    // Remove spaces and special characters, ensure it's valid
    let hashtag = word
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    
    // Ensure hashtag is valid (alphanumeric, max 100 chars per Twitter rules)
    if (hashtag.length > 0 && hashtag.length <= 100 && /^[a-zA-Z0-9]+$/.test(hashtag)) {
      const fullHashtag = `#${hashtag}`;
      if (!seen.has(fullHashtag.toLowerCase())) {
        hashtags.push(fullHashtag);
        seen.add(fullHashtag.toLowerCase());
      }
    }
  }
  
  // If we don't have enough hashtags, try to create compound hashtags from common words
  if (hashtags.length < maxHashtags && sortedWords.length > 0) {
    // Try combining words for better hashtags
    for (let i = 0; i < sortedWords.length && hashtags.length < maxHashtags; i++) {
      const word = sortedWords[i];
      if (word.length >= 4 && word.length <= 15) { // Good length for hashtags
        const hashtag = `#${word.charAt(0).toUpperCase() + word.slice(1)}`;
        if (!seen.has(hashtag.toLowerCase())) {
          hashtags.push(hashtag);
          seen.add(hashtag.toLowerCase());
        }
      }
    }
  }
  
  return hashtags.slice(0, maxHashtags);
}

/**
 * Add hashtags to tweet text, ensuring it stays within 280 character limit
 * Returns the text with hashtags appended
 */
export function addHashtagsToTweet(text: string, hashtags: string[]): string {
  if (hashtags.length === 0) return text;
  
  const hashtagsText = ' ' + hashtags.join(' ');
  const maxLength = 280;
  
  // If adding hashtags would exceed limit, truncate text to make room
  if (text.length + hashtagsText.length > maxLength) {
    const availableLength = maxLength - hashtagsText.length - 3; // -3 for ellipsis
    if (availableLength > 0) {
      text = text.substring(0, availableLength).trim() + '...';
    } else {
      // If hashtags themselves are too long, use fewer hashtags
      let hashtagsToUse: string[] = [];
      let hashtagsLength = 0;
      for (const hashtag of hashtags) {
        const testLength = hashtagsLength + hashtag.length + 1; // +1 for space
        if (text.length + testLength <= maxLength) {
          hashtagsToUse.push(hashtag);
          hashtagsLength = testLength;
        } else {
          break;
        }
      }
      if (hashtagsToUse.length > 0) {
        return text + ' ' + hashtagsToUse.join(' ');
      }
      return text; // Can't fit any hashtags
    }
  }
  
  return text + hashtagsText;
}

