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
  mediaIds?: string[]; // Media IDs attached to the tweet
}

/**
 * Percent encode according to RFC 3986 (OAuth 1.0a spec)
 * This is more strict than encodeURIComponent
 */
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
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

  // Step 2: Merge all parameters (OAuth params + form field params)
  const allParams = { ...oauthParams, ...params };
  
  // Step 3: Normalize parameters (sort and percent-encode)
  const normalizedParams = Object.keys(allParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join('&');

  // Step 4: Create signature base string
  // CRITICAL: URL must be normalized (no query params, no trailing slash)
  // For OAuth 1.0a, we use the base URL only
  const normalizedUrl = url.split('?')[0]; // Remove any query parameters
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(normalizedUrl),
    percentEncode(normalizedParams)
  ].join('&');

  // Step 5: Create signing key
  // CRITICAL: OAuth 1.0a signing key uses percent-encoded secrets per RFC 5849
  // Format: encoded_consumer_secret&encoded_token_secret
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Step 6: Generate signature
  const signature = createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  // Log signature details for debugging (INIT and APPEND steps)
  if (params.command === 'INIT' || params.command === 'APPEND') {
    console.log(`[${params.command} Debug] All params for signature:`, JSON.stringify(allParams, null, 2));
    console.log(`[${params.command} Debug] Normalized params string:`, normalizedParams);
    console.log(`[${params.command} Debug] Signature base string (FULL):`, signatureBaseString);
    console.log(`[${params.command} Debug] Signing key (masked):`, `${signingKey.substring(0, 10)}...&...${signingKey.substring(signingKey.length - 10)}`);
    console.log(`[${params.command} Debug] Generated signature (FULL):`, signature);
  }

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
  // Build OAuth params object (same structure as APPEND step for consistency)
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_signature: signature, // Already base64 encoded - don't percent-encode
  };
  
  // Only include oauth_token if we have one
  if (token) {
    oauthParams.oauth_token = token;
  }
  
  // Include callback if provided
  if (includeCallback && callbackUrl) {
    oauthParams.oauth_callback = callbackUrl;
  }

  // CRITICAL: Sort parameters alphabetically (OAuth 1.0a requirement)
  // CRITICAL: Signature value should NOT be percent-encoded (it's already base64)
  const sortedKeys = Object.keys(oauthParams).sort();
  return 'OAuth ' + sortedKeys
    .map(key => {
      const encodedKey = percentEncode(key);
      // Signature is already base64 encoded - don't percent-encode it again
      const encodedValue = key === 'oauth_signature' 
        ? oauthParams[key] 
        : percentEncode(oauthParams[key]);
      return `${encodedKey}="${encodedValue}"`;
    })
    .join(', ');
}

/**
 * Verify OAuth 1.0a token permissions by making a test API call
 * This helps diagnose if tokens have write permissions
 * TODO: Remove this verification step once token permissions issue is resolved
 */
