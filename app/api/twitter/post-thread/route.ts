import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTwitterThread, uploadMedia } from '@/lib/twitter/api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    const userProfile = await getUserByClerkId(userId);
    
    // Get user's Twitter access token from database
    // You'll need to add a twitter_access_token field to the User model
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
    const { tweets, imageUrl } = body;
    
    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tweets array' },
        { status: 400 }
      );
    }
    
    // Upload image if provided (for first tweet)
    let mediaId: string | undefined;
    if (imageUrl && tweets.length > 0) {
      try {
        console.log(`[Twitter Post Thread] Attempting to upload image: ${imageUrl}`);
        mediaId = await uploadMedia(userWithToken.twitterAccessToken, imageUrl);
        console.log(`[Twitter Post Thread] Successfully uploaded image, media_id: ${mediaId}`);
      } catch (error: any) {
        console.error('[Twitter Post Thread] Failed to upload image:', error);
        console.error('[Twitter Post Thread] Error details:', error.message);
        // Continue without image if upload fails, but log the error
      }
    } else {
      console.log('[Twitter Post Thread] No image URL provided or no tweets');
    }
    
    // Post the thread with image attached to first tweet
    const tweetsWithMedia = tweets.map((t: any, index: number) => ({
      text: t.text,
      mediaId: index === 0 ? mediaId : undefined, // Only attach to first tweet
    }));
    
    const results = await postTwitterThread(
      userWithToken.twitterAccessToken,
      tweetsWithMedia
    );
    
    return NextResponse.json({
      success: true,
      tweetsPosted: results.length,
      firstTweetId: results[0]?.tweetId,
      lastTweetId: results[results.length - 1]?.tweetId,
      threadUrl: results[0]?.tweetId 
        ? `https://twitter.com/i/web/status/${results[0].tweetId}`
        : null,
    });
  } catch (error: any) {
    console.error('[Twitter Post Thread] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post Twitter thread' },
      { status: 500 }
    );
  }
}

