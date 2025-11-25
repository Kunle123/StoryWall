import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTwitterThread, uploadMediaOAuth1 } from '@/lib/twitter/api';

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    const userProfile = await getUserByClerkId(userId);
    
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
    const { tweets, imageUrl } = body;
    
    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tweets array' },
        { status: 400 }
      );
    }
    
    // Upload image if provided (for first tweet) - using OAuth 1.0a
    let mediaId: string | undefined;
    if (imageUrl && tweets.length > 0) {
      try {
        // Validate image URL is accessible before attempting upload
        console.log(`[Twitter Post Thread] Validating image URL: ${imageUrl}`);
        const imageCheckResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageCheckResponse.ok) {
          throw new Error(`Image URL not accessible: ${imageCheckResponse.status} ${imageCheckResponse.statusText}`);
        }
        
        const contentType = imageCheckResponse.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
        }
        
        console.log(`[Twitter Post Thread] Image URL validated. Content-Type: ${contentType}`);
        
        // Get OAuth 1.0a credentials for image upload
        const consumerKey = process.env.TWITTER_API_KEY;
        const consumerSecret = process.env.TWITTER_API_SECRET;
        
        // Check if OAuth 1.0a is configured
        if (!consumerKey || !consumerSecret) {
          throw new Error('Twitter OAuth 1.0a not configured (missing API key/secret)');
        }
        
        if (!userWithToken.twitterOAuth1Token || !userWithToken.twitterOAuth1TokenSecret) {
          throw new Error('OAuth 1.0a tokens not found. Please reconnect your Twitter account.');
        }
        
        // Log OAuth 1.0a credentials for debugging
        console.log('[Twitter Post Thread] OAuth 1.0a credentials for upload:');
        console.log('[Twitter Post Thread] Consumer Key (first 20 chars):', consumerKey.substring(0, 20));
        console.log('[Twitter Post Thread] Token (first 20 chars):', userWithToken.twitterOAuth1Token.substring(0, 20));
        console.log('[Twitter Post Thread] Token Secret (first 20 chars):', userWithToken.twitterOAuth1TokenSecret.substring(0, 20));
        
        console.log(`[Twitter Post Thread] Attempting to upload image using OAuth 1.0a: ${imageUrl}`);
        mediaId = await uploadMediaOAuth1(
          consumerKey,
          consumerSecret,
          userWithToken.twitterOAuth1Token,
          userWithToken.twitterOAuth1TokenSecret,
          imageUrl
        );
        console.log(`[Twitter Post Thread] Successfully uploaded image, media_id: ${mediaId}`);
        
        if (!mediaId) {
          throw new Error('Media upload succeeded but no media_id returned');
        }
      } catch (error: any) {
        console.error('[Twitter Post Thread] Failed to upload image:', error);
        console.error('[Twitter Post Thread] Error details:', error.message);
        
        // If it's a token permissions error, handle it specially
        if (error?.code === 'OAUTH1_TOKEN_PERMISSIONS_ERROR') {
          console.error('[Twitter Post Thread] Token permissions error detected - re-throwing to trigger automatic reconnection');
          throw error; // Re-throw to trigger automatic token clearing
        }
        
        // Check for OAuth 1.0a missing tokens
        if (error.message?.includes('OAuth 1.0a tokens not found')) {
          return NextResponse.json(
            { 
              error: 'OAuth 1.0a tokens missing',
              details: 'Image uploads require OAuth 1.0a authentication. Please reconnect your Twitter account.',
              requiresReconnection: true,
              code: 'OAUTH1_TOKENS_MISSING',
            },
            { status: 400 }
          );
        }
        
        // Return error instead of silently continuing - user should know image failed
        return NextResponse.json(
          { 
            error: 'Failed to upload image for tweet',
            details: error.message || 'Image upload failed. Please check the image URL is accessible.',
            continueWithoutImage: false
          },
          { status: 400 }
        );
      }
    } else {
      console.log('[Twitter Post Thread] No image URL provided or no tweets');
    }
    
    // Post the thread with image attached to first tweet
    const tweetsWithMedia = tweets.map((t: any, index: number) => ({
      text: t.text,
      mediaId: index === 0 ? mediaId : undefined, // Only attach to first tweet
    }));
    
    console.log(`[Twitter Post Thread] Posting thread with ${tweetsWithMedia.length} tweets`);
    if (mediaId) {
      console.log(`[Twitter Post Thread] First tweet will include image with media_id: ${mediaId}`);
    } else {
      console.log(`[Twitter Post Thread] No image will be attached to first tweet`);
    }
    
    const results = await postTwitterThread(
      userWithToken.twitterAccessToken,
      tweetsWithMedia
    );
    
    console.log(`[Twitter Post Thread] Successfully posted ${results.length} tweets`);
    if (results[0]?.tweetId) {
      console.log(`[Twitter Post Thread] First tweet ID: ${results[0].tweetId}`);
    }
    
    return NextResponse.json({
      success: true,
      tweetsPosted: results.length,
      firstTweetId: results[0]?.tweetId,
      lastTweetId: results[results.length - 1]?.tweetId,
      threadUrl: results[0]?.tweetId 
        ? `https://twitter.com/i/web/status/${results[0].tweetId}`
        : null,
      imageAttached: !!mediaId,
    });
  } catch (error: any) {
    console.error('[Twitter Post Thread] Error:', error);
    
    // Check if it's an OAuth 2.0 token invalid/expired error (401 Unauthorized)
    const isOAuth2Invalid = error.code === 'OAUTH2_TOKEN_INVALID' || 
                            error.status === 401 ||
                            (error.message && error.message.includes('OAuth 2.0 authentication failed'));
    
    if (isOAuth2Invalid && userId) {
      try {
        const user = await getOrCreateUser(userId);
        console.log('[Twitter Post Thread] OAuth 2.0 token invalid - clearing all Twitter tokens to force reconnection');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterAccessToken: null,
            twitterOAuth1Token: null,
            twitterOAuth1TokenSecret: null,
          },
        });
        console.log('[Twitter Post Thread] All Twitter tokens cleared - user will need to reconnect');
      } catch (clearError) {
        console.error('[Twitter Post Thread] Failed to clear tokens:', clearError);
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
                                   errorMessage.includes('don\'t have write permissions') ||
                                   error?.code === 'OAUTH1_TOKEN_PERMISSIONS_ERROR';
    
    // If it's a token permissions error, automatically clear OAuth 1.0a tokens
    if (isTokenPermissionError && userId) {
      try {
        const user = await getOrCreateUser(userId);
        console.log('[Twitter Post Thread] Token permissions error detected - clearing OAuth 1.0a tokens to force reconnection');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterOAuth1Token: null,
            twitterOAuth1TokenSecret: null,
          },
        });
        console.log('[Twitter Post Thread] OAuth 1.0a tokens cleared - user will need to reconnect');
      } catch (clearError) {
        console.error('[Twitter Post Thread] Failed to clear tokens:', clearError);
      }
      
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
    
    return NextResponse.json(
      { error: error.message || 'Failed to post Twitter thread' },
      { status: 500 }
    );
  }
}

