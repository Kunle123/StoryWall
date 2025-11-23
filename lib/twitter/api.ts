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
 * Generate OAuth 1.0a signature for Twitter API requests
 * Required for v1.1 media upload endpoint
 */
function generateOAuth1Signature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string,
  includeCallback?: boolean,
  callbackUrl?: string
): { signature: string; timestamp: string; nonce: string } {
  // Step 1: Collect OAuth parameters
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };
  
  // Only include oauth_token if we have one (not for request token step)
  if (token) {
    oauthParams.oauth_token = token;
  }
  
  // Include callback in signature if provided
  if (includeCallback && callbackUrl) {
    oauthParams.oauth_callback = callbackUrl;
  }

  // Step 2: Merge all parameters
  const allParams = { ...oauthParams, ...params };
  
  // Step 3: Normalize parameters (sort and encode)
  const normalizedParams = Object.keys(allParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  // Step 4: Create signature base string
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(normalizedParams)
  ].join('&');

  // Step 5: Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Step 6: Generate signature
  const signature = createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return { signature, timestamp, nonce };
}

/**
 * Create OAuth 1.0a Authorization header
 */
function createOAuth1Header(
  consumerKey: string,
  token: string,
  signature: string,
  timestamp: string,
  nonce: string,
  includeCallback?: boolean,
  callbackUrl?: string
): string {
  const params: string[] = [
    `oauth_consumer_key="${encodeURIComponent(consumerKey)}"`,
    `oauth_signature_method="HMAC-SHA1"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_version="1.0"`,
    `oauth_signature="${encodeURIComponent(signature)}"`,
  ];
  
  // Only include oauth_token if we have one
  if (token) {
    params.splice(1, 0, `oauth_token="${encodeURIComponent(token)}"`);
  }
  
  // Include callback if provided
  if (includeCallback && callbackUrl) {
    params.push(`oauth_callback="${encodeURIComponent(callbackUrl)}"`);
  }

  return `OAuth ${params.join(', ')}`;
}

/**
 * Upload media (image) to Twitter using OAuth 2.0 (DEPRECATED - doesn't work)
 * This function is kept for backward compatibility but will always fail with 403
 * Use uploadMediaOAuth1 instead
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
 * Upload media (image) to Twitter using OAuth 1.0a
 * Returns media_id that can be attached to a tweet
 * 
 * @param consumerKey - OAuth 1.0a Consumer Key (API Key)
 * @param consumerSecret - OAuth 1.0a Consumer Secret (API Secret)
 * @param token - OAuth 1.0a Access Token
 * @param tokenSecret - OAuth 1.0a Access Token Secret
 * @param imageUrl - URL of the image to upload
 */
