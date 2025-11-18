import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, getUserByClerkId } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { postTwitterThread } from '@/lib/twitter/api';

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
    const { tweets } = body;
    
    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tweets array' },
        { status: 400 }
      );
    }
    
    // Post the thread
    const results = await postTwitterThread(
      userWithToken.twitterAccessToken,
      tweets.map((t: any) => ({ text: t.text }))
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

