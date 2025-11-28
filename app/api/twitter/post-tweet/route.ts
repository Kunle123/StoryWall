import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTweet, uploadMediaOAuth1, refreshAccessToken } from '@/lib/twitter/api';
import { generateHashtags, addHashtagsToTweet } from '@/lib/utils/twitterThread';

/**
 * Helper function to get a valid access token, refreshing if necessary
 * Returns the access token and updates the database if refreshed
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const user = await getOrCreateUser(userId);
  
  const userWithTokens = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      twitterAccessToken: true,
      twitterRefreshToken: true,
    },
  });
  
  if (!userWithTokens?.twitterAccessToken) {
    throw new Error('Twitter not connected. Please connect your Twitter account first.');
  }
  
  // If we have a refresh token, we can refresh if needed
  // For now, return the access token - it will be refreshed on 401 error
  return userWithTokens.twitterAccessToken;
}

/**
 * Helper function to refresh and store new access token
 */
async function refreshAndStoreToken(userId: string): Promise<string> {
  const user = await getOrCreateUser(userId);
  
  const userWithTokens = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      twitterRefreshToken: true,
    },
  });
  
  if (!userWithTokens?.twitterRefreshToken) {
    throw new Error('No refresh token available. Please reconnect your Twitter account.');
  }
  
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Twitter OAuth 2.0 credentials not configured');
  }
  
  console.log('[Twitter Post Tweet] 🔄 Refreshing OAuth 2.0 access token...');
  const tokenData = await refreshAccessToken(clientId, clientSecret, userWithTokens.twitterRefreshToken);
  
  // Store the new tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twitterAccessToken: tokenData.access_token,
      twitterRefreshToken: tokenData.refresh_token, // Twitter may return a new refresh token
    },
  });
  
  console.log('[Twitter Post Tweet] ✅ Successfully refreshed and stored new access token');
  return tokenData.access_token;
}