export async function uploadMediaOAuth1(
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string,
  imageUrl: string
): Promise<string> {
  console.log(`[Twitter Upload Media OAuth1] Starting upload for: ${imageUrl}`);
  
  // First, download the image
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  
  console.log(`[Twitter Upload Media OAuth1] Downloaded image. Size: ${imageBuffer.byteLength} bytes, Type: ${contentType}`);
  
  // Validate image size (Twitter limit is 5MB for images)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageBuffer.byteLength > maxSize) {
    throw new Error(`Image too large: ${imageBuffer.byteLength} bytes (max: ${maxSize} bytes)`);
  }
  
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
  
  // Step 1: Initialize media upload with OAuth 1.0a
  console.log(`[Twitter Upload Media OAuth1] Initializing upload...`);
  const initParams = {
    command: 'INIT',
    total_bytes: imageBuffer.byteLength.toString(),
    media_type: contentType,
  };
  
  const { signature: initSignature, timestamp: initTimestamp, nonce: initNonce } = generateOAuth1Signature(
    'POST',
    uploadUrl,
    initParams,
    consumerKey,
    consumerSecret,
    token,
    tokenSecret
  );
  
  const initResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': createOAuth1Header(consumerKey, token, initSignature, initTimestamp, initNonce),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(initParams),
  });
  
  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    let errorMessage = 'Failed to initialize media upload';
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error || error.errors?.[0]?.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${initResponse.status} ${initResponse.statusText}`;
    }
    console.error(`[Twitter Upload Media OAuth1] Init failed:`, errorMessage);
    throw new Error(`${errorMessage} (Status: ${initResponse.status})`);
  }
  
  const initData = await initResponse.json();
  const mediaId = initData.media_id_string;
  console.log(`[Twitter Upload Media OAuth1] Initialized. Media ID: ${mediaId}`);
  
  // Step 2: Append media data (in chunks if needed)
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let segmentIndex = 0;
  
  for (let offset = 0; offset < imageBuffer.byteLength; offset += chunkSize) {
    const chunk = imageBuffer.slice(offset, Math.min(offset + chunkSize, imageBuffer.byteLength));
    
    // For FormData with OAuth 1.0a, we need to handle multipart differently
    // Twitter's API expects the OAuth signature in the Authorization header
    const formData = new FormData();
    formData.append('command', 'APPEND');
    formData.append('media_id', mediaId);
    formData.append('segment_index', segmentIndex.toString());
    formData.append('media', new Blob([chunk], { type: contentType }));
    
    // For multipart/form-data, OAuth 1.0a signature is calculated without the body
    // The parameters are in the form data, but we sign with empty body for multipart
    const appendParams = {
      command: 'APPEND',
      media_id: mediaId,
      segment_index: segmentIndex.toString(),
    };
    
    const { signature: appendSignature, timestamp: appendTimestamp, nonce: appendNonce } = generateOAuth1Signature(
      'POST',
      uploadUrl,
      appendParams,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );
    
    const appendResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': createOAuth1Header(consumerKey, token, appendSignature, appendTimestamp, appendNonce),
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });
    
    if (!appendResponse.ok) {
      const error = await appendResponse.json().catch(() => ({ error: 'Failed to append media chunk' }));
      throw new Error(error.error || 'Failed to append media chunk');
    }
    
    segmentIndex++;
  }
  
  // Step 3: Finalize media upload
  console.log(`[Twitter Upload Media OAuth1] Finalizing upload...`);
  const finalizeParams = {
    command: 'FINALIZE',
    media_id: mediaId,
  };
  
  const { signature: finalizeSignature, timestamp: finalizeTimestamp, nonce: finalizeNonce } = generateOAuth1Signature(
    'POST',
    uploadUrl,
    finalizeParams,
    consumerKey,
    consumerSecret,
    token,
    tokenSecret
  );
  
  const finalizeResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': createOAuth1Header(consumerKey, token, finalizeSignature, finalizeTimestamp, finalizeNonce),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(finalizeParams),
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
    console.error(`[Twitter Upload Media OAuth1] Finalize failed:`, errorMessage);
    throw new Error(errorMessage);
  }
  
  // Wait for processing to complete
  let processingInfo = await finalizeResponse.json();
  let attempts = 0;
  const maxAttempts = 15;
  console.log(`[Twitter Upload Media OAuth1] Processing state: ${processingInfo.processing_info?.state || 'none'}`);
  
  while (processingInfo.processing_info && processingInfo.processing_info.state === 'in_progress' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusParams = {
      command: 'STATUS',
      media_id: mediaId,
    };
    
    const statusUrl = `${uploadUrl}?command=STATUS&media_id=${mediaId}`;
    const { signature: statusSignature, timestamp: statusTimestamp, nonce: statusNonce } = generateOAuth1Signature(
      'GET',
      uploadUrl,
      statusParams,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );
    
    const statusResponse = await fetch(statusUrl, {
      headers: {
        'Authorization': createOAuth1Header(consumerKey, token, statusSignature, statusTimestamp, statusNonce),
      },
    });
    processingInfo = await statusResponse.json();
    attempts++;
    console.log(`[Twitter Upload Media OAuth1] Processing attempt ${attempts}/${maxAttempts}, state: ${processingInfo.processing_info?.state}`);
  }
  
  if (processingInfo.processing_info?.state === 'failed') {
    const errorMessage = processingInfo.processing_info.error?.message || 'Media processing failed';
    console.error(`[Twitter Upload Media OAuth1] Processing failed:`, errorMessage);
    throw new Error(`Media processing failed: ${errorMessage}`);
  }
  
  console.log(`[Twitter Upload Media OAuth1] Upload complete. Media ID: ${mediaId}`);
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

import { createHash, randomBytes, createHmac } from 'crypto';
import { URLSearchParams as NodeURLSearchParams } from 'url';

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

/**
 * OAuth 1.0a 3-legged flow functions
 */

/**
 * Step 1: Get OAuth 1.0a request token
 * Returns request token and request token secret
 */
export async function getOAuth1RequestToken(
  consumerKey: string,
  consumerSecret: string,
  callbackUrl: string
): Promise<{ oauth_token: string; oauth_token_secret: string; oauth_callback_confirmed: string }> {
  const url = 'https://api.twitter.com/oauth/request_token';
  
  // OAuth 1.0a parameters for request token
  const params: Record<string, string> = {
    oauth_callback: callbackUrl,
  };
  
  // OAuth 1.0a parameters for request token (callback is included in signature)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_callback: callbackUrl,
  };
  
  // Normalize parameters
  const normalizedParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');
  
  // Create signature base string
  const signatureBaseString = [
    'POST',
    encodeURIComponent(url),
    encodeURIComponent(normalizedParams)
  ].join('&');
  
  // Create signing key (no token secret yet)
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;
  
  // Generate signature
  const signature = createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
  
  // Create Authorization header
  const authParams = [
    `oauth_consumer_key="${encodeURIComponent(consumerKey)}"`,
    `oauth_signature_method="HMAC-SHA1"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_version="1.0"`,
    `oauth_callback="${encodeURIComponent(callbackUrl)}"`,
    `oauth_signature="${encodeURIComponent(signature)}"`,
  ].join(', ');
  
  const authHeader = `OAuth ${authParams}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get request token: ${response.status} ${errorText}`);
  }
  
  const responseText = await response.text();
  const tokenData: Record<string, string> = {};
  responseText.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    tokenData[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  
  return {
    oauth_token: tokenData.oauth_token,
    oauth_token_secret: tokenData.oauth_token_secret,
    oauth_callback_confirmed: tokenData.oauth_callback_confirmed,
  };
}

/**
 * Step 2: Get OAuth 1.0a authorization URL
 */
export function getOAuth1AuthUrl(requestToken: string): string {
  return `https://api.twitter.com/oauth/authorize?oauth_token=${encodeURIComponent(requestToken)}`;
}

