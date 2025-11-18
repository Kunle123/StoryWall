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
  timelineUrl?: string
): TwitterThreadTweet[] {
  const tweets: TwitterThreadTweet[] = [];
  
  // First tweet: Timeline title and description
  let firstTweet = `🧵 ${timelineTitle}`;
  if (timelineDescription) {
    const remainingChars = 280 - firstTweet.length - 1; // -1 for space
    const truncatedDesc = timelineDescription.length > remainingChars
      ? timelineDescription.substring(0, remainingChars - 3) + '...'
      : timelineDescription;
    firstTweet += `\n\n${truncatedDesc}`;
  }
  
  // Add URL if provided (takes ~23 chars for t.co shortened URLs)
  if (timelineUrl) {
    const urlText = `\n\n${timelineUrl}`;
    if (firstTweet.length + urlText.length <= 280) {
      firstTweet += urlText;
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

