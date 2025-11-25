import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const user = await getOrCreateUser(userId);
    
    // Check if user has Twitter access tokens (both OAuth 2.0 and OAuth 1.0a)
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        twitterAccessToken: true,
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });
    
    const hasOAuth2 = !!userWithToken?.twitterAccessToken;
    const hasOAuth1 = !!userWithToken?.twitterOAuth1Token && !!userWithToken?.twitterOAuth1TokenSecret;
    
    console.log('[Twitter Status] User token status:', {
      userId: user.id,
      hasOAuth2,
      hasOAuth1,
      hasOAuth1Token: !!userWithToken?.twitterOAuth1Token,
      hasOAuth1TokenSecret: !!userWithToken?.twitterOAuth1TokenSecret,
    });
    
    return NextResponse.json({
      connected: hasOAuth2, // OAuth 2.0 is required for posting tweets
      hasOAuth1: hasOAuth1, // OAuth 1.0a is required for image uploads
      canUploadImages: hasOAuth1, // Can upload images if OAuth 1.0a tokens are present
    });
  } catch (error: any) {
    console.error('[Twitter Status] Error:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