export async function verifyOAuth1TokenPermissions(
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string
): Promise<{ authenticated: boolean; hasWritePermissions: boolean; error?: string }> {
  console.log(`[Twitter OAuth1 Verification] Testing token permissions...`);
  
  try {
    // Test 1: Verify credentials endpoint (requires authentication, not write permissions)
    const verifyUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    const verifyParams = {};
    
    const { signature: verifySignature, timestamp: verifyTimestamp, nonce: verifyNonce } = generateOAuth1Signature(
      'GET',
      verifyUrl,
      verifyParams,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );
    
    const verifyAuthHeader = createOAuth1Header(consumerKey, token, verifySignature, verifyTimestamp, verifyNonce);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': verifyAuthHeader,
      },
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      let errorDetails: any = {};
      try {
        errorDetails = JSON.parse(errorText);
      } catch {}
      
      console.error(`[Twitter OAuth1 Verification] Credentials verification failed:`, verifyResponse.status, errorDetails);
      
      if (verifyResponse.status === 401 || (errorDetails?.errors?.[0]?.code === 32 || errorDetails?.errors?.[0]?.code === 215)) {
        return {
          authenticated: false,
          hasWritePermissions: false,
          error: `Authentication failed (${verifyResponse.status}): ${errorDetails?.errors?.[0]?.message || 'Invalid credentials'}`,
        };
      }
      
      return {
        authenticated: false,
        hasWritePermissions: false,
        error: `Unexpected error (${verifyResponse.status}): ${errorText}`,
      };
    }
    
    const userData = await verifyResponse.json();
    console.log(`[Twitter OAuth1 Verification] ✅ Authentication successful. User: @${userData.screen_name}`);
    
    // Test 2: Try a minimal media upload INIT to test write permissions
    // We'll use a very small test to see if we get a permissions error
    const testUploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const testInitParams = {
      command: 'INIT',
      total_bytes: '1', // Minimal test
      media_type: 'image/jpeg',
    };
    
    const { signature: testSignature, timestamp: testTimestamp, nonce: testNonce } = generateOAuth1Signature(
      'POST',
      testUploadUrl,
      testInitParams,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );
    
    const testAuthHeader = createOAuth1Header(consumerKey, token, testSignature, testTimestamp, testNonce);
    
    const testResponse = await fetch(testUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': testAuthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(testInitParams),
    });
    
    if (!testResponse.ok) {
      const testErrorText = await testResponse.text();
      let testErrorDetails: any = {};
      try {
        testErrorDetails = JSON.parse(testErrorText);
      } catch {}
      
      if (testResponse.status === 400 && testErrorDetails?.errors?.[0]?.code === 215) {
        console.error(`[Twitter OAuth1 Verification] ❌ Write permissions test failed: Bad Authentication data (215)`);
        console.error(`[Twitter OAuth1 Verification] This indicates tokens don't have write permissions or are invalid`);
        return {
          authenticated: true, // Auth works, but write doesn't
          hasWritePermissions: false,
          error: `Tokens authenticated but lack write permissions (code 215). Regenerate tokens in Twitter Developer Portal.`,
        };
      }
      
      // Other errors might be expected (like invalid media), but 215 is the key one
      console.warn(`[Twitter OAuth1 Verification] Write test returned ${testResponse.status}, but may be expected:`, testErrorDetails);
      
      return {
        authenticated: true,
        hasWritePermissions: testResponse.status !== 400 || testErrorDetails?.errors?.[0]?.code !== 215,
      };
    } else {
      console.log(`[Twitter OAuth1 Verification] ✅ Write permissions test passed (media upload INIT succeeded)`);
      return {
        authenticated: true,
        hasWritePermissions: true,
      };
    }
  } catch (error: any) {
    console.error(`[Twitter OAuth1 Verification] Verification error:`, error);
    return {
      authenticated: false,
      hasWritePermissions: false,
      error: error.message || 'Verification failed',
    };
  }
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
  // CUSTODY CHAIN VERIFICATION: Log tokens received in uploadMediaOAuth1
  console.log('[Twitter Upload Media OAuth1] 🔐 CUSTODY CHAIN: Tokens received in uploadMediaOAuth1():');
  console.log('[Twitter Upload Media OAuth1] 🔐 Token (first 20):', token.substring(0, 20));
  console.log('[Twitter Upload Media OAuth1] 🔐 Token (full length):', token.length);
  console.log('[Twitter Upload Media OAuth1] 🔐 Token Secret (first 20):', tokenSecret.substring(0, 20));
  console.log('[Twitter Upload Media OAuth1] 🔐 Token Secret (full length):', tokenSecret.length);
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
  
  // TODO: Remove this verification step once token permissions issue is resolved
  // Verify token permissions before attempting upload (non-blocking - just for logging)
  // We'll let the actual upload attempt proceed and catch errors there
  try {
    const verification = await verifyOAuth1TokenPermissions(consumerKey, consumerSecret, token, tokenSecret);
    if (verification.authenticated && verification.hasWritePermissions) {
      console.log(`[Twitter Upload Media OAuth1] ✅ Token permissions verified - proceeding with upload`);
    } else {
      console.warn(`[Twitter Upload Media OAuth1] ⚠️  Verification warning: ${verification.error || 'Permissions check failed'}`);
      console.warn(`[Twitter Upload Media OAuth1] ⚠️  Proceeding with upload attempt anyway - will catch errors if permissions are missing`);
    }
  } catch (verifyError) {
    // Verification step failed, but continue with actual upload attempt
    // The actual upload will fail with the same error and trigger reconnection
    console.warn(`[Twitter Upload Media OAuth1] ⚠️  Verification step failed, but proceeding with upload:`, verifyError);
  }
  
  // Step 1: Initialize media upload with OAuth 1.0a
  console.log(`[Twitter Upload Media OAuth1] Initializing upload...`);
  const initParams = {
    command: 'INIT',
    total_bytes: imageBuffer.byteLength.toString(),
    media_type: contentType,
  };
  
  // Debug: Log consumer key and token to verify they match what was used during OAuth
  console.log(`[INIT Debug] Consumer Key (first 20 chars):`, consumerKey.substring(0, 20));
  console.log(`[INIT Debug] Consumer Key (full length):`, consumerKey.length);
  console.log(`[INIT Debug] Token (first 20 chars):`, token.substring(0, 20));
  console.log(`[INIT Debug] Token (full length):`, token.length);
  console.log(`[INIT Debug] Token Secret (first 20 chars):`, tokenSecret.substring(0, 20));
  console.log(`[INIT Debug] Token Secret (full length):`, tokenSecret.length);
  console.log(`[INIT Debug] Consumer Secret (first 10 chars):`, consumerSecret.substring(0, 10));
  console.log(`[INIT Debug] Consumer Secret (full length):`, consumerSecret.length);
  
  const { signature: initSignature, timestamp: initTimestamp, nonce: initNonce } = generateOAuth1Signature(
    'POST',
    uploadUrl,
    initParams,
    consumerKey,
    consumerSecret,
    token,
    tokenSecret
  );
  
  const initAuthHeader = createOAuth1Header(consumerKey, token, initSignature, initTimestamp, initNonce);
  
  // Debug logging for INIT step
  console.log(`[INIT Debug] OAuth params:`, JSON.stringify({ consumerKey: consumerKey.substring(0, 10) + '...', token: token ? token.substring(0, 10) + '...' : 'empty', timestamp: initTimestamp, nonce: initNonce.substring(0, 10) + '...' }));
  console.log(`[INIT Debug] Signature (first 20 chars):`, initSignature.substring(0, 20));
  console.log(`[INIT Debug] Auth header:`, initAuthHeader);
  console.log(`[INIT Debug] Form params:`, JSON.stringify(initParams));
  
  // Log the full request details for debugging
  console.log(`[INIT Debug] Request URL:`, uploadUrl);
  console.log(`[INIT Debug] Request method: POST`);
  console.log(`[INIT Debug] Content-Type: application/x-www-form-urlencoded`);
  console.log(`[INIT Debug] Body (URLSearchParams):`, new URLSearchParams(initParams).toString());
  
  const initResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': initAuthHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(initParams),
  });
  
  // Log response details for debugging
  console.log(`[INIT Debug] Response status:`, initResponse.status);
  console.log(`[INIT Debug] Response headers:`, Object.fromEntries(initResponse.headers.entries()));
  
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
    console.error(`[Twitter Upload Media OAuth1] Init failed:`, errorMessage);
    console.error(`[Twitter Upload Media OAuth1] Response status: ${initResponse.status}`);
    console.error(`[Twitter Upload Media OAuth1] Error details:`, errorDetails);
    console.error(`[Twitter Upload Media OAuth1] Full error text:`, errorText);
    
    // Provide more specific error message for "Bad Authentication data"
    if (errorMessage.includes('Bad Authentication') || (initResponse.status === 400 && errorDetails?.errors?.[0]?.code === 215)) {
      // Log detailed diagnostic information
      console.error(`[Twitter Upload Media OAuth1] Bad Authentication data (215) - Diagnostic Info:`);
      console.error(`  - Consumer Key: ${consumerKey.substring(0, 10)}... (length: ${consumerKey.length})`);
      console.error(`  - Consumer Secret: ${consumerSecret.substring(0, 10)}... (length: ${consumerSecret.length})`);
      console.error(`  - Token: ${token.substring(0, 20)}... (length: ${token.length})`);
      console.error(`  - Token Secret: ${tokenSecret.substring(0, 20)}... (length: ${tokenSecret.length})`);
      console.error(`  - Request URL: ${uploadUrl}`);
      console.error(`  - This error (215) typically means:`);
      console.error(`    1. Tokens don't have "Read and Write" permissions (most common)`);
      console.error(`    2. Tokens were generated before app was set to "Read and Write"`);
      console.error(`    3. Mismatch between consumer key/secret and token/secret`);
      console.error(`    4. App permissions changed but tokens weren't regenerated`);
      
      // Throw error with special code to trigger automatic token clearing and reconnection
      const error = new Error(
        `OAuth 1.0a authentication failed (400): Bad Authentication data (code 215). This usually means the access token/secret don't have "Read and Write" permissions. ` +
        `Even if your app has "Read and Write" permissions, tokens obtained through the OAuth flow may not have write access if they were generated before the app permissions were changed. ` +
        `SOLUTION: ` +
        `1. In Twitter Developer Portal, ensure "App permissions" is set to "Read and Write"` +
        `2. Go to "Keys and tokens" → "Authentication Tokens"` +
        `3. Regenerate the "Access Token and Secret" for your user (@Kunletweets)` +
        `4. Reconnect your Twitter account in StoryWall to get new tokens with write permissions. ` +
        `(Status: ${initResponse.status})`
      );
      (error as any).code = 'OAUTH1_TOKEN_PERMISSIONS_ERROR';
      throw error;
    }
    
    throw new Error(`${errorMessage} (Status: ${initResponse.status})`);
  }
  
  const initData = await initResponse.json();
  const mediaId = initData.media_id_string;
  console.log(`[Twitter Upload Media OAuth1] Initialized. Media ID: ${mediaId}`);
  
  // Step 2: Append media data (in chunks if needed)
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  let segmentIndex = 0;
  
  // Convert ArrayBuffer to Buffer once
  const imageBufferNode = Buffer.from(imageBuffer);
  console.log(`[Twitter Upload Media OAuth1] Image buffer size: ${imageBufferNode.length} bytes`);
  console.log(`[Twitter Upload Media OAuth1] First 10 bytes:`, imageBufferNode.slice(0, 10));
  
  for (let offset = 0; offset < imageBufferNode.length; offset += chunkSize) {
    const chunkEnd = Math.min(offset + chunkSize, imageBufferNode.length);
    const chunk = imageBufferNode.slice(offset, chunkEnd);
    
    // Form field parameters (included in signature)
    const appendParams = {
      command: 'APPEND',
      media_id: mediaId,
      segment_index: segmentIndex.toString(),
    };
    
    // Generate signature - this combines OAuth params + form field params internally
    const { signature: appendSignature, timestamp: appendTimestamp, nonce: appendNonce } = generateOAuth1Signature(
      'POST',
      uploadUrl,
      appendParams,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );
    
    // Build Authorization header manually (more explicit approach)
    // All OAuth parameters must be included and sorted alphabetically
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_token: token,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: appendTimestamp,
      oauth_nonce: appendNonce,
      oauth_version: '1.0',
      oauth_signature: appendSignature,
    };
    
    // Build Authorization header: OAuth + sorted, percent-encoded parameters
    // CRITICAL: Authorization header contains ONLY OAuth parameters (not form fields)
    // CRITICAL: Signature value should NOT be percent-encoded (it's already base64)
    // CRITICAL: All other values should be percent-encoded
    const sortedKeys = Object.keys(oauthParams).sort();
    const authHeader = 'OAuth ' + sortedKeys
      .map(key => {
        const encodedKey = percentEncode(key);
        // Signature is already base64 encoded - don't percent-encode it again
        const encodedValue = key === 'oauth_signature' 
          ? oauthParams[key] 
          : percentEncode(oauthParams[key]);
        return `${encodedKey}="${encodedValue}"`;
      })
      .join(', ');
    
    // Use form-data package for Node.js multipart/form-data (more reliable than native FormData)
    // This ensures proper multipart encoding that Twitter expects
    const FormDataNode = require('form-data');
    const formData = new FormDataNode();
    formData.append('command', 'APPEND');
    formData.append('media_id', mediaId);
    formData.append('segment_index', segmentIndex.toString());
    // Append Buffer directly with explicit options
    formData.append('media', chunk, {
      filename: 'blob',
      contentType: 'application/octet-stream',
    });
    
    // Log signature details for debugging
    console.log(`[APPEND Debug] Form field params:`, JSON.stringify(appendParams));
    console.log(`[APPEND Debug] All params for signature:`, JSON.stringify({ ...oauthParams, ...appendParams }, null, 2));
    console.log(`[APPEND Debug] Signature:`, appendSignature);
    console.log(`[APPEND Debug] Auth header:`, authHeader);
    console.log(`[APPEND Debug] Segment ${segmentIndex}, media_id: ${mediaId}`);
    console.log(`[APPEND Debug] Chunk size: ${chunk.length} bytes`);
    console.log(`[APPEND Debug] FormData keys:`, Array.from(formData.keys()));
    
    // form-data package sets Content-Type with boundary automatically
    // IMPORTANT: Do NOT manually set Content-Type - form-data will set it with the correct boundary
    // The OAuth signature is calculated WITHOUT the Content-Type header
    const appendResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        // form-data will set Content-Type with boundary - don't set it manually
        ...formData.getHeaders(), // This sets Content-Type with boundary
      },
      body: formData as any, // form-data is compatible with fetch body
    });
    
    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      let errorMessage = `Failed to append media chunk: ${appendResponse.status} ${appendResponse.statusText}`;
      let errorDetails: any = {};
      try {
        errorDetails = JSON.parse(errorText);
        errorMessage = errorDetails.error || errorDetails.errors?.[0]?.message || errorMessage;
        console.error(`[APPEND Error]`, errorDetails);
        console.error(`[APPEND Error] Error code:`, errorDetails.errors?.[0]?.code);
      } catch {
        console.error(`[APPEND Error] Non-JSON response:`, errorText);
        errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
      }
      console.error(`[APPEND Error] Response status: ${appendResponse.status}`);
      console.error(`[APPEND Error] Response headers:`, Object.fromEntries(appendResponse.headers.entries()));
      throw new Error(`APPEND failed: ${JSON.stringify(errorDetails)}`);
    }
    
    // Check for errors in successful response (Twitter sometimes returns 200 with errors)
    const appendResult = await appendResponse.json().catch(() => ({}));
    if (appendResult.errors) {
      console.error(`[APPEND Error] Response contains errors:`, appendResult);
      throw new Error(`APPEND failed: ${JSON.stringify(appendResult)}`);
    }
    
    console.log(`[APPEND] Segment ${segmentIndex} uploaded successfully (${chunk.length} bytes)`);
    
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
  mediaId?: string,
  consumerKey?: string,
  consumerSecret?: string,
  token?: string,
  tokenSecret?: string,
  imageUrl?: string
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
  
  // NEW LOGIC: Use OAuth 1.0a for image upload if credentials and URL are provided
  let uploadedMediaId = mediaId;
  if (imageUrl && consumerKey && consumerSecret && token && tokenSecret) {
    // CUSTODY CHAIN VERIFICATION: Log tokens received in postTweet function
    console.log('[Twitter Post Tweet] 🔐 CUSTODY CHAIN: Tokens received in postTweet() function:');
    console.log('[Twitter Post Tweet] 🔐 Token (first 20):', token.substring(0, 20));
    console.log('[Twitter Post Tweet] 🔐 Token (full length):', token.length);
    console.log('[Twitter Post Tweet] 🔐 Token Secret (first 20):', tokenSecret.substring(0, 20));
    console.log('[Twitter Post Tweet] 🔐 Token Secret (full length):', tokenSecret.length);
    
    try {
      uploadedMediaId = await uploadMediaOAuth1(consumerKey, consumerSecret, token, tokenSecret, imageUrl);
      if (uploadedMediaId) {
        body.media = {
          media_ids: [uploadedMediaId],
        };
        console.log(`[Twitter Post Tweet] Attaching media_id: ${uploadedMediaId} to tweet`);
      }
    } catch (error: any) {
      console.error('[Twitter Post Tweet] Image upload failed, posting tweet without image.', error);
      
      // If it's a token permissions error, re-throw it so the API route can handle automatic reconnection
      if (error?.code === 'OAUTH1_TOKEN_PERMISSIONS_ERROR') {
        console.error('[Twitter Post Tweet] Token permissions error detected - re-throwing to trigger automatic reconnection');
        throw error; // Re-throw to trigger automatic token clearing and reconnection
      }
      
      // For other errors, continue without image
      // Fallback to original mediaId if it was provided, otherwise it remains undefined
      uploadedMediaId = mediaId;
    }
  } else if (uploadedMediaId) {
    body.media = {
      media_ids: [uploadedMediaId],
    };
    console.log(`[Twitter Post Tweet] Attaching media_id: ${uploadedMediaId} to tweet`);
  }
  
  console.log(`[Twitter Post Tweet] Posting tweet (${text.length} chars)${uploadedMediaId ? ' with image' : ''}`);
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
      
      // Check for rate limit errors
      if (response.status === 429 || errorMessage.includes('Too Many Requests') || errorMessage.includes('rate limit')) {
        errorMessage = 'Twitter API rate limit exceeded. Please wait a few minutes and try again.';
      }
    } catch {
      // Use default error message
      if (response.status === 429) {
        errorMessage = 'Twitter API rate limit exceeded. Please wait a few minutes and try again.';
      }
    }
    console.error(`[Twitter Post Tweet] Failed (${response.status}):`, errorMessage);
    
    // Check for 401 Unauthorized - indicates OAuth 2.0 token is invalid or expired
    if (response.status === 401) {
      const authError = new Error('OAuth 2.0 authentication failed (401): Unauthorized. Your Twitter access token is invalid or expired. Please reconnect your Twitter account.');
      (authError as any).code = 'OAUTH2_TOKEN_INVALID';
      (authError as any).status = 401;
      throw authError;
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log(`[Twitter Post Tweet] Successfully posted. Tweet ID: ${data.data.id}`);
  
  return {
    tweetId: data.data.id,
    text: data.data.text,
    mediaIds: body.media?.media_ids || undefined,
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
  // CRITICAL: oauth_signature is already base64-encoded, do NOT percent-encode it
  const authParams = [
    `oauth_consumer_key="${encodeURIComponent(consumerKey)}"`,
    `oauth_signature_method="HMAC-SHA1"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_version="1.0"`,
    `oauth_callback="${encodeURIComponent(callbackUrl)}"`,
    `oauth_signature="${signature}"`, // Already base64-encoded - do NOT percent-encode
  ].join(', ');
  
  const authHeader = `OAuth ${authParams}`;
  
  console.log('[Twitter OAuth1 Request Token] 🔐 Callback URL being sent to Twitter:', callbackUrl);
  console.log('[Twitter OAuth1 Request Token] ⚠️  CRITICAL: This URL MUST match exactly what is in Twitter Developer Portal');
  console.log('[Twitter OAuth1 Request Token] ⚠️  CRITICAL: Check: Settings → User authentication settings → OAuth 1.0a → Callback URLs');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Twitter OAuth1 Request Token] ❌ Error response:', response.status, errorText);
    console.error('[Twitter OAuth1 Request Token] ❌ Callback URL that was sent:', callbackUrl);
    console.error('[Twitter OAuth1 Request Token] ❌ Verify this URL is in Developer Portal: Settings → User authentication settings → OAuth 1.0a → Callback URLs');
    throw new Error(`Failed to get request token: ${response.status} ${errorText}`);
  }
  
  const responseText = await response.text();
  const tokenData: Record<string, string> = {};
  responseText.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    tokenData[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  
  console.log('[Twitter OAuth1 Request Token] ✅ Request token obtained successfully');
  console.log('[Twitter OAuth1 Request Token] ✅ Callback confirmed:', tokenData.oauth_callback_confirmed);
  console.log('[Twitter OAuth1 Request Token] ✅ Token (first 20 chars):', tokenData.oauth_token?.substring(0, 20) || 'NULL');
  
  // Verify callback was confirmed
  if (tokenData.oauth_callback_confirmed !== 'true') {
    console.warn('[Twitter OAuth1 Request Token] ⚠️  WARNING: Callback not confirmed by Twitter. This may indicate a callback URL mismatch.');
  }
  
  return {
    oauth_token: tokenData.oauth_token,
    oauth_token_secret: tokenData.oauth_token_secret,
    oauth_callback_confirmed: tokenData.oauth_callback_confirmed,
  };
}

/**
 * Step 2: Get OAuth 1.0a authorization URL
 */
/**
 * Generate OAuth 1.0a authorization URL
 * Uses /oauth/authorize which shows the authorization screen
 * Note: OAuth 1.0a permissions are determined by app settings in Developer Portal, not by URL parameters
 */
export function getOAuth1AuthUrl(requestToken: string, forceReauth: boolean = true): string {
  // Use /oauth/authorize (standard) - permissions come from app settings
  // If forceReauth is true, we could add a parameter, but Twitter OAuth 1.0a doesn't support force parameter
  // The only way to force new tokens is to revoke app access first
  const baseUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${encodeURIComponent(requestToken)}`;
  
  // Note: Twitter OAuth 1.0a doesn't have a "force" parameter like OAuth 2.0
  // Permissions are determined by the app's settings in Developer Portal
  // If tokens don't have write permissions, the app settings need to be checked/regenerated
  return baseUrl;
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

