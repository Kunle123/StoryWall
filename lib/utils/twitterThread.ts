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

