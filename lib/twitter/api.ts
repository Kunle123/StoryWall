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
  // First, download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  // Step 1: Initialize media upload
  const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      command: 'INIT',
      total_bytes: imageBuffer.byteLength.toString(),
      media_type: contentType,
    }),
  });
  
  if (!initResponse.ok) {
    const error = await initResponse.json();
    throw new Error(error.error || 'Failed to initialize media upload');
  }
  
  const initData = await initResponse.json();
  const mediaId = initData.media_id_string;
  
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
  const finalizeResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: mediaId,
    }),
  });
  
  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.json();
    throw new Error(error.error || 'Failed to finalize media upload');
  }
  
  // Wait for processing to complete
  let processingInfo = await finalizeResponse.json();
  let attempts = 0;
  while (processingInfo.processing_info && processingInfo.processing_info.state === 'in_progress' && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statusResponse = await fetch(`https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    processingInfo = await statusResponse.json();
    attempts++;
  }
  
  if (processingInfo.processing_info?.state === 'failed') {
    throw new Error('Media processing failed');
  }
  
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
  
  const body: any = {
    text: text.substring(0, 280), // Ensure within limit
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
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to post tweet: ${response.statusText}`);
  }
  
  const data = await response.json();
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

/**
 * Get Twitter OAuth authorization URL
 */
export function getTwitterAuthUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: state || Math.random().toString(36).substring(7),
    code_challenge: 'challenge', // For PKCE
    code_challenge_method: 'plain',
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