export async function POST(request: NextRequest) {
  let userId: string | null = null; // Store userId for use in catch block
  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Get user's Twitter access tokens from database (both OAuth 2.0 and OAuth 1.0a)
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        twitterAccessToken: true,
        twitterRefreshToken: true,
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });
    
    // CUSTODY CHAIN VERIFICATION: Log tokens retrieved from database
    if (userWithToken?.twitterOAuth1Token) {
      console.log('[Twitter Post Tweet] 🔐 CUSTODY CHAIN: Tokens retrieved from database:');
      console.log('[Twitter Post Tweet] 🔐 Token (first 20):', userWithToken.twitterOAuth1Token.substring(0, 20));
      console.log('[Twitter Post Tweet] 🔐 Token (full length):', userWithToken.twitterOAuth1Token.length);
      console.log('[Twitter Post Tweet] 🔐 Token Secret (first 20):', userWithToken.twitterOAuth1TokenSecret?.substring(0, 20) || 'NULL');
      console.log('[Twitter Post Tweet] 🔐 Token Secret (full length):', userWithToken.twitterOAuth1TokenSecret?.length || 0);
    }
    
    if (!userWithToken?.twitterAccessToken) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your Twitter account first.' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { text, imageUrl: imageUrlFromBody, addHashtags: addHashtagsFromBody } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid tweet text' },
        { status: 400 }
      );
    }
    
    // Validate image URL if provided (fail fast if invalid)
    let imageUrl: string | undefined = imageUrlFromBody;
    if (imageUrl) {
      try {
        console.log(`[Twitter Post Tweet] Validating image URL: ${imageUrl}`);
        const imageCheckResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageCheckResponse.ok) {
          throw new Error(`Image URL not accessible: ${imageCheckResponse.status} ${imageCheckResponse.statusText}`);
        }
        
        const contentType = imageCheckResponse.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
        }
        
        console.log(`[Twitter Post Tweet] Image URL validated. Content-Type: ${contentType}`);
      } catch (error: any) {
        console.error('[Twitter Post Tweet] Image URL validation failed:', error);
        // Continue without image - post tweet text only
        imageUrl = undefined;
      }
    }
    
    // Get OAuth 1.0a credentials for image upload
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    // Log OAuth 1.0a status for debugging
    if (imageUrl) {
      const hasOAuth1Tokens = !!(userWithToken.twitterOAuth1Token && userWithToken.twitterOAuth1TokenSecret);
      const hasConsumerKeys = !!(consumerKey && consumerSecret);
      
      console.log('[Twitter Post Tweet] OAuth 1.0a status for image upload:');
      console.log('[Twitter Post Tweet] Consumer Key present:', hasConsumerKeys);
      console.log('[Twitter Post Tweet] OAuth 1.0a tokens present:', hasOAuth1Tokens);
      
      if (hasOAuth1Tokens && hasConsumerKeys) {
        console.log('[Twitter Post Tweet] OAuth 1.0a credentials for upload:');
        console.log('[Twitter Post Tweet] Consumer Key (first 20 chars):', consumerKey?.substring(0, 20) || 'MISSING');
        console.log('[Twitter Post Tweet] Consumer Key (full length):', consumerKey?.length || 0);
        console.log('[Twitter Post Tweet] Consumer Secret (first 10 chars):', consumerSecret?.substring(0, 10) || 'MISSING');
        console.log('[Twitter Post Tweet] Consumer Secret (full length):', consumerSecret?.length || 0);
        console.log('[Twitter Post Tweet] Token (first 20 chars):', userWithToken.twitterOAuth1Token?.substring(0, 20) || 'MISSING');
        console.log('[Twitter Post Tweet] Token (full length):', userWithToken.twitterOAuth1Token?.length || 0);
        console.log('[Twitter Post Tweet] Token Secret (first 20 chars):', userWithToken.twitterOAuth1TokenSecret?.substring(0, 20) || 'MISSING');
        console.log('[Twitter Post Tweet] Token Secret (full length):', userWithToken.twitterOAuth1TokenSecret?.length || 0);
        console.log('[Twitter Post Tweet] ⚠️  CRITICAL: These tokens MUST match the consumer key/secret used during OAuth 1.0a flow');
      } else {
        if (!hasConsumerKeys) {
          console.warn('[Twitter Post Tweet] ⚠️  OAuth 1.0a Consumer Key/Secret missing from environment variables');
        }
        if (!hasOAuth1Tokens) {
          console.warn('[Twitter Post Tweet] ⚠️  OAuth 1.0a tokens missing - user needs to complete OAuth 1.0a flow');
        }
      }
    }
    
    // Generate hashtags if requested
    let finalText = text;
    if (addHashtagsFromBody !== false) { // Default to true if not specified
      const hashtags = generateHashtags(text, 3);
      if (hashtags.length > 0) {
        finalText = addHashtagsToTweet(text, hashtags);
        console.log(`[Twitter Post Tweet] Added hashtags: ${hashtags.join(' ')}`);
      }
    }
    
    // Post the tweet with or without image
    console.log(`[Twitter Post Tweet] Posting tweet (${finalText.length} chars)${imageUrl ? ' with image' : ' without image'}`);
    
    // CUSTODY CHAIN VERIFICATION: Store full tokens from database for comparison
    const tokenToPass = userWithToken.twitterOAuth1Token || undefined;
    const tokenSecretToPass = userWithToken.twitterOAuth1TokenSecret || undefined;
    if (tokenToPass) {
      console.log('[Twitter Post Tweet] 🔐 CUSTODY CHAIN: Tokens retrieved from database:');
      console.log('[Twitter Post Tweet] 🔐 Token (FULL from DB):', tokenToPass);
      console.log('[Twitter Post Tweet] 🔐 Token (length):', tokenToPass.length);
      console.log('[Twitter Post Tweet] 🔐 Token Secret (FULL from DB):', tokenSecretToPass || 'NULL');
      console.log('[Twitter Post Tweet] 🔐 Token Secret (length):', tokenSecretToPass?.length || 0);
      
      console.log('[Twitter Post Tweet] 🔐 CUSTODY CHAIN: Tokens being passed to postTweet():');
      console.log('[Twitter Post Tweet] 🔐 Token (FULL being passed):', tokenToPass);
      console.log('[Twitter Post Tweet] 🔐 Token Secret (FULL being passed):', tokenSecretToPass || 'NULL');
    }
    
    // Try posting with retry logic for rate limits and auto-refresh for 401 errors
    let accessToken = userWithToken.twitterAccessToken;
    let result;
    let retryCount = 0;
    const maxRetries = 3;
    
    console.log(`[Twitter Post Tweet] 📊 STARTING POST ATTEMPT at ${new Date().toISOString()}`);
    console.log(`[Twitter Post Tweet] 📊 Retry count: ${retryCount}/${maxRetries}`);
    console.log(`[Twitter Post Tweet] 📊 This will make 1 API call to POST /2/tweets (media upload is separate)`);
    console.log(`[Twitter Post Tweet] 📊 IMPORTANT: POST /2/tweets has a per-user rate limit (not per-app)`);
    console.log(`[Twitter Post Tweet] 📊 Free tier: ~50-150 requests per 15 minutes per user`);
    console.log(`[Twitter Post Tweet] 📊 Paid tiers: 300+ requests per 15 minutes per user`);
    console.log(`[Twitter Post Tweet] 📊 Rate limits include failed attempts and are shared across all apps using your account`);
    
    // Check rate limit status before attempting (if possible)
    // Note: Twitter doesn't provide a way to check rate limits without making a call
    // But we can log this for diagnostics
    console.log(`[Twitter Post Tweet] 📊 DIAGNOSTIC: If you're hitting limits after waiting 30 minutes, possible causes:`);
    console.log(`[Twitter Post Tweet] 📊   1. Other apps/services using your Twitter account`);
    console.log(`[Twitter Post Tweet] 📊   2. Previous failed attempts still counting (rolling window)`);
    console.log(`[Twitter Post Tweet] 📊   3. Rate limit window is rolling (not fixed 15-min blocks)`);
    console.log(`[Twitter Post Tweet] 📊   4. Multiple retry attempts consuming quota`);
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[Twitter Post Tweet] 📊 Attempt ${retryCount + 1}: Calling postTweet() at ${new Date().toISOString()}`);
        result = await postTweet(
          accessToken,
          finalText,
          undefined, // No reply
          undefined, // mediaId is now handled internally by postTweet
          consumerKey,
          consumerSecret,
          tokenToPass,
          tokenSecretToPass,
          imageUrl
        );
        console.log(`[Twitter Post Tweet] 📊 Attempt ${retryCount + 1} SUCCESS at ${new Date().toISOString()}`);
        break; // Success, exit retry loop
      } catch (error: any) {
        console.log(`[Twitter Post Tweet] 📊 Attempt ${retryCount + 1} FAILED at ${new Date().toISOString()}`);
        console.log(`[Twitter Post Tweet] 📊 Error: ${error.message || 'Unknown error'}`);
        console.log(`[Twitter Post Tweet] 📊 Error code: ${error.code || 'none'}`);
        console.log(`[Twitter Post Tweet] 📊 Error status: ${error.status || 'none'}`);
        // Check if it's a 401 error and we have a refresh token
        if (error.status === 401 && error.code === 'OAUTH2_TOKEN_INVALID' && userWithToken.twitterRefreshToken) {
          if (retryCount === 0) {
            // First attempt failed with 401, try refreshing token
            console.log('[Twitter Post Tweet] 🔄 Access token expired, refreshing...');
            try {
              accessToken = await refreshAndStoreToken(user.id);
              retryCount++;
              continue; // Retry with new token
            } catch (refreshError: any) {
              console.error('[Twitter Post Tweet] Failed to refresh token:', refreshError);
              // If refresh fails, clear tokens and require reconnection
              if (refreshError.code === 'REFRESH_TOKEN_INVALID') {
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    twitterAccessToken: null,
                    twitterRefreshToken: null,
                    twitterOAuth1Token: null,
                    twitterOAuth1TokenSecret: null,
                  },
                });
                return NextResponse.json(
                  {
                    error: 'Your Twitter refresh token is invalid or expired. Please reconnect your Twitter account.',
                    code: 'REFRESH_TOKEN_INVALID',
                    requiresReconnection: true,
                    solution: '1. Click "Connect Twitter Account" to reconnect\n2. Authorize the app again to get fresh tokens',
                  },
                  { status: 401 }
                );
              }
              throw refreshError;
            }
          } else {
            // Already tried refreshing, token refresh didn't help
            throw error;
          }
        }
        
        // Check if it's a rate limit error (429) - retry only if wait time is reasonable
        if (error.status === 429 && error.code === 'RATE_LIMIT_EXCEEDED') {
          const rateLimitReset = (error as any).rateLimitReset;
          if (rateLimitReset) {
            const resetTime = new Date(rateLimitReset * 1000);
            const now = new Date();
            const waitTime = Math.max(0, resetTime.getTime() - now.getTime());
            const waitSeconds = Math.ceil(waitTime / 1000);
            
            // Only retry if wait time is less than 2 minutes (120 seconds) - reasonable for user to wait
            const MAX_WAIT_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
            if (waitTime > 0 && waitTime < MAX_WAIT_TIME && retryCount < maxRetries) {
              console.log(`[Twitter Post Tweet] ⏳ Rate limit exceeded. Waiting ${waitSeconds} seconds before retry ${retryCount + 1}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add 1 second buffer
              retryCount++;
              continue;
            } else {
              // Wait time is too long (more than 2 minutes) or max retries reached, return error immediately
              const minutesUntilReset = Math.ceil(waitSeconds / 60);
              console.log(`[Twitter Post Tweet] ⏳ Rate limit wait time too long (${waitSeconds}s / ${minutesUntilReset}min), returning error immediately`);
              // Create a more user-friendly error message
              const rateLimitError = new Error(
                `Twitter API rate limit exceeded. Rate limit resets in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}. Please try again later.`
              );
              (rateLimitError as any).code = 'RATE_LIMIT_EXCEEDED';
              (rateLimitError as any).status = 429;
              (rateLimitError as any).rateLimitReset = rateLimitReset;
              (rateLimitError as any).rateLimitResetTime = resetTime.toISOString();
              throw rateLimitError;
            }
          }
          // No reset time available, throw error immediately
          throw error;
        }
        
        // For other errors or max retries reached, throw
        throw error;
      }
    }
    
    if (!result) {
      throw new Error('Failed to post tweet after retries');
    }
    
    console.log(`[Twitter Post Tweet] Successfully posted. Tweet ID: ${result.tweetId}`);
    
    // Check if image was attached (result will indicate this)
    const imageAttached = result.mediaIds && result.mediaIds.length > 0;
    
    // Determine warning message if image was requested but not attached
    let warning: string | undefined;
    if (imageUrl && !imageAttached) {
      const oauth1Available = !!(consumerKey && consumerSecret && userWithToken.twitterOAuth1Token && userWithToken.twitterOAuth1TokenSecret);
      if (oauth1Available) {
        warning = 'Tweet posted successfully, but image could not be attached. OAuth 1.0a authentication failed - please check your OAuth 1.0a credentials and try reconnecting your Twitter account.';
      } else {
        warning = 'Tweet posted successfully, but image could not be attached. Twitter\'s media upload API requires OAuth 1.0a authentication. Please connect your Twitter account with OAuth 1.0a to enable image uploads.';
      }
    }
    
    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      tweetUrl: `https://twitter.com/i/web/status/${result.tweetId}`,
      imageAttached,
      warning,
    });
  } catch (error: any) {
    console.error('[Twitter Post Tweet] Error:', error);
    
    // Check if it's an OAuth 2.0 token invalid/expired error (401 Unauthorized)
    // This handles cases where refresh token is also invalid or missing
    const isOAuth2Invalid = error.code === 'OAUTH2_TOKEN_INVALID' || 
                            error.code === 'REFRESH_TOKEN_INVALID' ||
                            (error.status === 401 && !error.code);
    
    if (isOAuth2Invalid && userId) {
      try {
        const user = await getOrCreateUser(userId);
        console.log('[Twitter Post Tweet] OAuth 2.0 token invalid and refresh failed - clearing all Twitter tokens to force reconnection');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterAccessToken: null,
            twitterRefreshToken: null,
            twitterOAuth1Token: null,
            twitterOAuth1TokenSecret: null,
          },
        });
        console.log('[Twitter Post Tweet] All Twitter tokens cleared - user will need to reconnect');
      } catch (clearError) {
        console.error('[Twitter Post Tweet] Failed to clear tokens:', clearError);
      }
      
      return NextResponse.json(
        { 
          error: 'Your Twitter access token is invalid or expired. Please reconnect your Twitter account.',
          code: error.code || 'OAUTH2_TOKEN_INVALID',
          requiresReconnection: true,
          solution: '1. Click "Connect Twitter Account" to reconnect\n2. Authorize the app again to get fresh tokens',
        },
        { status: 401 }
      );
    }
    
    // Check if it's a token permissions error (Bad Authentication data - code 215)
    const errorMessage = error.message || '';
    const isTokenPermissionError = errorMessage.includes('Bad Authentication data') || 
                                   errorMessage.includes('code 215') ||
                                   errorMessage.includes('lack write permissions') ||
                                   errorMessage.includes('don\'t have write permissions');
    
    // If it's a token permissions error, automatically clear OAuth 1.0a tokens
    // This will force the user to reconnect and get fresh tokens with correct permissions
    if (isTokenPermissionError && userId) {
      try {
        const user = await getOrCreateUser(userId);
        console.log('[Twitter Post Tweet] Token permissions error detected - clearing OAuth 1.0a tokens to force reconnection');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterOAuth1Token: null,
            twitterOAuth1TokenSecret: null,
          },
        });
        console.log('[Twitter Post Tweet] OAuth 1.0a tokens cleared - user will need to reconnect');
      } catch (clearError) {
        console.error('[Twitter Post Tweet] Failed to clear tokens:', clearError);
      }
      
      // Return a special error code that the client can detect to trigger automatic reconnection
      // According to X Developer docs: "If a permission level is changed, any user tokens already
      // issued to that X app must be discarded and users must re-authorize the App in order for
      // the token to inherit the updated permissions." (https://docs.x.com/fundamentals/developer-apps#app-permissions)
      return NextResponse.json(
        { 
          error: 'Token permissions error - tokens cleared. Your tokens were issued before app permissions were set to "Read and write".',
          code: 'OAUTH1_TOKEN_PERMISSIONS_ERROR',
          requiresReconnection: true,
          note: 'According to X Developer docs, if app permissions changed, you must revoke app access in Twitter Settings → Security → Apps and sessions, then reconnect. See: https://docs.x.com/fundamentals/developer-apps#app-permissions',
          solution: '1. Verify app permissions are "Read and write" in Developer Portal\n2. Revoke app access: https://twitter.com/settings/apps\n3. Reconnect in StoryWall to get new tokens with correct permissions',
        },
        { status: 401 }
      );
    }
    
    // Check if it's a rate limit error
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests') || error.code === 'RATE_LIMIT_EXCEEDED';
    const statusCode = isRateLimit ? 429 : 500;
    
    // Include rate limit reset time in response if available
    const responseData: any = { error: error.message || 'Failed to post tweet' };
    if (isRateLimit && (error as any).rateLimitReset) {
      responseData.rateLimitReset = (error as any).rateLimitReset;
      responseData.rateLimitResetTime = (error as any).rateLimitResetTime;
      responseData.minutesUntilReset = Math.ceil(((error as any).rateLimitReset * 1000 - Date.now()) / (1000 * 60));
      responseData.isFreeTier = (error as any).isFreeTier || false;
      responseData.note = responseData.isFreeTier 
        ? 'Twitter FREE tier has strict rate limits (~50-150 requests per 15 minutes). Consider upgrading to Basic/Pro tier for higher limits (300+ requests per 15 min).'
        : 'Twitter POST /2/tweets has a per-user rate limit. This limit includes failed attempts and is separate from app-level limits. Wait 15 minutes or check for other apps using your Twitter account.';
    }
    
    return NextResponse.json(
      responseData,
      { status: statusCode }
    );
  }
}

