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
    
    // Check if user has Twitter access token
    // Note: You'll need to add twitter_access_token field to User model
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twitterAccessToken: true },
    });
    
    return NextResponse.json({
      connected: !!userWithToken?.twitterAccessToken,
    });
  } catch (error: any) {
    console.error('[Twitter Status] Error:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

