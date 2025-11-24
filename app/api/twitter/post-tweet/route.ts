import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTweet, uploadMedia, uploadMediaOAuth1 } from '@/lib/twitter/api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
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
    
    // Post the tweet with or without image
    console.log(`[Twitter Post Tweet] Posting tweet (${text.length} chars)${imageUrl ? ' with image' : ' without image'}`);
    const result = await postTweet(
      userWithToken.twitterAccessToken,
      text,
      undefined, // No reply
      undefined, // mediaId is now handled internally by postTweet
      consumerKey,
      consumerSecret,
      userWithToken.twitterOAuth1Token,
      userWithToken.twitterOAuth1TokenSecret,
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
    
    // Check if it's a rate limit error
    const isRateLimit = error.message?.includes('rate limit') || error.message?.includes('Too Many Requests');
    const statusCode = isRateLimit ? 429 : 500;
    
    return NextResponse.json(
      { error: error.message || 'Failed to post tweet' },
      { status: statusCode }
    );
  }
}

