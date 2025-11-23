/**
 * Twitter API v2 client for posting threads
 * Requires OAuth 2.0 authentication
 */

interface TwitterTweet {
  text: string;
  mediaId?: string; // Media ID from Twitter upload (for images)
}

interface TwitterThreadResponse {
  tweetId: string;
  text: string;
}

/**
 * Upload media (image) to Twitter
 * Returns media_id that can be attached to a tweet
 */
export async function uploadMedia(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  console.log(`[Twitter Upload Media] Starting upload for: ${imageUrl}`);
  
  // First, download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  console.log(`[Twitter Upload Media] Downloaded image. Size: ${imageBuffer.byteLength} bytes, Type: ${contentType}`);
  
  // Validate image size (Twitter limit is 5MB for images)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageBuffer.byteLength > maxSize) {
    throw new Error(`Image too large: ${imageBuffer.byteLength} bytes (max: ${maxSize} bytes)`);
  }
  
  // Step 1: Initialize media upload
  // CRITICAL: Twitter v1.1 media upload endpoint REQUIRES OAuth 1.0a, NOT OAuth 2.0 Bearer tokens
  // OAuth 2.0 Bearer tokens will always return 403 Forbidden for this endpoint
  // We need to implement OAuth 1.0a signature generation for media uploads
  // For now, this will fail until OAuth 1.0a is implemented
  console.log(`[Twitter Upload Media] Initializing upload...`);
  console.warn(`[Twitter Upload Media] WARNING: Using OAuth 2.0 Bearer token - v1.1 media upload requires OAuth 1.0a. This will fail with 403.`);
  const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`, // This won't work - needs OAuth 1.0a
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'INIT',
      total_bytes: imageBuffer.byteLength.toString(),
      media_type: contentType,
    }),
  });
  
  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    let errorMessage = 'Failed to initialize media upload';
    let errorDetails: any = {};
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error || error.errors?.[0]?.message || errorMessage;
      errorDetails = error;
    } catch {
      errorMessage = `${errorMessage}: ${initResponse.status} ${initResponse.statusText}`;
    }
    console.error(`[Twitter Upload Media] Init failed:`, errorMessage);
    console.error(`[Twitter Upload Media] Response status: ${initResponse.status}`);
    console.error(`[Twitter Upload Media] Response headers:`, Object.fromEntries(initResponse.headers.entries()));
    console.error(`[Twitter Upload Media] Error details:`, errorDetails);
    console.error(`[Twitter Upload Media] Full error text:`, errorText);
    throw new Error(`${errorMessage} (Status: ${initResponse.status})`);
  }
  
  const initData = await initResponse.json();
  const mediaId = initData.media_id_string;
  console.log(`[Twitter Upload Media] Initialized. Media ID: ${mediaId}`);
  
  // Step 2: Append media data (in chunks if needed)
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let segmentIndex = 0;
  
  for (let offset = 0; offset < imageBuffer.byteLength; offset += chunkSize) {
    const chunk = imageBuffer.slice(offset, Math.min(offset + chunkSize, imageBuffer.byteLength));
    const formData = new FormData();
    formData.append('command', 'APPEND');
    formData.append('media_id', mediaId);
    formData.append('segment_index', segmentIndex.toString());
    formData.append('media', new Blob([chunk], { type: contentType }));
    
    const appendResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });
    
    if (!appendResponse.ok) {
      const error = await appendResponse.json();
      throw new Error(error.error || 'Failed to append media chunk');
    }
    
    segmentIndex++;
  }
  
  // Step 3: Finalize media upload
  console.log(`[Twitter Upload Media] Finalizing upload...`);
  const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: mediaId,
    }),
  });
  
  if (!finalizeResponse.ok) {
    const errorText = await finalizeResponse.text();
    let errorMessage = 'Failed to finalize media upload';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${finalizeResponse.status} ${finalizeResponse.statusText}`;
    }
    console.error(`[Twitter Upload Media] Finalize failed:`, errorMessage);
    throw new Error(errorMessage);
  }
  
  // Wait for processing to complete
  let processingInfo = await finalizeResponse.json();
  let attempts = 0;
  const maxAttempts = 15; // Increased timeout
  console.log(`[Twitter Upload Media] Processing state: ${processingInfo.processing_info?.state || 'none'}`);
  
  while (processingInfo.processing_info && processingInfo.processing_info.state === 'in_progress' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    processingInfo = await statusResponse.json();
    attempts++;
    console.log(`[Twitter Upload Media] Processing attempt ${attempts}/${maxAttempts}, state: ${processingInfo.processing_info?.state}`);
  }
  
  if (processingInfo.processing_info?.state === 'failed') {
    const errorMessage = processingInfo.processing_info.error?.message || 'Media processing failed';
    console.error(`[Twitter Upload Media] Processing failed:`, errorMessage);
    throw new Error(`Media processing failed: ${errorMessage}`);
  }
  
  console.log(`[Twitter Upload Media] Upload complete. Media ID: ${mediaId}`);
  return mediaId;
}

