import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Admin endpoint to check Twitter token status for a user by email
 * 
 * Usage:
 * GET /api/admin/check-twitter-tokens?email=kunle2000@gmail.com
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        clerkId: true,
        twitterAccessToken: true,
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      );
    }
    
    const hasOAuth2 = !!user.twitterAccessToken;
    const hasOAuth1 = !!user.twitterOAuth1Token && !!user.twitterOAuth1TokenSecret;
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        clerkId: user.clerkId,
      },
      tokens: {
        oauth2: {
          connected: hasOAuth2,
          hasToken: hasOAuth2,
          tokenPreview: user.twitterAccessToken ? `${user.twitterAccessToken.substring(0, 20)}...` : null,
        },
        oauth1: {
          configured: hasOAuth1,
          hasToken: !!user.twitterOAuth1Token,
          hasSecret: !!user.twitterOAuth1TokenSecret,
          tokenPreview: user.twitterOAuth1Token ? `${user.twitterOAuth1Token.substring(0, 20)}...` : null,
          secretPreview: user.twitterOAuth1TokenSecret ? `${user.twitterOAuth1TokenSecret.substring(0, 20)}...` : null,
        },
      },
      capabilities: {
        canPostTweets: hasOAuth2,
        canUploadImages: hasOAuth1,
      },
      actionsNeeded: [
        ...(hasOAuth2 ? [] : ['Connect Twitter account (OAuth 2.0)']),
        ...(hasOAuth1 ? [] : ['Enable image upload (OAuth 1.0a)']),
      ],
    });
  } catch (error: any) {
    console.error('[Check Twitter Tokens] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check tokens' },
      { status: 500 }
    );
  }
}

