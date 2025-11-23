import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTweet, uploadMedia } from '@/lib/twitter/api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Get user's Twitter access token from database
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twitterAccessToken: true },
    });
    
    if (!userWithToken?.twitterAccessToken) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your Twitter account first.' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { text, imageUrl } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid tweet text' },
        { status: 400 }
      );
    }
    
    // Upload image if provided
    let mediaId: string | undefined;
    if (imageUrl) {
      try {
        // Validate image URL is accessible before attempting upload
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
        console.log(`[Twitter Post Tweet] Attempting to upload image: ${imageUrl}`);
        mediaId = await uploadMedia(userWithToken.twitterAccessToken, imageUrl);
        console.log(`[Twitter Post Tweet] Successfully uploaded image, media_id: ${mediaId}`);
        
        if (!mediaId) {
          throw new Error('Media upload succeeded but no media_id returned');
        }
      } catch (error: any) {
        console.error('[Twitter Post Tweet] Failed to upload image:', error);
        console.error('[Twitter Post Tweet] Error details:', error.message);
        
        // Check if it's a 403 error - likely authentication/permission issue
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          return NextResponse.json(
            { 
              error: 'Failed to upload image for tweet',
              details: 'Twitter API returned 403 Forbidden. This usually means:\n1. Your Twitter app needs "Read and write" permissions enabled\n2. The access token may not have the required scopes\n3. Please reconnect your Twitter account to refresh permissions',
              code: 'TWITTER_MEDIA_UPLOAD_FORBIDDEN',
            },
            { status: 403 }
          );
        }
        
        // Return error - user should know image failed
        return NextResponse.json(
          { 
            error: 'Failed to upload image for tweet',
            details: error.message || 'Image upload failed. Please check the image URL is accessible.',
          },
          { status: 400 }
        );
      }
    }
    
    // Post the tweet with image attached
    console.log(`[Twitter Post Tweet] Posting tweet (${text.length} chars)${mediaId ? ' with image' : ''}`);
    const result = await postTweet(
      userWithToken.twitterAccessToken,
      text,
      undefined, // No reply
      mediaId
    );
    
    console.log(`[Twitter Post Tweet] Successfully posted. Tweet ID: ${result.tweetId}`);
    
    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      tweetUrl: `https://twitter.com/i/web/status/${result.tweetId}`,
      imageAttached: !!mediaId,
    });
  } catch (error: any) {
    console.error('[Twitter Post Tweet] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post tweet' },
      { status: 500 }
    );
  }
}