/**
 * Post a single tweet using Twitter API v2
 */
export async function postTweet(
  accessToken: string,
  text: string,
  replyToTweetId?: string,
  mediaId?: string
): Promise<TwitterThreadResponse> {
  const url = 'https://api.twitter.com/2/tweets';
  
  // Twitter automatically shortens URLs to ~23 characters
  // However, if the actual text exceeds 280 chars, Twitter will truncate it, potentially cutting off the URL
  // We need to ensure the text fits within 280 characters BEFORE sending
  // Calculate effective length: actual text length minus (URL length - 23)
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  let effectiveLength = text.length;
  if (urlMatch) {
    const fullUrl = urlMatch[0];
    const urlLength = fullUrl.length;
    effectiveLength = text.length - urlLength + 23; // Replace full URL with shortened length
  }
  
  // If effective length exceeds 280, we need to truncate to preserve the URL
  if (effectiveLength > 280) {
    console.warn(`[Twitter Post Tweet] Effective tweet length (${effectiveLength}) exceeds 280. Actual text: ${text.length} chars. Truncating...`);
    // Find the URL and preserve it
    const urlMatch2 = text.match(/https?:\/\/[^\s]+/);
    const url = urlMatch2 ? urlMatch2[0] : '';
    const textWithoutUrl = urlMatch2 ? text.replace(urlMatch2[0], '').trim() : text;
    
    // Calculate how much text we can fit (280 - 23 for URL - some buffer)
    const maxTextLength = 280 - 23 - 5; // 5 char buffer
    const truncatedText = textWithoutUrl.substring(0, maxTextLength).trim();
    text = url ? `${truncatedText} ${url}` : truncatedText;
    console.warn(`[Twitter Post Tweet] Truncated to: ${text.length} chars (effective: ~${text.length - (url.length - 23)})`);
  }
  
  const body: any = {
    text: text.substring(0, 280), // Hard limit to prevent API errors
  };
  
  if (replyToTweetId) {
    body.reply = {
      in_reply_to_tweet_id: replyToTweetId,
    };
  }
  
  if (mediaId) {
    body.media = {
      media_ids: [mediaId],
    };
    console.log(`[Twitter Post Tweet] Attaching media_id: ${mediaId} to tweet`);
  }
  
  console.log(`[Twitter Post Tweet] Posting tweet (${text.length} chars)${mediaId ? ' with image' : ''}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to post tweet: ${response.statusText}`;
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.detail || error.errors?.[0]?.message || errorMessage;
    } catch {
      // Use default error message
    }
    console.error(`[Twitter Post Tweet] Failed:`, errorMessage);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log(`[Twitter Post Tweet] Successfully posted. Tweet ID: ${data.data.id}`);
  
  return {
    tweetId: data.data.id,
    text: data.data.text,
  };
}

/**
 * Post a complete Twitter thread
 * Each tweet replies to the previous one
 * First tweet can include an image (mediaId)
 */
export async function postTwitterThread(
  accessToken: string,
  tweets: TwitterTweet[]
): Promise<TwitterThreadResponse[]> {
  const results: TwitterThreadResponse[] = [];
  let previousTweetId: string | undefined;
  
  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];
    // Only attach media to the first tweet
    const mediaId = i === 0 ? tweet.mediaId : undefined;
    const result = await postTweet(accessToken, tweet.text, previousTweetId, mediaId);
    results.push(result);
    previousTweetId = result.tweetId;
    
    // Small delay between tweets to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random string for PKCE code_verifier
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate code_challenge from code_verifier using SHA256
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Get Twitter OAuth authorization URL with proper PKCE
 */
export function getTwitterAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeVerifier: string
): string {
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access media.write',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256', // Use SHA256 instead of plain
  });
  
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to exchange code for token');
  }
  
  return await response.json();
}

