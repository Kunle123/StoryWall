import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/twitter/rate-limit-status
 * Check current Twitter API rate limit status
 * Makes a lightweight API call to get rate limit headers
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Get user's OAuth 2.0 token
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twitterAccessToken: true,
      },
    });

    if (!userWithToken?.twitterAccessToken) {
      return NextResponse.json(
        { error: 'Twitter not connected. Please connect your Twitter account first.' },
        { status: 400 }
      );
    }

    // Make a lightweight API call to get rate limit headers
    // Using GET /2/users/me endpoint (very lightweight, just returns user info)
    const response = await fetch('https://api.twitter.com/2/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userWithToken.twitterAccessToken}`,
      },
    });

    // Extract rate limit information from headers
    const rateLimitLimit = response.headers.get('x-rate-limit-limit');
    const rateLimitRemaining = response.headers.get('x-rate-limit-remaining');
    const rateLimitReset = response.headers.get('x-rate-limit-reset');

    // Calculate reset time if available
    let resetTime: string | null = null;
    let minutesUntilReset: number | null = null;
    let resetTimestamp: number | null = null;

    if (rateLimitReset) {
      resetTimestamp = parseInt(rateLimitReset, 10);
      const resetDate = new Date(resetTimestamp * 1000);
      resetTime = resetDate.toISOString();
      const now = new Date();
      minutesUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60));
    }

    return NextResponse.json({
      rateLimit: {
        limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : null,
        remaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : null,
        reset: rateLimitReset ? parseInt(rateLimitReset, 10) : null,
        resetTime,
        minutesUntilReset,
        resetTimestamp,
      },
      note: 'Rate limit information from Twitter API. Reset time is in UTC.',
    });
  } catch (error: any) {
    console.error('[Twitter Rate Limit Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check rate limit status' },
      { status: 500 }
    );
  }
}