/**
 * Step 3: Exchange request token for access token
 */
export async function exchangeOAuth1RequestTokenForAccessToken(
  consumerKey: string,
  consumerSecret: string,
  requestToken: string,
  requestTokenSecret: string,
  oauthVerifier: string
): Promise<{ oauth_token: string; oauth_token_secret: string; user_id: string; screen_name: string }> {
  const url = 'https://api.twitter.com/oauth/access_token';
  
  const params: Record<string, string> = {
    oauth_verifier: oauthVerifier,
  };
  
  const { signature, timestamp, nonce } = generateOAuth1Signature(
    'POST',
    url,
    params,
    consumerKey,
    consumerSecret,
    requestToken,
    requestTokenSecret
  );
  
  const authHeader = createOAuth1Header(consumerKey, requestToken, signature, timestamp, nonce);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: new URLSearchParams({ oauth_verifier: oauthVerifier }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange request token: ${response.status} ${errorText}`);
  }
  
  const responseText = await response.text();
  const tokenData: Record<string, string> = {};
  responseText.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    tokenData[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  
  return {
    oauth_token: tokenData.oauth_token,
    oauth_token_secret: tokenData.oauth_token_secret,
    user_id: tokenData.user_id,
    screen_name: tokenData.screen_name,
  };
}

