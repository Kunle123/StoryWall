import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTweet, uploadMedia, uploadMediaOAuth1 } from '@/lib/twitter/api';

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
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });
    
    if (!userWithToken?.twitterAccessToken) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your Twitter account first.' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { text, imageUrl: imageUrlFromBody } = body;
    
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
        console.log('[Twitter Post Tweet] Token (first 20 chars):', userWithToken.twitterOAuth1Token?.substring(0, 20) || 'MISSING');
        console.log('[Twitter Post Tweet] Token Secret (first 20 chars):', userWithToken.twitterOAuth1TokenSecret?.substring(0, 20) || 'MISSING');
      } else {
        if (!hasConsumerKeys) {
          console.warn('[Twitter Post Tweet] ⚠️  OAuth 1.0a Consumer Key/Secret missing from environment variables');
        }
        if (!hasOAuth1Tokens) {
          console.warn('[Twitter Post Tweet] ⚠️  OAuth 1.0a tokens missing - user needs to complete OAuth 1.0a flow');
        }
      }
    }
    
    // Post the tweet with or without image
    console.log(`[Twitter Post Tweet] Posting tweet (${text.length} chars)${imageUrl ? ' with image' : ' without image'}`);
    const result = await postTweet(
      userWithToken.twitterAccessToken,
      text,
      undefined, // No reply
      undefined, // mediaId is now handled internally by postTweet
      consumerKey,
      consumerSecret,
      userWithToken.twitterOAuth1Token || undefined,
      userWithToken.twitterOAuth1TokenSecret || undefined,
      imageUrl
    );
    
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
    const isOAuth2Invalid = error.code === 'OAUTH2_TOKEN_INVALID' || 
                            error.status === 401 ||
                            (error.message && error.message.includes('OAuth 2.0 authentication failed'));
    
    if (isOAuth2Invalid && userId) {
      try {
        const user = await getOrCreateUser(userId);
        console.log('[Twitter Post Tweet] OAuth 2.0 token invalid - clearing all Twitter tokens to force reconnection');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterAccessToken: null,
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
          code: 'OAUTH2_TOKEN_INVALID',
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
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests');
    const statusCode = isRateLimit ? 429 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Failed to post tweet' },
      { status: statusCode }
    );
  }
}

